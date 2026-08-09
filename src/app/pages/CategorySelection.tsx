import { useState } from "react";
import { useNavigate } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CategoryCard } from "../components/CategoryCard";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import {
  TrendingUp,
  GraduationCap,
  ShoppingBag,
  Headphones,
  Shield,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

export function CategorySelection() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const categories = [
    {
      id: "research" as Category,
      icon: TrendingUp,
      title: "Research & Advisory",
      description: "Market insights, stock recommendations, and research reports",
      color: "green" as const,
    },
    {
      id: "education" as Category,
      icon: GraduationCap,
      title: "Investor Education",
      description: "Educational content and learning materials for investors",
      color: "teal" as const,
    },
    {
      id: "product" as Category,
      icon: ShoppingBag,
      title: "Product & Sales",
      description: "Product launches, offers, and promotional communications",
      color: "orange" as const,
    },
    {
      id: "service" as Category,
      icon: Headphones,
      title: "Service & Transactional",
      description: "Service updates, transaction alerts, and account notifications",
      color: "gray" as const,
    },
    {
      id: "regulatory" as Category,
      icon: Shield,
      title: "Regulatory & Compliance",
      description: "Regulatory circulars, compliance updates, and policy changes",
      color: "red" as const,
    },
    {
      id: "onboarding" as Category,
      icon: UserPlus,
      title: "Onboarding & Journey",
      description: "Welcome emails, onboarding sequences, and user journeys",
      color: "blue" as const,
    },
  ];

  const handleContinue = () => {
    if (selectedCategory) {
      navigate("/create/form", { state: { category: selectedCategory } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />
      
      {/* Communication State Bar */}
      <CommunicationStateBar
        title="New Communication"
        category={selectedCategory || "research"}
        status="draft"
        currentStep={1}
        totalSteps={5}
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={1} />

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl text-gray-900">
            What type of communication would you like to create?
          </h1>
          <p className="text-lg text-gray-600">
            Select a communication category to apply the right structure, tone,
            and compliance rules.
          </p>
        </div>

        {/* Category Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              icon={category.icon}
              title={category.title}
              description={category.description}
              color={category.color}
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedCategory}
            className="rounded-lg bg-[#07877B] px-8 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#07877B] disabled:hover:shadow-md"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}