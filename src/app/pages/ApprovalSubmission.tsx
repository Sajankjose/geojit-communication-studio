import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
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
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
  getExistingPendingApproval,
  submitCommunicationForApproval,
} from "../services/approvals";

import {
  supabase,
} from "../../lib/supabase";


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
  id:
    string;

  stage:
    string;

  action:
    string;

  comments:
    string | null;

  created_at:
    string;
}


interface StoredVariant {
  id:
    string;

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

  content_data: {
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
  } | null;
}


type ChecklistKey =
  | "content"
  | "cta"
  | "data"
  | "attachments";


export function ApprovalSubmission() {
  const navigate =
    useNavigate();

  const {
    profile,
    loading:
      authLoading,
  } =
    useAuth();

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
    ) as
      | Category
      | null;

  const isReviewer =
    profile?.role ===
      "marketing_reviewer" ||
    profile?.role ===
      "corpcom_reviewer";

  const isCreator =
    profile?.role ===
    "creator";

  const isAdmin =
    profile?.role ===
    "admin";

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
    checklist,
    setChecklist,
  ] =
    useState<
      Record<
        ChecklistKey,
        boolean
      >
    >({
      content:
        false,

      cta:
        false,

      data:
        false,

      attachments:
        false,
    });

  const [
    note,
    setNote,
  ] =
    useState(
      ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

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
    useState(
      ""
    );

  const [
    latestApprovalAction,
    setLatestApprovalAction,
  ] =
    useState(
      ""
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const allChecked =
    Object.values(
      checklist
    ).every(
      Boolean
    );


  /**
   * Reviewers should never use the Creator
   * submission checkpoint.
   */
  useEffect(() => {
    if (
      !authLoading &&
      isReviewer
    ) {
      navigate(
        "/reviews",
        {
          replace:
            true,
        }
      );
    }
  }, [
    authLoading,
    isReviewer,
    navigate,
  ]);


  useEffect(() => {
    if (
      authLoading ||
      isReviewer
    ) {
      return;
    }

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

    async function loadSubmission() {
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
         * Avoid .single() coercion errors so a missing
         * or inaccessible variant becomes a controlled
         * application message.
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

        setVariant(
          variantRow as
            StoredVariant
        );


        /**
         * Approval actions form the audit trail.
         * Read them only to describe the current
         * approval checkpoint on this page.
         */
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
              comments,
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

        if (
          approvalError
        ) {
          throw new Error(
            approvalError.message
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        const rows =
          (
            approvalRows ||
            []
          ) as
            ApprovalActionRow[];

        const resolvedStage =
          resolveApprovalStage(
            rows
          );

        setApprovalStage(
          resolvedStage
        );

        const latestRow =
          [
            ...rows,
          ]
            .sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            )[
              0
            ];

        setLatestApprovalAction(
          latestRow?.action ||
          ""
        );

        const latestComment =
          [
            ...rows,
          ]
            .reverse()
            .find(
              (
                row
              ) =>
                Boolean(
                  row.comments?.trim()
                )
            )
            ?.comments ||
          "";

        setLatestApprovalComment(
          latestComment
        );
      } catch (
        err
      ) {
        if (
          cancelled
        ) {
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
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadSubmission();

    return () => {
      cancelled =
        true;
    };
  }, [
    authLoading,
    isReviewer,
    communicationId,
    variantId,
  ]);


  const isSubmitted =
    approvalStage !==
    "not_submitted";


  const stagePresentation =
    useMemo(
      () =>
        getApprovalStagePresentation(
          approvalStage,
          latestApprovalAction
        ),
      [
        approvalStage,
        latestApprovalAction,
      ]
    );


  const compliance =
    variant
      ?.content_data
      ?.compliance ||
    variant
      ?.compliance_data;


  const complianceSummary =
    resolveCompliance(
      compliance
    );


  const cta =
    variant?.cta_data;


  function toggleCheck(
    key:
      ChecklistKey
  ) {
    if (
      !isCreator ||
      isSubmitted
    ) {
      return;
    }

    setChecklist(
      (
        current
      ) => ({
        ...current,

        [key]:
          !current[
            key
          ],
      })
    );

    setError(
      ""
    );
  }


  async function handleSubmit() {
    if (
      !isCreator
    ) {
      setError(
        "Only the Creator can submit this communication for approval."
      );

      return;
    }

    const isRevisionResubmission =
      approvalStage ===
      "changes_requested";

    if (
      !communicationId ||
      !variantId ||
      (
        !isRevisionResubmission &&
        !allChecked
      ) ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(
        true
      );

      setError(
        ""
      );


      /**
       * Prevent accidental duplicate pending approvals.
       * The service/database should also protect this,
       * but this gives the Creator a cleaner UX.
       */
      const existing =
        await getExistingPendingApproval(
          communicationId
        );

      if (
        existing
      ) {
        navigate(
          `/approval/status?communicationId=${encodeURIComponent(
            communicationId
          )}`,
          {
            replace:
              true,
          }
        );

        return;
      }


      /**
       * Keep the selected variant attached
       * to the communication.
       */
      await updateCommunication(
        communicationId,
        {
          selected_variant_id:
            variantId,
        }
      );


      /**
       * Creator -> Marketing review.
       *
       * After Marketing approval the workflow
       * advances to CorpCom.
       */
      await submitCommunicationForApproval({
        communicationId,

        comments:
          note.trim(),
      });


      /**
       * Keep the parent communication in the
       * canonical pending approval state.
       */
      await updateCommunication(
        communicationId,
        {
          status:
            "pending_approval",
        }
      );


      navigate(
        `/approval/status?communicationId=${encodeURIComponent(
          communicationId
        )}`,
        {
          replace:
            true,
        }
      );
    } catch (
      err
    ) {
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
      setSubmitting(
        false
      );
    }
  }


  function handleBack() {
    if (
      !communicationId ||
      !variantId
    ) {
      navigate(
        "/"
      );

      return;
    }

    navigate(
      `/create/preview?communicationId=${encodeURIComponent(
        communicationId
      )}&variantId=${encodeURIComponent(
        variantId
      )}&category=${encodeURIComponent(
        category
      )}${
        approvalStage ===
        "changes_requested"
          ? "&mode=revision"
          : ""
      }`
    );
  }


  function handleOpenApprovalStatus() {
    if (
      !communicationId
    ) {
      navigate(
        "/"
      );

      return;
    }

    navigate(
      `/approval/status?communicationId=${encodeURIComponent(
        communicationId
      )}`
    );
  }


  if (
    authLoading ||
    isReviewer ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />

            {isReviewer
              ? "Returning to Review Queue..."
              : "Preparing approval checkpoint..."}
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {isCreator && (
        <>
          <CommunicationStateBar
            title={
              communicationTitle
            }
            category={
              category
            }
            status={
              getCommunicationBarStatus(
                approvalStage
              )
            }
            currentStep={
              5
            }
            totalSteps={
              5
            }
          />

          <ProgressStepper
            currentStep={
              5
            }
          />
        </>
      )}


      <main className="mx-auto max-w-6xl px-6 py-9 sm:px-8 sm:py-10">
        <button
          type="button"
          onClick={
            isSubmitted &&
            approvalStage !==
              "changes_requested"
              ? () =>
                  navigate(
                    "/"
                  )
              : handleBack
          }
          disabled={
            submitting
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />

          {isSubmitted &&
          approvalStage !==
            "changes_requested"
            ? "Back to Dashboard"
            : approvalStage ===
                "changes_requested"
              ? "Back to Revision"
              : "Back to Preview"}
        </button>


        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Send
                className="h-5 w-5 text-[#07877B]"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-[#07877B]">
                {isAdmin
                  ? "Approval Oversight"
                  : "Approval Checkpoint"}
              </p>

              <CategoryTag
                category={
                  category
                }
                size="sm"
              />
            </div>

            <h1 className="text-3xl text-gray-900">
              {stagePresentation.title}
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              {stagePresentation.description}
            </p>
          </div>


          <WorkflowPill
            stage={
              approvalStage
            }
          />
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


        {isAdmin &&
          approvalStage ===
            "not_submitted" && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />

              <div>
                <p className="text-sm font-medium text-gray-800">
                  Admin oversight only
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Admin can inspect this checkpoint and workflow status, but cannot
                  submit or approve the communication. Only the Creator can submit it into review.
                </p>
              </div>
            </div>
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
            latestAction={
              latestApprovalAction
            }
          />
        )}


        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
                <p className="text-sm font-medium text-gray-900">
                  Communication summary
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  This is the selected communication that will enter the formal review workflow.
                </p>
              </div>

              <div className="divide-y divide-gray-100 px-6 sm:px-7">
                <SummaryRow
                  label="Communication name"
                  value={
                    communicationTitle
                  }
                />

                <SummaryRow
                  label="Category"
                >
                  <CategoryTag
                    category={
                      category
                    }
                    size="sm"
                  />
                </SummaryRow>

                <SummaryRow
                  label="Selected option"
                  value={
                    variant
                      ? `Option ${variant.variant_key} · ${variant.variant_name}`
                      : "—"
                  }
                />

                <SummaryRow
                  label="Subject line"
                  value={
                    variant
                      ?.subject_lines?.[
                        0
                      ] ||
                    "—"
                  }
                />

                <SummaryRow
                  label="Audience"
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
                  label="Governance check"
                >
                  <CompliancePill
                    summary={
                      complianceSummary
                    }
                  />
                </SummaryRow>
              </div>
            </section>


            {approvalStage ===
              "not_submitted" && (
              <>
                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Creator confirmation
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Confirm the source facts and final communication before it leaves Creator control.
                        </p>
                      </div>

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          allChecked
                            ? "bg-[#07877B] text-white"
                            : "bg-[#e8f5f4] text-[#07877B]"
                        }`}
                      >
                        {allChecked ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-semibold">
                            {Object.values(
                              checklist
                            ).filter(
                              Boolean
                            ).length}
                            /4
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 px-6 sm:px-7">
                    <ChecklistItem
                      checked={
                        checklist.content
                      }
                      disabled={
                        !isCreator
                      }
                      onChange={() =>
                        toggleCheck(
                          "content"
                        )
                      }
                      title="Content and intended meaning reviewed"
                      description="The communication accurately reflects the intended message and has been reviewed as a complete customer-facing communication."
                    />

                    <ChecklistItem
                      checked={
                        checklist.cta
                      }
                      disabled={
                        !isCreator
                      }
                      onChange={() =>
                        toggleCheck(
                          "cta"
                        )
                      }
                      title="CTA verified"
                      description="CTA wording and destination have been checked where a CTA is used."
                    />

                    <ChecklistItem
                      checked={
                        checklist.data
                      }
                      disabled={
                        !isCreator
                      }
                      onChange={() =>
                        toggleCheck(
                          "data"
                        )
                      }
                      title="Source facts verified"
                      description="Prices, dates, figures, recommendations and other factual inputs have been checked against the source."
                    />

                    <ChecklistItem
                      checked={
                        checklist.attachments
                      }
                      disabled={
                        !isCreator
                      }
                      onChange={() =>
                        toggleCheck(
                          "attachments"
                        )
                      }
                      title="Supporting material checked"
                      description="Any relevant report, circular, attachment or source link has been verified where applicable."
                    />
                  </div>
                </section>


                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-[#07877B]" />

                      <p className="text-sm font-medium text-gray-900">
                        Note to Marketing
                      </p>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Optional. Add context that may help the Marketing reviewer understand the communication.
                    </p>
                  </div>

                  <div className="px-6 py-5 sm:px-7">
                    <textarea
                      rows={
                        4
                      }
                      value={
                        note
                      }
                      disabled={
                        !isCreator
                      }
                      onChange={(
                        event
                      ) =>
                        setNote(
                          event.target.value
                        )
                      }
                      placeholder="Add a short note for the Marketing reviewer..."
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </section>
              </>
            )}


            {approvalStage ===
              "changes_requested" && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/50 px-6 py-5 sm:px-7">
                <div className="flex items-start gap-3">
                  <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Revise before resubmitting
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Open the selected communication in Revision Mode, make and save the requested changes,
                      then return here to resubmit it to Marketing.
                    </p>

                    {latestApprovalComment && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-amber-600">
                          Reviewer comment
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-700">
                          {latestApprovalComment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>


          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <ApprovalWorkflow
              stage={
                approvalStage
              }
            />


            {approvalStage ===
              "not_submitted" && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-medium text-gray-900">
                  Ready to submit?
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Once submitted, this version enters formal review.
                  Marketing reviews first; approved communications then move to CorpCom.
                </p>

                {!allChecked &&
                  isCreator && (
                  <div className="mt-4 rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-700">
                    Complete all four Creator confirmations to enable submission.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleSubmit()
                  }
                  disabled={
                    !isCreator ||
                    !allChecked ||
                    submitting
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit to Marketing
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    submitting
                  }
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Preview
                </button>
              </section>
            )}


            {approvalStage ===
              "changes_requested" && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-medium text-gray-900">
                  Revision actions
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Save the requested changes in Preview before resubmitting.
                </p>

                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    submitting
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#9bcfc9] bg-white px-4 py-2.5 text-sm font-medium text-[#075f58] transition-colors hover:bg-[#f3fbfa] disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revise Communication
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSubmit()
                  }
                  disabled={
                    !isCreator ||
                    submitting
                  }
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Resubmit to Marketing
                    </>
                  )}
                </button>
              </section>
            )}


            {isSubmitted &&
              approvalStage !==
                "changes_requested" && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-medium text-gray-900">
                  Follow the review
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Approval Status shows the current stage and complete review history.
                </p>

                <button
                  type="button"
                  onClick={
                    handleOpenApprovalStatus
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#06766a]"
                >
                  View Approval Status
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/"
                    )
                  }
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Return to Dashboard
                </button>
              </section>
            )}
          </aside>
        </div>


        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={
              isSubmitted &&
              approvalStage !==
                "changes_requested"
                ? () =>
                    navigate(
                      "/"
                    )
                : handleBack
            }
            disabled={
              submitting
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />

            {isSubmitted &&
            approvalStage !==
              "changes_requested"
              ? "Back to Dashboard"
              : "Back"}
          </button>
        </div>
      </main>
    </div>
  );
}


function ApprovalWorkflow({
  stage,
}: {
  stage:
    ApprovalStage;
}) {
  const marketingState =
    getWorkflowState(
      "marketing",
      stage
    );

  const corpcomState =
    getWorkflowState(
      "corpcom",
      stage
    );

  return (
    <section className="rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#07877B]" />

        <p className="text-sm font-medium text-gray-900">
          Approval workflow
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        Human review happens in two stages.
      </p>

      <div className="mt-5 space-y-0">
        <WorkflowStep
          number="01"
          title="Marketing Review"
          helper="Content quality, positioning and communication fit."
          state={
            marketingState
          }
          connected
        />

        <WorkflowStep
          number="02"
          title="CorpCom Review"
          helper="Final brand and corporate communication approval."
          state={
            corpcomState
          }
        />
      </div>

      <div className="mt-4 border-t border-[#d8ebe8] pt-4">
        <p className="text-xs leading-5 text-gray-600">
          Anybody can create. Publishing remains controlled through the approval workflow.
        </p>
      </div>
    </section>
  );
}


function WorkflowStep({
  number,
  title,
  helper,
  state,
  connected =
    false,
}: {
  number:
    string;

  title:
    string;

  helper:
    string;

  state:
    "complete"
    | "active"
    | "pending"
    | "stopped";

  connected?:
    boolean;
}) {
  const complete =
    state ===
    "complete";

  const active =
    state ===
    "active";

  const stopped =
    state ===
    "stopped";

  return (
    <div className="grid grid-cols-[30px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ${
            complete
              ? "border-[#07877B] bg-[#07877B] text-white"
              : active
                ? "border-[#07877B] bg-white text-[#07877B]"
                : stopped
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          {complete ? (
            <Check className="h-3.5 w-3.5" />
          ) : stopped ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            number
          )}
        </div>

        {connected && (
          <div
            className={`min-h-[58px] w-px ${
              complete
                ? "bg-[#bfe4df]"
                : "bg-gray-200"
            }`}
          />
        )}
      </div>

      <div className="pb-5">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium ${
              complete
                ? "text-gray-800"
                : active
                  ? "text-[#075f58]"
                  : stopped
                    ? "text-amber-800"
                    : "text-gray-500"
            }`}
          >
            {title}
          </p>

          {active && (
            <span className="rounded-full bg-[#e8f5f4] px-2 py-0.5 text-[10px] font-medium text-[#075f58]">
              Current
            </span>
          )}

          {complete && (
            <span className="text-[10px] font-medium text-[#07877B]">
              Approved
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {helper}
        </p>
      </div>
    </div>
  );
}


function ChecklistItem({
  checked,
  disabled,
  onChange,
  title,
  description,
}: {
  checked:
    boolean;

  disabled:
    boolean;

  onChange:
    () => void;

  title:
    string;

  description:
    string;
}) {
  return (
    <label
      className={`flex items-start gap-4 py-5 ${
        disabled
          ? "cursor-default"
          : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        disabled={
          disabled
        }
        onClick={
          onChange
        }
        aria-pressed={
          checked
        }
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked
            ? "border-[#07877B] bg-[#07877B]"
            : "border-gray-300 bg-white"
        } disabled:cursor-default`}
      >
        {checked && (
          <Check className="h-3.5 w-3.5 text-white" />
        )}
      </button>

      <div>
        <p className="text-sm font-medium text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </label>
  );
}


function ApprovalStageBanner({
  stage,
  latestComment,
  latestAction,
}: {
  stage:
    ApprovalStage;

  latestComment:
    string;

  latestAction:
    string;
}) {
  const presentation =
    getApprovalStagePresentation(
      stage,
      latestAction
    );

  const config =
    getStageBannerConfig(
      stage
    );

  const Icon =
    config.icon;

  return (
    <section
      className={`mb-7 rounded-2xl border px-5 py-5 sm:px-6 ${config.wrapper}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconBackground}`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>

        <div className="min-w-0">
          <p className={`text-sm font-medium ${config.title}`}>
            {
              presentation.bannerTitle
            }
          </p>

          <p className={`mt-1 text-sm leading-6 ${config.body}`}>
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
              <div className="mt-4 rounded-xl border border-black/5 bg-white px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
                  Reviewer comment
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {latestComment}
                </p>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}


function WorkflowPill({
  stage,
}: {
  stage:
    ApprovalStage;
}) {
  switch (
    stage
  ) {
    case "not_submitted":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58]">
          <FileCheck2 className="h-3.5 w-3.5" />
          Creator confirmation
        </span>
      );

    case "marketing_pending":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
          <Clock3 className="h-3.5 w-3.5" />
          Marketing review
        </span>
      );

    case "corpcom_pending":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
          <Clock3 className="h-3.5 w-3.5" />
          CorpCom review
        </span>
      );

    case "approved":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </span>
      );

    case "changes_requested":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <RotateCcw className="h-3.5 w-3.5" />
          Changes requested
        </span>
      );

    case "rejected":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );
  }
}


function SummaryRow({
  label,
  value,
  children,
}: {
  label:
    string;

  value?:
    string;

  children?:
    ReactNode;
}) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
      <span className="text-xs font-medium text-gray-500">
        {label}
      </span>

      <div className="text-sm leading-6 text-gray-800">
        {children ||
          value ||
          "—"}
      </div>
    </div>
  );
}


