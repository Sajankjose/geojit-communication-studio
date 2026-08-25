import {
  supabase,
} from "../../../lib/supabase";

import {
  CommunicationChannel,
  CommunicationChannelOutputRecord,
  CommunicationVariant,
} from "./channelOutputTypes";

export interface GenerateGuidedChannelsResult {
  success:
    boolean;

  communicationId:
    string;

  generated:
    Array<{
      channel:
        "email"
        | "whatsapp"
        | "leaflet";

      variants:
        number;
    }>;
}


/**
 * Trigger Guided channel generation.
 */
export async function generateGuidedChannels(
  communicationId:
    string
): Promise<GenerateGuidedChannelsResult> {
  const {
    data:
      sessionData,

    error:
      sessionError,
  } =
    await supabase.auth.getSession();

  if (
    sessionError
  ) {
    throw new Error(
      sessionError.message
    );
  }

  const accessToken =
    sessionData.session
      ?.access_token;

  if (
    !accessToken
  ) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response =
    await fetch(
      "/.netlify/functions/generate-guided-channels",
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
      "Unable to generate channel outputs."
    );
  }

  return payload as
    GenerateGuidedChannelsResult;
}


/**
 * Load generated Guided channel variants.
 */
export async function getGuidedChannelOutputs(
  communicationId:
    string
): Promise<
  CommunicationChannelOutputRecord[]
> {
  const {
    data,
    error,
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
      .order(
        "channel",
        {
          ascending:
            true,
        }
      )
      .order(
        "variant",
        {
          ascending:
            true,
        }
      );

  if (
    error
  ) {
    console.error(
      "Unable to load Guided channel outputs:",
      error
    );

    throw new Error(
      error.message
    );
  }

  return (
    data ||
    []
  ) as
    CommunicationChannelOutputRecord[];
}


/**
 * Persist one selected variant per channel.
 *
 * Existing selected rows are reset to generated first,
 * then the newly chosen rows are marked selected.
 */
export async function saveGuidedChannelSelections(
  communicationId:
    string,

  selections:
    Record<
      CommunicationChannel,
      CommunicationVariant
    >
) {
  const channels =
    Object.keys(
      selections
    ) as
      CommunicationChannel[];

  if (
    channels.length ===
      0
  ) {
    throw new Error(
      "No channel selections were provided."
    );
  }

  const {
    error:
      resetError,
  } =
    await supabase
      .from(
        "communication_channel_outputs"
      )
      .update({
        status:
          "generated",
      })
      .eq(
        "communication_id",
        communicationId
      )
      .eq(
        "language_code",
        "en"
      )
      .in(
        "channel",
        channels
      )
      .eq(
        "status",
        "selected"
      );

  if (
    resetError
  ) {
    throw new Error(
      resetError.message
    );
  }

  for (
    const channel of
      channels
  ) {
    const variant =
      selections[
        channel
      ];

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "communication_channel_outputs"
        )
        .update({
          status:
            "selected",
        })
        .eq(
          "communication_id",
          communicationId
        )
        .eq(
          "channel",
          channel
        )
        .eq(
          "language_code",
          "en"
        )
        .eq(
          "variant",
          variant
        )
        .select(
          "id"
        );

    if (
      error
    ) {
      throw new Error(
        error.message
      );
    }

    if (
      !data ||
      data.length !==
        1
    ) {
      throw new Error(
        `Unable to select ${channel} variant ${variant}.`
      );
    }
  }

  /**
   * Store a compact selection map in communications.input_data
   * as well, so later approval/generation steps can locate the
   * chosen channel outputs without scanning UI state.
   */
  const {
    data:
      communication,

    error:
      loadError,
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
    loadError
  ) {
    throw new Error(
      loadError.message
    );
  }

  const inputData =
    (
      communication?.input_data &&
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

  const {
    error:
      communicationError,
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

            selectedChannelVariants:
              selections,

            channelSelectionSavedAt:
              new Date().toISOString(),
          },
        },
      })
      .eq(
        "id",
        communicationId
      );

  if (
    communicationError
  ) {
    throw new Error(
      communicationError.message
    );
  }
}
