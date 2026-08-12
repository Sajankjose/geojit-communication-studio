import { supabase } from "../../lib/supabase";
import { requireCurrentUserRole } from "./requireRole";

export interface ReviewPerson {
  id: string;
  full_name: string | null;
  designation: string | null;
  department: string | null;
  role: string | null;
}

export interface ReviewQueueItem {
  approval_action_id: string;
  communication_id: string;
  action: string;
  status: string;
  stage: string;
  submitted_by: string | null;
  reviewer_role: string | null;
  comments: string | null;
  created_at: string;

  communication: {
    id: string;
    title: string;
    category: string | null;
    subcategory: string | null;
    audience: string | null;
    objective: string | null;
    status: string;
    created_by: string | null;
    selected_variant_id: string | null;
    input_data: Record<string, any> | null;
    updated_at: string;

    revision_required: boolean;
    revision_requested_at: string | null;
    revision_completed_at: string | null;
    revision_resubmitted_at: string | null;
    revision_count: number;
    latest_review_comment: string | null;
  } | null;

  /**
   * Person who originally created the communication.
   * For the first Marketing submission this will
   * normally be the same as stage_submitter.
   */
  original_submitter: ReviewPerson | null;

  /**
   * Person who sent the communication into the
   * CURRENT review stage.
   *
   * Marketing stage -> Creator
   * CorpCom stage   -> Marketing reviewer
   */
  stage_submitter: ReviewPerson | null;

  is_resubmission: boolean;
}

