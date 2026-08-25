import {
  CommunicationChannel,
} from "./channelOutputTypes";

export interface ChannelRuleSet {
  channel:
    CommunicationChannel;

  purpose:
    string;

  writingRules:
    string[];

  structureRules:
    string[];

  safetyRules:
    string[];

  recommendedLength:
    string;

  variantCount:
    3;
}


/**
 * PHASE 2 CHANNEL RULES
 *
 * These rules control HOW the same Communication Master
 * is expressed for each channel.
 *
 * They must never change the underlying governed meaning,
 * facts, audience or approved restrictions.
 */

export const CHANNEL_RULES:
  Record<
    CommunicationChannel,
    ChannelRuleSet
  > = {

    email: {
      channel:
        "email",

      purpose:
        "Create a complete, structured and easy-to-read customer communication.",

      writingRules: [
        "Use simple, customer-friendly language.",
        "Keep sentences reasonably short.",
        "Explain technical terms when they are necessary.",
        "Avoid unnecessary jargon.",
        "Do not repeat the same message across headline, opening and body.",
        "Use ₹ for Indian rupee amounts where appropriate.",
        "Keep the communication informative rather than exaggerated or sales-heavy.",
      ],

      structureRules: [
        "Create a clear subject line.",
        "Create a short preheader that complements rather than repeats the subject.",
        "Use one primary headline.",
        "Use a short opening paragraph.",
        "Break longer content into logical sections.",
        "Use concise key points only when they improve readability.",
        "Include one clear CTA only when the Communication Master requires an action.",
        "Mandatory notes and disclaimers must remain separate from the main message.",
      ],

      safetyRules: [
        "Do not introduce facts that are absent from the Communication Master.",
        "Do not strengthen a claim, recommendation or promise.",
        "Do not invent product eligibility, returns, rates, targets or deadlines.",
        "Do not convert creator experience into a verified financial fact.",
      ],

      recommendedLength:
        "Approximately 180-450 words depending on subject complexity.",

      variantCount:
        3,
    },


    whatsapp: {
      channel:
        "whatsapp",

      purpose:
        "Create a short, mobile-first message that communicates one clear idea quickly.",

      writingRules: [
        "Use natural, conversational and respectful language.",
        "Lead with the most useful point.",
        "Keep paragraphs very short.",
        "Avoid email-style introductions.",
        "Prefer plain language over formal marketing language.",
        "Avoid unnecessary emojis; use none by default.",
        "Do not compress the content so aggressively that the meaning changes.",
      ],

      structureRules: [
        "Use an optional short headline only when it helps comprehension.",
        "Keep the main message concise.",
        "Use no more than 3 key points unless essential.",
        "Use one clear CTA when appropriate.",
        "Keep mandatory notes concise but do not remove required information.",
      ],

      safetyRules: [
        "Use exactly the same governed meaning and financial facts as the Communication Master.",
        "Do not create urgency that does not exist in the source.",
        "Do not imply guaranteed returns, assured outcomes or safety.",
        "Do not add promotional claims simply to make the message shorter or stronger.",
      ],

      recommendedLength:
        "Prefer roughly 60-140 words, subject to mandatory information.",

      variantCount:
        3,
    },


    leaflet: {
      channel:
        "leaflet",

      purpose:
        "Create a compact visual communication suitable for an A4/leaflet-style layout.",

      writingRules: [
        "Use highly scannable language.",
        "Keep the headline clear rather than clever.",
        "Use short supporting text.",
        "Convert complex information into concise titled points.",
        "Maintain a professional Geojit tone.",
        "Avoid clutter and unnecessary repetition.",
      ],

      structureRules: [
        "Use one strong headline.",
        "Use an optional subheadline only if it adds information.",
        "Keep the introduction short.",
        "Use 3-5 structured key points.",
        "Use one CTA area when needed.",
        "Keep mandatory notes and disclaimers visually separate.",
        "Provide visualDirection as layout guidance only; do not invent an image asset.",
      ],

      safetyRules: [
        "Do not invent statistics, financial facts or benefits.",
        "Do not turn an explanatory idea into an investment recommendation.",
        "Do not omit material qualifications merely to save space.",
        "Visual direction must remain generic until an approved asset or AI-generated visual is separately governed.",
      ],

      recommendedLength:
        "Designed for one compact leaflet/A4 layout; keep body copy substantially shorter than email.",

      variantCount:
        3,
    },
  };


export function getChannelRules(
  channel:
    CommunicationChannel
) {
  return CHANNEL_RULES[
    channel
  ];
}
