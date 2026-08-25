import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  ShieldCheck,
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
  useAuth,
} from "../auth/useAuth";

import {
  buildGuidedApprovalPackage,
  getGuidedApprovalPackage,
  GuidedApprovalPackage as GuidedApprovalPackageData,
} from "../services/channels/guidedApprovalPackage";

import {
  EmailChannelContent,
  LeafletChannelContent,
  WhatsAppChannelContent,
} from "../services/channels/channelOutputTypes";

export function GuidedApprovalPackage() {
  const navigate =
    useNavigate();

  const {
    profile,
    loading:
      authLoading,
  } =
    useAuth();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const mode =
    searchParams.get(
      "mode"
    );

  const isReviewer =
    profile?.role ===
      "marketing_reviewer" ||
    profile?.role ===
      "corpcom_reviewer";

  const isReviewMode =
    mode ===
      "review" &&
    isReviewer;

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    approvalPackage,
    setApprovalPackage,
  ] =
    useState<
      GuidedApprovalPackageData | null
    >(null);

  useEffect(() => {
    if (
      authLoading
    ) {
      return;
    }

    async function prepare() {
      if (
        !communicationId
      ) {
        setError(
          "Communication ID is missing."
        );

        setLoading(
          false
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        /**
         * REVIEWER MODE
         *
         * Reviewers must never rebuild or modify the
         * Creator's approval package. They only read
         * the package that was already frozen/saved.
         *
         * CREATOR / ADMIN MODE
         *
         * Creator-side access may build/refresh the
         * package from the selected channel variants.
         */
        const result =
          isReviewMode
            ? await getGuidedApprovalPackage(
                communicationId
              )
            : await buildGuidedApprovalPackage(
                communicationId
              );

        setApprovalPackage(
          result
        );
      } catch (err) {
        console.error(
          isReviewMode
            ? "Unable to load Guided approval package:"
            : "Unable to build Guided approval package:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : isReviewMode
              ? "Unable to load the approval package."
              : "Unable to prepare the approval package."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    void prepare();
  }, [
    authLoading,
    communicationId,
    isReviewMode,
  ]);

  function handleBack() {
    if (
      isReviewMode
    ) {
      navigate(
        "/reviews"
      );

      return;
    }

    if (
      !communicationId
    ) {
      navigate("/");
      return;
    }

    navigate(
      `/create/guided/channels?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <p className="text-sm text-gray-500">
            Preparing approval package...
          </p>
        </main>
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
          {isReviewMode
            ? "Back to Review Queue"
            : "Back to Channel Selection"}
        </button>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {approvalPackage && (
          <>
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#07877B]" />

                <p className="text-sm font-medium text-[#07877B]">
                  Approval Package
                </p>
              </div>

              <h1 className="text-3xl text-gray-900">
                {isReviewMode
                  ? "Review communication package"
                  : "Ready for review"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                {isReviewMode
                  ? "Review the Creator's selected Email, WhatsApp and Leaflet outputs together. This page is read-only; return to the Review Queue to record your decision."
                  : "These are the versions you selected. They will move together as one communication package through the approval workflow."}
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-[#bfe4df] bg-[#f3fbfa] px-5 py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-[#07877B]" />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    One idea, multiple approved outputs
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Marketing and CorpCom should review
                    the selected outputs as one package,
                    while each channel keeps its own
                    format and expression.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {approvalPackage.selectedOutputs.map(
                (output) => (
                  <section
                    key={
                      output.outputId
                    }
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f5f4]">
                          <ChannelIcon
                            channel={
                              output.channel
                            }
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {
                              formatChannel(
                                output.channel
                              )
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Selected Variant{" "}
                            {
                              output.variant
                            }
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    </div>

                    <div className="p-5">
                      <CompactOutputPreview
                        channel={
                          output.channel
                        }
                        content={
                          output.content
                        }
                      />
                    </div>
                  </section>
                )
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {isReviewMode ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    Reviewer mode
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    This package is read-only. Return to the Review Queue to approve, request changes or reject the communication.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/reviews"
                      )
                    }
                    className="mt-5 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white hover:bg-[#06766a]"
                  >
                    Return to Review Queue
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    Next checkpoint
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    This approval package is saved in Supabase. Submission to the existing Marketing → CorpCom workflow will be enabled only after reviewer access is fully verified.
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-5 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white opacity-40"
                  >
                    Submit for Marketing Review
                  </button>
                </>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}


function CompactOutputPreview({
  channel,
  content,
}: {
  channel:
    "email"
    | "whatsapp"
    | "leaflet";

  content:
    any;
}) {
  if (
    channel ===
      "email"
  ) {
    const email =
      content as
        EmailChannelContent;

    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Subject
        </p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          {
            email.subject
          }
        </p>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
          Headline
        </p>

        <p className="mt-1 text-lg text-gray-900">
          {
            email.headline
          }
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          {
            email.opening
          }
        </p>
      </div>
    );
  }

  if (
    channel ===
      "whatsapp"
  ) {
    const whatsapp =
      content as
        WhatsAppChannelContent;

    return (
      <div className="max-w-xl rounded-xl bg-[#eaf7e8] p-4">
        {whatsapp.headline && (
          <p className="text-sm font-medium text-gray-900">
            {
              whatsapp.headline
            }
          </p>
        )}

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
          {
            whatsapp.message
          }
        </p>
      </div>
    );
  }

  const leaflet =
    content as
      LeafletChannelContent;

  return (
    <div>
      <p className="text-xl font-semibold leading-7 text-gray-900">
        {
          leaflet.headline
        }
      </p>

      {leaflet.subheadline && (
        <p className="mt-1 text-sm text-gray-500">
          {
            leaflet.subheadline
          }
        </p>
      )}

      <p className="mt-3 text-sm leading-6 text-gray-600">
        {
          leaflet.intro
        }
      </p>
    </div>
  );
}


function ChannelIcon({
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
    <Icon className="h-5 w-5 text-[#07877B]" />
  );
}


function formatChannel(
  channel:
    "email"
    | "whatsapp"
    | "leaflet"
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
