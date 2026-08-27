import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  IconSemanticRole,
} from "./contracts";

export interface DesignSystemIconProps {
  children:
    ReactNode;

  /**
   * Icon sizes are controlled through the design-system wrapper.
   * Do not set arbitrary icon width/height in feature screens.
   */
  size?:
    "sm"
    | "md"
    | "lg";

  tone?:
    IconSemanticRole;

  className?:
    string;
}

const sizeMap = {
  sm:
    16,

  md:
    20,

  lg:
    24,
} as const;

const toneClassMap:
  Record<
    IconSemanticRole,
    string
  > = {
    primary:
      "ds-icon-primary",

    secondary:
      "ds-icon-secondary",

    tertiary:
      "ds-icon-tertiary",

    action:
      "ds-icon-action",

    actionSecondary:
      "ds-icon-action-secondary",

    info:
      "ds-icon-info",

    success:
      "ds-icon-success",

    warning:
      "ds-icon-warning",

    error:
      "ds-icon-error",

    disabled:
      "ds-icon-disabled",

    disabledSecondary:
      "ds-icon-disabled-secondary",

    onDark:
      "ds-icon-on-dark",

    color:
      "ds-icon-color",
  };

export function DesignSystemIcon({
  children,
  size = "md",
  tone = "primary",
  className = "",
}: DesignSystemIconProps) {
  const pixelSize =
    sizeMap[
      size
    ];

  const style:
    CSSProperties = {
      width:
        pixelSize,

      height:
        pixelSize,

      minWidth:
        pixelSize,

      minHeight:
        pixelSize,
  };

  return (
    <span
      aria-hidden="true"
      className={`ds-icon ${toneClassMap[tone]} ${className}`}
      style={
        style
      }
    >
      {children}
    </span>
  );
}