export async function getReviewerQueue(
  reviewerRole:
    | "marketing_reviewer"
    | "corpcom_reviewer"
): Promise<ReviewQueueItem[]> {
  const {
    role: actualRole,
  } =
    await requireCurrentUserRole([
      "marketing_reviewer",
      "corpcom_reviewer",
    ]);

  if (
    actualRole !== reviewerRole
  ) {
    throw new Error(
      "Reviewer role mismatch. Access denied."
    );
  }

  const stage =
    reviewerRole ===
    "marketing_reviewer"
      ? "marketing_review"
      : "corpcom_review";

  const {
    data,
    error,
  } =
    await supabase
      .from("approval_actions")
      .select(
        `
        id,
        communication_id,
        action,
        status,
        stage,
        submitted_by,
        reviewer_role,
        comments,
        created_at,
        communication:communications (
          id,
          title,
          category,
          subcategory,
          audience,
          objective,
          status,
          created_by,
          selected_variant_id,
          input_data,
          updated_at,
          revision_required,
          revision_requested_at,
          revision_completed_at,
          revision_resubmitted_at,
          revision_count,
          latest_review_comment
        )
        `
      )
      .eq("stage", stage)
      .eq("status", "pending")
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw new Error(
      error.message
    );
  }

  const rows =
    (data || []) as any[];

  /**
   * Collect only the profile IDs required to render
   * the current review queue.
   */
  const profileIds =
    Array.from(
      new Set(
        rows
          .flatMap((row) => [
            row.submitted_by,
            row.communication
              ?.created_by,
          ])
          .filter(Boolean)
      )
    ) as string[];

  const profileMap =
    new Map<
      string,
      ReviewPerson
    >();

  if (
    profileIds.length >
    0
  ) {
    const {
      data: profiles,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          designation,
          department,
          role
          `
        )
        .in(
          "id",
          profileIds
        );

    if (profileError) {
      console.error(
        "Unable to load submitter profiles:",
        profileError
      );

      throw new Error(
        "Unable to load submitter details for the review queue."
      );
    }

    for (
      const profile of
      profiles || []
    ) {
      profileMap.set(
        profile.id,
        profile as ReviewPerson
      );
    }
  }

  return rows.map(
    (row: any) => ({
      approval_action_id:
        row.id,

      communication_id:
        row.communication_id,

      action:
        row.action,

      status:
        row.status,

      stage:
        row.stage,

      submitted_by:
        row.submitted_by,

      reviewer_role:
        row.reviewer_role,

      comments:
        row.comments,

      created_at:
        row.created_at,

      communication:
        row.communication ||
        null,

      original_submitter:
        row.communication
          ?.created_by
          ? profileMap.get(
              row.communication
                .created_by
            ) || null
          : null,

      stage_submitter:
        row.submitted_by
          ? profileMap.get(
              row.submitted_by
            ) || null
          : null,

      is_resubmission:
        row.action ===
          "resubmitted" ||
        Boolean(
          row.communication
            ?.revision_resubmitted_at
        ),
    })
  ) as ReviewQueueItem[];
}

export async function submitReviewerDecision({
  approvalActionId,
  communicationId,
  decision,
  comments,
  reviewerRole,
}: {
  approvalActionId: string;
  communicationId: string;
  decision:
    | "approved"
    | "changes_requested"
    | "rejected";
  comments?: string;
  reviewerRole:
    | "marketing_reviewer"
    | "corpcom_reviewer";
}) {
  const {
    user,
    role: actualRole,
  } =
    await requireCurrentUserRole([
      "marketing_reviewer",
      "corpcom_reviewer",
    ]);

  if (
    actualRole !== reviewerRole
  ) {
    throw new Error(
      "Reviewer role mismatch. Access denied."
    );
  }

  const now =
    new Date().toISOString();

  const cleanComment =
    comments?.trim() ||
    null;

  const {
    data: closedAction,
    error: closeError,
  } =
    await supabase
      .from("approval_actions")
      .update({
        status:
          decision ===
          "approved"
            ? "completed"
            : decision,

        action: decision,

        actor_id:
          user.id,

        reviewer_id:
          user.id,

        reviewer_role:
          reviewerRole,

        comments:
          cleanComment,

        updated_at:
          now,
      })
      .eq(
        "id",
        approvalActionId
      )
      .eq(
        "communication_id",
        communicationId
      )
      .eq(
        "status",
        "pending"
      )
      .select(
        "id, stage, action, status"
      )
      .single();

  if (
    closeError ||
    !closedAction
  ) {
    throw new Error(
      closeError?.message ||
        "The pending review action could not be updated."
    );
  }

  if (
    decision ===
    "changes_requested"
  ) {
    const {
      error,
    } =
      await supabase
        .from("communications")
        .update({
          status:
            "changes_requested",

          revision_required:
            true,

          revision_requested_at:
            now,

          revision_completed_at:
            null,

          revision_resubmitted_at:
            null,

          latest_review_comment:
            cleanComment,
        })
        .eq(
          "id",
          communicationId
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    return;
  }

  if (
    decision ===
    "rejected"
  ) {
    const {
      error,
    } =
      await supabase
        .from("communications")
        .update({
          status:
            "rejected",

          revision_required:
            false,

          latest_review_comment:
            cleanComment,
        })
        .eq(
          "id",
          communicationId
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    return;
  }

  /**
   * Marketing approval creates the CorpCom handoff.
   * submitted_by is intentionally the Marketing
   * reviewer here, so CorpCom can see who sent it
   * to their stage. original_submitter remains
   * available through communications.created_by.
   */
  if (
    reviewerRole ===
    "marketing_reviewer"
  ) {
    const {
      error: nextError,
    } =
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
            "corpcom_review",

          actor_id:
            user.id,

          submitted_by:
            user.id,

          reviewer_id:
            null,

          reviewer_role:
            "corpcom_reviewer",

          comments:
            cleanComment,
        });

    if (nextError) {
      throw new Error(
        nextError.message
      );
    }

    const {
      data:
        updatedCommunication,
      error:
        statusError,
    } =
      await supabase
        .from("communications")
        .update({
          status:
            "corpcom_review",
        })
        .eq(
          "id",
          communicationId
        )
        .select(
          "id, status"
        )
        .single();

    if (
      statusError ||
      updatedCommunication
        ?.status !==
        "corpcom_review"
    ) {
      throw new Error(
        statusError?.message ||
          "Communication did not move to CorpCom review."
      );
    }

    return;
  }

  const {
    data:
      finalCommunication,
    error:
      finalError,
  } =
    await supabase
      .from("communications")
      .update({
        status:
          "approved",

        revision_required:
          false,
      })
      .eq(
        "id",
        communicationId
      )
      .select(
        "id, status"
      )
      .single();

  if (
    finalError ||
    finalCommunication
      ?.status !==
      "approved"
  ) {
    throw new Error(
      finalError?.message ||
        "Final CorpCom approval was not saved correctly."
    );
  }
}
