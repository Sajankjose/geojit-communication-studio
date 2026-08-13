import { supabase } from "../../lib/supabase";

export interface ApprovalHistoryItem {
  id: string;
  communication_id: string;
  action: string;
  status: string;
  stage: string;

  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  actor_designation?: string | null;
  actor_department?: string | null;

  submitted_by?: string | null;
  reviewer_id?: string | null;
  reviewer_role?: string | null;

  comments?: string | null;
  comment?: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Return the complete workflow audit trail for one communication.
 *
 * This is intentionally loaded through a restricted Supabase RPC
 * instead of querying approval_actions directly. That gives:
 *
 * - Creator: complete history for communications they own.
 * - Marketing reviewer: history for Marketing workflow items.
 * - CorpCom reviewer: history for CorpCom workflow items.
 * - Admin: complete history for all communications.
 *
 * The RPC also resolves the actor's display identity without opening
 * the profiles table broadly through RLS.
 */
export async function getApprovalHistory(
  communicationId: string
): Promise<ApprovalHistoryItem[]> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_communication_audit",
      {
        p_communication_id:
          communicationId,
      }
    );

  if (error) {
    console.error(
      "Approval audit history error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  return (
    data || []
  ) as ApprovalHistoryItem[];
}
