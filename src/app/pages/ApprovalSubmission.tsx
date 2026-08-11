import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Send,
  XCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";

import {
  getCommunicationById,
  updateCommunication,
} from "../services/communications";

import {
  submitCommunicationForApproval,
} from "../services/approvals";

import { supabase } from "../../lib/supabase";

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

type ApprovalStage =
  | "not_submitted"
  | "marketing_pending"
  | "corpcom_pending"
  | "approved"
  | "changes_requested"
  | "rejected";

interface ApprovalActionRow {
  id: string;
  stage: string;
  action: string;
  comment: string | null;
  created_at: string;
}

interface StoredVariant {
  id: string;
  variant_key: "A" | "B" | "C";
  variant_name: string;
  subject_lines: string[];
  preheader: string | null;

  cta_data: {
    enabled?: boolean;
    label?: string;
    url?: string;
  } | null;

  compliance_data: {
    status?: string;
    flags?: string[];
    notes?: string[];
  } | null;

  content_data: {
    disclaimer?: {
      required?: boolean;
      type?: string;
      text?: string;
    };

    compliance?: {
      status?: string;
      flags?: string[];
      notes?: string[];
    };
  } | null;
}

export function ApprovalSubmission() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const variantId =
    searchParams.get(
      "variantId"
    );

  const urlCategory =
    searchParams.get(
      "category"
    ) as Category | null;

  const [
    category,
    setCategory,
  ] =
    useState<Category>(
      urlCategory ||
        "research"
    );

  const [
    communicationTitle,
    setCommunicationTitle,
  ] =
    useState(
      "New Communication"
    );

  const [
    audience,
    setAudience,
  ] =
    useState("");

  const [
    variant,
    setVariant,
  ] =
    useState<StoredVariant | null>(
      null
    );

  const [
    checklist,
    setChecklist,
  ] =
    useState({
      content: false,
      cta: false,
      data: false,
      attachments: false,
    });

  const [
    note,
    setNote,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    approvalStage,
    setApprovalStage,
  ] =
    useState<ApprovalStage>(
      "not_submitted"
    );

  const [
    latestApprovalComment,
    setLatestApprovalComment,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const allChecked =
    Object.values(
      checklist
    ).every(Boolean);

  useEffect(() => {
    if (
      !communicationId ||
      !variantId
    ) {
      setError(
        "Communication or selected variant is missing."
      );
      setLoading(false);
      return;
    }

    let cancelled =
      false;

    async function loadSubmission() {
      try {
        setLoading(true);
        setError("");

        const communication =
          await getCommunicationById(
            communicationId!
          );

        if (cancelled) {
          return;
        }

        setCommunicationTitle(
          communication.title ||
            "New Communication"
        );

        setAudience(
          communication.audience ||
            ""
        );

        const resolvedCategory =
          mapDatabaseCategoryToUi(
            communication.category
          );

        if (resolvedCategory) {
          setCategory(
            resolvedCategory
          );
        }

        const {
          data:
            variantRow,
          error:
            variantError,
        } =
          await supabase
            .from(
              "communication_variants"
            )
            .select(
              `
              id,
              variant_key,
              variant_name,
              subject_lines,
              preheader,
              cta_data,
              compliance_data,
              content_data
              `
            )
            .eq(
              "id",
              variantId!
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .single();

        if (variantError) {
          throw new Error(
            variantError.message
          );
        }

        if (cancelled) {
          return;
        }

        setVariant(
          variantRow as StoredVariant
        );

        const {
          data:
            approvalRows,
          error:
            approvalError,
        } =
          await supabase
            .from(
              "approval_actions"
            )
            .select(
              `
              id,
              stage,
              action,
              comment,
              created_at
              `
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (approvalError) {
          throw new Error(
            approvalError.message
          );
        }

        if (cancelled) {
          return;
        }

        const resolvedStage =
          resolveApprovalStage(
            (approvalRows ||
              []) as ApprovalActionRow[]
          );

        setApprovalStage(
          resolvedStage
        );

        const latestComment =
          [...(
            (approvalRows ||
              []) as ApprovalActionRow[]
          )]
            .reverse()
            .find(
              (row) =>
                Boolean(
                  row.comment?.trim()
                )
            )
            ?.comment ||
          "";

        setLatestApprovalComment(
          latestComment
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to load approval submission:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load approval details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [
    communicationId,
    variantId,
  ]);

  function toggleCheck(
    key:
      keyof typeof checklist
  ) {
    setChecklist(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  }

  async function handleSubmit() {
    if (
      !communicationId ||
      !variantId ||
      !allChecked ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      /**
       * Make sure the selected variant
       * remains attached to the communication.
       */
      await updateCommunication(
        communicationId,
        {
          selected_variant_id:
            variantId,
        }
      );

      /**
       * Create the first approval workflow action.
       *
       * creator
       *   ↓
       * marketing_reviewer
       */
      await submitCommunicationForApproval({
        communicationId,
        comments:
          note,
      });

      /**
       * Move parent communication into
       * the real approval state.
       */
      await updateCommunication(
        communicationId,
        {
          status:
            "pending_approval",
        }
      );

      navigate(
        "/?submission=success",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Approval submission failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit this communication for approval."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (
      !communicationId ||
      !variantId
    ) {
      navigate("/");
      return;
    }

    navigate(
      `/create/preview?communicationId=${encodeURIComponent(
        communicationId
      )}&variantId=${encodeURIComponent(
        variantId
      )}&category=${encodeURIComponent(
        category
      )}`
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />

            <p className="text-sm text-gray-600">
              Preparing approval submission...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitted =
    approvalStage !==
    "not_submitted";

  const stagePresentation =
    getApprovalStagePresentation(
      approvalStage
    );

  const compliance =
    variant
      ?.content_data
      ?.compliance ||
    variant
      ?.compliance_data;

  const cta =
    variant?.cta_data;

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={
          communicationTitle
        }
        category={category}
        status={
          isSubmitted
            ? approvalStage ===
                "approved"
              ? "approved"
              : approvalStage ===
                  "changes_requested"
                ? "changes-requested"
                : approvalStage ===
                    "rejected"
                  ? "rejected"
                  : "pending-approval"
            : "preview-ready"
        }
        currentStep={5}
        totalSteps={5}
      />

      <ProgressStepper
        currentStep={5}
      />

      <main className="mx-auto max-w-4xl px-8 py-12">

        {/* Header */}
        <div className="mb-10 text-center">

          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5f4]">
              <Send className="h-8 w-8 text-[#07877B]" />
            </div>
          </div>

          <h1 className="mb-3 text-3xl text-gray-900">
            {isSubmitted
              ? stagePresentation.title
              : "Submit for Approval"}
          </h1>

          <p className="text-gray-600">
            {isSubmitted
              ? stagePresentation.description
              : "Complete the verification checklist before sending this communication to the Marketing reviewer."}
          </p>

        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isSubmitted && (
          <ApprovalStageBanner
            stage={
              approvalStage
            }
            latestComment={
              latestApprovalComment
            }
          />
        )}

        {/* Summary */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

          <h2 className="mb-6">
            Communication Summary
          </h2>

          <div className="space-y-4">

            <SummaryRow
              label="Title"
              value={
                communicationTitle
              }
            />

            <div className="flex items-start justify-between gap-6 border-b border-gray-100 pb-4">

              <span className="text-sm text-muted-foreground">
                Category
              </span>

              <CategoryTag
                category={category}
                size="sm"
              />

            </div>

            <SummaryRow
              label="Variant"
              value={
                variant
                  ? `${variant.variant_key} — ${variant.variant_name}`
                  : "—"
              }
            />

            <SummaryRow
              label="Subject Line"
              value={
                variant
                  ?.subject_lines
                  ?.[0] ||
                "—"
              }
            />

            <SummaryRow
              label="Target Audience"
              value={
                audience ||
                "—"
              }
            />

            <SummaryRow
              label="CTA"
              value={
                cta?.enabled
                  ? cta.label ||
                    "Enabled"
                  : "Not used"
              }
            />

            <SummaryRow
              label="AI Compliance Check"
              value={
                compliance?.status ||
                "Not flagged"
              }
              last
            />

          </div>

        </div>

        {/* Verification */}
        {!isSubmitted && (
          <>
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

              <h2 className="mb-2">
                Verification Checklist
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                These confirmations are made by the creator before the communication enters the formal review workflow.
              </p>

              <div className="space-y-4">

                <ChecklistItem
                  checked={
                    checklist.content
                  }
                  onChange={() =>
                    toggleCheck(
                      "content"
                    )
                  }
                  title="Content Reviewed"
                  description="The communication has been reviewed for factual accuracy and intended meaning."
                />

                <ChecklistItem
                  checked={
                    checklist.cta
                  }
                  onChange={() =>
                    toggleCheck(
                      "cta"
                    )
                  }
                  title="CTA Verified"
                  description="CTA wording and destination URL have been checked where a CTA is used."
                />

                <ChecklistItem
                  checked={
                    checklist.data
                  }
                  onChange={() =>
                    toggleCheck(
                      "data"
                    )
                  }
                  title="Data Verified"
                  description="Prices, dates, figures, recommendations and other factual inputs have been verified against the source."
                />

                <ChecklistItem
                  checked={
                    checklist.attachments
                  }
                  onChange={() =>
                    toggleCheck(
                      "attachments"
                    )
                  }
                  title="Supporting Material Verified"
                  description="Any required reports, circulars, attachments or supporting links have been checked."
                />

              </div>

            </div>

            {/* Optional note */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

              <h2 className="mb-2">
                Note to Reviewer
              </h2>

              <p className="mb-4 text-sm text-gray-500">
                Optional. Add any context the Marketing reviewer should know.
              </p>

              <textarea
                rows={4}
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Add a short note for the reviewer..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
              />

            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4">

          {!isSubmitted && (
            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                !allChecked ||
                submitting
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />

              {submitting
                ? "Submitting..."
                : "Submit to Marketing"}
            </button>
          )}

          {isSubmitted && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/approval/status?communicationId=${encodeURIComponent(
                    communicationId ||
                      ""
                  )}`
                )
              }
              className="rounded-lg bg-[#07877B] px-8 py-4 text-white transition-colors hover:bg-[#06766a]"
            >
              View Approval Status
            </button>
          )}

          {isSubmitted && (
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
            >
              Return to Dashboard
            </button>
          )}

          {!isSubmitted && (
            <button
              type="button"
              onClick={
                handleBack
              }
              className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
            >
              Return to Preview
            </button>
          )}

        </div>

        {/* Back */}
        <div className="mt-8 border-t border-gray-200 pt-6">

          <button
            type="button"
            onClick={() =>
              isSubmitted
                ? navigate("/")
                : handleBack()
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {isSubmitted
              ? "Back to Dashboard"
              : "Back"}
          </button>

        </div>

      </main>
    </div>
  );
}


function ApprovalStageBanner({
  stage,
  latestComment,
}: {
  stage: ApprovalStage;
  latestComment: string;
}) {
  const presentation =
    getApprovalStagePresentation(
      stage
    );

  const Icon =
    stage === "approved"
      ? CheckCircle2
      : stage === "rejected"
        ? XCircle
        : stage ===
            "changes_requested"
          ? CircleAlert
          : Clock3;

  const styles =
    stage === "approved"
      ? {
          wrapper:
            "border-green-200 bg-green-50",
          icon:
            "text-green-600",
          title:
            "text-green-900",
          body:
            "text-green-700",
        }
      : stage === "rejected"
        ? {
            wrapper:
              "border-red-200 bg-red-50",
            icon:
              "text-red-600",
            title:
              "text-red-900",
            body:
              "text-red-700",
          }
        : stage ===
            "changes_requested"
          ? {
              wrapper:
                "border-amber-200 bg-amber-50",
              icon:
                "text-amber-600",
              title:
                "text-amber-900",
              body:
                "text-amber-700",
            }
          : {
              wrapper:
                "border-blue-200 bg-blue-50",
              icon:
                "text-blue-600",
              title:
                "text-blue-900",
              body:
                "text-blue-700",
            };

  return (
    <div
      className={`mb-8 rounded-xl border p-5 ${styles.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`}
        />

        <div>
          <p
            className={`font-medium ${styles.title}`}
          >
            {
              presentation.bannerTitle
            }
          </p>

          <p
            className={`mt-1 text-sm leading-6 ${styles.body}`}
          >
            {
              presentation.bannerDescription
            }
          </p>

          {latestComment &&
            (
              stage ===
                "changes_requested" ||
              stage ===
                "rejected"
            ) && (
              <div className="mt-3 rounded-lg border border-black/5 bg-white/60 px-3 py-2">
                <p className="text-xs font-medium text-gray-700">
                  Reviewer comment
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-700">
                  {
                    latestComment
                  }
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function resolveApprovalStage(
  rows:
    ApprovalActionRow[]
): ApprovalStage {
  if (
    rows.length === 0
  ) {
    return "not_submitted";
  }

  const latestCorpCom =
    [...rows]
      .reverse()
      .find(
        (row) =>
          row.stage ===
          "corpcom_review"
      );

  if (
    latestCorpCom
  ) {
    if (
      latestCorpCom.action ===
      "approved"
    ) {
      return "approved";
    }

    if (
      latestCorpCom.action ===
      "changes_requested"
    ) {
      return "changes_requested";
    }

    if (
      latestCorpCom.action ===
      "rejected"
    ) {
      return "rejected";
    }

    if (
      latestCorpCom.action ===
      "submitted"
    ) {
      return "corpcom_pending";
    }
  }

  const latestMarketing =
    [...rows]
      .reverse()
      .find(
        (row) =>
          row.stage ===
          "marketing_review"
      );

  if (
    latestMarketing
  ) {
    if (
      latestMarketing.action ===
      "changes_requested"
    ) {
      return "changes_requested";
    }

    if (
      latestMarketing.action ===
      "rejected"
    ) {
      return "rejected";
    }

    if (
      latestMarketing.action ===
      "submitted"
    ) {
      return "marketing_pending";
    }

    if (
      latestMarketing.action ===
      "approved"
    ) {
      /**
       * Marketing approval should normally
       * create a CorpCom submitted row.
       * Until that row appears, treat the
       * communication as moving to CorpCom,
       * not as Marketing pending.
       */
      return "corpcom_pending";
    }
  }

  return "marketing_pending";
}

function getApprovalStagePresentation(
  stage:
    ApprovalStage
) {
  switch (stage) {
    case "marketing_pending":
      return {
        title:
          "Awaiting Marketing Approval",

        description:
          "This communication has been submitted and is waiting for Marketing review.",

        bannerTitle:
          "Pending Marketing approval",

        bannerDescription:
          "No additional submission is required. The Marketing reviewer will approve, request changes or reject the communication.",
      };

    case "corpcom_pending":
      return {
        title:
          "Awaiting Final CorpCom Approval",

        description:
          "Marketing review is complete. This communication is now waiting for final CorpCom approval.",

        bannerTitle:
          "Pending final CorpCom approval",

        bannerDescription:
          "Marketing has completed its review. CorpCom is the final approval stage for this communication.",
      };

    case "approved":
      return {
        title:
          "Communication Approved",

        description:
          "Marketing and CorpCom approvals are complete.",

        bannerTitle:
          "Final approval completed",

        bannerDescription:
          "This communication has completed the approval workflow and is ready for the next publishing or delivery step.",
      };

    case "changes_requested":
      return {
        title:
          "Changes Requested",

        description:
          "A reviewer has returned this communication to the creator for changes.",

        bannerTitle:
          "Reviewer requested changes",

        bannerDescription:
          "Review the reviewer comment, update the communication and resubmit it through the approval workflow.",
      };

    case "rejected":
      return {
        title:
          "Communication Rejected",

        description:
          "A reviewer has rejected this communication.",

        bannerTitle:
          "Approval rejected",

        bannerDescription:
          "This communication cannot proceed in its current form. Review the reviewer comment before deciding the next action.",
      };

    default:
      return {
        title:
          "Submit for Approval",

        description:
          "Complete the verification checklist before sending this communication to the Marketing reviewer.",

        bannerTitle:
          "",

        bannerDescription:
          "",
      };
  }
}

function ChecklistItem({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50">

      <input
        type="checkbox"
        checked={checked}
        onChange={
          onChange
        }
        className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 accent-[#07877B]"
      />

      <div>
        <p className="text-sm text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

    </label>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 ${
        last
          ? ""
          : "border-b border-gray-100 pb-4"
      }`}
    >
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-md text-right text-sm text-gray-900">
        {value}
      </span>
    </div>
  );
}

function mapDatabaseCategoryToUi(
  value: string | null
): Category | null {
  switch (value) {
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
      return null;
  }
}
