import { Mail, Eye } from "lucide-react";

interface VariantCardProps {
  variant: "clarity" | "balanced" | "impact";
  subject: string;
  preheader: string;
  styleNote: string;
  selected?: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

export function VariantCard({
  variant,
  subject,
  preheader,
  styleNote,
  selected,
  onSelect,
  onPreview,
}: VariantCardProps) {
  const variantStyles = {
    clarity: {
      label: "Clarity First",
      badge: "bg-blue-100 text-blue-700",
      border: "border-blue-200",
    },
    balanced: {
      label: "Balanced",
      badge: "bg-green-100 text-green-700",
      border: "border-green-200",
    },
    impact: {
      label: "Impact",
      badge: "bg-orange-100 text-orange-700",
      border: "border-orange-200",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`flex flex-col rounded-xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-md ${
        selected
          ? "border-[#07877B] shadow-lg ring-2 ring-[#07877B]/20"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-2">{style.label}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs ${style.badge}`}>
            {variant === "clarity"
              ? "Minimal & Clear"
              : variant === "balanced"
                ? "Versatile"
                : "Strong Emphasis"}
          </span>
        </div>
        {selected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#07877B] text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Email Preview */}
      <div className="mb-4 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-muted-foreground">Subject</span>
          </div>
          <p className="text-sm">{subject}</p>
        </div>

        <div className="mb-3">
          <span className="mb-1 block text-xs text-muted-foreground">
            Preheader
          </span>
          <p className="text-xs text-gray-600">{preheader}</p>
        </div>

        {/* Mini Email Preview */}
        <div className="mt-4 rounded border border-gray-300 bg-white p-3">
          <div className="mb-2 h-8 w-20 rounded bg-[#07877B]"></div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded bg-gray-200"></div>
            <div className="h-2 w-5/6 rounded bg-gray-200"></div>
            <div className="h-2 w-4/6 rounded bg-gray-200"></div>
          </div>
          <div className="mt-3 h-6 w-24 rounded bg-[#FBB041]"></div>
        </div>
      </div>

      {/* Style Note */}
      <p className="mb-4 text-xs text-muted-foreground">{styleNote}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className={`flex-1 rounded-lg px-4 py-2.5 transition-all ${
            selected
              ? "bg-[#07877B] text-white shadow-md"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {selected ? "Selected" : "Use This Version"}
        </button>
        <button
          onClick={onPreview}
          className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-all hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
