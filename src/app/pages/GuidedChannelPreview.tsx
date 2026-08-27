import {
  ArrowLeft,
  Check,
  FileText,
  Mail,
  MessageCircle,
  RefreshCw,
  Sparkles,
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
} from "../design-system";

import {
  getGuidedChannelOutputs,
  saveGuidedChannelSelections,
} from "../services/channels/guidedChannelGeneration";

import {
  CommunicationChannel,
  CommunicationChannelOutputRecord,
  CommunicationVariant,
  EmailChannelContent,
  LeafletChannelContent,
  WhatsAppChannelContent,
} from "../services/channels/channelOutputTypes";

type SelectionMap =
  Partial<
    Record<
      CommunicationChannel,
      CommunicationVariant
    >
  >;

const CHANNEL_ORDER:
  CommunicationChannel[] = [
    "email",
    "whatsapp",
    "leaflet",
  ];

const VARIANT_HELPERS:
  Record<
    CommunicationVariant,
    {
      title:
        string;

      helper:
        string;
    }
  > = {
    A: {
      title:
        "Balanced",
      helper:
        "Clear and well-rounded.",
    },

    B: {
      title:
        "Concise",
      helper:
        "Shorter and more direct.",
    },

    C: {
      title:
        "Explanatory",
      helper:
        "Adds more context and reassurance.",
    },
  };