function CompliancePill({
  summary,
}: {
  summary: {
    label:
      string;

    className:
      string;

    icon:
      typeof ShieldCheck;
  };
}) {
  const Icon =
    summary.icon;

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${summary.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {
        summary.label
      }
    </span>
  );
}


function resolveCompliance(
  compliance:
    | {
        status?: string;
        flags?: string[];
        notes?: string[];
      }
    | null
    | undefined
) {
  const status =
    compliance?.status?.toLowerCase() ||
    "unknown";

  const count =
    new Set([
      ...(
        compliance?.flags ||
        []
      ),
      ...(
        compliance?.notes ||
        []
      ),
    ]).size;

  if (
    status ===
    "pass"
  ) {
    return {
      label:
        "Governance check passed",

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
        count >
          0
          ? `${count} governance issue${count === 1 ? "" : "s"}`
          : "Governance issue",

      className:
        "bg-red-50 text-red-700",

      icon:
        AlertCircle,
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
        count >
          0
          ? `${count} item${count === 1 ? "" : "s"} to review`
          : "Review suggested",

      className:
        "bg-amber-50 text-amber-700",

      icon:
        AlertCircle,
    };
  }

  return {
    label:
      "No governance flag",

    className:
      "bg-gray-100 text-gray-600",

    icon:
      ShieldCheck,
  };
}


