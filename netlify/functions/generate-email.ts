import OpenAI from "openai";

import {
  MASTER_PROMPT,
} from "./ai/masterPrompt";

import {
  CommunicationCategory,
  getCategoryRules,
} from "./ai/categoryRules";

import {
  EMAIL_GENERATION_JSON_SCHEMA,
} from "./ai/outputSchema";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


interface GenerateEmailRequest {
  communicationId: string;

  category: CommunicationCategory;

  title?: string;

  subcategory?: string | null;

  audience?: string | null;

  objective?: string | null;

  inputData?: Record<
    string,
    unknown
  >;
}


/**
 * Allowed communication categories.
 */
const VALID_CATEGORIES:
  CommunicationCategory[] = [
    "research",
    "education",
    "product",
    "service",
    "regulatory",
    "onboarding",
  ];


/**
 * Build the user/source prompt.
 *
 * The master rules remain separate from
 * the actual source information.
 */
function buildSourcePrompt(
  body: GenerateEmailRequest
) {
  const {
    communicationId,
    category,
    title,
    subcategory,
    audience,
    objective,
    inputData,
  } = body;

  return `
============================================================
COMMUNICATION SOURCE INFORMATION
============================================================

Communication ID:
${communicationId}

Category:
${category}

Communication Title:
${title || ""}

Subcategory:
${subcategory || ""}

Audience:
${audience || ""}

Primary Objective / Key Message:
${objective || ""}

Source Input:
${JSON.stringify(
  inputData || {},
  null,
  2
)}

============================================================
GENERATION TASK
============================================================

Using ONLY the supplied source information:

1. identify and preserve all important factual inputs;
2. create the correct locked facts list;
3. apply the Geojit master communication principles;
4. apply the category-specific rules;
5. create the required communication variants;
6. perform a compliance self-check for every variant;
7. return the result using the supplied structured output schema.

Do not invent missing facts.

If important information is missing, generate safely where possible and record the issue using compliance flags and notes.

For category "${category}", follow the exact variant-count requirements defined in the category rules.
`;
}


/**
 * Helper for consistent JSON responses.
 */
function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
}


export default async (
  request: Request
) => {
  /**
   * Only POST is allowed.
   */
  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error:
          "Method not allowed. Use POST.",
      },
      405
    );
  }

  /**
   * Make sure server-side OpenAI secret exists.
   */
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "OPENAI_API_KEY is missing."
    );

    return jsonResponse(
      {
        success: false,
        error:
          "AI service is not configured.",
      },
      500
    );
  }

  try {
    /**
     * Read request body.
     */
    const rawBody =
      await request.json();

    const body =
      rawBody as GenerateEmailRequest;

    /**
     * Basic request validation.
     */
    if (
      !body.communicationId ||
      typeof body.communicationId !==
        "string"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "communicationId is required.",
        },
        400
      );
    }

    if (
      !body.category ||
      !VALID_CATEGORIES.includes(
        body.category
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "A valid communication category is required.",
        },
        400
      );
    }

    /**
     * Select category intelligence.
     */
    const categoryRules =
      getCategoryRules(
        body.category
      );

    /**
     * Combine master rules +
     * category-specific behavior.
     */
    const systemPrompt = `
${MASTER_PROMPT}

============================================================
CATEGORY-SPECIFIC RULES
============================================================

${categoryRules}
`;

    const sourcePrompt =
      buildSourcePrompt(body);

    console.log(
      "Starting structured AI generation:",
      {
        communicationId:
          body.communicationId,

        category:
          body.category,
      }
    );

    /**
     * Real OpenAI call.
     *
     * Structured Outputs forces the response
     * to follow outputSchema.ts.
     */
    const response =
      await client.responses.create({
        model: "gpt-5-mini",

        input: [
          {
            role: "system",
            content:
              systemPrompt,
          },

          {
            role: "user",
            content:
              sourcePrompt,
          },
        ],

        text: {
          format: {
            type:
              "json_schema",

            name:
              EMAIL_GENERATION_JSON_SCHEMA.name,

            strict:
              EMAIL_GENERATION_JSON_SCHEMA.strict,

            schema:
              EMAIL_GENERATION_JSON_SCHEMA.schema,
          },
        },
      });

    /**
     * The structured result is returned
     * as JSON text in output_text.
     */
    const outputText =
      response.output_text;

    if (!outputText) {
      throw new Error(
        "OpenAI returned an empty response."
      );
    }

    let generatedData:
      unknown;

    try {
      generatedData =
        JSON.parse(
          outputText
        );
    } catch (parseError) {
      console.error(
        "Structured response JSON parse failed:",
        parseError
      );

      throw new Error(
        "AI returned unreadable structured data."
      );
    }

    /**
     * At this stage we return the
     * generated structure to the app.
     *
     * Next step:
     * server-side Zod validation +
     * ai_runs / variants persistence.
     */
    console.log(
      "AI generation completed:",
      {
        communicationId:
          body.communicationId,

        category:
          body.category,
      }
    );

    return jsonResponse(
      {
        success: true,

        communicationId:
          body.communicationId,

        generation:
          generatedData,
      }
    );

  } catch (error) {
    console.error(
      "Generate email error:",
      error
    );

    /**
     * Avoid exposing sensitive server details
     * unnecessarily to the browser.
     */
    const message =
      error instanceof Error
        ? error.message
        : "Unknown AI generation error.";

    return jsonResponse(
      {
        success: false,
        error: message,
      },
      500
    );
  }
};
