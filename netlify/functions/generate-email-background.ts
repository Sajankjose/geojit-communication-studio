import OpenAI from "openai";

import {
  MASTER_PROMPT,
} from "./ai/masterPrompt";

import {
  CommunicationCategory,
  getGenerationRules,
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


const MODEL_NAME =
  "gpt-5-mini";

const client =
  new OpenAI({
    apiKey:
      process.env
        .OPENAI_API_KEY,
  });


interface GenerateEmailRequest {
  communicationId:
    string;

  category:
    CommunicationCategory;

  /**
   * Dedicated subtype forwarded by
   * generate-email.ts.
   *
   * Example:
   * product + feature_explainer
   */
  communicationType?:
    string | null;

  title?:
    string;

  subcategory?:
    string | null;

  audience?:
    string | null;

  objective?:
    string | null;

  inputData?:
    Record<
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


/**
 * Phrases that indicate the model has created an
 * article-navigation / teaser email instead of a
 * self-contained Feature Explainer.
 */
const FEATURE_EXPLAINER_FORBIDDEN_PATTERNS:
  RegExp[] = [
    /what to expect in the article/i,
    /open the (linked )?article/i,
    /read the (full )?(linked )?article/i,
    /read the article to/i,
    /refer to the article/i,
    /this email is (a|an) .*pointer/i,
    /this email is (a|an) .*introduction/i,
    /the article explains/i,
    /the linked (page|article) (covers|explains)/i,
    /visit the (page|article) to understand/i,
    /open the support article/i,
    /read the full explanation and examples/i,
  ];


function jsonResponse(
  body:
    unknown,

  status =
    200
) {
  return new Response(
    JSON.stringify(
      body
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
}


function asRecord(
  value:
    unknown
):
  | Record<
      string,
      unknown
    >
  | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}


/**
 * Resolve communication type defensively.
 *
 * This supports:
 *
 * 1. explicit worker payload value
 * 2. inputData.communicationType
 * 3. inputData.categorySpecificDetails.communicationType
 */
function resolveCommunicationType(
  body:
    GenerateEmailRequest
):
  | string
  | null {
  if (
    body.category !==
    "product"
  ) {
    return null;
  }

  if (
    typeof body.communicationType ===
      "string" &&
    body.communicationType.trim()
  ) {
    return body.communicationType.trim();
  }

  const inputData =
    asRecord(
      body.inputData
    );

  const directType =
    inputData
      ?.communicationType;

  if (
    typeof directType ===
      "string" &&
    directType.trim()
  ) {
    return directType.trim();
  }

  const categorySpecificDetails =
    asRecord(
      inputData
        ?.categorySpecificDetails
    );

  const nestedType =
    categorySpecificDetails
      ?.communicationType;

  if (
    typeof nestedType ===
      "string" &&
    nestedType.trim()
  ) {
    return nestedType.trim();
  }

  return null;
}


/**
 * Collect human-readable strings recursively.
 *
 * Used only for quality/sufficiency checks.
 */
function collectStrings(
  value:
    unknown,

  result:
    string[] = []
):
  string[] {
  if (
    typeof value ===
    "string"
  ) {
    const trimmed =
      value.trim();

    if (trimmed) {
      result.push(
        trimmed
      );
    }

    return result;
  }

  if (
    Array.isArray(
      value
    )
  ) {
    for (
      const item of
      value
    ) {
      collectStrings(
        item,
        result
      );
    }

    return result;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    for (
      const item of
      Object.values(
        value as Record<
          string,
          unknown
        >
      )
    ) {
      collectStrings(
        item,
        result
      );
    }
  }

  return result;
}


function isUrlLike(
  value:
    string
) {
  return (
    /^https?:\/\//i.test(
      value
    ) ||
    /^www\./i.test(
      value
    )
  );
}


/**
 * A Feature Explainer should not be generated from
 * only a URL or a couple of labels.
 *
 * Until URL/article extraction is added, we require
 * enough supplied feature facts for safe explanation.
 */
function getFeatureSourceIssues(
  body:
    GenerateEmailRequest
):
  string[] {
  const strings =
    collectStrings(
      body.inputData ||
        {}
    );

  const nonUrlText =
    strings
      .filter(
        (value) =>
          !isUrlLike(
            value
          )
      )
      .join(
        " "
      )
      .trim();

  const issues:
    string[] = [];

  if (
    nonUrlText.length <
    220
  ) {
    issues.push(
      "Feature Explainer source information is too limited. Provide feature facts such as what it is, how it works, key benefits, usage/access guidance, and important conditions. A URL alone is not enough."
    );
  }

  return issues;
}


function buildSourcePrompt(
  body:
    GenerateEmailRequest,

  communicationType:
    string | null,

  retryIssues:
    string[] = []
) {
  const retryBlock =
    retryIssues.length >
    0
      ? `
============================================================
MANDATORY QUALITY CORRECTION
============================================================

The previous generation failed the Feature Explainer
quality gate for these reasons:

${retryIssues
  .map(
    (
      issue,
      index
    ) =>
      `${index + 1}. ${issue}`
  )
  .join("\n")}

Regenerate ALL variants.

Do not preserve the weak structure of the previous output.

The final email must explain the feature itself and must
stand on its own even if the recipient never clicks the CTA.
`
      : "";

  return `
============================================================
COMMUNICATION SOURCE INFORMATION
============================================================

Communication ID:
${body.communicationId}

Category:
${body.category}

Communication Type:
${communicationType || "generic"}

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
  body.inputData ||
    {},
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
4. apply the category and communication-type rules;
5. generate the required communication variants;
6. perform a compliance self-check for each variant;
7. return only the structured result required by the supplied schema.

Do not invent missing information.

If information is incomplete but safe generation is still
possible:
- generate cautiously;
- omit unsupported detail;
- add appropriate compliance flags.

If the requested communication cannot be explained safely
from the supplied facts:
- do not compensate with generic filler;
- do not convert the email into a teaser for an external
  article or webpage.

For category "${body.category}", follow the exact
variant-count requirement.

${retryBlock}
`;
}


/**
 * Convert an entire variant to searchable text without
 * depending on a specific output-schema property path.
 */
function variantText(
  variant:
    unknown
) {
  return collectStrings(
    variant
  )
    .join(
      "\n"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function countOccurrences(
  haystack:
    string,

  needle:
    RegExp
) {
  const flags =
    needle.flags.includes(
      "g"
    )
      ? needle.flags
      : `${needle.flags}g`;

  const regex =
    new RegExp(
      needle.source,
      flags
    );

  return (
    haystack.match(
      regex
    ) || []
  ).length;
}


/**
 * Deterministic Feature Explainer quality gate.
 *
 * This intentionally avoids judging style subjectively.
 * It catches concrete failure modes we already observed:
 *
 * - article teaser/navigation copy
 * - extremely thin email content
 * - excessive dependence on "article" wording
 */
function getFeatureExplainerQualityIssues(
  generation:
    any
):
  string[] {
  const issues:
    string[] = [];

  const variants =
    Array.isArray(
      generation?.variants
    )
      ? generation.variants
      : [];

  if (
    variants.length !==
    3
  ) {
    issues.push(
      `Feature Explainer must return exactly 3 variants; received ${variants.length}.`
    );
  }

  variants.forEach(
    (
      variant:
        unknown,

      index:
        number
    ) => {
      const text =
        variantText(
          variant
        );

      for (
        const pattern of
        FEATURE_EXPLAINER_FORBIDDEN_PATTERNS
      ) {
        if (
          pattern.test(
            text
          )
        ) {
          issues.push(
            `Variant ${index + 1} contains article-teaser/navigation language: "${pattern.source}".`
          );
        }
      }

      const articleMentions =
        countOccurrences(
          text,
          /\barticle\b/i
        );

      if (
        articleMentions >
        2
      ) {
        issues.push(
          `Variant ${index + 1} depends too heavily on article references (${articleMentions} mentions).`
        );
      }

      /**
       * A feature explainer with very little text is almost
       * always a teaser rather than a meaningful explanation.
       *
       * Keep this threshold conservative so concise,
       * well-structured emails still pass.
       */
      if (
        text.length <
        650
      ) {
        issues.push(
          `Variant ${index + 1} is too thin to function as a complete Feature Explainer.`
        );
      }
    }
  );

  return Array.from(
    new Set(
      issues
    )
  );
}


/**
 * One OpenAI structured-generation attempt.
 */
async function generateStructuredEmail({
  systemPrompt,
  sourcePrompt,
}: {
  systemPrompt:
    string;

  sourcePrompt:
    string;
}) {
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

  return validation.data;
}


export default async (
  request:
    Request
) => {
  if (
    request.method !==
    "POST"
  ) {
    return jsonResponse(
      {
        success:
          false,

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
        success:
          false,

        error:
          "AI service is not configured.",
      },
      500
    );
  }


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
        success:
          false,

        error:
          "Authentication required.",
      },
      401
    );
  }


  let aiRunId:
    string | null =
      null;

  let supabase:
    ReturnType<
      typeof createUserSupabaseClient
    > | null =
      null;


  try {
    supabase =
      createUserSupabaseClient(
        authorizationHeader
      );


    const accessToken =
      authorizationHeader.replace(
        /^Bearer\s+/i,
        ""
      );

    if (
      !accessToken
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Authentication token is missing.",
        },
        401
      );
    }


    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabase.auth
        .getUser(
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
            Boolean(
              accessToken
            ),

          tokenPrefix:
            accessToken
              ? accessToken.slice(
                  0,
                  8
                )
              : "",
        }
      );

      return jsonResponse(
        {
          success:
            false,

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
        userId:
          user.id,

        email:
          user.email,
      }
    );


    const rawBody =
      await request.json();

    const body =
      rawBody as
        GenerateEmailRequest;


    if (
      !body.communicationId ||
      typeof body.communicationId !==
        "string"
    ) {
      return jsonResponse(
        {
          success:
            false,

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
          success:
            false,

          error:
            "A valid communication category is required.",
        },
        400
      );
    }


    /**
     * Use maybeSingle to avoid generic PostgREST
     * coercion errors for missing/inaccessible records.
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
        .limit(1)
        .maybeSingle();


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
          success:
            false,

          error:
            "Communication not found or access denied.",
        },
        404
      );
    }


    const effectiveInputData =
      (
        body.inputData &&
        typeof body.inputData ===
          "object" &&
        !Array.isArray(
          body.inputData
        )
      )
        ? body.inputData
        : (
            asRecord(
              communication.input_data
            ) || {}
          );


    const effectiveBody:
      GenerateEmailRequest = {
        communicationId:
          body.communicationId,

        category:
          body.category,

        communicationType:
          body.communicationType,

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
          effectiveInputData,
      };


    const communicationType =
      resolveCommunicationType(
        effectiveBody
      );


    const isFeatureExplainer =
      body.category ===
        "product" &&
      communicationType ===
        "feature_explainer";


    /**
     * Fail safely instead of generating a generic teaser
     * when the source contains only a URL / thin details.
     */
    if (
      isFeatureExplainer
    ) {
      const sourceIssues =
        getFeatureSourceIssues(
          effectiveBody
        );

      if (
        sourceIssues.length >
        0
      ) {
        return jsonResponse(
          {
            success:
              false,

            error:
              sourceIssues[0],

            code:
              "FEATURE_SOURCE_INSUFFICIENT",

            issues:
              sourceIssues,
          },
          400
        );
      }
    }


    const inputSnapshot = {
      communicationId:
        body.communicationId,

      category:
        body.category,

      communicationType,

      title:
        effectiveBody.title,

      subcategory:
        effectiveBody.subcategory,

      audience:
        effectiveBody.audience,

      objective:
        effectiveBody.objective,

      inputData:
        effectiveInputData,
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
     * This is the key change:
     *
     * product + feature_explainer
     *          ↓
     * generic Product rules
     *          +
     * PRODUCT_FEATURE_EXPLAINER_RULES
     */
    const generationRules =
      getGenerationRules({
        category:
          body.category,

        communicationType,
      });


    const systemPrompt = `
${MASTER_PROMPT}

============================================================
CATEGORY / COMMUNICATION-TYPE RULES
============================================================

${generationRules}
`;


    const firstSourcePrompt =
      buildSourcePrompt(
        effectiveBody,
        communicationType
      );


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

        communicationType,

        qualityGate:
          isFeatureExplainer,
      }
    );


    /**
     * ------------------------------------------------------
     * First structured generation
     * ------------------------------------------------------
     */

    let generation =
      await generateStructuredEmail({
        systemPrompt,

        sourcePrompt:
          firstSourcePrompt,
      });


    /**
     * ------------------------------------------------------
     * Feature Explainer quality gate
     * ------------------------------------------------------
     *
     * If the first valid JSON output still behaves like
     * the poor OCO example, regenerate once with explicit
     * failure reasons.
     */
    if (
      isFeatureExplainer
    ) {
      const firstIssues =
        getFeatureExplainerQualityIssues(
          generation
        );

      if (
        firstIssues.length >
        0
      ) {
        console.warn(
          "Feature Explainer quality gate failed. Retrying once.",
          {
            aiRunId,
            issues:
              firstIssues,
          }
        );

        const retrySourcePrompt =
          buildSourcePrompt(
            effectiveBody,
            communicationType,
            firstIssues
          );

        generation =
          await generateStructuredEmail({
            systemPrompt,

            sourcePrompt:
              retrySourcePrompt,
          });


        const retryIssues =
          getFeatureExplainerQualityIssues(
            generation
          );

        if (
          retryIssues.length >
          0
        ) {
          console.error(
            "Feature Explainer failed quality gate after retry:",
            {
              aiRunId,
              issues:
                retryIssues,
            }
          );

          throw new Error(
            `Feature Explainer did not meet the required content quality. ${retryIssues[0]}`
          );
        }
      }
    }


    /**
     * ------------------------------------------------------
     * Save only quality-approved variants
     * ------------------------------------------------------
     */

    const savedVariants =
      await saveVariants(
        supabase,
        body.communicationId,
        aiRunId,
        generation
      );


    await completeAiRun(
      supabase,
      aiRunId,
      MODEL_NAME,
      generation
    );


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

        category:
          body.category,

        communicationType,

        variantCount:
          generation
            .variants
            .length,
      }
    );


    return jsonResponse({
      success:
        true,

      communicationId:
        body.communicationId,

      aiRunId,

      communicationType,

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
        success:
          false,

        aiRunId,

        error:
          errorMessage,
      },
      500
    );
  }
};


export const config = {
  background:
    true,
};
