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
  DesignSystemButton,
  DesignSystemCard,
  DesignSystemIcon,
  DesignSystemInput,
} from "../design-system";

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
      <div className="ds-page">
        <TopNavBar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="ds-body-sm">
            Preparing your guided brief...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-page">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">

        <DesignSystemButton
          variant="tertiary"
          size="medium"
          onClick={
            handleBack
          }
          leadingIcon={
            <DesignSystemIcon
              size="sm"
              tone="action"
            >
              <ArrowLeft />
            </DesignSystemIcon>
          }
          className="mb-6 px-0"
        >
          Back
        </DesignSystemButton>

        <div className="mb-9 max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <DesignSystemIcon
              size="md"
              tone="action"
            >
              <Sparkles />
            </DesignSystemIcon>

            <p className="ds-label-3 text-[var(--ds-text-brand)]">
              Guided Brief
            </p>
          </div>

          <h1 className="ds-title-2">
            Let's shape the communication
          </h1>

          <p className="ds-body-sm mt-3 max-w-2xl">
            We already understand your idea.
            Confirm a few simple choices so
            Communication Studio can adapt it
            for the right people and channels.
          </p>
        </div>

        {understandingSummary && (
          <DesignSystemCard
            surface="accent"
            className="mb-8 px-5 py-4"
          >
            <p className="ds-label-3 text-[var(--ds-text-brand)]">
              Your idea
            </p>

            <p className="ds-body-sm mt-2">
              {
                understandingSummary
              }
            </p>
          </DesignSystemCard>
        )}

        {error && (
          <div className="ds-alert ds-alert-error mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">

          <DesignSystemCard className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                1. Audience
              </p>

              <h2 className="ds-title-4 mt-1">
                Who should receive this?
              </h2>

              <p className="ds-body-xs mt-2">
                We've pre-filled this from
                what we understood. Change it
                only if needed.
              </p>
            </div>

            <DesignSystemInput
              label="Audience"
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
              helperText="Describe the main group this communication is intended for."
              requiredLabel
            />
          </DesignSystemCard>


          <DesignSystemCard className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                2. Purpose
              </p>

              <h2 className="ds-title-4 mt-1">
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
                      className="group text-left"
                    >
                      <DesignSystemCard
                        surface={
                          selected
                            ? "selected"
                            : "interactive"
                        }
                        className="h-full p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="ds-body-sm font-medium">
                            {
                              option.label
                            }
                          </p>

                          <p className="ds-body-xs mt-1">
                            {
                              option.helper
                            }
                          </p>
                        </div>

                        {selected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ds-brand-primary)]">
                            <DesignSystemIcon
                              size="sm"
                              tone="onDark"
                            >
                              <Check />
                            </DesignSystemIcon>
                          </div>
                        )}
                      </div>
                      </DesignSystemCard>
                    </button>
                  );
                }
              )}
            </div>
          </DesignSystemCard>


          <DesignSystemCard className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                3. Personalisation
              </p>

              <h2 className="ds-title-4 mt-1">
                How personal should it feel?
              </h2>

              <p className="ds-body-xs mt-2">
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
                      className="group text-left"
                    >
                      <DesignSystemCard
                        surface={
                          selected
                            ? "selected"
                            : "interactive"
                        }
                        className="h-full p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`mb-4 flex h-10 w-10 items-center justify-center ds-icon-container ${
                            selected
                              ? "ds-icon-container-brand"
                              : ""
                          }`}
                        >
                          <DesignSystemIcon
                            size="md"
                            tone={
                              selected
                                ? "action"
                                : "secondary"
                            }
                          >
                            <Icon />
                          </DesignSystemIcon>
                        </div>

                        {selected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ds-brand-primary)]">
                            <DesignSystemIcon
                              size="sm"
                              tone="onDark"
                            >
                              <Check />
                            </DesignSystemIcon>
                          </div>
                        )}
                      </div>

                      <p className="ds-body-sm font-medium">
                        {
                          option.label
                        }
                      </p>

                      <p className="ds-body-xs mt-2">
                        {
                          option.helper
                        }
                      </p>
                      </DesignSystemCard>
                    </button>
                  );
                }
              )}
            </div>
          </DesignSystemCard>


          <DesignSystemCard className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                4. Channels
              </p>

              <h2 className="ds-title-4 mt-1">
                Where would you like to use it?
              </h2>

              <p className="ds-body-xs mt-2">
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
                      className="group text-left"
                    >
                      <DesignSystemCard
                        surface={
                          selected
                            ? "selected"
                            : "interactive"
                        }
                        className="h-full p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center ds-icon-container ${
                            selected
                              ? "ds-icon-container-brand"
                              : ""
                          }`}
                        >
                          <DesignSystemIcon
                            size="md"
                            tone={
                              selected
                                ? "action"
                                : "secondary"
                            }
                          >
                            <Icon />
                          </DesignSystemIcon>
                        </div>

                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[var(--ds-brand-primary)] bg-[var(--ds-brand-primary)]"
                              : "border-[var(--ds-border-default)] bg-[var(--ds-white)]"
                          }`}
                        >
                          {selected && (
                            <DesignSystemIcon
                              size="sm"
                              tone="onDark"
                            >
                              <Check />
                            </DesignSystemIcon>
                          )}
                        </div>
                      </div>

                      <p className="ds-body-sm mt-4 font-medium">
                        {
                          option.label
                        }
                      </p>

                      <p className="ds-body-xs mt-2">
                        {
                          option.helper
                        }
                      </p>
                      </DesignSystemCard>
                    </button>
                  );
                }
              )}
            </div>

            {channels.length >
              0 && (
              <p className="ds-body-xs mt-4">
                Selected:{" "}
                {
                  selectedChannelLabels.join(
                    ", "
                  )
                }
              </p>
            )}
          </DesignSystemCard>

        </div>


        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--ds-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <DesignSystemButton
            variant="secondary"
            size="medium"
            onClick={
              handleBack
            }
            disabled={
              saving
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
            onClick={() =>
              void handleContinue()
            }
            disabled={
              !canContinue
            }
            loading={
              saving
            }
            loadingLabel="Saving..."
            trailingIcon={
              <DesignSystemIcon
                size="sm"
                tone="onDark"
              >
                <ArrowRight />
              </DesignSystemIcon>
            }
          >
            Confirm Guided Brief
          </DesignSystemButton>
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
