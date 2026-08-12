import { supabase } from "../../lib/supabase";

export type ApprovalStage =
  | "marketing_review"
  | "corpcom_review"
  | "approved";

export interface ApprovalActionRecord {
  id: string;
  communication_id: string;
  action: string;
  status: string;
  stage: ApprovalStage | string;
  actor_id?: string | null;
  submitted_by: string | null;
  reviewer_id: string | null;
  reviewer_role: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export async function getExistingPendingApproval(
  communicationId: string
): Promise<ApprovalActionRecord | null> {
  const { data, error } =
    await supabase
      .from("approval_actions")
      .select("*")
      .eq(
        "communication_id",
        communicationId
      )
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(
      "Check pending approval error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  return (
    data || null
  ) as ApprovalActionRecord | null;
}

export async function submitCommunicationForApproval({
  communicationId,
  comments,
}: {
  communicationId: string;
  comments?: string;
}): Promise<ApprovalActionRecord> {
  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth
      .getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  /**
   * First protect against accidental duplicate
   * submissions already waiting with a reviewer.
   */
  const existing =
    await getExistingPendingApproval(
      communicationId
    );

  if (existing) {
    return existing;
  }

  /**
   * Check whether this is a reviewer-requested
   * revision and, if so, verify the creator has
   * actually saved a change after the request.
   */
  const {
    data: communication,
    error: communicationError,
  } =
    await supabase
      .from("communications")
      .select(
        `
        id,
        revision_required,
        revision_requested_at,
        revision_completed_at,
        revision_count
        `
      )
      .eq(
        "id",
        communicationId
      )
      .single();

  if (
    communicationError ||
    !communication
  ) {
    throw new Error(
      communicationError?.message ||
        "Communication not found."
    );
  }

  const revisionRequired =
    Boolean(
      communication.revision_required
    );

  if (revisionRequired) {
    const requestedAt =
      communication.revision_requested_at
        ? new Date(
            communication.revision_requested_at
          ).getTime()
        : 0;

    const completedAt =
      communication.revision_completed_at
        ? new Date(
            communication.revision_completed_at
          ).getTime()
        : 0;

    if (
      !completedAt ||
      completedAt <= requestedAt
    ) {
      throw new Error(
        "Marketing/CorpCom has requested changes. Please make and save the requested changes before resubmitting."
      );
    }
  }

  const submittedAt =
    new Date().toISOString();

  const { data, error } =
    await supabase
      .from("approval_actions")
      .insert({
        communication_id:
          communicationId,

        action:
          "submitted",

        status:
          "pending",

        stage:
          "marketing_review",

        actor_id:
          user.id,

        submitted_by:
          user.id,

        reviewer_id:
          null,

        reviewer_role:
          "marketing_reviewer",

        comments:
          comments?.trim() ||
          null,
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "Submit approval error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  /**
   * If this submission follows requested changes,
   * record it explicitly for creator + reviewer UI.
   */
  if (revisionRequired) {
    const {
      error:
        revisionUpdateError,
    } =
      await supabase
        .from("communications")
        .update({
          revision_required:
            false,

          revision_resubmitted_at:
            submittedAt,

          revision_count:
            Number(
              communication.revision_count ||
                0
            ) + 1,

          status:
            "pending_approval",
        })
        .eq(
          "id",
          communicationId
        );

    if (
      revisionUpdateError
    ) {
      throw new Error(
        revisionUpdateError.message
      );
    }
  }

  return data as ApprovalActionRecord;
}
