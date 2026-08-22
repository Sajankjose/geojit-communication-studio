import {
  supabase,
} from "../../lib/supabase";

/**
 * Verify export permission immediately before copying or
 * downloading final HTML.
 *
 * Server-side rules currently require:
 * - authenticated user
 * - role = creator
 * - creator owns the communication
 * - communication.status = approved
 */
export async function assertCommunicationExportAllowed(
  communicationId: string
): Promise<void> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "assert_communication_export_allowed",
      {
        p_communication_id:
          communicationId,
      }
    );

  if (error) {
    console.error(
      "HTML export permission error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (data !== true) {
    throw new Error(
      "HTML export is not available for this communication."
    );
  }
}
