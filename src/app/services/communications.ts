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
    .select("*")
    .single();

  if (error) {
    console.error(
      "Create communication error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Communication could not be created."
    );
  }

  console.log(
    "Communication created successfully:",
    data
  );

  return data as CommunicationRecord;
}

/**
 * Get communications available to the
 * currently authenticated user.
 *
 * Supabase RLS controls which rows
 * this user is allowed to receive.
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

    throw new Error(error.message);
  }

  return (data ?? []) as CommunicationRecord[];
}

/**
 * Update an existing communication.
 */
export async function updateCommunication(
  communicationId: string,
  updates: Partial<CommunicationRecord>
): Promise<CommunicationRecord> {
  console.log(
    "Updating communication:",
    communicationId
  );

  console.log(
    "Update payload:",
    updates
  );

  const { data, error } = await supabase
    .from("communications")
    .update(updates)
    .eq("id", communicationId)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Supabase update communication error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Communication was not updated."
    );
  }

  console.log(
    "Communication updated successfully:",
    data
  );

  return data as CommunicationRecord;
}

/**
 * Get one communication by ID.
 *
 * We will use this shortly when reopening
 * drafts from the Dashboard.
 */
export async function getCommunicationById(
  communicationId: string
): Promise<CommunicationRecord> {
  const { data, error } = await supabase
    .from("communications")
    .select("*")
    .eq("id", communicationId)
    .single();

  if (error) {
    console.error(
      "Load communication error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Communication not found."
    );
  }

  return data as CommunicationRecord;
}
