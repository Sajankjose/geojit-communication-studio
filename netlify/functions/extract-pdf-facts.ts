import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const MAX_SOURCE_CHARS = 8000;

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface RequestBody {
  communicationId?: string;
  category?: Category;
  relevantText?: string;
}

const ResearchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: {
      type: ["string", "null"],
    },
    securityOrCompany: {
      type: ["string", "null"],
    },
    reportDate: {
      type: ["string", "null"],
    },
    recommendation: {
      type: ["string", "null"],
    },
    currentPrice: {
      type: ["string", "null"],
    },
    targetPrice: {
      type: ["string", "null"],
    },
    timeHorizon: {
      type: ["string", "null"],
    },
    valuation: {
      type: ["string", "null"],
    },
    keyRationale: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },
    riskFactors: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },
    keyFacts: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 6,
    },
    sourceWarnings: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 4,
    },
  },
  required: [
    "documentType",
    "securityOrCompany",
    "reportDate",
    "recommendation",
    "currentPrice",
    "targetPrice",
    "timeHorizon",
    "valuation",
    "keyRationale",
    "riskFactors",
    "keyFacts",
    "sourceWarnings",
  ],
} as const;

const RegulatorySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: {
      type: ["string", "null"],
    },
    authority: {
      type: ["string", "null"],
    },
    circularOrReferenceNumber: {
      type: ["string", "null"],
    },
    subject: {
      type: ["string", "null"],
    },
    issueDate: {
      type: ["string", "null"],
    },
    effectiveDate: {
      type: ["string", "null"],
    },
    applicability: {
      type: ["string", "null"],
    },
    affectedProductsOrUsers: {
      type: ["string", "null"],
    },
    requiredActions: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 6,
    },
    deadlines: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 4,
    },
    keyFacts: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 6,
    },
    sourceWarnings: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 4,
    },
  },
  required: [
    "documentType",
    "authority",
    "circularOrReferenceNumber",
    "subject",
    "issueDate",
    "effectiveDate",
    "applicability",
    "affectedProductsOrUsers",
    "requiredActions",
    "deadlines",
    "keyFacts",
    "sourceWarnings",
  ],
} as const;

const GenericSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: {
      type: ["string", "null"],
    },
    topicOrProduct: {
      type: ["string", "null"],
    },
    dateOrTimeline: {
      type: ["string", "null"],
    },
    audienceOrApplicability: {
      type: ["string", "null"],
    },
    keyMessage: {
      type: ["string", "null"],
    },
    keyFacts: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 6,
    },
    requiredActions: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 5,
    },
    riskOrLimitations: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 4,
    },
    sourceWarnings: {
      type: "array",
      items: {
        type: "string",
      },
      maxItems: 4,
    },
  },
  required: [
    "documentType",
    "topicOrProduct",
    "dateOrTimeline",
    "audienceOrApplicability",
    "keyMessage",
    "keyFacts",
    "requiredActions",
    "riskOrLimitations",
    "sourceWarnings",
  ],
} as const;

