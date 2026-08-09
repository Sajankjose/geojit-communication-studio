import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { VariantCard } from "../components/VariantCard";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import { ArrowLeft, RefreshCw } from "lucide-react";

type Variant = "clarity" | "balanced" | "impact";

export function VariantSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = (location.state?.category || "research") as
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding";

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const isRegulatory = category === "regulatory";

  const variants = [
    {
      id: "clarity" as Variant,
      subject: "Reliance Industries - BUY Recommendation",
      preheader:
        "Target ₹2,850 | Strong fundamentals and growth outlook",
      styleNote: "Minimal and structured - focuses on clarity and readability",
    },
    {
      id: "balanced" as Variant,
      subject: "Investment Opportunity: Reliance Industries (BUY)",
      preheader:
        "Attractive entry point with 16% upside potential",
      styleNote:
        "Balanced and versatile - combines clarity with visual engagement",
    },
    ...(isRegulatory
      ? []
      : [
          {
            id: "impact" as Variant,
            subject: "🎯 Reliance Industries - Our Top Pick for Q4",
            preheader: "Don't miss this opportunity - Target ₹2,850",
            styleNote:
              "Stronger visual hierarchy - emphasizes key information and action",
          },
        ]),
  ];

  const handleContinue = () => {
    if (selectedVariant) {
      navigate("/create/preview", {
        state: { category, variant: selectedVariant },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {/* Communication State Bar */}
      <CommunicationStateBar
        title="New Communication"
        category={category}
        status="variants-ready"
        currentStep={4}
        totalSteps={5}
        onSaveDraft={() => console.log("Save draft")}
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={4} />

      <main className="mx-auto max-w-7xl px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <h1 className="text-2xl text-gray-900">
              Choose your preferred version
            </h1>
            <CategoryTag category={category} />
          </div>
          <p className="mb-2 text-gray-600">
            Each option follows Geojit style and structure, with a different
            communication emphasis.
          </p>
          <p className="text-sm text-muted-foreground">
            Stored as: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">communication.selectedVariant</code>
          </p>
        </div>

        {/* Variants Grid */}
        <div
          className={`mb-8 grid gap-6 ${isRegulatory ? "md:grid-cols-2" : "lg:grid-cols-3"}`}
        >
          {variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant.id}
              subject={variant.subject}
              preheader={variant.preheader}
              styleNote={variant.styleNote}
              selected={selectedVariant === variant.id}
              onSelect={() => setSelectedVariant(variant.id)}
              onPreview={() => {}}
            />
          ))}
        </div>

        {/* Additional Options */}
        <div className="mb-8 flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-6">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-all hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Regenerate Options
          </button>
          <span className="text-gray-300">•</span>
          <button
            onClick={() => navigate("/create/form", { state: { category } })}
            className="text-sm text-gray-700 transition-colors hover:text-[#07877B]"
          >
            Go back and edit input
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/create/form", { state: { category } })}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedVariant}
            className="rounded-lg bg-[#07877B] px-8 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#07877B] disabled:hover:shadow-md"
          >
            Continue to Preview
          </button>
        </div>
      </main>
    </div>
  );
}