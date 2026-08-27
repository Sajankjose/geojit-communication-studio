import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type DesignSystemCardSurface =
  | "default"
  | "muted"
  | "interactive"
  | "selected"
  | "accent";

export interface DesignSystemCardProps
  extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual treatment of the card.
   *
   * default
   * Standard content container.
   *
   * muted
   * Low-emphasis supporting content.
   *
   * interactive
   * Clickable/selectable card with hover feedback.
   *
   * selected
   * Active or currently selected card.
   *
   * accent
   * Brand-emphasised supporting section.
   */
  surface?: DesignSystemCardSurface;

  children: ReactNode;
}

/**
 * Shared application card primitive.
 *
 * Visual decisions are controlled by the design-system
 * stylesheet rather than individual feature screens.
 *
 * Pages should prefer:
 *
 * <DesignSystemCard surface="default" />
 * <DesignSystemCard surface="interactive" />
 * <DesignSystemCard surface="selected" />
 *
 * instead of manually defining borders, backgrounds,
 * shadows and radii.
 */
export function DesignSystemCard({
  surface = "default",
  className = "",
  children,
  ...props
}: DesignSystemCardProps) {
  const surfaceClass: Record<
    DesignSystemCardSurface,
    string
  > = {
    default: "ds-card",
    muted: "ds-card-muted",
    interactive:
      "ds-card-interactive",
    selected:
      "ds-card-selected",
    accent:
      "ds-card-accent",
  };

  return (
    <div
      className={`${surfaceClass[surface]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
