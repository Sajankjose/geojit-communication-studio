/**
 * Semantic typography class map.
 *
 * Use this from React components instead of manually composing
 * font-size/line-height/weight values.
 */

export const typographyClasses = {
  display:
    "ds-display",

  heading1:
    "ds-heading-1",

  heading2:
    "ds-heading-2",

  heading3:
    "ds-heading-3",

  heading4:
    "ds-heading-4",

  title1:
    "ds-title-1",

  title2:
    "ds-title-2",

  title3:
    "ds-title-3",

  title4:
    "ds-title-4",

  subtitle:
    "ds-subtitle",

  bodyLarge:
    "ds-body-lg",

  bodyMedium:
    "ds-body-md",

  bodySmall:
    "ds-body-sm",

  bodyXSmall:
    "ds-body-xs",

  buttonLarge:
    "ds-button-lg",

  buttonMedium:
    "ds-button-md",

  label1:
    "ds-label-1",

  label2:
    "ds-label-2",

  label3:
    "ds-label-3",

  chipLarge:
    "ds-chip-lg",

  chipSmall:
    "ds-chip-sm",

  tabActive:
    "ds-tab-active",

  tabNav:
    "ds-tab-nav",
} as const;

export type TypographyToken =
  keyof typeof typographyClasses;
