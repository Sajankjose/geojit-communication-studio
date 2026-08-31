import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Sparkles,
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
  buildCommunicationMaster,
  CommunicationMaster,
} from "../services/guidedCreation";

import {
  generateGuidedChannels,
} from "../services/channels/guidedChannelGeneration";

export function GuidedReady() {
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
    generating,
    setGenerating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    generationMessage,
    setGenerationMessage,
  ] =
    useState("");

  const [
    master,
    setMaster,
  ] =
    useState<
      CommunicationMaster | null
    >(null);

  useEffect(() => {
    async function prepareMaster() {
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

        const result =
          await buildCommunicationMaster(
            communicationId
          );

        setMaster(
          result
        );
      } catch (err) {
        console.error(
          "Unable to prepare communication summary:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to prepare the communication summary."
        );
      } finally {
        setLoading(false);
      }
    }

    void prepareMaster();
  }, [communicationId]);

  function handleBack() {
    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided/brief?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  async function handleGenerateChannels() {
    if (
      !communicationId ||
      !master
    ) {
      return;
    }

    try {
      setGenerating(
        true
      );

      setError(
        ""
      );

      setGenerationMessage(
        ""
      );

      const result =
        await generateGuidedChannels(
          communicationId
        );

      const summary =
        result.generated
          .map(
            (item) =>
              `${formatChannel(
                item.channel
              )}: ${item.variants} options`
          )
          .join(
            " · "
          );

      setGenerationMessage(
        `Channel options generated successfully. ${summary}`
      );

      navigate(
        `/create/guided/channels?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to generate channel options:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate channel options."
      );
    } finally {
      setGenerating(
        false
      );
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
            Preparing communication summary...
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
            generating
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back to Guided Brief
        </button>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {master ? (
          <>
            <header className="mb-8 max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles
                  className="h-5 w-5 text-[#07877B]"
                  aria-hidden="true"
                />

                <p className="text-sm font-medium text-[#07877B]">
                  Communication summary
                </p>
              </div>

              <h1 className="text-3xl text-gray-900">
                Review the communication before creating channel options
              </h1>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Check the core message and details below before Communication Studio
                adapts it for the selected channels. The meaning stays consistent
                while the format changes for each channel.
              </p>
            </header>

            <section
              aria-labelledby="guided-ready-summary-heading"
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      id="guided-ready-summary-heading"
                      className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400"
                    >
                      Core idea
                    </p>

                    <p className="mt-2 max-w-3xl text-lg leading-8 text-gray-900">
                      {
                        master.coreIdea
                      }
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58]">
                    <Check
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Summary ready
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                <MasterItem
                  label="Audience"
                  value={
                    master.audience
                  }
                />

                <MasterItem
                  label="Purpose"
                  value={
                    formatPurpose(
                      master.purpose
                    )
                  }
                  bordered
                />

                <MasterItem
                  label="Presentation"
                  value={
                    formatPersonalisation(
                      master.personalisation.mode
                    )
                  }
                  bordered
                />

                <MasterItem
                  label="Category"
                  value={
                    master.category
                      ? formatCategory(
                          master.category
                        )
                      : "To be confirmed"
                  }
                  bordered
                />
              </div>

              <div className="border-t border-gray-200 px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Selected channels
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Communication Studio will create three options for each selected channel.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {master.channels.map(
                      (channel) => (
                        <ChannelPill
                          key={
                            channel
                          }
                          channel={
                            channel
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] px-6 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0] text-[#07877B]">
                  <Sparkles
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    One core message. Adapted for each channel.
                  </p>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                    Email can carry more context, WhatsApp stays concise and
                    mobile-first, and Leaflet content becomes easier to scan.
                    The core message remains consistent across all selected channels.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Next: generate channel options
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    You will be able to compare and select the preferred option for each channel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleGenerateChannels()
                  }
                  disabled={
                    generating
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Generating channel options...
                    </>
                  ) : (
                    <>
                      Generate Channel Options
                      <ArrowRight
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              </div>

              {generationMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-700"
                >
                  {
                    generationMessage
                  }
                </div>
              )}
            </div>
          </>
        ) : (
          !error && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
              <p className="text-sm text-gray-500">
                Communication summary is not available.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}


function MasterItem({
  label,
  value,
  bordered = false,
}: {
  label:
    string;

  value:
    string;

  bordered?:
    boolean;
}) {
  return (
    <div
      className={`px-6 py-5 sm:px-7 ${
        bordered
          ? "border-t border-gray-200 sm:border-t-0 sm:border-l"
          : ""
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium leading-6 text-gray-800">
        {value}
      </p>
    </div>
  );
}


function ChannelPill({
  channel,
}: {
  channel:
    "email"
    | "whatsapp"
    | "leaflet";
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
    <span className="inline-flex items-center gap-2 rounded-full border border-[#bfe4df] bg-white px-3 py-1.5 text-xs font-medium text-[#075f58]">
      <Icon
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
      {formatChannel(
        channel
      )}
    </span>
  );
}


function formatChannel(
  channel:
    string
) {
  switch (channel) {
    case "email":
      return "Email";

    case "whatsapp":
      return "WhatsApp";

    case "leaflet":
      return "Leaflet";

    default:
      return channel;
  }
}


function formatPurpose(
  purpose:
    CommunicationMaster["purpose"]
) {
  switch (purpose) {
    case "awareness":
      return "Create awareness";

    case "education":
      return "Educate";

    case "action":
      return "Encourage an action";

    case "update":
      return "Share an update";

    case "explanation":
      return "Explain something";
  }
}


function formatPersonalisation(
  mode:
    CommunicationMaster["personalisation"]["mode"]
) {
  switch (mode) {
    case "brand":
      return "From Geojit";

    case "branch":
      return "From me / my branch";

    case "customer":
      return "Personalised for each customer";
  }
}


function formatCategory(
  category:
    NonNullable<
      CommunicationMaster["category"]
    >
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
  }
}
