import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  MoreVertical,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryTag } from "../components/CategoryTag";

import { useAuth } from "../auth/useAuth";

import {
  CommunicationRecord,
  createCommunication,
  getMyCommunications,
} from "../services/communications";

import {
  getReviewerQueue,
  ReviewQueueItem,
} from "../services/reviews";

export function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
    profile,
  } = useAuth();

  const isReviewer =
    profile?.role === "marketing_reviewer" ||
    profile?.role === "corpcom_reviewer";

  const canReview =
    isReviewer ||
    profile?.role === "admin";

  const canCreate =
    profile?.role === "creator" ||
    profile?.role === "admin";

  const [
    communications,
    setCommunications,
  ] = useState<CommunicationRecord[]>([]);

  const [
    reviewQueue,
    setReviewQueue,
  ] = useState<ReviewQueueItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /**
   * Load role-specific dashboard data.
   *
   * Creator/Admin creation metrics use
   * communications.
   *
   * Reviewer pending metrics use the exact
   * same getReviewerQueue() source as /reviews,
   * so the dashboard count can never disagree
   * with the Review Queue.
   */
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        if (
          profile?.role ===
            "marketing_reviewer" ||
          profile?.role ===
            "corpcom_reviewer"
        ) {
          const queue =
            await getReviewerQueue(
              profile.role
            );

          setReviewQueue(
            queue
          );

          setCommunications(
            []
          );

          return;
        }

        const data =
          await getMyCommunications();

        setCommunications(
          data
        );

        setReviewQueue(
          []
        );
      } catch (err) {
        console.error(
          "Unable to load dashboard:",
          err
        );

        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    if (
      user &&
      profile?.role
    ) {
      loadDashboard();
    }
  }, [
    user,
    profile?.role,
  ]);

  /**
   * Create a real draft before
   * starting the communication journey.
   */
  const handleStartCreating =
    async () => {
      if (!user) {
        return;
      }

      try {
        setCreating(true);
        setError("");

        const communication =
          await createCommunication(
            user.id
          );

        navigate(
          `/create/category?communicationId=${encodeURIComponent(
            communication.id
          )}`
        );
      } catch (err) {
        console.error(
          "Unable to create communication:",
          err
        );

        setError(
          "Unable to create a new communication. Please try again."
        );
      } finally {
        setCreating(false);
      }
    };

  /**
   * Dashboard metrics.
   */
  const totalDrafts =
    useMemo(() => {
      return communications.filter(
        (item) =>
          item.status === "draft"
      ).length;
    }, [communications]);

  const pendingApproval =
    useMemo(() => {
      if (isReviewer) {
        return reviewQueue.length;
      }

      const pendingStatuses = [
        "pending_approval",
        "submitted",
        "marketing_review",
        "marketing_approved",
        "corpcom_review",
      ];

      return communications.filter(
        (item) =>
          pendingStatuses.includes(
            item.status
          )
      ).length;
    }, [
      communications,
      isReviewer,
      reviewQueue,
    ]);

  const revisedResubmissions =
    useMemo(() => {
      return reviewQueue.filter(
        (item) =>
          item.is_resubmission
      ).length;
    }, [reviewQueue]);

  const approved =
    useMemo(() => {
      return communications.filter(
        (item) =>
          item.status === "approved"
      ).length;
    }, [communications]);

  const mostUsedCategory =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      if (isReviewer) {
        reviewQueue.forEach(
          (item) => {
            const category =
              item.communication
                ?.category;

            if (!category) {
              return;
            }

            counts[category] =
              (counts[
                category
              ] || 0) + 1;
          }
        );
      } else {
        communications.forEach(
          (item) => {
            if (!item.category) {
              return;
            }

            counts[item.category] =
              (counts[
                item.category
              ] || 0) + 1;
          }
        );
      }

      const sorted =
        Object.entries(
          counts
        ).sort(
          (a, b) =>
            b[1] - a[1]
        );

      return (
        sorted[0]?.[0] ||
        null
      );
    }, [
      communications,
      isReviewer,
      reviewQueue,
    ]);

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-8 py-12">

        {/* Hero Section */}
        <div className="mb-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#e8f5f4]/30 p-10 shadow-sm">

          <div className="mx-auto max-w-3xl text-center">

            <div className="mb-5 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5f4]">
                {isReviewer ? (
                  <ClipboardCheck className="h-6 w-6 text-[#07877B]" />
                ) : (
                  <Plus className="h-6 w-6 text-[#07877B]" />
                )}
              </div>
            </div>

            <h1 className="mb-4 text-3xl text-gray-900">
              {isReviewer
                ? "Review Communications"
                : "Create New Communication"}
            </h1>

            <p className="mb-8 text-lg text-gray-600">
              {isReviewer
                ? "Review communications waiting for your action and move them through the approval workflow."
                : "Create structured, compliant, Geojit-aligned emailers in minutes."}
            </p>

            {isReviewer ? (
              <button
                type="button"
                onClick={() => navigate("/reviews")}
                className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg"
              >
                Open Review Queue
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : canCreate ? (
              <button
                type="button"
                onClick={handleStartCreating}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-5 w-5" />
                {creating ? "Creating..." : "Start Creating"}
              </button>
            ) : null}

            {error && (
              <div className="mx-auto mt-5 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">

              <button
                type="button"
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Drafts
              </button>

              <span className="text-gray-300">
                •
              </span>

              <button
                type="button"
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Recent Communications
              </button>

              {canReview && (
                <>
                  {canCreate && (
                    <span className="text-gray-300">
                      •
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/reviews"
                      )
                    }
                    className="text-sm font-medium text-[#07877B] transition-colors hover:text-[#06766a]"
                  >
                    Review Queue
                  </button>
                </>
              )}

              {profile?.role ===
                "admin" && (
                <>
                  <span className="text-gray-300">
                    •
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/settings/rules"
                      )
                    }
                    className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
                  >
                    Templates / Rules
                  </button>
                </>
              )}

            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Drafts / Review stage */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <h3 className={isReviewer ? "text-lg" : "text-2xl"}>
                {loading
                  ? "—"
                  : isReviewer
                    ? profile?.role === "corpcom_reviewer"
                      ? "CorpCom"
                      : "Marketing"
                    : totalDrafts}
              </h3>

            </div>

            <p className="text-sm text-muted-foreground">
              {isReviewer
                ? "Current Review Stage"
                : "Total Drafts"}
            </p>

          </div>

          {/* Pending Approval */}
          <button
            type="button"
            onClick={() => {
              if (canReview) {
                navigate("/reviews");
              }
            }}
            disabled={!canReview}
            className={`rounded-xl border bg-white p-6 text-left shadow-sm transition-all ${
              canReview
                ? "cursor-pointer border-gray-200 hover:-translate-y-0.5 hover:border-[#07877B] hover:shadow-md"
                : "cursor-default border-gray-200"
            }`}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>

              <h3 className="text-2xl">
                {loading ? "—" : pendingApproval}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Pending Approval
            </p>

            {canReview && (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[#07877B]">
                View review queue
                <ArrowRight className="h-3.5 w-3.5" />
              </p>
            )}
          </button>

          {/* Approved / Revised */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <h3 className="text-2xl">
                {loading
                  ? "—"
                  : isReviewer
                    ? revisedResubmissions
                    : approved}
              </h3>

            </div>

            <p className="text-sm text-muted-foreground">
              {isReviewer
                ? "Revised & Resubmitted"
                : "Approved"}
            </p>

          </div>

          {/* Most Used Category */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2">
              <h3 className="text-sm text-muted-foreground">
                Most Used Category
              </h3>
            </div>

            {mostUsedCategory ? (
              <CategoryTag
                category={
                  mapDatabaseCategory(
                    mostUsedCategory
                  )
                }
                size="sm"
              />
            ) : (
              <p className="text-sm text-gray-400">
                No data yet
              </p>
            )}

          </div>

        </div>

        {/* Recent Communications */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

          <h2 className="mb-6 text-xl">
            {isReviewer
              ? "Pending Reviews"
              : "Recent Communications"}
          </h2>

          {loading && (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading communications...
            </div>
          )}

          {!loading &&
            isReviewer &&
            reviewQueue.length ===
              0 && (
              <div className="py-12 text-center">

                <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-400" />

                <h3 className="mb-2 text-gray-900">
                  You're all caught up
                </h3>

                <p className="text-sm text-gray-500">
                  No communications are waiting for your review.
                </p>

              </div>
            )}

          {!loading &&
            isReviewer &&
            reviewQueue.length >
              0 && (
              <div className="space-y-1">

                {reviewQueue.map(
                  (item) => (
                    <button
                      key={
                        item.approval_action_id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          "/reviews"
                        )
                      }
                      className="group flex w-full items-center gap-4 rounded-lg border border-transparent p-4 text-left transition-all hover:border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="mb-2">
                          {item.communication
                            ?.title ||
                            "Untitled Communication"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">
                          {item.communication
                            ?.category && (
                            <CategoryTag
                              category={
                                mapDatabaseCategory(
                                  item.communication.category
                                )
                              }
                              size="sm"
                            />
                          )}

                          <StatusBadge
                            status="pending_approval"
                            size="sm"
                          />

                          {item.is_resubmission && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              Revised & resubmitted
                            </span>
                          )}

                          <span className="text-sm text-muted-foreground">
                            {formatDate(
                              item.created_at
                            )}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )
                )}

              </div>
            )}

          {!loading &&
            !isReviewer &&
            communications.length ===
              0 && (
              <div className="py-12 text-center">

                <FileText className="mx-auto mb-4 h-10 w-10 text-gray-300" />

                <h3 className="mb-2 text-gray-900">
                  No communications yet
                </h3>

                <p className="text-sm text-gray-500">
                  Start by creating your
                  first communication.
                </p>

              </div>
            )}

          {!loading &&
            !isReviewer &&
            communications.length >
              0 && (
              <div className="space-y-1">

                {communications
                  .slice(0, 10)
                  .map(
                    (comm) => {
                      const revision =
                        getRevisionState(
                          comm
                        );

                      return (
                      <div
                        key={
                          comm.id
                        }
                        className="group flex items-center gap-4 rounded-lg border border-transparent p-4 transition-all hover:border-gray-200 hover:bg-gray-50"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            openCommunication(
                              navigate,
                              comm
                            )
                          }
                          className="flex-1 text-left"
                        >

                          <h3 className="mb-2">
                            {comm.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3">

                            {comm.category && (
                              <CategoryTag
                                category={
                                  mapDatabaseCategory(
                                    comm.category
                                  )
                                }
                                size="sm"
                              />
                            )}

                            <StatusBadge
                              status={
                                mapDatabaseStatus(
                                  comm.status
                                )
                              }
                              size="sm"
                            />

                            {revision.label && (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${revision.className}`}
                              >
                                {revision.label}
                              </span>
                            )}

                            <span className="text-sm text-muted-foreground">
                              {formatDate(
                                comm.updated_at
                              )}
                            </span>

                          </div>

                          {revision.message && (
                            <p className="mt-2 text-xs text-gray-600">
                              {revision.message}
                            </p>
                          )}

                        </button>

                        <button
                          type="button"
                          aria-label="Communication options"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                      </div>
                      );
                    }
                  )}

              </div>
            )}

        </div>

      </main>
    </div>
  );
}


/**
 * Convert database category names
 * to CategoryTag values.
 */
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


/**
 * Keep database workflow statuses intact.
 *
 * StatusBadge now understands the
 * real Supabase workflow values.
 */
function mapDatabaseStatus(
  status: string
) {
  switch (status) {

    case "draft":
    case "input_ready":
    case "generating":
    case "variants_ready":
    case "variant_selected":
    case "preview_ready":
    case "pending_approval":
    case "submitted":
    case "marketing_review":
    case "marketing_approved":
    case "corpcom_review":
    case "changes_requested":
    case "rejected":
    case "approved":
      return status;

    default:
      return "draft";
  }
}


/**
 * Open communication at its
 * appropriate workflow stage.
 */
function openCommunication(
  navigate: ReturnType<
    typeof useNavigate
  >,
  comm: CommunicationRecord
) {

  const communicationParam =
    `communicationId=${encodeURIComponent(
      comm.id
    )}`;

  /**
   * Once a communication enters the
   * approval workflow, the creator
   * should see Approval Status rather
   * than returning to submission.
   */
  const approvalStatuses = [
    "pending_approval",
    "submitted",
    "marketing_review",
    "marketing_approved",
    "corpcom_review",
    "changes_requested",
    "rejected",
    "approved",
  ];

  if (
    approvalStatuses.includes(
      comm.status
    )
  ) {
    navigate(
      `/approval/status?${communicationParam}`
    );

    return;
  }

  const category =
    comm.category
      ? mapDatabaseCategory(
          comm.category
        )
      : null;

  /**
   * No category yet:
   * return to Category Selection.
   */
  if (!category) {
    navigate(
      `/create/category?${communicationParam}`
    );

    return;
  }

  const categoryParam =
    `&category=${encodeURIComponent(
      category
    )}`;

  switch (comm.status) {

    case "generating":
      navigate(
        `/create/generating?${communicationParam}${categoryParam}`
      );
      return;

    case "variants_ready":
      navigate(
        `/create/variants?${communicationParam}${categoryParam}`
      );
      return;

    case "variant_selected":
    case "preview_ready":

      if (
        comm.selected_variant_id
      ) {
        navigate(
          `/create/preview?${communicationParam}&variantId=${encodeURIComponent(
            comm.selected_variant_id
          )}${categoryParam}`
        );

        return;
      }

      navigate(
        `/create/variants?${communicationParam}${categoryParam}`
      );

      return;

    case "input_ready":
    case "draft":
    default:

      navigate(
        `/create/form?${communicationParam}${categoryParam}`
      );

      return;
  }
}


function getRevisionState(
  comm:
    CommunicationRecord
) {
  const item =
    comm as CommunicationRecord & {
      revision_required?: boolean;
      revision_requested_at?: string | null;
      revision_completed_at?: string | null;
      revision_resubmitted_at?: string | null;
      latest_review_comment?: string | null;
    };

  if (
    item.revision_required &&
    !item.revision_completed_at
  ) {
    return {
      label:
        "Revision required",

      message:
        item.latest_review_comment
          ? `Reviewer: ${item.latest_review_comment}`
          : "A reviewer has requested changes before this can be resubmitted.",

      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (
    item.revision_required &&
    item.revision_completed_at
  ) {
    return {
      label:
        "Changes saved",

      message:
        "Requested changes have been saved. This communication is ready to resubmit for Marketing review.",

      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (
    item.revision_resubmitted_at &&
    [
      "pending_approval",
      "submitted",
      "marketing_review",
      "corpcom_review",
    ].includes(
      item.status
    )
  ) {
    return {
      label:
        "Revised & resubmitted",

      message:
        "The revised communication has been sent back into the approval workflow.",

      className:
        "border-green-200 bg-green-50 text-green-700",
    };
  }

  return {
    label: "",
    message: "",
    className: "",
  };
}

/**
 * Dashboard-friendly date.
 */
function formatDate(
  dateValue: string
) {
  const date =
    new Date(dateValue);

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
