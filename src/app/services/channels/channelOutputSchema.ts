import {
  CommunicationChannel,
  EmailChannelContent,
  LeafletChannelContent,
  WhatsAppChannelContent,
} from "./channelOutputTypes";


export function isCommunicationChannel(
  value:
    unknown
): value is CommunicationChannel {
  return (
    value ===
      "email" ||
    value ===
      "whatsapp" ||
    value ===
      "leaflet"
  );
}


export function validateEmailChannelContent(
  value:
    unknown
): EmailChannelContent {
  const data =
    asRecord(
      value
    );

  if (
    !data ||
    data.channel !==
      "email"
  ) {
    throw new Error(
      "Invalid Email channel output."
    );
  }

  const subject =
    requiredString(
      data.subject,
      "Email subject"
    );

  const preheader =
    requiredString(
      data.preheader,
      "Email preheader"
    );

  const headline =
    requiredString(
      data.headline,
      "Email headline"
    );

  const opening =
    requiredString(
      data.opening,
      "Email opening"
    );

  const bodySections =
    Array.isArray(
      data.bodySections
    )
      ? data.bodySections.map(
          (
            item
          ) => {
            const section =
              asRecord(
                item
              );

            if (!section) {
              throw new Error(
                "Invalid Email body section."
              );
            }

            return {
              heading:
                optionalString(
                  section.heading
                ),

              content:
                requiredString(
                  section.content,
                  "Email section content"
                ),
            };
          }
        )
      : [];

  return {
    channel:
      "email",

    subject,

    preheader,

    headline,

    opening,

    bodySections,

    keyPoints:
      stringArray(
        data.keyPoints
      ),

    cta:
      parseCta(
        data.cta
      ),

    mandatoryNotes:
      stringArray(
        data.mandatoryNotes
      ),
  };
}


export function validateWhatsAppChannelContent(
  value:
    unknown
): WhatsAppChannelContent {
  const data =
    asRecord(
      value
    );

  if (
    !data ||
    data.channel !==
      "whatsapp"
  ) {
    throw new Error(
      "Invalid WhatsApp channel output."
    );
  }

  return {
    channel:
      "whatsapp",

    headline:
      optionalString(
        data.headline
      ),

    message:
      requiredString(
        data.message,
        "WhatsApp message"
      ),

    keyPoints:
      stringArray(
        data.keyPoints
      ),

    cta:
      parseCta(
        data.cta
      ),

    mandatoryNotes:
      stringArray(
        data.mandatoryNotes
      ),
  };
}


export function validateLeafletChannelContent(
  value:
    unknown
): LeafletChannelContent {
  const data =
    asRecord(
      value
    );

  if (
    !data ||
    data.channel !==
      "leaflet"
  ) {
    throw new Error(
      "Invalid Leaflet channel output."
    );
  }

  const keyPoints =
    Array.isArray(
      data.keyPoints
    )
      ? data.keyPoints.map(
          (
            item
          ) => {
            const point =
              asRecord(
                item
              );

            if (!point) {
              throw new Error(
                "Invalid Leaflet key point."
              );
            }

            return {
              title:
                requiredString(
                  point.title,
                  "Leaflet key point title"
                ),

              description:
                requiredString(
                  point.description,
                  "Leaflet key point description"
                ),
            };
          }
        )
      : [];

  return {
    channel:
      "leaflet",

    headline:
      requiredString(
        data.headline,
        "Leaflet headline"
      ),

    subheadline:
      optionalString(
        data.subheadline
      ),

    intro:
      requiredString(
        data.intro,
        "Leaflet intro"
      ),

    keyPoints,

    cta:
      parseLeafletCta(
        data.cta
      ),

    mandatoryNotes:
      stringArray(
        data.mandatoryNotes
      ),

    visualDirection:
      optionalString(
        data.visualDirection
      ),
  };
}


function asRecord(
  value:
    unknown
): Record<string, any> | null {
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
    any
  >;
}


function requiredString(
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

  return value.trim();
}


function optionalString(
  value:
    unknown
) {
  return (
    typeof value ===
      "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}


function stringArray(
  value:
    unknown
) {
  return Array.isArray(
    value
  )
    ? value
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
        .map(
          (item) =>
            item.trim()
        )
    : [];
}


function parseCta(
  value:
    unknown
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }

  const data =
    asRecord(
      value
    );

  if (!data) {
    return null;
  }

  return {
    label:
      requiredString(
        data.label,
        "CTA label"
      ),

    url:
      optionalString(
        data.url
      ),
  };
}


function parseLeafletCta(
  value:
    unknown
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }

  const data =
    asRecord(
      value
    );

  if (!data) {
    return null;
  }

  return {
    label:
      requiredString(
        data.label,
        "CTA label"
      ),

    supportingText:
      optionalString(
        data.supportingText
      ),

    url:
      optionalString(
        data.url
      ),
  };
}
