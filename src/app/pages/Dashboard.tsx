import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  MoreVertical,
  Plus,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  DesignSystemIcon,
} from "../design-system";

import {
  StatusBadge,
} from "../components/StatusBadge";

import {
  CategoryTag,
} from "../components/CategoryTag";

import {
  useAuth,
} from "../auth/useAuth";

import {
  CommunicationRecord,
  createCommunication,
  deleteDraftCommunication,
  getMyCommunications,
} from "../services/communications";

import {
  getReviewerQueue,
  ReviewQueueItem,
} from "../services/reviews";

type DashboardFilter =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "category";

export function Dashboard() {
  const navigate =
    useNavigate();

  const {
    user,
    profile,
  } = useAuth();

  const isReviewer =
    profile?.role ===
      "marketing_reviewer" ||
    profile?.role ===
      "corpcom_reviewer";

  const canReview =
    isReviewer;

  const canCreate =
    profile?.role ===
      "creator" ||
    profile?.role ===
      "admin";

  const [
    communications,
    setCommunications,
  ] =
    useState<
      CommunicationRecord[]
    >([]);

  const [
    reviewQueue,
    setReviewQueue,
  ] =
    useState<
      ReviewQueueItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<DashboardFilter>(
      "all"
    );

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<
      string | null
    >(null);

  const [
    menuOpenId,
    setMenuOpenId,
  ] =
    useState<
      string | null
    >(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      CommunicationRecord | null
    >(null);

  const [
    deleteStep,
    setDeleteStep,
  ] =
    useState<1 | 2>(1);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const recentRef =
    useRef<HTMLDivElement | null>(
      null
    );

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

  useEffect(() => {
    if (
      user &&
      profile?.role
    ) {
      void loadDashboard();
    }
  }, [
    user,
    profile?.role,
  ]);

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

        /**
         * Phase 2 entry point:
         *
         * Create the draft exactly as before, then allow the
         * user to choose Guided or Expert Creation.
         *
         * Expert Creation continues into the existing
         * /create/category flow without changing Phase 1.
         */
        navigate(
          `/create/mode?communicationId=${encodeURIComponent(
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

  const totalDrafts =
    useMemo(
      () =>
        communications.filter(
          (item) =>
            item.status ===
            "draft"
        ).length,
      [communications]
    );

  const pendingStatuses = [
    "pending_approval",
    "submitted",
    "marketing_review",
    "marketing_approved",
    "corpcom_review",
  ];

  const pendingApproval =
    useMemo(() => {
      if (isReviewer) {
        return reviewQueue.length;
      }

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
    useMemo(
      () =>
        reviewQueue.filter(
          (item) =>
            item.is_resubmission
        ).length,
      [reviewQueue]
    );

  const approved =
    useMemo(
      () =>
        communications.filter(
          (item) =>
            item.status ===
            "approved"
        ).length,
      [communications]
    );

  const mostUsedCategory =
    useMemo(() => {
      const counts:
        Record<
          string,
          number
        > = {};

      const source =
        isReviewer
          ? reviewQueue
              .map(
                (item) =>
                  item.communication
                    ?.category
              )
              .filter(
                Boolean
              )
          : communications
              .map(
                (item) =>
                  item.category
              )
              .filter(
                Boolean
              );

      for (
        const category of source
      ) {
        const key =
          String(category);

        counts[key] =
          (counts[key] ||
            0) + 1;
      }

      return (
        Object.entries(
          counts
        ).sort(
          (a, b) =>
            b[1] - a[1]
        )[0]?.[0] ||
        null
      );
    }, [
      communications,
      isReviewer,
      reviewQueue,
    ]);

  const filteredCommunications =
    useMemo(() => {
      if (
        activeFilter ===
        "draft"
      ) {
        return communications.filter(
          (item) =>
            item.status ===
            "draft"
        );
      }

      if (
        activeFilter ===
        "pending"
      ) {
        return communications.filter(
          (item) =>
            pendingStatuses.includes(
              item.status
            )
        );
      }

      if (
        activeFilter ===
        "approved"
      ) {
        return communications.filter(
          (item) =>
            item.status ===
            "approved"
        );
      }

      if (
        activeFilter ===
          "category" &&
        selectedCategory
      ) {
        return communications.filter(
          (item) =>
            item.category ===
            selectedCategory
        );
      }

      return communications;
    }, [
      communications,
      activeFilter,
      selectedCategory,
    ]);

  function applyFilter(
    filter:
      DashboardFilter,
    category?: string | null
  ) {
    setActiveFilter(
      filter
    );

    setSelectedCategory(
      category || null
    );

    window.setTimeout(
      () =>
        recentRef.current
          ?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start",
          }),
      50
    );
  }

  function requestDelete(
    comm:
      CommunicationRecord
  ) {
    if (
      comm.status !==
      "draft"
    ) {
      setError(
        "Only draft communications can be deleted."
      );
      return;
    }

    setMenuOpenId(
      null
    );

    setDeleteStep(1);

    setDeleteTarget(
      comm
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (
      deleteStep ===
      1
    ) {
      setDeleteStep(2);
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteDraftCommunication(
        deleteTarget.id
      );

      setCommunications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              deleteTarget.id
          )
      );

      setDeleteTarget(
        null
      );

      setDeleteStep(1);
    } catch (err) {
      console.error(
        "Unable to delete draft:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the draft."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f8] text-[#022F2D]">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">

        <section className="mb-8 rounded-2xl border border-[#d9e3e1] bg-white p-7 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5f4]">
                  {isReviewer ? (
                    <DesignSystemIcon
                      size="md"
                      tone="action"
                    >
                      <ClipboardCheck />
                    </DesignSystemIcon>
                  ) : (
                    <DesignSystemIcon
                      size="md"
                      tone="action"
                    >
                      <Plus />
                    </DesignSystemIcon>
                  )}
                </div>

                <p className="text-sm font-medium text-[#07877B]">
                  {isReviewer
                    ? "Approval Workspace"
                    : "Communication Studio"}
                </p>
              </div>

              <h1 className="text-3xl font-semibold leading-tight text-[#022F2D]">
                {isReviewer
                  ? "Review Communications"
                  : "Create New Communication"}
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[#4A6361]">
                {isReviewer
                  ? "Review communications waiting for your action and move them through the approval workflow."
                  : "Create structured, compliant, Geojit-aligned communications with AI-assisted guidance."}
              </p>

              {!isReviewer && (
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      applyFilter(
                        "draft"
                      )
                    }
                    className="font-medium text-[#4A6361] hover:text-[#07877B]"
                  >
                    View Drafts
                  </button>

                  <span className="text-[#b6c6c3]">
                    •
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      applyFilter(
                        "all"
                      )
                    }
                    className="font-medium text-[#4A6361] hover:text-[#07877B]"
                  >
                    View Recent Communications
                  </button>

                  {profile?.role ===
                    "admin" && (
                    <>
                      <span className="text-[#b6c6c3]">
                        •
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/settings/rules"
                          )
                        }
                        className="font-medium text-[#4A6361] hover:text-[#07877B]"
                      >
                        Templates / Rules
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0">
              {isReviewer ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/reviews"
                    )
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#07877B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06766a]"
                >
                  Open Review Queue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : canCreate ? (
                <button
                  type="button"
                  onClick={
                    handleStartCreating
                  }
                  disabled={
                    creating
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#07877B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />

                  {creating
                    ? "Creating..."
                    : "Start Creating"}
                </button>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <button
            type="button"
            onClick={() => {
              if (
                !isReviewer
              ) {
                applyFilter(
                  "draft"
                );
              }
            }}
            disabled={
              isReviewer
            }
            className={`rounded-2xl border border-[#d9e3e1] bg-white p-5 text-left shadow-sm transition-all ${
              isReviewer
                ? "cursor-default"
                : "hover:-translate-y-0.5 hover:border-[#07877B] hover:shadow-md"
            }`}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--ds-radius-sm)] bg-[var(--ds-surface-muted)]">
                <DesignSystemIcon
                  size="md"
                  tone="secondary"
                >
                  <FileText />
                </DesignSystemIcon>
              </div>

              <h3 className={
                isReviewer
                  ? "text-lg font-semibold text-[#022F2D]"
                  : "text-2xl font-semibold text-[#022F2D]"
              }>
                {loading
                  ? "—"
                  : isReviewer
                    ? profile?.role ===
                      "corpcom_reviewer"
                      ? "CorpCom"
                      : "Marketing"
                    : totalDrafts}
              </h3>
            </div>

            <p className="text-sm text-[#4A6361]">
              {isReviewer
                ? "Current Review Stage"
                : "Total Drafts"}
            </p>

            {!isReviewer && (
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#07877B]">
                View drafts
                <DesignSystemIcon
                  size="sm"
                  tone="action"
                >
                  <ArrowRight />
                </DesignSystemIcon>
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                canReview
              ) {
                navigate(
                  "/reviews"
                );
              } else {
                applyFilter(
                  "pending"
                );
              }
            }}
            className="rounded-2xl border border-[#d9e3e1] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#07877B] hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--ds-radius-sm)] bg-amber-50">
                <DesignSystemIcon
                  size="md"
                  tone="warning"
                >
                  <Clock />
                </DesignSystemIcon>
              </div>

              <h3 className="text-2xl font-semibold text-[#022F2D]">
                {loading
                  ? "—"
                  : pendingApproval}
              </h3>
            </div>

            <p className="text-sm text-[#4A6361]">
              Pending Approval
            </p>

            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#07877B]">
              {canReview
                ? "View review queue"
                : "View pending"}
              <DesignSystemIcon
                  size="sm"
                  tone="action"
                >
                  <ArrowRight />
                </DesignSystemIcon>
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                canReview
              ) {
                navigate(
                  "/reviews"
                );
              } else {
                applyFilter(
                  "approved"
                );
              }
            }}
            className="rounded-2xl border border-[#d9e3e1] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#07877B] hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--ds-radius-sm)] bg-green-50">
                <DesignSystemIcon
                  size="md"
                  tone="success"
                >
                  <CheckCircle />
                </DesignSystemIcon>
              </div>

              <h3 className="text-2xl font-semibold text-[#022F2D]">
                {loading
                  ? "—"
                  : isReviewer
                    ? revisedResubmissions
                    : approved}
              </h3>
            </div>

            <p className="text-sm text-[#4A6361]">
              {isReviewer
                ? "Revised & Resubmitted"
                : "Approved"}
            </p>

            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#07877B]">
              View
              <DesignSystemIcon
                  size="sm"
                  tone="action"
                >
                  <ArrowRight />
                </DesignSystemIcon>
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                !isReviewer &&
                mostUsedCategory
              ) {
                applyFilter(
                  "category",
                  mostUsedCategory
                );
              }
            }}
            disabled={
              isReviewer ||
              !mostUsedCategory
            }
            className={`rounded-2xl border border-[#d9e3e1] bg-white p-5 text-left shadow-sm transition-all ${
              !isReviewer &&
              mostUsedCategory
                ? "hover:-translate-y-0.5 hover:border-[#07877B] hover:shadow-md"
                : "cursor-default"
            }`}
          >
            <div className="mb-2">
              <h3 className="text-sm font-medium text-[#4A6361]">
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
              <p className="text-sm text-[#8da09d]">
                No data yet
              </p>
            )}

            {!isReviewer &&
              mostUsedCategory && (
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#07877B]">
                  Filter communications
                  <DesignSystemIcon
                  size="sm"
                  tone="action"
                >
                  <ArrowRight />
                </DesignSystemIcon>
                </p>
              )}
          </button>
        </div>

        {profile?.role ===
          "admin" && (
          <section className="mb-8 rounded-2xl border border-[#d9e3e1] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="ds-body-xs font-medium text-[var(--ds-brand-primary)]">
                  Administration
                </p>

                <h2 className="ds-title-4 mt-1">
                  Platform Management
                </h2>

                <p className="ds-body-xs mt-2">
                  Manage users, roles and Communication Studio rules.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-surface-subtle)]">
                <DesignSystemIcon
                  size="md"
                  tone="action"
                >
                  <UserCog />
                </DesignSystemIcon>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/settings/users"
                  )
                }
                className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] px-4 py-4 text-left hover:border-[var(--ds-brand-primary)] hover:bg-[var(--ds-surface-subtle)]"
              >
                <div>
                  <p className="ds-body-sm font-medium">
                    User Management
                  </p>

                  <p className="ds-body-xs mt-1">
                    Add users and assign Creator, Marketing, CorpCom or Admin roles.
                  </p>
                </div>

                <DesignSystemIcon
                  size="sm"
                  tone="tertiary"
                >
                  <ArrowRight />
                </DesignSystemIcon>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/settings/rules"
                  )
                }
                className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] px-4 py-4 text-left hover:border-[var(--ds-brand-primary)] hover:bg-[var(--ds-surface-subtle)]"
              >
                <div>
                  <p className="ds-body-sm font-medium">
                    Rules & Settings
                  </p>

                  <p className="ds-body-xs mt-1">
                    Manage communication rules and controlled settings.
                  </p>
                </div>

                <DesignSystemIcon
                  size="sm"
                  tone="tertiary"
                >
                  <ArrowRight />
                </DesignSystemIcon>
              </button>
            </div>
          </section>
        )}

        <section
          ref={recentRef}
          className="scroll-mt-6 rounded-2xl border border-[#d9e3e1] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#022F2D]">
                {isReviewer
                  ? "Pending Reviews"
                  : "Recent Communications"}
              </h2>

              {!isReviewer &&
                activeFilter !==
                  "all" && (
                  <p className="ds-body-xs mt-1">
                    Showing:{" "}
                    {getFilterLabel(
                      activeFilter,
                      selectedCategory
                    )}
                  </p>
                )}
            </div>

            {!isReviewer &&
              activeFilter !==
                "all" && (
                <button
                  type="button"
                  onClick={() =>
                    applyFilter(
                      "all"
                    )
                  }
                  className="ds-button-md inline-flex items-center gap-1.5 rounded-[var(--ds-radius-sm)] border border-[var(--ds-border-subtle)] px-3 py-2 text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-muted)]"
                >
                  <DesignSystemIcon
                    size="sm"
                    tone="secondary"
                  >
                    <X />
                  </DesignSystemIcon>
                  Clear filter
                </button>
              )}
          </div>

          {loading && (
            <div className="ds-body-xs py-10 text-center">
              Loading communications...
            </div>
          )}

          {!loading &&
            isReviewer &&
            reviewQueue.length ===
              0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <DesignSystemIcon
                    size="lg"
                    tone="success"
                  >
                    <CheckCircle />
                  </DesignSystemIcon>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[#022F2D]">
                  You're all caught up
                </h3>

                <p className="ds-body-xs">
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
                      className="group flex w-full items-center gap-4 rounded-xl border border-transparent p-4 text-left transition hover:border-[#d9e3e1] hover:bg-[#f7fbfa]"
                    >
                      <div className="flex-1">
                        <h3 className="mb-2 text-sm font-medium text-[#022F2D]">
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
                                  item.communication
                                    .category
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

                      <DesignSystemIcon
                        size="sm"
                        tone="tertiary"
                      >
                        <ArrowRight />
                      </DesignSystemIcon>
                    </button>
                  )
                )}
              </div>
            )}

          {!loading &&
            !isReviewer &&
            filteredCommunications.length ===
              0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <DesignSystemIcon
                    size="lg"
                    tone="disabled"
                  >
                    <FileText />
                  </DesignSystemIcon>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[#022F2D]">
                  No communications found
                </h3>

                <p className="ds-body-xs">
                  Try another filter or create a new communication.
                </p>
              </div>
            )}

          {!loading &&
            !isReviewer &&
            filteredCommunications.length >
              0 && (
              <div className="space-y-1">
                {filteredCommunications
                  .slice(
                    0,
                    10
                  )
                  .map(
                    (comm) => {
                      const revision =
                        getRevisionState(
                          comm
                        );

                      const actionLabel =
                        getPrimaryActionLabel(
                          comm
                        );

                      return (
                        <div
                          key={
                            comm.id
                          }
                          className="group relative flex items-center gap-4 rounded-xl border border-transparent p-4 transition hover:border-[#d9e3e1] hover:bg-[#f7fbfa]"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openCommunication(
                                navigate,
                                comm
                              )
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <h3 className="mb-2 text-sm font-medium text-[#022F2D]">
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
                                  {
                                    revision.label
                                  }
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
                                {
                                  revision.message
                                }
                              </p>
                            )}
                          </button>

                          <div className="hidden items-center gap-2 sm:flex">
                            <button
                              type="button"
                              onClick={() =>
                                openCommunication(
                                  navigate,
                                  comm
                                )
                              }
                              className="rounded-lg border border-[#d9e3e1] px-3 py-2 text-xs font-semibold text-[#022F2D] hover:border-[#07877B] hover:text-[#07877B]"
                            >
                              {
                                actionLabel
                              }
                            </button>

                            {comm.status ===
                              "draft" && (
                              <button
                                type="button"
                                onClick={() =>
                                  requestDelete(
                                    comm
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete Draft
                              </button>
                            )}
                          </div>

                          <div className="relative sm:hidden">
                            <button
                              type="button"
                              aria-label="Communication options"
                              onClick={() =>
                                setMenuOpenId(
                                  (current) =>
                                    current ===
                                    comm.id
                                      ? null
                                      : comm.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-[var(--ds-radius-sm)] hover:bg-[var(--ds-surface-muted)]"
                            >
                              <DesignSystemIcon
                                size="sm"
                                tone="secondary"
                              >
                                <MoreVertical />
                              </DesignSystemIcon>
                            </button>

                            {menuOpenId ===
                              comm.id && (
                              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#d9e3e1] bg-white p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(
                                      null
                                    );

                                    openCommunication(
                                      navigate,
                                      comm
                                    );
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {
                                    actionLabel
                                  }
                                </button>

                                {comm.status ===
                                  "draft" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestDelete(
                                        comm
                                      )
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete Draft
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            )}
        </section>
      </main>

      {deleteTarget && (
        <DeleteDraftModal
          communication={
            deleteTarget
          }
          step={
            deleteStep
          }
          deleting={
            deleting
          }
          onCancel={() => {
            if (
              deleting
            ) {
              return;
            }

            setDeleteTarget(
              null
            );

            setDeleteStep(1);
          }}
          onConfirm={() =>
            void confirmDelete()
          }
        />
      )}
    </div>
  );
}

function DeleteDraftModal({
  communication,
  step,
  deleting,
  onCancel,
  onConfirm,
}: {
  communication:
    CommunicationRecord;

  step: 1 | 2;

  deleting:
    boolean;

  onCancel:
    () => void;

  onConfirm:
    () => void;
}) {
  const final =
    step === 2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d9e3e1] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <DesignSystemIcon
            size="md"
            tone="error"
          >
            <Trash2 />
          </DesignSystemIcon>
        </div>

        <h2 className="ds-title-4">
          {final
            ? "Confirm permanent deletion"
            : "Delete this draft?"}
        </h2>

        <p className="ds-body-sm mt-3">
          {final
            ? "This is the final confirmation. The draft and its unsent content will be permanently deleted. This action cannot be undone."
            : "Only drafts that have never entered the approval workflow can be deleted."}
        </p>

        <div className="mt-4 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)] px-4 py-3">
          <p className="ds-body-sm font-medium">
            {
              communication.title
            }
          </p>

          <p className="ds-body-xs mt-1">
            Draft · Last updated{" "}
            {formatDate(
              communication.updated_at
            )}
          </p>
        </div>

        {final && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
            Once deleted, this draft cannot be restored.
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              deleting
            }
            className="rounded-lg border border-[#cbd7d5] bg-white px-4 py-2.5 text-sm font-medium text-[#022F2D] hover:bg-[#f7fbfa] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              deleting
            }
            className="ds-button-md rounded-[var(--ds-radius-sm)] bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : final
                ? "Permanently Delete Draft"
                : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getPrimaryActionLabel(
  comm:
    CommunicationRecord
) {
  switch (
    comm.status
  ) {
    case "draft":
    case "input_ready":
    case "generating":
    case "variants_ready":
    case "variant_selected":
    case "preview_ready":
      return "Continue";

    case "changes_requested":
      return "Revise";

    case "approved":
    case "rejected":
      return "View Audit";

    default:
      return "View Status";
  }
}

function getFilterLabel(
  filter:
    DashboardFilter,
  selectedCategory:
    string | null
) {
  switch (filter) {
    case "draft":
      return "Drafts";

    case "pending":
      return "Pending approval";

    case "approved":
      return "Approved";

    case "category":
      return selectedCategory ||
        "Selected category";

    default:
      return "All communications";
  }
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
  switch (
    category
  ) {
    case "research":
    case "Research & Advisory":
    case "Fundamental Research":
      return "research";

    case "education":
    case "Investor Education":
      return "education";

    case "product":
    case "Product & Sales":
      return "product";

    case "service":
    case "Service & Transactional":
      return "service";

    case "regulatory":
    case "Regulatory & Compliance":
      return "regulatory";

    case "onboarding":
    case "Onboarding & Journey":
      return "onboarding";

    default:
      return "research";
  }
}

function mapDatabaseStatus(
  status: string
) {
  switch (
    status
  ) {
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

function openCommunication(
  navigate:
    ReturnType<
      typeof useNavigate
    >,
  comm:
    CommunicationRecord
) {
  const communicationParam =
    `communicationId=${encodeURIComponent(
      comm.id
    )}`;

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

  /**
   * Once a communication enters the formal approval
   * workflow, both Expert and Guided Creation use the
   * common Approval Status page.
   *
   * ApprovalStatus itself now decides whether to open:
   * - Expert Full Preview
   * - Guided multi-channel Approval Package
   */
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

  /**
   * PHASE 2 — GUIDED CREATION
   *
   * Guided communications can remain in "draft" status
   * through several internal checkpoints. Therefore status
   * alone is not enough to decide where the Creator should
   * resume.
   *
   * We inspect input_data and reopen the most advanced
   * completed Guided checkpoint.
   */
  const guidedState =
    getGuidedResumeState(
      comm
    );

  if (
    guidedState
  ) {
    switch (
      guidedState
    ) {
      case "approval_package":
        navigate(
          `/create/guided/approval-package?${communicationParam}`
        );
        return;

      case "channels":
        navigate(
          `/create/guided/channels?${communicationParam}`
        );
        return;

      case "ready":
        navigate(
          `/create/guided/ready?${communicationParam}`
        );
        return;

      case "brief":
        navigate(
          `/create/guided/brief?${communicationParam}`
        );
        return;

      case "idea":
        navigate(
          `/create/guided?${communicationParam}`
        );
        return;

      case "mode":
        navigate(
          `/create/mode?${communicationParam}`
        );
        return;
    }
  }

  /**
   * EXISTING EXPERT CREATION FLOW
   *
   * Keep the working Phase 1 routing unchanged.
   */
  const category =
    comm.category
      ? mapDatabaseCategory(
          comm.category
        )
      : null;

  if (!category) {
    navigate(
      `/create/mode?${communicationParam}`
    );

    return;
  }

  const categoryParam =
    `&category=${encodeURIComponent(
      category
    )}`;

  switch (
    comm.status
  ) {
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


type GuidedResumeState =
  | "mode"
  | "idea"
  | "brief"
  | "ready"
  | "channels"
  | "approval_package";


function getGuidedResumeState(
  comm:
    CommunicationRecord
): GuidedResumeState | null {
  const inputData =
    comm.input_data;

  if (
    !inputData ||
    typeof inputData !==
      "object" ||
    Array.isArray(
      inputData
    )
  ) {
    return null;
  }

  const input =
    inputData as
      Record<string, any>;

  const guided =
    input.guided &&
    typeof input.guided ===
      "object" &&
    !Array.isArray(
      input.guided
    )
      ? input.guided as
          Record<string, any>
      : null;

  const explicitlyGuided =
    input.creationMode ===
      "guided" ||
    Boolean(
      guided
    ) ||
    Boolean(
      input.communicationMaster
    );

  if (
    !explicitlyGuided
  ) {
    return null;
  }

  /**
   * Most advanced checkpoint first.
   */

  if (
    guided?.approvalPackage &&
    typeof guided.approvalPackage ===
      "object" &&
    !Array.isArray(
      guided.approvalPackage
    )
  ) {
    return "approval_package";
  }

  if (
    guided?.selectedChannelVariants &&
    typeof guided.selectedChannelVariants ===
      "object" &&
    !Array.isArray(
      guided.selectedChannelVariants
    )
  ) {
    return "channels";
  }

  if (
    guided?.channelGeneration?.status ===
      "ready"
  ) {
    return "channels";
  }

  if (
    input.communicationMaster &&
    typeof input.communicationMaster ===
      "object" &&
    !Array.isArray(
      input.communicationMaster
    )
  ) {
    return "ready";
  }

  if (
    guided?.brief &&
    typeof guided.brief ===
      "object" &&
    !Array.isArray(
      guided.brief
    )
  ) {
    return "ready";
  }

  if (
    guided?.understanding &&
    typeof guided.understanding ===
      "object" &&
    !Array.isArray(
      guided.understanding
    )
  ) {
    return "idea";
  }

  if (
    guided?.rawInput &&
    typeof guided.rawInput ===
      "object" &&
    !Array.isArray(
      guided.rawInput
    )
  ) {
    return "idea";
  }

  /**
   * Guided mode selected but no idea captured yet.
   */
  if (
    explicitlyGuided
  ) {
    return "idea";
  }

  return "mode";
}


function getRevisionState(
  comm:
    CommunicationRecord
) {
  const item =
    comm as
      CommunicationRecord & {
        revision_required?:
          boolean;
        revision_requested_at?:
          string | null;
        revision_completed_at?:
          string | null;
        revision_resubmitted_at?:
          string | null;
        latest_review_comment?:
          string | null;
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

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  );
}
