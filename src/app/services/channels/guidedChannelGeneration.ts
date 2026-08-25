import {
  supabase,
} from "../../../lib/supabase";

import {
  CommunicationChannelOutputRecord,
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
