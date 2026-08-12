import { supabase } from "../../lib/supabase";

export interface ApprovalHistoryItem {
  id: string;
  communication_id: string;
  action: string;
  status: string;
  stage: string;
  actor_id?: string | null;
  submitted_by?: string | null;
  reviewer_id?: string | null;
  reviewer_role?: string | null;
  comments?: string | null;
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Return the COMPLETE approval audit trail.
 *
 * Deliberately do not filter by status/action/stage:
 * completed Marketing and CorpCom decisions must
 * remain visible after the workflow moves forward.
 */
export async function getApprovalHistory(
  communicationId: string
): Promise<ApprovalHistoryItem[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "approval_actions"
      )
      .select(
        `
        id,
        communication_id,
        action,
        status,
        stage,
        actor_id,
        submitted_by,
        reviewer_id,
        reviewer_role,
        comments,
        created_at,
        updated_at
        `
      )
      .eq(
        "communication_id",
        communicationId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (error) {
    console.error(
      "Approval history error:",
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