export function GuidedChannelPreview() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    outputs,
    setOutputs,
  ] =
    useState<
      CommunicationChannelOutputRecord[]
    >([]);

  const [
    activeChannel,
    setActiveChannel,
  ] =
    useState<
      CommunicationChannel | null
    >(null);

  const [
    selections,
    setSelections,
  ] =
    useState<SelectionMap>(
      {}
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
    savedMessage,
    setSavedMessage,
  ] =
    useState("");

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
        setLoading(true);
        setError("");

        const data =
          await getGuidedChannelOutputs(
            communicationId
          );

        setOutputs(
          data
        );

        const availableChannels =
          CHANNEL_ORDER.filter(
            (channel) =>
              data.some(
                (item) =>
                  item.channel ===
                  channel
              )
          );

        setActiveChannel(
          availableChannels[0] ||
          null
        );

        const existing:
          SelectionMap = {};

        for (
          const item of data
        ) {
          if (
            item.status ===
              "selected"
          ) {
            existing[
              item.channel
            ] =
              item.variant;
          }
        }

        setSelections(
          existing
        );
      } catch (err) {
        console.error(
          "Unable to load channel previews:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load channel previews."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [communicationId]);

  const availableChannels =
    useMemo(
      () =>
        CHANNEL_ORDER.filter(
          (channel) =>
            outputs.some(
              (item) =>
                item.channel ===
                channel
            )
        ),
      [outputs]
    );

  const activeOutputs =
    useMemo(
      () =>
        activeChannel
          ? outputs.filter(
              (item) =>
                item.channel ===
                activeChannel
            )
          : [],
      [
        outputs,
        activeChannel,
      ]
    );

  const allSelected =
    availableChannels.length >
      0 &&
    availableChannels.every(
      (channel) =>
        Boolean(
          selections[
            channel
          ]
        )
    );

  function handleBack() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided/ready?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  function selectVariant(
    channel:
      CommunicationChannel,
    variant:
      CommunicationVariant
  ) {
    setSelections(
      (current) => ({
        ...current,
        [channel]:
          variant,
      })
    );

    setSavedMessage(
      ""
    );

    setError(
      ""
    );
  }

  async function handleSaveSelections() {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing."
      );

      return;
    }

    if (
      !allSelected
    ) {
      setError(
        "Please choose one variant for each selected channel."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      await saveGuidedChannelSelections(
        communicationId,
        selections as Record<
          CommunicationChannel,
          CommunicationVariant
        >
      );

      setSavedMessage(
        "Your channel selections have been saved."
      );

      navigate(
        `/create/guided/approval-package?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to save channel selections:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save channel selections."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="ds-page">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <p className="ds-body-sm">
            Loading channel options...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="ds-page">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-6 py-10">

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

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <DesignSystemIcon
              size="md"
              tone="action"
            >
              <Sparkles />
            </DesignSystemIcon>

            <p className="ds-label-3 text-[var(--ds-text-brand)]">
              Channel Preview
            </p>
          </div>

          <h1 className="ds-title-2">
            Choose the best version for each channel
          </h1>

          <p className="ds-body-sm mt-3 max-w-3xl leading-7">
            The core meaning stays the same.
            Compare the channel-specific
            variants and choose the version
            that communicates it best.
          </p>
        </div>

        {error && (
          <div className="ds-alert ds-alert-error mb-6 text-sm">
            {error}
          </div>
        )}

        {outputs.length ===
          0 ? (
          <DesignSystemCard className="p-10 text-center">
            <div className="ds-icon-container mx-auto mb-4 h-12 w-12">
              <DesignSystemIcon
                size="lg"
                tone="secondary"
              >
                <RefreshCw />
              </DesignSystemIcon>
            </div>

            <h2 className="ds-title-4">
              No channel outputs found
            </h2>

            <p className="ds-body-sm mt-2">
              Return to Communication Master
              and generate the channel options
              first.
            </p>
          </DesignSystemCard>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {availableChannels.map(
                (channel) => {
                  const active =
                    channel ===
                    activeChannel;

                  const selected =
                    selections[
                      channel
                    ];

                  return (
                    <button
                      key={
                        channel
                      }
                      type="button"
                      onClick={() =>
                        setActiveChannel(
                          channel
                        )
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-[var(--ds-brand-primary)] bg-[var(--ds-brand-primary)] text-[var(--ds-text-inverse)]"
                          : "border-[var(--ds-border-subtle)] bg-[var(--ds-surface-card)] text-[var(--ds-text-primary)] hover:border-[var(--ds-border-interactive)] hover:bg-[var(--ds-surface-interactive-hover)]"
                      }`}
                    >
                      <ChannelIcon
                        channel={
                          channel
                        }
                      />

                      {formatChannel(
                        channel
                      )}

                      {selected && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-[var(--ds-success-soft)] text-[var(--ds-success)]"
                          }`}
                        >
                          {selected} selected
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {activeChannel && (
              <div className="grid gap-5 lg:grid-cols-3">
                {activeOutputs.map(
                  (output) => {
                    const variantInfo =
                      VARIANT_HELPERS[
                        output.variant
                      ];

                    const selected =
                      selections[
                        output.channel
                      ] ===
                      output.variant;

                    return (
                      <DesignSystemCard
                        key={
                          output.id
                        }
                        surface={
                          selected
                            ? "selected"
                            : "default"
                        }
                        className="flex min-h-[560px] flex-col overflow-hidden"
                      >
                        <div className="border-b border-[var(--ds-border-subtle)] px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                                Variant {output.variant}
                              </p>

                              <h2 className="ds-title-4 mt-1">
                                {
                                  variantInfo.title
                                }
                              </h2>

                              <p className="ds-body-xs mt-1">
                                {
                                  variantInfo.helper
                                }
                              </p>
                            </div>

                            {selected && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ds-brand-primary)]">
                                <DesignSystemIcon
                                  size="sm"
                                  tone="onDark"
                                >
                                  <Check />
                                </DesignSystemIcon>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-[var(--ds-surface-muted)] p-4">
                          <div className="mx-auto max-w-xl rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-card)] p-5">
                            <ChannelContentPreview
                              output={
                                output
                              }
                            />
                          </div>
                        </div>

                        <div className="border-t border-[var(--ds-border-subtle)] bg-[var(--ds-surface-card)] p-4">
                          <DesignSystemButton
                            variant={
                              selected
                                ? "secondary"
                                : "primary"
                            }
                            size="medium"
                            fullWidth
                            onClick={() =>
                              selectVariant(
                                output.channel,
                                output.variant
                              )
                            }
                            leadingIcon={
                              selected ? (
                                <DesignSystemIcon
                                  size="sm"
                                  tone="action"
                                >
                                  <Check />
                                </DesignSystemIcon>
                              ) : undefined
                            }
                          >
                            {selected
                              ? "Selected"
                              : `Choose Variant ${output.variant}`}
                          </DesignSystemButton>
                        </div>
                      </DesignSystemCard>
                    );
                  }
                )}
              </div>
            )}

            <DesignSystemCard className="mt-8 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ds-body-sm font-medium">
                    Channel selection
                  </p>

                  <p className="ds-body-sm mt-1">
                    Choose one variant for
                    every selected channel
                    before continuing.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableChannels.map(
                      (channel) => (
                        <span
                          key={
                            channel
                          }
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            selections[
                              channel
                            ]
                              ? "bg-[var(--ds-success-soft)] text-[var(--ds-success)]"
                              : "bg-[var(--ds-surface-muted)] text-[var(--ds-text-tertiary)]"
                          }`}
                        >
                          {formatChannel(
                            channel
                          )}:{" "}
                          {selections[
                            channel
                          ] ||
                            "Not selected"}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <DesignSystemButton
                  variant="primary"
                  size="large"
                  onClick={() =>
                    void handleSaveSelections()
                  }
                  disabled={
                    !allSelected ||
                    saving
                  }
                  loading={
                    saving
                  }
                  loadingLabel="Saving..."
                >
                  Save Channel Selections
                </DesignSystemButton>
              </div>

              {savedMessage && (
                <div className="ds-alert ds-alert-success mt-5 text-sm">
                  {
                    savedMessage
                  }
                </div>
              )}
            </DesignSystemCard>
          </>
        )}

      </main>
    </div>
  );
}


