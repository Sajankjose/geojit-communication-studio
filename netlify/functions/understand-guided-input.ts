import {
  createUserSupabaseClient,
} from "./ai/supabaseServer";

type GuidedCategory =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface GuidedRawInput {
  inputType:
    | "text"
    | "voice"
    | "document";

  content:
    string;

  originalTranscript?:
    string | null;

  language?:
    string | null;
}

interface UnderstandGuidedRequest {
  communicationId:
    string;

  rawInput:
    GuidedRawInput;

  starterId?:
    string | null;
}

interface GuidedUnderstanding {
  summary:
    string;

  customerSituation:
    string | null;

  customerConcern:
    string | null;

  creatorInsight:
    string | null;

  coreIdea:
    string;

  intendedAudience:
    string | null;

  desiredOutcome:
    string | null;

  suggestedCategory:
    GuidedCategory | null;

  confidence:
    "high"
    | "medium"
    | "low";

  needsFollowUp:
    boolean;

  missingInformation:
    string[];

  nextQuestion:
    string | null;

  suggestedAnswers:
    string[];
}

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

function asRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function parseJsonObject(
  value: string
): Record<string, unknown> {
  const trimmed =
    value.trim();

  try {
    return JSON.parse(
      trimmed
    );
  } catch {
    /**
     * Models occasionally surround JSON with a fenced block.
     * Strip only the outer fence; do not attempt broad repair.
     */
    const unfenced =
      trimmed
        .replace(
          /^```(?:json)?\s*/i,
          ""
        )
        .replace(
          /\s*```$/,
          ""
        )
        .trim();

    return JSON.parse(
      unfenced
    );
  }
}

function normalizeUnderstanding(
  raw:
    Record<string, unknown>
): GuidedUnderstanding {
  const allowedCategories:
    GuidedCategory[] = [
      "research",
      "education",
      "product",
      "service",
      "regulatory",
      "onboarding",
    ];

  const suggestedCategory =
    typeof raw.suggestedCategory ===
      "string" &&
    allowedCategories.includes(
      raw.suggestedCategory as GuidedCategory
    )
      ? raw.suggestedCategory as GuidedCategory
      : null;

  const confidence =
    raw.confidence ===
      "high" ||
    raw.confidence ===
      "medium" ||
    raw.confidence ===
      "low"
      ? raw.confidence
      : "medium";

  const missingInformation =
    Array.isArray(
      raw.missingInformation
    )
      ? raw.missingInformation
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          )
          .slice(
            0,
            5
          )
      : [];

  const suggestedAnswers =
    Array.isArray(
      raw.suggestedAnswers
    )
      ? raw.suggestedAnswers
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          )
          .slice(
            0,
            5
          )
      : [];

  const needsFollowUp =
    Boolean(
      raw.needsFollowUp
    );

  return {
    summary:
      typeof raw.summary ===
        "string"
        ? raw.summary.trim()
        : "",

    customerSituation:
      typeof raw.customerSituation ===
        "string" &&
      raw.customerSituation.trim()
        ? raw.customerSituation.trim()
        : null,

    customerConcern:
      typeof raw.customerConcern ===
        "string" &&
      raw.customerConcern.trim()
        ? raw.customerConcern.trim()
        : null,

    creatorInsight:
      typeof raw.creatorInsight ===
        "string" &&
      raw.creatorInsight.trim()
        ? raw.creatorInsight.trim()
        : null,

    coreIdea:
      typeof raw.coreIdea ===
        "string"
        ? raw.coreIdea.trim()
        : "",

    intendedAudience:
      typeof raw.intendedAudience ===
        "string" &&
      raw.intendedAudience.trim()
        ? raw.intendedAudience.trim()
        : null,

    desiredOutcome:
      typeof raw.desiredOutcome ===
        "string" &&
      raw.desiredOutcome.trim()
        ? raw.desiredOutcome.trim()
        : null,

    suggestedCategory,

    confidence,

    needsFollowUp,

    missingInformation,

    nextQuestion:
      needsFollowUp &&
      typeof raw.nextQuestion ===
        "string" &&
      raw.nextQuestion.trim()
        ? raw.nextQuestion.trim()
        : null,

    suggestedAnswers,
  };
}

