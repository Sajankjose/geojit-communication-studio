import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import {
  TopNavBar,
} from "../components/TopNavBar";

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


const PAGE_SIZE =
  10;


const PENDING_STATUSES = [
  "pending_approval",
  "submitted",
  "marketing_review",
  "marketing_approved",
  "corpcom_review",
];


type StatusFilter =
  | "all"
  | "draft"
  | "in_progress"
  | "pending"
  | "changes_requested"
  | "rejected"
  | "approved";


type ModeFilter =
  | "all"
  | "guided"
  | "expert"
  | "not_selected";


type DateFilter =
  | "all"
  | "7"
  | "30"
  | "90";


export function Dashboard() {
  const navigate =
    useNavigate();

  const {
    user,
    profile,
  } =
    useAuth();

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
    useState(
      true
    );

  const [
    creating,
    setCreating,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    createError,
    setCreateError,
  ] =
    useState(
      ""
    );

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState(
      "all"
    );

  const [
    modeFilter,
    setModeFilter,
  ] =
    useState<ModeFilter>(
      "all"
    );

  const [
    dateFilter,
    setDateFilter,
  ] =
    useState<DateFilter>(
      "all"
    );

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      1
    );

  const [
    menuOpenId,
    setMenuOpenId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      CommunicationRecord | null
    >(
      null
    );

  const [
    deleteStep,
    setDeleteStep,
  ] =
    useState<1 | 2>(
      1
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false
    );

  const [
    isNameModalOpen,
    setIsNameModalOpen,
  ] =
    useState(
      false
    );

  const historyRef =
    useRef<HTMLDivElement | null>(
      null
    );


  async function loadDashboard() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

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
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(
        false
      );
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


  /**
   * Start Creating now opens the mandatory
   * Communication Name checkpoint.
   *
   * No Supabase draft is created until the user
   * provides a valid name.
   */
  function handleStartCreating() {
    if (
      !user ||
      !canCreate
    ) {
      return;
    }

    setError(
      ""
    );

    setCreateError(
      ""
    );

    setIsNameModalOpen(
      true
    );
  }


  async function handleCreateCommunication(
    communicationName:
      string
  ) {
    if (
      !user
    ) {
      return;
    }

    try {
      setCreating(
        true
      );

      setError(
        ""
      );

      setCreateError(
        ""
      );

      const communication =
        await createCommunication(
          user.id,
          communicationName
        );

      setCreateError(
        ""
      );

      setIsNameModalOpen(
        false
      );

      /**
       * Phase 2 entry point:
       *
       * Name the communication first,
       * then choose Guided or Expert Creation.
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

      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create a new communication. Please try again."
      );
    } finally {
      setCreating(
        false
      );
    }
  }


  const totalDrafts =
    useMemo(
      () =>
        communications.filter(
          (
            item
          ) =>
            item.status ===
            "draft"
        ).length,
      [
        communications,
      ]
    );


  const pendingApproval =
    useMemo(
      () => {
        if (
          isReviewer
        ) {
          return reviewQueue.length;
        }

        return communications.filter(
          (
            item
          ) =>
            PENDING_STATUSES.includes(
              item.status
            )
        ).length;
      },
      [
        communications,
        isReviewer,
        reviewQueue,
      ]
    );


  const revisedResubmissions =
    useMemo(
      () =>
        reviewQueue.filter(
          (
            item
          ) =>
            item.is_resubmission
        ).length,
      [
        reviewQueue,
      ]
    );


  const approved =
    useMemo(
      () =>
        communications.filter(
          (
            item
          ) =>
            item.status ===
            "approved"
        ).length,
      [
        communications,
      ]
    );


  const mostUsedCategory =
    useMemo(
      () => {
        const counts:
          Record<
            string,
            number
          > = {};

        const source =
          isReviewer
            ? reviewQueue
                .map(
                  (
                    item
                  ) =>
                    item.communication
                      ?.category
                )
                .filter(
                  Boolean
                )
            : communications
                .map(
                  (
                    item
                  ) =>
                    item.category
                )
                .filter(
                  Boolean
                );

        for (
          const category of source
        ) {
          const key =
            String(
              category
            );

          counts[
            key
          ] =
            (
              counts[
                key
              ] ||
              0
            ) +
            1;
        }

        return (
          Object.entries(
            counts
          ).sort(
            (
              a,
              b
            ) =>
              b[1] -
              a[1]
          )[
            0
          ]?.[
            0
          ] ||
          null
        );
      },
      [
        communications,
        isReviewer,
        reviewQueue,
      ]
    );


  const availableCategories =
    useMemo(
      () => {
        const categories =
          new Set<string>();

        communications.forEach(
          (
            item
          ) => {
            if (
              item.category
            ) {
              categories.add(
                item.category
              );
            }
          }
        );

        return Array.from(
          categories
        ).sort(
          (
            a,
            b
          ) =>
            getCategoryLabelFromDatabase(
              a
            ).localeCompare(
              getCategoryLabelFromDatabase(
                b
              )
            )
        );
      },
      [
        communications,
      ]
    );


  const filteredCommunications =
    useMemo(
      () => {
        const query =
          searchQuery
            .trim()
            .toLowerCase();

        const now =
          Date.now();

        const days =
          dateFilter ===
            "all"
            ? null
            : Number(
                dateFilter
              );

        return communications.filter(
          (
            item
          ) => {
            if (
              query &&
              !getCommunicationDisplayName(
                item
              )
                .toLowerCase()
                .includes(
                  query
                )
            ) {
              return false;
            }

            if (
              categoryFilter !==
                "all" &&
              item.category !==
                categoryFilter
            ) {
              return false;
            }

            if (
              modeFilter !==
                "all" &&
              getCreationMode(
                item
              ) !==
                modeFilter
            ) {
              return false;
            }

            if (
              !matchesStatusFilter(
                item.status,
                statusFilter
              )
            ) {
              return false;
            }

            if (
              days !==
              null
            ) {
              const updatedAt =
                new Date(
                  item.updated_at
                ).getTime();

              const cutoff =
                now -
                days *
                  24 *
                  60 *
                  60 *
                  1000;

              if (
                Number.isNaN(
                  updatedAt
                ) ||
                updatedAt <
                  cutoff
              ) {
                return false;
              }
            }

            return true;
          }
        );
      },
      [
        communications,
        searchQuery,
        statusFilter,
        categoryFilter,
        modeFilter,
        dateFilter,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCommunications.length /
        PAGE_SIZE
      )
    );


  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    modeFilter,
    dateFilter,
  ]);


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  const paginatedCommunications =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          PAGE_SIZE;

        return filteredCommunications.slice(
          start,
          start +
            PAGE_SIZE
        );
      },
      [
        filteredCommunications,
        currentPage,
      ]
    );


  const activeFilterCount =
    [
      searchQuery.trim()
        ? "search"
        : null,

      statusFilter !==
        "all"
        ? statusFilter
        : null,

      categoryFilter !==
        "all"
        ? categoryFilter
        : null,

      modeFilter !==
        "all"
        ? modeFilter
        : null,

      dateFilter !==
        "all"
        ? dateFilter
        : null,
    ].filter(
      Boolean
    ).length;


  function clearFilters() {
    setSearchQuery(
      ""
    );

    setStatusFilter(
      "all"
    );

    setCategoryFilter(
      "all"
    );

    setModeFilter(
      "all"
    );

    setDateFilter(
      "all"
    );

    setCurrentPage(
      1
    );
  }


  function jumpToHistory(
    nextStatus:
      StatusFilter =
        "all",
    nextCategory =
      "all"
  ) {
    setStatusFilter(
      nextStatus
    );

    setCategoryFilter(
      nextCategory
    );

    setCurrentPage(
      1
    );

    window.setTimeout(
      () =>
        historyRef.current
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

    setDeleteStep(
      1
    );

    setDeleteTarget(
      comm
    );
  }


  async function confirmDelete() {
    if (
      !deleteTarget
    ) {
      return;
    }

    if (
      deleteStep ===
      1
    ) {
      setDeleteStep(
        2
      );

      return;
    }

    try {
      setDeleting(
        true
      );

      setError(
        ""
      );

      await deleteDraftCommunication(
        deleteTarget.id
      );

      setCommunications(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              item.id !==
              deleteTarget.id
          )
      );

      setDeleteTarget(
        null
      );

      setDeleteStep(
        1
      );
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
      setDeleting(
        false
      );
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />


      <main className="mx-auto max-w-7xl px-6 py-9 sm:px-8 sm:py-10">

        {/* Primary action */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                {isReviewer ? (
                  <ClipboardCheck
                    className="h-5 w-5 text-[#07877B]"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus
                    className="h-5 w-5 text-[#07877B]"
                    aria-hidden="true"
                  />
                )}

                <p className="text-sm font-medium text-[#07877B]">
                  {isReviewer
                    ? "Review Workspace"
                    : "Communication Studio"}
                </p>
              </div>

              <h1 className="text-3xl text-gray-900">
                {isReviewer
                  ? "Review communications"
                  : "Create a new communication"}
              </h1>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                {isReviewer
                  ? "Review communications waiting for your action and move them through the governed approval workflow."
                  : "Create structured, Geojit-aligned communications with AI-assisted guidance across the available creation paths and channels."}
              </p>
            </div>


            {isReviewer ? (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/reviews"
                  )
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a]"
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
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Start Creating
              </button>
            ) : null}
          </div>
        </section>


        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}


        {/* Metrics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={
              FileText
            }
            label={
              isReviewer
                ? "Current Review Stage"
                : "Drafts"
            }
            value={
              loading
                ? "—"
                : isReviewer
                  ? profile?.role ===
                      "corpcom_reviewer"
                    ? "CorpCom"
                    : "Marketing"
                  : String(
                      totalDrafts
                    )
            }
            onClick={
              isReviewer
                ? undefined
                : () =>
                    jumpToHistory(
                      "draft"
                    )
            }
          />

          <MetricCard
            icon={
              Clock
            }
            label={
              isReviewer
                ? "Pending Reviews"
                : "Pending Approval"
            }
            value={
              loading
                ? "—"
                : String(
                    pendingApproval
                  )
            }
            onClick={() => {
              if (
                canReview
              ) {
                navigate(
                  "/reviews"
                );

                return;
              }

              jumpToHistory(
                "pending"
              );
            }}
          />

          <MetricCard
            icon={
              CheckCircle
            }
            label={
              isReviewer
                ? "Revised & Resubmitted"
                : "Approved"
            }
            value={
              loading
                ? "—"
                : String(
                    isReviewer
                      ? revisedResubmissions
                      : approved
                  )
            }
            onClick={
              isReviewer
                ? () =>
                    navigate(
                      "/reviews"
                    )
                : () =>
                    jumpToHistory(
                      "approved"
                    )
            }
          />

          <MetricCard
            icon={
              SlidersHorizontal
            }
            label="Most Used Category"
            value={
              mostUsedCategory
                ? getCategoryLabelFromDatabase(
                    mostUsedCategory
                  )
                : loading
                  ? "—"
                  : "No data"
            }
            onClick={
              !isReviewer &&
              mostUsedCategory
                ? () =>
                    jumpToHistory(
                      "all",
                      mostUsedCategory
                    )
                : undefined
            }
          />
        </section>


        {profile?.role ===
          "admin" && (
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Platform Management
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Manage users and communication rules from the admin workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/settings/users"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserCog className="h-4 w-4" />
                  User Management
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/settings/rules"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Communication Rules
                </button>
              </div>
            </div>
          </section>
        )}


        {/* Creator/Admin history */}
        {!isReviewer && (
          <section
            ref={
              historyRef
            }
            className="scroll-mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-200 px-6 py-5 sm:px-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#07877B]">
                    Communication History
                  </p>

                  <h2 className="mt-1 text-xl text-gray-900">
                    Your communications
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Search, filter and reopen previous communications. Showing a maximum of 10 records per page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadDashboard()
                  }
                  disabled={
                    loading
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
            </div>


            {/* Search + Filters */}
            <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-5 sm:px-7">
              <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(140px,0.75fr))]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search communication name..."
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
                  />
                </div>


                <FilterSelect
                  label="Status"
                  value={
                    statusFilter
                  }
                  onChange={(
                    value
                  ) =>
                    setStatusFilter(
                      value as
                        StatusFilter
                    )
                  }
                  options={[
                    {
                      value:
                        "all",
                      label:
                        "All Statuses",
                    },
                    {
                      value:
                        "draft",
                      label:
                        "Draft",
                    },
                    {
                      value:
                        "in_progress",
                      label:
                        "In Progress",
                    },
                    {
                      value:
                        "pending",
                      label:
                        "Approval in Progress",
                    },
                    {
                      value:
                        "changes_requested",
                      label:
                        "Changes Requested",
                    },
                    {
                      value:
                        "rejected",
                      label:
                        "Rejected",
                    },
                    {
                      value:
                        "approved",
                      label:
                        "Approved",
                    },
                  ]}
                />


                <FilterSelect
                  label="Category"
                  value={
                    categoryFilter
                  }
                  onChange={
                    setCategoryFilter
                  }
                  options={[
                    {
                      value:
                        "all",
                      label:
                        "All Categories",
                    },
                    ...availableCategories.map(
                      (
                        category
                      ) => ({
                        value:
                          category,

                        label:
                          getCategoryLabelFromDatabase(
                            category
                          ),
                      })
                    ),
                  ]}
                />


                <FilterSelect
                  label="Creation Mode"
                  value={
                    modeFilter
                  }
                  onChange={(
                    value
                  ) =>
                    setModeFilter(
                      value as
                        ModeFilter
                    )
                  }
                  options={[
                    {
                      value:
                        "all",
                      label:
                        "All Modes",
                    },
                    {
                      value:
                        "guided",
                      label:
                        "Guided",
                    },
                    {
                      value:
                        "expert",
                      label:
                        "Expert",
                    },
                    {
                      value:
                        "not_selected",
                      label:
                        "Not Selected",
                    },
                  ]}
                />


                <FilterSelect
                  label="Updated"
                  value={
                    dateFilter
                  }
                  onChange={(
                    value
                  ) =>
                    setDateFilter(
                      value as
                        DateFilter
                    )
                  }
                  options={[
                    {
                      value:
                        "all",
                      label:
                        "Any Time",
                    },
                    {
                      value:
                        "7",
                      label:
                        "Last 7 Days",
                    },
                    {
                      value:
                        "30",
                      label:
                        "Last 30 Days",
                    },
                    {
                      value:
                        "90",
                      label:
                        "Last 90 Days",
                    },
                  ]}
                />
              </div>


              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Filter className="h-3.5 w-3.5" />

                  {activeFilterCount >
                  0
                    ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`
                    : "No filters applied"}
                </div>

                {activeFilterCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="text-xs font-medium text-[#07877B] hover:text-[#06766a]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>


            {/* History table */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[minmax(260px,1.8fr)_170px_120px_150px_150px_110px] gap-4 border-b border-gray-100 bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-400 sm:px-7">
                  <span>
                    Communication Name
                  </span>

                  <span>
                    Category
                  </span>

                  <span>
                    Mode
                  </span>

                  <span>
                    Status
                  </span>

                  <span>
                    Last Updated
                  </span>

                  <span className="text-right">
                    Actions
                  </span>
                </div>


                {loading ? (
                  <div className="flex items-center justify-center gap-3 px-6 py-14 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
                    Loading communications...
                  </div>
                ) : paginatedCommunications.length ===
                  0 ? (
                  <div className="px-6 py-14 text-center">
                    <FileText className="mx-auto h-8 w-8 text-gray-300" />

                    <p className="mt-3 text-sm font-medium text-gray-800">
                      No communications found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Try changing the search or filter options.
                    </p>

                    {activeFilterCount >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                        className="mt-4 text-sm font-medium text-[#07877B]"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedCommunications.map(
                      (
                        comm
                      ) => {
                        const revision =
                          getRevisionState(
                            comm
                          );

                        return (
                          <div
                            key={
                              comm.id
                            }
                            className="grid grid-cols-[minmax(260px,1.8fr)_170px_120px_150px_150px_110px] items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/70 sm:px-7"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openCommunication(
                                  navigate,
                                  comm
                                )
                              }
                              className="min-w-0 text-left"
                            >
                              <p className="truncate text-sm font-medium text-gray-900">
                                {getCommunicationDisplayName(
                                  comm
                                )}
                              </p>

                              {revision.message && (
                                <p className="mt-1 line-clamp-1 text-xs text-amber-700">
                                  {
                                    revision.message
                                  }
                                </p>
                              )}
                            </button>


                            <div>
                              {comm.category ? (
                                <CategoryTag
                                  category={
                                    mapDatabaseCategory(
                                      comm.category
                                    )
                                  }
                                  size="sm"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Not selected
                                </span>
                              )}
                            </div>


                            <ModePill
                              mode={
                                getCreationMode(
                                  comm
                                )
                              }
                            />


                            <div className="flex flex-col items-start gap-1.5">
                              <StatusBadge
                                status={
                                  mapDatabaseStatus(
                                    comm.status
                                  )
                                }
                                size="sm"
                              />

                              {revision.label && (
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${revision.className}`}>
                                  {
                                    revision.label
                                  }
                                </span>
                              )}
                            </div>


                            <span className="text-xs text-gray-500">
                              {formatDate(
                                comm.updated_at
                              )}
                            </span>


                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openCommunication(
                                    navigate,
                                    comm
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-[#9bcfc9] hover:bg-[#f3fbfa] hover:text-[#075f58]"
                              >
                                {getPrimaryActionLabel(
                                  comm
                                )}
                              </button>

                              {comm.status ===
                                "draft" && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    aria-label="Communication options"
                                    aria-haspopup="menu"
                                    aria-expanded={
                                      menuOpenId ===
                                      comm.id
                                    }
                                    onClick={() =>
                                      setMenuOpenId(
                                        (
                                          current
                                        ) =>
                                          current ===
                                          comm.id
                                            ? null
                                            : comm.id
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {menuOpenId ===
                                    comm.id && (
                                    <>
                                      <button
                                        type="button"
                                        aria-label="Close menu"
                                        onClick={() =>
                                          setMenuOpenId(
                                            null
                                          )
                                        }
                                        className="fixed inset-0 z-10 cursor-default"
                                      />

                                      <div
                                        role="menu"
                                        className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
                                      >
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() =>
                                            requestDelete(
                                              comm
                                            )
                                          }
                                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete Draft
                                        </button>
                                      </div>
                                    </>
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
              </div>
            </div>


            {/* Pagination */}
            {!loading &&
              filteredCommunications.length >
                0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  {(currentPage -
                    1) *
                    PAGE_SIZE +
                    1}
                  {"–"}
                  {Math.min(
                    currentPage *
                      PAGE_SIZE,
                    filteredCommunications.length
                  )}{" "}
                  of{" "}
                  {filteredCommunications.length}
                  {" "}
                  communications
                </p>


                <nav
                  aria-label="Communication history pagination"
                  className="flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>


                  <div className="mx-1 flex items-center gap-1">
                    {getVisiblePages(
                      currentPage,
                      totalPages
                    ).map(
                      (
                        page,
                        index
                      ) =>
                        page ===
                        "ellipsis" ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-9 w-8 items-center justify-center text-xs text-gray-400"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={
                              page
                            }
                            type="button"
                            aria-current={
                              currentPage ===
                              page
                                ? "page"
                                : undefined
                            }
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                              currentPage ===
                              page
                                ? "bg-[#07877B] text-white"
                                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                    )}
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          current
                        ) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </nav>
              </div>
            )}
          </section>
        )}


        {/* Reviewer quick queue */}
        {isReviewer && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm font-medium text-[#07877B]">
                  Review Queue
                </p>

                <h2 className="mt-1 text-xl text-gray-900">
                  Communications waiting for you
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/reviews"
                  )
                }
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#07877B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#06766a]"
              >
                Open Review Queue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-8 text-center sm:px-7">
              <p className="text-3xl font-medium text-gray-900">
                {loading
                  ? "—"
                  : reviewQueue.length}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {reviewQueue.length ===
                1
                  ? "communication requires your review"
                  : "communications require your review"}
              </p>
            </div>
          </section>
        )}
      </main>


      {isNameModalOpen && (
        <CommunicationNameModal
          creating={
            creating
          }
          error={
            createError
          }
          onCancel={() => {
            if (
              creating
            ) {
              return;
            }

            setCreateError(
              ""
            );

            setIsNameModalOpen(
              false
            );
          }}
          onCreate={
            handleCreateCommunication
          }
        />
      )}


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

            setDeleteStep(
              1
            );
          }}
          onConfirm={() =>
            void confirmDelete()
          }
        />
      )}
    </div>
  );
}


