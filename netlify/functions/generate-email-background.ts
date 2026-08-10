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

import {
  aiGenerationSchema,
} from "./ai/validationSchema";

import {
  createUserSupabaseClient,
} from "./ai/supabaseServer";

import {
  createAiRun,
  saveVariants,
  completeAiRun,
  failAiRun,
} from "./ai/persistence";


const MODEL_NAME = "gpt-5-mini";

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


const VALID_CATEGORIES:
  CommunicationCategory[] = [
    "research",
    "education",
    "product",
    "service",
    "regulatory",
    "onboarding",
  ];


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


function buildSourcePrompt(
  body: GenerateEmailRequest
) {
  return `
============================================================
COMMUNICATION SOURCE INFORMATION
============================================================

Communication ID:
${body.communicationId}

Category:
${body.category}

Communication Title:
${body.title || ""}

Subcategory:
${body.subcategory || ""}

Audience:
${body.audience || ""}

Primary Objective / Key Message:
${body.objective || ""}

Source Input:
${JSON.stringify(
  body.inputData || {},
  null,
  2
)}

============================================================
GENERATION TASK
============================================================

Using ONLY the supplied source information:

1. identify and preserve all important factual inputs;
2. create the locked facts list;
3. apply the Geojit master communication principles;
4. apply the category-specific rules;
5. generate the required communication variants;
6. perform a compliance self-check for each variant;
7. return only the structured result required by the supplied schema.

Do not invent missing information.

If information is incomplete but safe generation is still possible:
generate cautiously and add appropriate compliance flags.

For category "${body.category}", follow the exact variant-count requirement.
`;
}