function ChannelContentPreview({
  output,
}: {
  output:
    CommunicationChannelOutputRecord;
}) {
  if (
    output.channel ===
      "email"
  ) {
    const content =
      output.content_json as
        EmailChannelContent;

    return (
      <div>
        <PreviewMeta
          label="Subject"
          value={
            content.subject
          }
        />

        <PreviewMeta
          label="Preheader"
          value={
            content.preheader
          }
        />

        <h3 className="mt-6 text-xl font-semibold leading-7 text-[var(--ds-text-primary)]">
          {
            content.headline
          }
        </h3>

        <p className="mt-4 text-sm leading-7 text-[var(--ds-text-secondary)]">
          {
            content.opening
          }
        </p>

        {content.bodySections.map(
          (
            section,
            index
          ) => (
            <div
              key={
                `${section.heading}-${index}`
              }
              className="mt-5"
            >
              {section.heading && (
                <h4 className="text-sm font-semibold text-[var(--ds-text-primary)]">
                  {
                    section.heading
                  }
                </h4>
              )}

              <p className="mt-1 text-sm leading-7 text-[var(--ds-text-secondary)]">
                {
                  section.content
                }
              </p>
            </div>
          )
        )}

        <SimplePoints
          points={
            content.keyPoints
          }
        />

        {content.cta && (
          <div className="mt-5">
            <span className="inline-flex rounded-lg bg-[var(--ds-brand-primary)] px-4 py-2 text-sm font-medium text-[var(--ds-text-inverse)]">
              {
                content.cta.label
              }
            </span>
          </div>
        )}

        <MandatoryNotes
          notes={
            content.mandatoryNotes
          }
        />
      </div>
    );
  }

  if (
    output.channel ===
      "whatsapp"
  ) {
    const content =
      output.content_json as
        WhatsAppChannelContent;

    return (
      <div>
        <div className="mx-auto max-w-sm rounded-2xl bg-[#eaf7e8] p-4">
          {content.headline && (
            <h3 className="text-sm font-semibold text-[var(--ds-text-primary)]">
              {
                content.headline
              }
            </h3>
          )}

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ds-text-primary)]">
            {
              content.message
            }
          </p>

          <SimplePoints
            points={
              content.keyPoints
            }
          />

          {content.cta && (
            <p className="mt-4 text-sm font-medium text-[var(--ds-text-brand)]">
              {
                content.cta.label
              }
            </p>
          )}
        </div>

        <MandatoryNotes
          notes={
            content.mandatoryNotes
          }
        />
      </div>
    );
  }

  const content =
    output.content_json as
      LeafletChannelContent;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-brand)]">
        Leaflet concept
      </p>

      <h3 className="mt-3 text-2xl font-semibold leading-8 text-[var(--ds-text-primary)]">
        {
          content.headline
        }
      </h3>

      {content.subheadline && (
        <p className="mt-2 text-base leading-6 text-[var(--ds-text-secondary)]">
          {
            content.subheadline
          }
        </p>
      )}

      <p className="mt-5 text-sm leading-7 text-[var(--ds-text-secondary)]">
        {
          content.intro
        }
      </p>

      <div className="mt-5 space-y-3">
        {content.keyPoints.map(
          (
            point,
            index
          ) => (
            <div
              key={
                `${point.title}-${index}`
              }
              className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] p-3"
            >
              <p className="text-sm font-semibold text-[var(--ds-text-primary)]">
                {
                  point.title
                }
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--ds-text-secondary)]">
                {
                  point.description
                }
              </p>
            </div>
          )
        )}
      </div>

      {content.cta && (
        <div className="mt-5 rounded-lg bg-[var(--ds-brand-primary)] px-4 py-3 text-[var(--ds-text-inverse)]">
          <p className="text-sm font-medium">
            {
              content.cta.label
            }
          </p>

          {content.cta.supportingText && (
            <p className="mt-1 text-xs text-white/80">
              {
                content.cta.supportingText
              }
            </p>
          )}
        </div>
      )}

      {content.visualDirection && (
        <div className="mt-5 border-t border-dashed border-[var(--ds-border-default)] pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
            Visual direction
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--ds-text-secondary)]">
            {
              content.visualDirection
            }
          </p>
        </div>
      )}

      <MandatoryNotes
        notes={
          content.mandatoryNotes
        }
      />
    </div>
  );
}


