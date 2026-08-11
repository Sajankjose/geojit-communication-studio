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

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  size = "md",
}: StatusBadgeProps) {
  const styles: Record<Status, string> = {
    draft:
      "bg-gray-100 text-gray-700 border-gray-300",

    input_ready:
      "bg-blue-50 text-blue-700 border-blue-200",

    "input-complete":
      "bg-blue-50 text-blue-700 border-blue-200",

    generating:
      "bg-blue-100 text-blue-800 border-blue-300",

    variants_ready:
      "bg-green-50 text-green-700 border-green-200",

    "variants-ready":
      "bg-green-50 text-green-700 border-green-200",

    variant_selected:
      "bg-amber-50 text-amber-700 border-amber-200",

    selected:
      "bg-amber-50 text-amber-700 border-amber-200",

    preview_ready:
      "bg-green-50 text-green-700 border-green-200",

    "preview-ready":
      "bg-green-50 text-green-700 border-green-200",

    pending_approval:
      "bg-amber-50 text-amber-800 border-amber-200",

    submitted:
      "bg-amber-50 text-amber-800 border-amber-200",

    marketing_review:
      "bg-amber-50 text-amber-800 border-amber-200",

    marketing_approved:
      "bg-blue-50 text-blue-700 border-blue-200",

    corpcom_review:
      "bg-purple-50 text-purple-700 border-purple-200",

    changes_requested:
      "bg-orange-50 text-orange-700 border-orange-200",

    rejected:
      "bg-red-50 text-red-700 border-red-200",

    approved:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const labels: Record<Status, string> = {
    draft: "Draft",

    input_ready: "Input Complete",
    "input-complete": "Input Complete",

    generating: "Generating",

    variants_ready: "Variants Ready",
    "variants-ready": "Variants Ready",

    variant_selected: "Variant Selected",
    selected: "Selected",

    preview_ready: "Preview Ready",
    "preview-ready": "Preview Ready",

    pending_approval: "Pending Marketing Approval",

    submitted: "Pending Marketing Approval",

    marketing_review: "Marketing Review",

    marketing_approved: "Marketing Approved",

    corpcom_review: "Pending CorpCom Approval",

    changes_requested: "Changes Requested",

    rejected: "Rejected",

    approved: "Approved",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${styles[status]} ${sizeClasses}`}
    >
      {labels[status]}
    </span>
  );
}