export default async (
  request: Request
) => {
  if (
    request.method !==
    "POST"
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Method not allowed. Use POST.",
      },
      405
    );
  }


  if (
    !process.env
      .OPENAI_API_KEY
  ) {
    console.error(
      "OPENAI_API_KEY missing."
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


  /**
   * ------------------------------------------------------
   * Authentication
   * ------------------------------------------------------
   */

  const authorizationHeader =
    request.headers.get(
      "Authorization"
    );

  if (
    !authorizationHeader ||
    !authorizationHeader
      .startsWith(
        "Bearer "
      )
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Authentication required.",
      },
      401
    );
  }


  let aiRunId:
    string | null = null;

  let supabase:
    ReturnType<
      typeof createUserSupabaseClient
    > | null = null;


  try {
    /**
     * Create Supabase client operating
     * under the logged-in user's JWT.
     */
    supabase =
      createUserSupabaseClient(
        authorizationHeader
      );


    /**
     * Verify authenticated user.
     *
     * This is a server-side client, so there is
     * no browser session stored inside it.
     * Explicitly validate the JWT received from
     * the frontend Authorization header.
     */
    const accessToken =
      authorizationHeader.replace(
        /^Bearer\s+/i,
        ""
      );

    if (!accessToken) {
      return jsonResponse(
        {
          success: false,
          error:
            "Authentication token is missing.",
        },
        401
      );
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "Supabase user verification failed:",
        {
          message:
            userError?.message ||
            "User not returned",
          status:
            userError?.status,
          tokenPresent:
            Boolean(accessToken),
          tokenPrefix:
            accessToken
              ? accessToken.slice(0, 8)
              : "",
        }
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Invalid or expired session. Please sign in again.",
        },
        401
      );
    }

    const user =
      userData.user;

    console.log(
      "Authenticated AI request:",
      {
        userId: user.id,
        email: user.email,
      }
    );


    /**
     * ------------------------------------------------------
     * Request validation
     * ------------------------------------------------------
     */

    const rawBody =
      await request.json();

    const body =
      rawBody as
        GenerateEmailRequest;


    if (
      !body.communicationId ||
      typeof body
        .communicationId !==
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
     * ------------------------------------------------------
     * Verify communication exists
     * ------------------------------------------------------
     *
     * RLS ensures a user cannot fetch
     * somebody else's communication.
     */

    const {
      data:
        communication,
      error:
        communicationError,
    } =
      await supabase
        .from(
          "communications"
        )
        .select(
          `
          id,
          title,
          category,
          subcategory,
          audience,
          objective,
          status,
          input_data,
          created_by
          `
        )
        .eq(
          "id",
          body.communicationId
        )
        .single();


    if (
      communicationError ||
      !communication
    ) {
      console.error(
        "Communication lookup failed:",
        communicationError
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Communication not found or access denied.",
        },
        404
      );
    }


    /**
     * ------------------------------------------------------
     * Create AI run
     * ------------------------------------------------------
     */

    const inputSnapshot = {
      communicationId:
        body.communicationId,

      category:
        body.category,

      title:
        body.title ||
        communication.title,

      subcategory:
        body.subcategory ??
        communication.subcategory,

      audience:
        body.audience ??
        communication.audience,

      objective:
        body.objective ??
        communication.objective,

      inputData:
        body.inputData ||
        communication.input_data,
    };


    const aiRun =
      await createAiRun(
        supabase,
        body.communicationId,
        user.id,
        inputSnapshot
      );


    aiRunId =
      aiRun.id;


    /**
     * ------------------------------------------------------
     * Build prompt
     * ------------------------------------------------------
     */

    const categoryRules =
      getCategoryRules(
        body.category
      );


    const systemPrompt = `
${MASTER_PROMPT}

============================================================
CATEGORY-SPECIFIC RULES
============================================================

${categoryRules}
`;


    const sourcePrompt =
      buildSourcePrompt({
        communicationId:
          body.communicationId,

        category:
          body.category,

        title:
          body.title ||
          communication.title,

        subcategory:
          body.subcategory ??
          communication.subcategory,

        audience:
          body.audience ??
          communication.audience,

        objective:
          body.objective ??
          communication.objective,

        inputData:
          body.inputData ||
          communication.input_data,
      });


    console.log(
      "Starting AI run:",
      {
        aiRunId,
        communicationId:
          body.communicationId,
        userId:
          user.id,
        category:
          body.category,
      }
    );


    /**
     * ------------------------------------------------------
     * OpenAI structured generation
     * ------------------------------------------------------
     */

    const response =
      await client.responses
        .create({
          model:
            MODEL_NAME,

          input: [
            {
              role:
                "system",

              content:
                systemPrompt,
            },

            {
              role:
                "user",

              content:
                sourcePrompt,
            },
          ],

          text: {
            format: {
              type:
                "json_schema",

              name:
                EMAIL_GENERATION_JSON_SCHEMA
                  .name,

              strict:
                EMAIL_GENERATION_JSON_SCHEMA
                  .strict,

              schema:
                EMAIL_GENERATION_JSON_SCHEMA
                  .schema,
            },
          },
        });


    const outputText =
      response.output_text;


    if (
      !outputText
    ) {
      throw new Error(
        "OpenAI returned an empty response."
      );
    }


    /**
     * ------------------------------------------------------
     * Parse JSON
     * ------------------------------------------------------
     */

    let parsedOutput:
      unknown;

    try {
      parsedOutput =
        JSON.parse(
          outputText
        );
    } catch (
      parseError
    ) {
      console.error(
        "AI JSON parse failed:",
        parseError
      );

      throw new Error(
        "AI returned unreadable structured data."
      );
    }


    /**
     * ------------------------------------------------------
     * Server-side validation
     * ------------------------------------------------------
     */

    const validation =
      aiGenerationSchema
        .safeParse(
          parsedOutput
        );


    if (
      !validation.success
    ) {
      console.error(
        "AI validation failed:",
        validation.error
          .flatten()
      );

      throw new Error(
        "AI returned an invalid communication structure."
      );
    }


    const generation =
      validation.data;


    /**
     * ------------------------------------------------------
     * Save variants
     * ------------------------------------------------------
     */

    const savedVariants =
      await saveVariants(
        supabase,
        body.communicationId,
        aiRunId,
        generation
      );


    /**
     * ------------------------------------------------------
     * Complete AI run
     * ------------------------------------------------------
     */

    await completeAiRun(
      supabase,
      aiRunId,
      MODEL_NAME,
      generation
    );


    /**
     * ------------------------------------------------------
     * Update main communication status
     * ------------------------------------------------------
     */

    const {
      error:
        statusError,
    } =
      await supabase
        .from(
          "communications"
        )
        .update({
          status:
            "variants_ready",
        })
        .eq(
          "id",
          body.communicationId
        );


    if (
      statusError
    ) {
      console.error(
        "Communication status update failed:",
        statusError
      );
    }


    console.log(
      "AI run completed:",
      {
        aiRunId,
        communicationId:
          body.communicationId,
        variantCount:
          generation
            .variants
            .length,
      }
    );


    /**
     * ------------------------------------------------------
     * Successful response
     * ------------------------------------------------------
     */

    return jsonResponse({
      success: true,

      communicationId:
        body.communicationId,

      aiRunId,

      generation,

      variants:
        savedVariants,
    });

  } catch (
    error
  ) {
    console.error(
      "Generate email error:",
      error
    );


    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown AI generation error.";


    /**
     * Mark the AI run as failed
     * if one was already created.
     */
    if (
      supabase &&
      aiRunId
    ) {
      await failAiRun(
        supabase,
        aiRunId,
        errorMessage
      );
    }


    return jsonResponse(
      {
        success: false,
        aiRunId,
        error:
          errorMessage,
      },
      500
    );
  }
};
export const config = {
  background: true,
};