export default async (
  request: Request
) => {
  console.log(
    "extract-pdf-facts version: manual-json-schema-2026-08-11"
  );
  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  const openaiApiKey =
    process.env.OPENAI_API_KEY;

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!openaiApiKey) {
    console.error(
      "OPENAI_API_KEY is missing."
    );

    return jsonResponse(500, {
      success: false,
      error:
        "Fact extraction service is not configured.",
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase environment variables are missing.",
      {
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseKey),
      }
    );

    return jsonResponse(500, {
      success: false,
      error:
        "Fact extraction service is not configured.",
    });
  }

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authHeader ||
    !authHeader
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return jsonResponse(401, {
      success: false,
      error:
        "Authentication required.",
    });
  }

  const token =
    authHeader.slice(7).trim();

  const supabase =
    createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      }
    );

  const {
    data: userData,
    error: userError,
  } =
    await supabase.auth
      .getUser(token);

  if (
    userError ||
    !userData.user
  ) {
    return jsonResponse(401, {
      success: false,
      error:
        "Invalid or expired session. Please sign in again.",
    });
  }

  let body: RequestBody;

  try {
    body =
      (await request.json()) as RequestBody;
  } catch {
    return jsonResponse(400, {
      success: false,
      error:
        "Invalid request body.",
    });
  }

  const communicationId =
    body.communicationId?.trim();

  const category =
    body.category;

  const relevantText =
    body.relevantText?.trim() || "";

  if (
    !communicationId ||
    !category ||
    !relevantText
  ) {
    return jsonResponse(400, {
      success: false,
      error:
        "Communication, category and processed PDF text are required.",
    });
  }

  if (
    relevantText.length >
    MAX_SOURCE_CHARS
  ) {
    return jsonResponse(413, {
      success: false,
      error:
        `Processed source text exceeds the ${MAX_SOURCE_CHARS.toLocaleString()} character limit.`,
    });
  }

  /**
   * Verify this communication belongs
   * to the authenticated creator.
   */
  const {
    data: communication,
    error: communicationError,
  } =
    await supabase
      .from("communications")
      .select(
        "id, created_by, category"
      )
      .eq(
        "id",
        communicationId
      )
      .single();

  if (
    communicationError ||
    !communication
  ) {
    return jsonResponse(404, {
      success: false,
      error:
        "Communication not found.",
    });
  }

  if (
    communication.created_by !==
    userData.user.id
  ) {
    return jsonResponse(403, {
      success: false,
      error:
        "You do not have access to this communication.",
    });
  }

  const openai =
    new OpenAI({
      apiKey:
        openaiApiKey,
    });

  const schema =
    category === "research"
      ? ResearchSchema
      : category ===
          "regulatory"
        ? RegulatorySchema
        : GenericSchema;

  const schemaName =
    category === "research"
      ? "research_facts"
      : category ===
          "regulatory"
        ? "regulatory_facts"
        : "communication_facts";

  const instructions =
    getExtractionInstructions(
      category
    );

  try {
    const completion =
      await openai.chat.completions.create({
        model:
          "gpt-4.1-nano",

        temperature: 0,

        messages: [
          {
            role: "system",
            content:
              instructions,
          },
          {
            role: "user",
            content:
              `Extract facts only from the source below.\n\nSOURCE:\n${relevantText}`,
          },
        ],

        response_format: {
          type:
            "json_schema",

          json_schema: {
            name:
              schemaName,

            strict:
              true,

            schema,
          },
        },
      });

    const message =
      completion.choices[0]
        ?.message;

    if (
      message?.refusal
    ) {
      return jsonResponse(422, {
        success: false,
        error:
          "The model could not extract facts from this document.",
      });
    }

    const content =
      message?.content;

    if (!content) {
      return jsonResponse(502, {
        success: false,
        error:
          "Fact extraction returned no structured data.",
      });
    }

    let facts:
      Record<string, unknown>;

    try {
      facts =
        JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Unable to parse structured fact JSON:",
        parseError
      );

      return jsonResponse(502, {
        success: false,
        error:
          "Fact extraction returned invalid structured data.",
      });
    }

    const usage =
      completion.usage;

    console.log(
      "PDF fact extraction completed",
      {
        communicationId,
        category,
        sourceCharacters:
          relevantText.length,
        promptTokens:
          usage?.prompt_tokens ??
          null,
        completionTokens:
          usage?.completion_tokens ??
          null,
        totalTokens:
          usage?.total_tokens ??
          null,
      }
    );

    return jsonResponse(200, {
      success: true,
      facts,

      usage: {
        sourceCharacters:
          relevantText.length,

        promptTokens:
          usage?.prompt_tokens ??
          null,

        completionTokens:
          usage?.completion_tokens ??
          null,

        totalTokens:
          usage?.total_tokens ??
          null,

        model:
          "gpt-4.1-nano",
      },
    });
  } catch (error) {
    console.error(
      "Structured fact extraction failed:",
      error
    );

    return jsonResponse(502, {
      success: false,
      error:
        "Unable to extract structured facts from the PDF.",
    });
  }
};

function getExtractionInstructions(
  category: Category
) {
  const common = `
You extract factual information from source documents for a regulated financial-services communication workflow.

STRICT RULES:
- Use ONLY information explicitly supported by the supplied source.
- Never use outside knowledge.
- Never guess or fill gaps.
- Never create prices, dates, recommendations, percentages, deadlines or product claims.
- If a scalar fact is not present, return null.
- If a list has no supported items, return an empty array.
- Keep list items short and factual.
- Preserve the source's meaning and terminology.
- Do not calculate upside/downside or derive new financial metrics.
- If the source is internally inconsistent, mention that briefly in sourceWarnings.
`;

  if (
    category === "research"
  ) {
    return `${common}

RESEARCH-SPECIFIC:
Extract the company/security, report date, recommendation, CMP/current price, target price, time horizon, valuation language, key rationale, risks and other important research facts. A recommendation must be taken exactly from the source; do not normalize it into Buy/Sell/Hold unless the source itself uses that recommendation.`;
  }

  if (
    category ===
    "regulatory"
  ) {
    return `${common}

REGULATORY-SPECIFIC:
Extract the issuing authority, circular/reference number, subject, dates, applicability, affected products/users, explicit actions and deadlines. Do not infer compliance obligations that are not stated.`;
  }

  return `${common}

Extract only the main source-supported topic, audience/applicability, dates/timeline, message, facts, actions and limitations relevant to the selected communication category: ${category}.`;
}

function jsonResponse(
  status: number,
  body: unknown
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store",
      },
    }
  );
}
