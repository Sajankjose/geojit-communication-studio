import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  color?: "green" | "teal" | "orange" | "gray" | "red" | "blue";
}

export function CategoryCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
  color = "green",
}: CategoryCardProps) {
  const colorStyles = {
    green: "border-[#07877B]/20 bg-[#e8f5f4]/30 hover:border-[#07877B]/40 hover:bg-[#e8f5f4]/50",
    teal: "border-teal-200 bg-teal-50/30 hover:border-teal-300 hover:bg-teal-50/50",
    orange: "border-orange-200 bg-orange-50/30 hover:border-orange-300 hover:bg-orange-50/50",
    gray: "border-gray-200 bg-gray-50/30 hover:border-gray-300 hover:bg-gray-50/50",
    red: "border-red-200 bg-red-50/30 hover:border-red-300 hover:bg-red-50/50",
    blue: "border-blue-200 bg-blue-50/30 hover:border-blue-300 hover:bg-blue-50/50",
  };

  const iconColors = {
    green: "text-[#07877B]",
    teal: "text-teal-600",
    orange: "text-orange-600",
    gray: "text-gray-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-3 rounded-xl border-2 bg-white p-6 text-left transition-all hover:shadow-md ${
        selected
          ? "border-[#07877B] shadow-lg ring-2 ring-[#07877B]/20"
          : colorStyles[color]
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
          selected ? "bg-[#07877B] text-white" : `bg-white ${iconColors[color]}`
        } border transition-colors`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {selected && (
        <div className="absolute right-4 top-4">
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
        </div>
      )}
    </button>
  );
}
