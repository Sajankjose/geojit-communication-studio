interface CategoryTagProps {
  category:
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding";

  size?: "sm" | "md";
}


export function CategoryTag({
  category,
  size = "md",
}: CategoryTagProps) {
  const styles = {
    research:
      "bg-[#e8f5f4] text-[#075f58] border-[#b3d9d5]",

    education:
      "bg-teal-50 text-teal-700 border-teal-200",

    product:
      "bg-orange-50 text-orange-700 border-orange-200",

    service:
      "bg-gray-100 text-gray-700 border-gray-300",

    regulatory:
      "bg-red-50 text-red-700 border-red-200",

    onboarding:
      "bg-blue-50 text-blue-700 border-blue-200",
  };


  const labels = {
    research:
      "Fundamental Research",

    education:
      "Investor Education",

    product:
      "Product & Sales",

    service:
      "Service & Transactional",

    regulatory:
      "Regulatory & Compliance",

    onboarding:
      "Onboarding & Journey",
  };


  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-[11px]"
      : "px-3 py-1.5 text-xs";


  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-medium ${styles[category]} ${sizeClasses}`}
    >
      {labels[category]}
    </span>
  );
}
