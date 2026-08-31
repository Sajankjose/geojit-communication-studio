import {
  ArrowLeft,
  ArrowRight,
  Check,
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
        "A question or concern you regularly hear.",

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
        "A useful point from your own experience.",

      starterText:
        "From my experience, I usually explain to customers that ",

      icon:
        Users,
    },

    {
      id:
        "customer_misunderstanding",

      title:
        "A common misunderstanding...",

      helper:
        "Something customers often misunderstand.",

      starterText:
        "A common misunderstanding I notice among customers is ",

      icon:
        Lightbulb,
    },

    {
      id:
        "important_update",

      title:
        "An important update...",

      helper:
        "Something that has changed or customers should know.",

      starterText:
        "I want customers to know that ",

      icon:
        MessageCircle,
    },

    {
      id:
        "promote_something",

      title:
        "Something useful to share...",

      helper:
        "A product, feature or opportunity worth knowing about.",

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
        "Start anywhere. Rough thoughts are fine.",

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

  const SelectedStarterIcon =
    selectedPrompt?.icon ||
    null;

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
       * Preserve the Creator's original words before
       * the AI understanding layer interprets them.
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
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            processing
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back
        </button>

        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-[#07877B]"
              aria-hidden="true"
            />

            <p className="text-sm font-medium text-[#07877B]">
              Guided Creation
            </p>
          </div>

          <h1 className="text-3xl leading-tight text-gray-900 sm:text-4xl">
            What's on your mind?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Explain the idea in your own words.
            It does not need to sound like a finished communication yet —
            Communication Studio will help organise what you mean before you continue.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tell us the idea
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Write it naturally, just as you would explain it to a colleague.
                </p>
              </div>

              <p
                className={`text-xs ${
                  characterCount >=
                  20
                    ? "text-[#07877B]"
                    : "text-gray-400"
                }`}
              >
                {characterCount} characters
              </p>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            {selectedPrompt && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#f3fbfa] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dff2ef] text-[#07877B]">
                    {SelectedStarterIcon && (
                      <SelectedStarterIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#07877B]">
                      Starting point
                    </p>

                    <p className="mt-0.5 truncate text-sm text-gray-700">
                      {
                        selectedPrompt.title
                      }
                    </p>
                  </div>
                </div>

                <Check className="h-4 w-4 shrink-0 text-[#07877B]" />
              </div>
            )}

            <label
              htmlFor="guided-idea"
              className="sr-only"
            >
              Your communication idea
            </label>

            <textarea
              id="guided-idea"
              aria-describedby="guided-idea-help"
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
              rows={10}
              autoFocus
              placeholder="For example: Customers are asking whether they should wait because the market is falling. I usually explain that nobody can know the exact bottom and they can consider investing gradually instead of trying to time one perfect entry..."
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-5 py-4 text-base leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
            />

            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p
                id="guided-idea-help"
                className="text-xs text-gray-500"
              >
                Grammar, spelling and structure do not matter here.
              </p>

              {characterCount >
                0 &&
                characterCount <
                  20 && (
                  <p className="text-xs text-gray-400">
                    Add a little more detail to continue.
                  </p>
                )}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50/60 px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#07877B] shadow-sm">
                  <Sparkles
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Review before anything is created
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
                    Your original words are preserved. Communication Studio
                    organises the idea and shows the understanding back to you
                    before you move forward.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleUnderstandIdea()
                }
                disabled={
                  !canContinue
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reviewing your idea...
                  </>
                ) : (
                  <>
                    Review My Idea
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900">
              Need a starting point?
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Pick one only if it helps. You can also write freely without choosing anything.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    aria-pressed={
                      selected
                    }
                    onClick={() =>
                      handleStarterClick(
                        prompt
                      )
                    }
                    disabled={
                      processing
                    }
                    className={`group flex min-h-[100px] items-start gap-3 rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:opacity-50 ${
                      selected
                        ? "border-[#07877B] bg-[#f3fbfa]"
                        : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50/60"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-[#dff2ef] text-[#07877B]"
                          : "bg-gray-100 text-gray-600 group-hover:bg-white"
                      }`}
                    >
                      <Icon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-5 text-gray-900">
                          {
                            prompt.title
                          }
                        </p>

                        {selected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#07877B]">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {
                          prompt.helper
                        }
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {understanding && (
          <section
            id="guided-understanding"
            aria-labelledby="guided-understanding-title"
            className="mt-10 scroll-mt-6 overflow-hidden rounded-2xl border border-[#bfe4df] bg-white"
          >
            <div className="border-b border-gray-200 bg-[#f7fcfb] px-6 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2f3f0]">
                  <CheckCircle2
                    className="h-5 w-5 text-[#07877B]"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#07877B]">
                    Your idea, in brief
                  </p>

                  <h2
                    id="guided-understanding-title"
                    className="mt-1 text-2xl text-gray-900"
                  >
                    Is this what you mean?
                  </h2>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-7">
              <div className="max-w-3xl">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                  Summary
                </p>

                <p className="mt-2 text-base leading-7 text-gray-800">
                  {
                    understanding.summary
                  }
                </p>
              </div>

              <div className="mt-7 divide-y divide-gray-100 border-y border-gray-100">
                <UnderstandingRow
                  label="What you're seeing"
                  value={
                    understanding.customerSituation
                  }
                />

                <UnderstandingRow
                  label="Customer concern"
                  value={
                    understanding.customerConcern
                  }
                />

                <UnderstandingRow
                  label="Your insight"
                  value={
                    understanding.creatorInsight
                  }
                />

                <UnderstandingRow
                  label="Who this may help"
                  value={
                    understanding.intendedAudience
                  }
                />

                <UnderstandingRow
                  label="Core idea"
                  value={
                    understanding.coreIdea
                  }
                />

                <UnderstandingRow
                  label="Desired outcome"
                  value={
                    understanding.desiredOutcome
                  }
                />
              </div>

              {understanding.suggestedCategory && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Suggested communication area
                  </span>

                  <span className="rounded-full bg-[#e8f5f4] px-3 py-1 text-xs font-medium text-[#075f58]">
                    {formatCategory(
                      understanding.suggestedCategory
                    )}
                  </span>
                </div>
              )}

              {understanding.needsFollowUp &&
                understanding.nextQuestion && (
                  <div className="mt-6 rounded-xl border border-[#cfe3f8] bg-[#f6faff] px-5 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#356b9d]">
                      One point to consider
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-gray-900">
                      {
                        understanding.nextQuestion
                      }
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      You can refine your idea above if needed, or continue and
                      confirm the details in the next step.
                    </p>

                    {Array.isArray(
                      understanding.suggestedAnswers
                    ) &&
                      understanding.suggestedAnswers.length >
                        0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {understanding.suggestedAnswers.map(
                            (
                              answer
                            ) => (
                              <span
                                key={
                                  answer
                                }
                                className="rounded-full border border-[#cfe3f8] bg-white px-3 py-1.5 text-xs text-[#356b9d]"
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
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#f3fbfa] px-5 py-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#07877B]">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Your idea is clear enough to continue.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      Next, confirm the audience, purpose and other communication details.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50/60 px-6 py-5 sm:px-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    handleEditIdea
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Edit my idea
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmIdea
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a]"
                >
                  Yes, continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}


function UnderstandingRow({
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
    <div className="grid gap-2 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="text-sm leading-6 text-gray-700">
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