function resolveApprovalStage(
  rows:
    ApprovalActionRow[]
):
  ApprovalStage {
  if (
    rows.length ===
    0
  ) {
    return "not_submitted";
  }

  /**
   * Approval history is an audit trail.
   * Current stage is derived from the latest event,
   * so an older changes_requested record never
   * overrides a newer resubmission.
   */
  const latest =
    [
      ...rows,
    ]
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      )[
        0
      ];

  if (
    !latest
  ) {
    return "not_submitted";
  }

  if (
    latest.action ===
    "rejected"
  ) {
    return "rejected";
  }

  if (
    latest.action ===
    "changes_requested"
  ) {
    return "changes_requested";
  }

  if (
    latest.stage ===
      "marketing_review" &&
    (
      latest.action ===
        "submitted" ||
      latest.action ===
        "resubmitted"
    )
  ) {
    return "marketing_pending";
  }

  if (
    latest.stage ===
      "marketing_review" &&
    latest.action ===
      "approved"
  ) {
    return "corpcom_pending";
  }

  if (
    latest.stage ===
      "corpcom_review" &&
    latest.action ===
      "submitted"
  ) {
    return "corpcom_pending";
  }

  if (
    latest.stage ===
      "corpcom_review" &&
    latest.action ===
      "approved"
  ) {
    return "approved";
  }

  if (
    latest.stage ===
      "approved" ||
    latest.action ===
      "approved"
  ) {
    return "approved";
  }

  return "marketing_pending";
}


