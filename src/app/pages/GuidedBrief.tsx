import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
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
} from "../services/communications";

import {
  GuidedBriefData,
  saveGuidedBrief,
} from "../services/guidedCreation";

type Purpose =
  | "awareness"
  | "education"
  | "action"
  | "update"
  | "explanation";

type PersonalisationMode =
  | "brand"
  | "branch"
  | "customer";

type Channel =
  | "email"
  | "whatsapp"
  | "leaflet";

const PURPOSE_OPTIONS: Array<{
  value: Purpose;
  label: string;
  helper: string;
}> = [
  {
    value: "awareness",
    label: "Create awareness",
    helper:
      "Help customers become aware of an idea, option or opportunity.",
  },
  {
    value: "education",
    label: "Educate",
    helper:
      "Explain something in a simple and useful way.",
  },
  {
    value: "action",
    label: "Encourage an action",
    helper:
      "Help customers understand the next step they can take.",
  },
  {
    value: "update",
    label: "Share an update",
    helper:
      "Inform customers about something new or changed.",
  },
  {
    value: "explanation",
    label: "Explain something",
    helper:
      "Make a product, feature or concept easier to understand.",
  },
];

const PERSONALISATION_OPTIONS: Array<{
  value: PersonalisationMode;
  label: string;
  helper: string;
  icon: typeof Building2;
}> = [
  {
    value: "brand",
    label: "From Geojit",
    helper:
      "A standard communication presented clearly as Geojit.",
    icon: Building2,
  },
  {
    value: "branch",
    label: "From me / my branch",
    helper:
      "A more personal communication from you or your branch, within Geojit standards.",
    icon: UserRound,
  },
  {
    value: "customer",
    label: "Personalised for each customer",
    helper:
      "Prepare the communication so customer-specific details can be added later.",
    icon: UsersRound,
  },
];

const CHANNEL_OPTIONS: Array<{
  value: Channel;
  label: string;
  helper: string;
  icon: typeof Mail;
}> = [
  {
    value: "email",
    label: "Email",
    helper:
      "A structured message with subject, body and an optional action.",
    icon: Mail,
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    helper:
      "Short, mobile-first and conversational.",
    icon: MessageCircle,
  },
  {
    value: "leaflet",
    label: "Leaflet",
    helper:
      "Compact visual communication for print or sharing.",
    icon: FileText,
  },
];

