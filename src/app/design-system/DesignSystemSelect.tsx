import {
  useId,
} from "react";

import type {
  SelectHTMLAttributes,
} from "react";

import {
  ChevronDown,
} from "lucide-react";

import {
  DesignSystemIcon,
} from "./DesignSystemIcon";


export interface DesignSystemSelectOption {
  value:
    string;

  label:
    string;

  disabled?:
    boolean;
}


export interface DesignSystemSelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "children"
  > {
  label?:
    string;

  helperText?:
    string;

  error?:
    string;

  requiredLabel?:
    boolean;

  placeholder?:
    string;

  options:
    DesignSystemSelectOption[];
}


export function DesignSystemSelect({
  label,
  helperText,
  error,
  requiredLabel = false,
  placeholder = "Select an option",
  options,
  className = "",
  id,
  disabled,
  required,
  ...props
}: DesignSystemSelectProps) {
  const generatedId =
    useId();

  const selectId =
    id ||
    `ds-select-${generatedId}`;

  const helperId =
    `${selectId}-helper`;

  const errorId =
    `${selectId}-error`;

  return (
    <div className="ds-field">

      {label && (
        <label
          htmlFor={
            selectId
          }
          className="ds-field-label"
        >
          {label}

          {(requiredLabel ||
            required) && (
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
        className={`ds-select-shell ${
          error
            ? "ds-select-shell-error"
            : ""
        } ${
          disabled
            ? "ds-select-shell-disabled"
            : ""
        }`}
      >

        <select
          id={
            selectId
          }
          disabled={
            disabled
          }
          required={
            required
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
          className={`ds-select-control ${className}`.trim()}
          {...props}
        >

          {placeholder && (
            <option
              value=""
              disabled={
                required
              }
            >
              {placeholder}
            </option>
          )}

          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
                disabled={
                  option.disabled
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}

        </select>


        <span className="ds-select-icon">
          <DesignSystemIcon
            size="sm"
            tone={
              disabled
                ? "disabled"
                : "secondary"
            }
          >
            <ChevronDown />
          </DesignSystemIcon>
        </span>

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