function getApprovalStagePresentation(
  stage:
    ApprovalStage,
  latestAction =
    ""
) {
  switch (
    stage
  ) {
    case "marketing_pending":
      if (
        latestAction ===
        "resubmitted"
      ) {
        return {
          title:
            "Revised communication submitted",

          description:
            "The requested changes have been completed and the revised communication is back with Marketing for review.",

          bannerTitle:
            "Awaiting Marketing review",

          bannerDescription:
            "The revised communication has re-entered the approval workflow. No further Creator action is required unless another change is requested.",
        };
      }

      return {
        title:
          "Communication submitted",

        description:
          "The selected communication is now with Marketing for the first review stage.",

        bannerTitle:
          "Awaiting Marketing review",

        bannerDescription:
          "Marketing can approve, request changes or reject the communication. Approval moves it to CorpCom.",
      };

    case "corpcom_pending":
      return {
        title:
          "Marketing approved",

        description:
          "The communication has completed Marketing review and is now waiting for final CorpCom approval.",

        bannerTitle:
          "Awaiting final CorpCom review",

        bannerDescription:
          "Marketing approval is complete. CorpCom is the final approval stage before the communication can move forward.",
      };

    case "approved":
      return {
        title:
          "Communication approved",

        description:
          "Marketing and CorpCom reviews are complete.",

        bannerTitle:
          "Final approval completed",

        bannerDescription:
          "The communication has completed the governed approval workflow and is ready for the next publishing or delivery step.",
      };

    case "changes_requested":
      return {
        title:
          "Changes requested",

        description:
          "A reviewer has returned this communication to the Creator for revision.",

        bannerTitle:
          "Reviewer requested changes",

        bannerDescription:
          "Review the comment, update the selected communication in Revision Mode and resubmit it to Marketing.",
      };

    case "rejected":
      return {
        title:
          "Communication rejected",

        description:
          "A reviewer has stopped this communication in the current approval workflow.",

        bannerTitle:
          "Approval rejected",

        bannerDescription:
          "Review the reviewer comment before deciding whether a new communication should be created.",
      };

    default:
      return {
        title:
          "Ready to submit for approval",

        description:
          "Confirm the final communication and source facts before sending it to Marketing. CorpCom follows after Marketing approval.",

        bannerTitle:
          "",

        bannerDescription:
          "",
      };
  }
}


