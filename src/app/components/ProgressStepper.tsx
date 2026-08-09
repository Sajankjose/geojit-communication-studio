import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
  shortLabel?: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  { id: 1, label: "Category Selection", shortLabel: "Category" },
  { id: 2, label: "Smart Input", shortLabel: "Input" },
  { id: 3, label: "AI Generation", shortLabel: "Generate" },
  { id: 4, label: "Variant Selection", shortLabel: "Select" },
  { id: 5, label: "Preview & Submit", shortLabel: "Preview" },
];

export function ProgressStepper({ currentStep, steps = defaultSteps }: ProgressStepperProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isFuture = step.id > currentStep;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Step Circle */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-[#07877B] bg-[#07877B] text-white"
                        : isCurrent
                          ? "border-[#07877B] bg-white text-[#07877B]"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${
                        isCurrent ? "text-[#07877B]" : isFuture ? "text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {step.shortLabel || step.label}
                    </span>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="mx-4 h-0.5 flex-1 bg-gray-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? "bg-[#07877B]" : "bg-gray-200"
                      }`}
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
