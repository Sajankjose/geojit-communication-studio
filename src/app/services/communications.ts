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

  return data[0] as CommunicationRecord;
}

/**
 * Get communications available to the
 * currently authenticated user.
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
 */
export async function updateCommunication(
  communicationId: string,
  updates: Partial<CommunicationRecord>
): Promise<CommunicationRecord> {
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
    throw new Error(
      "Communication could not be updated. You may not have permission to edit this communication, or it may no longer be editable in its current workflow stage."
    );
  }

  if (
    data.length > 1
  ) {
    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  return data[0] as CommunicationRecord;
}

/**
 * Get one communication by ID.
 *
 * Uses the restricted audit-access RPC so a user can still
 * open a communication they legitimately own/reviewed after
 * it moves beyond their active queue.
 */
export async function getCommunicationById(
  communicationId: string
): Promise<CommunicationRecord> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_communication_for_audit",
    {
      p_communication_id:
        communicationId,
    }
  );

  if (error) {
    console.error(
      "Load communication for audit error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  const rows =
    (data || []) as CommunicationRecord[];

  if (
    rows.length === 0
  ) {
    throw new Error(
      "Communication not found or you do not have permission to view it."
    );
  }

  if (
    rows.length > 1
  ) {
    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  return rows[0];
}

/**
 * Delete a draft communication.
 *
 * IMPORTANT:
 * The RPC enforces the rule server-side:
 * - status must still be "draft"
 * - creator may delete own draft
 * - admin may delete any draft
 * - any communication with approval history is protected
 */
export async function deleteDraftCommunication(
  communicationId: string
): Promise<void> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "delete_draft_communication",
      {
        p_communication_id:
          communicationId,
      }
    );

  if (error) {
    console.error(
      "Delete draft communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (data !== true) {
    throw new Error(
      "The draft could not be deleted."
    );
  }
}
