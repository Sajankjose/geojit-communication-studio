import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  CommunicationStateBar,
} from "../components/CommunicationStateBar";

import {
  ProgressStepper,
} from "../components/ProgressStepper";

import {
  getCommunicationById,
} from "../services/communications";

import {
  supabase,
} from "../../lib/supabase";


type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

type GenerationStatus =
  | "checking"
  | "queued"
  | "running"
  | "completed"
  | "failed";

type ProgressStepState =
  | "complete"
  | "active"
  | "pending";

interface AiRunStatus {
  id:
    string;

  status:
    string;

  error_message:
    string | null;

  created_at:
    string;
}

interface GenerationProgressStep {
  label:
    string;

  helper:
    string;

  state:
    ProgressStepState;
}

const POLL_INTERVAL_MS =
  2000;


export function GeneratingState() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const category =
    (
      searchParams.get(
        "category"
      ) ||
      "research"
    ) as Category;

  const [
    title,
    setTitle,
  ] =
    useState(
      "New Communication"
    );

  const [
    generationStatus,
    setGenerationStatus,
  ] =
    useState<GenerationStatus>(
      "checking"
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    startedAt,
  ] =
    useState(
      () =>
        Date.now()
    );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState(
      0
    );


  /**
   * Elapsed time is only a UX indicator.
   * It does not determine completion.
   */
  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setElapsedSeconds(
            Math.floor(
              (
                Date.now() -
                startedAt
              ) /
                1000
            )
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    startedAt,
  ]);


  /**
   * Poll the real communication record and
   * most recent AI run from Supabase.
   *
   * Supabase remains the source of truth.
   */
  useEffect(() => {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing."
      );

      setGenerationStatus(
        "failed"
      );

      return;
    }

    let cancelled =
      false;

    async function checkGeneration() {
      try {
        const communication =
          await getCommunicationById(
            communicationId!,
            {
              forceRefresh:
                true,
            }
          );

        if (
          cancelled
        ) {
          return;
        }

        setTitle(
          communication.title ||
          "New Communication"
        );

        /**
         * The background worker has completed
         * and the generated variants are saved.
         */
        if (
          communication.status ===
          "variants_ready"
        ) {
          setGenerationStatus(
            "completed"
          );

          navigate(
            `/create/variants?communicationId=${encodeURIComponent(
              communicationId!
            )}&category=${encodeURIComponent(
              category
            )}`,
            {
              replace:
                true,
            }
          );

          return;
        }

        /**
         * Read the most recent AI run.
         * RLS keeps the query scoped to the
         * authenticated user's communication.
         */
        const {
          data:
            aiRuns,
          error:
            aiRunError,
        } =
          await supabase
            .from(
              "ai_runs"
            )
            .select(
              "id,status,error_message,created_at"
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(
              1
            );

        if (
          aiRunError
        ) {
          throw new Error(
            aiRunError.message
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        const latestRun =
          (
            aiRuns?.[
              0
            ] ||
            null
          ) as
            | AiRunStatus
            | null;

        /**
         * The starter can return before the
         * background worker creates ai_runs.
         * A short no-row period is therefore normal.
         */
        if (
          !latestRun
        ) {
          setGenerationStatus(
            "queued"
          );

          return;
        }

        if (
          latestRun.status ===
          "failed"
        ) {
          setGenerationStatus(
            "failed"
          );

          setError(
            latestRun.error_message ||
            "AI generation failed. Please try again."
          );

          return;
        }

        if (
          latestRun.status ===
            "running" ||
          latestRun.status ===
            "queued"
        ) {
          setGenerationStatus(
            latestRun.status as
              | "running"
              | "queued"
          );

          return;
        }

        /**
         * ai_runs may complete slightly before
         * communications.status becomes variants_ready.
         * Keep polling rather than navigating early.
         */
        if (
          latestRun.status ===
          "completed"
        ) {
          setGenerationStatus(
            "completed"
          );
        }
      } catch (
        err
      ) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "Unable to check generation status:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to check AI generation status."
        );

        setGenerationStatus(
          "failed"
        );
      }
    }

    void checkGeneration();

    const poller =
      window.setInterval(
        () => {
          void checkGeneration();
        },
        POLL_INTERVAL_MS
      );

    return () => {
      cancelled =
        true;

      window.clearInterval(
        poller
      );
    };
  }, [
    communicationId,
    category,
    navigate,
  ]);


  const progressSteps =
    useMemo(
      () =>
        buildProgressSteps(
          generationStatus,
          elapsedSeconds
        ),
      [
        generationStatus,
        elapsedSeconds,
      ]
    );


  function handleRetry() {
    if (
      !communicationId
    ) {
      navigate(
        "/"
      );

      return;
    }

    navigate(
      `/create/form?communicationId=${encodeURIComponent(
        communicationId
      )}&category=${encodeURIComponent(
        category
      )}`
    );
  }


  function handleDashboard() {
    navigate(
      "/"
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={
          title
        }
        category={
          category
        }
        status="generating"
        currentStep={
          3
        }
        totalSteps={
          5
        }
      />

      <ProgressStepper
        currentStep={
          3
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        {generationStatus !==
        "failed" ? (
          <GeneratingView
            status={
              generationStatus
            }
            elapsedSeconds={
              elapsedSeconds
            }
            steps={
              progressSteps
            }
            category={
              category
            }
          />
        ) : (
          <FailureView
            error={
              error
            }
            onRetry={
              handleRetry
            }
            onDashboard={
              handleDashboard
            }
          />
        )}
      </main>
    </div>
  );
}


function GeneratingView({
  status,
  elapsedSeconds,
  steps,
  category,
}: {
  status:
    GenerationStatus;

  elapsedSeconds:
    number;

  steps:
    GenerationProgressStep[];

  category:
    Category;
}) {
  const completedCount =
    steps.filter(
      (step) =>
        step.state ===
        "complete"
    ).length;

  const activeStep =
    steps.find(
      (step) =>
        step.state ===
        "active"
    );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5f4]">
          <Sparkles className="h-5 w-5 text-[#07877B]" />
        </div>

        <p className="mt-5 text-sm font-medium text-[#07877B]">
          Expert Creation
        </p>

        <h1 className="mt-2 text-3xl text-gray-900">
          Creating your communication options
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
          Communication Studio is applying the relevant rules to your
          verified source information and preparing{" "}
          {category ===
          "regulatory"
            ? "two"
            : "three"}{" "}
          structured options for you to compare.
        </p>
      </header>


      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                Current status
              </p>

              <p className="mt-2 text-lg font-medium text-gray-900">
                {getStatusTitle(
                  status
                )}
              </p>

              {activeStep && (
                <p className="mt-1 text-sm text-gray-500">
                  {
                    activeStep.helper
                  }
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f5f4]">
                <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {completedCount} of{" "}
                  {steps.length} stages complete
                </p>

                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatElapsedTime(
                    elapsedSeconds
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="px-6 py-6 sm:px-7">
          <div className="space-y-0">
            {steps.map(
              (
                step,
                index
              ) => (
                <ProgressRow
                  key={
                    step.label
                  }
                  step={
                    step
                  }
                  isLast={
                    index ===
                    steps.length -
                      1
                  }
                />
              )
            )}
          </div>
        </div>


        <div className="border-t border-gray-200 bg-[#f7fcfb] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0]">
              <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                No action needed
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                This screen checks the real generation status automatically.
                Once the options are safely saved, the comparison screen will
                open on its own.
              </p>
            </div>
          </div>
        </div>
      </section>


      <p className="mt-5 text-center text-xs leading-5 text-gray-500">
        Generation time can vary with the amount and complexity of the source information.
      </p>
    </div>
  );
}


function ProgressRow({
  step,
  isLast,
}: {
  step:
    GenerationProgressStep;

  isLast:
    boolean;
}) {
  const complete =
    step.state ===
    "complete";

  const active =
    step.state ===
    "active";

  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            complete
              ? "border-[#07877B] bg-[#07877B]"
              : active
                ? "border-[#07877B] bg-white"
                : "border-gray-300 bg-white"
          }`}
        >
          {complete ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : active ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#07877B]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          )}
        </div>

        {!isLast && (
          <div
            className={`min-h-[54px] w-px ${
              complete
                ? "bg-[#bfe4df]"
                : "bg-gray-200"
            }`}
          />
        )}
      </div>

      <div className="pb-6">
        <p
          className={`text-sm font-medium ${
            complete
              ? "text-gray-800"
              : active
                ? "text-[#075f58]"
                : "text-gray-500"
          }`}
        >
          {
            step.label
          }
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {
            step.helper
          }
        </p>
      </div>
    </div>
  );
}


function FailureView({
  error,
  onRetry,
  onDashboard,
}: {
  error:
    string;

  onRetry:
    () => void;

  onDashboard:
    () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
        <div className="bg-red-50 px-6 py-7 text-center sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-2xl text-gray-900">
            We couldn't complete the generation
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
            The communication options were not completed successfully.
            Your source information is still available, so you can return
            to the input screen and try again.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-red-500">
              Generation error
            </p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {error ||
                "The AI generation did not complete successfully."}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={
                onDashboard
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={
                onRetry
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a]"
            >
              <RefreshCw className="h-4 w-4" />
              Return to Input
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function buildProgressSteps(
  status:
    GenerationStatus,
  elapsedSeconds:
    number
):
  GenerationProgressStep[] {
  /**
   * These stages provide UX feedback only.
   * Completion and navigation remain controlled
   * exclusively by the real Supabase state.
   */

  if (
    status ===
    "completed"
  ) {
    return [
      {
        label:
          "Source information received",

        helper:
          "The verified source information is ready for generation.",

        state:
          "complete",
      },

      {
        label:
          "Communication rules applied",

        helper:
          "Brand, category and governance rules have been applied.",

        state:
          "complete",
      },

      {
        label:
          "Communication options generated",

        helper:
          "The structured variants have been created.",

        state:
          "complete",
      },

      {
        label:
          "Options saved and validated",

        helper:
          "The generated options are safely stored and ready to compare.",

        state:
          "complete",
      },
    ];
  }


  if (
    status ===
      "checking" ||
    status ===
      "queued"
  ) {
    return [
      {
        label:
          "Source information received",

        helper:
          "Your saved source information is available to the generation process.",

        state:
          "complete",
      },

      {
        label:
          "Preparing AI generation",

        helper:
          "The generation job is being prepared and queued.",

        state:
          "active",
      },

      {
        label:
          "Creating communication options",

        helper:
          "Multiple structured variants will be generated for comparison.",

        state:
          "pending",
      },

      {
        label:
          "Saving and validating options",

        helper:
          "The final variants will be checked and stored before you continue.",

        state:
          "pending",
      },
    ];
  }


  if (
    elapsedSeconds <
    15
  ) {
    return [
      {
        label:
          "Source information received",

        helper:
          "Your saved source information is available to the generation process.",

        state:
          "complete",
      },

      {
        label:
          "Applying communication rules",

        helper:
          "Brand, category and governance rules are being applied.",

        state:
          "active",
      },

      {
        label:
          "Creating communication options",

        helper:
          "Multiple structured variants will be generated for comparison.",

        state:
          "pending",
      },

      {
        label:
          "Saving and validating options",

        helper:
          "The final variants will be checked and stored before you continue.",

        state:
          "pending",
      },
    ];
  }


  if (
    elapsedSeconds <
    35
  ) {
    return [
      {
        label:
          "Source information received",

        helper:
          "Your saved source information is available to the generation process.",

        state:
          "complete",
      },

      {
        label:
          "Communication rules applied",

        helper:
          "Brand, category and governance rules have been applied.",

        state:
          "complete",
      },

      {
        label:
          "Creating communication options",

        helper:
          "The structured variants are now being prepared.",

        state:
          "active",
      },

      {
        label:
          "Saving and validating options",

        helper:
          "The final variants will be checked and stored before you continue.",

        state:
          "pending",
      },
    ];
  }


  return [
    {
      label:
        "Source information received",

      helper:
        "Your saved source information is available to the generation process.",

      state:
        "complete",
    },

    {
      label:
        "Communication rules applied",

      helper:
        "Brand, category and governance rules have been applied.",

      state:
        "complete",
    },

    {
      label:
        "Communication options generated",

      helper:
        "The structured variants have been created.",

      state:
        "complete",
    },

    {
      label:
        "Saving and validating options",

      helper:
        "The generated variants are being checked and safely stored.",

      state:
        "active",
    },
  ];
}


function getStatusTitle(
  status:
    GenerationStatus
) {
  switch (
    status
  ) {
    case "checking":
      return "Checking generation status";

    case "queued":
      return "Preparing generation";

    case "running":
      return "Generating communication options";

    case "completed":
      return "Finalising your options";

    default:
      return "Generating communication";
  }
}


function formatElapsedTime(
  elapsedSeconds:
    number
) {
  if (
    elapsedSeconds <
    60
  ) {
    return `${elapsedSeconds}s elapsed`;
  }

  const minutes =
    Math.floor(
      elapsedSeconds /
      60
    );

  const seconds =
    elapsedSeconds %
    60;

  return `${minutes}m ${seconds}s elapsed`;
}
