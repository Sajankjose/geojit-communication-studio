import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  XCircle,
  Send,
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

import {
  getReviewerQueue,
  submitReviewerDecision,
  ReviewQueueItem,
} from "../services/reviews";

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

  /**
   * mode=review means the package is frozen/read-only.
   *
   * This applies to:
   * - Creator viewing a submitted/approved package
   * - Marketing Reviewer
   * - CorpCom Reviewer
   * - Admin oversight
   *
   * Reviewer identity is handled separately through isReviewer.
   */
  const isReadOnlyMode =
    mode ===
      "review";

  const isReviewerReadOnly =
    isReadOnlyMode &&
    isReviewer;

  const isCreatorReadOnly =
    isReadOnlyMode &&
    profile?.role ===
      "creator";

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

  const [
    activeChannel,
    setActiveChannel,
  ] =
    useState<
      "email"
      | "whatsapp"
      | "leaflet"
      | null
    >(null);

  const [
    reviewerItem,
    setReviewerItem,
  ] =
    useState<
      ReviewQueueItem | null
    >(null);

  const [
    reviewerComment,
    setReviewerComment,
  ] =
    useState("");

  const [
    reviewerSubmitting,
    setReviewerSubmitting,
  ] =
    useState(false);

  const [
    reviewerError,
    setReviewerError,
  ] =
    useState("");

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
         * READ-ONLY MODE
         *
         * Any mode=review access must never rebuild or modify the
         * Creator's approval package. It only reads the
         * package that was already frozen/saved.
         *
         * CREATOR / ADMIN MODE
         *
         * Creator-side access may build/refresh the
         * package from the selected channel variants.
         */
        const result =
          isReadOnlyMode
            ? await getGuidedApprovalPackage(
                communicationId
              )
            : await buildGuidedApprovalPackage(
                communicationId
              );

        setApprovalPackage(
          result
        );

        const firstChannel =
          result.selectedOutputs?.[0]
            ?.channel || null;

        setActiveChannel(
          firstChannel
        );

        if (
          isReviewerReadOnly &&
          (
            profile?.role ===
              "marketing_reviewer" ||
            profile?.role ===
              "corpcom_reviewer"
          )
        ) {
          const queue =
            await getReviewerQueue(
              profile.role
            );

          const matched =
            queue.find(
              (item) =>
                item.communication_id ===
                communicationId
            ) || null;

          setReviewerItem(
            matched
          );
        }
      } catch (err) {
        console.error(
          isReadOnlyMode
            ? "Unable to load Guided approval package:"
            : "Unable to build Guided approval package:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : isReadOnlyMode
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
    isReadOnlyMode,
    isReviewerReadOnly,
    profile?.role,
  ]);

  async function handleSubmitForMarketingReview() {
    if (
      !communicationId ||
      isReadOnlyMode ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(
        true
      );

      setSubmitError(
        ""
      );

      /**
       * Guard against accidental double submission.
       *
       * The database RPC also protects this, but checking
       * here gives the Creator a cleaner UX.
       */
      const existing =
        await getExistingPendingApproval(
          communicationId
        );

      if (existing) {
        setAlreadySubmitted(
          true
        );

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

      setAlreadySubmitted(
        true
      );

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
      setSubmitting(
        false
      );
    }
  }

  async function handleReviewerDecision(
    decision:
      | "approved"
      | "changes_requested"
      | "rejected"
  ) {
    if (
      !reviewerItem ||
      !communicationId ||
      reviewerSubmitting ||
      (
        profile?.role !==
          "marketing_reviewer" &&
        profile?.role !==
          "corpcom_reviewer"
      )
    ) {
      return;
    }

    const cleanComment =
      reviewerComment.trim();

    if (
      (
        decision ===
          "changes_requested" ||
        decision ===
          "rejected"
      ) &&
      !cleanComment
    ) {
      setReviewerError(
        "Please add a comment before requesting changes or rejecting."
      );

      return;
    }

    try {
      setReviewerSubmitting(
        true
      );

      setReviewerError(
        ""
      );

      await submitReviewerDecision({
        approvalActionId:
          reviewerItem.approval_action_id,

        communicationId,

        decision,

        comments:
          cleanComment,

        reviewerRole:
          profile.role,
      });

      navigate(
        "/reviews"
      );
    } catch (err) {
      console.error(
        "Unable to submit reviewer decision:",
        err
      );

      setReviewerError(
        err instanceof Error
          ? err.message
          : "Unable to submit the review decision."
      );
    } finally {
      setReviewerSubmitting(
        false
      );
    }
  }


  function handleBack() {
    if (
      isReviewerReadOnly
    ) {
      navigate(
        "/reviews"
      );

      return;
    }

    if (
      isCreatorReadOnly
    ) {
      if (
        communicationId
      ) {
        navigate(
          `/approval/status?communicationId=${encodeURIComponent(
            communicationId
          )}`
        );
      } else {
        navigate("/");
      }

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
          {isReviewerReadOnly
            ? "Back to Review Queue"
            : isCreatorReadOnly
              ? "Back to Approval Status"
              : "Back to Channel Selection"}
        </button>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {approvalPackage && (
          <>
            {isReviewerReadOnly ? (
              <ReviewerWorkspace
                approvalPackage={
                  approvalPackage
                }
                activeChannel={
                  activeChannel
                }
                onChannelChange={
                  setActiveChannel
                }
                reviewerRole={
                  profile?.role ===
                    "corpcom_reviewer"
                    ? "corpcom_reviewer"
                    : "marketing_reviewer"
                }
                reviewerItem={
                  reviewerItem
                }
                reviewerComment={
                  reviewerComment
                }
                onReviewerCommentChange={
                  setReviewerComment
                }
                reviewerError={
                  reviewerError
                }
                reviewerSubmitting={
                  reviewerSubmitting
                }
                onDecision={
                  handleReviewerDecision
                }
              />
            ) : (
              <>
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#07877B]" />

                    <p className="text-sm font-medium text-[#07877B]">
                      Approval Package
                    </p>
                  </div>

                  <h1 className="text-3xl text-gray-900">
                    {isCreatorReadOnly
                      ? "Communication package"
                      : "Ready for review"}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                    {isCreatorReadOnly
                      ? "These are the selected Email, WhatsApp and Leaflet outputs submitted through the approval workflow. This view is read-only."
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
                        Marketing and CorpCom should review the selected outputs as one package, while each channel keeps its own format and expression.
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
                  {isCreatorReadOnly ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        Submitted communication
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        This is the frozen communication package that moved through the approval workflow. Viewing it will not modify the communication or its approval status.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            communicationId
                          ) {
                            navigate(
                              `/approval/status?communicationId=${encodeURIComponent(
                                communicationId
                              )}`
                            );
                          } else {
                            navigate("/");
                          }
                        }}
                        className="mt-5 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:border-[#07877B] hover:text-[#07877B]"
                      >
                        Back to Approval Status
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        Submit for approval
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        Your selected channel outputs are saved as one governed package. Submit it to Marketing to begin the existing Marketing → CorpCom approval workflow.
                      </p>

                      {submitError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {submitError}
                        </div>
                      )}

                      {alreadySubmitted && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                          This communication has already been submitted for review.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={
                          handleSubmitForMarketingReview
                        }
                        disabled={
                          submitting ||
                          alreadySubmitted ||
                          profile?.role !== "creator"
                        }
                        className="mt-5 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting
                          ? "Submitting..."
                          : alreadySubmitted
                            ? "Submitted for Marketing Review"
                            : "Submit for Marketing Review"}
                      </button>

                      {profile?.role === "admin" && (
                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          Admin can inspect this package, but only the Creator can submit it for approval.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

      </main>
    </div>
  );
}


function ReviewerWorkspace({
  approvalPackage,
  activeChannel,
  onChannelChange,
  reviewerRole,
  reviewerItem,
  reviewerComment,
  onReviewerCommentChange,
  reviewerError,
  reviewerSubmitting,
  onDecision,
}: {
  approvalPackage:
    GuidedApprovalPackageData;

  activeChannel:
    "email"
    | "whatsapp"
    | "leaflet"
    | null;

  onChannelChange:
    (
      channel:
        "email"
        | "whatsapp"
        | "leaflet"
    ) => void;

  reviewerRole:
    "marketing_reviewer"
    | "corpcom_reviewer";

  reviewerItem:
    ReviewQueueItem | null;

  reviewerComment:
    string;

  onReviewerCommentChange:
    (
      value:
        string
    ) => void;

  reviewerError:
    string;

  reviewerSubmitting:
    boolean;

  onDecision:
    (
      decision:
        | "approved"
        | "changes_requested"
        | "rejected"
    ) => void;
}) {
  const activeOutput =
    approvalPackage.selectedOutputs.find(
      (item) =>
        item.channel ===
        activeChannel
    ) ||
    approvalPackage.selectedOutputs[0];

  const master =
    reviewerItem
      ?.communication
      ?.input_data
      ?.communicationMaster;

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#07877B]" />

          <p className="text-sm font-medium text-[#07877B]">
            {reviewerRole ===
              "marketing_reviewer"
              ? "Marketing Review"
              : "CorpCom Review"}
          </p>
        </div>

        <h1 className="ds-title-2">
          Review communication
        </h1>

        <p className="ds-body-sm mt-2">
          Review the selected channel output and record your decision without leaving this screen.
        </p>
      </div>

      {master && (
        <DesignSystemCard className="mb-5 grid gap-3 p-4 sm:grid-cols-4">
          <ReviewSummaryItem
            label="Core idea"
            value={
              master.coreIdea ||
              "—"
            }
            wide
          />

          <ReviewSummaryItem
            label="Audience"
            value={
              master.audience ||
              "—"
            }
          />

          <ReviewSummaryItem
            label="Purpose"
            value={
              master.purpose ||
              "—"
            }
          />

          <ReviewSummaryItem
            label="Personalisation"
            value={
              master.personalisation
                ?.mode ||
              "—"
            }
          />
        </DesignSystemCard>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

        <DesignSystemCard className="min-w-0 overflow-hidden">
          <div className="border-b border-gray-200 px-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {approvalPackage.selectedOutputs.map(
                (output) => (
                  <button
                    key={
                      output.outputId
                    }
                    type="button"
                    onClick={() =>
                      onChannelChange(
                        output.channel
                      )
                    }
                    className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition ${
                      activeOutput?.channel ===
                        output.channel
                        ? "border-[#07877B] bg-[#f7fbfa] text-[#06766a]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <ChannelIcon
                      channel={
                        output.channel
                      }
                    />

                    {
                      formatChannel(
                        output.channel
                      )
                    }

                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                      {output.variant}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {activeOutput && (
            <div className="max-h-[68vh] overflow-y-auto p-5">
              <CompactOutputPreview
                channel={
                  activeOutput.channel
                }
                content={
                  activeOutput.content
                }
              />
            </div>
          )}
        </DesignSystemCard>

        <aside className="self-start xl:sticky xl:top-24">
          <DesignSystemCard className="p-5">

            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Decision
              </p>

              <h2 className="ds-title-4 mt-1">
                {reviewerRole ===
                  "marketing_reviewer"
                  ? "Marketing Review"
                  : "Final CorpCom Review"}
              </h2>
            </div>

            <label className="text-sm font-medium text-gray-800">
              Reviewer comment
            </label>

            <textarea
              value={
                reviewerComment
              }
              onChange={
                (event) =>
                  onReviewerCommentChange(
                    event.target.value
                  )
              }
              rows={5}
              placeholder={
                reviewerRole ===
                  "marketing_reviewer"
                  ? "Add a comment if needed..."
                  : "Add final review comments if needed..."
              }
              className="ds-textarea mt-2"
            />

            <p className="mt-2 text-xs leading-5 text-gray-500">
              A comment is required when requesting changes or rejecting.
            </p>

            {reviewerError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                {
                  reviewerError
                }
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <DesignSystemButton
                variant="secondary"
                size="medium"
                onClick={() =>
                  onDecision(
                    "changes_requested"
                  )
                }
                disabled={
                  reviewerSubmitting ||
                  !reviewerItem
                }
                leadingIcon={
                  <DesignSystemIcon
                    size="sm"
                    tone="warning"
                  >
                    <RotateCcw />
                  </DesignSystemIcon>
                }
                className="w-full"
              >
                Request Changes
              </DesignSystemButton>

              <DesignSystemButton
                variant="secondary"
                size="medium"
                onClick={() =>
                  onDecision(
                    "rejected"
                  )
                }
                disabled={
                  reviewerSubmitting ||
                  !reviewerItem
                }
                leadingIcon={
                  <DesignSystemIcon
                    size="sm"
                    tone="error"
                  >
                    <XCircle />
                  </DesignSystemIcon>
                }
                className="w-full"
              >
                Reject
              </DesignSystemButton>
            </div>

            <DesignSystemButton
              variant="primary"
              size="large"
              onClick={() =>
                onDecision(
                  "approved"
                )
              }
              disabled={
                reviewerSubmitting ||
                !reviewerItem
              }
              trailingIcon={
                reviewerSubmitting
                  ? null
                  : reviewerRole ===
                      "marketing_reviewer"
                    ? (
                      <DesignSystemIcon
                        size="sm"
                        tone="onDark"
                      >
                        <Send />
                      </DesignSystemIcon>
                    )
                    : (
                      <DesignSystemIcon
                        size="sm"
                        tone="onDark"
                      >
                        <CheckCircle2 />
                      </DesignSystemIcon>
                    )
              }
              className="mt-3 w-full"
            >
              {reviewerSubmitting
                ? "Submitting..."
                : reviewerRole ===
                    "marketing_reviewer"
                  ? "Approve & Send to CorpCom"
                  : "Final Approve"}
            </DesignSystemButton>

            {!reviewerItem && (
              <p className="mt-3 text-xs leading-5 text-amber-700">
                No pending review action was found for this communication. Return to the Review Queue and reopen it.
              </p>
            )}

          </DesignSystemCard>
        </aside>

      </div>
    </>
  );
}


function ReviewSummaryItem({
  label,
  value,
  wide = false,
}: {
  label:
    string;

  value:
    string;

  wide?:
    boolean;
}) {
  return (
    <div
      className={
        wide
          ? "sm:col-span-4"
          : ""
      }
    >
      <p className="ds-label-3">
        {label}
      </p>

      <p className="ds-body-sm mt-1">
        {value}
      </p>
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
      <div className="space-y-5">

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Subject
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-gray-900">
            {
              email.subject
            }
          </p>
        </div>

        {email.preheader && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Preheader
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              {
                email.preheader
              }
            </p>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-xl font-semibold leading-8 text-gray-900">
            {
              email.headline
            }
          </h3>

          <p className="mt-4 text-sm leading-7 text-gray-700">
            {
              email.opening
            }
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
                  key={
                    `${section.heading || "section"}-${index}`
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

          {Array.isArray(
            email.keyPoints
          ) &&
            email.keyPoints.length >
              0 && (
              <ul className="mt-5 space-y-2">
                {email.keyPoints.map(
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
                        {
                          point
                        }
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}

          {email.cta && (
            <div className="mt-5">
              <span className="inline-flex rounded-lg bg-[#07877B] px-4 py-2 text-sm font-medium text-white">
                {
                  email.cta.label
                }
              </span>
            </div>
          )}
        </div>

        {Array.isArray(
          email.mandatoryNotes
        ) &&
          email.mandatoryNotes.length >
            0 && (
            <div className="border-t border-gray-200 pt-4">
              {email.mandatoryNotes.map(
                (
                  note,
                  index
                ) => (
                  <p
                    key={
                      `${note}-${index}`
                    }
                    className="mt-1 text-xs leading-5 text-gray-500"
                  >
                    {
                      note
                    }
                  </p>
                )
              )}
            </div>
          )}

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
      <div className="space-y-5">

        <div className="mx-auto max-w-2xl rounded-2xl border border-green-100 bg-[#eaf7e8] p-5">

          {whatsapp.headline && (
            <p className="text-base font-semibold text-gray-900">
              {
                whatsapp.headline
              }
            </p>
          )}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-800">
            {
              whatsapp.message
            }
          </p>

          {Array.isArray(
            whatsapp.keyPoints
          ) &&
            whatsapp.keyPoints.length >
              0 && (
              <ul className="mt-4 space-y-2">
                {whatsapp.keyPoints.map(
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
                        {
                          point
                        }
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}

          {whatsapp.cta && (
            <div className="mt-5">
              <span className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#075f58] shadow-sm">
                {
                  whatsapp.cta.label
                }
              </span>
            </div>
          )}

        </div>

        {Array.isArray(
          whatsapp.mandatoryNotes
        ) &&
          whatsapp.mandatoryNotes.length >
            0 && (
            <div className="border-t border-gray-200 pt-4">
              {whatsapp.mandatoryNotes.map(
                (
                  note,
                  index
                ) => (
                  <p
                    key={
                      `${note}-${index}`
                    }
                    className="mt-1 text-xs leading-5 text-gray-500"
                  >
                    {
                      note
                    }
                  </p>
                )
              )}
            </div>
          )}

      </div>
    );
  }

  const leaflet =
    content as
      LeafletChannelContent;

  return (
    <div className="space-y-5">

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

        <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
          Leaflet content
        </p>

        <h3 className="mt-3 text-2xl font-semibold leading-8 text-gray-900">
          {
            leaflet.headline
          }
        </h3>

        {leaflet.subheadline && (
          <p className="mt-2 text-base leading-6 text-gray-600">
            {
              leaflet.subheadline
            }
          </p>
        )}

        <p className="mt-5 text-sm leading-7 text-gray-700">
          {
            leaflet.intro
          }
        </p>

        {Array.isArray(
          leaflet.keyPoints
        ) &&
          leaflet.keyPoints.length >
            0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {leaflet.keyPoints.map(
                (
                  point,
                  index
                ) => (
                  <div
                    key={
                      `${point.title}-${index}`
                    }
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {
                        point.title
                      }
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {
                        point.description
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          )}

        {leaflet.cta && (
          <div className="mt-5 rounded-lg bg-[#07877B] px-4 py-3 text-white">
            <p className="text-sm font-medium">
              {
                leaflet.cta.label
              }
            </p>

            {leaflet.cta.supportingText && (
              <p className="mt-1 text-xs leading-5 text-white/80">
                {
                  leaflet.cta.supportingText
                }
              </p>
            )}
          </div>
        )}

      </div>

      {leaflet.visualDirection && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Visual direction
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            {
              leaflet.visualDirection
            }
          </p>
        </div>
      )}

      {Array.isArray(
        leaflet.mandatoryNotes
      ) &&
        leaflet.mandatoryNotes.length >
          0 && (
          <div className="border-t border-gray-200 pt-4">
            {leaflet.mandatoryNotes.map(
              (
                note,
                index
              ) => (
                <p
                  key={
                    `${note}-${index}`
                  }
                  className="mt-1 text-xs leading-5 text-gray-500"
                >
                  {
                    note
                  }
                </p>
              )
            )}
          </div>
        )}

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
