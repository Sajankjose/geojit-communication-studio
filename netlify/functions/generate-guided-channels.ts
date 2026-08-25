import {
  createUserSupabaseClient,
} from "./ai/supabaseServer";

type Channel =
  | "email"
  | "whatsapp"
  | "leaflet";

type Variant =
  | "A"
  | "B"
  | "C";

interface CommunicationMaster {
  version:
    number;

  sourceMode:
    "guided";

  category:
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding"
    | null;

  coreIdea:
    string;

  audience:
    string;

  purpose:
    string;

  personalisation: {
    mode:
      "brand"
      | "branch"
      | "customer";
  };

  channels:
    Channel[];

  customerContext?: {
    situation?:
      string | null;

    concern?:
      string | null;
  };

  creatorKnowledge?: {
    insight?:
      string | null;
  };

  desiredOutcome?:
    string | null;

  verifiedFacts?:
    Array<{
      label:
        string;

      value:
        string;

      source:
        string;
    }>;

  unresolvedInformation?:
    string[];
}

interface GenerateGuidedChannelsRequest {
  communicationId:
    string;
}

const VARIANTS:
  Variant[] = [
    "A",
    "B",
    "C",
  ];

const CHANNEL_RULES:
  Record<
    Channel,
    {
      purpose: string;
      rules: string[];
      outputShape: string;
    }
  > = {
    email: {
      purpose:
        "Create a complete, structured and easy-to-read customer email.",

      rules: [
        "Use simple, customer-friendly language.",
        "Keep sentences reasonably short.",
        "Avoid unnecessary jargon.",
        "Do not repeat the same point across subject, headline and body.",
        "Use ₹ for Indian rupee amounts where appropriate.",
        "Use one clear CTA only when an action is appropriate.",
        "Do not invent facts, rates, returns, eligibility, deadlines or product claims.",
      ],

      outputShape:
        `{
          "channel": "email",
          "subject": "string",
          "preheader": "string",
          "headline": "string",
          "opening": "string",
          "bodySections": [
            {
              "heading": "string or null",
              "content": "string"
            }
          ],
          "keyPoints": ["string"],
          "cta": {
            "label": "string",
            "url": null
          } or null,
          "mandatoryNotes": ["string"]
        }`,
    },

    whatsapp: {
      purpose:
        "Create a short, mobile-first WhatsApp message that communicates one clear idea quickly.",

      rules: [
        "Use natural, respectful and conversational language.",
        "Lead with the most useful point.",
        "Keep paragraphs very short.",
        "Avoid email-style introductions.",
        "Prefer plain language.",
        "Use no emojis by default.",
        "Do not create urgency unless it already exists in the Communication Master.",
        "Do not invent facts, returns, rates or product claims.",
      ],

      outputShape:
        `{
          "channel": "whatsapp",
          "headline": "string or null",
          "message": "string",
          "keyPoints": ["string"],
          "cta": {
            "label": "string",
            "url": null
          } or null,
          "mandatoryNotes": ["string"]
        }`,
    },

    leaflet: {
      purpose:
        "Create compact, scannable leaflet/A4-style communication content.",

      rules: [
        "Use a clear headline rather than a clever headline.",
        "Keep supporting copy short.",
        "Use 3 to 5 concise titled points when useful.",
        "Keep the tone professional and customer-friendly.",
        "Avoid clutter and repetition.",
        "Do not invent statistics, financial facts or benefits.",
        "visualDirection is layout guidance only; do not invent a specific image asset.",
      ],

      outputShape:
        `{
          "channel": "leaflet",
          "headline": "string",
          "subheadline": "string or null",
          "intro": "string",
          "keyPoints": [
            {
              "title": "string",
              "description": "string"
            }
          ],
          "cta": {
            "label": "string",
            "supportingText": "string or null",
            "url": null
          } or null,
          "mandatoryNotes": ["string"],
          "visualDirection": "string or null"
        }`,
    },
  };

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
  value:
    unknown
): Record<string, unknown> | null {
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

function parseJsonObject(
  value:
    string
): Record<string, unknown> {
  const trimmed =
    value.trim();

  try {
    return JSON.parse(
      trimmed
    );
  } catch {
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

function extractOutputText(
  payload:
    any
) {
  const output =
    Array.isArray(
      payload?.output
    )
      ? payload.output
      : [];

  let text =
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
        text +=
          contentItem.text;
      }
    }
  }

  return text.trim();
}

