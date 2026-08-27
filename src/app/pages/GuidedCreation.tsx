import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  DesignSystemButton,
  DesignSystemCard,
  DesignSystemIcon,
} from "../design-system";

import {
  GuidedUnderstanding,
  GuidedRawInput,
  saveGuidedRawInput,
  understandGuidedInput,
} from "../services/guidedCreation";

type StarterId =
  | "customer_question"
  | "my_experience"
  | "customer_misunderstanding"
  | "important_update"
  | "promote_something"
  | "open_idea";

interface StarterPrompt {
  id:
    StarterId;

  title:
    string;

  helper:
    string;

  starterText:
    string;

  icon:
    typeof MessageCircle;
}

const STARTER_PROMPTS:
  StarterPrompt[] = [
    {
      id:
        "customer_question",

      title:
        "Customers keep asking me about...",

      helper:
        "Start with a question or concern you regularly hear from customers.",

      starterText:
        "Customers keep asking me about ",

      icon:
        MessageCircle,
    },

    {
      id:
        "my_experience",

      title:
        "Something I usually explain...",

      helper:
        "Share something from your experience that customers find useful.",

      starterText:
        "From my experience, I usually explain to customers that ",

      icon:
        Users,
    },

    {
      id:
        "customer_misunderstanding",

      title:
        "A common misunderstanding I notice...",

      helper:
        "Tell us about something customers often misunderstand.",

      starterText:
        "A common misunderstanding I notice among customers is ",

      icon:
        Lightbulb,
    },

    {
      id:
        "important_update",

      title:
        "I want to share an important update...",

      helper:
        "Explain what has changed or what customers should know.",

      starterText:
        "I want customers to know that ",

      icon:
        MessageCircle,
    },

    {
      id:
        "promote_something",

      title:
        "I want customers to know about something useful...",

      helper:
        "Tell us about a product, feature or opportunity without worrying about the final wording.",

      starterText:
        "I want customers to know about ",

      icon:
        Sparkles,
    },

    {
      id:
        "open_idea",

      title:
        "I just have an idea...",

      helper:
        "Start anywhere. Rough thoughts are completely fine.",

      starterText:
        "",

      icon:
        Lightbulb,
    },
  ];

