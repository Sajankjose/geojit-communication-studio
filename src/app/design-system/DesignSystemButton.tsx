import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type DesignSystemButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive";

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

  loading?:
    boolean;

  loadingLabel?:
    string;

  fullWidth?:
    boolean;
}

export function DesignSystemButton({
  variant = "primary",
  size = "large",
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingLabel = "Please wait...",
  fullWidth = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: DesignSystemButtonProps) {
  const variantClass:
    Record<
      DesignSystemButtonVariant,
      string
    > = {
      primary:
        "ds-button-primary",

      secondary:
        "ds-button-secondary",

      tertiary:
        "ds-button-tertiary",

      destructive:
        "ds-button-destructive",
    };

  const sizeClass =
    size === "large"
      ? "ds-button-lg"
      : "ds-button-md";

  const widthClass =
    fullWidth
      ? "w-full"
      : "";

  const isDisabled =
    disabled ||
    loading;

  return (
    <button
      type={
        type
      }
      disabled={
        isDisabled
      }
      aria-busy={
        loading ||
        undefined
      }
      className={`${variantClass[variant]} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {!loading &&
        leadingIcon}

      <span>
        {loading
          ? loadingLabel
          : children}
      </span>

      {!loading &&
        trailingIcon}
    </button>
  );
}
