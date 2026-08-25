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

export interface CommunicationMaster {
  version:
    1;

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

  customerContext: {
    situation:
      string | null;

    concern:
      string | null;
  };

  creatorKnowledge: {
    insight:
      string | null;

    rawInput:
      GuidedRawInput | null;
  };

  desiredOutcome:
    string | null;

  verifiedFacts:
    Array<{
      label:
        string;

      value:
        string;

      source:
        "creator_confirmed";
    }>;

  unresolvedInformation:
    string[];

  governance: {
    status:
      "master_ready";

    userConfirmedUnderstanding:
      true;

    generatedAt:
      string;
  };
}


/**
 * Build a deterministic Communication Master from the
 * already-confirmed Guided understanding + Guided Brief.
 *
 * IMPORTANT:
 * - No AI call occurs here.
 * - No facts are invented.
 * - No marketing copy is created.
 * - Existing Expert generation remains untouched.
 */
export async function buildCommunicationMaster(
  communicationId:
    string
): Promise<CommunicationMaster> {
  const communication =
    await getCommunicationById(
      communicationId
    );

  const inputData =
    communication.input_data ||
    {};

  const guided =
    (
      inputData.guided &&
      typeof inputData.guided ===
        "object" &&
      !Array.isArray(
        inputData.guided
      )
    )
      ? inputData.guided as Record<string, any>
      : {};

  const understanding =
    (
      guided.understanding &&
      typeof guided.understanding ===
        "object" &&
      !Array.isArray(
        guided.understanding
      )
    )
      ? guided.understanding as Record<string, any>
      : {};

  const brief =
    (
      guided.brief &&
      typeof guided.brief ===
        "object" &&
      !Array.isArray(
        guided.brief
      )
    )
      ? guided.brief as Record<string, any>
      : {};

  const rawInput =
    (
      guided.rawInput &&
      typeof guided.rawInput ===
        "object" &&
      !Array.isArray(
        guided.rawInput
      )
    )
      ? guided.rawInput as GuidedRawInput
      : null;

  if (
    typeof understanding.coreIdea !==
      "string" ||
    !understanding.coreIdea.trim()
  ) {
    throw new Error(
      "The guided idea has not been understood yet."
    );
  }

  if (
    typeof brief.audience !==
      "string" ||
    !brief.audience.trim()
  ) {
    throw new Error(
      "The guided audience has not been confirmed yet."
    );
  }

  if (
    typeof brief.purpose !==
      "string"
  ) {
    throw new Error(
      "The guided purpose has not been confirmed yet."
    );
  }

  const channels =
    Array.isArray(
      brief.channels
    )
      ? brief.channels.filter(
          (item):
            item is
              | "email"
              | "whatsapp"
              | "leaflet" =>
            item ===
              "email" ||
            item ===
              "whatsapp" ||
            item ===
              "leaflet"
        )
      : [];

  if (
    channels.length ===
      0
  ) {
    throw new Error(
      "At least one communication channel is required."
    );
  }

  const category =
    isGuidedCategory(
      understanding.suggestedCategory
    )
      ? understanding.suggestedCategory
      : null;

  const personalisationMode =
    brief.personalisation &&
    typeof brief.personalisation ===
      "object" &&
    (
      brief.personalisation.mode ===
        "brand" ||
      brief.personalisation.mode ===
        "branch" ||
      brief.personalisation.mode ===
        "customer"
    )
      ? brief.personalisation.mode
      : "brand";

  /**
   * Only explicit statements already captured from the user
   * are represented here. They are NOT treated as externally
   * verified financial facts.
   */
  const verifiedFacts:
    CommunicationMaster["verifiedFacts"] = [];

  const unresolvedInformation =
    Array.isArray(
      understanding.missingInformation
    )
      ? understanding.missingInformation
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
                "string" &&
              Boolean(
                item.trim()
              )
          )
      : [];

  const master:
    CommunicationMaster = {
      version:
        1,

      sourceMode:
        "guided",

      category,

      coreIdea:
        understanding.coreIdea.trim(),

      audience:
        brief.audience.trim(),

      purpose:
        brief.purpose,

      personalisation: {
        mode:
          personalisationMode,
      },

      channels,

      customerContext: {
        situation:
          typeof understanding.customerSituation ===
            "string" &&
          understanding.customerSituation.trim()
            ? understanding.customerSituation.trim()
            : null,

        concern:
          typeof understanding.customerConcern ===
            "string" &&
          understanding.customerConcern.trim()
            ? understanding.customerConcern.trim()
            : null,
      },

      creatorKnowledge: {
        insight:
          typeof understanding.creatorInsight ===
            "string" &&
          understanding.creatorInsight.trim()
            ? understanding.creatorInsight.trim()
            : null,

        rawInput,
      },

      desiredOutcome:
        typeof understanding.desiredOutcome ===
          "string" &&
        understanding.desiredOutcome.trim()
          ? understanding.desiredOutcome.trim()
          : null,

      verifiedFacts,

      unresolvedInformation,

      governance: {
        status:
          "master_ready",

        userConfirmedUnderstanding:
          true,

        generatedAt:
          new Date().toISOString(),
      },
    };

  await updateCommunication(
    communicationId,
    {
      audience:
        master.audience,

      objective:
        master.desiredOutcome ||
        master.purpose,

      category:
        communication.category,

      input_data: {
        ...inputData,

        creationMode:
          "guided",

        communicationMaster:
          master,

        guided: {
          ...guided,

          masterReadyAt:
            master.governance.generatedAt,
        },
      },

      classification_data: {
        ...(
          communication.classification_data ||
          {}
        ),

        creationMode:
          "guided",

        communicationMasterVersion:
          1,

        suggestedCategory:
          category,

        guidedChannels:
          channels,

        personalisationMode:
          personalisationMode,
      },
    }
  );

  return master;
}


function isGuidedCategory(
  value:
    unknown
): value is NonNullable<
  CommunicationMaster["category"]
> {
  return [
    "research",
    "education",
    "product",
    "service",
    "regulatory",
    "onboarding",
  ].includes(
    String(value)
  );
}