export function GuidedBrief() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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

  const [
    audience,
    setAudience,
  ] =
    useState("");

  const [
    purpose,
    setPurpose,
  ] =
    useState<Purpose>(
      "awareness"
    );

  const [
    personalisationMode,
    setPersonalisationMode,
  ] =
    useState<PersonalisationMode>(
      "brand"
    );

  const [
    channels,
    setChannels,
  ] =
    useState<Channel[]>([
      "whatsapp",
    ]);

  const [
    understandingSummary,
    setUnderstandingSummary,
  ] =
    useState("");

  const canContinue =
    audience.trim().length >
      0 &&
    channels.length >
      0 &&
    !saving;

  useEffect(() => {
    async function load() {
      if (!communicationId) {
        setError(
          "Communication ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        const communication =
          await getCommunicationById(
            communicationId
          );

        const inputData =
          communication.input_data ||
          {};

        const guided =
          (
            inputData.guided &&
            typeof inputData.guided ===
              "object" &&
            !Array.isArray(
              inputData.guided
            )
          )
            ? inputData.guided as Record<string, any>
            : {};

        const understanding =
          (
            guided.understanding &&
            typeof guided.understanding ===
              "object" &&
            !Array.isArray(
              guided.understanding
            )
          )
            ? guided.understanding as Record<string, any>
            : {};

        const existingBrief =
          (
            guided.brief &&
            typeof guided.brief ===
              "object" &&
            !Array.isArray(
              guided.brief
            )
          )
            ? guided.brief as Record<string, any>
            : {};

        setUnderstandingSummary(
          typeof understanding.summary ===
            "string"
            ? understanding.summary
            : ""
        );

        setAudience(
          typeof existingBrief.audience ===
            "string" &&
          existingBrief.audience.trim()
            ? existingBrief.audience
            : (
                typeof understanding.intendedAudience ===
                  "string"
                  ? understanding.intendedAudience
                  : ""
              )
        );

        setPurpose(
          isPurpose(
            existingBrief.purpose
          )
            ? existingBrief.purpose
            : inferPurpose(
                understanding
              )
        );

        setPersonalisationMode(
          isPersonalisationMode(
            existingBrief.personalisation?.mode
          )
            ? existingBrief.personalisation.mode
            : "brand"
        );

        const existingChannels =
          Array.isArray(
            existingBrief.channels
          )
            ? existingBrief.channels.filter(
                isChannel
              )
            : [];

        setChannels(
          existingChannels.length >
            0
            ? existingChannels
            : ["whatsapp"]
        );
      } catch (err) {
        console.error(
          "Unable to load guided brief:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the guided brief."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [communicationId]);

  const selectedChannelLabels =
    useMemo(
      () =>
        CHANNEL_OPTIONS
          .filter((item) =>
            channels.includes(
              item.value
            )
          )
          .map(
            (item) =>
              item.label
          ),
      [channels]
    );

  function toggleChannel(
    channel: Channel
  ) {
    setChannels(
      (current) =>
        current.includes(
          channel
        )
          ? current.filter(
              (item) =>
                item !==
                channel
            )
          : [
              ...current,
              channel,
            ]
    );

    setError("");
  }

  function handleBack() {
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

  async function handleContinue() {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing."
      );
      return;
    }

    if (
      !audience.trim()
    ) {
      setError(
        "Please tell us who this communication is mainly for."
      );
      return;
    }

    if (
      channels.length ===
      0
    ) {
      setError(
        "Please choose at least one channel."
      );
      return;
    }

    const brief:
      GuidedBriefData = {
        audience:
          audience.trim(),

        purpose,

        personalisation: {
          mode:
            personalisationMode,
        },

        channels,
      };

    try {
      setSaving(true);
      setError("");

      await saveGuidedBrief({
        communicationId,
        brief,
      });

      navigate(
        `/create/guided/ready?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to save guided brief:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the guided brief."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2
              className="h-4 w-4 animate-spin text-[#07877B]"
              aria-hidden="true"
            />
            Preparing your guided brief...
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
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B]"
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
              Guided Brief
            </p>
          </div>

          <h1 className="text-3xl text-gray-900">
            Let's shape the communication
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            We've organised the core idea.
            Confirm who it is for, what it should achieve,
            how it should be presented, and where you want to use it.
          </p>
        </header>

        {understandingSummary && (
          <section className="mb-7 rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0] text-[#07877B]">
                <Sparkles
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
                  Your idea, in brief
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {
                    understandingSummary
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <BriefSection
            number="01"
            title="Audience"
            question="Who should receive this?"
            helper="We've pre-filled this from what we understood. Change it only if needed."
          >
            <input
              aria-label="Audience"
              required
              disabled={
                saving
              }
              value={
                audience
              }
              onChange={(event) => {
                setAudience(
                  event.target.value
                );
                setError("");
              }}
              placeholder="e.g., Customers considering starting an SIP"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
            />
          </BriefSection>

          <BriefSection
            number="02"
            title="Purpose"
            question="What should this communication achieve?"
            helper="Choose the main outcome. Communication Studio will use it to shape the communication."
            bordered
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {PURPOSE_OPTIONS.map(
                (option) => {
                  const selected =
                    purpose ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      aria-pressed={
                        selected
                      }
                      disabled={
                        saving
                      }
                      onClick={() => {
                        setPurpose(
                          option.value
                        );
                        setError("");
                      }}
                      className={`flex min-h-[92px] items-start justify-between gap-4 rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50/50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {
                            option.label
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {
                            option.helper
                          }
                        </p>
                      </div>

                      <SelectionIndicator
                        selected={
                          selected
                        }
                      />
                    </button>
                  );
                }
              )}
            </div>
          </BriefSection>

          <BriefSection
            number="03"
            title="Presentation"
            question="Who should it feel like it comes from?"
            helper="Choose how the communication should be presented. Geojit language and brand standards remain consistent."
            bordered
          >
            <div className="grid gap-3 md:grid-cols-3">
              {PERSONALISATION_OPTIONS.map(
                (option) => {
                  const Icon =
                    option.icon;

                  const selected =
                    personalisationMode ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      aria-pressed={
                        selected
                      }
                      disabled={
                        saving
                      }
                      onClick={() => {
                        setPersonalisationMode(
                          option.value
                        );
                        setError("");
                      }}
                      className={`min-h-[168px] rounded-xl border p-5 text-left transition-all focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-[#dff2ef]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            aria-hidden="true"
                            className={`h-5 w-5 ${
                              selected
                                ? "text-[#07877B]"
                                : "text-gray-600"
                            }`}
                          />
                        </div>

                        <SelectionIndicator
                          selected={
                            selected
                          }
                        />
                      </div>

                      <p className="mt-4 text-sm font-medium text-gray-900">
                        {
                          option.label
                        }
                      </p>

                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {
                          option.helper
                        }
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </BriefSection>

          <BriefSection
            number="04"
            title="Channels"
            question="Where would you like to use it?"
            helper="Choose one or more. The communication will be adapted for each selected channel."
            bordered
          >
            <div className="grid gap-3 md:grid-cols-3">
              {CHANNEL_OPTIONS.map(
                (option) => {
                  const Icon =
                    option.icon;

                  const selected =
                    channels.includes(
                      option.value
                    );

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      aria-pressed={
                        selected
                      }
                      disabled={
                        saving
                      }
                      onClick={() =>
                        toggleChannel(
                          option.value
                        )
                      }
                      className={`min-h-[158px] rounded-xl border p-5 text-left transition-all focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-[#dff2ef]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            aria-hidden="true"
                            className={`h-5 w-5 ${
                              selected
                                ? "text-[#07877B]"
                                : "text-gray-600"
                            }`}
                          />
                        </div>

                        <SelectionIndicator
                          selected={
                            selected
                          }
                        />
                      </div>

                      <p className="mt-4 text-sm font-medium text-gray-900">
                        {
                          option.label
                        }
                      </p>

                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {
                          option.helper
                        }
                      </p>
                    </button>
                  );
                }
              )}
            </div>

            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="text-gray-500">
                Selected:
              </span>

              {selectedChannelLabels.length >
                0 ? (
                selectedChannelLabels.map(
                  (label) => (
                    <span
                      key={
                        label
                      }
                      className="rounded-full bg-[#e8f5f4] px-3 py-1 font-medium text-[#075f58]"
                    >
                      {label}
                    </span>
                  )
                )
              ) : (
                <span className="text-red-600">
                  Choose at least one channel
                </span>
              )}
            </div>
          </BriefSection>
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
                Next: review the communication summary
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleContinue()
                }
                disabled={
                  !canContinue
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    Confirm Details
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


function BriefSection({
  number,
  title,
  question,
  helper,
  bordered = false,
  children,
}: {
  number:
    string;

  title:
    string;

  question:
    string;

  helper:
    string;

  bordered?:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <section
      aria-labelledby={`guided-brief-section-${number}`}
      className={`px-6 py-6 sm:px-7 sm:py-7 ${
        bordered
          ? "border-t border-gray-200"
          : ""
      }`}
    >
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#07877B]">
              {number}
            </span>

            <p className="text-sm font-medium text-gray-900">
              {title}
            </p>
          </div>

          <h2
            id={`guided-brief-section-${number}`}
            className="mt-3 text-lg leading-7 text-gray-900"
          >
            {question}
          </h2>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            {helper}
          </p>
        </div>

        <div>
          {children}
        </div>
      </div>
    </section>
  );
}


function SelectionIndicator({
  selected,
}: {
  selected:
    boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        selected
          ? "border-[#07877B] bg-[#07877B]"
          : "border-gray-300 bg-white"
      }`}
    >
      {selected && (
        <Check className="h-3.5 w-3.5 text-white" />
      )}
    </div>
  );
}


function inferPurpose(
  understanding:
    Record<string, any>
): Purpose {
  const category =
    typeof understanding.suggestedCategory ===
      "string"
      ? understanding.suggestedCategory
      : "";

  if (
    category ===
    "education"
  ) {
    return "education";
  }

  if (
    category ===
    "service" ||
    category ===
    "regulatory"
  ) {
    return "update";
  }

  return "awareness";
}


function isPurpose(
  value: unknown
): value is Purpose {
  return [
    "awareness",
    "education",
    "action",
    "update",
    "explanation",
  ].includes(
    String(value)
  );
}


function isPersonalisationMode(
  value: unknown
): value is PersonalisationMode {
  return [
    "brand",
    "branch",
    "customer",
  ].includes(
    String(value)
  );
}


function isChannel(
  value: unknown
): value is Channel {
  return [
    "email",
    "whatsapp",
    "leaflet",
  ].includes(
    String(value)
  );
}
