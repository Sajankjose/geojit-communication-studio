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

  original_submitter: ReviewPerson | null;
  stage_submitter: ReviewPerson | null;
  is_resubmission: boolean;
}

export interface ReviewerActivityItem {
  approval_action_id: string;
  communication_id: string;
  title: string;
  category: string | null;
  audience: string | null;
  communication_status: string;
  selected_variant_id: string | null;
  stage: string;
  action: string;
  action_status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
  original_creator_id: string | null;
  original_creator_name: string | null;
}

export async function getReviewerQueue(
  reviewerRole:
    | "marketing_reviewer"
    | "corpcom_reviewer"
): Promise<ReviewQueueItem[]> {
  const { role: actualRole } =
    await requireCurrentUserRole([
      "marketing_reviewer",
      "corpcom_reviewer",
    ]);

  if (actualRole !== reviewerRole) {
    throw new Error(
      "Reviewer role mismatch. Access denied."
    );
  }

  const stage =
    reviewerRole === "marketing_reviewer"
      ? "marketing_review"
      : "corpcom_review";

  const { data, error } =
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
    throw new Error(error.message);
  }

  const rows =
    (data || []) as any[];

  const profileIds =
    Array.from(
      new Set(
        rows
          .flatMap((row) => [
            row.submitted_by,
            row.communication?.created_by,
          ])
          .filter(Boolean)
      )
    ) as string[];

  const profileMap =
    new Map<string, ReviewPerson>();

  if (profileIds.length > 0) {
    /**
     * Prefer restricted RPC when installed.
     * Fall back to profiles SELECT only for older environments.
     */
    const rpcResult =
      await supabase.rpc(
        "get_review_people",
        {
          p_user_ids: profileIds,
        }
      );

    if (!rpcResult.error) {
      for (
        const profile of
        rpcResult.data || []
      ) {
        profileMap.set(
          profile.id,
          profile as ReviewPerson
        );
      }
    } else {
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
          .in("id", profileIds);

      if (profileError) {
        console.error(
          "Unable to load submitter profiles:",
          profileError
        );
      } else {
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
        row.communication || null,

      original_submitter:
        row.communication?.created_by
          ? profileMap.get(
              row.communication.created_by
            ) || null
          : null,

      stage_submitter:
        row.submitted_by
          ? profileMap.get(
              row.submitted_by
            ) || null
          : null,

      is_resubmission:
        row.action === "resubmitted" ||
        Boolean(
          row.communication
            ?.revision_resubmitted_at
        ),
    })
  ) as ReviewQueueItem[];
}

export async function getReviewerActivity(
  limit = 50
): Promise<ReviewerActivityItem[]> {
  await requireCurrentUserRole([
    "marketing_reviewer",
    "corpcom_reviewer",
  ]);

  const { data, error } =
    await supabase.rpc(
      "get_my_review_activity",
      {
        p_limit: limit,
      }
    );

  if (error) {
    console.error(
      "Reviewer activity error:",
      error
    );

    throw new Error(error.message);
  }

  return (
    data || []
  ) as ReviewerActivityItem[];
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
    role: actualRole,
  } =
    await requireCurrentUserRole([
      "marketing_reviewer",
      "corpcom_reviewer",
    ]);

  if (actualRole !== reviewerRole) {
    throw new Error(
      "Reviewer role mismatch. Access denied."
    );
  }

  const cleanComment =
    comments?.trim() || null;

  /**
   * Marketing approval:
   * Marketing completed -> communication moves ->
   * CorpCom pending row created atomically.
   */
  if (
    reviewerRole ===
      "marketing_reviewer" &&
    decision === "approved"
  ) {
    const { error } =
      await supabase.rpc(
        "marketing_send_to_corpcom",
        {
          p_approval_action_id:
            approvalActionId,
          p_communication_id:
            communicationId,
          p_comments:
            cleanComment,
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  /**
   * CorpCom final approval:
   * CorpCom action + final communication state
   * are written in one transaction.
   */
  if (
    reviewerRole ===
      "corpcom_reviewer" &&
    decision === "approved"
  ) {
    const { error } =
      await supabase.rpc(
        "corpcom_final_approve",
        {
          p_approval_action_id:
            approvalActionId,
          p_communication_id:
            communicationId,
          p_comments:
            cleanComment,
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  /**
   * Request Changes / Reject:
   * both reviewer roles use the atomic RPC.
   * This eliminates direct browser UPDATEs on
   * communications that were being blocked by RLS.
   */
  if (
    decision ===
      "changes_requested" ||
    decision === "rejected"
  ) {
    if (!cleanComment) {
      throw new Error(
        "A reviewer comment is required."
      );
    }

    const { error } =
      await supabase.rpc(
        "reviewer_return_or_reject",
        {
          p_approval_action_id:
            approvalActionId,
          p_communication_id:
            communicationId,
          p_decision:
            decision,
          p_comments:
            cleanComment,
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  throw new Error(
    "Unsupported reviewer decision."
  );
}
