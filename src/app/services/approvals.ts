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
  const { data, error } = await supabase
    .from("approval_actions")
    .select("*")
    .eq("communication_id", communicationId)
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

    throw new Error(error.message);
  }

  return (data ||
    null) as ApprovalActionRecord | null;
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
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  /**
   * Prevent accidental duplicate submissions.
   */
  const existing =
    await getExistingPendingApproval(
      communicationId
    );

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
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
    comments?.trim() || null,
})
    .select("*")
    .single();

  if (error) {
    console.error(
      "Submit approval error:",
      error
    );

    throw new Error(error.message);
  }

  return data as ApprovalActionRecord;
}
