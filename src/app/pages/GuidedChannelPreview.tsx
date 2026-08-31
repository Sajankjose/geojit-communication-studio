import {
  ArrowLeft,
  ArrowRight,
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
      title: string;
      helper: string;
    }
  > = {
    A: {
      title: "Balanced",
      helper:
        "Clear and well-rounded.",
    },

    B: {
      title: "Concise",
      helper:
        "Shorter and more direct.",
    },

    C: {
      title: "Explanatory",
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

  const selectedCount =
    availableChannels.filter(
      (channel) =>
        Boolean(
          selections[
            channel
          ]
        )
    ).length;

  const allSelected =
    availableChannels.length >
      0 &&
    selectedCount ===
      availableChannels.length;

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
      saving
    ) {
      return;
    }

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
        "Please choose one option for each selected channel."
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
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <RefreshCw
              className="h-4 w-4 animate-spin text-[#07877B]"
              aria-hidden="true"
            />
            Loading channel options...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            saving
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles
                className="h-5 w-5 text-[#07877B]"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-[#07877B]">
                Channel Options
              </p>
            </div>

            <h1 className="text-3xl text-gray-900">
              Choose an option for each channel
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              The core message stays consistent.
              Compare the channel-specific options
              and choose the preferred option for each channel
              before preparing the approval package.
            </p>
          </div>

          {outputs.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 lg:pb-1"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  allSelected
                    ? "bg-[#07877B] text-white"
                    : "bg-[#e8f5f4] text-[#07877B]"
                }`}
              >
                {allSelected ? (
                  <Check
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {selectedCount}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCount} of{" "}
                  {availableChannels.length} selected
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {allSelected
                    ? "Ready to continue"
                    : "One selection is required per channel"}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {outputs.length ===
          0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <RefreshCw
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-4 text-lg font-medium text-gray-900">
              No channel options found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Return to the communication summary and
              generate the channel options first.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                  Channels
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Channel options"
                className="grid sm:grid-cols-3"
              >
                {availableChannels.map(
                  (channel, index) => {
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
                        role="tab"
                        id={`channel-tab-${channel}`}
                        aria-selected={
                          active
                        }
                        aria-controls={`channel-panel-${channel}`}
                        disabled={
                          saving
                        }
                        onClick={() =>
                          setActiveChannel(
                            channel
                          )
                        }
                        className={`flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 ${
                          index > 0
                            ? "border-t border-gray-200 sm:border-l sm:border-t-0"
                            : ""
                        } ${
                          active
                            ? "bg-[#f3fbfa]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? "bg-[#dff2ef] text-[#07877B]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <ChannelIcon
                              channel={
                                channel
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                active
                                  ? "text-[#075f58]"
                                  : "text-gray-900"
                              }`}
                            >
                              {formatChannel(
                                channel
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {selected
                                ? `Option ${selected} selected`
                                : "Select an option"}
                            </p>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#07877B] bg-[#07877B]"
                              : active
                                ? "border-[#9bcfc9] bg-white"
                                : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            {activeChannel && (
              <section
                role="tabpanel"
                id={`channel-panel-${activeChannel}`}
                aria-labelledby={`channel-tab-${activeChannel}`}
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
                      {formatChannel(
                        activeChannel
                      )}
                    </p>

                    <h2 className="mt-1 text-xl text-gray-900">
                      Compare options
                    </h2>
                  </div>

                  <p className="text-sm text-gray-500">
                    Choose the option you prefer for this channel.
                  </p>
                </div>

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
                        <article
                          key={
                            output.id
                          }
                          aria-label={`Option ${output.variant}: ${variantInfo.title}`}
                          className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition-all lg:min-h-[520px] ${
                            selected
                              ? "border-[#07877B] shadow-[0_0_0_3px_rgba(7,135,123,0.08)]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="px-5 pb-4 pt-5 sm:px-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
                                    Option {output.variant}
                                  </span>

                                  {selected && (
                                    <span className="rounded-full bg-[#e8f5f4] px-2 py-0.5 text-[11px] font-medium text-[#075f58]">
                                      Selected
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-2 text-lg font-medium text-gray-900">
                                  {
                                    variantInfo.title
                                  }
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                  {
                                    variantInfo.helper
                                  }
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  selectVariant(
                                    output.channel,
                                    output.variant
                                  )
                                }
                                disabled={
                                  saving
                                }
                                aria-label={`Select Option ${output.variant}`}
                                aria-pressed={
                                  selected
                                }
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  selected
                                    ? "border-[#07877B] bg-[#07877B]"
                                    : "border-gray-300 bg-white hover:border-[#07877B]"
                                }`}
                              >
                                {selected && (
                                  <Check className="h-4 w-4 text-white" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mx-5 border-t border-gray-100 sm:mx-6" />

                          <div className="flex-1 px-5 py-5 sm:px-6">
                            <ChannelContentPreview
                              output={
                                output
                              }
                            />
                          </div>

                          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
                            <button
                              type="button"
                              onClick={() =>
                                selectVariant(
                                  output.channel,
                                  output.variant
                                )
                              }
                              disabled={
                                saving
                              }
                              aria-pressed={
                                selected
                              }
                              className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                                selected
                                  ? "bg-[#07877B] text-white"
                                  : "border border-[#9bcfc9] bg-white text-[#075f58] hover:bg-[#f3fbfa]"
                              }`}
                            >
                              {selected
                                ? "Selected"
                                : `Choose Option ${output.variant}`}
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            <div className="mt-9 border-t border-gray-200 pt-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Your channel selections
                  </p>

                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-2"
                  >
                    {availableChannels.map(
                      (channel) => {
                        const selection =
                          selections[
                            channel
                          ];

                        return (
                          <div
                            key={
                              channel
                            }
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              aria-hidden="true"
                              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                selection
                                  ? "bg-[#e8f5f4] text-[#07877B]"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {selection ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              )}
                            </div>

                            <span className="text-gray-600">
                              {formatChannel(
                                channel
                              )}
                            </span>

                            <span
                              className={`font-medium ${
                                selection
                                  ? "text-gray-900"
                                  : "text-gray-400"
                              }`}
                            >
                              {selection
                                ? `Option ${selection}`
                                : "Not selected"}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleSaveSelections()
                  }
                  disabled={
                    !allSelected ||
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Approval Package
                      <ArrowRight
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              </div>

              {savedMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {
                    savedMessage
                  }
                </div>
              )}
            </div>
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
        <div className="space-y-3 rounded-xl bg-gray-50 px-4 py-3">
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
        </div>

        <h4 className="mt-5 text-xl font-semibold leading-7 text-gray-900">
          {
            content.headline
          }
        </h4>

        <p className="mt-4 text-sm leading-7 text-gray-700">
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
                <h5 className="text-sm font-semibold text-gray-900">
                  {
                    section.heading
                  }
                </h5>
              )}

              <p className="mt-1 text-sm leading-7 text-gray-700">
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
            <span className="inline-flex rounded-lg bg-[#07877B] px-4 py-2 text-sm font-medium text-white">
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
        <div className="rounded-2xl bg-[#f3f4f6] p-3">
          <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-md bg-[#e7f6e4] px-4 py-3 shadow-sm">
            {content.headline && (
              <h4 className="text-sm font-semibold text-gray-900">
                {
                  content.headline
                }
              </h4>
            )}

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
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
              <div className="mt-4 border-t border-[#cce8c8] pt-3">
                <p className="text-center text-sm font-medium text-[#075f58]">
                  {
                    content.cta.label
                  }
                </p>
              </div>
            )}
          </div>
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
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
        Leaflet concept
      </p>

      <h4 className="mt-3 text-2xl font-semibold leading-8 text-gray-900">
        {
          content.headline
        }
      </h4>

      {content.subheadline && (
        <p className="mt-2 text-base leading-6 text-gray-600">
          {
            content.subheadline
          }
        </p>
      )}

      <p className="mt-5 text-sm leading-7 text-gray-700">
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
              className="border-l-2 border-[#bfe4df] pl-3"
            >
              <p className="text-sm font-semibold text-gray-900">
                {
                  point.title
                }
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {
                  point.description
                }
              </p>
            </div>
          )
        )}
      </div>

      {content.cta && (
        <div className="mt-5 rounded-lg bg-[#07877B] px-4 py-3 text-white">
          <p className="text-sm font-medium">
            {
              content.cta.label
            }
          </p>

          {content.cta.supportingText && (
            <p className="mt-1 text-xs leading-5 text-white/80">
              {
                content.cta.supportingText
              }
            </p>
          )}
        </div>
      )}

      {content.visualDirection && (
        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Visual direction
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-600">
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
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-700">
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
            className="flex gap-2 text-sm leading-6 text-gray-700"
          >
            <span className="mt-[1px] text-[#07877B]">
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
    <div className="mt-6 border-t border-gray-200 pt-4">
      {notes.map(
        (
          note,
          index
        ) => (
          <p
            key={
              `${note}-${index}`
            }
            className="mt-1 text-[11px] leading-5 text-gray-500"
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
