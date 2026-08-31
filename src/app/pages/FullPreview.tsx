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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  Lock,
  MessageSquareText,
  Monitor,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Users,
  XCircle,
} from "lucide-react";

import {
  TopNavBar,
} from "../components/TopNavBar";

import {
  CategoryTag,
} from "../components/CategoryTag";

import {
  useAuth,
} from "../auth/useAuth";

import {
  StatusBadge,
} from "../components/StatusBadge";

import {
  EmailPreview,
} from "../components/EmailPreview";

import {
  CommunicationStateBar,
} from "../components/CommunicationStateBar";

import {
  ProgressStepper,
} from "../components/ProgressStepper";

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

import {
  supabase,
} from "../../lib/supabase";

import {
  renderEmailHtml,
} from "../email/renderEmailHtml";


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


interface VariantSection {
  type:
    | "text"
    | "bullets"
    | "snapshot"
    | "highlight"
    | "steps"
    | "timeline"
    | "note";

  title?:
    string;

  content?:
    string;

  items?:
    Array<
      | string
      | {
          label:
            string;

          value:
            string;
        }
    >;
}


interface VariantContentData {
  variant_key?:
    string;

  variant_name?:
    string;

  strategy?:
    string;

  hero?: {
    eyebrow?:
      string;

    title?:
      string;

    subtitle?:
      string;
  };

  body?: {
    intro?:
      string;

    sections?:
      VariantSection[];

    closing?:
      string;
  };

  cta?: {
    enabled?:
      boolean;

    label?:
      string;

    url?:
      string;
  };

  disclaimer?: {
    required?:
      boolean;

    type?:
      string;

    text?:
      string;
  };

  compliance?: {
    status?:
      string;

    flags?:
      string[];

    notes?:
      string[];
  };
}


interface StoredVariant {
  id:
    string;

  communication_id:
    string;

  ai_run_id:
    string | null;

  variant_key:
    "A"
    | "B"
    | "C";

  variant_name:
    string;

  subject_lines:
    string[];

  preheader:
    string | null;

  content_data:
    VariantContentData | null;

  cta_data: {
    enabled?:
      boolean;

    label?:
      string;

    url?:
      string;
  } | null;

  compliance_data: {
    status?:
      string;

    flags?:
      string[];

    notes?:
      string[];
  } | null;

  is_selected:
    boolean;
}


