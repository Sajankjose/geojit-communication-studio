import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
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

type StarterId =
  | "customer_question"
  | "my_experience"
  | "customer_misunderstanding"
  | "important_update"
  | "promote_something"
  | "open_idea";

interface StarterPrompt {
  id: StarterId;
  title: string;
  helper: string;
  starterText: string;
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
    rawIdea,
    setRawIdea,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const characterCount =
    rawIdea.trim().length;

  const canContinue =
    characterCount >= 20;

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

  function handleStarterClick(
    prompt:
      StarterPrompt
  ) {
    setSelectedStarter(
      prompt.id
    );

    setError("");

    /**
     * Only insert the starter text
     * when the user has not already
     * written their own idea.
     */
    if (
      !rawIdea.trim()
    ) {
      setRawIdea(
        prompt.starterText
      );
    }
  }

  function handleBack() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/mode?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  function handleContinue() {
    if (!communicationId) {
      setError(
        "Communication ID is missing. Please return to the dashboard and start again."
      );

      return;
    }

    if (
      !canContinue
    ) {
      setError(
        "Tell us a little more about your idea so we can understand it properly."
      );

      return;
    }

    /**
     * FIRST CHECKPOINT ONLY
     *
     * No AI or database write yet.
     *
     * The next implementation will
     * persist rawIdea and send it to
     * the Idea Understanding AI layer.
     */
    console.log(
      "Guided idea captured:",
      {
        communicationId,
        selectedStarter,
        rawIdea,
      }
    );

    setError(
      "Idea captured successfully. AI understanding will be connected in the next step."
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">

        {/* Header */}

        <div className="mb-10">
          <button
            type="button"
            onClick={
              handleBack
            }
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#07877B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#07877B]" />

              <p className="text-sm font-medium text-[#07877B]">
                Guided Creation
              </p>
            </div>

            <h1 className="text-3xl leading-tight text-gray-900 sm:text-4xl">
              What's on your mind?
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Tell us the idea in your own
              words. Don't worry about
              grammar, spelling or how to
              structure the communication.
              We will help you shape it.
            </p>
          </div>
        </div>

        {/* Reassurance */}

        <div className="mb-8 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#07877B]" />

            <div>
              <p className="text-sm font-medium text-gray-900">
                Just explain it naturally
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Short notes, incomplete
                sentences, simple English or
                mixed-language thoughts are
                fine. The first job of AI is
                to understand what you mean —
                not to judge how you write.
              </p>
            </div>
          </div>
        </div>

        {/* Starter prompts */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-lg text-gray-900">
              Need help getting started?
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose a starting point, or
              simply type your idea below.
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
                    onClick={() =>
                      handleStarterClick(
                        prompt
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-[#07877B] bg-[#f3fbfa] shadow-sm"
                        : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-[#dff2ef]"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          selected
                            ? "text-[#07877B]"
                            : "text-gray-600"
                        }`}
                      />
                    </div>

                    <p className="text-sm font-medium leading-5 text-gray-900">
                      {
                        prompt.title
                      }
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
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

        {/* Main idea capture */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-5">
            <h2 className="text-xl text-gray-900">
              Tell us your idea
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Imagine you're explaining it
              to a colleague sitting next to
              you. That's enough.
            </p>
          </div>

          {selectedPrompt && (
            <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Starting point
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {
                  selectedPrompt.title
                }
              </p>
            </div>
          )}

          <textarea
            value={
              rawIdea
            }
            onChange={(
              event
            ) => {
              setRawIdea(
                event.target.value
              );

              setError(
                ""
              );
            }}
            rows={9}
            autoFocus
            placeholder="For example: Many customers tell me they are waiting for the market to come down before investing. I usually explain that nobody knows the exact bottom and they can think about investing gradually instead of putting everything at one time..."
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-5 py-4 text-base leading-7 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Grammar doesn't matter.
              Meaning does.
            </p>

            <p
              className={`text-xs ${
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

        {/* What happens next */}

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm font-medium text-gray-800">
            What happens next?
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            AI will understand your idea,
            identify what is already clear,
            and ask only the questions needed
            to fill important gaps. You will
            confirm what AI understood before
            any communication is created.
          </p>
        </div>

        {error && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              error.startsWith(
                "Idea captured"
              )
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* Actions */}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={
              handleBack
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={
              handleContinue
            }
            disabled={
              !canContinue
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Help me shape this idea
            <ArrowRight className="h-4 w-4" />
          </button>

        </div>

      </main>
    </div>
  );
}
