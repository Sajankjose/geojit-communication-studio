import { supabase } from "../../lib/supabase";

/**
 * Call this only after the creator has actually
 * saved a content change.
 *
 * If no reviewer revision is currently required,
 * this is a harmless no-op.
 */
export async function markCreatorRevisionComplete(
  communicationId: string
) {
  const { data, error } = await supabase
    .from("communications")
    .select(
      `
      revision_required,
      revision_requested_at,
      revision_completed_at
      `
    )
    .eq("id", communicationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.revision_required) {
    return false;
  }

  const completedAt =
    new Date().toISOString();

  const { error: updateError } =
    await supabase
      .from("communications")
      .update({
        revision_completed_at:
          completedAt,
      })
      .eq("id", communicationId);

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  return true;
}
