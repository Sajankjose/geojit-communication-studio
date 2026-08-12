import { supabase } from "../../lib/supabase";
import { requireCurrentUserRole } from "./requireRole";

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
      .eq(
        "status",
        "pending"
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
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
    user,
  } =
    await requireCurrentUserRole([
      "creator",
      "admin",
    ]);

  /**
   * Prevent duplicate pending review rows.
   */
  const existing =
    await getExistingPendingApproval(
      communicationId
    );

  if (existing) {
    return existing;
  }

  /**
   * Load revision state.
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
        revision_resubmitted_at,
        revision_count,
        latest_review_comment
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

  /**
   * A creator may resubmit only after a real
   * revision has been saved after the reviewer
   * requested changes.
   */
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
        "A reviewer has requested changes. Please make and save the requested changes before resubmitting."
      );
    }
  }

  const submittedAt =
    new Date().toISOString();

  /**
   * This is the key UX/audit distinction:
   *
   * First submission  → submitted
   * Revised submission → resubmitted
   */
  const approvalAction =
    revisionRequired
      ? "resubmitted"
      : "submitted";

  const cleanComment =
    comments?.trim() ||
    null;

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "approval_actions"
      )
      .insert({
        communication_id:
          communicationId,

        action:
          approvalAction,

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
          cleanComment,
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
   * Persist a platform-wide revision state.
   *
   * Keep revision_resubmitted_at after this point.
   * Dashboard / Review Queue / Full Preview can use
   * it to communicate that this is a revised copy.
   */
  if (revisionRequired) {
    const {
      error:
        revisionUpdateError,
    } =
      await supabase
        .from(
          "communications"
        )
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
