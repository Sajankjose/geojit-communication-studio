import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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

  const [decisionError, setDecisionError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [
    showAllFacts,
    setShowAllFacts,
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

    if (
      (decision === "changes_requested" ||
        decision === "rejected") &&
      !comments.trim()
    ) {
      setDecisionError(
        decision === "changes_requested"
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
                    setDecisionError("");
                    setShowAllFacts(false);
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
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-gray-500">
                          Submitted{" "}
                          {formatDate(
                            item.created_at
                          )}
                        </p>

                        {item.is_resubmission && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            Revised & resubmitted
                          </span>
                        )}
                      </div>
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
                  <div className="mb-5 border-b border-gray-100 pb-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#07877B]">
                          {formatStage(selected.stage)}
                        </p>
                        <h2 className="text-xl leading-7 text-gray-900">
                          {selected.communication?.title ||
                            "Communication"}
                        </h2>
                      </div>

                      <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Action required
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Submitted {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <ReviewBrief
                    item={selected}
                  />

                  <VerifiedSourceFacts
                    item={selected}
                    expanded={showAllFacts}
                    onToggle={() =>
                      setShowAllFacts(
                        (current) => !current
                      )
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
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#07877B] hover:text-[#07877B]"
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
                      rows={5}
                      value={comments}
                      onChange={(event) => {
                        setComments(
                          event.target.value
                        );
                        if (decisionError) {
                          setDecisionError("");
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
                        {decisionError}
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
                      disabled={submitting}
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
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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


function ReviewBrief({
  item,
}: {
  item: ReviewQueueItem;
}) {
  const communication =
    item.communication;

  const inputData =
    getInputData(
      communication
    );

  const sourceFile =
    inputData?.sourceFile as
      | Record<string, any>
      | undefined;

  const rows = [
    {
      label: "Category",
      value:
        communication?.category,
    },
    {
      label: "Audience",
      value:
        communication?.audience,
    },
    {
      label: "Objective",
      value:
        communication?.objective,
    },
    {
      label: "Source",
      value:
        sourceFile?.name ||
        inputData?.sourceFileName ||
        inputData?.fileName,
    },
  ].filter(
    (row) =>
      Boolean(row.value)
  );

  if (
    rows.length === 0
  ) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">
          Communication brief
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        {rows.map(
          (row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[105px,1fr] gap-3 px-4 py-3 text-xs ${
                index !==
                rows.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <span className="text-gray-500">
                {row.label}
              </span>

              <span className="break-words font-medium text-gray-800">
                {String(
                  row.value
                )}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function VerifiedSourceFacts({
  item,
  expanded,
  onToggle,
}: {
  item: ReviewQueueItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const inputData =
    getInputData(
      item.communication
    );

  const facts =
    inputData
      ?.verifiedSourceFacts;

  if (
    !facts ||
    typeof facts !== "object" ||
    Array.isArray(facts) ||
    Object.keys(facts).length === 0
  ) {
    return null;
  }

  const entries =
    Object.entries(
      facts
    ).filter(
      ([key, value]) =>
        key !==
          "sourceWarnings" &&
        hasFactValue(
          value
        )
    );

  if (
    entries.length === 0
  ) {
    return null;
  }

  const visible =
    expanded
      ? entries
      : entries.slice(
          0,
          6
        );

  return (
    <section className="mb-6 rounded-xl border border-[#b3d9d5] bg-[#f7fbfa] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#07877B]" />

          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Verified source facts
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Facts reviewed by the creator before copy generation.
            </p>
          </div>
        </div>

        <span className="flex-shrink-0 rounded-full bg-[#e8f5f4] px-2 py-1 text-[11px] font-medium text-[#07877B]">
          Human verified
        </span>
      </div>

      <div className="space-y-3">
        {visible.map(
          ([key, value]) => (
            <FactRow
              key={key}
              label={
                formatFactLabel(
                  key
                )
              }
              value={value}
            />
          )
        )}
      </div>

      {entries.length > 6 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 flex items-center gap-1 text-xs font-medium text-[#07877B] hover:text-[#06766a]"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              View all {entries.length} facts
            </>
          )}
        </button>
      )}

      {Array.isArray(
        facts.sourceWarnings
      ) &&
        facts.sourceWarnings.length >
          0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="mb-1 text-xs font-medium text-amber-800">
              Source notes
            </p>

            {facts.sourceWarnings.map(
              (
                warning:
                  string,
                index:
                  number
              ) => (
                <p
                  key={index}
                  className="text-xs leading-5 text-amber-700"
                >
                  {warning}
                </p>
              )
            )}
          </div>
        )}
    </section>
  );
}

function FactRow({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  if (
    Array.isArray(value)
  ) {
    return (
      <div>
        <p className="mb-1 text-xs text-gray-500">
          {label}
        </p>

        <ul className="space-y-1">
          {value
            .filter(Boolean)
            .map(
              (
                item:
                  any,
                index:
                  number
              ) => (
                <li
                  key={index}
                  className="flex gap-2 text-xs leading-5 text-gray-800"
                >
                  <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-[#07877B]" />
                  <span>
                    {String(
                      item
                    )}
                  </span>
                </li>
              )
            )}
        </ul>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[115px,1fr] gap-3 text-xs">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="break-words font-medium leading-5 text-gray-800">
        {String(value)}
      </span>
    </div>
  );
}

function getInputData(
  communication:
    ReviewQueueItem["communication"]
) {
  if (
    !communication
  ) {
    return null;
  }

  const data =
    (
      communication as any
    ).input_data;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return null;
  }

  return data as Record<
    string,
    any
  >;
}

function hasFactValue(
  value: any
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value.filter(
        Boolean
      ).length > 0
    );
  }

  return true;
}

function formatFactLabel(
  key: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      documentType:
        "Document Type",
      securityOrCompany:
        "Company / Security",
      reportDate:
        "Report Date",
      recommendation:
        "Recommendation",
      currentPrice:
        "CMP / Current Price",
      targetPrice:
        "Target Price",
      timeHorizon:
        "Time Horizon",
      valuation:
        "Valuation",
      keyRationale:
        "Key Rationale",
      riskFactors:
        "Risk Factors",
      keyFacts:
        "Key Facts",
      authority:
        "Authority",
      circularOrReferenceNumber:
        "Circular / Ref.",
      subject:
        "Subject",
      issueDate:
        "Issue Date",
      effectiveDate:
        "Effective Date",
      applicability:
        "Applicability",
      affectedProductsOrUsers:
        "Affected Users",
      requiredActions:
        "Required Actions",
      deadlines:
        "Deadlines",
      topicOrProduct:
        "Topic / Product",
      dateOrTimeline:
        "Date / Timeline",
      audienceOrApplicability:
        "Audience",
      keyMessage:
        "Key Message",
      riskOrLimitations:
        "Risks / Limitations",
    };

  return (
    labels[key] ||
    key
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(
        /^./,
        (character) =>
          character.toUpperCase()
      )
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
