import { supabase } from "../../lib/supabase";

export interface CommunicationRecord {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  objective: string | null;
  audience: string | null;
  status: string;
  created_by: string;
  input_data: Record<string, unknown>;
  classification_data: Record<string, unknown>;
  selected_variant_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a brand-new draft communication.
 */
export async function createCommunication(
  userId: string
): Promise<CommunicationRecord> {
  const { data, error } = await supabase
    .from("communications")
    .insert({
      created_by: userId,
      title: "New Communication",
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Create communication error:",
      error
    );

    throw error;
  }

  return data as CommunicationRecord;
}

/**
 * Get all communications created by the
 * currently logged-in user.
 *
 * RLS in Supabase also protects this query.
 */
export async function getMyCommunications(): Promise<
  CommunicationRecord[]
> {
  const { data, error } = await supabase
    .from("communications")
    .select("*")
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Load communications error:",
      error
    );

    throw error;
  }

  return (data ?? []) as CommunicationRecord[];
}
