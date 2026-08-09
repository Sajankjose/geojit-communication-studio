type Status = 
  | "draft" 
  | "input-complete" 
  | "generating" 
  | "variants-ready" 
  | "selected" 
  | "preview-ready" 
  | "submitted";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const styles = {
    draft: "bg-gray-100 text-gray-700 border-gray-300",
    "input-complete": "bg-blue-50 text-blue-700 border-blue-200",
    generating: "bg-blue-100 text-blue-800 border-blue-300",
    "variants-ready": "bg-green-50 text-green-700 border-green-200",
    selected: "bg-amber-50 text-amber-700 border-amber-200",
    "preview-ready": "bg-green-50 text-green-700 border-green-200",
    submitted: "bg-[#e8f5f4] text-[#07877B] border-[#b3d9d5]",
  };

  const labels = {
    draft: "Draft",
    "input-complete": "Input Complete",
    generating: "Generating",
    "variants-ready": "Variants Ready",
    selected: "Selected",
    "preview-ready": "Preview Ready",
    submitted: "Submitted",
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${styles[status]} ${sizeClasses}`}
    >
      {labels[status]}
    </span>
  );
}
