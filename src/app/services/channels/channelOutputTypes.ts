export type CommunicationChannel =
  | "email"
  | "whatsapp"
  | "leaflet";

export type CommunicationVariant =
  | "A"
  | "B"
  | "C";

export type ChannelOutputStatus =
  | "generated"
  | "selected"
  | "approved"
  | "archived";


export interface EmailChannelContent {
  channel:
    "email";

  subject:
    string;

  preheader:
    string;

  headline:
    string;

  opening:
    string;

  bodySections:
    Array<{
      heading:
        string | null;

      content:
        string;
    }>;

  keyPoints:
    string[];

  cta: {
    label:
      string;

    url:
      string | null;
  } | null;

  mandatoryNotes:
    string[];
}


export interface WhatsAppChannelContent {
  channel:
    "whatsapp";

  headline:
    string | null;

  message:
    string;

  keyPoints:
    string[];

  cta: {
    label:
      string;

    url:
      string | null;
  } | null;

  mandatoryNotes:
    string[];
}


export interface LeafletChannelContent {
  channel:
    "leaflet";

  headline:
    string;

  subheadline:
    string | null;

  intro:
    string;

  keyPoints:
    Array<{
      title:
        string;

      description:
        string;
    }>;

  cta: {
    label:
      string;

    supportingText:
      string | null;

    url:
      string | null;
  } | null;

  mandatoryNotes:
    string[];

  visualDirection:
    string | null;
}


export type ChannelContent =
  | EmailChannelContent
  | WhatsAppChannelContent
  | LeafletChannelContent;


export interface CommunicationChannelOutputRecord {
  id:
    string;

  communication_id:
    string;

  channel:
    CommunicationChannel;

  variant:
    CommunicationVariant;

  language_code:
    string;

  source_master_version:
    number;

  status:
    ChannelOutputStatus;

  content_json:
    ChannelContent;

  generation_metadata:
    Record<string, unknown>;

  created_by:
    string;

  created_at:
    string;

  updated_at:
    string;
}
