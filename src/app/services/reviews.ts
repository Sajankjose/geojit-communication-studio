import { supabase } from "../../lib/supabase";

export interface ReviewQueueItem {
  approval_action_id: string;
  communication_id: string;
  action: string;
  status: string;
  stage: string;
  reviewer_role: string | null;
  comments: string | null;
  created_at: string;
  communication: {
    id: string;
    title: string;
    category: string | null;
    subcategory: string | null;
    audience: string | null;
    status: string;
    selected_variant_id: string | null;
    updated_at: string;
  } | null;
}

export async function getReviewerQueue(
  reviewerRole:
    | "marketing_reviewer"
    | "corpcom_reviewer"
): Promise<ReviewQueueItem[]> {
  const stage =
    reviewerRole === "marketing_reviewer"
      ? "marketing_review"
      : "corpcom_review";

  const { data, error } = await supabase
    .from("approval_actions")
    .select(`
      id,
      communication_id,
      action,
      status,
      stage,
      reviewer_role,
      comments,
      created_at,
      communication:communications (
        id,
        title,
        category,
        subcategory,
        audience,
        status,
        selected_variant_id,
        updated_at
      )
    `)
    .eq("stage", stage)
    .eq("status", "pending")
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(
    (row: any) => ({
      approval_action_id: row.id,
      communication_id: row.communication_id,
      action: row.action,
      status: row.status,
      stage: row.stage,
      reviewer_role: row.reviewer_role,
      comments: row.comments,
      created_at: row.created_at,
      communication: row.communication || null,
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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const { error: closeError } = await supabase
    .from("approval_actions")
    .update({
      status:
        decision === "approved"
          ? "completed"
          : decision,
      action: decision,
      actor_id: user.id,
      reviewer_id: user.id,
      reviewer_role: reviewerRole,
      comments: comments?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", approvalActionId);

  if (closeError) {
    throw new Error(closeError.message);
  }

  if (decision === "changes_requested") {
    const { error } = await supabase
      .from("communications")
      .update({
        status: "changes_requested",
      })
      .eq("id", communicationId);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  if (decision === "rejected") {
    const { error } = await supabase
      .from("communications")
      .update({
        status: "rejected",
      })
      .eq("id", communicationId);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  if (
    reviewerRole ===
    "marketing_reviewer"
  ) {
    const { error: nextError } =
      await supabase
        .from("approval_actions")
        .insert({
          communication_id:
            communicationId,
          action: "submitted",
          status: "pending",
          stage: "corpcom_review",
          actor_id: user.id,
          submitted_by: user.id,
          reviewer_id: null,
          reviewer_role:
            "corpcom_reviewer",
          comments:
            comments?.trim() || null,
        });

    if (nextError) {
      throw new Error(
        nextError.message
      );
    }

    const { error: statusError } =
      await supabase
        .from("communications")
        .update({
          status: "corpcom_review",
        })
        .eq("id", communicationId);

    if (statusError) {
      throw new Error(
        statusError.message
      );
    }

    return;
  }

  const { error: finalError } =
    await supabase
      .from("communications")
      .update({
        status: "approved",
      })
      .eq("id", communicationId);

  if (finalError) {
    throw new Error(
      finalError.message
    );
  }
}
