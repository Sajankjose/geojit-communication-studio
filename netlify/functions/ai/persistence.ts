import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  ValidatedGeneration,
} from "./validationSchema";


export async function createAiRun(
  supabase: SupabaseClient,
  communicationId: string,
  userId: string,
  inputSnapshot: Record<
    string,
    unknown
  >
) {
  const { data, error } =
    await supabase
      .from("ai_runs")
      .insert({
        communication_id:
          communicationId,

        created_by:
          userId,

        run_type:
          "generate",

        status:
          "running",

        input_snapshot:
          inputSnapshot,

        started_at:
          new Date()
            .toISOString(),
      })
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to create AI run: ${error.message}`
    );
  }

  return data;
}


export async function saveVariants(
  supabase: SupabaseClient,
  communicationId: string,
  aiRunId: string,
  generation:
    ValidatedGeneration
) {
  const rows =
    generation.variants.map(
      (variant) => ({
        communication_id:
          communicationId,

        ai_run_id:
          aiRunId,

        variant_key:
          variant.variant_key,

        variant_name:
          variant.variant_name,

        subject_lines:
          variant.subject_lines,

        preheader:
          variant.preheader,

        hero_title:
          variant.hero.title,

        hero_subtitle:
          variant.hero.subtitle,

        content_data:
          variant,

        cta_data:
          variant.cta,

        compliance_data:
          variant.compliance,

        is_selected:
          false,
      })
    );

  const { data, error } =
    await supabase
      .from(
        "communication_variants"
      )
      .insert(rows)
      .select("*");

  if (error) {
    throw new Error(
      `Unable to save variants: ${error.message}`
    );
  }

  return data;
}


export async function completeAiRun(
  supabase: SupabaseClient,
  aiRunId: string,
  model: string,
  generation:
    ValidatedGeneration
) {
  const { error } =
    await supabase
      .from("ai_runs")
      .update({
        status:
          "completed",

        model,

        output_snapshot:
          generation,

        validation_result: {
          valid: true,

          variant_count:
            generation
              .variants
              .length,
        },

        completed_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        aiRunId
      );

  if (error) {
    throw new Error(
      `Unable to complete AI run: ${error.message}`
    );
  }
}


export async function failAiRun(
  supabase: SupabaseClient,
  aiRunId: string,
  message: string
) {
  const { error } =
    await supabase
      .from("ai_runs")
      .update({
        status:
          "failed",

        error_message:
          message,

        completed_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        aiRunId
      );

  if (error) {
    console.error(
      "Unable to mark AI run failed:",
      error
    );
  }
}
