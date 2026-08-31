import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
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

import {
  getExistingPendingApproval,
  submitCommunicationForApproval,
} from "../services/approvals";


type SupportedChannel =
  | "email"
  | "whatsapp"
  | "leaflet";


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

  const isReviewer =
    profile?.role ===
      "marketing_reviewer" ||
    profile?.role ===
      "corpcom_reviewer";

  const isCreator =
    profile?.role ===
    "creator";

  const isAdmin =
    profile?.role ===
    "admin";

  /**
   * Reviewers are always read-only on this page.
   * Do not rely on a query-string flag for that safeguard.
   */
  const isReviewMode =
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

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submitError,
    setSubmitError,
  ] =
    useState("");

  const [
    alreadySubmitted,
    setAlreadySubmitted,
  ] =
    useState(false);


  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function prepare() {
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

        /**
         * REVIEWER MODE
         *
         * Reviewers only read the package that was
         * already frozen and saved by the Creator.
         *
         * CREATOR / ADMIN ACCESS
         *
         * Non-reviewer access keeps the existing behavior:
         * the package may be prepared from the selected
         * channel variants.
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
        setLoading(false);
      }
    }

    void prepare();
  }, [
    authLoading,
    communicationId,
    isReviewMode,
  ]);


  async function handleSubmitForMarketingReview() {
    if (
      !communicationId ||
      !isCreator ||
      isReviewMode ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      /**
       * Guard against accidental double submission.
       * The database RPC also protects this, while this
       * check gives the Creator a cleaner experience.
       */
      const existing =
        await getExistingPendingApproval(
          communicationId
        );

      if (existing) {
        setAlreadySubmitted(true);

        navigate(
          `/approval/status?communicationId=${encodeURIComponent(
            communicationId
          )}`
        );

        return;
      }

      await submitCommunicationForApproval({
        communicationId,
      });

      setAlreadySubmitted(true);

      navigate(
        `/approval/status?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );
    } catch (err) {
      console.error(
        "Unable to submit Guided communication for approval:",
        err
      );

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to submit this communication for Marketing review."
      );
    } finally {
      setSubmitting(false);
    }
  }


  function handleBack() {
    if (isReviewMode) {
      navigate(
        "/reviews"
      );
      return;
    }

    if (!communicationId) {
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

        <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2
              className="h-4 w-4 animate-spin text-[#07877B]"
              aria-hidden="true"
            />
            Preparing approval package...
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            submitting
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          {isReviewMode
            ? "Back to Review Queue"
            : "Back to Channel Selection"}
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

        {approvalPackage && (
          <>
            <header className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck
                  className="h-5 w-5 text-[#07877B]"
                  aria-hidden="true"
                />

                <p className="text-sm font-medium text-[#07877B]">
                  Approval Package
                </p>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
                    {isReviewMode
                      ? "Review the submitted communication package"
                      : isAdmin
                        ? "Communication package overview"
                        : "Your communication is ready for review"}
                  </h1>

                  <p className="mt-3 text-base leading-7 text-gray-600">
                    {isReviewMode
                      ? "Review the Creator's selected channel options together. The package is read-only and remains unchanged during review."
                      : isAdmin
                        ? "Inspect the selected channel options and package details. Admin access is for oversight and does not submit or approve the communication."
                        : "Review the selected options below before submitting the communication to Marketing and CorpCom review."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <StatusPill
                    icon={Layers3}
                    label={`${approvalPackage.selectedOutputs.length} ${
                      approvalPackage.selectedOutputs.length === 1
                        ? "channel"
                        : "channels"
                    }`}
                  />

                  <StatusPill
                    icon={
                      isReviewMode ||
                      isAdmin
                        ? LockKeyhole
                        : CheckCircle2
                    }
                    label={
                      isReviewMode
                        ? "Read-only"
                        : isAdmin
                          ? "Oversight only"
                          : "Ready to submit"
                    }
                  />
                </div>
              </div>
            </header>


            <section className="mb-8 rounded-2xl bg-[#f3fbfa] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <ShieldCheck
                    className="h-5 w-5 text-[#07877B]"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    One idea. One communication package.
                  </p>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                    Email, WhatsApp and Leaflet can express the idea differently, but they move through approval together as one communication package.
                  </p>
                </div>
              </div>
            </section>


            <div className="space-y-7">
              {approvalPackage.selectedOutputs.map(
                (output) => (
                  <section
                    key={
                      output.outputId
                    }
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5f4]">
                          <ChannelIcon
                            channel={
                              output.channel
                            }
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-medium text-gray-900">
                              {formatChannel(
                                output.channel
                              )}
                            </h2>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                              Option {output.variant}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            Selected option
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Included in package
                      </span>
                    </div>

                    <div className="px-5 py-6 sm:px-6 sm:py-7">
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


            <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {isReviewMode ? (
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <LockKeyhole
                        className="h-5 w-5 text-gray-600"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="max-w-2xl">
                      <p className="text-sm font-medium text-gray-900">
                        Review mode
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        This package is read-only. Return to the Review Queue to approve, request changes or reject the communication.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/reviews"
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#06766a]"
                  >
                    Return to Review Queue
                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ) : isAdmin ? (
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <LockKeyhole
                        className="h-5 w-5 text-gray-600"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="max-w-2xl">
                      <p className="text-sm font-medium text-gray-900">
                        Admin oversight
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        You can inspect this communication package, but submission
                        and approval actions remain with the Creator and reviewers.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
                    Oversight only
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5f4]">
                        <Send
                          className="h-5 w-5 text-[#07877B]"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="max-w-2xl">
                        <p className="text-sm font-medium text-gray-900">
                          Ready to submit
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          Submit this communication package to Marketing. Once submitted,
                          you can follow its progress from the approval status page.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleSubmitForMarketingReview
                      }
                      disabled={
                        submitting ||
                        alreadySubmitted ||
                        !isCreator
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Send
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      )}

                      {submitting
                        ? "Submitting..."
                        : alreadySubmitted
                          ? "Submitted for Marketing Review"
                          : "Submit for Marketing Review"}
                    </button>
                  </div>

                  {(submitError || alreadySubmitted) && (
                    <div className="border-t border-gray-100 px-6 py-4 sm:px-7">
                      {submitError && (
                        <div
                          role="alert"
                          aria-live="polite"
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                          {submitError}
                        </div>
                      )}

                      {alreadySubmitted && !submitError && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                        >
                          This communication has already been submitted for review.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>


            <div className="mt-8 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={
                  handleBack
                }
                disabled={
                  submitting
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {isReviewMode
                  ? "Back to Review Queue"
                  : "Back to Channel Selection"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


function StatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 shadow-sm">
      <Icon
        className="h-3.5 w-3.5 text-[#07877B]"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}


function CompactOutputPreview({
  channel,
  content,
}: {
  channel:
    SupportedChannel;
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
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-4 border-b border-gray-100 pb-5 sm:grid-cols-2">
          <PreviewMeta
            label="Subject"
            value={
              email.subject
            }
            emphasis
          />

          {email.preheader && (
            <PreviewMeta
              label="Preheader"
              value={
                email.preheader
              }
            />
          )}
        </div>

        <div className="pt-6">
          <h3 className="max-w-3xl text-2xl font-semibold leading-8 tracking-tight text-gray-900">
            {email.headline}
          </h3>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-700">
            {email.opening}
          </p>

          {Array.isArray(
            email.bodySections
          ) &&
            email.bodySections.map(
              (
                section,
                index
              ) => (
                <div
                  key={`${section.heading || "section"}-${index}`}
                  className="mt-5 max-w-3xl"
                >
                  {section.heading && (
                    <h4 className="text-sm font-semibold text-gray-900">
                      {section.heading}
                    </h4>
                  )}

                  <p className="mt-1 text-sm leading-7 text-gray-700">
                    {section.content}
                  </p>
                </div>
              )
            )}

          <SimpleTextPoints
            points={
              email.keyPoints
            }
          />

          {email.cta && (
            <div className="mt-6">
              <span className="inline-flex rounded-lg bg-[#07877B] px-4 py-2.5 text-sm font-medium text-white">
                {email.cta.label}
              </span>
            </div>
          )}

          <MandatoryNotes
            notes={
              email.mandatoryNotes
            }
          />
        </div>
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
      <div className="rounded-2xl bg-gray-50 px-4 py-7 sm:px-6">
        <div className="mx-auto max-w-md overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5f4]">
              <MessageCircle className="h-4 w-4 text-[#07877B]" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-900">
                WhatsApp preview
              </p>
              <p className="text-[11px] text-gray-400">
                Customer message
              </p>
            </div>
          </div>

          <div className="bg-[#f7f4ef] p-4 sm:p-5">
            <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#e7f7e5] px-4 py-3.5 shadow-sm">
              {whatsapp.headline && (
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {whatsapp.headline}
                </p>
              )}

              <p className={`${
                whatsapp.headline
                  ? "mt-2"
                  : ""
              } whitespace-pre-wrap text-sm leading-6 text-gray-800`}>
                {whatsapp.message}
              </p>

              <SimpleTextPoints
                points={
                  whatsapp.keyPoints
                }
                compact
              />

              {whatsapp.cta && (
                <div className="mt-4 border-t border-[#cde7ca] pt-3">
                  <p className="text-center text-sm font-medium text-[#075f58]">
                    {whatsapp.cta.label}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <MandatoryNotes
            notes={
              whatsapp.mandatoryNotes
            }
          />
        </div>
      </div>
    );
  }


  const leaflet =
    content as
      LeafletChannelContent;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-gray-50 p-5 sm:p-7">
        <div className="mx-auto max-w-3xl bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-9">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#07877B]">
            Leaflet content
          </p>

          <h3 className="mt-3 text-3xl font-semibold leading-9 tracking-tight text-gray-900">
            {leaflet.headline}
          </h3>

          {leaflet.subheadline && (
            <p className="mt-3 text-base leading-7 text-gray-600">
              {leaflet.subheadline}
            </p>
          )}

          <p className="mt-6 text-sm leading-7 text-gray-700">
            {leaflet.intro}
          </p>

          {Array.isArray(
            leaflet.keyPoints
          ) &&
            leaflet.keyPoints.length >
              0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {leaflet.keyPoints.map(
                  (
                    point,
                    index
                  ) => (
                    <div
                      key={`${point.title}-${index}`}
                      className="rounded-xl bg-gray-50 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {point.title}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {point.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

          {leaflet.cta && (
            <div className="mt-6 rounded-xl bg-[#07877B] px-5 py-4 text-white">
              <p className="text-sm font-medium">
                {leaflet.cta.label}
              </p>

              {leaflet.cta.supportingText && (
                <p className="mt-1 text-xs leading-5 text-white/80">
                  {leaflet.cta.supportingText}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {leaflet.visualDirection && (
        <div className="mt-5 flex gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Visual direction
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              {leaflet.visualDirection}
            </p>
          </div>
        </div>
      )}

      <MandatoryNotes
        notes={
          leaflet.mandatoryNotes
        }
      />
    </div>
  );
}


function PreviewMeta({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 leading-6 ${
          emphasis
            ? "text-sm font-medium text-gray-900"
            : "text-sm text-gray-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}


function SimpleTextPoints({
  points,
  compact = false,
}: {
  points:
    string[];
  compact?: boolean;
}) {
  if (
    !Array.isArray(points) ||
    points.length === 0
  ) {
    return null;
  }

  return (
    <ul className={`${compact ? "mt-3" : "mt-5"} space-y-2`}>
      {points.map(
        (
          point,
          index
        ) => (
          <li
            key={`${point}-${index}`}
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
    !Array.isArray(notes) ||
    notes.length === 0
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
            key={`${note}-${index}`}
            className="mt-1 text-xs leading-5 text-gray-500"
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
    SupportedChannel;
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
    SupportedChannel
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