export function GuidedCreation() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    selectedStarter,
    setSelectedStarter,
  ] =
    useState<
      StarterId | null
    >(null);

  const [
    rawInputContent,
    setRawInputContent,
  ] =
    useState("");

  const [
    understanding,
    setUnderstanding,
  ] =
    useState<
      GuidedUnderstanding | null
    >(null);

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const characterCount =
    rawInputContent
      .trim()
      .length;

  const canContinue =
    characterCount >=
      20 &&
    !processing;

  const selectedPrompt =
    useMemo(
      () =>
        STARTER_PROMPTS.find(
          (item) =>
            item.id ===
            selectedStarter
        ) || null,
      [selectedStarter]
    );

  function buildRawInput():
    GuidedRawInput {
    return {
      inputType:
        "text",

      content:
        rawInputContent.trim(),

      originalTranscript:
        null,

      language:
        null,
    };
  }

  function handleStarterClick(
    prompt:
      StarterPrompt
  ) {
    setSelectedStarter(
      prompt.id
    );

    setError(
      ""
    );

    setUnderstanding(
      null
    );

    if (
      !rawInputContent.trim()
    ) {
      setRawInputContent(
        prompt.starterText
      );
    }
  }

  function handleBack() {
    if (
      !communicationId
    ) {
      navigate("/");
      return;
    }

    navigate(
      `/create/mode?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  async function handleUnderstandIdea() {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing. Please return to the dashboard and start again."
      );

      return;
    }

    if (
      characterCount <
      20
    ) {
      setError(
        "Tell us a little more about your idea so we can understand it properly."
      );

      return;
    }

    const rawInput =
      buildRawInput();

    try {
      setProcessing(
        true
      );

      setError(
        ""
      );

      setUnderstanding(
        null
      );

      /**
       * Save the employee's original words first.
       *
       * This is intentionally separate from AI understanding
       * so the original human input is always preserved.
       */
      await saveGuidedRawInput({
        communicationId,
        rawInput,
        starterId:
          selectedStarter,
      });

      const result =
        await understandGuidedInput({
          communicationId,
          rawInput,
          starterId:
            selectedStarter,
        });

      setUnderstanding(
        result.understanding
      );

      window.setTimeout(
        () => {
          document
            .getElementById(
              "guided-understanding"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });
        },
        50
      );
    } catch (err) {
      console.error(
        "Unable to understand guided idea:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to understand the idea. Please try again."
      );
    } finally {
      setProcessing(
        false
      );
    }
  }

  function handleEditIdea() {
    setUnderstanding(
      null
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  function handleConfirmIdea() {
    if (
      !communicationId ||
      !understanding
    ) {
      return;
    }

    navigate(
      `/create/guided/brief?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  return (
    <div className="ds-page">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">

        <div className="mb-10">
          <button
            type="button"
            onClick={
              handleBack
            }
            className="ds-button-md mb-6 inline-flex items-center gap-2 text-[var(--ds-text-secondary)] hover:text-[var(--ds-brand-primary)]"
          >
            <DesignSystemIcon
              size="sm"
              tone="secondary"
            >
              <ArrowLeft />
            </DesignSystemIcon>
            Back
          </button>

          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <DesignSystemIcon
                size="md"
                tone="action"
              >
                <Sparkles />
              </DesignSystemIcon>

              <p className="ds-label-3 text-[var(--ds-brand-primary)]">
                Guided Creation
              </p>
            </div>

            <h1 className="text-4xl font-semibold leading-tight text-[#022F2D]">
              What's on your mind?
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#4A6361]">
              Tell us the idea in your own
              words. Don't worry about
              grammar, spelling or how to
              structure the communication.
              We will help you shape it.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[#c9e1dd] bg-[#eef8f6] px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <DesignSystemIcon
              size="md"
              tone="action"
              className="mt-0.5"
            >
              <Sparkles />
            </DesignSystemIcon>

            <div>
              <p className="text-sm font-semibold text-[#022F2D]">
                Just explain it naturally
              </p>

              <p className="mt-1 text-sm leading-6 text-[#4A6361]">
                Short notes, incomplete
                sentences, simple English or
                mixed-language thoughts are
                fine. AI first tries to
                understand what you mean —
                it does not judge how you
                write.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-[#022F2D]">
              Need help getting started?
            </h2>

            <p className="mt-1 text-sm text-[#4A6361]">
              Choose a starting point, or
              simply type your idea below.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STARTER_PROMPTS.map(
              (prompt) => {
                const Icon =
                  prompt.icon;

                const selected =
                  selectedStarter ===
                  prompt.id;

                return (
                  <button
                    key={
                      prompt.id
                    }
                    type="button"
                    onClick={() =>
                      handleStarterClick(
                        prompt
                      )
                    }
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      selected
                        ? "border-[#07877B] bg-[#eef8f6] shadow-md ring-1 ring-[#07877B]/10"
                        : "border-[#d9e3e1] bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#8fc8c1] hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-[#dff2ef]"
                          : "bg-[#f1f4f4]"
                      }`}
                    >
                      <DesignSystemIcon
                        size="sm"
                        tone={
                          selected
                            ? "action"
                            : "secondary"
                        }
                      >
                        <Icon />
                      </DesignSystemIcon>
                    </div>

                    <p className="text-base font-semibold leading-6 text-[#022F2D]">
                      {
                        prompt.title
                      }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#4A6361]">
                      {
                        prompt.helper
                      }
                    </p>
                  </button>
                );
              }
            )}
          </div>

        </section>

        <section className="rounded-2xl border border-[#cfdcda] bg-white p-6 shadow-md sm:p-8">

          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-[#022F2D]">
              Tell us your idea
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#4A6361]">
              Imagine you're explaining it
              to a colleague sitting next to
              you. That's enough.
            </p>
          </div>

          {selectedPrompt && (
            <div className="mb-4 rounded-xl border border-[#d9e3e1] bg-[#f7f9f9] px-4 py-3">
              <p className="ds-label-3">
                Starting point
              </p>

              <p className="ds-body-sm mt-1">
                {
                  selectedPrompt.title
                }
              </p>
            </div>
          )}

          <textarea
            value={
              rawInputContent
            }
            onChange={(
              event
            ) => {
              setRawInputContent(
                event.target.value
              );

              setError(
                ""
              );

              setUnderstanding(
                null
              );
            }}
            rows={9}
            autoFocus
            placeholder="For example: customer asking market down again or now invest. many waiting correction. i normally tell cannot know exact bottom and can think about investing small amount at different times..."
            className="min-h-[240px] w-full resize-none rounded-2xl border border-[#c7d4d2] bg-white px-5 py-4 text-base leading-7 text-[#022F2D] outline-none transition placeholder:text-[#8da09d] focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#4A6361]">
              Grammar doesn't matter. Meaning does.
            </p>

            <p
              className={`ds-body-xs ${
                characterCount >=
                20
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {characterCount} characters
            </p>
          </div>

        </section>

        <div className="mt-6 rounded-xl border border-[#d9e3e1] bg-[#f7f9f9] px-5 py-4">
          <p className="ds-body-sm font-medium">
            What happens next?
          </p>

          <p className="ds-body-xs mt-1">
            AI will understand your idea,
            identify what is already clear,
            and ask only the questions needed
            to fill important gaps. You will
            confirm what AI understood before
            any communication is created.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#d9e3e1] pt-6 sm:flex-row sm:items-center sm:justify-between">

          <DesignSystemButton
            variant="secondary"
            size="medium"
            className="min-h-11 rounded-xl border border-[#c7d4d2] bg-white px-5 py-3 text-[#022F2D] hover:bg-[#f7f9f9]"
            onClick={
              handleBack
            }
            disabled={
              processing
            }
            leadingIcon={
              <DesignSystemIcon
                size="sm"
                tone="secondary"
              >
                <ArrowLeft />
              </DesignSystemIcon>
            }
          >
            Back
          </DesignSystemButton>

          <DesignSystemButton
            variant="primary"
            size="large"
            className="min-h-12 rounded-xl bg-[#07877B] px-7 py-3 font-semibold text-white shadow-sm hover:bg-[#06766a]"
            onClick={() =>
              void handleUnderstandIdea()
            }
            disabled={
              !canContinue
            }
            leadingIcon={
              processing
                ? (
                  <DesignSystemIcon
                    size="sm"
                    tone="onDark"
                    className="animate-spin"
                  >
                    <Loader2 />
                  </DesignSystemIcon>
                )
                : null
            }
            trailingIcon={
              processing
                ? null
                : (
                  <DesignSystemIcon
                    size="sm"
                    tone="onDark"
                  >
                    <ArrowRight />
                  </DesignSystemIcon>
                )
            }
          >
            {processing
              ? "Understanding your idea..."
              : "Help me shape this idea"}
          </DesignSystemButton>

        </div>


        {understanding && (
          <section
            id="guided-understanding"
            className="mt-12 scroll-mt-6 rounded-2xl border border-[#9bcfc9] bg-white p-6 shadow-md sm:p-8"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ds-surface-subtle)]">
                <DesignSystemIcon
                  size="md"
                  tone="success"
                >
                  <CheckCircle2 />
                </DesignSystemIcon>
              </div>

              <div>
                <p className="ds-label-3 text-[var(--ds-brand-primary)]">
                  Here's what I understood
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-[#022F2D]">
                  Is this what you mean?
                </h2>
              </div>
            </div>

            <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] p-5">
              <p className="ds-body-sm">
                {
                  understanding.summary
                }
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <UnderstandingItem
                label="What you're seeing"
                value={
                  understanding.customerSituation
                }
              />

              <UnderstandingItem
                label="Customer concern"
                value={
                  understanding.customerConcern
                }
              />

              <UnderstandingItem
                label="What you know / explain"
                value={
                  understanding.creatorInsight
                }
              />

              <UnderstandingItem
                label="Who this may help"
                value={
                  understanding.intendedAudience
                }
              />

              <UnderstandingItem
                label="Core idea"
                value={
                  understanding.coreIdea
                }
              />

              <UnderstandingItem
                label="Desired outcome"
                value={
                  understanding.desiredOutcome
                }
              />

            </div>

            {understanding.suggestedCategory && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="ds-body-xs">
                  Suggested communication area:
                </span>

                <span className="ds-chip ds-chip-sm">
                  {formatCategory(
                    understanding.suggestedCategory
                  )}
                </span>
              </div>
            )}

            {understanding.needsFollowUp &&
              understanding.nextQuestion && (
                <div className="mt-7 rounded-[var(--ds-radius-md)] border border-blue-200 bg-blue-50 p-5">
                  <p className="ds-label-3 text-blue-600">
                    One thing would help
                  </p>

                  <p className="ds-body-sm mt-2 font-medium text-blue-950">
                    {
                      understanding.nextQuestion
                    }
                  </p>

                  {understanding.suggestedAnswers.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {understanding.suggestedAnswers.map(
                        (
                          answer
                        ) => (
                          <span
                            key={
                              answer
                            }
                            className="ds-chip ds-chip-sm border-blue-200 bg-white text-blue-800"
                          >
                            {
                              answer
                            }
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

            {!understanding.needsFollowUp && (
              <div className="mt-7 rounded-[var(--ds-radius-md)] border border-green-200 bg-green-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <DesignSystemIcon
                    size="md"
                    tone="success"
                    className="mt-0.5"
                  >
                    <CheckCircle2 />
                  </DesignSystemIcon>

                  <div>
                    <p className="ds-body-sm font-medium text-green-800">
                      Your idea is clear enough to continue.
                    </p>

                    <p className="ds-body-xs mt-1 text-green-700">
                      Confirm it below, and we'll help you choose the audience, personalisation and channels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--ds-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <DesignSystemButton
                variant="secondary"
                size="medium"
                onClick={
                  handleEditIdea
                }
              >
                Not quite — edit my idea
              </DesignSystemButton>

              <DesignSystemButton
                variant="primary"
                size="large"
                onClick={
                  handleConfirmIdea
                }
                trailingIcon={
                  <DesignSystemIcon
                    size="sm"
                    tone="onDark"
                  >
                    <ArrowRight />
                  </DesignSystemIcon>
                }
              >
                Yes, that's my idea
              </DesignSystemButton>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}

function UnderstandingItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#d9e3e1] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#7a8e8b]">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#344b49]">
        {value}
      </p>
    </div>
  );
}

function formatCategory(
  category:
    string
) {
  switch (category) {
    case "research":
      return "Fundamental Research";

    case "education":
      return "Investor Education";

    case "product":
      return "Product & Sales";

    case "service":
      return "Service & Transactional";

    case "regulatory":
      return "Regulatory & Compliance";

    case "onboarding":
      return "Onboarding & Journey";

    default:
      return category;
  }
}
