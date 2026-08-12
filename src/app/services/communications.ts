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
  const {
    data,
    error,
  } = await supabase
    .from("communications")
    .insert({
      created_by: userId,
      title: "New Communication",
      status: "draft",
    })
    .select("*");

  if (error) {
    console.error(
      "Create communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (
    !data ||
    data.length === 0
  ) {
    throw new Error(
      "Communication could not be created."
    );
  }

  if (
    data.length > 1
  ) {
    console.error(
      "Unexpected multiple communication rows created:",
      data
    );

    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  console.log(
    "Communication created successfully:",
    data[0]
  );

  return data[0] as CommunicationRecord;
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
  const {
    data,
    error,
  } = await supabase
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

    throw new Error(
      error.message
    );
  }

  return (
    data ?? []
  ) as CommunicationRecord[];
}

/**
 * Update an existing communication.
 *
 * Important:
 * Do not use .single() here.
 *
 * If RLS blocks the update, Supabase may
 * return zero rows. Using .single() would
 * then produce the vague PostgREST error:
 *
 * "Cannot coerce the result to a single JSON object"
 *
 * Returning the array first lets us provide
 * a meaningful permission/workflow error.
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

  const {
    data,
    error,
  } = await supabase
    .from("communications")
    .update(updates)
    .eq(
      "id",
      communicationId
    )
    .select("*");

  if (error) {
    console.error(
      "Supabase update communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (
    !data ||
    data.length === 0
  ) {
    console.error(
      "Communication update returned no rows.",
      {
        communicationId,
        updates,
      }
    );

    throw new Error(
      "Communication could not be updated. You may not have permission to edit this communication, or it may no longer be editable in its current workflow stage."
    );
  }

  if (
    data.length > 1
  ) {
    console.error(
      "Unexpected multiple communication rows updated:",
      data
    );

    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  console.log(
    "Communication updated successfully:",
    data[0]
  );

  return data[0] as CommunicationRecord;
}

/**
 * Get one communication by ID.
 *
 * Used when reopening an existing
 * communication from the Dashboard
 * and across the creation / review flow.
 */
export async function getCommunicationById(
  communicationId: string
): Promise<CommunicationRecord> {
  const {
    data,
    error,
  } = await supabase
    .from("communications")
    .select("*")
    .eq(
      "id",
      communicationId
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Load communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "Communication not found or you do not have permission to view it."
    );
  }

  return data as CommunicationRecord;
}
