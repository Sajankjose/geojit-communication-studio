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
  DesignSystemButton,
  DesignSystemCard,
  DesignSystemIcon,
} from "../design-system";

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
      <div className="ds-page">
        <TopNavBar />

        <main className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--ds-brand-primary)]" />

            <p className="ds-body-sm">
              Preparing the Communication Master...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ds-page">
      <TopNavBar />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">

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
          Back to Guided Brief
        </DesignSystemButton>

        {error && (
          <div className="ds-alert ds-alert-error mb-6 text-sm">
            {error}
          </div>
        )}

        {master ? (
          <>
            <div className="mb-8 text-center">
              <div className="ds-icon-container ds-icon-container-success mx-auto mb-5 h-14 w-14 rounded-full">
                <DesignSystemIcon
                  size="lg"
                  tone="success"
                >
                  <CheckCircle2 />
                </DesignSystemIcon>
              </div>

              <p className="ds-label-3 text-[var(--ds-text-brand)]">
                Guided Creation
              </p>

              <h1 className="ds-title-2 mt-2">
                Communication Master is ready
              </h1>

              <p className="ds-body-sm mx-auto mt-4 max-w-2xl leading-7">
                Your confirmed idea is now
                ready to be adapted into the
                selected communication
                channels.
              </p>
            </div>

            <DesignSystemCard className="p-6 sm:p-8">

              <div className="mb-6">
                <p className="ds-label-3 text-[var(--ds-text-brand)]">
                  Core idea
                </p>

                <p className="mt-2 text-lg font-medium leading-8 text-[var(--ds-text-primary)]">
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

              <div className="mt-7 border-t border-[var(--ds-border-subtle)] pt-6">
                <p className="ds-body-sm font-medium">
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

              <DesignSystemCard
                surface="accent"
                className="mt-7 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <DesignSystemIcon
                    size="md"
                    tone="action"
                    className="mt-0.5"
                  >
                    <Sparkles />
                  </DesignSystemIcon>

                  <div>
                    <p className="ds-body-sm font-medium">
                      Same governed meaning. Different channel expression.
                    </p>

                    <p className="ds-body-xs mt-1 leading-6">
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
              </DesignSystemCard>

              <DesignSystemButton
                variant="primary"
                size="large"
                fullWidth
                onClick={() =>
                  void handleGenerateChannels()
                }
                disabled={
                  generating
                }
                loading={
                  generating
                }
                loadingLabel="Generating channel options..."
                trailingIcon={
                  <DesignSystemIcon
                    size="sm"
                    tone="onDark"
                  >
                    <ArrowRight />
                  </DesignSystemIcon>
                }
                className="mt-7"
              >
                Generate Channel Options
              </DesignSystemButton>

              {generationMessage && (
                <div className="ds-alert ds-alert-success mt-5 text-sm leading-6">
                  {
                    generationMessage
                  }
                </div>
              )}

            </DesignSystemCard>
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
    <DesignSystemCard
      surface="muted"
      className="p-4"
    >
      <p className="ds-label-3 text-[var(--ds-text-tertiary)]">
        {label}
      </p>

      <p className="ds-body-sm mt-2">
        {value}
      </p>
    </DesignSystemCard>
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
    <span className="ds-chip ds-chip-selected">
      <DesignSystemIcon
        size="sm"
        tone="action"
      >
        <Icon />
      </DesignSystemIcon>

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
