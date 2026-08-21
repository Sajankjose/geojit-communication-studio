import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const MAX_SOURCE_CHARS = 12000;

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
    "extract-pdf-facts version: accuracy-upgrade-2026-08-21"
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
      .limit(1)
      .maybeSingle();

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
          "gpt-4.1-mini",

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
          "gpt-4.1-mini",
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
You are a factual extraction engine for a regulated
financial-services communication workflow.

Your job is NOT to write an email.

Your job is NOT to improve the source.

Your job is to identify the exact facts that a human
reviewer should verify before communication generation.

============================================================
SOURCE AUTHORITY
============================================================

The supplied source document is the only authority.

Use ONLY information explicitly supported by the source.

Never use:
- outside knowledge
- assumptions
- previous knowledge about the company or product
- inferred dates
- inferred prices
- inferred recommendations
- inferred eligibility
- inferred product behaviour

============================================================
FACT PRESERVATION
============================================================

Preserve exactly where material:

- names
- numbers
- percentages
- currencies
- recommendations
- price values
- target values
- dates
- time horizons
- product names
- feature names
- regulatory references
- authority names
- deadlines
- conditions
- limitations

Do not silently normalise factual terminology.

Examples:

If the source says:
"ACCUMULATE"

do not change it to:
"BUY"

If the source says:
"₹1,250"

do not change it to:
"Rs. 1,250"

unless formatting changes are explicitly requested later.

============================================================
NO DERIVED FACTS
============================================================

Do NOT calculate:

- upside
- downside
- return
- CAGR
- percentage change
- valuation multiples
- time difference

unless that exact calculated value is explicitly written
in the source.

============================================================
FACT COMPLETENESS
============================================================

Review the entire supplied source text.

Do not focus only on the beginning of the document.

Capture material facts appearing in:

- headings
- tables represented as extracted text
- recommendation summaries
- product explanations
- feature descriptions
- conditions
- risk sections
- footnotes
- action sections
- closing sections

Do not omit a material fact simply because similar
information appeared earlier.

============================================================
AMBIGUITY AND CONFLICTS
============================================================

If two values conflict:

- do not choose one silently;
- preserve the safest supported value where the schema permits;
- add a clear entry to sourceWarnings.

If a scalar fact is absent:
return null.

If a list has no supported items:
return [].

Never fill gaps.

============================================================
LIST QUALITY
============================================================

For rationale, risks, facts, actions and limitations:

- keep each item short;
- keep each item factual;
- avoid merging unrelated facts into one bullet;
- avoid repeating the same fact in different wording;
- prefer source terminology;
- retain material qualifiers such as "subject to",
  "up to", "from", "effective", "may", "expected",
  "approximately", or similar wording when present.

============================================================
WRITING STYLE
============================================================

Extract facts in concise, professional Indian business
English.

Keep the source meaning and terminology.

List items should be factual statements, not promotional
copy.

Do not add:
- marketing claims
- interpretations
- recommendations
- advice
- persuasive language

============================================================
FINAL SELF-CHECK
============================================================

Before returning the structured result, verify:

1. Every number exists in the source.
2. Every date exists in the source.
3. Every recommendation exists in the source.
4. Every product capability exists in the source.
5. Every deadline or required action exists in the source.
6. Material risks and conditions have not been dropped.
7. Nothing has been inferred from outside knowledge.
8. Conflicting values are surfaced in sourceWarnings.
`;

  if (
    category === "research"
  ) {
    return `${common}

RESEARCH-SPECIFIC:

Extract and preserve:

- document/report type
- company/security name
- report date
- exact recommendation
- CMP/current market price
- target price
- time horizon
- valuation language
- key investment rationale
- material risks
- other decision-relevant research facts

Important rules:

- Recommendation must be reproduced exactly from the source.
- Do not convert ACCUMULATE to BUY.
- Do not convert REDUCE to SELL.
- Do not calculate upside or downside.
- If the source contains multiple target prices, CMP values,
  or recommendations, do not silently choose one; add a
  sourceWarnings item describing the conflict.
- Preserve qualifiers around forecasts, targets and outlook.
- Risk factors must come from the source, not from general
  market knowledge.
- keyRationale should contain distinct source-supported
  investment drivers, not generic summaries.
- keyFacts should capture other material report facts that are
  important for human verification but do not fit another field.`;
  }

  if (
    category ===
    "regulatory"
  ) {
    return `${common}

REGULATORY-SPECIFIC:

Extract and preserve:

- issuing authority
- circular/reference number
- subject
- issue date
- effective date
- applicability
- affected products/users
- explicit required actions
- explicit deadlines
- other material regulatory facts

Important rules:

- Do not infer an obligation that is not explicitly stated.
- Preserve "shall", "must", "may", "with effect from", and
  similar obligation/timing language where material.
- Do not invent affected users or products.
- Do not silently resolve conflicting dates or references.
- If the source contains a conflict or ambiguity, record it in
  sourceWarnings.
- requiredActions must only contain actions explicitly stated
  in the source.
- deadlines must only contain explicit source deadlines.`;
  }

  return `${common}

CATEGORY-SPECIFIC EXTRACTION:

Selected category:
${category}

Extract only source-supported information relevant to this
communication category.

Capture:

- document type
- main topic/product
- dates or timeline
- audience/applicability
- central factual message
- material key facts
- explicit customer/user actions
- material risks, conditions or limitations

For Product & Sales:
- preserve exact feature names
- preserve exact capabilities
- preserve pricing/offer/eligibility only when explicit
- capture conditions and limitations
- never infer how a feature works

For Service & Transactional:
- preserve affected service
- preserve dates/times
- preserve customer impact
- preserve required actions
- do not invent outage duration

For Investor Education:
- extract factual concepts and examples
- do not convert educational material into advice

For Onboarding:
- preserve journey stage, required steps, eligibility,
  deadlines and supplied support information

If information is absent:
return null or [] according to the schema.

Do not generate polished communication copy here.`;
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