function getStageBannerConfig(
  stage:
    ApprovalStage
) {
  switch (
    stage
  ) {
    case "approved":
      return {
        wrapper:
          "border-green-200 bg-green-50/50",

        iconBackground:
          "bg-green-100",

        iconColor:
          "text-green-600",

        title:
          "text-green-900",

        body:
          "text-green-700",

        icon:
          CheckCircle2,
      };

    case "rejected":
      return {
        wrapper:
          "border-red-200 bg-red-50/50",

        iconBackground:
          "bg-red-100",

        iconColor:
          "text-red-600",

        title:
          "text-red-900",

        body:
          "text-red-700",

        icon:
          XCircle,
      };

    case "changes_requested":
      return {
        wrapper:
          "border-amber-200 bg-amber-50/50",

        iconBackground:
          "bg-amber-100",

        iconColor:
          "text-amber-600",

        title:
          "text-amber-900",

        body:
          "text-amber-700",

        icon:
          RotateCcw,
      };

    default:
      return {
        wrapper:
          "border-blue-200 bg-blue-50/40",

        iconBackground:
          "bg-blue-100",

        iconColor:
          "text-blue-600",

        title:
          "text-blue-900",

        body:
          "text-blue-700",

        icon:
          Clock3,
      };
  }
}


function getWorkflowState(
  step:
    "marketing"
    | "corpcom",
  stage:
    ApprovalStage
):
  | "complete"
  | "active"
  | "pending"
  | "stopped" {
  if (
    step ===
    "marketing"
  ) {
    switch (
      stage
    ) {
      case "marketing_pending":
        return "active";

      case "corpcom_pending":
      case "approved":
        return "complete";

      case "changes_requested":
      case "rejected":
        return "stopped";

      default:
        return "pending";
    }
  }

  switch (
    stage
  ) {
    case "corpcom_pending":
      return "active";

    case "approved":
      return "complete";

    case "rejected":
      return "stopped";

    default:
      return "pending";
  }
}


function getCommunicationBarStatus(
  stage:
    ApprovalStage
) {
  switch (
    stage
  ) {
    case "approved":
      return "approved";

    case "changes_requested":
      return "changes-requested";

    case "rejected":
      return "rejected";

    case "marketing_pending":
    case "corpcom_pending":
      return "pending-approval";

    default:
      return "preview-ready";
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
