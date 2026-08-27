import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

export interface DesignSystemInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;

  helperText?: string;

  error?: string;

  leadingIcon?: ReactNode;

  trailingIcon?: ReactNode;

  requiredLabel?: boolean;
}

export function DesignSystemInput({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  requiredLabel = false,
  className = "",
  id,
  disabled,
  ...props
}: DesignSystemInputProps) {
  const inputId =
    id ||
    `ds-input-${Math.random()
      .toString(36)
      .slice(2)}`;

  const helperId =
    `${inputId}-helper`;

  const errorId =
    `${inputId}-error`;

  return (
    <div className="ds-field">

      {label && (
        <label
          htmlFor={
            inputId
          }
          className="ds-field-label"
        >
          {label}

          {requiredLabel && (
            <span
              className="ds-field-required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <div
        className={`ds-input-shell ${
          error
            ? "ds-input-shell-error"
            : ""
        } ${
          disabled
            ? "ds-input-shell-disabled"
            : ""
        }`}
      >
        {leadingIcon && (
          <span className="ds-input-icon">
            {leadingIcon}
          </span>
        )}

        <input
          id={
            inputId
          }
          disabled={
            disabled
          }
          aria-invalid={
            Boolean(error)
          }
          aria-describedby={
            error
              ? errorId
              : helperText
                ? helperId
                : undefined
          }
          className={`ds-input-control ${className}`}
          {...props}
        />

        {trailingIcon && (
          <span className="ds-input-icon">
            {trailingIcon}
          </span>
        )}
      </div>

      {error ? (
        <p
          id={
            errorId
          }
          className="ds-field-error"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={
            helperId
          }
          className="ds-field-helper"
        >
          {helperText}
        </p>
      ) : null}

    </div>
  );
}
