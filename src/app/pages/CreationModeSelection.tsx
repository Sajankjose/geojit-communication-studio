import {
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  DesignSystemCard,
  DesignSystemIcon,
} from "../design-system";

export function CreationModeSelection() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  function handleGuidedCreation() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  function handleExpertCreation() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/category?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  return (
    <div className="ds-page">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">

        <div className="mb-10 text-center">
          <p className="ds-label-3 mb-2 text-[var(--ds-brand-primary)]">
            Create Communication
          </p>

          <h1 className="ds-title-2">
            How would you like to create?
          </h1>

          <p className="ds-body-sm mx-auto mt-3 max-w-2xl">
            Choose the approach that best matches how you want to work.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <button
            type="button"
            onClick={
              handleGuidedCreation
            }
            className="group text-left"
          >
            <DesignSystemCard className="h-full p-7 transition-all group-hover:-translate-y-0.5 group-hover:border-[var(--ds-brand-primary)] group-hover:shadow-[var(--ds-shadow-raised)] md:p-8">

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-surface-subtle)]">
                <DesignSystemIcon
                  size="lg"
                  tone="action"
                >
                  <Sparkles />
                </DesignSystemIcon>
              </div>

              <h2 className="ds-title-3">
                Guided Creation
              </h2>

              <p className="ds-body-sm mt-3">
                Have an idea but not sure how to structure it? AI will help you capture, understand and shape the idea into a clear communication.
              </p>

              <div className="ds-button-md mt-8 flex items-center gap-2 text-[var(--ds-brand-primary)]">
                Start Guided

                <DesignSystemIcon
                  size="sm"
                  tone="action"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <ArrowRight />
                </DesignSystemIcon>
              </div>

            </DesignSystemCard>
          </button>

          <button
            type="button"
            onClick={
              handleExpertCreation
            }
            className="group text-left"
          >
            <DesignSystemCard className="h-full p-7 transition-all group-hover:-translate-y-0.5 group-hover:border-[var(--ds-brand-primary)] group-hover:shadow-[var(--ds-shadow-raised)] md:p-8">

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-surface-muted)]">
                <DesignSystemIcon
                  size="lg"
                  tone="secondary"
                >
                  <SlidersHorizontal />
                </DesignSystemIcon>
              </div>

              <h2 className="ds-title-3">
                Expert Creation
              </h2>

              <p className="ds-body-sm mt-3">
                Know exactly what you want to create? Continue with the structured workflow and provide the required communication details directly.
              </p>

              <div className="ds-button-md mt-8 flex items-center gap-2 text-[var(--ds-brand-primary)]">
                Start Expert

                <DesignSystemIcon
                  size="sm"
                  tone="action"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <ArrowRight />
                </DesignSystemIcon>
              </div>

            </DesignSystemCard>
          </button>

        </div>

        <div className="mt-8 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] px-5 py-4">
          <p className="ds-body-xs text-center">
            Guided Creation is ideal when you want help expressing the idea. Expert Creation keeps the existing structured workflow unchanged.
          </p>
        </div>

      </main>
    </div>
  );
}
