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
  const {
    data,
    error,
  } =
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

/**
 * Submit / resubmit a Creator communication.
 *
 * The database RPC performs the full workflow transaction:
 *
 * - validates Creator ownership
 * - prevents duplicate pending rows
 * - validates requested revisions were actually saved
 * - creates the Marketing pending approval action
 * - updates communication workflow state
 * - writes the central activity log
 *
 * Admin is intentionally NOT allowed to submit communications.
 */
export async function submitCommunicationForApproval({
  communicationId,
  comments,
}: {
  communicationId: string;
  comments?: string;
}): Promise<ApprovalActionRecord> {
  await requireCurrentUserRole([
    "creator",
  ]);

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "creator_submit_for_approval",
      {
        p_communication_id:
          communicationId,

        p_comments:
          comments?.trim() ||
          null,
      }
    );

  if (error) {
    console.error(
      "Submit approval RPC error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "Approval submission was not created."
    );
  }

  return data as ApprovalActionRecord;
}
