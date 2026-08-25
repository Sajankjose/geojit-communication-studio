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
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <p className="text-sm text-gray-500">
            Loading channel options...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-6 py-10">

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

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#07877B]" />

            <p className="text-sm font-medium text-[#07877B]">
              Channel Preview
            </p>
          </div>

          <h1 className="text-3xl text-gray-900">
            Choose the best version for each channel
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
            The core meaning stays the same.
            Compare the channel-specific
            variants and choose the version
            that communicates it best.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {outputs.length ===
          0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 text-gray-400" />

            <h2 className="text-lg text-gray-900">
              No channel outputs found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Return to Communication Master
              and generate the channel options
              first.
            </p>
          </div>
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
                          ? "border-[#07877B] bg-[#07877B] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#9bcfc9]"
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
                              : "bg-green-50 text-green-700"
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
                      <article
                        key={
                          output.id
                        }
                        className={`flex min-h-[560px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                          selected
                            ? "border-[#07877B] ring-2 ring-[#07877B]/10"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="border-b border-gray-200 px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
                                Variant {output.variant}
                              </p>

                              <h2 className="mt-1 text-lg text-gray-900">
                                {
                                  variantInfo.title
                                }
                              </h2>

                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {
                                  variantInfo.helper
                                }
                              </p>
                            </div>

                            {selected && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07877B]">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-50 p-4">
                          <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-5">
                            <ChannelContentPreview
                              output={
                                output
                              }
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-200 bg-white p-4">
                          <button
                            type="button"
                            onClick={() =>
                              selectVariant(
                                output.channel,
                                output.variant
                              )
                            }
                            className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                              selected
                                ? "bg-[#e8f5f4] text-[#075f58]"
                                : "bg-[#07877B] text-white hover:bg-[#06766a]"
                            }`}
                          >
                            {selected
                              ? "Selected"
                              : `Choose Variant ${output.variant}`}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Channel selection
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
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
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
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

                <button
                  type="button"
                  onClick={() =>
                    void handleSaveSelections()
                  }
                  disabled={
                    !allSelected ||
                    saving
                  }
                  className="rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? "Saving..."
                    : "Save Channel Selections"}
                </button>
              </div>

              {savedMessage && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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

        <h3 className="mt-6 text-xl font-semibold leading-7 text-gray-900">
          {
            content.headline
          }
        </h3>

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
                <h4 className="text-sm font-semibold text-gray-900">
                  {
                    section.heading
                  }
                </h4>
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
        <div className="mx-auto max-w-sm rounded-2xl bg-[#eaf7e8] p-4">
          {content.headline && (
            <h3 className="text-sm font-semibold text-gray-900">
              {
                content.headline
              }
            </h3>
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
            <p className="mt-4 text-sm font-medium text-[#075f58]">
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
      <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
        Leaflet concept
      </p>

      <h3 className="mt-3 text-2xl font-semibold leading-8 text-gray-900">
        {
          content.headline
        }
      </h3>

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
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
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
            <p className="mt-1 text-xs text-white/80">
              {
                content.cta.supportingText
              }
            </p>
          )}
        </div>
      )}

      {content.visualDirection && (
        <div className="mt-5 border-t border-dashed border-gray-300 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
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
    <div className="mb-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
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
            <span className="text-[#07877B]">
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
