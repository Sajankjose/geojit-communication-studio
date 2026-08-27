import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type DesignSystemCardSurface =
  | "default"
  | "muted";

export interface DesignSystemCardProps
  extends HTMLAttributes<HTMLDivElement> {
  surface?:
    DesignSystemCardSurface;

  children:
    ReactNode;
}

/**
 * Generic application card wrapper.
 *
 * IMPORTANT:
 * Elevation is deliberately not exposed yet.
 * Figma confirms Shadow 1 and Shadow 2 exist, but their exact
 * effect values must be read from the relevant Figma node before
 * they are encoded in production.
 */
export function DesignSystemCard({
  surface = "default",
  className = "",
  children,
  ...props
}: DesignSystemCardProps) {
  const surfaceClass =
    surface ===
      "muted"
      ? "ds-card-muted"
      : "ds-card";

  return (
    <div
      className={`${surfaceClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
