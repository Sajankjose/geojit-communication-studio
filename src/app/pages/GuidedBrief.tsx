import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  MessageCircle,
  FileText,
  Sparkles,
  UserRound,
  Building2,
  UsersRound,
} from "lucide-react";

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
    helper: "Help customers become aware of an idea, option or opportunity.",
  },
  {
    value: "education",
    label: "Educate",
    helper: "Explain something in a simple and useful way.",
  },
  {
    value: "action",
    label: "Encourage an action",
    helper: "Help customers understand the next step they can take.",
  },
  {
    value: "update",
    label: "Share an update",
    helper: "Inform customers about something new or changed.",
  },
  {
    value: "explanation",
    label: "Explain something",
    helper: "Make a product, feature or concept easier to understand.",
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
    helper: "Standard communication in Geojit's approved brand voice.",
    icon: Building2,
  },
  {
    value: "branch",
    label: "From me / my branch",
    helper: "More human and conversational, while staying within Geojit governance.",
    icon: UserRound,
  },
  {
    value: "customer",
    label: "Personalised for each customer",
    helper: "Prepare the communication for customer-level personalisation later.",
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
    helper: "Structured communication with subject, body and CTA.",
    icon: Mail,
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    helper: "Short, mobile-first and conversational.",
    icon: MessageCircle,
  },
  {
    value: "leaflet",
    label: "Leaflet",
    helper: "Compact visual communication for print or sharing.",
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

      /**
       * Next checkpoint:
       * Channel-aware generation.
       *
       * For now we stop here after safely saving the
       * Guided Brief rather than touching the existing
       * Expert generation engine.
       */
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

        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="text-sm text-gray-500">
            Preparing your guided brief...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">

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

        <div className="mb-9 max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#07877B]" />

            <p className="text-sm font-medium text-[#07877B]">
              Guided Brief
            </p>
          </div>

          <h1 className="text-3xl text-gray-900">
            Let's shape the communication
          </h1>

          <p className="mt-3 text-base leading-7 text-gray-600">
            We already understand your idea.
            Confirm a few simple choices so
            Communication Studio can adapt it
            for the right people and channels.
          </p>
        </div>

        {understandingSummary && (
          <div className="mb-8 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
              Your idea
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-700">
              {
                understandingSummary
              }
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-8">

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#07877B]">
                1. Audience
              </p>

              <h2 className="mt-1 text-xl text-gray-900">
                Who should receive this?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                We've pre-filled this from
                what we understood. Change it
                only if needed.
              </p>
            </div>

            <input
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
            />
          </section>


          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#07877B]">
                2. Purpose
              </p>

              <h2 className="mt-1 text-xl text-gray-900">
                What should this communication achieve?
              </h2>
            </div>

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
                      onClick={() =>
                        setPurpose(
                          option.value
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 hover:border-[#9bcfc9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
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

                        {selected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#07877B]">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>


          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#07877B]">
                3. Personalisation
              </p>

              <h2 className="mt-1 text-xl text-gray-900">
                How personal should it feel?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                You don't need to choose a
                writing tone. Communication
                Studio will apply the right
                Geojit tone automatically.
              </p>
            </div>

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
                      onClick={() =>
                        setPersonalisationMode(
                          option.value
                        )
                      }
                      className={`rounded-xl border p-5 text-left transition-all ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 hover:border-[#9bcfc9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-[#dff2ef]"
                            : "bg-gray-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            selected
                              ? "text-[#07877B]"
                              : "text-gray-600"
                          }`} />
                        </div>

                        {selected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#07877B]">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium text-gray-900">
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
          </section>


          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#07877B]">
                4. Channels
              </p>

              <h2 className="mt-1 text-xl text-gray-900">
                Where would you like to use it?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                You can choose more than one.
                Each output will be adapted to
                the channel rather than simply
                copied or resized.
              </p>
            </div>

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
                      onClick={() =>
                        toggleChannel(
                          option.value
                        )
                      }
                      className={`rounded-xl border p-5 text-left transition-all ${
                        selected
                          ? "border-[#07877B] bg-[#f3fbfa]"
                          : "border-gray-200 hover:border-[#9bcfc9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-[#dff2ef]"
                            : "bg-gray-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            selected
                              ? "text-[#07877B]"
                              : "text-gray-600"
                          }`} />
                        </div>

                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#07877B] bg-[#07877B]"
                            : "border-gray-300 bg-white"
                        }`}>
                          {selected && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
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

            {channels.length >
              0 && (
              <p className="mt-4 text-xs text-gray-500">
                Selected:{" "}
                {
                  selectedChannelLabels.join(
                    ", "
                  )
                }
              </p>
            )}
          </section>

        </div>


        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={
              handleBack
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() =>
              void handleContinue()
            }
            disabled={
              !canContinue
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Saving..."
              : "Confirm Guided Brief"}

            {!saving && (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>

      </main>
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
