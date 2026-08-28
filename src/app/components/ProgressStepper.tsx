import {
  Check,
} from "lucide-react";


type ProgressStepperProps = {
  currentStep:
    number;
};


const STEPS = [
  {
    number:
      1,

    label:
      "Category",

    shortLabel:
      "Category",
  },

  {
    number:
      2,

    label:
      "Source Information",

    shortLabel:
      "Source",
  },

  {
    number:
      3,

    label:
      "AI Generation",

    shortLabel:
      "Generate",
  },

  {
    number:
      4,

    label:
      "Choose Option",

    shortLabel:
      "Choose",
  },

  {
    number:
      5,

    label:
      "Preview & Approval",

    shortLabel:
      "Preview",
  },
] as const;


export function ProgressStepper({
  currentStep,
}: ProgressStepperProps) {
  const resolvedStep =
    Math.min(
      Math.max(
        currentStep,
        1
      ),
      STEPS.length
    );

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="hidden min-h-[62px] items-center md:flex">
          {STEPS.map(
            (
              step,
              index
            ) => {
              const complete =
                step.number <
                resolvedStep;

              const active =
                step.number ===
                resolvedStep;

              return (
                <div
                  key={
                    step.number
                  }
                  className="flex min-w-0 flex-1 items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                        complete
                          ? "border-[#07877B] bg-[#07877B] text-white"
                          : active
                            ? "border-[#07877B] bg-[#e8f5f4] text-[#075f58]"
                            : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {complete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        step.number
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`truncate text-xs font-medium ${
                          active
                            ? "text-[#075f58]"
                            : complete
                              ? "text-gray-700"
                              : "text-gray-400"
                        }`}
                      >
                        {
                          step.label
                        }
                      </p>

                      {active && (
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#07877B]">
                          Current
                        </p>
                      )}
                    </div>
                  </div>

                  {index <
                    STEPS.length -
                      1 && (
                    <div
                      className={`mx-4 h-px flex-1 ${
                        complete
                          ? "bg-[#bfe4df]"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            }
          )}
        </div>


        <div className="flex min-h-[56px] items-center justify-between gap-4 md:hidden">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#07877B]">
              Step{" "}
              {resolvedStep} of{" "}
              {STEPS.length}
            </p>

            <p className="mt-1 truncate text-sm font-medium text-gray-900">
              {
                STEPS[
                  resolvedStep -
                    1
                ].label
              }
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {STEPS.map(
              (
                step
              ) => {
                const complete =
                  step.number <
                  resolvedStep;

                const active =
                  step.number ===
                  resolvedStep;

                return (
                  <span
                    key={
                      step.number
                    }
                    aria-label={`Step ${step.number}: ${step.shortLabel}`}
                    className={`h-2 rounded-full transition-all ${
                      active
                        ? "w-6 bg-[#07877B]"
                        : complete
                          ? "w-2 bg-[#8fc9c3]"
                          : "w-2 bg-gray-200"
                    }`}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
