import {
  supabase,
} from "../../../lib/supabase";

import {
  CommunicationChannel,
  CommunicationChannelOutputRecord,
  CommunicationVariant,
} from "./channelOutputTypes";

export interface GuidedApprovalPackage {
  version:
    1;

  communicationId:
    string;

  sourceMode:
    "guided";

  languageCode:
    "en";

  selectedOutputs:
    Array<{
      outputId:
        string;

      channel:
        CommunicationChannel;

      variant:
        CommunicationVariant;

      content:
        CommunicationChannelOutputRecord["content_json"];
    }>;

  channels:
    CommunicationChannel[];

  createdAt:
    string;

  status:
    "ready_for_submission";
}


/**
 * Build one approval package from the selected channel outputs.
 *
 * No approval action is created here yet.
 * This is the safe checkpoint before connecting Guided Mode
 * to the existing Marketing -> CorpCom workflow.
 */
export async function buildGuidedApprovalPackage(
  communicationId:
    string
): Promise<GuidedApprovalPackage> {
  const {
    data:
      outputs,

    error:
      outputsError,
  } =
    await supabase
      .from(
        "communication_channel_outputs"
      )
      .select(
        "*"
      )
      .eq(
        "communication_id",
        communicationId
      )
      .eq(
        "language_code",
        "en"
      )
      .eq(
        "status",
        "selected"
      )
      .order(
        "channel",
        {
          ascending:
            true,
        }
      );

  if (
    outputsError
  ) {
    throw new Error(
      outputsError.message
    );
  }

  const selected =
    (
      outputs ||
      []
    ) as
      CommunicationChannelOutputRecord[];

  if (
    selected.length ===
      0
  ) {
    throw new Error(
      "No selected channel outputs were found."
    );
  }

  const duplicateChannels =
    selected
      .map(
        (item) =>
          item.channel
      )
      .filter(
        (
          channel,
          index,
          array
        ) =>
          array.indexOf(
            channel
          ) !== index
      );

  if (
    duplicateChannels.length >
      0
  ) {
    throw new Error(
      "More than one selected variant exists for a channel. Please review the channel selections."
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
        "input_data"
      )
      .eq(
        "id",
        communicationId
      )
      .limit(1)
      .maybeSingle();

  if (
    communicationError
  ) {
    throw new Error(
      communicationError.message
    );
  }

  if (
    !communication
  ) {
    throw new Error(
      "Communication not found."
    );
  }

  const inputData =
    (
      communication.input_data &&
      typeof communication.input_data ===
        "object" &&
      !Array.isArray(
        communication.input_data
      )
    )
      ? communication.input_data as Record<string, any>
      : {};

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

  const approvalPackage:
    GuidedApprovalPackage = {
      version:
        1,

      communicationId,

      sourceMode:
        "guided",

      languageCode:
        "en",

      selectedOutputs:
        selected.map(
          (item) => ({
            outputId:
              item.id,

            channel:
              item.channel,

            variant:
              item.variant,

            content:
              item.content_json,
          })
        ),

      channels:
        selected.map(
          (item) =>
            item.channel
        ),

      createdAt:
        new Date().toISOString(),

      status:
        "ready_for_submission",
    };

  const {
    error:
      saveError,
  } =
    await supabase
      .from(
        "communications"
      )
      .update({
        input_data: {
          ...inputData,

          guided: {
            ...guided,

            approvalPackage,

            approvalPackageReadyAt:
              approvalPackage.createdAt,
          },
        },
      })
      .eq(
        "id",
        communicationId
      );

  if (
    saveError
  ) {
    throw new Error(
      saveError.message
    );
  }

  return approvalPackage;
}


export async function getGuidedApprovalPackage(
  communicationId:
    string
): Promise<GuidedApprovalPackage> {
  const {
    data:
      communication,

    error,
  } =
    await supabase
      .from(
        "communications"
      )
      .select(
        "input_data"
      )
      .eq(
        "id",
        communicationId
      )
      .limit(1)
      .maybeSingle();

  if (
    error
  ) {
    throw new Error(
      error.message
    );
  }

  if (
    !communication
  ) {
    throw new Error(
      "Communication not found."
    );
  }

  const inputData =
    (
      communication.input_data &&
      typeof communication.input_data ===
        "object" &&
      !Array.isArray(
        communication.input_data
      )
    )
      ? communication.input_data as Record<string, any>
      : {};

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

  const approvalPackage =
    guided.approvalPackage;

  if (
    !approvalPackage ||
    typeof approvalPackage !==
      "object" ||
    Array.isArray(
      approvalPackage
    )
  ) {
    throw new Error(
      "Guided approval package has not been prepared yet."
    );
  }

  return approvalPackage as
    GuidedApprovalPackage;
}
