import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  CheckCircle2,
  FileText,
  MessageSquareText,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { useAuth } from "../auth/useAuth";

import {
  getReviewerQueue,
  ReviewQueueItem,
  submitReviewerDecision,
} from "../services/reviews";

type ReviewerRole =
  | "marketing_reviewer"
  | "corpcom_reviewer";

export function ReviewQueue() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const reviewerRole =
    profile?.role as
      | ReviewerRole
      | undefined;

  const [items, setItems] =
    useState<ReviewQueueItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selected, setSelected] =
    useState<ReviewQueueItem | null>(
      null
    );

  const [comments, setComments] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

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

    loadQueue();
  }, [reviewerRole]);

  async function loadQueue() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getReviewerQueue(
          reviewerRole!
        );

      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load review queue."
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

    try {
      setSubmitting(true);
      setError("");

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

      await loadQueue();
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

  const heading = useMemo(
    () =>
      reviewerRole ===
      "corpcom_reviewer"
        ? "CorpCom Review Queue"
        : "Marketing Review Queue",
    [reviewerRole]
  );

  if (!canReview) {
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
        <div className="mb-8">
          <h1 className="mb-2 text-3xl text-gray-900">
            {heading}
          </h1>
          <p className="text-gray-600">
            Review communications waiting for your action.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-500">
            Loading review queue...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-500" />
            <h2 className="mb-2 text-xl text-gray-900">
              You're all caught up
            </h2>
            <p className="text-sm text-gray-500">
              There are no communications waiting for your review.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={
                    item.approval_action_id
                  }
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setComments(
                      item.comments || ""
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
                      <h3 className="text-base text-gray-900">
                        {item.communication?.title ||
                          "Untitled Communication"}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Submitted{" "}
                        {formatDate(
                          item.created_at
                        )}
                      </p>
                    </div>

                    {item.communication?.category && (
                      <CategoryTag
                        category={
                          mapDatabaseCategory(
                            item.communication.category
                          )
                        }
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                    <span>
                      Audience:{" "}
                      {item.communication?.audience ||
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
              ))}
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
                  <h2 className="mb-2 text-xl text-gray-900">
                    {selected.communication?.title ||
                      "Communication"}
                  </h2>

                  <p className="mb-5 text-sm text-gray-500">
                    {formatStage(
                      selected.stage
                    )}
                  </p>

                  {selected.communication
                    ?.selected_variant_id && (
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
                          )}`
                        );
                      }}
                      className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Open Full Preview
                    </button>
                  )}

                  <div className="mb-6">
                    <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                      <MessageSquareText className="h-4 w-4" />
                      Reviewer Comment
                    </label>
                    <textarea
                      rows={5}
                      value={comments}
                      onChange={(event) =>
                        setComments(
                          event.target.value
                        )
                      }
                      placeholder="Add review comments..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleDecision(
                          "approved"
                        )
                      }
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-white hover:bg-[#06766a] disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {reviewerRole ===
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
                      disabled={submitting}
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
                      disabled={submitting}
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

function formatDate(
  value: string
) {
  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }
  );
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
      return stage;
  }
}