function buildPrompt({
  master,
  channel,
}: {
  master:
    CommunicationMaster;

  channel:
    Channel;
}) {
  const channelRules =
    CHANNEL_RULES[
      channel
    ];

  return `
You are the channel adaptation layer inside a governed financial-services communication platform.

YOUR JOB:
Create three channel-specific variants from the SAME Communication Master.

The Communication Master is the source of truth.
Do not independently reinterpret the business idea.

CRITICAL GOVERNANCE RULES:
- Preserve the same core meaning across all variants.
- Preserve every financial fact exactly.
- Do not invent facts, rates, returns, eligibility, deadlines, offers, product features, recommendations, customer data or regulatory claims.
- Do not make the message stronger than the Communication Master supports.
- Do not convert employee experience into a verified financial fact.
- If the Communication Master has unresolvedInformation, do not guess those details.
- If there are no verifiedFacts, do not present numerical/product claims as independently verified.
- Keep the communication customer-friendly, simple and grammatically correct.
- Do not expose internal words such as "Communication Master", "raw input", "AI understanding", "source extracted", "guided mode" or "governance layer" to the customer.
- Personalisation mode:
  - brand = communicate in Geojit's institutional voice.
  - branch = warmer and more human, but still clearly within Geojit governance.
  - customer = prepare wording that can later accept customer-level personalisation; do not invent customer attributes.

CHANNEL:
${channel}

CHANNEL PURPOSE:
${channelRules.purpose}

CHANNEL RULES:
${channelRules.rules
  .map(
    (rule) =>
      `- ${rule}`
  )
  .join("\n")}

COMMUNICATION MASTER:
${JSON.stringify(
  master,
  null,
  2
)}

VARIANT BEHAVIOUR:
- Variant A: Clear and balanced.
- Variant B: More concise and direct.
- Variant C: More explanatory and reassuring.
- All three variants must remain factually and semantically aligned.

Return ONLY valid JSON in exactly this structure:

{
  "variants": {
    "A": ${channelRules.outputShape},
    "B": ${channelRules.outputShape},
    "C": ${channelRules.outputShape}
  }
}
`;
}

function validateChannelContent(
  channel:
    Channel,
  value:
    unknown
) {
  const data =
    asRecord(
      value
    );

  if (!data) {
    throw new Error(
      `Invalid ${channel} output.`
    );
  }

  if (
    data.channel !==
      channel
  ) {
    throw new Error(
      `Generated output channel mismatch for ${channel}.`
    );
  }

  if (
    channel ===
      "email"
  ) {
    requireString(
      data.subject,
      "Email subject"
    );

    requireString(
      data.preheader,
      "Email preheader"
    );

    requireString(
      data.headline,
      "Email headline"
    );

    requireString(
      data.opening,
      "Email opening"
    );
  }

  if (
    channel ===
      "whatsapp"
  ) {
    requireString(
      data.message,
      "WhatsApp message"
    );
  }

  if (
    channel ===
      "leaflet"
  ) {
    requireString(
      data.headline,
      "Leaflet headline"
    );

    requireString(
      data.intro,
      "Leaflet intro"
    );
  }

  return data;
}

