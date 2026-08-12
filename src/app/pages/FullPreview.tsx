import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Lock,
  MessageSquareText,
  Monitor,
  RotateCcw,
  Smartphone,
  Tag,
  Users,
  XCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { useAuth } from "../auth/useAuth";
import { StatusBadge } from "../components/StatusBadge";
import { EmailPreview } from "../components/EmailPreview";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";

import {
  getCommunicationById,
  updateCommunication,
} from "../services/communications";

import {
  markCreatorRevisionComplete,
} from "../services/revisionTracking";

import {
  submitReviewerDecision,
} from "../services/reviews";

import { supabase } from "../../lib/supabase";

import { renderEmailHtml } from "../email/renderEmailHtml";

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

type ReviewerRole =
  | "marketing_reviewer"
  | "corpcom_reviewer";

type ReviewDecision =
  | "approved"
  | "changes_requested"
  | "rejected";

interface VariantContentData {
  variant_key?: string;
  variant_name?: string;
  strategy?: string;
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  body?: {
    intro?: string;
    sections?: Array<{
      type:
        | "text"
        | "bullets"
        | "snapshot"
        | "highlight"
        | "steps"
        | "timeline"
        | "note";
      title?: string;
      content?: string;
      items?: Array<
        | string
        | {
            label: string;
            value: string;
          }
      >;
    }>;
    closing?: string;
  };
  cta?: {
    enabled?: boolean;
    label?: string;
    url?: string;
  };
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
}

interface StoredVariant {
  id: string;
  communication_id: string;
  ai_run_id: string | null;
  variant_key: "A" | "B" | "C";
  variant_name: string;
  subject_lines: string[];
  preheader: string | null;
  content_data: VariantContentData | null;
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
  is_selected: boolean;
}

