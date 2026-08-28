import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  History,
  Layers3,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  CategoryTag,
} from "../components/CategoryTag";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getReviewerActivity,
  getReviewerQueue,
  ReviewerActivityItem,
  ReviewPerson,
  ReviewQueueItem,
  submitReviewerDecision,
} from "../services/reviews";


type ReviewerRole =
  | "marketing_reviewer"
  | "corpcom_reviewer";


type QueueTab =
  | "pending"
  | "activity";


export function ReviewQueue() {
  const navigate =
    useNavigate();

  const {
    profile,
  } = useAuth();

  const reviewerRole =
    profile?.role as
      | ReviewerRole
      | undefined;

  const [
    activeTab,
    setActiveTab,
  ] = useState<QueueTab>(
    "pending"
  );

  const [
    items,
    setItems,
  ] = useState<
    ReviewQueueItem[]
  >([]);

  const [
    activity,
    setActivity,
  ] = useState<
    ReviewerActivityItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selected,
    setSelected,
  ] = useState<
    ReviewQueueItem | null
  >(null);

  const [
    comments,
    setComments,
  ] = useState("");

  const [
    decisionError,
    setDecisionError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const canReview =
    reviewerRole ===
      "marketing_reviewer" ||
    reviewerRole ===
      "corpcom_reviewer";


  useEffect(() => {
    if (!canReview) {
      setLoading(false);
      return;
    }

    void loadAll();
  }, [reviewerRole]);


  async function loadAll() {
    if (!reviewerRole) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        queueData,
        activityData,
      ] = await Promise.all([
        getReviewerQueue(
          reviewerRole
        ),
        getReviewerActivity(
          50
        ),
      ]);

      setItems(
        queueData
      );

      setActivity(
        activityData
      );

      /**
       * Keep the selected row valid after refresh.
       */
      setSelected(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            queueData.find(
              (item) =>
                item.approval_action_id ===
                current.approval_action_id
            ) || null
          );
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reviewer dashboard."
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleDecision(
    decision:
      | "approved"
      | "changes_requested"
      | "rejected"
  ) {
    if (
      !selected ||
      !reviewerRole ||
      submitting
    ) {
      return;
    }

    if (
      (
        decision ===
          "changes_requested" ||
        decision ===
          "rejected"
      ) &&
      !comments.trim()
    ) {
      setDecisionError(
        decision ===
          "changes_requested"
          ? "Please explain what needs to be changed before sending this back to the creator."
          : "Please add a reason before rejecting this communication."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setDecisionError("");

      await submitReviewerDecision({
        approvalActionId:
          selected.approval_action_id,

        communicationId:
          selected.communication_id,

        decision,

        comments,

        reviewerRole,
      });

      setSelected(null);
      setComments("");

      await loadAll();

      /**
       * Show the audit result immediately after a decision.
       */
      setActiveTab(
        "activity"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save review decision."
      );
    } finally {
      setSubmitting(false);
    }
  }


  const heading =
    useMemo(
      () =>
        reviewerRole ===
        "corpcom_reviewer"
          ? "CorpCom Review"
          : "Marketing Review",
      [reviewerRole]
    );

  const stageLabel =
    reviewerRole ===
      "corpcom_reviewer"
      ? "Final governance review"
      : "First governance review";

  const revisedCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            Boolean(
              item.is_resubmission
            )
        ).length,
      [items]
    );


  function selectItem(
    item: ReviewQueueItem
  ) {
    setSelected(item);
    setComments(
      item.comments ||
        ""
    );
    setDecisionError("");
  }


  function openSelectedCommunication() {
    if (
      !selected?.communication
    ) {
      return;
    }

    const comm =
      selected.communication as any;

    const communicationId =
      encodeURIComponent(
        comm.id ||
          selected.communication_id
      );

    /**
     * GUIDED CREATION
     *
     * Guided communications are reviewed as one governed,
     * multi-channel package. They do not depend on the
     * Expert flow's selected_variant_id.
     */
    if (
      isGuidedCommunication(
        comm
      )
    ) {
      navigate(
        `/create/guided/approval-package?communicationId=${communicationId}&mode=review`
      );

      return;
    }

    /**
     * EXPERT CREATION
     *
     * Preserve the existing single selected-variant preview.
     */
    if (
      comm.selected_variant_id
    ) {
      const category =
        comm.category
          ? mapDatabaseCategory(
              comm.category
            )
          : "research";

      navigate(
        `/create/preview?communicationId=${communicationId}&variantId=${encodeURIComponent(
          comm.selected_variant_id
        )}&category=${encodeURIComponent(
          category
        )}&mode=review`
      );

      return;
    }

    /**
     * Defensive fallback for legacy/incomplete rows.
     */
    navigate(
      `/approval/status?communicationId=${communicationId}`
    );
  }


  if (!canReview) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto max-w-5xl px-6 py-16 text-center sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <ShieldCheck className="h-6 w-6 text-gray-500" />
          </div>

          <h1 className="mt-5 text-2xl text-gray-900">
            Review access required
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            This workspace is available only to Marketing and CorpCom reviewers.
          </p>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#07877B]" />

              <p className="text-sm font-medium text-[#07877B]">
                Review Workspace
              </p>
            </div>

            <h1 className="text-3xl text-gray-900">
              {heading}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
              Review communications waiting for your decision, open the submitted communication in context, and keep a clear audit trail of completed actions.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadAll()
            }
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>


        <section className="mb-7 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={Clock3}
            label="Pending"
            value={items.length}
            helper="Awaiting your decision"
          />

          <SummaryCard
            icon={RotateCcw}
            label="Revised"
            value={revisedCount}
            helper="Resubmitted after feedback"
          />

          <SummaryCard
            icon={ShieldCheck}
            label="Review stage"
            value={
              reviewerRole ===
                "corpcom_reviewer"
                ? "CorpCom"
                : "Marketing"
            }
            helper={stageLabel}
          />
        </section>


        <div className="mb-7 flex flex-wrap gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "pending"
              )
            }
            className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab ===
              "pending"
                ? "border-[#07877B] text-[#07877B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Pending Reviews

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "pending"
                  ? "bg-[#e8f5f4] text-[#075f58]"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "activity"
              )
            }
            className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab ===
              "activity"
                ? "border-[#07877B] text-[#07877B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            My Activity

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "activity"
                  ? "bg-[#e8f5f4] text-[#075f58]"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {activity.length}
            </span>
          </button>
        </div>


        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {loading ? (
          <LoadingState />
        ) : activeTab ===
          "activity" ? (
          <ActivityView
            items={activity}
            onOpen={(item) =>
              navigate(
                `/approval/status?communicationId=${encodeURIComponent(
                  item.communication_id
                )}`
              )
            }
          />
        ) : items.length ===
          0 ? (
          <EmptyQueue
            hasActivity={
              activity.length >
              0
            }
            onViewActivity={() =>
              setActiveTab(
                "activity"
              )
            }
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),430px]">
            <div className="space-y-3">
              {items.map(
                (item) => {
                  const comm =
                    item.communication as any;

                  const guided =
                    isGuidedCommunication(
                      comm
                    );

                  const active =
                    selected?.approval_action_id ===
                    item.approval_action_id;

                  return (
                    <button
                      key={
                        item.approval_action_id
                      }
                      type="button"
                      onClick={() =>
                        selectItem(
                          item
                        )
                      }
                      className={`group w-full rounded-2xl border bg-white p-5 text-left transition-all ${
                        active
                          ? "border-[#8bc9c2] shadow-sm ring-2 ring-[#07877B]/8"
                          : "border-gray-200 hover:border-[#b9d8d4] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3fbfa] px-2.5 py-1 text-[11px] font-medium text-[#075f58]">
                              {guided ? (
                                <Layers3 className="h-3.5 w-3.5" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}

                              {guided
                                ? "Guided package"
                                : "Expert communication"}
                            </span>

                            {item.is_resubmission && (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                Revised &amp; resubmitted
                              </span>
                            )}
                          </div>

                          <h2 className="mt-3 truncate text-base font-medium text-gray-900">
                            {comm?.title ||
                              "Untitled Communication"}
                          </h2>

                          <p className="mt-1 text-xs text-gray-500">
                            Submitted {formatDate(
                              item.created_at
                            )}
                          </p>

                          <SubmitterInline
                            item={item}
                            reviewerRole={
                              reviewerRole!
                            }
                          />
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                          {comm?.category && (
                            <CategoryTag
                              category={mapDatabaseCategory(
                                comm.category
                              )}
                              size="sm"
                            />
                          )}

                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                            Action required
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:grid-cols-2">
                        <p>
                          <span className="text-gray-400">
                            Audience
                          </span>
                          <span className="ml-2 font-medium text-gray-700">
                            {comm?.audience ||
                              "—"}
                          </span>
                        </p>

                        <p>
                          <span className="text-gray-400">
                            Stage
                          </span>
                          <span className="ml-2 font-medium text-gray-700">
                            {formatStage(
                              item.stage
                            )}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>


            <aside className="h-fit xl:sticky xl:top-6">
              {!selected ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-gray-800">
                    Select a communication
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    The review details and decision controls will appear here.
                  </p>
                </div>
              ) : (
                <ReviewPanel
                  item={selected}
                  reviewerRole={
                    reviewerRole!
                  }
                  comments={comments}
                  setComments={
                    setComments
                  }
                  decisionError={
                    decisionError
                  }
                  clearDecisionError={() =>
                    setDecisionError(
                      ""
                    )
                  }
                  submitting={
                    submitting
                  }
                  onOpen={
                    openSelectedCommunication
                  }
                  onDecision={
                    handleDecision
                  }
                />
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}


function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Clock3;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3fbfa]">
          <Icon className="h-4 w-4 text-[#07877B]" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="mt-0.5 text-lg font-medium text-gray-900">
            {value}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-gray-400">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}


function LoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
      <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#07877B]" />

      <p className="mt-3 text-sm text-gray-500">
        Loading reviewer workspace...
      </p>
    </div>
  );
}


function EmptyQueue({
  hasActivity,
  onViewActivity,
}: {
  hasActivity: boolean;
  onViewActivity: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
      </div>

      <h2 className="mt-5 text-xl text-gray-900">
        You're all caught up
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        There are no communications waiting for your review right now.
      </p>

      {hasActivity && (
        <button
          type="button"
          onClick={onViewActivity}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <History className="h-4 w-4" />
          View My Activity
        </button>
      )}
    </div>
  );
}


function ReviewPanel({
  item,
  reviewerRole,
  comments,
  setComments,
  decisionError,
  clearDecisionError,
  submitting,
  onOpen,
  onDecision,
}: {
  item: ReviewQueueItem;
  reviewerRole: ReviewerRole;
  comments: string;
  setComments: (
    value: string
  ) => void;
  decisionError: string;
  clearDecisionError: () => void;
  submitting: boolean;
  onOpen: () => void;
  onDecision: (
    decision:
      | "approved"
      | "changes_requested"
      | "rejected"
  ) => Promise<void>;
}) {
  const comm =
    item.communication as any;

  const guided =
    isGuidedCommunication(
      comm
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#07877B]">
              {formatStage(
                item.stage
              )}
            </p>

            <h2 className="mt-1 text-xl leading-7 text-gray-900">
              {comm?.title ||
                "Communication"}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              Submitted {formatDate(
                item.created_at
              )}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            Action required
          </span>
        </div>
      </div>


      <div className="p-6">
        <SubmissionIdentity
          item={item}
          reviewerRole={
            reviewerRole
          }
        />


        <section className="mb-6 rounded-xl border border-[#d8ebe8] bg-[#f8fcfb] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
              {guided ? (
                <Layers3 className="h-4 w-4 text-[#07877B]" />
              ) : (
                <Sparkles className="h-4 w-4 text-[#07877B]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {guided
                  ? "Governed approval package"
                  : "Submitted communication"}
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {guided
                  ? "Review the Creator's selected channel outputs together before recording your decision."
                  : "Open the final selected variant and review it before recording your decision."}
              </p>

              <button
                type="button"
                onClick={onOpen}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#b8d8d4] bg-white px-4 py-2.5 text-sm font-medium text-[#075f58] transition hover:border-[#07877B] hover:bg-[#f3fbfa]"
              >
                {guided ? (
                  <Layers3 className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                {guided
                  ? "Open Approval Package"
                  : "Open Full Preview"}
              </button>
            </div>
          </div>
        </section>


        <section className="border-t border-gray-100 pt-5">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Review decision
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Record the outcome for this review stage.
            </p>
          </div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageSquareText className="h-4 w-4 text-gray-400" />
            Reviewer comment
          </label>

          <textarea
            rows={5}
            value={comments}
            onChange={(event) => {
              setComments(
                event.target.value
              );

              if (
                decisionError
              ) {
                clearDecisionError();
              }
            }}
            placeholder="Add review comments..."
            className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none transition focus:ring-4 ${
              decisionError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-300 focus:border-[#07877B] focus:ring-[#07877B]/10"
            }`}
          />

          <p className="mt-2 text-xs leading-5 text-gray-500">
            A comment is required when requesting changes or rejecting a communication.
          </p>

          {decisionError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              {decisionError}
            </div>
          )}


          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={() =>
                void onDecision(
                  "approved"
                )
              }
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />

              {submitting
                ? "Saving decision..."
                : reviewerRole ===
                    "corpcom_reviewer"
                  ? "Final Approve"
                  : "Approve & Send to CorpCom"}
            </button>

            <button
              type="button"
              onClick={() =>
                void onDecision(
                  "changes_requested"
                )
              }
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Request Changes
            </button>

            <button
              type="button"
              onClick={() =>
                void onDecision(
                  "rejected"
                )
              }
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}


function ActivityView({
  items,
  onOpen,
}: {
  items: ReviewerActivityItem[];
  onOpen: (
    item: ReviewerActivityItem
  ) => void;
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
          <History className="h-5 w-5 text-gray-400" />
        </div>

        <h2 className="mt-4 text-xl text-gray-900">
          No activity yet
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Your completed review actions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3fbfa]">
            <History className="h-4 w-4 text-[#07877B]" />
          </div>

          <div>
            <h2 className="text-base font-medium text-gray-900">
              My Activity
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Your decisions captured in the central review audit trail.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map(
          (item) => {
            const config =
              activityConfig(
                item.action
              );

            const Icon =
              config.icon;

            return (
              <div
                key={item.activity_id}
                className="grid gap-4 px-6 py-5 md:grid-cols-[40px,minmax(0,1fr),160px]"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${config.bg}`}
                >
                  <Icon
                    className={`h-4 w-4 ${config.iconClass}`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      {item.communication_title ||
                        "Communication"}
                    </h3>

                    {item.category && (
                      <CategoryTag
                        category={mapDatabaseCategory(
                          item.category
                        )}
                        size="sm"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    <span className={config.textClass}>
                      {config.label}
                    </span>
                    {" · "}
                    {formatActivityStage(
                      item.user_role
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Performed by {item.user_name ||
                      "Current user"}

                    {item.communication_status && (
                      <>
                        {" · "}
                        Status {humanize(
                          item.communication_status
                        )}
                      </>
                    )}
                  </p>

                  {item.description && (
                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
                      {item.description}
                    </div>
                  )}

                  {typeof item.metadata?.comment ===
                    "string" &&
                    item.metadata.comment && (
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        Comment: {item.metadata.comment}
                      </p>
                    )}
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <p className="text-xs text-gray-400">
                    {formatFullDate(
                      item.created_at
                    )}
                  </p>

                  {item.communication_id && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpen(item)
                      }
                      className="text-sm font-medium text-[#07877B] hover:text-[#06766a]"
                    >
                      View Audit Trail
                    </button>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}


function SubmitterInline({
  item,
  reviewerRole,
}: {
  item: ReviewQueueItem;
  reviewerRole: ReviewerRole;
}) {
  const original =
    item.original_submitter;

  const stage =
    item.stage_submitter;

  if (
    !original &&
    !stage
  ) {
    return null;
  }

  const samePerson =
    original?.id &&
    stage?.id &&
    original.id ===
      stage.id;

  if (
    reviewerRole ===
      "marketing_reviewer" ||
    samePerson
  ) {
    const person =
      original ||
      stage;

    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
        <UserRound className="h-3.5 w-3.5 text-gray-400" />

        <span>
          Submitted by{" "}
          <strong className="font-medium text-gray-800">
            {personName(
              person
            )}
          </strong>
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1 text-xs text-gray-600">
      {original && (
        <div className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />

          <span>
            Originally submitted by{" "}
            <strong className="font-medium text-gray-800">
              {personName(
                original
              )}
            </strong>
          </span>
        </div>
      )}

      {stage && (
        <div className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />

          <span>
            Sent to CorpCom by{" "}
            <strong className="font-medium text-gray-800">
              {personName(
                stage
              )}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}


function SubmissionIdentity({
  item,
  reviewerRole,
}: {
  item: ReviewQueueItem;
  reviewerRole: ReviewerRole;
}) {
  const original =
    item.original_submitter;

  const stage =
    item.stage_submitter;

  if (
    !original &&
    !stage
  ) {
    return null;
  }

  const samePerson =
    original?.id &&
    stage?.id &&
    original.id ===
      stage.id;

  return (
    <section className="mb-5 rounded-xl bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserRound className="h-4 w-4 text-gray-400" />

        <h3 className="text-sm font-medium text-gray-900">
          Submission details
        </h3>
      </div>

      {reviewerRole ===
        "marketing_reviewer" ||
      samePerson ? (
        <PersonRow
          label="Submitted by"
          person={
            original ||
            stage
          }
        />
      ) : (
        <div className="space-y-3">
          <PersonRow
            label="Original creator"
            person={original}
          />

          <PersonRow
            label="Sent to CorpCom by"
            person={stage}
          />
        </div>
      )}

      {item.is_resubmission && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Revised and resubmitted after reviewer feedback
        </div>
      )}
    </section>
  );
}


function PersonRow({
  label,
  person,
}: {
  label: string;
  person: ReviewPerson | null;
}) {
  return (
    <div className="grid grid-cols-[110px,1fr] gap-3 text-xs">
      <span className="text-gray-500">
        {label}
      </span>

      <div className="min-w-0">
        <p className="font-medium text-gray-900">
          {personName(
            person
          )}
        </p>

        {person && (
          <p className="mt-0.5 truncate text-gray-500">
            {[
              person.designation,
              person.department,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}


function activityConfig(
  action: string
) {
  if (
    action ===
      "marketing_approved" ||
    action ===
      "corpcom_approved"
  ) {
    return {
      icon: CheckCircle2,
      bg: "bg-green-50",
      iconClass:
        "text-green-600",
      textClass:
        "font-medium text-green-700",
      label:
        action ===
          "corpcom_approved"
          ? "Final approved"
          : "Approved & sent to CorpCom",
    };
  }

  if (
    action ===
      "marketing_changes_requested" ||
    action ===
      "corpcom_changes_requested"
  ) {
    return {
      icon: RotateCcw,
      bg: "bg-amber-50",
      iconClass:
        "text-amber-600",
      textClass:
        "font-medium text-amber-700",
      label:
        "Changes requested",
    };
  }

  if (
    action ===
      "marketing_rejected" ||
    action ===
      "corpcom_rejected"
  ) {
    return {
      icon: XCircle,
      bg: "bg-red-50",
      iconClass:
        "text-red-600",
      textClass:
        "font-medium text-red-700",
      label: "Rejected",
    };
  }

  return {
    icon: Clock3,
    bg: "bg-blue-50",
    iconClass:
      "text-blue-600",
    textClass:
      "font-medium text-blue-700",
    label: humanize(
      action
    ),
  };
}


function formatActivityStage(
  role: string
) {
  if (
    role ===
    "marketing_reviewer"
  ) {
    return "Marketing Review";
  }

  if (
    role ===
    "corpcom_reviewer"
  ) {
    return "CorpCom Review";
  }

  return humanize(
    role
  );
}


function personName(
  person: ReviewPerson | null
) {
  return (
    person?.full_name ||
    "Unknown user"
  );
}


function isGuidedCommunication(
  communication: any
) {
  if (!communication) {
    return false;
  }

  const inputData =
    communication.input_data;

  if (
    inputData &&
    typeof inputData ===
      "object" &&
    !Array.isArray(
      inputData
    ) &&
    inputData.guided &&
    typeof inputData.guided ===
      "object" &&
    !Array.isArray(
      inputData.guided
    )
  ) {
    return true;
  }

  if (
    communication.creation_mode ===
      "guided" ||
    communication.creationMode ===
      "guided"
  ) {
    return true;
  }

  /**
   * Compatibility fallback:
   * Expert submissions are expected to carry a selected
   * variant. Guided packages are multi-channel and do not.
   */
  return !communication.selected_variant_id;
}


function mapDatabaseCategory(
  category: string
):
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding" {
  switch (category) {
    case "Research & Advisory":
      return "research";

    case "Investor Education":
      return "education";

    case "Product & Sales":
      return "product";

    case "Service & Transactional":
      return "service";

    case "Regulatory & Compliance":
      return "regulatory";

    case "Onboarding & Journey":
      return "onboarding";

    default:
      return "research";
  }
}


function formatStage(
  stage: string
) {
  switch (stage) {
    case "marketing_review":
      return "Marketing Review";

    case "corpcom_review":
      return "CorpCom Review";

    default:
      return humanize(
        stage
      );
  }
}


function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


function formatFullDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


function humanize(
  value: string
) {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}
