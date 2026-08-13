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
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  FilePenLine,
  RotateCcw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { StatusBadge } from "../components/StatusBadge";

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

  const [
    searchParams,
  ] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    communication,
    setCommunication,
  ] =
    useState<any>(
      null
    );

  const [
    history,
    setHistory,
  ] =
    useState<
      ApprovalHistoryItem[]
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

  useEffect(() => {
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

    let cancelled =
      false;

    async function load() {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const [
          comm,
          items,
        ] =
          await Promise.all([
            getCommunicationById(
              communicationId!
            ),

            getApprovalHistory(
              communicationId!
            ),
          ]);

        if (
          cancelled
        ) {
          return;
        }

        setCommunication(
          comm
        );

        setHistory(
          [
            ...items,
          ].sort(
            (
              a,
              b
            ) =>
              new Date(
                a.created_at
              ).getTime() -
              new Date(
                b.created_at
              ).getTime()
          )
        );
      } catch (err) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load approval status."
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    load();

    return () => {
      cancelled =
        true;
    };
  }, [
    communicationId,
  ]);

  const category =
    useMemo(
      () =>
        mapDatabaseCategory(
          communication
            ?.category
        ),
      [
        communication,
      ]
    );

  function openSelectedPreview() {
    if (
      !communication?.id ||
      !communication
        ?.selected_variant_id
    ) {
      return;
    }

    const mode =
      communication
        .status ===
      "changes_requested"
        ? "&mode=revision"
        : "";

    navigate(
      `/create/preview?communicationId=${encodeURIComponent(
        communication.id
      )}&variantId=${encodeURIComponent(
        communication.selected_variant_id
      )}&category=${encodeURIComponent(
        category
      )}${mode}`
    );
  }

  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />

            <p className="text-sm text-gray-600">
              Loading approval status...
            </p>
          </div>
        </main>
      </div>
    );
  }

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
      communication
        ?.status ===
      "approved"
        ? "complete"
        : communication
              ?.status ===
            "rejected"
          ? "failed"
          : "pending";

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-8 py-12">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/"
            )
          }
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#07877B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#07877B]">
                Approval Status
              </p>

              <h1 className="mb-3 text-2xl text-gray-900">
                {communication
                  ?.title ||
                  "Communication"}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <CategoryTag
                  category={
                    category
                  }
                  size="sm"
                />

                <StatusBadge
                  status={
                    communication
                      ?.status ||
                    "draft"
                  }
                  size="sm"
                />
              </div>
            </div>

            {communication
              ?.selected_variant_id && (
              <button
                type="button"
                onClick={
                  openSelectedPreview
                }
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Open Communication
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg text-gray-900">
              Current Stage
            </h2>

            {communication
              ?.status ===
              "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Workflow completed
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StageCard
              label="Marketing Review"
              state={
                marketingState
              }
            />

            <StageCard
              label="CorpCom Review"
              state={
                corpcomState
              }
            />

            <StageCard
              label="Final Approval"
              state={
                finalState
              }
            />
          </div>

          <p className="mt-5 text-sm text-gray-600">
            {resolveCurrentStage(
              communication
                ?.status
            )}
          </p>

          {communication
            ?.status ===
            "changes_requested" && (
            <button
              type="button"
              onClick={
                openSelectedPreview
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-5 py-3 text-sm text-white hover:bg-[#06766a]"
            >
              <FilePenLine className="h-4 w-4" />
              Revise Communication
            </button>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg text-gray-900">
                Communication Audit Trail
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Complete record of submissions, reviewer decisions, workflow movements and the people who performed them.
              </p>
            </div>

            {history.length >
              0 && (
              <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {
                  history.length
                }{" "}
                activity
                {history.length ===
                1
                  ? ""
                  : " items"}
              </span>
            )}
          </div>

          {history.length ===
          0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No approval activity yet.
            </p>
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
      </main>
    </div>
  );
}

function StageCard({
  label,
  state,
}: {
  label:
    string;

  state:
    StageState;
}) {
  const config = {
    complete: {
      icon:
        CheckCircle2,

      wrapper:
        "border-green-200 bg-green-50",

      iconClass:
        "text-green-600",

      text:
        "Completed",
    },

    active: {
      icon:
        Clock3,

      wrapper:
        "border-amber-200 bg-amber-50",

      iconClass:
        "text-amber-600",

      text:
        "In progress",
    },

    pending: {
      icon:
        Circle,

      wrapper:
        "border-gray-200 bg-gray-50",

      iconClass:
        "text-gray-400",

      text:
        "Pending",
    },

    failed: {
      icon:
        XCircle,

      wrapper:
        "border-red-200 bg-red-50",

      iconClass:
        "text-red-600",

      text:
        "Stopped",
    },
  } as const;

  const selected =
    config[
      state
    ];

  const Icon =
    selected.icon;

  return (
    <div
      className={`rounded-xl border p-5 ${selected.wrapper}`}
    >
      <Icon
        className={`mb-3 h-5 w-5 ${selected.iconClass}`}
      />

      <p className="text-sm font-medium text-gray-900">
        {label}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {
          selected.text
        }
      </p>
    </div>
  );
}

function HistoryRow({
  item,
  last,
}: {
  item:
    ApprovalHistoryItem;

  last:
    boolean;
}) {
  const comment =
    item.comments ||
    item.comment;

  const actorName =
    item.actor_name ||
    fallbackActorName(
      item
    );

  const actorRole =
    formatRole(
      item.actor_role ||
        item.reviewer_role
    );

  const actorMeta =
    [
      item.actor_designation,
      item.actor_department,
    ].filter(
      Boolean
    );

  const actionConfig =
    getActionConfig(
      item
    );

  const Icon =
    actionConfig.icon;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${actionConfig.iconBg}`}
        >
          <Icon
            className={`h-4 w-4 ${actionConfig.iconClass}`}
          />
        </div>

        {!last && (
          <div className="h-full min-h-16 w-px bg-gray-200" />
        )}
      </div>

      <div
        className={
          last
            ? "min-w-0 flex-1"
            : "min-w-0 flex-1 pb-8"
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {
                actionConfig.label
              }
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatStage(
                item.stage
              )}
            </p>
          </div>

          <p className="flex-shrink-0 text-xs text-gray-400">
            {formatDateTime(
              item.updated_at ||
                item.created_at
            )}
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
              <UserRound className="h-4 w-4 text-gray-500" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {
                    actorName
                  }
                </p>

                {actorRole && (
                  <span className="rounded-full border border-[#b3d9d5] bg-[#e8f5f4] px-2 py-0.5 text-[11px] font-medium text-[#07877B]">
                    {
                      actorRole
                    }
                  </span>
                )}
              </div>

              {actorMeta.length >
                0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {actorMeta.join(
                    " · "
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {comment && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Comment
            </p>

            <p className="text-sm leading-6 text-gray-700">
              {
                comment
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionConfig(
  item:
    ApprovalHistoryItem
) {
  if (
    item.action ===
    "approved"
  ) {
    return {
      icon:
        CheckCircle2,

      iconBg:
        "bg-[#e8f5f4]",

      iconClass:
        "text-[#07877B]",

      label:
        formatAction(
          item
        ),
    };
  }

  if (
    item.action ===
    "changes_requested"
  ) {
    return {
      icon:
        RotateCcw,

      iconBg:
        "bg-amber-50",

      iconClass:
        "text-amber-600",

      label:
        formatAction(
          item
        ),
    };
  }

  if (
    item.action ===
    "rejected"
  ) {
    return {
      icon:
        XCircle,

      iconBg:
        "bg-red-50",

      iconClass:
        "text-red-600",

      label:
        formatAction(
          item
        ),
    };
  }

  return {
    icon:
      Clock3,

    iconBg:
      "bg-blue-50",

    iconClass:
      "text-blue-600",

    label:
      formatAction(
        item
      ),
  };
}

function getStageState(
  stage:
    string,

  status:
    string,

  history:
    ApprovalHistoryItem[]
): StageState {
  const stageHistory =
    history
      .filter(
        (item) =>
          item.stage ===
          stage
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            a.updated_at ||
              a.created_at
          ).getTime() -
          new Date(
            b.updated_at ||
              b.created_at
          ).getTime()
      );

  const latest =
    stageHistory[
      stageHistory.length -
        1
    ];

  if (
    status ===
    "approved"
  ) {
    if (
      stage ===
        "marketing_review" ||
      stage ===
        "corpcom_review"
    ) {
      return "complete";
    }
  }

  if (
    !latest
  ) {
    if (
      stage ===
        "marketing_review" &&
      status ===
        "pending_approval"
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

  if (
    latest.action ===
    "approved"
  ) {
    return "complete";
  }

  if (
    latest.action ===
      "submitted" ||
    latest.action ===
      "resubmitted"
  ) {
    return "active";
  }

  if (
    latest.action ===
      "changes_requested" ||
    latest.action ===
      "rejected"
  ) {
    return "failed";
  }

  return "pending";
}

function resolveCurrentStage(
  status?:
    string
) {
  switch (
    status
  ) {
    case "pending_approval":
      return "Waiting for Marketing review.";

    case "corpcom_review":
      return "Marketing review is complete. Waiting for final CorpCom review.";

    case "approved":
      return "Marketing and CorpCom reviews are complete. This communication has received final approval.";

    case "changes_requested":
      return "A reviewer has requested changes. Review the feedback, revise the communication and resubmit.";

    case "rejected":
      return "This communication was rejected during review.";

    default:
      return "Approval status is being prepared.";
  }
}

function formatAction(
  item:
    ApprovalHistoryItem
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
    return "CorpCom final approval";
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
    "resubmitted"
  ) {
    return "Creator revised & resubmitted";
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

  return (
    humanize(
      item.action
    ) ||
    "Approval activity"
  );
}

function fallbackActorName(
  item:
    ApprovalHistoryItem
) {
  const role =
    item.actor_role ||
    item.reviewer_role;

  switch (
    role
  ) {
    case "creator":
      return "Communication Creator";

    case "marketing_reviewer":
      return "Marketing Reviewer";

    case "corpcom_reviewer":
      return "CorpCom Reviewer";

    case "admin":
      return "Administrator";

    default:
      if (
        item.stage ===
          "marketing_review" &&
        (
          item.action ===
            "submitted" ||
          item.action ===
            "resubmitted"
        )
      ) {
        return "Communication Creator";
      }

      return "Workflow User";
  }
}

function formatRole(
  role?:
    string | null
) {
  switch (
    role
  ) {
    case "creator":
      return "Creator";

    case "marketing_reviewer":
      return "Marketing Reviewer";

    case "corpcom_reviewer":
      return "CorpCom Reviewer";

    case "admin":
      return "Admin";

    default:
      return role
        ? humanize(
            role
          )
        : "";
  }
}

function formatStage(
  stage?:
    string | null
) {
  switch (
    stage
  ) {
    case "marketing_review":
      return "Marketing Review";

    case "corpcom_review":
      return "CorpCom Review";

    case "approved":
      return "Final Approval";

    default:
      return (
        stage
          ? humanize(
              stage
            )
          : "Workflow"
      );
  }
}

function formatDateTime(
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
        character
      ) =>
        character.toUpperCase()
    );
}

function mapDatabaseCategory(
  category?:
    string | null
): Category {
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
