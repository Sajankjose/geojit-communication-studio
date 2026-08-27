export type Status =
  | "draft"
  | "input_ready"
  | "input-complete"
  | "generating"
  | "variants_ready"
  | "variants-ready"
  | "variant_selected"
  | "selected"
  | "preview_ready"
  | "preview-ready"
  | "pending_approval"
  | "submitted"
  | "marketing_review"
  | "marketing_approved"
  | "corpcom_review"
  | "changes_requested"
  | "rejected"
  | "approved";

export type StatusTone =
  | "neutral"
  | "info"
  | "progress"
  | "warning"
  | "success"
  | "error";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const labels: Record<
  Status,
  string
> = {
  draft:
    "Draft",

  input_ready:
    "Input Complete",

  "input-complete":
    "Input Complete",

  generating:
    "Generating",

  variants_ready:
    "Variants Ready",

  "variants-ready":
    "Variants Ready",

  variant_selected:
    "Variant Selected",

  selected:
    "Selected",

  preview_ready:
    "Preview Ready",

  "preview-ready":
    "Preview Ready",

  pending_approval:
    "Pending Marketing Approval",

  submitted:
    "Pending Marketing Approval",

  marketing_review:
    "Marketing Review",

  marketing_approved:
    "Marketing Approved",

  corpcom_review:
    "Pending CorpCom Approval",

  changes_requested:
    "Changes Requested",

  rejected:
    "Rejected",

  approved:
    "Approved",
};

const tones: Record<
  Status,
  StatusTone
> = {
  draft:
    "neutral",

  input_ready:
    "info",

  "input-complete":
    "info",

  generating:
    "progress",

  variants_ready:
    "success",

  "variants-ready":
    "success",

  variant_selected:
    "info",

  selected:
    "info",

  preview_ready:
    "success",

  "preview-ready":
    "success",

  pending_approval:
    "warning",

  submitted:
    "warning",

  marketing_review:
    "warning",

  marketing_approved:
    "info",

  corpcom_review:
    "warning",

  changes_requested:
    "warning",

  rejected:
    "error",

  approved:
    "success",
};

export function StatusBadge({
  status,
  size = "md",
}: StatusBadgeProps) {
  const tone =
    tones[status];

  const sizeClass =
    size === "sm"
      ? "ds-status-sm"
      : "ds-status-md";

  return (
    <span
      className={`ds-status ds-status-${tone} ${sizeClass}`}
    >
      <span
        className="ds-status-dot"
        aria-hidden="true"
      />

      <span>
        {labels[status]}
      </span>
    </span>
  );
}
