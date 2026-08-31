import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  Loader2,
  Megaphone,
  Package,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import {
  useEffect,
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
  getCommunicationById,
  updateCommunication,
} from "../services/communications";

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface CategoryOption {
  id:
    Category;

  label:
    string;

  description:
    string;

  helper:
    string;

  icon:
    typeof BookOpen;
}

const CATEGORY_OPTIONS:
  CategoryOption[] = [
    {
      id:
        "research",

      label:
        "Fundamental Research",

      description:
        "Communication based on verified research, market views or investment insights.",

      helper:
        "Equity research, reports, recommendations and market views",

      icon:
        BookOpen,
    },

    {
      id:
        "education",

      label:
        "Investor Education",

      description:
        "Help customers understand investing, markets, risk and financial concepts.",

      helper:
        "Educational explainers, awareness and learning content",

      icon:
        GraduationCap,
    },

    {
      id:
        "product",

      label:
        "Product & Sales",

      description:
        "Communicate a product, feature, plan, offer or relevant customer proposition.",

      helper:
        "Products, platform features, pricing and campaigns",

      icon:
        Package,
    },

    {
      id:
        "service",

      label:
        "Service & Transactional",

      description:
        "Share service information or customer-specific operational updates.",

      helper:
        "Service updates, transactions, maintenance and notifications",

      icon:
        FileText,
    },

    {
      id:
        "regulatory",

      label:
        "Regulatory & Compliance",

      description:
        "Communicate mandatory, policy or compliance-related information clearly.",

      helper:
        "Circulars, disclosures, policy changes and required actions",

      icon:
        ShieldCheck,
    },

    {
      id:
        "onboarding",

      label:
        "Onboarding & Journey",

      description:
        "Guide customers through account setup, activation and early-stage journeys.",

      helper:
        "Welcome, setup, activation and getting-started communication",

      icon:
        UserPlus,
    },
  ];

export function CategorySelection() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<
      Category | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      Boolean(
        communicationId
      )
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (
      !communicationId
    ) {
      setLoading(false);
      return;
    }

    let cancelled =
      false;

    async function loadExistingCategory() {
      try {
        setLoading(true);
        setError("");

        const communication =
          await getCommunicationById(
            communicationId
          );

        if (
          cancelled
        ) {
          return;
        }

        setSelectedCategory(
          mapDatabaseCategoryToUi(
            communication.category
          )
        );
      } catch (err) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "Unable to load communication category:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the communication category."
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    void loadExistingCategory();

    return () => {
      cancelled =
        true;
    };
  }, [communicationId]);

  function handleBack() {
    if (
      communicationId
    ) {
      navigate(
        `/create/mode?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );

      return;
    }

    navigate("/");
  }

  async function handleContinue() {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing. Please return to the Dashboard and start again."
      );

      return;
    }

    if (
      !selectedCategory
    ) {
      setError(
        "Please choose a communication category."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      /**
       * Keep the existing database category values so
       * saved drafts and the current Expert flow remain
       * backwards compatible.
       *
       * The visible label can still use the clearer
       * "Fundamental Research" wording.
       */
      await updateCommunication(
        communicationId,
        {
          category:
            mapCategoryToDatabase(
              selectedCategory
            ),
        }
      );

      navigate(
        `/create/form?communicationId=${encodeURIComponent(
          communicationId
        )}&category=${encodeURIComponent(
          selectedCategory
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to save communication category:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the communication category."
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            Preparing category selection...
          </div>
        </main>
      </div>
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
            saving
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back to Creation Mode
        </button>

        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-[#07877B]"
              aria-hidden="true"
            />

            <p className="text-sm font-medium text-[#07877B]">
              Expert Creation
            </p>
          </div>

          <h1 className="text-3xl leading-tight text-gray-900 sm:text-4xl">
            What kind of communication are you creating?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Choose the category that best matches the communication.
            This determines the information requested and the
            category-specific checks applied in the next steps.
          </p>
        </header>

        {!communicationId && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            Communication ID is missing. Please return to the Dashboard and start a new communication.
          </div>
        )}

        {error && communicationId && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section
          aria-labelledby="communication-category-heading"
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  id="communication-category-heading"
                  className="text-sm font-medium text-gray-900"
                >
                  Communication category
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Select one category to continue.
                </p>
              </div>

              {selectedCategory && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58] sm:mt-0"
                >
                  <Check
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {getCategoryLabel(
                    selectedCategory
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {CATEGORY_OPTIONS.map(
              (
                option,
                index
              ) => {
                const Icon =
                  option.icon;

                const selected =
                  selectedCategory ===
                  option.id;

                const isRightColumn =
                  index %
                    2 ===
                  1;

                const isAfterFirstRow =
                  index >=
                  2;

                return (
                  <button
                    key={
                      option.id
                    }
                    type="button"
                    aria-pressed={
                      selected
                    }
                    onClick={() => {
                      setSelectedCategory(
                        option.id
                      );

                      setError("");
                    }}
                    disabled={
                      saving ||
                      !communicationId
                    }
                    className={`group px-6 py-6 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 md:min-h-[190px] ${
                      isRightColumn
                        ? "border-t border-gray-200 md:border-l"
                        : isAfterFirstRow
                          ? "border-t border-gray-200"
                          : ""
                    } ${
                      selected
                        ? "bg-[#f3fbfa]"
                        : "bg-white hover:bg-gray-50/70"
                    }`}
                  >
                    <div className="flex h-full items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          selected
                            ? "bg-[#dff2ef] text-[#07877B]"
                            : "bg-gray-100 text-gray-600 group-hover:bg-white"
                        }`}
                      >
                        <Icon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2
                              className={`text-lg font-medium ${
                                selected
                                  ? "text-[#075f58]"
                                  : "text-gray-900"
                              }`}
                            >
                              {
                                option.label
                              }
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {
                                option.description
                              }
                            </p>
                          </div>

                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#07877B] bg-[#07877B]"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selected && (
                              <Check
                                className="h-3.5 w-3.5 text-white"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-gray-400">
                          {
                            option.helper
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0] text-[#07877B]">
              <Megaphone
                className="h-4 w-4"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                The category guides the workflow
              </p>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                The next step asks for the source information relevant to
                this category. Generation, preview and approval then continue
                through the same Expert workflow.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={
                handleBack
              }
              disabled={
                saving
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              Back
            </button>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <p className="text-xs text-gray-500 sm:text-right">
                Next: Source Information
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleContinue()
                }
                disabled={
                  !communicationId ||
                  !selectedCategory ||
                  saving
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


function mapCategoryToDatabase(
  value:
    Category
) {
  switch (
    value
  ) {
    case "research":
      return "Research & Advisory";

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
  }
}


function mapDatabaseCategoryToUi(
  value:
    string | null
): Category | null {
  switch (
    value
  ) {
    case "research":
    case "Research & Advisory":
    case "Fundamental Research":
      return "research";

    case "education":
    case "Investor Education":
      return "education";

    case "product":
    case "Product & Sales":
      return "product";

    case "service":
    case "Service & Transactional":
      return "service";

    case "regulatory":
    case "Regulatory & Compliance":
      return "regulatory";

    case "onboarding":
    case "Onboarding & Journey":
      return "onboarding";

    default:
      return null;
  }
}


function getCategoryLabel(
  category:
    Category
) {
  switch (
    category
  ) {
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
  }
}
