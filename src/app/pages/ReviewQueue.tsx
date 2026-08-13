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
  Clock3,
  FileText,
  History,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
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
  } =
    useAuth();

  const reviewerRole =
    profile?.role as
      | ReviewerRole
      | undefined;

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<QueueTab>(
      "pending"
    );

  const [
    items,
    setItems,
  ] =
    useState<
      ReviewQueueItem[]
    >([]);

  const [
    activity,
    setActivity,
  ] =
    useState<
      ReviewerActivityItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      ReviewQueueItem | null
    >(null);

  const [
    comments,
    setComments,
  ] =
    useState(
      ""
    );

  const [
    decisionError,
    setDecisionError,
  ] =
    useState(
      ""
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const canReview =
    reviewerRole ===
      "marketing_reviewer" ||
    reviewerRole ===
      "corpcom_reviewer";

  useEffect(() => {
    if (
      !canReview
    ) {
      setLoading(
        false
      );

      return;
    }

    loadAll();
  }, [
    reviewerRole,
  ]);

  async function loadAll() {
    if (
      !reviewerRole
    ) {
      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        queueData,
        activityData,
      ] =
        await Promise.all([
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
       * Keep selected item valid after refresh.
       */
      if (
        selected
      ) {
        const refreshed =
          queueData.find(
            (
              item
            ) =>
              item.approval_action_id ===
              selected.approval_action_id
          );

        setSelected(
          refreshed ||
            null
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reviewer dashboard."
      );
    } finally {
      setLoading(
        false
      );
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
      setSubmitting(
        true
      );

      setError(
        ""
      );

      setDecisionError(
        ""
      );

      await submitReviewerDecision({
        approvalActionId:
          selected.approval_action_id,

        communicationId:
          selected.communication_id,

        decision,

        comments,

        reviewerRole,
      });

      setSelected(
        null
      );

      setComments(
        ""
      );

      await loadAll();

      /**
       * After a decision, show My Activity so the reviewer
       * immediately sees that their action was recorded.
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
      setSubmitting(
        false
      );
    }
  }

  const heading =
    useMemo(
      () =>
        reviewerRole ===
        "corpcom_reviewer"
          ? "CorpCom Review"
          : "Marketing Review",
      [
        reviewerRole,
      ]
    );

  if (
    !canReview
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto max-w-5xl px-8 py-16 text-center">
          <h1 className="mb-3 text-2xl text-gray-900">
            Review access required
          </h1>

          <p className="text-gray-600">
            This page is available to Marketing and CorpCom reviewers.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-6xl px-8 py-12">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl text-gray-900">
              {
                heading
              }
            </h1>

            <p className="text-gray-600">
              Review pending communications and keep track of your completed decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadAll
            }
            disabled={
              loading
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

        <div className="mb-7 flex w-fit rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "pending"
              )
            }
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab ===
              "pending"
                ? "bg-[#07877B] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pending Reviews
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "pending"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {
                items.length
              }
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "activity"
              )
            }
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab ===
              "activity"
                ? "bg-[#07877B] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            My Activity
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "activity"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {
                activity.length
              }
            </span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {
              error
            }
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500 shadow-sm">
            Loading reviewer dashboard...
          </div>
        ) : activeTab ===
          "activity" ? (
          <ActivityView
            items={
              activity
            }
            onOpen={(
              item
            ) =>
              navigate(
                `/approval/status?communicationId=${encodeURIComponent(
                  item.communication_id
                )}`
              )
            }
          />
        ) : items.length ===
          0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-500" />

            <h2 className="mb-2 text-xl text-gray-900">
              You're all caught up
            </h2>

            <p className="text-sm text-gray-500">
              There are no communications waiting for your review.
            </p>

            {activity.length >
              0 && (
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "activity"
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <History className="h-4 w-4" />
                View My Activity
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
            <div className="space-y-3">
              {items.map(
                (
                  item
                ) => (
                  <button
                    key={
                      item.approval_action_id
                    }
                    type="button"
                    onClick={() => {
                      setSelected(
                        item
                      );

                      setComments(
                        item.comments ||
                          ""
                      );

                      setDecisionError(
                        ""
                      );
                    }}
                    className={`w-full rounded-xl border bg-white p-5 text-left shadow-sm transition-all ${
                      selected?.approval_action_id ===
                      item.approval_action_id
                        ? "border-[#07877B] ring-2 ring-[#07877B]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {item.communication
                            ?.title ||
                            "Untitled Communication"}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-gray-500">
                            Submitted{" "}
                            {formatDate(
                              item.created_at
                            )}
                          </p>

                          {item.is_resubmission && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                              Revised &amp; resubmitted
                            </span>
                          )}
                        </div>

                        <SubmitterInline
                          item={
                            item
                          }
                          reviewerRole={
                            reviewerRole!
                          }
                        />
                      </div>

                      {item.communication
                        ?.category && (
                        <CategoryTag
                          category={mapDatabaseCategory(
                            item.communication
                              .category
                          )}
                          size="sm"
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                      <span>
                        Audience:{" "}
                        {item.communication
                          ?.audience ||
                          "—"}
                      </span>

                      <span>
                        Stage:{" "}
                        {formatStage(
                          item.stage
                        )}
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>

            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {!selected ? (
                <div className="py-10 text-center">
                  <FileText className="mx-auto mb-3 h-9 w-9 text-gray-300" />

                  <p className="text-sm text-gray-500">
                    Select a communication to review.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5 border-b border-gray-100 pb-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#07877B]">
                          {formatStage(
                            selected.stage
                          )}
                        </p>

                        <h2 className="text-xl leading-7 text-gray-900">
                          {selected.communication
                            ?.title ||
                            "Communication"}
                        </h2>
                      </div>

                      <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Action required
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Submitted{" "}
                      {formatDate(
                        selected.created_at
                      )}
                    </p>
                  </div>

                  <SubmissionIdentity
                    item={
                      selected
                    }
                    reviewerRole={
                      reviewerRole!
                    }
                  />

                  {selected.communication
                    ?.selected_variant_id && (
                    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#07877B]" />

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Copy submitted for approval
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Review the final selected variant before making a decision.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const comm =
                            selected.communication!;

                          const category =
                            comm.category
                              ? mapDatabaseCategory(
                                  comm.category
                                )
                              : "research";

                          navigate(
                            `/create/preview?communicationId=${encodeURIComponent(
                              comm.id
                            )}&variantId=${encodeURIComponent(
                              comm.selected_variant_id!
                            )}&category=${encodeURIComponent(
                              category
                            )}&mode=review`
                          );
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-[#07877B] hover:text-[#07877B]"
                      >
                        <FileText className="h-4 w-4" />
                        Open Full Preview
                      </button>
                    </div>
                  )}

                  <div className="mb-4 border-t border-gray-100 pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Review decision
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                      <MessageSquareText className="h-4 w-4" />
                      Reviewer Comment
                    </label>

                    <textarea
                      rows={
                        5
                      }
                      value={
                        comments
                      }
                      onChange={(
                        event
                      ) => {
                        setComments(
                          event.target
                            .value
                        );

                        if (
                          decisionError
                        ) {
                          setDecisionError(
                            ""
                          );
                        }
                      }}
                      placeholder="Add review comments..."
                      className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                        decisionError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-[#07877B] focus:ring-[#07877B]/20"
                      }`}
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      A comment is required when requesting changes or rejecting a communication.
                    </p>

                    {decisionError && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                        {
                          decisionError
                        }
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleDecision(
                          "approved"
                        )
                      }
                      disabled={
                        submitting
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-white hover:bg-[#06766a] disabled:opacity-50"
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
                        handleDecision(
                          "changes_requested"
                        )
                      }
                      disabled={
                        submitting
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Request Changes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDecision(
                          "rejected"
                        )
                      }
                      disabled={
                        submitting
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function ActivityView({
  items,
  onOpen,
}: {
  items:
    ReviewerActivityItem[];

  onOpen:
    (
      item:
        ReviewerActivityItem
    ) => void;
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <History className="mx-auto mb-4 h-10 w-10 text-gray-300" />

        <h2 className="mb-2 text-xl text-gray-900">
          No activity yet
        </h2>

        <p className="text-sm text-gray-500">
          Your completed review actions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="text-lg font-medium text-gray-900">
          My Activity
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Your review actions captured in the central activity audit trail.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map(
          (
            item
          ) => {
            const config =
              activityConfig(
                item.action
              );

            const Icon =
              config.icon;

            return (
              <div
                key={
                  item.activity_id
                }
                className="grid gap-4 px-6 py-5 md:grid-cols-[44px,1fr,180px]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}
                >
                  <Icon
                    className={`h-4 w-4 ${config.iconClass}`}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900">
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

                  <p className="mt-1 text-sm text-gray-700">
                    <span
                      className={
                        config.textClass
                      }
                    >
                      {
                        config.label
                      }
                    </span>

                    {" · "}

                    {formatActivityStage(
                      item.user_role
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Performed by:{" "}
                    {item.user_name ||
                      "Current user"}

                    {item.communication_status && (
                      <>
                        {" · "}
                        Current status:{" "}
                        {humanize(
                          item.communication_status
                        )}
                      </>
                    )}
                  </p>

                  {item.description && (
                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
                      {
                        item.description
                      }
                    </div>
                  )}

                  {typeof item.metadata?.comment ===
                    "string" &&
                    item.metadata.comment && (
                      <div className="mt-2 text-xs text-gray-500">
                        Comment:{" "}
                        {
                          item.metadata.comment
                        }
                      </div>
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
                        onOpen(
                          item
                        )
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
  item:
    ReviewQueueItem;

  reviewerRole:
    ReviewerRole;
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
  item:
    ReviewQueueItem;

  reviewerRole:
    ReviewerRole;
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
    <section className="mb-6 rounded-xl border border-[#b3d9d5] bg-[#f7fbfa] p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserRound className="h-4 w-4 text-[#07877B]" />

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
            label="Originally submitted by"
            person={
              original
            }
          />

          <PersonRow
            label="Sent to CorpCom by"
            person={
              stage
            }
          />
        </div>
      )}

      {item.is_resubmission && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
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
  label:
    string;

  person:
    ReviewPerson | null;
}) {
  return (
    <div className="grid grid-cols-[125px,1fr] gap-3 text-xs">
      <span className="text-gray-500">
        {
          label
        }
      </span>

      <div>
        <p className="font-medium text-gray-900">
          {personName(
            person
          )}
        </p>

        {person && (
          <p className="mt-0.5 text-gray-500">
            {[
              person.designation,
              person.department,
            ]
              .filter(
                Boolean
              )
              .join(
                " · "
              )}
          </p>
        )}
      </div>
    </div>
  );
}

function activityConfig(
  action:
    string
) {
  if (
    action === "marketing_approved" ||
    action === "corpcom_approved"
  ) {
    return {
      icon:
        CheckCircle2,
      bg:
        "bg-green-50",
      iconClass:
        "text-green-600",
      textClass:
        "font-medium text-green-700",
      label:
        action === "corpcom_approved"
          ? "Final approved"
          : "Approved & sent to CorpCom",
    };
  }

  if (
    action === "marketing_changes_requested" ||
    action === "corpcom_changes_requested"
  ) {
    return {
      icon:
        RotateCcw,
      bg:
        "bg-amber-50",
      iconClass:
        "text-amber-600",
      textClass:
        "font-medium text-amber-700",
      label:
        "Changes requested",
    };
  }

  if (
    action === "marketing_rejected" ||
    action === "corpcom_rejected"
  ) {
    return {
      icon:
        XCircle,
      bg:
        "bg-red-50",
      iconClass:
        "text-red-600",
      textClass:
        "font-medium text-red-700",
      label:
        "Rejected",
    };
  }

  return {
    icon:
      Clock3,
    bg:
      "bg-blue-50",
    iconClass:
      "text-blue-600",
    textClass:
      "font-medium text-blue-700",
    label:
      humanize(
        action
      ),
  };
}

function formatActivityStage(
  role:
    string
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
  person:
    ReviewPerson | null
) {
  return (
    person?.full_name ||
    "Unknown user"
  );
}

function mapDatabaseCategory(
  category:
    string
):
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding" {
  switch (
    category
  ) {
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
  stage:
    string
) {
  switch (
    stage
  ) {
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
  value:
    string
) {
  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      day:
        "numeric",
      month:
        "short",
      hour:
        "numeric",
      minute:
        "2-digit",
    }
  );
}

function formatFullDate(
  value:
    string
) {
  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      day:
        "numeric",
      month:
        "short",
      year:
        "numeric",
      hour:
        "numeric",
      minute:
        "2-digit",
    }
  );
}

function humanize(
  value:
    string
) {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        c
      ) =>
        c.toUpperCase()
    );
}
