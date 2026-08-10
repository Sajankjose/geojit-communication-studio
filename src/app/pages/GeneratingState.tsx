import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router";
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";

import {
  getCommunicationById,
} from "../services/communications";

import { supabase } from "../../lib/supabase";

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

interface AiRunStatus {
  id: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const POLL_INTERVAL_MS = 2000;

export function GeneratingState() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const category =
    (searchParams.get(
      "category"
    ) || "research") as Category;

  const [title, setTitle] =
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

  const [error, setError] =
    useState("");

  const [startedAt] =
    useState(() => Date.now());

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  /**
   * Keep a simple elapsed-time indicator.
   * This does not drive completion.
   * Supabase status is the source of truth.
   */
  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setElapsedSeconds(
          Math.floor(
            (Date.now() -
              startedAt) /
              1000
          )
        );
      },
      1000
    );

    return () =>
      window.clearInterval(
        timer
      );
  }, [startedAt]);

  /**
   * Poll the real communication record
   * and latest AI run from Supabase.
   */
  useEffect(() => {
    if (!communicationId) {
      setError(
        "Communication ID is missing."
      );
      setGenerationStatus(
        "failed"
      );
      return;
    }

    let cancelled = false;

    async function checkGeneration() {
      try {
        const communication =
          await getCommunicationById(
            communicationId!
          );

        if (cancelled) {
          return;
        }

        setTitle(
          communication.title ||
            "New Communication"
        );

        /**
         * Background worker has completed
         * and saved the variants.
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
              replace: true,
            }
          );

          return;
        }

        /**
         * Read the most recent AI run.
         * RLS keeps this scoped to the
         * authenticated user's communication.
         */
        const {
          data: aiRuns,
          error: aiRunError,
        } = await supabase
          .from("ai_runs")
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
              ascending: false,
            }
          )
          .limit(1);

        if (aiRunError) {
          throw new Error(
            aiRunError.message
          );
        }

        if (cancelled) {
          return;
        }

        const latestRun =
          (aiRuns?.[0] ||
            null) as
            | AiRunStatus
            | null;

        /**
         * The starter returns before the
         * background worker creates ai_runs,
         * so a short no-row period is normal.
         */
        if (!latestRun) {
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
         * ai_runs may finish just before
         * communications.status is updated.
         * Keep polling briefly rather than
         * navigating early.
         */
        if (
          latestRun.status ===
          "completed"
        ) {
          setGenerationStatus(
            "completed"
          );
        }
      } catch (err) {
        if (cancelled) {
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

    checkGeneration();

    const poller =
      window.setInterval(
        checkGeneration,
        POLL_INTERVAL_MS
      );

    return () => {
      cancelled = true;

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
    if (!communicationId) {
      navigate("/");
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
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={title}
        category={category}
        status="generating"
        currentStep={3}
        totalSteps={5}
      />

      <ProgressStepper
        currentStep={3}
      />

      <main className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">

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
            />
          ) : (
            <FailureView
              error={error}
              onRetry={
                handleRetry
              }
              onDashboard={
                handleDashboard
              }
            />
          )}

        </div>
      </main>
    </div>
  );
}

function GeneratingView({
  status,
  elapsedSeconds,
  steps,
}: {
  status: GenerationStatus;
  elapsedSeconds: number;
  steps: Array<{
    label: string;
    state:
      | "complete"
      | "active"
      | "pending";
  }>;
}) {
  return (
    <div className="text-center">

      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#07877B] shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>

          <div className="absolute inset-0 animate-ping rounded-full bg-[#07877B] opacity-15" />
        </div>
      </div>

      <h1 className="mb-3 text-3xl text-gray-900">
        Creating your email options
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">
        The Geojit AI engine is
        processing your source
        information, applying the
        relevant communication rules,
        and preparing structured email
        variants.
      </p>

      <div className="mb-8 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4 text-left">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[#07877B]" />

          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusTitle(
                status
              )}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              You can stay on this
              screen while generation
              completes. The next step
              will open automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-left">
        {steps.map(
          (step) => (
            <RealProgressStep
              key={step.label}
              label={step.label}
              state={step.state}
            />
          )
        )}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Elapsed time:{" "}
        {elapsedSeconds}s
      </p>

      <p className="mt-2 text-xs text-gray-500">
        Generation may take around a
        minute depending on the
        communication complexity.
      </p>

    </div>
  );
}

function FailureView({
  error,
  onRetry,
  onDashboard,
}: {
  error: string;
  onRetry: () => void;
  onDashboard: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </div>

      <h1 className="mb-3 text-2xl text-gray-900">
        We couldn't complete the generation
      </h1>

      <p className="mx-auto max-w-lg text-sm leading-6 text-gray-600">
        {error ||
          "The AI generation did not complete successfully."}
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-white transition-colors hover:bg-[#06766a]"
        >
          <RefreshCw className="h-4 w-4" />
          Return to Input
        </button>

        <button
          type="button"
          onClick={onDashboard}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go to Dashboard
        </button>

      </div>

    </div>
  );
}

function RealProgressStep({
  label,
  state,
}: {
  label: string;
  state:
    | "complete"
    | "active"
    | "pending";
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
        state === "complete"
          ? "border-green-200 bg-green-50/50"
          : state === "active"
            ? "border-[#07877B] bg-[#e8f5f4]/30"
            : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          state === "complete"
            ? "bg-green-500"
            : state === "active"
              ? "bg-[#07877B]"
              : "bg-gray-200"
        }`}
      >
        {state ===
        "complete" ? (
          <Check className="h-4 w-4 text-white" />
        ) : state ===
          "active" ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>

      <span
        className={`text-sm ${
          state === "complete"
            ? "text-green-700"
            : state === "active"
              ? "font-medium text-[#07877B]"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function buildProgressSteps(
  status: GenerationStatus,
  elapsedSeconds: number
) {
  /**
   * These stages provide UX feedback only.
   * Completion/navigation is controlled
   * exclusively by the real Supabase state.
   */
  if (
    status === "completed"
  ) {
    return [
      {
        label:
          "Source information received",
        state:
          "complete" as const,
      },
      {
        label:
          "Communication rules applied",
        state:
          "complete" as const,
      },
      {
        label:
          "Email variants generated",
        state:
          "complete" as const,
      },
      {
        label:
          "Saving structured options",
        state:
          "complete" as const,
      },
    ];
  }

  if (
    status === "checking" ||
    status === "queued"
  ) {
    return [
      {
        label:
          "Source information received",
        state:
          "complete" as const,
      },
      {
        label:
          "Preparing AI generation",
        state:
          "active" as const,
      },
      {
        label:
          "Creating email variants",
        state:
          "pending" as const,
      },
      {
        label:
          "Saving structured options",
        state:
          "pending" as const,
      },
    ];
  }

  if (
    elapsedSeconds < 15
  ) {
    return [
      {
        label:
          "Source information received",
        state:
          "complete" as const,
      },
      {
        label:
          "Applying Geojit and category rules",
        state:
          "active" as const,
      },
      {
        label:
          "Creating email variants",
        state:
          "pending" as const,
      },
      {
        label:
          "Saving structured options",
        state:
          "pending" as const,
      },
    ];
  }

  if (
    elapsedSeconds < 35
  ) {
    return [
      {
        label:
          "Source information received",
        state:
          "complete" as const,
      },
      {
        label:
          "Geojit and category rules applied",
        state:
          "complete" as const,
      },
      {
        label:
          "Creating email variants",
        state:
          "active" as const,
      },
      {
        label:
          "Saving structured options",
        state:
          "pending" as const,
      },
    ];
  }

  return [
    {
      label:
        "Source information received",
      state:
        "complete" as const,
    },
    {
      label:
        "Geojit and category rules applied",
      state:
        "complete" as const,
    },
    {
      label:
        "Email variants generated",
      state:
        "complete" as const,
    },
    {
      label:
        "Saving and validating structured options",
      state:
        "active" as const,
    },
  ];
}

function getStatusTitle(
  status: GenerationStatus
) {
  switch (status) {
    case "checking":
      return "Checking generation status...";

    case "queued":
      return "AI generation queued";

    case "running":
      return "AI generation in progress";

    case "completed":
      return "Generation completed";

    default:
      return "Generating communication";
  }
}