function PreviewMeta({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-[var(--ds-text-secondary)]">
        {value}
      </p>
    </div>
  );
}


function SimplePoints({
  points,
}: {
  points:
    string[];
}) {
  if (
    points.length ===
      0
  ) {
    return null;
  }

  return (
    <ul className="mt-5 space-y-2">
      {points.map(
        (
          point,
          index
        ) => (
          <li
            key={
              `${point}-${index}`
            }
            className="flex gap-2 text-sm leading-6 text-[var(--ds-text-secondary)]"
          >
            <span className="text-[var(--ds-text-brand)]">
              •
            </span>

            <span>
              {point}
            </span>
          </li>
        )
      )}
    </ul>
  );
}


function MandatoryNotes({
  notes,
}: {
  notes:
    string[];
}) {
  if (
    notes.length ===
      0
  ) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-[var(--ds-border-subtle)] pt-4">
      {notes.map(
        (
          note,
          index
        ) => (
          <p
            key={
              `${note}-${index}`
            }
            className="mt-1 text-[11px] leading-5 text-[var(--ds-text-tertiary)]"
          >
            {note}
          </p>
        )
      )}
    </div>
  );
}


function ChannelIcon({
  channel,
}: {
  channel:
    CommunicationChannel;
}) {
  const Icon =
    channel ===
      "email"
      ? Mail
      : channel ===
          "whatsapp"
        ? MessageCircle
        : FileText;

  return (
    <Icon className="h-4 w-4" />
  );
}


function formatChannel(
  channel:
    CommunicationChannel
) {
  switch (channel) {
    case "email":
      return "Email";

    case "whatsapp":
      return "WhatsApp";

    case "leaflet":
      return "Leaflet";
  }
}