function buildUnderstandingPrompt({
  content,
  starterId,
}: {
  content: string;
  starterId:
    string | null;
}) {
  return `
You are the Idea Understanding layer inside a governed financial-services communication platform.

YOUR JOB:
Understand what an employee means.

YOU ARE NOT WRITING THE COMMUNICATION.
Do not create marketing copy, subject lines, WhatsApp copy, slogans, recommendations, promises, or calls to action.

The employee may:
- use poor grammar
- use incomplete sentences
- type very short notes
- mix English with an Indian language
- write transliterated local language using English characters
- repeat themselves
- explain something as if speaking to a colleague

Do not judge or correct their language.
Interpret meaning conservatively.

CRITICAL FINANCIAL-SERVICES DISCIPLINE:
- Never invent a financial fact.
- Never turn an observation into a recommendation.
- Never assume a product feature, return, price, eligibility, performance, target, deadline, regulatory requirement, or customer fact.
- Separate what the employee actually said from what is still missing.
- If an important point is unclear, ask ONE simple follow-up question.
- The follow-up question must be easy for a normal employee to answer.
- Avoid marketing jargon such as "objective", "persona", "proposition", "funnel", or "value proposition" in the question.
- Prefer questions such as "Who do you mainly have in mind?" or "What do customers usually worry about here?"
- Do not ask for information that can already be reasonably understood from the input.

CATEGORY GUIDANCE:
research = verified research/recommendation communication
education = explain an investing/market concept without product promotion
product = product, feature, offer, adoption or sales communication
service = operational/service/account/platform update
regulatory = regulation/compliance/mandatory requirement
onboarding = customer journey / next-step guidance

STARTER SELECTED:
${starterId || "none"}

EMPLOYEE'S RAW INPUT:
"""
${content}
"""

Return ONLY a valid JSON object with exactly this shape:

{
  "summary": "1-3 simple sentences explaining what you understood",
  "customerSituation": "what situation/behaviour the employee is seeing, or null",
  "customerConcern": "the customer's concern/question, or null",
  "creatorInsight": "what the employee knows/explains from experience, or null",
  "coreIdea": "the central idea worth communicating",
  "intendedAudience": "who this seems intended for, or null",
  "desiredOutcome": "what the employee seems to want the reader to understand/do, or null",
  "suggestedCategory": "research|education|product|service|regulatory|onboarding|null",
  "confidence": "high|medium|low",
  "needsFollowUp": true,
  "missingInformation": ["only important missing items"],
  "nextQuestion": "ONE plain-language follow-up question, or null",
  "suggestedAnswers": ["2-5 short optional answer choices when useful"]
}

Rules for needsFollowUp:
- true only when an important gap would materially affect the communication.
- false if there is already enough meaning to create a useful structured brief.
- If false, nextQuestion must be null and suggestedAnswers must be [].

Write the JSON values in clear, simple English even when the raw input is mixed-language.
Preserve the employee's intended meaning.
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
        success:
          false,

        error:
          "Method not allowed. Use POST.",
      },
      405
    );
  }

  const authorizationHeader =
    request.headers.get(
      "Authorization"
    );

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith(
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

  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "OpenAI API key is not configured.",
        },
        500
      );
    }

    const supabase =
      createUserSupabaseClient(
        authorizationHeader
      );

    const accessToken =
      authorizationHeader.replace(
        /^Bearer\s+/i,
        ""
      );

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
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

    const rawBody =
      await request.json();

    const body =
      rawBody as
        UnderstandGuidedRequest;

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
      !body.rawInput ||
      body.rawInput.inputType !==
        "text" ||
      typeof body.rawInput.content !==
        "string" ||
      body.rawInput.content.trim().length <
        20
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Please provide a little more information about the idea.",
        },
        400
      );
    }

    /**
     * Verify the authenticated user can access this draft.
     * RLS remains the ownership boundary.
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
          "id,status,created_by,input_data"
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

    if (
      communication.status !==
        "draft"
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Guided idea capture is available only while the communication is a draft.",
        },
        409
      );
    }

    const prompt =
      buildUnderstandingPrompt({
        content:
          body.rawInput.content.trim(),

        starterId:
          body.starterId ||
          null,
      });

    /**
     * Responses API.
     *
     * The model can be changed through Netlify:
     * GUIDED_UNDERSTANDING_MODEL
     *
     * gpt-5.6-terra is a balanced default for
     * nuanced idea understanding.
     */
    const openAiResponse =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${apiKey}`,
          },

          body:
            JSON.stringify({
              model:
                process.env.GUIDED_UNDERSTANDING_MODEL ||
                "gpt-5.6-terra",

              input:
                prompt,
            }),
        }
      );

    const openAiPayload =
      await openAiResponse.json()
        .catch(
          () => null
        );

    if (
      !openAiResponse.ok
    ) {
      console.error(
        "Guided understanding OpenAI error:",
        openAiPayload
      );

      return jsonResponse(
        {
          success:
            false,

          error:
            "Unable to understand the idea right now. Please try again.",
        },
        502
      );
    }

    /**
     * Responses API returns convenience output_text in SDKs,
     * but raw HTTP returns output items. Read the first
     * output_text content item conservatively.
     */
    const output =
      Array.isArray(
        openAiPayload?.output
      )
        ? openAiPayload.output
        : [];

    let outputText =
      "";

    for (
      const item of output
    ) {
      if (
        item?.type !==
          "message" ||
        !Array.isArray(
          item.content
        )
      ) {
        continue;
      }

      for (
        const contentItem of
        item.content
      ) {
        if (
          contentItem?.type ===
            "output_text" &&
          typeof contentItem.text ===
            "string"
        ) {
          outputText +=
            contentItem.text;
        }
      }
    }

    if (!outputText.trim()) {
      console.error(
        "Guided understanding returned no output text:",
        openAiPayload
      );

      return jsonResponse(
        {
          success:
            false,

          error:
            "AI returned an empty understanding. Please try again.",
        },
        502
      );
    }

    const parsed =
      parseJsonObject(
        outputText
      );

    const understanding =
      normalizeUnderstanding(
        parsed
      );

    if (
      !understanding.summary ||
      !understanding.coreIdea
    ) {
      console.error(
        "Guided understanding missing required fields:",
        parsed
      );

      return jsonResponse(
        {
          success:
            false,

          error:
            "AI could not structure the idea reliably. Please add a little more detail and try again.",
        },
        422
      );
    }

    /**
     * Store the interpretation alongside the raw input.
     * This keeps the original human input intact for audit
     * and lets the user confirm/correct AI understanding later.
     */
    const existingInput =
      asRecord(
        communication.input_data
      ) || {};

    const existingGuided =
      asRecord(
        existingInput.guided
      ) || {};

    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "communications"
        )
        .update({
          input_data: {
            ...existingInput,

            creationMode:
              "guided",

            guided: {
              ...existingGuided,

              starterId:
                body.starterId ||
                null,

              rawInput:
                body.rawInput,

              understanding,

              understoodAt:
                new Date().toISOString(),
            },
          },
        })
        .eq(
          "id",
          body.communicationId
        );

    if (
      updateError
    ) {
      console.error(
        "Unable to persist guided understanding:",
        updateError
      );

      return jsonResponse(
        {
          success:
            false,

          error:
            "The idea was understood, but could not be saved.",
        },
        500
      );
    }

    return jsonResponse({
      success:
        true,

      understanding,
    });
  } catch (error) {
    console.error(
      "Guided understanding error:",
      error
    );

    return jsonResponse(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to understand the idea.",
      },
      500
    );
  }
};
