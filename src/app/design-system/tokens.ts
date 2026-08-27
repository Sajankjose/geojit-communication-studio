/**
 * Communication Studio Design Tokens
 * Source of truth: Geojit Website Design System (Figma)
 *
 * Keep semantic usage in application code.
 * Avoid adding one-off hex values to pages/components.
 */

export const dsTokens = {
  fontFamily: {
    ui: '"Radio Canada Big", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  colors: {
    neutral: {
      boldest: "#022F2D",
      bolder: "#4A6361",
    },

    white: "#FFFFFF",

    /**
     * Existing Communication Studio primary retained
     * until the full Figma colour foundation is mapped.
     */
    brand: {
      primary: "#07877B",
      primaryHover: "#06766A",
    },
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 30,
    display: 48,
  },

  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  typography: {
    desktop: {
      display: { size: 82, weight: 700, lineHeight: 1.2 },
      heading1: { size: 72, weight: 600, lineHeight: 1.1 },
      heading2: { size: 60, weight: 600, lineHeight: 1.2 },
      heading3: { size: 52, weight: 600, lineHeight: 1.3 },
      heading4: { size: 40, weight: 600, lineHeight: 1.3 },
      title1: { size: 40, weight: 400, lineHeight: 1.4 },
      title2: { size: 32, weight: 600, lineHeight: 1.3 },
      title3: { size: 24, weight: 600, lineHeight: 1.3 },
      title4: { size: 20, weight: 600, lineHeight: 1.3 },
      subtitle: { size: 22, weight: 400, lineHeight: 1.4 },
      bodyLarge: { size: 20, weight: 400, lineHeight: 1.5 },
      bodyMedium: { size: 18, weight: 400, lineHeight: 1.5 },
      bodySmall: { size: 16, weight: 400, lineHeight: 1.5 },
      bodyXSmall: { size: 14, weight: 400, lineHeight: 1.5 },
      buttonLarge: { size: 16, weight: 400, lineHeight: 1.1 },
      buttonMedium: { size: 14, weight: 400, lineHeight: 1.1 },
      label1: { size: 24, weight: 400, lineHeight: 1.4 },
      label2: { size: 20, weight: 400, lineHeight: 1.4 },
      label3: { size: 14, weight: 400, lineHeight: 1.4 },
      chipLarge: { size: 16, weight: 500, lineHeight: 1 },
      chipSmall: { size: 14, weight: 500, lineHeight: 1 },
      tabActive: { size: 24, weight: 600, lineHeight: 1.5 },
      tabNav: { size: 22, weight: 500, lineHeight: 1.4 },
    },

    mobile: {
      display: { size: 60, weight: 700, lineHeight: 1.2 },
      heading1: { size: 40, weight: 700, lineHeight: 1.1 },
      heading2: { size: 32, weight: 600, lineHeight: 1.0 },
      heading3: { size: 24, weight: 600, lineHeight: 1.2 },
      title1: { size: 24, weight: 600, lineHeight: 1.4 },
      title2: { size: 20, weight: 600, lineHeight: 1.3 },
      title3: { size: 18, weight: 600, lineHeight: 1.3 },
      title4: { size: 16, weight: 600, lineHeight: 1.3 },
      subtitle: { size: 20, weight: 500, lineHeight: 1.4 },
      bodyLarge: { size: 18, weight: 400, lineHeight: 1.5 },
      bodyMedium: { size: 16, weight: 400, lineHeight: 1.5 },
      bodySmall: { size: 14, weight: 400, lineHeight: 1.5 },
      bodyXSmall: { size: 12, weight: 400, lineHeight: 1.5 },
      buttonLarge: { size: 16, weight: 400, lineHeight: 1.1 },
      buttonMedium: { size: 14, weight: 400, lineHeight: 1.1 },
      label1: { size: 18, weight: 400, lineHeight: 1.4 },
      label2: { size: 14, weight: 400, lineHeight: 1.4 },
      label3: { size: 12, weight: 400, lineHeight: 1.4 },
      chipLarge: { size: 16, weight: 500, lineHeight: 1 },
      chipSmall: { size: 14, weight: 500, lineHeight: 1 },
    },
  },
} as const;

export type DesignTokens =
  typeof dsTokens;
