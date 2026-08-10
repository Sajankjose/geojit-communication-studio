import {
  aiEmailGenerationSchema,
} from "./schema";

import type {
  AIEmailGeneration,
} from "./types";

export function validateAIResponse(
  data: unknown
): AIEmailGeneration {
  const result =
    aiEmailGenerationSchema.safeParse(
      data
    );

  if (!result.success) {
    console.error(
      "AI response validation failed:",
      result.error.flatten()
    );

    throw new Error(
      "AI returned an invalid communication structure."
    );
  }

  return result.data;
}
