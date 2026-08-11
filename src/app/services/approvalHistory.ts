import { supabase } from "../../lib/supabase";

export interface ApprovalHistoryItem {
  id: string;
  communication_id: string;
  stage: string | null;
  action: string | null;
  status: string | null;
  actor_id: string | null;
  reviewer_id: string | null;
  reviewer_role: string | null;
  comment?: string | null;
  comments?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export async function getApprovalHistory(
  communicationId: string
): Promise<ApprovalHistoryItem[]> {
  const { data, error } = await supabase
    .from("approval_actions")
    .select("*")
    .eq("communication_id", communicationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load approval history error:", error);
    throw new Error(error.message);
  }

  return (data || []) as ApprovalHistoryItem[];
}
