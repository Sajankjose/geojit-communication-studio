import {
  getCommunicationById,
  updateCommunication,
} from "./communications";

import {
  supabase,
} from "../../lib/supabase";

export type GuidedInputType =
  | "text"
  | "voice"
  | "document";

export interface GuidedRawInput {
  inputType:
    GuidedInputType;

  content:
    string;

  originalTranscript?:
    string | null;

  language?:
    string | null;
}

export interface GuidedUnderstanding {
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
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding"
    | null;

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

export interface GuidedUnderstandingResponse {
  success:
    boolean;

  understanding:
    GuidedUnderstanding;
}

/**
 * Store the Creator's raw idea inside the existing
 * communications.input_data JSON object.
 *
 * No schema change is required for this Phase 2 checkpoint.
 */
export async function saveGuidedRawInput({
  communicationId,
  rawInput,
  starterId,
}: {
  communicationId:
    string;

  rawInput:
    GuidedRawInput;

  starterId:
    string | null;
}) {
  const communication =
    await getCommunicationById(
      communicationId
    );

  const currentInput =
    communication.input_data ||
    {};

  return updateCommunication(
    communicationId,
    {
      input_data: {
        ...currentInput,

        creationMode:
          "guided",

        guided: {
          ...(
            typeof currentInput.guided ===
              "object" &&
            currentInput.guided !==
              null &&
            !Array.isArray(
              currentInput.guided
            )
              ? currentInput.guided
              : {}
          ),

          starterId,

          rawInput,

          capturedAt:
            new Date().toISOString(),
        },
      },
    }
  );
}


/**
 * Call the isolated Guided Idea Understanding function.
 *
 * This function does NOT generate communication copy.
 * Its only job is to understand what the employee means.
 */
export async function understandGuidedInput({
  communicationId,
  rawInput,
  starterId,
}: {
  communicationId:
    string;

  rawInput:
    GuidedRawInput;

  starterId:
    string | null;
}): Promise<GuidedUnderstandingResponse> {
  const {
    data: sessionData,
    error:
      sessionError,
  } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      sessionError.message
    );
  }

  const accessToken =
    sessionData.session
      ?.access_token;

  if (!accessToken) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response =
    await fetch(
      "/.netlify/functions/understand-guided-input",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body:
          JSON.stringify({
            communicationId,
            rawInput,
            starterId,
          }),
      }
    );

  const payload =
    await response.json()
      .catch(
        () => null
      );

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ||
      "Unable to understand the idea. Please try again."
    );
  }

  return payload as GuidedUnderstandingResponse;
}

export interface GuidedBriefData {
  audience:
    string;

  purpose:
    | "awareness"
    | "education"
    | "action"
    | "update"
    | "explanation";

  personalisation: {
    mode:
      | "brand"
      | "branch"
      | "customer";
  };

  channels: Array<
    | "email"
    | "whatsapp"
    | "leaflet"
  >;
}

/**
 * Save the confirmed Guided Brief inside the existing
 * communications.input_data JSON structure.
 *
 * No database schema change is required.
 */
export async function saveGuidedBrief({
  communicationId,
  brief,
}: {
  communicationId:
    string;

  brief:
    GuidedBriefData;
}) {
  const communication =
    await getCommunicationById(
      communicationId
    );

  const currentInput =
    communication.input_data ||
    {};

  const currentGuided =
    (
      currentInput.guided &&
      typeof currentInput.guided ===
        "object" &&
      !Array.isArray(
        currentInput.guided
      )
    )
      ? currentInput.guided as Record<string, unknown>
      : {};

  return updateCommunication(
    communicationId,
    {
      audience:
        brief.audience,

      objective:
        brief.purpose,

      input_data: {
        ...currentInput,

        creationMode:
          "guided",

        guided: {
          ...currentGuided,

          brief,

          briefConfirmedAt:
            new Date().toISOString(),
        },
      },

      classification_data: {
        ...(
          communication.classification_data ||
          {}
        ),

        creationMode:
          "guided",

        guidedPurpose:
          brief.purpose,

        guidedChannels:
          brief.channels,

        personalisationMode:
          brief.personalisation.mode,
      },
    }
  );
}
