import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
          "Unable to prepare Communication Master:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to prepare the Communication Master."
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
              )}: ${item.variants} variants`
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

        <main className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />

            <p className="text-sm text-gray-500">
              Preparing the Communication Master...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">

        <button
          type="button"
          onClick={
            handleBack
          }
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#07877B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guided Brief
        </button>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {master ? (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>

              <p className="text-sm font-medium text-[#07877B]">
                Guided Creation
              </p>

              <h1 className="mt-2 text-3xl text-gray-900">
                Communication Master is ready
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600">
                Your confirmed idea is now
                ready to be adapted into the
                selected communication
                channels.
              </p>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
                  Core idea
                </p>

                <p className="mt-2 text-lg leading-8 text-gray-900">
                  {
                    master.coreIdea
                  }
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                />

                <MasterItem
                  label="Personalisation"
                  value={
                    formatPersonalisation(
                      master.personalisation.mode
                    )
                  }
                />

                <MasterItem
                  label="Communication area"
                  value={
                    master.category
                      ? formatCategory(
                          master.category
                        )
                      : "To be confirmed"
                  }
                />
              </div>

              <div className="mt-7 border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-900">
                  Selected channels
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
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

              <div className="mt-7 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-[#07877B]" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Same governed meaning. Different channel expression.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Each selected channel
                      will receive three
                      variants. Email can be
                      more explanatory,
                      WhatsApp will be
                      mobile-first, and
                      Leaflet content will be
                      more scannable.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleGenerateChannels()
                }
                disabled={
                  generating
                }
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating channel options...
                  </>
                ) : (
                  <>
                    Generate Channel Options
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {generationMessage && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-700">
                  {
                    generationMessage
                  }
                </div>
              )}

            </section>
          </>
        ) : null}

      </main>
    </div>
  );
}


function MasterItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-700">
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
    <span className="inline-flex items-center gap-2 rounded-full border border-[#bfe4df] bg-[#f3fbfa] px-3 py-1.5 text-xs font-medium text-[#075f58]">
      <Icon className="h-3.5 w-3.5" />
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
