import { z } from "zod";

const snapshotItemSchema =
  z.object({
    label: z.string(),
    value: z.string(),
  });

const sectionSchema =
  z.object({
    type: z.enum([
      "text",
      "bullets",
      "snapshot",
      "highlight",
      "steps",
      "timeline",
      "note",
    ]),

    title: z.string(),

    content: z.string(),

    items: z.array(
      z.union([
        z.string(),
        snapshotItemSchema,
      ])
    ),
  });

const variantSchema =
  z.object({
    variant_key:
      z.enum(["A", "B", "C"]),

    variant_name:
      z.string().min(1),

    strategy:
      z.string().min(1),

    subject_lines:
      z.array(
        z.string().min(1)
      )
      .min(1)
      .max(3),

    preheader:
      z.string(),

    hero:
      z.object({
        eyebrow: z.string(),
        title: z.string(),
        subtitle: z.string(),
      }),

    body:
      z.object({
        intro: z.string(),

        sections:
          z.array(
            sectionSchema
          ),

        closing:
          z.string(),
      }),

    cta:
      z.object({
        enabled: z.boolean(),
        label: z.string(),
        url: z.string(),
      }),

    disclaimer:
      z.object({
        required: z.boolean(),
        type: z.string(),
        text: z.string(),
      }),

    compliance:
      z.object({
        status: z.enum([
          "pass",
          "warning",
          "fail",
        ]),

        flags:
          z.array(z.string()),

        notes:
          z.array(z.string()),
      }),
  });

export const aiGenerationSchema =
  z.object({
    generation_meta:
      z.object({
        schema_version:
          z.string(),

        generated_at:
          z.string(),

        variant_count:
          z.number()
            .int()
            .min(2)
            .max(3),

        source_type:
          z.string(),

        language:
          z.string(),
      }),

    communication:
      z.object({
        category:
          z.enum([
            "research",
            "education",
            "product",
            "service",
            "regulatory",
            "onboarding",
          ]),

        subcategory:
          z.string(),

        audience:
          z.string(),

        tone:
          z.string(),

        primary_goal:
          z.string(),
      }),

    facts:
      z.object({
        locked:
          z.boolean(),

        items:
          z.array(
            z.object({
              label:
                z.string(),

              value:
                z.string(),

              source:
                z.string(),
            })
          ),
      }),

    variants:
      z.array(
        variantSchema
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

          path: ["variants"],

          message:
            `Expected ${expectedCount} variants.`,
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
            "variant_count does not match returned variants.",
        });
      }

      const keys =
        data.variants.map(
          (variant) =>
            variant.variant_key
        );

      if (
        new Set(keys).size !==
        keys.length
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: ["variants"],

          message:
            "Variant keys must be unique.",
        });
      }

      if (
        data.communication.category ===
          "regulatory" &&
        keys.includes("C")
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: ["variants"],

          message:
            "Regulatory communications cannot contain Variant C.",
        });
      }
    }
  );

export type ValidatedGeneration =
  z.infer<
    typeof aiGenerationSchema
  >;
