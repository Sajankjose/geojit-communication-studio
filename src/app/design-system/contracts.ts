/**
 * Communication Studio — Geojit Design System Contracts
 *
 * This file defines which visual primitives are allowed in the app.
 * It intentionally does NOT invent missing Figma values.
 *
 * Source library discoveries:
 * - Web-Button - new
 * - Mobile-Button - new
 * - Web-Textlink / Mobile-Textlink
 * - Web-Fab / Mobile-Fab
 * - card / cards component sets
 * - CTA card - desktop / CTA card - mobile
 * - Shadow 1 / Shadow 2 effect styles
 * - semantic icon colour mappings
 *
 * Exact visual values for components/elevations should be filled only
 * after reading the relevant Figma node context.
 */

export const designSystemContracts = {
  buttons: {
    component: "Web-Button - new",
    mobileComponent: "Mobile-Button - new",
    textLink: "Web-Textlink",
    mobileTextLink: "Mobile-Textlink",
    fab: "Web-Fab",
    mobileFab: "Mobile-Fab",
  },

  cards: {
    generic: "card",
    family: "cards",
    ctaDesktop: "CTA card - desktop",
    ctaMobile: "CTA card - mobile",
  },

  elevations: {
    low: "Shadow 1",
    high: "Shadow 2",
  },

  iconSemanticRoles: [
    "primary",
    "secondary",
    "tertiary",
    "action",
    "actionSecondary",
    "info",
    "success",
    "warning",
    "error",
    "disabled",
    "disabledSecondary",
    "onDark",
    "color",
  ] as const,

  iconComponentsDiscovered: [
    "notification",
    "notification-bing",
    "notification-circle",
    "notification-favorite",
    "notification-status",
    "menu",
    "microphone-2",
    "note",
    "archive",
    "location",
    "location-cross",
    "location-minus",
    "gallery-favorite",
    "flash-circle",
    "audio-square",
    "ticket",
    "security-card",
  ] as const,
} as const;

export type IconSemanticRole =
  (typeof designSystemContracts.iconSemanticRoles)[number];
