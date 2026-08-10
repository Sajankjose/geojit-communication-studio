import { z } from "zod";

export const communicationCategorySchema =
  z.enum([
    "research",
    "education",
    "product",
    "service",
    "regulatory",
    "onboarding",
  ]);

export const sectionTypeSchema =
  z.enum([
    "text",
    "bullets",
    "snapshot",
    "highlight",
    "steps",
    "timeline",
    "note",
  ]);

export const generationMetaSchema =
  z.object({
    schema_version:
      z.string().min(1),

    generated_at:
      z.string().min(1),

    variant_count:
      z.number().int().min(1).max(3),

    source_type:
      z.string().min(1),

    language:
      z.string().min(1),
  });

export const communicationContextSchema =
  z.object({
    category:
      communicationCategorySchema,

    subcategory:
      z.string(),

    audience:
      z.string(),

    tone:
      z.string().min(1),

    primary_goal:
      z.string().min(1),
  });

export const lockedFactSchema =
  z.object({
    label:
      z.string().min(1),

    value:
      z.string(),

    source:
      z.string().min(1),
  });

export const factsBlockSchema =
  z.object({
    locked:
      z.boolean(),

    items:
      z.array(
        lockedFactSchema
      ),
  });

export const snapshotItemSchema =
  z.object({
    label:
      z.string().min(1),

    value:
      z.string(),
  });

export const emailSectionSchema =
  z.object({
    type:
      sectionTypeSchema,

    title:
      z.string().optional(),

    content:
      z.string().optional(),

    items:
      z.array(
        z.union([
          z.string(),
          snapshotItemSchema,
        ])
      ).optional(),
  });

export const emailHeroSchema =
  z.object({
    eyebrow:
      z.string().optional(),

    title:
      z.string().min(1),

    subtitle:
      z.string().optional(),
  });

export const emailBodySchema =
  z.object({
    intro:
      z.string().min(1),

    sections:
      z.array(
        emailSectionSchema
      ),

    closing:
      z.string().optional(),
  });

export const emailCtaSchema =
  z.object({
    enabled:
      z.boolean(),

    label:
      z.string().optional(),

    url:
      z.string().optional(),
  })
  .superRefine(
    (cta, ctx) => {
      if (
        cta.enabled &&
        !cta.label
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "CTA label is required when CTA is enabled.",
        });
      }
    }
  );

export const disclaimerSchema =
  z.object({
    required:
      z.boolean(),

    type:
      z.string().min(1),

    text:
      z.string().optional(),
  });

export const complianceSchema =
  z.object({
    status:
      z.enum([
        "pass",
        "warning",
        "fail",
      ]),

    flags:
      z.array(
        z.string()
      ),

    notes:
      z.array(
        z.string()
      ),
  });

export const communicationVariantSchema =
  z.object({
    variant_key:
      z.enum([
        "A",
        "B",
        "C",
      ]),

    variant_name:
      z.string().min(1),

    strategy:
      z.string().min(1),

    subject_lines:
      z
        .array(
          z.string().min(1)
        )
        .min(1)
        .max(3),

    preheader:
      z.string().optional(),

    hero:
      emailHeroSchema,

    body:
      emailBodySchema,

    cta:
      emailCtaSchema,

    disclaimer:
      disclaimerSchema,

    compliance:
      complianceSchema,
  });

export const aiEmailGenerationSchema =
  z.object({
    generation_meta:
      generationMetaSchema,

    communication:
      communicationContextSchema,

    facts:
      factsBlockSchema,

    variants:
      z
        .array(
          communicationVariantSchema
        )
        .min(2)
        .max(3),
  })
  .superRefine(
    (data, ctx) => {

      const expectedCount =
        data.communication.category ===
        "regulatory"
          ? 2
          : 3;

      if (
        data.variants.length !==
        expectedCount
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path:
            ["variants"],

          message:
            data.communication.category ===
            "regulatory"
              ? "Regulatory communications must contain exactly 2 variants."
              : "This communication category must contain exactly 3 variants.",
        });
      }

      if (
        data.generation_meta
          .variant_count !==
        data.variants.length
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "generation_meta",
            "variant_count",
          ],

          message:
            "variant_count does not match the actual number of variants.",
        });
      }

      const variantKeys =
        data.variants.map(
          (variant) =>
            variant.variant_key
        );

      if (
        new Set(
          variantKeys
        ).size !==
        variantKeys.length
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path:
            ["variants"],

          message:
            "Variant keys must be unique.",
        });
      }
    }
  );

export type AIEmailGenerationInput =
  z.infer<
    typeof aiEmailGenerationSchema
  >;