function CommunicationNameModal({
  creating,
  error,
  onCancel,
  onCreate,
}: {
  creating:
    boolean;

  error:
    string;

  onCancel:
    () => void;

  onCreate:
    (
      name:
        string
    ) =>
      Promise<void>;
}) {
  const [
    name,
    setName,
  ] =
    useState(
      ""
    );

  const [
    validationError,
    setValidationError,
  ] =
    useState(
      ""
    );

  const normalizedName =
    name
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  const canCreate =
    normalizedName.length >=
      3 &&
    normalizedName.length <=
      100 &&
    !creating;


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      normalizedName.length <
      3
    ) {
      setValidationError(
        "Communication Name must contain at least 3 characters."
      );

      return;
    }

    if (
      normalizedName.length >
      100
    ) {
      setValidationError(
        "Communication Name cannot exceed 100 characters."
      );

      return;
    }

    setValidationError(
      ""
    );

    await onCreate(
      normalizedName
    );
  }


  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="communication-name-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[#07877B]">
              New Communication
            </p>

            <h2
              id="communication-name-title"
              className="mt-1 text-xl text-gray-900"
            >
              Name this communication
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close new communication dialog"
            onClick={
              onCancel
            }
            disabled={
              creating
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="px-6 py-6"
        >
          <label
            htmlFor="communication-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Communication Name
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="communication-name"
            autoFocus
            value={
              name
            }
            onChange={(
              event
            ) => {
              setName(
                event.target.value
              );

              if (
                validationError
              ) {
                setValidationError(
                  ""
                );
              }
            }}
            maxLength={
              100
            }
            placeholder="e.g., SIP Awareness – September 2026"
            disabled={
              creating
            }
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:bg-gray-50"
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <p
              id="communication-name-help"
              className="text-xs leading-5 text-gray-500"
            >
              Use a simple working name so you can identify this communication later.
            </p>

            <span className={`shrink-0 text-xs ${
              normalizedName.length >
              100
                ? "text-red-600"
                : "text-gray-400"
            }`}>
              {normalizedName.length}/100
            </span>
          </div>


          {validationError && (
            <div
              id="communication-name-validation"
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
            >
              {validationError}
            </div>
          )}

          {!validationError &&
            error && (
              <div
                id="communication-name-create-error"
                role="alert"
                aria-live="polite"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
              >
                {error}
              </div>
            )}


          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                onCancel
              }
              disabled={
                creating
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                !canCreate
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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

  step:
    1 | 2;

  deleting:
    boolean;

  onCancel:
    () => void;

  onConfirm:
    () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-5 py-8 backdrop-blur-[1px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-draft-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-red-600">
              Delete Draft
            </p>

            <h2
              id="delete-draft-title"
              className="mt-1 text-xl text-gray-900"
            >
              {step ===
              1
                ? "Delete this draft?"
                : "Confirm permanent deletion"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close delete draft dialog"
            onClick={
              onCancel
            }
            disabled={
              deleting
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <div className="px-6 py-6">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-gray-400">
              Communication
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {getCommunicationDisplayName(
                communication
              )}
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600">
            {step ===
            1
              ? "Only draft communications can be deleted. This removes the draft and its unfinished work."
              : "This action cannot be undone. Confirm once more to permanently delete this draft."}
          </p>


          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                onCancel
              }
              disabled={
                deleting
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step ===
                1 ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {deleting
                ? "Deleting..."
                : step ===
                    1
                  ? "Continue"
                  : "Delete Permanently"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function MetricCard({
  icon:
    Icon,
  label,
  value,
  onClick,
}: {
  icon:
    typeof FileText;

  label:
    string;

  value:
    string;

  onClick?:
    () => void;
}) {
  const clickable =
    Boolean(
      onClick
    );

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        !clickable
      }
      className={`rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all ${
        clickable
          ? "hover:border-[#9bcfc9] hover:bg-[#fbfefd]"
          : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f5f4] text-gray-600">
          <Icon className="h-4 w-4" />
        </div>

        {clickable && (
          <ArrowRight className="h-4 w-4 text-gray-300" />
        )}
      </div>

      <p className="mt-5 break-words text-xl font-medium text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {label}
      </p>
    </button>
  );
}


function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  options:
    Array<{
      value:
        string;

      label:
        string;
    }>;
}) {
  return (
    <label className="relative">
      <span className="sr-only">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}


function ModePill({
  mode,
}: {
  mode:
    "guided"
    | "expert"
    | "not_selected";
}) {
  switch (
    mode
  ) {
    case "guided":
      return (
        <span className="inline-flex w-fit rounded-full bg-[#e8f5f4] px-2.5 py-1 text-[11px] font-medium text-[#075f58]">
          Guided
        </span>
      );

    case "expert":
      return (
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
          Expert
        </span>
      );

    default:
      return (
        <span className="inline-flex w-fit rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
          Not selected
        </span>
      );
  }
}


function getVisiblePages(
  currentPage:
    number,
  totalPages:
    number
):
  Array<
    number |
    "ellipsis"
  > {
  if (
    totalPages <=
    5
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index
      ) =>
        index +
        1
    );
  }

  if (
    currentPage <=
    3
  ) {
    return [
      1,
      2,
      3,
      4,
      "ellipsis",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages -
      2
  ) {
    return [
      1,
      "ellipsis",
      totalPages -
        3,
      totalPages -
        2,
      totalPages -
        1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage -
      1,
    currentPage,
    currentPage +
      1,
    "ellipsis",
    totalPages,
  ];
}


function matchesStatusFilter(
  status:
    string,
  filter:
    StatusFilter
) {
  switch (
    filter
  ) {
    case "all":
      return true;

    case "draft":
      return status ===
        "draft";

    case "in_progress":
      return [
        "input_ready",
        "generating",
        "variants_ready",
        "variant_selected",
        "preview_ready",
      ].includes(
        status
      );

    case "pending":
      return PENDING_STATUSES.includes(
        status
      );

    case "changes_requested":
      return status ===
        "changes_requested";

    case "rejected":
      return status ===
        "rejected";

    case "approved":
      return status ===
        "approved";
  }
}


function getCreationMode(
  comm:
    CommunicationRecord
):
  "guided"
  | "expert"
  | "not_selected" {
  const inputData =
    comm.input_data;

  if (
    inputData &&
    typeof inputData ===
      "object" &&
    !Array.isArray(
      inputData
    )
  ) {
    const input =
      inputData as
        Record<
          string,
          any
        >;

    if (
      input.creationMode ===
        "guided" ||
      input.creation_mode ===
        "guided" ||
      (
        input.guided &&
        typeof input.guided ===
          "object"
      ) ||
      (
        input.communicationMaster &&
        typeof input.communicationMaster ===
          "object"
      )
    ) {
      return "guided";
    }

    if (
      input.creationMode ===
        "expert" ||
      input.creation_mode ===
        "expert"
    ) {
      return "expert";
    }
  }

  if (
    comm.category
  ) {
    return "expert";
  }

  return "not_selected";
}


function getCommunicationDisplayName(
  comm:
    CommunicationRecord
) {
  const title =
    comm.title
      ?.replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    title &&
    title.toLowerCase() !==
      "new communication"
  ) {
    return title;
  }

  return "Untitled Communication";
}


function getPrimaryActionLabel(
  comm:
    CommunicationRecord
) {
  if (
    [
      "pending_approval",
      "submitted",
      "marketing_review",
      "marketing_approved",
      "corpcom_review",
      "changes_requested",
      "rejected",
      "approved",
    ].includes(
      comm.status
    )
  ) {
    return "View Status";
  }

  if (
    comm.status ===
      "draft"
  ) {
    return "Resume";
  }

  if (
    comm.status ===
      "preview_ready" ||
    comm.status ===
      "variant_selected"
  ) {
    return "Open";
  }

  return "Continue";
}


function formatDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
}


function getCategoryLabelFromDatabase(
  value:
    string
) {
  switch (
    value
  ) {
    case "research":
    case "Research & Advisory":
    case "Fundamental Research":
      return "Fundamental Research";

    case "education":
    case "Investor Education":
      return "Investor Education";

    case "product":
    case "Product & Sales":
      return "Product & Sales";

    case "service":
    case "Service & Transactional":
      return "Service & Transactional";

    case "regulatory":
    case "Regulatory & Compliance":
      return "Regulatory & Compliance";

    case "onboarding":
    case "Onboarding & Journey":
      return "Onboarding & Journey";

    default:
      return value;
  }
}


function mapDatabaseCategory(
  value:
    string
):
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding" {
  switch (
    value
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
  status:
    string
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
   * Once a communication enters formal approval,
   * Guided and Expert both use Approval Status.
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
   * A newly named communication has no category yet.
   * Resume at Creation Mode rather than treating it as
   * an Expert communication.
   */
  const category =
    comm.category
      ? mapDatabaseCategory(
          comm.category
        )
      : null;

  if (
    !category
  ) {
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
):
  GuidedResumeState | null {
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
      Record<
        string,
        any
      >;

  const guided =
    input.guided &&
    typeof input.guided ===
      "object" &&
    !Array.isArray(
      input.guided
    )
      ? input.guided as
          Record<
            string,
            any
          >
      : null;

  const explicitlyGuided =
    input.creationMode ===
      "guided" ||
    input.creation_mode ===
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

  return "idea";
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
          : "A reviewer requested changes before this communication can be resubmitted.",

      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }


  if (
    item.revision_required &&
    item.revision_completed_at &&
    !item.revision_resubmitted_at
  ) {
    return {
      label:
        "Changes saved",

      message:
        "Requested changes have been saved. This communication is ready to resubmit.",

      className:
        "border-[#bfe4df] bg-[#f3fbfa] text-[#075f58]",
    };
  }


  return {
    label:
      "",

    message:
      "",

    className:
      "",
  };
}
