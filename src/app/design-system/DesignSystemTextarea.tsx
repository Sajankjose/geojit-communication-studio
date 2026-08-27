import type {
  TextareaHTMLAttributes,
} from "react";

export interface DesignSystemTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;

  helperText?: string;

  error?: string;

  requiredLabel?: boolean;

  /**
   * Optional character count.
   * Set maxLength through the normal textarea prop.
   */
  showCount?: boolean;
}

export function DesignSystemTextarea({
  label,
  helperText,
  error,
  requiredLabel = false,
  showCount = false,
  className = "",
  id,
  disabled,
  value,
  defaultValue,
  maxLength,
  ...props
}: DesignSystemTextareaProps) {
  const textareaId =
    id ||
    `ds-textarea-${Math.random()
      .toString(36)
      .slice(2)}`;

  const helperId =
    `${textareaId}-helper`;

  const errorId =
    `${textareaId}-error`;

  const currentLength =
    typeof value === "string"
      ? value.length
      : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;

  return (
    <div className="ds-field">
      {label && (
        <label
          htmlFor={
            textareaId
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
        className={`ds-textarea-shell ${
          error
            ? "ds-textarea-shell-error"
            : ""
        } ${
          disabled
            ? "ds-textarea-shell-disabled"
            : ""
        }`}
      >
        <textarea
          id={
            textareaId
          }
          disabled={
            disabled
          }
          value={
            value
          }
          defaultValue={
            defaultValue
          }
          maxLength={
            maxLength
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
          className={`ds-textarea-control ${className}`.trim()}
          {...props}
        />
      </div>

      <div className="ds-field-meta">
        <div className="min-w-0">
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

        {showCount &&
          maxLength && (
            <p
              className="ds-field-count"
              aria-live="polite"
            >
              {currentLength}
              {" / "}
              {maxLength}
            </p>
          )}
      </div>
    </div>
  );
}
