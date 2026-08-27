import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  FilePenLine,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { StatusBadge } from "../components/StatusBadge";
import { getCommunicationById } from "../services/communications";
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

export function ApprovalStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const communicationId = searchParams.get("communicationId");

  const [communication, setCommunication] = useState<any>(null);
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!communicationId) {
      setError("Communication ID is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [comm, items] = await Promise.all([
          getCommunicationById(communicationId!),
          getApprovalHistory(communicationId!),
        ]);

        if (cancelled) return;

        setCommunication(comm);
        setHistory(items);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load approval status."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [communicationId]);

  const category = useMemo(
    () => mapDatabaseCategory(communication?.category),
    [communication]
  );

  const guidedApprovalPackage = useMemo(
    () => getGuidedApprovalPackage(communication),
    [communication]
  );

  const hasCommunicationPreview =
    Boolean(communication?.selected_variant_id) ||
    Boolean(guidedApprovalPackage);

  function openSelectedPreview() {
    if (!communication?.id) return;

    if (guidedApprovalPackage) {
      navigate(
        `/create/guided/approval-package?communicationId=${encodeURIComponent(
          communication.id
        )}&mode=review`
      );
      return;
    }

    if (!communication.selected_variant_id) return;

    navigate(
      `/create/preview?communicationId=${encodeURIComponent(
        communication.id
      )}&variantId=${encodeURIComponent(
        communication.selected_variant_id
      )}&category=${encodeURIComponent(category)}`
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />
        <main className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />
            <p className="text-sm text-gray-600">Loading approval status...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-5xl px-8 py-12">
        <button
          type="button"
          onClick={() => navigate("/")}
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
                {communication?.title || "Communication"}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <CategoryTag category={category} size="sm" />
                <StatusBadge
                  status={communication?.status || "draft"}
                  size="sm"
                />

                {guidedApprovalPackage && (
                  <span className="rounded-full border border-[#bfe4df] bg-[#f3fbfa] px-3 py-1 text-xs font-medium text-[#06766a]">
                    Guided · {guidedApprovalPackage.channels.length} channel
                    {guidedApprovalPackage.channels.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>

            {hasCommunicationPreview && (
              <button
                type="button"
                onClick={openSelectedPreview}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:border-[#07877B] hover:text-[#07877B]"
              >
                {guidedApprovalPackage
                  ? "Open Communication Package"
                  : "Open Communication"}
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
          <h2 className="mb-5 text-lg text-gray-900">Current Stage</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <StageCard
              label="Marketing Review"
              state={getStageState(
                "marketing_review",
                communication?.status,
                history
              )}
            />

            <StageCard
              label="CorpCom Review"
              state={getStageState(
                "corpcom_review",
                communication?.status,
                history
              )}
            />

            <StageCard
              label="Final Approval"
              state={
                communication?.status === "approved"
                  ? "complete"
                  : communication?.status === "rejected"
                    ? "failed"
                    : "pending"
              }
            />
          </div>

          <p className="mt-5 text-sm text-gray-600">
            {resolveCurrentStage(communication?.status)}
          </p>

          {communication?.status === "changes_requested" &&
            hasCommunicationPreview && (
              <button
                type="button"
                onClick={openSelectedPreview}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-5 py-3 text-sm text-white hover:bg-[#06766a]"
              >
                <FilePenLine className="h-4 w-4" />
                Review Requested Changes
              </button>
            )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="mb-1 text-lg text-gray-900">Approval History</h2>
          <p className="mb-6 text-sm text-gray-500">
            Decisions and workflow movements for this communication.
          </p>

          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No approval activity yet.
            </p>
          ) : (
            <div>
              {history.map((item, index) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  last={index === history.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getGuidedApprovalPackage(
  communication: any
): {
  channels: string[];
} | null {
  const inputData = communication?.input_data;

  if (
    !inputData ||
    typeof inputData !== "object" ||
    Array.isArray(inputData)
  ) {
    return null;
  }

  const guided = inputData.guided;

  if (
    !guided ||
    typeof guided !== "object" ||
    Array.isArray(guided)
  ) {
    return null;
  }

  const approvalPackage = guided.approvalPackage;

  if (
    !approvalPackage ||
    typeof approvalPackage !== "object" ||
    Array.isArray(approvalPackage) ||
    approvalPackage.sourceMode !== "guided"
  ) {
    return null;
  }

  const channels = Array.isArray(approvalPackage.channels)
    ? approvalPackage.channels.filter(
        (item: unknown): item is string =>
          typeof item === "string"
      )
    : [];

  return { channels };
}

function StageCard({
  label,
  state,
}: {
  label: string;
  state: "complete" | "active" | "pending" | "failed";
}) {
  const config = {
    complete: {
      icon: CheckCircle2,
      wrapper: "border-green-200 bg-green-50",
      iconClass: "text-green-600",
      text: "Completed",
    },
    active: {
      icon: Clock3,
      wrapper: "border-amber-200 bg-amber-50",
      iconClass: "text-amber-600",
      text: "In progress",
    },
    pending: {
      icon: Circle,
      wrapper: "border-gray-200 bg-gray-50",
      iconClass: "text-gray-400",
      text: "Pending",
    },
    failed: {
      icon: XCircle,
      wrapper: "border-red-200 bg-red-50",
      iconClass: "text-red-600",
      text: "Stopped",
    },
  } as const;

  const selected = config[state];
  const Icon = selected.icon;

  return (
    <div className={`rounded-xl border p-5 ${selected.wrapper}`}>
      <Icon className={`mb-3 h-5 w-5 ${selected.iconClass}`} />
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="mt-1 text-xs text-gray-500">{selected.text}</p>
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
  const comment = item.comments || item.comment;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5f4]">
          {item.action === "approved" ? (
            <CheckCircle2 className="h-4 w-4 text-[#07877B]" />
          ) : item.action === "changes_requested" ? (
            <RotateCcw className="h-4 w-4 text-amber-600" />
          ) : item.action === "rejected" ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <Clock3 className="h-4 w-4 text-[#07877B]" />
          )}
        </div>

        {!last && <div className="h-full min-h-12 w-px bg-gray-200" />}
      </div>

      <div className={last ? "flex-1" : "flex-1 pb-7"}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-900">
            {formatAction(item)}
          </p>

          <p className="text-xs text-gray-400">
            {formatDateTime(item.updated_at || item.created_at)}
          </p>
        </div>

        <p className="mt-1 text-xs text-gray-500">
          {formatStage(item.stage)}
        </p>

        {comment && (
          <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
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
): "complete" | "active" | "pending" | "failed" {
  const stopped = history.some(
    (item) =>
      item.stage === stage &&
      ["rejected", "changes_requested"].includes(item.action || "")
  );

  if (stopped) return "failed";

  const approved = history.some(
    (item) => item.stage === stage && item.action === "approved"
  );

  if (approved) return "complete";

  if (stage === "marketing_review" && status === "pending_approval") {
    return "active";
  }

  if (stage === "corpcom_review" && status === "corpcom_review") {
    return "active";
  }

  return "pending";
}

function resolveCurrentStage(status?: string) {
  switch (status) {
    case "pending_approval":
      return "Waiting for Marketing review.";
    case "corpcom_review":
      return "Marketing review is complete. Waiting for CorpCom review.";
    case "approved":
      return "This communication has received final approval.";
    case "changes_requested":
      return "A reviewer has requested changes. Review the comments before editing.";
    case "rejected":
      return "This communication was rejected during review.";
    default:
      return "Approval status is being prepared.";
  }
}

function formatAction(item: ApprovalHistoryItem) {
  if (item.stage === "marketing_review" && item.action === "approved") {
    return "Marketing approved";
  }

  if (item.stage === "corpcom_review" && item.action === "approved") {
    return "CorpCom approved";
  }

  if (item.action === "changes_requested") return "Changes requested";
  if (item.action === "rejected") return "Communication rejected";

  if (item.action === "submitted") {
    return item.stage === "corpcom_review"
      ? "Sent to CorpCom"
      : "Submitted for Marketing review";
  }

  return item.action || "Approval activity";
}

function formatStage(stage?: string | null) {
  switch (stage) {
    case "marketing_review":
      return "Marketing Review";
    case "corpcom_review":
      return "CorpCom Review";
    default:
      return stage || "Workflow";
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapDatabaseCategory(category?: string | null): Category {
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