export function FullPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    profile,
  } = useAuth();

  const communicationId = searchParams.get("communicationId");
  const variantId = searchParams.get("variantId");
  const urlCategory = searchParams.get("category") as Category | null;
  const isReviewMode =
    searchParams.get("mode") === "review";

  const isRevisionMode =
    searchParams.get("mode") === "revision";

  const reviewerRole =
    (
      profile?.role ===
        "marketing_reviewer" ||
      profile?.role ===
        "corpcom_reviewer"
    )
      ? profile.role as ReviewerRole
      : null;

  const [category, setCategory] = useState<Category>(
    urlCategory || "research"
  );
  const [communicationTitle, setCommunicationTitle] = useState(
    "New Communication"
  );
  const [subcategory, setSubcategory] = useState("");
  const [audience, setAudience] = useState("");
  const [variant, setVariant] = useState<StoredVariant | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaEnabled, setCtaEnabled] = useState(false);

  const [
    editableContentData,
    setEditableContentData,
  ] =
    useState<VariantContentData | null>(
      null
    );

  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [
    previewDirty,
    setPreviewDirty,
  ] = useState(false);

  const [
    approvalActionId,
    setApprovalActionId,
  ] =
    useState<string | null>(
      null
    );

  const [
    reviewComments,
    setReviewComments,
  ] =
    useState("");

  const [
    pendingDecision,
    setPendingDecision,
  ] =
    useState<
      "changes_requested" |
      "rejected" |
      null
    >(null);

  const [
    decisionError,
    setDecisionError,
  ] =
    useState("");

  const [
    decisionSaving,
    setDecisionSaving,
  ] =
    useState(false);

  useEffect(() => {
    if (!communicationId || !variantId) {
      setError("Communication or selected variant is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        setError("");

        const communication = await getCommunicationById(communicationId!);

        if (cancelled) return;

        setCommunicationTitle(
          communication.title || "New Communication"
        );
        setSubcategory(communication.subcategory || "");
        setAudience(communication.audience || "");

        const resolvedCategory = mapDatabaseCategoryToUi(
          communication.category
        );

        if (resolvedCategory) {
          setCategory(resolvedCategory);
        }

        const { data: variantRow, error: variantError } = await supabase
          .from("communication_variants")
          .select(
            `
            id,
            communication_id,
            ai_run_id,
            variant_key,
            variant_name,
            subject_lines,
            preheader,
            content_data,
            cta_data,
            compliance_data,
            is_selected
            `
          )
          .eq("id", variantId!)
          .eq("communication_id", communicationId!)
          .single();

        if (variantError) {
          throw new Error(variantError.message);
        }

        if (cancelled) return;

        const loadedVariant = variantRow as StoredVariant;

        setVariant(loadedVariant);
        setEditableContentData(
          loadedVariant.content_data
            ? structuredClone(
                loadedVariant.content_data
              )
            : {}
        );
        setSubject(loadedVariant.subject_lines?.[0] || "");
        setPreheader(loadedVariant.preheader || "");

        const cta =
          loadedVariant.cta_data ||
          loadedVariant.content_data?.cta ||
          {};

        setCtaEnabled(Boolean(cta.enabled));
        setCtaText(cta.label || "");
        setCtaUrl(cta.url || "");

        if (
          isReviewMode &&
          reviewerRole
        ) {
          const stage =
            reviewerRole ===
              "marketing_reviewer"
              ? "marketing_review"
              : "corpcom_review";

          const {
            data:
              approvalRow,
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
                comments
                `
              )
              .eq(
                "communication_id",
                communicationId!
              )
              .eq(
                "stage",
                stage
              )
              .eq(
                "status",
                "pending"
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(1)
              .maybeSingle();

          if (
            approvalError
          ) {
            throw new Error(
              approvalError.message
            );
          }

          setApprovalActionId(
            approvalRow?.id ||
              null
          );

          setReviewComments(
            approvalRow?.comments ||
              ""
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Unable to load full preview:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the selected AI variant."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [
    communicationId,
    variantId,
    isReviewMode,
    reviewerRole,
  ]);

  async function savePreviewEdits() {
    if (!communicationId || !variantId || !variant) {
      throw new Error("Communication or variant is missing.");
    }

    const nextSubjectLines = [
      subject.trim(),
      ...(variant.subject_lines || []).slice(1),
    ].filter(Boolean);

    const nextCta = {
      enabled: ctaEnabled,
      label: ctaText.trim(),
      url: ctaUrl.trim(),
    };

    const nextContentData = {
      ...(editableContentData ||
        variant.content_data ||
        {}),
      cta: nextCta,
    };

    const { error: updateError } = await supabase
      .from("communication_variants")
      .update({
        subject_lines: nextSubjectLines,
        preheader,
        cta_data: nextCta,
        content_data: nextContentData,
      })
      .eq("id", variantId)
      .eq("communication_id", communicationId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    setVariant((current) =>
      current
        ? {
            ...current,
            subject_lines: nextSubjectLines,
            preheader,
            cta_data: nextCta,
            content_data: nextContentData,
          }
        : current
    );

    setEditableContentData(
      nextContentData
    );

    await updateCommunication(communicationId, {
      selected_variant_id: variantId,
      status: "preview_ready",
    });

    if (
      previewDirty &&
      !isReviewMode
    ) {
      await markCreatorRevisionComplete(
        communicationId
      );

      setPreviewDirty(
        false
      );
    }
  }

  async function handleSave() {
    if (isReviewMode) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSavedMessage("");

      await savePreviewEdits();

      setSavedMessage("Preview changes saved.");
    } catch (err) {
      console.error("Unable to save preview edits:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save preview changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function buildCurrentEmailHtml() {
    return renderEmailHtml({
      category,
      subject,
      preheader,

      contentData: {
        ...(editableContentData ||
          variant?.content_data ||
          {}),
        cta: {
          enabled: ctaEnabled,
          label: ctaText,
          url: ctaUrl,
        },
      },

      cta: {
        enabled: ctaEnabled,
        label: ctaText,
        url: ctaUrl,
      },
    });
  }

  async function handleCopyHtml() {
    try {
      setError("");
      setSavedMessage("");

      const html =
        buildCurrentEmailHtml();

      await navigator.clipboard.writeText(
        html
      );

      setSavedMessage(
        "Email HTML copied to clipboard."
      );
    } catch (err) {
      console.error(
        "Unable to copy HTML:",
        err
      );

      setError(
        "Unable to copy HTML. Please try again."
      );
    }
  }

  function handleDownloadHtml() {
    try {
      setError("");
      setSavedMessage("");

      const html =
        buildCurrentEmailHtml();

      const blob =
        new Blob(
          [html],
          {
            type:
              "text/html;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;
      anchor.download =
        `${slugify(
          communicationTitle ||
            "geojit-communication"
        )}.html`;

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url
      );

      setSavedMessage(
        "Email HTML downloaded."
      );
    } catch (err) {
      console.error(
        "Unable to download HTML:",
        err
      );

      setError(
        "Unable to download HTML. Please try again."
      );
    }
  }

  async function handleSubmit() {
    if (
      isReviewMode ||
      !communicationId ||
      !variantId
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await savePreviewEdits();

      navigate(
        `/create/submit?communicationId=${encodeURIComponent(
          communicationId
        )}&variantId=${encodeURIComponent(
          variantId
        )}&category=${encodeURIComponent(category)}`
      );
    } catch (err) {
      console.error("Unable to prepare approval submission:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue to approval."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewerDecision(
    decision:
      ReviewDecision
  ) {
    if (
      !isReviewMode ||
      !reviewerRole ||
      !approvalActionId ||
      !communicationId ||
      decisionSaving
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
      !reviewComments.trim()
    ) {
      setDecisionError(
        decision ===
          "changes_requested"
          ? "Please explain what needs to be changed before returning this communication to the creator."
          : "Please add a reason before rejecting this communication."
      );

      return;
    }

    try {
      setDecisionSaving(
        true
      );

      setDecisionError(
        ""
      );

      setError(
        ""
      );

      await submitReviewerDecision({
        approvalActionId,
        communicationId,
        decision,
        comments:
          reviewComments,
        reviewerRole,
      });

      navigate(
        "/reviews",
        {
          replace:
            true,
        }
      );
    } catch (err) {
      console.error(
        "Unable to save reviewer decision:",
        err
      );

      setDecisionError(
        err instanceof Error
          ? err.message
          : "Unable to save review decision."
      );
    } finally {
      setDecisionSaving(
        false
      );
    }
  }

  function beginReviewerDecision(
    decision:
      "changes_requested" |
      "rejected"
  ) {
    setPendingDecision(
      decision
    );

    setDecisionError(
      ""
    );
  }

  function cancelReviewerDecision() {
    setPendingDecision(
      null
    );

    setDecisionError(
      ""
    );
  }

  function handleBack() {
    if (isReviewMode) {
      navigate("/reviews");
      return;
    }

    if (!communicationId) {
      navigate("/");
      return;
    }

    navigate(
      `/create/variants?communicationId=${encodeURIComponent(
        communicationId
      )}&category=${encodeURIComponent(category)}`
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />
            <p className="text-sm text-gray-600">Loading selected variant...</p>
          </div>
        </div>
      </div>
    );
  }

  const liveContentData = {
    ...(editableContentData ||
      variant?.content_data ||
      {}),
    cta: {
      enabled: ctaEnabled,
      label: ctaText,
      url: ctaUrl,
    },
  };

  const disclaimer = liveContentData.disclaimer;
  const compliance =
    liveContentData.compliance || variant?.compliance_data;

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={communicationTitle}
        category={category}
        status="preview-ready"
        currentStep={5}
        totalSteps={5}
        onSaveDraft={
          isReviewMode
            ? undefined
            : handleSave
        }
      />

      <ProgressStepper currentStep={5} />

      <main className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl text-gray-900">Full Preview</h1>
              <CategoryTag category={category} />
              <StatusBadge status="preview-ready" />
            </div>

            {isReviewMode ? (
              <div className="mt-3 rounded-lg border border-[#b3d9d5] bg-[#f3fbfa] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#07877B]" />
                  <span className="text-sm font-medium text-[#07877B]">
                    Review Mode
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  You are viewing the communication submitted for approval.
                  Record your decision below or return to the Review Queue.
                </p>
              </div>
            ) : isRevisionMode ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">
                    Revision Mode
                  </span>
                </div>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  A reviewer has requested changes. Update the communication,
                  save your changes, then resubmit it for Marketing review.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Review the selected AI-generated communication before submission.
              </p>
            )}

            {variant && (
              <p className="mt-1 text-xs text-gray-500">
                Variant {variant.variant_key} — {variant.variant_name}
              </p>
            )}
          </div>

          <div className="flex w-fit gap-2 rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-all ${
                viewMode === "desktop"
                  ? "bg-[#07877B] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>

            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition-all ${
                viewMode === "mobile"
                  ? "bg-[#07877B] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {savedMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {savedMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          <div
            className={
              viewMode === "mobile"
                ? "mx-auto w-full max-w-[375px]"
                : ""
            }
          >
            <EmailPreview
              category={category}
              subject={subject}
              preheader={preheader}
              contentData={liveContentData}
              cta={{
                enabled: ctaEnabled,
                label: ctaText,
                url: ctaUrl,
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-gray-900">
                Communication Metadata
              </h3>

              <div className="space-y-4">
                <MetadataRow
                  icon={Tag}
                  label="Category"
                  value={getCategoryLabel(category)}
                />
                <MetadataRow
                  icon={FileText}
                  label="Subcategory"
                  value={subcategory || "—"}
                />
                <MetadataRow
                  icon={Users}
                  label="Audience"
                  value={audience || "—"}
                />
                <MetadataRow
                  icon={Users}
                  label="Variant"
                  value={
                    variant
                      ? `${variant.variant_key} — ${variant.variant_name}`
                      : "—"
                  }
                />
                <MetadataRow
                  icon={Lock}
                  label="Sensitivity"
                  value={
                    category === "regulatory"
                      ? "High — Compliance Required"
                      : "Standard"
                  }
                />
              </div>
            </div>

            {!isReviewMode && (
              <>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2>Editable Fields</h2>
                <span className="text-xs text-gray-500">Live preview</span>
              </div>

              <div className="space-y-4">
                <EditableField
                  label="Subject Line"
                  value={subject}
                  onChange={(value) => {
                    setSubject(value);
                    setPreviewDirty(true);
                  }}
                />

                <EditableField
                  label="Preheader"
                  value={preheader}
                  onChange={(value) => {
                    setPreheader(value);
                    setPreviewDirty(true);
                  }}
                />

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="text-sm text-gray-700">CTA Enabled</p>
                    <p className="text-xs text-gray-500">
                      Show primary action in the email
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={ctaEnabled}
                    onChange={(event) => {
                      setCtaEnabled(event.target.checked);
                      setPreviewDirty(true);
                    }}
                    className="h-4 w-4 accent-[#07877B]"
                  />
                </div>

                <EditableField
                  label="CTA Text"
                  value={ctaText}
                  onChange={(value) => {
                    setCtaText(value);
                    setPreviewDirty(true);
                  }}
                  disabled={!ctaEnabled}
                />

                <EditableField
                  label="CTA URL"
                  type="url"
                  value={ctaUrl}
                  onChange={(value) => {
                    setCtaUrl(value);
                    setPreviewDirty(true);
                  }}
                  disabled={!ctaEnabled}
                />

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-lg border border-[#07877B] px-4 py-2.5 text-sm text-[#07877B] transition-colors hover:bg-[#f3fbfa] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Preview Changes"}
                </button>
              </div>
            </div>

              </>
            )}


            {!isReviewMode && (
              <BodyContentEditor
                contentData={
                  editableContentData
                }
                onChange={(
                  nextContentData
                ) => {
                  setEditableContentData(
                    nextContentData
                  );

                  setPreviewDirty(
                    true
                  );

                  setSavedMessage(
                    ""
                  );
                }}
              />
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm text-gray-700">Controlled Fields</h3>
              </div>

              <p className="mb-4 text-xs leading-5 text-muted-foreground">
                Layout, brand styling and approved disclaimer rules remain
                controlled by Communication Studio.
              </p>

              <div className="space-y-3 text-sm">
                <ControlledRow label="Layout" value="Controlled" />
                <ControlledRow label="Brand styling" value="Controlled" />
                <ControlledRow
                  label="Disclaimer"
                  value={
                    disclaimer?.required
                      ? `${disclaimer.type || "Required"}`
                      : "Not required"
                  }
                />
                <ControlledRow
                  label="Compliance"
                  value={compliance?.status || "Not flagged"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCopyHtml}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
                Copy HTML
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download HTML
              </button>

              {isReviewMode ? (
                <>
                  {reviewerRole &&
                    approvalActionId ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <div className="mb-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Review decision
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {reviewerRole ===
                          "marketing_reviewer"
                            ? "Approve this copy to send it to CorpCom for final approval."
                            : "CorpCom is the final approval stage for this communication."}
                        </p>
                      </div>

                      {pendingDecision && (
                        <div className="mb-4">
                          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MessageSquareText className="h-4 w-4" />
                            {pendingDecision ===
                            "changes_requested"
                              ? "Changes required"
                              : "Reason for rejection"}
                          </label>

                          <textarea
                            rows={4}
                            value={
                              reviewComments
                            }
                            onChange={(
                              event
                            ) => {
                              setReviewComments(
                                event.target.value
                              );

                              if (
                                decisionError
                              ) {
                                setDecisionError(
                                  ""
                                );
                              }
                            }}
                            placeholder={
                              pendingDecision ===
                              "changes_requested"
                                ? "Explain exactly what the creator should change..."
                                : "Explain why this communication is being rejected..."
                            }
                            className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 ${
                              decisionError
                                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                : "border-gray-300 focus:border-[#07877B] focus:ring-[#07877B]/20"
                            }`}
                          />

                          {decisionError && (
                            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                              {
                                decisionError
                              }
                            </div>
                          )}

                          <div className="mt-3 flex gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleReviewerDecision(
                                  pendingDecision
                                )
                              }
                              disabled={
                                decisionSaving
                              }
                              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                                pendingDecision ===
                                "changes_requested"
                                  ? "bg-amber-500 text-white hover:bg-amber-600"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {decisionSaving
                                ? "Saving..."
                                : pendingDecision ===
                                    "changes_requested"
                                  ? "Send Back to Creator"
                                  : "Confirm Rejection"}
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelReviewerDecision
                              }
                              disabled={
                                decisionSaving
                              }
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!pendingDecision && (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleReviewerDecision(
                                "approved"
                              )
                            }
                            disabled={
                              decisionSaving
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />

                            {decisionSaving
                              ? "Saving..."
                              : reviewerRole ===
                                  "marketing_reviewer"
                                ? "Approve & Send to CorpCom"
                                : "Final Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              beginReviewerDecision(
                                "changes_requested"
                              )
                            }
                            disabled={
                              decisionSaving
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Request Changes
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              beginReviewerDecision(
                                "rejected"
                              )
                            }
                            disabled={
                              decisionSaving
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No pending review action was found for this communication. Return to the Review Queue and refresh the workflow.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleBack
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Review Queue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full rounded-lg bg-[#07877B] px-4 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : isRevisionMode
                        ? "Resubmit for Marketing Approval"
                        : "Submit for Approval"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-center text-sm text-gray-600 transition-colors hover:text-[#07877B]"
                  >
                    Back to Variants
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {isReviewMode
              ? "Back to Review Queue"
              : "Back"}
          </button>
        </div>
      </main>
    </div>
  );
}


function BodyContentEditor({
  contentData,
  onChange,
}: {
  contentData:
    VariantContentData | null;
  onChange: (
    next:
      VariantContentData
  ) => void;
}) {
  const body =
    contentData?.body || {};

  const sections =
    body.sections || [];

  function updateBody(
    patch:
      Partial<
        NonNullable<
          VariantContentData[
            "body"
          ]
        >
      >
  ) {
    onChange({
      ...(contentData || {}),
      body: {
        ...body,
        ...patch,
      },
    });
  }

  function updateSection(
    index: number,
    patch:
      Partial<
        NonNullable<
          NonNullable<
            VariantContentData[
              "body"
            ]
          >["sections"]
        >[number]
      >
  ) {
    const nextSections =
      sections.map(
        (
          section,
          sectionIndex
        ) =>
          sectionIndex ===
          index
            ? {
                ...section,
                ...patch,
              }
            : section
      );

    updateBody({
      sections:
        nextSections,
    });
  }

  function updateBullet(
    sectionIndex:
      number,
    bulletIndex:
      number,
    value:
      string
  ) {
    const section =
      sections[
        sectionIndex
      ];

    if (!section) {
      return;
    }

    const currentItems =
      Array.isArray(
        section.items
      )
        ? [
            ...section.items,
          ]
        : [];

    currentItems[
      bulletIndex
    ] = value;

    updateSection(
      sectionIndex,
      {
        items:
          currentItems,
      }
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-medium text-gray-900">
          Email Body Content
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          Edit the generated copy here. Changes update the preview immediately.
        </p>
      </div>

      <div className="space-y-5">
        <EditableTextArea
          label="Introduction"
          value={
            body.intro ||
            ""
          }
          onChange={(
            value
          ) =>
            updateBody({
              intro:
                value,
            })
          }
        />

        {sections.map(
          (
            section,
            sectionIndex
          ) => (
            <div
              key={
                sectionIndex
              }
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Section{" "}
                  {
                    sectionIndex +
                    1
                  }{" "}
                  ·{" "}
                  {
                    section.type
                  }
                </p>
              </div>

              <div className="space-y-3">
                <EditableField
                  label="Section Title"
                  value={
                    section.title ||
                    ""
                  }
                  onChange={(
                    value
                  ) =>
                    updateSection(
                      sectionIndex,
                      {
                        title:
                          value,
                      }
                    )
                  }
                />

                {(
                  section.type ===
                    "bullets" ||
                  section.type ===
                    "steps"
                ) &&
                Array.isArray(
                  section.items
                ) ? (
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Bullet Points
                    </label>

                    <div className="space-y-2">
                      {section.items.map(
                        (
                          item,
                          bulletIndex
                        ) => {
                          const bulletValue =
                            typeof item ===
                            "string"
                              ? item
                              : `${item.label}: ${item.value}`;

                          return (
                            <div
                              key={
                                bulletIndex
                              }
                              className="flex gap-2"
                            >
                              <span className="pt-2 text-sm text-[#07877B]">
                                •
                              </span>

                              <textarea
                                rows={
                                  2
                                }
                                value={
                                  bulletValue
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateBullet(
                                    sectionIndex,
                                    bulletIndex,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="min-h-[64px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <EditableTextArea
                    label="Content"
                    value={
                      section.content ||
                      ""
                    }
                    onChange={(
                      value
                    ) =>
                      updateSection(
                        sectionIndex,
                        {
                          content:
                            value,
                        }
                      )
                    }
                  />
                )}
              </div>
            </div>
          )
        )}

        <EditableTextArea
          label="Closing"
          value={
            body.closing ||
            ""
          }
          onChange={(
            value
          ) =>
            updateBody({
              closing:
                value,
            })
          }
        />
      </div>
    </div>
  );
}

function EditableTextArea({
  label,
  value,
  onChange,
}: {
  label:
    string;
  value:
    string;
  onChange: (
    value:
      string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-700">
        {label}
      </label>

      <textarea
        rows={4}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
      />
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function ControlledRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-gray-700">{value}</span>
    </div>
  );
}

function slugify(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ||
    "geojit-communication";
}

function getCategoryLabel(category: Category) {
  switch (category) {
    case "research":
      return "Research & Advisory";
    case "education":
      return "Investor Education";
    case "product":
      return "Product & Sales";
    case "service":
      return "Service & Transactional";
    case "regulatory":
      return "Regulatory & Compliance";
    case "onboarding":
      return "Onboarding & Journey";
  }
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
