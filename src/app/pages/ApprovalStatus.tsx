import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  FilePenLine,
  History,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
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
  CategoryTag,
} from "../components/CategoryTag";

import {
  StatusBadge,
} from "../components/StatusBadge";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getCommunicationById,
} from "../services/communications";

import {
  ApprovalHistoryItem,
  getApprovalHistory,
} from "../services/approvalHistory";


type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";


type StageState =
  | "complete"
  | "active"
  | "pending"
  | "failed";


export function ApprovalStatus() {
  const navigate =
    useNavigate();

  const {
    profile,
  } = useAuth();

  const [searchParams] =
    useSearchParams();

  const isReviewer =
    profile?.role ===
      "marketing_reviewer" ||
    profile?.role ===
      "corpcom_reviewer";

  const isCreator =
    profile?.role ===
    "creator";

  const backDestination =
    isReviewer
      ? "/reviews"
      : "/";

  const backLabel =
    isReviewer
      ? "Back to Review Queue"
      : "Back to Dashboard";

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    communication,
    setCommunication,
  ] = useState<any>(null);

  const [
    history,
    setHistory,
  ] = useState<
    ApprovalHistoryItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!communicationId) {
      setError(
        "Communication ID is missing."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          comm,
          items,
        ] = await Promise.all([
          getCommunicationById(
            communicationId!,
            {
              forceRefresh:
                true,
            }
          ),
          getApprovalHistory(
            communicationId!
          ),
        ]);

        if (cancelled) {
          return;
        }

        setCommunication(
          comm
        );

        setHistory(
          items
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load approval status."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [communicationId]);


  const category =
    useMemo(
      () =>
        mapDatabaseCategory(
          communication?.category
        ),
      [communication]
    );

  const isGuided =
    useMemo(
      () =>
        isGuidedCommunication(
          communication
        ),
      [communication]
    );

  const statusCopy =
    getStatusCopy(
      communication?.status
    );

  const StatusIcon =
    statusCopy.icon;

  const marketingState =
    getStageState(
      "marketing_review",
      communication?.status,
      history
    );

  const corpcomState =
    getStageState(
      "corpcom_review",
      communication?.status,
      history
    );

  const finalState:
    StageState =
      communication?.status ===
      "approved"
        ? "complete"
        : communication?.status ===
            "rejected"
          ? "failed"
          : "pending";


  function openCommunication() {
    if (
      !communication?.id
    ) {
      return;
    }

    const id =
      encodeURIComponent(
        communication.id
      );

    /**
     * GUIDED CREATION
     *
     * Guided communications are reviewed as one
     * multi-channel approval package rather than as a
     * single selected email variant.
     */
    if (isGuided) {
      navigate(
        `/create/guided/approval-package?communicationId=${id}${
          isReviewer
            ? "&mode=review"
            : ""
        }`
      );

      return;
    }

    /**
     * EXPERT CREATION
     *
     * Preserve the existing single-variant preview flow.
     */
    if (
      !communication?.selected_variant_id
    ) {
      return;
    }

    const expertMode =
      isReviewer
        ? "&mode=review"
        : isCreator &&
            communication.status ===
              "changes_requested"
          ? "&mode=revision"
          : "";

    navigate(
      `/create/preview?communicationId=${id}&variantId=${encodeURIComponent(
        communication.selected_variant_id
      )}&category=${encodeURIComponent(
        category
      )}${expertMode}`
    );
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            Loading approval status...
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
          onClick={() =>
            navigate(
              backDestination
            )
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
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


        {communication && (
          <>
            <header className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck
                  className="h-5 w-5 text-[#07877B]"
                  aria-hidden="true"
                />

                <p className="text-sm font-medium text-[#07877B]">
                  Approval Status
                </p>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
                    {communication.title ||
                      "Untitled Communication"}
                  </h1>

                  <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                    Track this communication through Marketing and CorpCom review, including approval decisions and requested changes.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <CategoryTag
                      category={
                        category
                      }
                      size="sm"
                    />

                    <StatusBadge
                      status={
                        communication.status ||
                        "draft"
                      }
                      size="sm"
                    />

                    {isGuided && (
                      <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                        Guided package
                      </span>
                    )}
                  </div>
                </div>

                {canOpenCommunication(
                  communication,
                  isGuided
                ) && (
                  <button
                    type="button"
                    onClick={
                      openCommunication
                    }
                    className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {isGuided
                      ? "View Approval Package"
                      : "View Communication"}
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            </header>


            <section
              className={`mb-8 rounded-2xl px-5 py-5 sm:px-6 ${
                statusCopy.wrapper
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <StatusIcon
                      className={`h-5 w-5 ${statusCopy.iconClass}`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {statusCopy.title}
                    </p>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                      {statusCopy.description}
                    </p>
                  </div>
                </div>

                {communication.status ===
                  "changes_requested" &&
                  canOpenCommunication(
                    communication,
                    isGuided
                  ) && (
                    <button
                      type="button"
                      onClick={
                        openCommunication
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#06766a]"
                    >
                      <FilePenLine className="h-4 w-4" />
                      {isCreator
                        ? "Open Revision"
                        : "View Requested Changes"}
                    </button>
                  )}
              </div>
            </section>


            <section className="mb-8 rounded-2xl border border-gray-200 bg-white px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900">
                  Approval progress
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  The communication moves through these checkpoints as one governed approval workflow.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <StageCard
                  step="01"
                  label="Marketing Review"
                  state={
                    marketingState
                  }
                />

                <StageCard
                  step="02"
                  label="CorpCom Review"
                  state={
                    corpcomState
                  }
                />

                <StageCard
                  step="03"
                  label="Approved"
                  state={
                    finalState
                  }
                />
              </div>
            </section>


            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f5f4]">
                  <History className="h-4 w-4 text-[#07877B]" />
                </div>

                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    Approval history
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    A chronological record of submissions, decisions and reviewer comments.
                  </p>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-7">
                {history.length ===
                0 ? (
                  <div className="rounded-xl bg-gray-50 px-5 py-8 text-center">
                    <Clock3 className="mx-auto h-5 w-5 text-gray-400" />

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      No approval activity yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Workflow activity will appear here after the communication enters review.
                    </p>
                  </div>
                ) : (
                  <div>
                    {history.map(
                      (
                        item,
                        index
                      ) => (
                        <HistoryRow
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                          last={
                            index ===
                            history.length -
                              1
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </section>


            <div className="mt-8 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    backDestination
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


function StageCard({
  step,
  label,
  state,
}: {
  step: string;
  label: string;
  state: StageState;
}) {
  const config = {
    complete: {
      icon: CheckCircle2,
      iconWrap:
        "bg-green-50",
      iconClass:
        "text-green-600",
      badge:
        "bg-green-50 text-green-700",
      text: "Completed",
    },

    active: {
      icon: Clock3,
      iconWrap:
        "bg-amber-50",
      iconClass:
        "text-amber-600",
      badge:
        "bg-amber-50 text-amber-700",
      text: "In progress",
    },

    pending: {
      icon: Circle,
      iconWrap:
        "bg-gray-100",
      iconClass:
        "text-gray-400",
      badge:
        "bg-gray-100 text-gray-500",
      text: "Pending",
    },

    failed: {
      icon: XCircle,
      iconWrap:
        "bg-red-50",
      iconClass:
        "text-red-600",
      badge:
        "bg-red-50 text-red-700",
      text: "Stopped",
    },
  } as const;

  const selected =
    config[state];

  const Icon =
    selected.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected.iconWrap}`}
        >
          <Icon
            className={`h-4 w-4 ${selected.iconClass}`}
          />
        </div>

        <span className="text-[11px] font-medium tracking-wide text-gray-400">
          {step}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-900">
        {label}
      </p>

      <span
        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${selected.badge}`}
      >
        {selected.text}
      </span>
    </div>
  );
}


function HistoryRow({
  item,
  last,
}: {
  item: ApprovalHistoryItem;
  last: boolean;
}) {
  const comment =
    item.comments ||
    item.comment;

  const activity =
    getHistoryVisual(
      item
    );

  const Icon =
    activity.icon;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${activity.wrapper}`}
        >
          <Icon
            className={`h-4 w-4 ${activity.iconClass}`}
          />
        </div>

        {!last && (
          <div className="min-h-14 w-px flex-1 bg-gray-200" />
        )}
      </div>

      <div
        className={
          last
            ? "min-w-0 flex-1"
            : "min-w-0 flex-1 pb-7"
        }
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {formatAction(
                item
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatStage(
                item.stage
              )}
            </p>
          </div>

          <p className="shrink-0 text-xs text-gray-400">
            {formatDateTime(
              item.updated_at ||
                item.created_at
            )}
          </p>
        </div>

        {comment && (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
            {comment}
          </div>
        )}
      </div>
    </div>
  );
}


function getStageState(
  stage: string,
  status: string,
  history: ApprovalHistoryItem[]
): StageState {
  const stopped =
    history.some(
      (item) =>
        item.stage ===
          stage &&
        [
          "rejected",
          "changes_requested",
        ].includes(
          item.action ||
            ""
        )
    );

  if (stopped) {
    return "failed";
  }

  const approved =
    history.some(
      (item) =>
        item.stage ===
          stage &&
        item.action ===
          "approved"
    );

  if (approved) {
    return "complete";
  }

  if (
    stage ===
      "marketing_review" &&
    [
      "marketing_approved",
      "corpcom_review",
      "approved",
    ].includes(status)
  ) {
    return "complete";
  }

  if (
    stage ===
      "corpcom_review" &&
    status ===
      "approved"
  ) {
    return "complete";
  }

  if (
    stage ===
      "marketing_review" &&
    [
      "pending_approval",
      "submitted",
      "marketing_review",
    ].includes(status)
  ) {
    return "active";
  }

  if (
    stage ===
      "corpcom_review" &&
    status ===
      "corpcom_review"
  ) {
    return "active";
  }

  return "pending";
}


function getStatusCopy(
  status?: string
) {
  switch (status) {
    case "pending_approval":
    case "submitted":
    case "marketing_review":
      return {
        icon: Clock3,
        wrapper:
          "bg-[#f3fbfa]",
        iconClass:
          "text-[#07877B]",
        title:
          "Waiting for Marketing review",
        description:
          "The communication has entered the approval workflow. Marketing is the first review checkpoint; no further submission is required from the Creator right now.",
      };

    case "marketing_approved":
    case "corpcom_review":
      return {
        icon: Clock3,
        wrapper:
          "bg-[#f3fbfa]",
        iconClass:
          "text-[#07877B]",
        title:
          "Waiting for CorpCom review",
        description:
          "Marketing review is complete. The communication is now at the final CorpCom review checkpoint.",
      };

    case "approved":
      return {
        icon: CheckCircle2,
        wrapper:
          "bg-green-50",
        iconClass:
          "text-green-600",
        title:
          "Approval completed",
        description:
          "Marketing and CorpCom approvals are complete. This communication has finished the governed approval workflow.",
      };

    case "changes_requested":
      return {
        icon: RotateCcw,
        wrapper:
          "bg-amber-50",
        iconClass:
          "text-amber-600",
        title:
          "Changes requested",
        description:
          "A reviewer has returned this communication for changes. Review the latest comment below before revising the communication.",
      };

    case "rejected":
      return {
        icon: XCircle,
        wrapper:
          "bg-red-50",
        iconClass:
          "text-red-600",
        title:
          "Communication rejected",
        description:
          "The approval workflow has stopped. Review the decision and reviewer comment in the approval history below.",
      };

    default:
      return {
        icon: ShieldCheck,
        wrapper:
          "bg-gray-50",
        iconClass:
          "text-gray-500",
        title:
          "Approval status is being prepared",
        description:
          "The latest approval stage will appear here once workflow activity is available.",
      };
  }
}


function getHistoryVisual(
  item: ApprovalHistoryItem
) {
  if (
    item.action ===
      "approved"
  ) {
    return {
      icon: CheckCircle2,
      wrapper:
        "bg-green-50",
      iconClass:
        "text-green-600",
    };
  }

  if (
    item.action ===
      "changes_requested"
  ) {
    return {
      icon: RotateCcw,
      wrapper:
        "bg-amber-50",
      iconClass:
        "text-amber-600",
    };
  }

  if (
    item.action ===
      "rejected"
  ) {
    return {
      icon: XCircle,
      wrapper:
        "bg-red-50",
      iconClass:
        "text-red-600",
    };
  }

  return {
    icon: Clock3,
    wrapper:
      "bg-[#e8f5f4]",
    iconClass:
      "text-[#07877B]",
  };
}


function formatAction(
  item: ApprovalHistoryItem
) {
  if (
    item.stage ===
      "marketing_review" &&
    item.action ===
      "approved"
  ) {
    return "Marketing approved";
  }

  if (
    item.stage ===
      "corpcom_review" &&
    item.action ===
      "approved"
  ) {
    return "CorpCom approved";
  }

  if (
    item.action ===
      "changes_requested"
  ) {
    return "Changes requested";
  }

  if (
    item.action ===
      "rejected"
  ) {
    return "Communication rejected";
  }

  if (
    item.action ===
      "submitted"
  ) {
    return item.stage ===
      "corpcom_review"
      ? "Sent to CorpCom"
      : "Submitted for Marketing review";
  }

  return formatFallbackLabel(
    item.action ||
      "Approval activity"
  );
}


function formatStage(
  stage?: string | null
) {
  switch (stage) {
    case "marketing_review":
      return "Marketing Review";

    case "corpcom_review":
      return "CorpCom Review";

    default:
      return stage
        ? formatFallbackLabel(
            stage
          )
        : "Workflow";
  }
}


function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
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


function canOpenCommunication(
  communication: any,
  isGuided: boolean
) {
  if (!communication?.id) {
    return false;
  }

  if (isGuided) {
    return true;
  }

  return Boolean(
    communication.selected_variant_id
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

  return (
    communication.creation_mode ===
      "guided" ||
    communication.creationMode ===
      "guided"
  );
}


function formatFallbackLabel(
  value: string
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function mapDatabaseCategory(
  category?: string | null
): Category {
  switch (category) {
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