export function FullPreview() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const {
    profile,
  } =
    useAuth();

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
    ) as
      | Category
      | null;

  const mode =
    searchParams.get(
      "mode"
    );

  const isReviewMode =
    mode ===
    "review";

  const isRevisionMode =
    mode ===
    "revision";

  const isCreator =
    profile?.role ===
    "creator";

  const isAdmin =
    profile?.role ===
    "admin";

  const reviewerRole =
    (
      profile?.role ===
        "marketing_reviewer" ||
      profile?.role ===
        "corpcom_reviewer"
    )
      ? (
          profile.role as
            ReviewerRole
        )
      : null;

  /**
   * Only Creator can edit the communication.
   * Reviewer + Admin access remains read-only.
   */
  const canEdit =
    isCreator &&
    !isReviewMode;

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
      "Untitled Communication"
    );

  const [
    subcategory,
    setSubcategory,
  ] =
    useState(
      ""
    );

  const [
    audience,
    setAudience,
  ] =
    useState(
      ""
    );

  const [
    variant,
    setVariant,
  ] =
    useState<
      StoredVariant | null
    >(
      null
    );

  const [
    subject,
    setSubject,
  ] =
    useState(
      ""
    );

  const [
    preheader,
    setPreheader,
  ] =
    useState(
      ""
    );

  const [
    ctaText,
    setCtaText,
  ] =
    useState(
      ""
    );

  const [
    ctaUrl,
    setCtaUrl,
  ] =
    useState(
      ""
    );

  const [
    ctaEnabled,
    setCtaEnabled,
  ] =
    useState(
      false
    );

  const [
    editableContentData,
    setEditableContentData,
  ] =
    useState<
      VariantContentData | null
    >(
      null
    );

  const [
    viewMode,
    setViewMode,
  ] =
    useState<
      "desktop"
      | "mobile"
    >(
      "desktop"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    saving,
    setSaving,
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
    savedMessage,
    setSavedMessage,
  ] =
    useState(
      ""
    );

  const [
    previewDirty,
    setPreviewDirty,
  ] =
    useState(
      false
    );

  const [
    approvalActionId,
    setApprovalActionId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    reviewComments,
    setReviewComments,
  ] =
    useState(
      ""
    );

  const [
    pendingDecision,
    setPendingDecision,
  ] =
    useState<
      | "changes_requested"
      | "rejected"
      | null
    >(
      null
    );

  const [
    decisionError,
    setDecisionError,
  ] =
    useState(
      ""
    );

  const [
    decisionSaving,
    setDecisionSaving,
  ] =
    useState(
      false
    );


  useEffect(() => {
    if (
      !communicationId ||
      !variantId
    ) {
      setError(
        "Communication or selected option is missing."
      );

      setLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    async function loadPreview() {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const communication =
          await getCommunicationById(
            communicationId!
          );

        if (
          cancelled
        ) {
          return;
        }

        setCommunicationTitle(
          communication.title ||
          "Untitled Communication"
        );

        setSubcategory(
          communication.subcategory ||
          ""
        );

        setAudience(
          communication.audience ||
          ""
        );

        const resolvedCategory =
          mapDatabaseCategoryToUi(
            communication.category
          );

        if (
          resolvedCategory
        ) {
          setCategory(
            resolvedCategory
          );
        }

        /**
         * Avoid .single() coercion failures so inaccessible
         * variants become a controlled app message.
         */
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
            .eq(
              "id",
              variantId!
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .limit(
              1
            )
            .maybeSingle();

        if (
          variantError
        ) {
          throw new Error(
            variantError.message
          );
        }

        if (
          !variantRow
        ) {
          throw new Error(
            "Selected option was not found or you do not have permission to view it."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        const loadedVariant =
          variantRow as
            StoredVariant;

        setVariant(
          loadedVariant
        );

        setEditableContentData(
          loadedVariant.content_data
            ? structuredClone(
                loadedVariant.content_data
              )
            : {}
        );

        setSubject(
          loadedVariant
            .subject_lines?.[
              0
            ] ||
          ""
        );

        setPreheader(
          loadedVariant.preheader ||
          ""
        );

        const cta =
          loadedVariant.cta_data ||
          loadedVariant
            .content_data
            ?.cta ||
          {};

        setCtaEnabled(
          Boolean(
            cta.enabled
          )
        );

        setCtaText(
          cta.label ||
          ""
        );

        setCtaUrl(
          cta.url ||
          ""
        );

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
              .limit(
                1
              )
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
      } catch (
        err
      ) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "Unable to load full preview:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the selected communication option."
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

    void loadPreview();

    return () => {
      cancelled =
        true;
    };
  }, [
    communicationId,
    variantId,
    isReviewMode,
    reviewerRole,
  ]);


  async function savePreviewEdits() {
    if (
      !canEdit
    ) {
      throw new Error(
        "You do not have permission to edit this communication."
      );
    }

    if (
      !communicationId ||
      !variantId ||
      !variant
    ) {
      throw new Error(
        "Communication or selected option is missing."
      );
    }

    const nextSubjectLines = [
      subject.trim(),
      ...(
        variant.subject_lines ||
        []
      ).slice(
        1
      ),
    ].filter(
      Boolean
    );

    const nextCta = {
      enabled:
        ctaEnabled,

      label:
        ctaText.trim(),

      url:
        ctaUrl.trim(),
    };

    const nextContentData = {
      ...(
        editableContentData ||
        variant.content_data ||
        {}
      ),

      cta:
        nextCta,
    };

    const {
      data:
        updatedVariants,
      error:
        updateError,
    } =
      await supabase
        .from(
          "communication_variants"
        )
        .update({
          subject_lines:
            nextSubjectLines,

          preheader,

          cta_data:
            nextCta,

          content_data:
            nextContentData,
        })
        .eq(
          "id",
          variantId
        )
        .eq(
          "communication_id",
          communicationId
        )
        .select(
          "id"
        );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    if (
      !updatedVariants ||
      updatedVariants.length ===
        0
    ) {
      throw new Error(
        "The selected option could not be updated. You may not have permission to edit it in the current workflow stage."
      );
    }

    setVariant(
      (
        current
      ) =>
        current
          ? {
              ...current,

              subject_lines:
                nextSubjectLines,

              preheader,

              cta_data:
                nextCta,

              content_data:
                nextContentData,
            }
          : current
    );

    setEditableContentData(
      nextContentData
    );

    await updateCommunication(
      communicationId,
      {
        selected_variant_id:
          variantId,

        status:
          "preview_ready",
      }
    );

    if (
      previewDirty &&
      isCreator
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
    if (
      !canEdit
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      await savePreviewEdits();

      setSavedMessage(
        "Preview changes saved."
      );
    } catch (
      err
    ) {
      console.error(
        "Unable to save preview edits:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save preview changes."
      );
    } finally {
      setSaving(
        false
      );
    }
  }


  function buildCurrentEmailHtml() {
    return renderEmailHtml({
      category,
      subject,
      preheader,

      contentData: {
        ...(
          editableContentData ||
          variant?.content_data ||
          {}
        ),

        cta: {
          enabled:
            ctaEnabled,

          label:
            ctaText,

          url:
            ctaUrl,
        },
      },

      cta: {
        enabled:
          ctaEnabled,

        label:
          ctaText,

        url:
          ctaUrl,
      },
    });
  }


  async function handleCopyHtml() {
    try {
      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      const html =
        buildCurrentEmailHtml();

      await navigator
        .clipboard
        .writeText(
          html
        );

      setSavedMessage(
        "Email HTML copied to clipboard."
      );
    } catch (
      err
    ) {
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
      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      const html =
        buildCurrentEmailHtml();

      const blob =
        new Blob(
          [
            html,
          ],
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

      anchor.href =
        url;

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
    } catch (
      err
    ) {
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
      !canEdit ||
      !communicationId ||
      !variantId
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      await savePreviewEdits();

      navigate(
        `/create/submit?communicationId=${encodeURIComponent(
          communicationId
        )}&variantId=${encodeURIComponent(
          variantId
        )}&category=${encodeURIComponent(
          category
        )}`
      );
    } catch (
      err
    ) {
      console.error(
        "Unable to prepare approval submission:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue to approval."
      );
    } finally {
      setSaving(
        false
      );
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
    } catch (
      err
    ) {
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
      | "changes_requested"
      | "rejected"
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
    if (
      isReviewMode
    ) {
      navigate(
        "/reviews"
      );

      return;
    }

    if (
      !communicationId
    ) {
      navigate(
        "/"
      );

      return;
    }

    if (
      !isCreator
    ) {
      navigate(
        "/"
      );

      return;
    }

    navigate(
      `/create/variants?communicationId=${encodeURIComponent(
        communicationId
      )}&category=${encodeURIComponent(
        category
      )}`
    );
  }


  const liveContentData =
    useMemo(
      () => ({
        ...(
          editableContentData ||
          variant?.content_data ||
          {}
        ),

        cta: {
          enabled:
            ctaEnabled,

          label:
            ctaText,

          url:
            ctaUrl,
        },
      }),
      [
        editableContentData,
        variant,
        ctaEnabled,
        ctaText,
        ctaUrl,
      ]
    );


  const disclaimer =
    liveContentData.disclaimer;

  const compliance =
    liveContentData.compliance ||
    variant?.compliance_data;

  const complianceSummary =
    resolveCompliance(
      compliance
    );


  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            Loading selected communication...
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {isCreator && !isReviewMode && (
        <>
          <CommunicationStateBar
            title={
              communicationTitle
            }
            category={
              category
            }
            status="preview-ready"
            currentStep={
              5
            }
            totalSteps={
              5
            }
            onSaveDraft={
              canEdit
                ? handleSave
                : undefined
            }
          />

          <ProgressStepper
            currentStep={
              5
            }
          />
        </>
      )}

      <main className="mx-auto max-w-7xl px-6 py-9 sm:px-8 sm:py-10">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            saving ||
            decisionSaving
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {isReviewMode
            ? "Back to Review Queue"
            : isCreator
              ? "Back to Options"
              : "Back to Dashboard"}
        </button>


        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Sparkles
                className="h-5 w-5 text-[#07877B]"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-[#07877B]">
                {isReviewMode
                  ? "Communication Review"
                  : isRevisionMode
                    ? "Revise Communication"
                    : "Preview"}
              </p>

              <CategoryTag
                category={
                  category
                }
              />

              <StatusBadge
                status="preview-ready"
              />
            </div>

            <h1 className="text-3xl text-gray-900">
              {communicationTitle}
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              {isReviewMode
                ? "Review the exact communication submitted by the Creator. This preview is read-only; record the review decision in the panel beside it."
                : isRevisionMode
                  ? "Review the requested changes, refine the selected communication and save it before resubmitting it into the approval workflow."
                  : "Review the selected communication as the customer will receive it. Refine the editable copy while layout, brand styling and governed fields remain controlled."}
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-3">
            <ModePill
              isReviewMode={
                isReviewMode
              }
              isRevisionMode={
                isRevisionMode
              }
              isAdmin={
                isAdmin
              }
              canEdit={
                canEdit
              }
            />

            <ViewToggle
              value={
                viewMode
              }
              onChange={
                setViewMode
              }
            />
          </div>
        </header>


        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}


        {savedMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700"
          >
            {savedMessage}
          </div>
        )}


        {!variant ? (
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-gray-400" />

            <h2 className="mt-3 text-lg font-medium text-gray-900">
              Preview unavailable
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The selected communication option could not be loaded.
            </p>
          </section>
        ) : (
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
                        Option {variant.variant_key}
                      </span>

                      <span className="text-xs text-gray-400">
                        {variant.variant_name}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      Customer-facing email preview
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3.5 w-3.5" />
                    {viewMode ===
                    "desktop"
                      ? "Desktop preview"
                      : "Mobile preview"}
                  </div>
                </div>


                <div className="bg-gray-50/60 p-4 sm:p-6">
                  <div
                    className={
                      viewMode ===
                        "mobile"
                        ? "mx-auto w-full max-w-[375px]"
                        : "mx-auto w-full"
                    }
                  >
                    <EmailPreview
                      category={
                        category
                      }
                      subject={
                        subject
                      }
                      preheader={
                        preheader
                      }
                      contentData={
                        liveContentData
                      }
                      cta={{
                        enabled:
                          ctaEnabled,

                        label:
                          ctaText,

                        url:
                          ctaUrl,
                      }}
                    />
                  </div>
                </div>
              </section>


              {canEdit && (
                <div className="mt-6 space-y-6">
                  <EditableHeaderFields
                    subject={
                      subject
                    }
                    preheader={
                      preheader
                    }
                    ctaEnabled={
                      ctaEnabled
                    }
                    ctaText={
                      ctaText
                    }
                    ctaUrl={
                      ctaUrl
                    }
                    saving={
                      saving
                    }
                    dirty={
                      previewDirty
                    }
                    onSubjectChange={(
                      value
                    ) => {
                      setSubject(
                        value
                      );

                      setPreviewDirty(
                        true
                      );

                      setSavedMessage(
                        ""
                      );
                    }}
                    onPreheaderChange={(
                      value
                    ) => {
                      setPreheader(
                        value
                      );

                      setPreviewDirty(
                        true
                      );

                      setSavedMessage(
                        ""
                      );
                    }}
                    onCtaEnabledChange={(
                      value
                    ) => {
                      setCtaEnabled(
                        value
                      );

                      setPreviewDirty(
                        true
                      );

                      setSavedMessage(
                        ""
                      );
                    }}
                    onCtaTextChange={(
                      value
                    ) => {
                      setCtaText(
                        value
                      );

                      setPreviewDirty(
                        true
                      );

                      setSavedMessage(
                        ""
                      );
                    }}
                    onCtaUrlChange={(
                      value
                    ) => {
                      setCtaUrl(
                        value
                      );

                      setPreviewDirty(
                        true
                      );

                      setSavedMessage(
                        ""
                      );
                    }}
                    onSave={() =>
                      void handleSave()
                    }
                  />


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
                </div>
              )}
            </div>


            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <CommunicationSummary
                category={
                  category
                }
                subcategory={
                  subcategory
                }
                audience={
                  audience
                }
                variant={
                  variant
                }
              />


              <GovernancePanel
                disclaimer={
                  disclaimer
                }
                complianceSummary={
                  complianceSummary
                }
              />


              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyHtml()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy HTML
                </button>

                <button
                  type="button"
                  onClick={
                    handleDownloadHtml
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>


              {isReviewMode &&
              reviewerRole ? (
                <ReviewerDecisionPanel
                  reviewerRole={
                    reviewerRole
                  }
                  approvalActionId={
                    approvalActionId
                  }
                  comments={
                    reviewComments
                  }
                  pendingDecision={
                    pendingDecision
                  }
                  decisionError={
                    decisionError
                  }
                  saving={
                    decisionSaving
                  }
                  onCommentsChange={(
                    value
                  ) => {
                    setReviewComments(
                      value
                    );

                    if (
                      decisionError
                    ) {
                      setDecisionError(
                        ""
                      );
                    }
                  }}
                  onApprove={() =>
                    void handleReviewerDecision(
                      "approved"
                    )
                  }
                  onRequestChanges={() =>
                    beginReviewerDecision(
                      "changes_requested"
                    )
                  }
                  onReject={() =>
                    beginReviewerDecision(
                      "rejected"
                    )
                  }
                  onConfirm={() => {
                    if (
                      pendingDecision
                    ) {
                      void handleReviewerDecision(
                        pendingDecision
                      );
                    }
                  }}
                  onCancel={
                    cancelReviewerDecision
                  }
                  onBack={
                    handleBack
                  }
                />
              ) : canEdit ? (
                <CreatorActionPanel
                  saving={
                    saving
                  }
                  dirty={
                    previewDirty
                  }
                  isRevisionMode={
                    isRevisionMode
                  }
                  onSave={() =>
                    void handleSave()
                  }
                  onContinue={() =>
                    void handleSubmit()
                  }
                />
              ) : (
                <ReadOnlyPanel
                  isAdmin={
                    isAdmin
                  }
                />
              )}
            </aside>
          </div>
        )}


        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={
              handleBack
            }
            disabled={
              saving ||
              decisionSaving
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />

            {isReviewMode
              ? "Back to Review Queue"
              : isCreator
                ? "Back to Options"
                : "Back to Dashboard"}
          </button>
        </div>
      </main>
    </div>
  );
}


function ViewToggle({
  value,
  onChange,
}: {
  value:
    "desktop"
    | "mobile";

  onChange:
    (
      value:
        "desktop"
        | "mobile"
    ) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Preview size"
      className="flex rounded-lg border border-gray-200 bg-white p-1"
    >
      <button
        type="button"
        onClick={() =>
          onChange(
            "desktop"
          )
        }
        aria-pressed={
          value ===
          "desktop"
        }
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 ${
          value ===
          "desktop"
            ? "bg-[#07877B] text-white"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Monitor className="h-3.5 w-3.5" />
        Desktop
      </button>

      <button
        type="button"
        onClick={() =>
          onChange(
            "mobile"
          )
        }
        aria-pressed={
          value ===
          "mobile"
        }
        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-[#07877B]/10 ${
          value ===
          "mobile"
            ? "bg-[#07877B] text-white"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Smartphone className="h-3.5 w-3.5" />
        Mobile
      </button>
    </div>
  );
}


function ModePill({
  isReviewMode,
  isRevisionMode,
  isAdmin,
  canEdit,
}: {
  isReviewMode:
    boolean;

  isRevisionMode:
    boolean;

  isAdmin:
    boolean;

  canEdit:
    boolean;
}) {
  if (
    isReviewMode
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58]">
        <Lock className="h-3.5 w-3.5" />
        Read-only review
      </span>
    );
  }

  if (
    isRevisionMode
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        <RotateCcw className="h-3.5 w-3.5" />
        Revision mode
      </span>
    );
  }

  if (
    isAdmin ||
    !canEdit
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
        <Lock className="h-3.5 w-3.5" />
        Read-only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58]">
      <Check className="h-3.5 w-3.5" />
      Editable preview
    </span>
  );
}


function CommunicationSummary({
  category,
  subcategory,
  audience,
  variant,
}: {
  category:
    Category;

  subcategory:
    string;

  audience:
    string;

  variant:
    StoredVariant;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-900">
        Communication summary
      </p>

      <div className="mt-4 space-y-4">
        <MetadataRow
          icon={
            Tag
          }
          label="Category"
          value={
            getCategoryLabel(
              category
            )
          }
        />

        <MetadataRow
          icon={
            FileText
          }
          label="Subcategory"
          value={
            subcategory ||
            "—"
          }
        />

        <MetadataRow
          icon={
            Users
          }
          label="Audience"
          value={
            audience ||
            "—"
          }
        />

        <MetadataRow
          icon={
            Sparkles
          }
          label="Selected option"
          value={`Option ${variant.variant_key} · ${variant.variant_name}`}
        />
      </div>
    </section>
  );
}


function GovernancePanel({
  disclaimer,
  complianceSummary,
}: {
  disclaimer:
    VariantContentData["disclaimer"];

  complianceSummary: {
    label:
      string;

    detail:
      string;

    className:
      string;

    icon:
      typeof ShieldCheck;
  };
}) {
  const Icon =
    complianceSummary.icon;

  return (
    <section className="rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#07877B]" />

        <p className="text-sm font-medium text-gray-900">
          Governed fields
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        Layout, brand styling and disclaimer rules remain controlled by Communication Studio.
      </p>

      <div className="mt-4 space-y-3">
        <ControlledRow
          label="Layout"
          value="Controlled"
        />

        <ControlledRow
          label="Brand styling"
          value="Controlled"
        />

        <ControlledRow
          label="Disclaimer"
          value={
            disclaimer?.required
              ? (
                  disclaimer.type ||
                  "Required"
                )
              : "Not required"
          }
        />
      </div>

      <div className={`mt-4 rounded-xl px-3 py-3 ${complianceSummary.className}`}>
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="text-xs font-medium">
              {
                complianceSummary.label
              }
            </p>

            <p className="mt-1 text-xs leading-5 opacity-80">
              {
                complianceSummary.detail
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


function EditableHeaderFields({
  subject,
  preheader,
  ctaEnabled,
  ctaText,
  ctaUrl,
  saving,
  dirty,
  onSubjectChange,
  onPreheaderChange,
  onCtaEnabledChange,
  onCtaTextChange,
  onCtaUrlChange,
  onSave,
}: {
  subject:
    string;

  preheader:
    string;

  ctaEnabled:
    boolean;

  ctaText:
    string;

  ctaUrl:
    string;

  saving:
    boolean;

  dirty:
    boolean;

  onSubjectChange:
    (
      value:
        string
    ) => void;

  onPreheaderChange:
    (
      value:
        string
    ) => void;

  onCtaEnabledChange:
    (
      value:
        boolean
    ) => void;

  onCtaTextChange:
    (
      value:
        string
    ) => void;

  onCtaUrlChange:
    (
      value:
        string
    ) => void;

  onSave:
    () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Email details
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            These fields update the preview immediately.
          </p>
        </div>

        {dirty && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="space-y-4 px-6 py-6">
        <EditableField
          label="Subject Line"
          value={
            subject
          }
          onChange={
            onSubjectChange
          }
        />

        <EditableField
          label="Preheader"
          value={
            preheader
          }
          onChange={
            onPreheaderChange
          }
        />

        <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Primary CTA
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              Show the primary action in the email.
            </p>
          </div>

          <input
            type="checkbox"
            checked={
              ctaEnabled
            }
            onChange={(
              event
            ) =>
              onCtaEnabledChange(
                event.target.checked
              )
            }
            className="h-4 w-4 accent-[#07877B]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <EditableField
            label="CTA Text"
            value={
              ctaText
            }
            onChange={
              onCtaTextChange
            }
            disabled={
              !ctaEnabled
            }
          />

          <EditableField
            label="CTA URL"
            type="url"
            value={
              ctaUrl
            }
            onChange={
              onCtaUrlChange
            }
            disabled={
              !ctaEnabled
            }
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={
              onSave
            }
            disabled={
              saving ||
              !dirty
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#9bcfc9] bg-white px-4 py-2.5 text-sm font-medium text-[#075f58] transition-colors hover:bg-[#f3fbfa] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Preview Changes
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}


function CreatorActionPanel({
  saving,
  dirty,
  isRevisionMode,
  onSave,
  onContinue,
}: {
  saving:
    boolean;

  dirty:
    boolean;

  isRevisionMode:
    boolean;

  onSave:
    () => void;

  onContinue:
    () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-900">
        {isRevisionMode
          ? "Ready to complete the revision?"
          : "Ready for approval?"}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        {isRevisionMode
          ? "Save the requested changes, then continue to the approval checkpoint for resubmission."
          : "Save any final edits before moving to the approval submission checkpoint."}
      </p>

      {dirty && (
        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-3 text-xs text-amber-700">
          You have unsaved preview changes.
        </div>
      )}

      <div className="mt-5 space-y-2">
        {dirty && (
          <button
            type="button"
            onClick={
              onSave
            }
            disabled={
              saving
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#9bcfc9] bg-white px-4 py-2.5 text-sm font-medium text-[#075f58] hover:bg-[#f3fbfa] disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Save Changes
          </button>
        )}

        <button
          type="button"
          onClick={
            onContinue
          }
          disabled={
            saving
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isRevisionMode
                ? "Continue to Resubmission"
                : "Continue to Approval"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}


function ReviewerDecisionPanel({
  reviewerRole,
  approvalActionId,
  comments,
  pendingDecision,
  decisionError,
  saving,
  onCommentsChange,
  onApprove,
  onRequestChanges,
  onReject,
  onConfirm,
  onCancel,
  onBack,
}: {
  reviewerRole:
    ReviewerRole;

  approvalActionId:
    string | null;

  comments:
    string;

  pendingDecision:
    | "changes_requested"
    | "rejected"
    | null;

  decisionError:
    string;

  saving:
    boolean;

  onCommentsChange:
    (
      value:
        string
    ) => void;

  onApprove:
    () => void;

  onRequestChanges:
    () => void;

  onReject:
    () => void;

  onConfirm:
    () => void;

  onCancel:
    () => void;

  onBack:
    () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-4 w-4 text-[#07877B]" />

        <p className="text-sm font-medium text-gray-900">
          Review decision
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        {reviewerRole ===
        "marketing_reviewer"
          ? "Marketing review is the first approval stage. Approval sends the communication to CorpCom."
          : "CorpCom is the final approval stage for this communication."}
      </p>

      {!approvalActionId ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          No pending review action was found for this communication. Return to the Review Queue and refresh the workflow.
        </div>
      ) : (
        <>
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Reviewer comment
            </label>

            <textarea
              rows={
                5
              }
              value={
                comments
              }
              onChange={(
                event
              ) =>
                onCommentsChange(
                  event.target.value
                )
              }
              placeholder={
                pendingDecision ===
                  "changes_requested"
                  ? "Explain exactly what needs to be changed..."
                  : pendingDecision ===
                      "rejected"
                    ? "Add the reason for rejection..."
                    : "Optional comment for this review..."
              }
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
            />
          </div>

          {decisionError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
              {
                decisionError
              }
            </div>
          )}

          {pendingDecision ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-4 ${
                pendingDecision ===
                  "changes_requested"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  pendingDecision ===
                    "changes_requested"
                    ? "text-amber-800"
                    : "text-red-700"
                }`}
              >
                {pendingDecision ===
                  "changes_requested"
                  ? "Send back to Creator?"
                  : "Reject this communication?"}
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {pendingDecision ===
                  "changes_requested"
                  ? "The Creator will receive your comment and can revise the communication before resubmitting."
                  : "A rejection ends the current approval path for this communication."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={
                    onCancel
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    onConfirm
                  }
                  disabled={
                    saving
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                    pendingDecision ===
                      "changes_requested"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {pendingDecision ===
                    "changes_requested"
                    ? "Send Back"
                    : "Confirm Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={
                  onApprove
                }
                disabled={
                  saving
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#06766a] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {reviewerRole ===
                "marketing_reviewer"
                  ? "Approve & Send to CorpCom"
                  : "Final Approve"}
              </button>

              <button
                type="button"
                onClick={
                  onRequestChanges
                }
                disabled={
                  saving
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Request Changes
              </button>

              <button
                type="button"
                onClick={
                  onReject
                }
                disabled={
                  saving
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={
          onBack
        }
        disabled={
          saving
        }
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-600 hover:text-[#07877B] disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Review Queue
      </button>
    </section>
  );
}


function ReadOnlyPanel({
  isAdmin,
}: {
  isAdmin:
    boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-gray-500" />

        <p className="text-sm font-medium text-gray-900">
          Read-only preview
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        {isAdmin
          ? "Admin access is for oversight. Admin cannot edit or submit a Creator communication."
          : "This communication cannot be edited with your current role."}
      </p>
    </section>
  );
}


function BodyContentEditor({
  contentData,
  onChange,
}: {
  contentData:
    VariantContentData | null;

  onChange:
    (
      next:
        VariantContentData
    ) => void;
}) {
  const body =
    contentData?.body ||
    {};

  const sections =
    body.sections ||
    [];

  function updateBody(
    patch:
      Partial<
        NonNullable<
          VariantContentData["body"]
        >
      >
  ) {
    onChange({
      ...(
        contentData ||
        {}
      ),

      body: {
        ...body,
        ...patch,
      },
    });
  }


  function updateSection(
    index:
      number,
    patch:
      Partial<
        VariantSection
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

    if (
      !section
    ) {
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
    ] =
      value;

    updateSection(
      sectionIndex,
      {
        items:
          currentItems,
      }
    );
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-base font-medium text-gray-900">
          Email body content
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          Refine the generated copy. Every change updates the customer preview above.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
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
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
            >
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
                Section{" "}
                {sectionIndex +
                  1}
                {" · "}
                {formatSectionType(
                  section.type
                )}
              </p>

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
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Points
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
                              <span className="pt-2.5 text-sm text-[#07877B]">
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
                                    event.target.value
                                  )
                                }
                                className="min-h-[64px] flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
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
    </section>
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

  onChange:
    (
      value:
        string
    ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <textarea
        rows={
          4
        }
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
        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10"
      />
    </div>
  );
}


function EditableField({
  label,
  value,
  onChange,
  type =
    "text",
  disabled =
    false,
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

  type?:
    string;

  disabled?:
    boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={
          type
        }
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );
}


function MetadataRow({
  icon:
    Icon,
  label,
  value,
}: {
  icon:
    typeof Tag;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-sm leading-5 text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}


function ControlledRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="text-right font-medium text-gray-700">
        {value}
      </span>
    </div>
  );
}


function resolveCompliance(
  compliance:
    VariantContentData["compliance"] |
    StoredVariant["compliance_data"]
) {
  const status =
    compliance?.status?.toLowerCase() ||
    "unknown";

  const flags =
    compliance?.flags ||
    [];

  const notes =
    compliance?.notes ||
    [];

  const count =
    new Set([
      ...flags,
      ...notes,
    ]).size;

  if (
    status ===
    "pass"
  ) {
    return {
      label:
        "Governance check passed",

      detail:
        "No governance issues are currently flagged.",

      className:
        "bg-green-50 text-green-700",

      icon:
        CheckCircle2,
    };
  }

  if (
    status ===
      "fail"
  ) {
    return {
      label:
        "Governance issue",

      detail:
        count >
          0
          ? `${count} item${count === 1 ? "" : "s"} require review.`
          : "A governance issue has been flagged.",

      className:
        "bg-red-50 text-red-700",

      icon:
        ShieldAlert,
    };
  }

  if (
    status ===
      "warning" ||
    count >
      0
  ) {
    return {
      label:
        "Review suggested",

      detail:
        count >
          0
          ? `${count} item${count === 1 ? "" : "s"} should be reviewed.`
          : "A governance warning is present.",

      className:
        "bg-amber-50 text-amber-700",

      icon:
        ShieldAlert,
    };
  }

  return {
    label:
      "Governance status",

    detail:
      "No additional governance status is available.",

    className:
      "bg-gray-100 text-gray-600",

    icon:
      ShieldCheck,
  };
}


function formatSectionType(
  type:
    VariantSection["type"]
) {
  switch (
    type
  ) {
    case "text":
      return "Text";

    case "bullets":
      return "Key points";

    case "snapshot":
      return "Snapshot";

    case "highlight":
      return "Highlight";

    case "steps":
      return "Steps";

    case "timeline":
      return "Timeline";

    case "note":
      return "Note";
  }
}


function slugify(
  value:
    string
) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "geojit-communication"
  );
}


function getCategoryLabel(
  category:
    Category
) {
  switch (
    category
  ) {
    case "research":
      return "Fundamental Research";

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
  value:
    string | null
):
  Category | null {
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
      return null;
  }
}
