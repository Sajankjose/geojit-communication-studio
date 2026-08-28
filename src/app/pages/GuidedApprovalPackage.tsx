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
  DesignSystemTextarea,
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
      <div className="ds-page">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <p className="ds-body-sm">
            Preparing approval package...
          </p>
        </main>
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
          {isReviewerReadOnly
            ? "Back to Review Queue"
            : isCreatorReadOnly
              ? "Back to Approval Status"
              : "Back to Channel Selection"}
        </DesignSystemButton>

        {error && (
          <div className="ds-alert ds-alert-error mb-6 text-sm">
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
                    <DesignSystemIcon
                      size="md"
                      tone="action"
                    >
                      <ShieldCheck />
                    </DesignSystemIcon>

                    <p className="ds-label-3 text-[var(--ds-text-brand)]">
                      Approval Package
                    </p>
                  </div>

                  <h1 className="ds-title-2">
                    {isCreatorReadOnly
                      ? "Communication package"
                      : "Ready for review"}
                  </h1>

                  <p className="ds-body-sm mt-3 max-w-3xl leading-7">
                    {isCreatorReadOnly
                      ? "These are the selected Email, WhatsApp and Leaflet outputs submitted through the approval workflow. This view is read-only."
                      : "These are the versions you selected. They will move together as one communication package through the approval workflow."}
                  </p>
                </div>

                <DesignSystemCard
                  surface="accent"
                  className="mb-6 px-5 py-4"
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
                        One idea, multiple approved outputs
                      </p>

                      <p className="ds-body-sm mt-1 leading-6">
                        Marketing and CorpCom should review the selected outputs as one package, while each channel keeps its own format and expression.
                      </p>
                    </div>
                  </div>
                </DesignSystemCard>

                <div className="space-y-5">
                  {approvalPackage.selectedOutputs.map(
                    (output) => (
                      <DesignSystemCard
                        key={
                          output.outputId
                        }
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--ds-border-subtle)] px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="ds-icon-container ds-icon-container-brand flex h-10 w-10 items-center justify-center">
                              <ChannelIcon
                                channel={
                                  output.channel
                                }
                              />
                            </div>

                            <div>
                              <p className="ds-body-sm font-medium">
                                {
                                  formatChannel(
                                    output.channel
                                  )
                                }
                              </p>

                              <p className="ds-body-xs mt-0.5">
                                Selected Variant{" "}
                                {
                                  output.variant
                                }
                              </p>
                            </div>
                          </div>

                          <span className="ds-status ds-status-success ds-status-sm">
                            <span className="ds-status-dot" aria-hidden="true" />
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
                      </DesignSystemCard>
                    )
                  )}
                </div>

                <DesignSystemCard className="mt-8 p-6">
                  {isCreatorReadOnly ? (
                    <>
                      <p className="text-sm font-medium text-[var(--ds-text-primary)]">
                        Submitted communication
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[var(--ds-text-secondary)]">
                        This is the frozen communication package that moved through the approval workflow. Viewing it will not modify the communication or its approval status.
                      </p>

                      <DesignSystemButton
                        variant="secondary"
                        size="medium"
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
                        className="mt-5"
                      >
                        Back to Approval Status
                      </DesignSystemButton>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--ds-text-primary)]">
                        Submit for approval
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[var(--ds-text-secondary)]">
                        Your selected channel outputs are saved as one governed package. Submit it to Marketing to begin the existing Marketing → CorpCom approval workflow.
                      </p>

                      {submitError && (
                        <div className="ds-alert ds-alert-error mt-4 text-sm">
                          {submitError}
                        </div>
                      )}

                      {alreadySubmitted && (
                        <div className="ds-alert ds-alert-success mt-4 text-sm">
                          This communication has already been submitted for review.
                        </div>
                      )}

                      <DesignSystemButton
                        variant="primary"
                        size="large"
                        onClick={
                          handleSubmitForMarketingReview
                        }
                        disabled={
                          submitting ||
                          alreadySubmitted ||
                          profile?.role !== "creator"
                        }
                        loading={
                          submitting
                        }
                        loadingLabel="Submitting..."
                        className="mt-5"
                      >
                        {alreadySubmitted
                          ? "Submitted for Marketing Review"
                          : "Submit for Marketing Review"}
                      </DesignSystemButton>

                      {profile?.role === "admin" && (
                        <p className="mt-3 text-xs leading-5 text-[var(--ds-text-tertiary)]">
                          Admin can inspect this package, but only the Creator can submit it for approval.
                        </p>
                      )}
                    </>
                  )}
                </DesignSystemCard>
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
          <DesignSystemIcon
            size="md"
            tone="action"
          >
            <ShieldCheck />
          </DesignSystemIcon>

          <p className="ds-label-3 text-[var(--ds-text-brand)]">
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
        <DesignSystemCard surface="accent" className="mb-5 grid gap-3 p-4 sm:grid-cols-4">
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
          <div className="border-b border-[var(--ds-border-subtle)] px-4 pt-4">
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
                        ? "border-[var(--ds-brand-primary)] bg-[var(--ds-surface-subtle)] text-[var(--ds-text-brand)]"
                        : "border-transparent text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)]"
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

                    <span className="rounded-full bg-[var(--ds-surface-muted)] px-2 py-0.5 text-[11px] text-[var(--ds-text-tertiary)]">
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
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
                Decision
              </p>

              <h2 className="ds-title-4 mt-1">
                {reviewerRole ===
                  "marketing_reviewer"
                  ? "Marketing Review"
                  : "Final CorpCom Review"}
              </h2>
            </div>

            <DesignSystemTextarea
              label="Reviewer comment"
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
              helperText="A comment is required when requesting changes or rejecting."
            />

            {reviewerError && (
              <div className="ds-alert ds-alert-error mt-4 text-xs leading-5">
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
                variant="destructive"
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
              fullWidth
              onClick={() =>
                onDecision(
                  "approved"
                )
              }
              disabled={
                reviewerSubmitting ||
                !reviewerItem
              }
              loading={
                reviewerSubmitting
              }
              loadingLabel="Submitting..."
              trailingIcon={
                reviewerRole ===
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
              className="mt-3"
            >
              {reviewerRole ===
                "marketing_reviewer"
                ? "Approve & Send to CorpCom"
                : "Final Approve"}
            </DesignSystemButton>

            {!reviewerItem && (
              <p className="mt-3 text-xs leading-5 text-[var(--ds-warning)]">
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
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
            Subject
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-[var(--ds-text-primary)]">
            {
              email.subject
            }
          </p>
        </div>

        {email.preheader && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
              Preheader
            </p>

            <p className="mt-1 text-sm leading-6 text-[var(--ds-text-secondary)]">
              {
                email.preheader
              }
            </p>
          </div>
        )}

        <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] p-5">
          <h3 className="text-xl font-semibold leading-8 text-[var(--ds-text-primary)]">
            {
              email.headline
            }
          </h3>

          <p className="mt-4 text-sm leading-7 text-[var(--ds-text-secondary)]">
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
                      className="flex gap-2 text-sm leading-6 text-[var(--ds-text-secondary)]"
                    >
                      <span className="text-[var(--ds-text-brand)]">
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
              <span className="inline-flex rounded-lg bg-[var(--ds-brand-primary)] px-4 py-2 text-sm font-medium text-white">
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
            <div className="border-t border-[var(--ds-border-subtle)] pt-4">
              {email.mandatoryNotes.map(
                (
                  note,
                  index
                ) => (
                  <p
                    key={
                      `${note}-${index}`
                    }
                    className="mt-1 text-xs leading-5 text-[var(--ds-text-tertiary)]"
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
            <p className="text-base font-semibold text-[var(--ds-text-primary)]">
              {
                whatsapp.headline
              }
            </p>
          )}

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ds-text-primary)]">
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
                      className="flex gap-2 text-sm leading-6 text-[var(--ds-text-secondary)]"
                    >
                      <span className="text-[var(--ds-text-brand)]">
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
              <span className="inline-flex rounded-lg bg-[var(--ds-surface-card)] px-4 py-2 text-sm font-medium text-[var(--ds-text-brand)] shadow-sm">
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
            <div className="border-t border-[var(--ds-border-subtle)] pt-4">
              {whatsapp.mandatoryNotes.map(
                (
                  note,
                  index
                ) => (
                  <p
                    key={
                      `${note}-${index}`
                    }
                    className="mt-1 text-xs leading-5 text-[var(--ds-text-tertiary)]"
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

      <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] p-5">

        <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-brand)]">
          Leaflet content
        </p>

        <h3 className="mt-3 text-2xl font-semibold leading-8 text-[var(--ds-text-primary)]">
          {
            leaflet.headline
          }
        </h3>

        {leaflet.subheadline && (
          <p className="mt-2 text-base leading-6 text-[var(--ds-text-secondary)]">
            {
              leaflet.subheadline
            }
          </p>
        )}

        <p className="mt-5 text-sm leading-7 text-[var(--ds-text-secondary)]">
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
                    className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-card)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--ds-text-primary)]">
                      {
                        point.title
                      }
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[var(--ds-text-secondary)]">
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
          <div className="mt-5 rounded-lg bg-[var(--ds-brand-primary)] px-4 py-3 text-white">
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
        <div className="rounded-lg border border-dashed border-[var(--ds-border-default)] bg-[var(--ds-surface-card)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--ds-text-tertiary)]">
            Visual direction
          </p>

          <p className="mt-1 text-sm leading-6 text-[var(--ds-text-secondary)]">
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
          <div className="border-t border-[var(--ds-border-subtle)] pt-4">
            {leaflet.mandatoryNotes.map(
              (
                note,
                index
              ) => (
                <p
                  key={
                    `${note}-${index}`
                  }
                  className="mt-1 text-xs leading-5 text-[var(--ds-text-tertiary)]"
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
    <Icon className="h-5 w-5 text-[var(--ds-text-brand)]" />
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
