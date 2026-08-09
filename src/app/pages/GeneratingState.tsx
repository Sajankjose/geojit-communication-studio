import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import { Check, Loader2 } from "lucide-react";

export function GeneratingState() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || "research";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/create/variants", { state: { category } });
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigate, category]);

  const steps = [
    { label: "Reading your input", delay: 0 },
    { label: "Structuring communication", delay: 800 },
    { label: "Applying Geojit tone", delay: 1600 },
    { label: "Generating variants", delay: 2400 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {/* Communication State Bar */}
      <CommunicationStateBar
        title="New Communication"
        category={category as any}
        status="generating"
        currentStep={3}
        totalSteps={5}
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={3} />

      <main className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-8">
        <div className="w-full max-w-2xl text-center">
          {/* Animated Loader */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#07877B]">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
              <div className="absolute inset-0 animate-ping rounded-full bg-[#07877B] opacity-20"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-3xl text-gray-900">
            Generating your email options
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Applying category logic, Geojit tone, and email structure.
          </p>

          {/* System Update Note */}
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50/30 p-3">
            <p className="text-sm text-blue-900">
              Updating <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs">communication.variants</code>
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <ProgressStep
                key={index}
                label={step.label}
                delay={step.delay}
              />
            ))}
          </div>

          {/* Reassuring Text */}
          <p className="mt-12 text-sm text-muted-foreground">
            This usually takes a few seconds...
          </p>
        </div>
      </main>
    </div>
  );
}

function ProgressStep({ label, delay }: { label: string; delay: number }) {
  const [completed, setCompleted] = React.useState(false);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const activeTimer = setTimeout(() => setActive(true), delay);
    const completeTimer = setTimeout(() => setCompleted(true), delay + 600);

    return () => {
      clearTimeout(activeTimer);
      clearTimeout(completeTimer);
    };
  }, [delay]);

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ${
        completed
          ? "border-green-200 bg-green-50/50"
          : active
            ? "border-[#07877B] bg-[#e8f5f4]/30"
            : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all ${
          completed
            ? "bg-green-500"
            : active
              ? "bg-[#07877B]"
              : "bg-gray-200"
        }`}
      >
        {completed ? (
          <Check className="h-4 w-4 text-white" />
        ) : active ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-white"></div>
        )}
      </div>
      <span
        className={`transition-colors ${
          completed
            ? "text-green-700"
            : active
              ? "text-[#07877B]"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Add React import for hooks
import * as React from "react";