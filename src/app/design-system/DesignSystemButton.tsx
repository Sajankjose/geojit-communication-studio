import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type DesignSystemButtonVariant =
  | "primary"
  | "secondary";

export type DesignSystemButtonSize =
  | "large"
  | "medium";

export interface DesignSystemButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    DesignSystemButtonVariant;

  size?:
    DesignSystemButtonSize;

  leadingIcon?:
    ReactNode;

  trailingIcon?:
    ReactNode;
}

export function DesignSystemButton({
  variant = "primary",
  size = "large",
  leadingIcon,
  trailingIcon,
  className = "",
  children,
  type = "button",
  ...props
}: DesignSystemButtonProps) {
  const variantClass =
    variant ===
      "primary"
      ? "ds-button-primary"
      : "ds-button-secondary";

  const typeClass =
    size ===
      "large"
      ? "ds-button-lg"
      : "ds-button-md";

  return (
    <button
      type={
        type
      }
      className={`${variantClass} ${typeClass} ${className}`}
      {...props}
    >
      {leadingIcon}

      <span>
        {children}
      </span>

      {trailingIcon}
    </button>
  );
}