function requireString(
  value:
    unknown,
  label:
    string
) {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${label} is required.`
    );
  }
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

    const rawBody =
      await request.json();

    const body =
      rawBody as
        GenerateGuidedChannelsRequest;

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
            "Channel generation is available only while the communication is a draft.",
        },
        409
      );
    }

    const inputData =
      asRecord(
        communication.input_data
      ) || {};

    const master =
      asRecord(
        inputData.communicationMaster
      ) as
        CommunicationMaster | null;

    if (
      !master ||
      master.sourceMode !==
        "guided" ||
      !master.coreIdea ||
      !Array.isArray(
        master.channels
      ) ||
      master.channels.length ===
        0
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Communication Master is missing or incomplete.",
        },
        400
      );
    }

    const selectedChannels =
      master.channels.filter(
        (
          channel
        ): channel is Channel =>
          channel ===
            "email" ||
          channel ===
            "whatsapp" ||
          channel ===
            "leaflet"
      );

    const generatedSummary:
      Array<{
        channel:
          Channel;

        variants:
          number;
      }> = [];

    for (
      const channel of
      selectedChannels
    ) {
      const prompt =
        buildPrompt({
          master,
          channel,
        });

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
                  process.env.GUIDED_CHANNEL_MODEL ||
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
          `OpenAI ${channel} generation failed:`,
          openAiPayload
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              `Unable to generate ${channel} content.`,
          },
          502
        );
      }

      const outputText =
        extractOutputText(
          openAiPayload
        );

      if (
        !outputText
      ) {
        return jsonResponse(
          {
            success:
              false,

            error:
              `AI returned an empty ${channel} output.`,
          },
          502
        );
      }

      const parsed =
        parseJsonObject(
          outputText
        );

      const variants =
        asRecord(
          parsed.variants
        );

      if (!variants) {
        return jsonResponse(
          {
            success:
              false,

            error:
              `AI returned an invalid ${channel} variant structure.`,
          },
          422
        );
      }

      const rows =
        VARIANTS.map(
          (
            variant
          ) => {
            const content =
              validateChannelContent(
                channel,
                variants[
                  variant
                ]
              );

            return {
              communication_id:
                body.communicationId,

              channel,

              variant,

              language_code:
                "en",

              source_master_version:
                master.version ||
                1,

              status:
                "generated",

              content_json:
                content,

              generation_metadata: {
                model:
                  process.env.GUIDED_CHANNEL_MODEL ||
                  "gpt-5.6-terra",

                generated_at:
                  new Date().toISOString(),

                source_mode:
                  "guided",

                master_version:
                  master.version ||
                  1,
              },

              created_by:
                userData.user.id,
            };
          }
        );

      const {
        error:
          upsertError,
      } =
        await supabase
          .from(
            "communication_channel_outputs"
          )
          .upsert(
            rows,
            {
              onConflict:
                "communication_id,channel,language_code,variant",
            }
          );

      if (
        upsertError
      ) {
        console.error(
          `Unable to save ${channel} variants:`,
          upsertError
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              `Generated ${channel} content could not be saved.`,
          },
          500
        );
      }

      generatedSummary.push({
        channel,

        variants:
          3,
      });
    }

    const existingGuided =
      asRecord(
        inputData.guided
      ) || {};

    const {
      error:
        communicationUpdateError,
    } =
      await supabase
        .from(
          "communications"
        )
        .update({
          input_data: {
            ...inputData,

            guided: {
              ...existingGuided,

              channelGeneration: {
                status:
                  "ready",

                generatedAt:
                  new Date().toISOString(),

                channels:
                  generatedSummary,
              },
            },
          },
        })
        .eq(
          "id",
          body.communicationId
        );

    if (
      communicationUpdateError
    ) {
      console.error(
        "Unable to store channel generation summary:",
        communicationUpdateError
      );
    }

    return jsonResponse({
      success:
        true,

      communicationId:
        body.communicationId,

      generated:
        generatedSummary,
    });
  } catch (error) {
    console.error(
      "Guided channel generation error:",
      error
    );

    return jsonResponse(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to generate channel outputs.",
      },
      500
    );
  }
};
