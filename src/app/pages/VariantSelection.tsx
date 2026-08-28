import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
  supabase,
} from "../../lib/supabase";


type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";


type VariantKey =
  | "A"
  | "B"
  | "C";


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
    VariantKey;

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


const VARIANT_FALLBACKS:
  Record<
    VariantKey,
    {
      title:
        string;

      helper:
        string;
    }
  > = {
    A: {
      title:
        "Clarity First",

      helper:
        "Direct, highly scannable and fact-led.",
    },

    B: {
      title:
        "Balanced",

      helper:
        "Clear structure with a little more context.",
    },

    C: {
      title:
        "Engagement Led",

      helper:
        "More reader-oriented while preserving the same facts.",
    },
  };


export function VariantSelection() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const urlCategory =
    searchParams.get(
      "category"
    ) as
      | Category
      | null;

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
    variants,
    setVariants,
  ] =
    useState<
      StoredVariant[]
    >([]);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] =
    useState<
      string | null
    >(null);

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

    async function loadVariants() {
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
          "New Communication"
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

        const {
          data:
            variantRows,
          error:
            variantsError,
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
              "communication_id",
              communicationId!
            )
            .order(
              "variant_key",
              {
                ascending:
                  true,
              }
            );

        if (
          variantsError
        ) {
          throw new Error(
            variantsError.message
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        const loadedVariants =
          (
            variantRows ||
            []
          ) as
            StoredVariant[];

        setVariants(
          loadedVariants
        );

        const savedSelection =
          communication.selected_variant_id &&
          loadedVariants.some(
            (
              variant
            ) =>
              variant.id ===
              communication.selected_variant_id
          )
            ? communication.selected_variant_id
            : loadedVariants.find(
                (
                  variant
                ) =>
                  variant.is_selected
              )?.id ||
              null;

        setSelectedVariantId(
          savedSelection
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
          "Unable to load communication variants:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the generated communication options."
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

    void loadVariants();

    return () => {
      cancelled =
        true;
    };
  }, [
    communicationId,
  ]);


  const selectedVariant =
    useMemo(
      () =>
        variants.find(
          (
            variant
          ) =>
            variant.id ===
            selectedVariantId
        ) ||
        null,
      [
        variants,
        selectedVariantId,
      ]
    );


  function handleBack() {
    if (
      !communicationId
    ) {
      navigate(
        "/"
      );

      return;
    }

    navigate(
      `/create/form?communicationId=${encodeURIComponent(
        communicationId
      )}&category=${encodeURIComponent(
        category
      )}`
    );
  }


  async function handleContinue() {
    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing."
      );

      return;
    }

    if (
      !selectedVariantId
    ) {
      setError(
        "Please choose one communication option before continuing."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      /**
       * Keep only one selected variant for the communication.
       */
      const {
        error:
          clearSelectionError,
      } =
        await supabase
          .from(
            "communication_variants"
          )
          .update({
            is_selected:
              false,
          })
          .eq(
            "communication_id",
            communicationId
          );

      if (
        clearSelectionError
      ) {
        throw new Error(
          clearSelectionError.message
        );
      }

      const {
        data:
          selectedRows,
        error:
          selectVariantError,
      } =
        await supabase
          .from(
            "communication_variants"
          )
          .update({
            is_selected:
              true,
          })
          .eq(
            "id",
            selectedVariantId
          )
          .eq(
            "communication_id",
            communicationId
          )
          .select(
            "id"
          );

      if (
        selectVariantError
      ) {
        throw new Error(
          selectVariantError.message
        );
      }

      if (
        !selectedRows ||
        selectedRows.length ===
          0
      ) {
        throw new Error(
          "The selected communication option could not be saved."
        );
      }

      await updateCommunication(
        communicationId,
        {
          selected_variant_id:
            selectedVariantId,

          status:
            "variant_selected",
        }
      );

      navigate(
        `/create/preview?communicationId=${encodeURIComponent(
          communicationId
        )}&variantId=${encodeURIComponent(
          selectedVariantId
        )}&category=${encodeURIComponent(
          category
        )}`
      );
    } catch (
      err
    ) {
      console.error(
        "Unable to save selected communication variant:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the selected communication option."
      );
    } finally {
      setSaving(
        false
      );
    }
  }


  if (
    loading
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            Loading communication options...
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={
          communicationTitle
        }
        category={
          category
        }
        status="generated"
        currentStep={
          4
        }
        totalSteps={
          5
        }
      />

      <ProgressStepper
        currentStep={
          4
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-12">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            saving
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Input
        </button>


        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#07877B]" />

              <p className="text-sm font-medium text-[#07877B]">
                AI-generated options
              </p>
            </div>

            <h1 className="text-3xl text-gray-900">
              Choose the version you want to refine
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              Each option uses the same source information, but changes the
              communication approach, information hierarchy and level of
              explanation. Choose one to open in Full Preview.
            </p>
          </div>

          <div className="flex items-center gap-3 lg:pb-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                selectedVariant
                  ? "bg-[#07877B] text-white"
                  : "bg-[#e8f5f4] text-[#07877B]"
              }`}
            >
              {selectedVariant ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-semibold">
                  {variants.length}
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedVariant
                  ? `Variant ${selectedVariant.variant_key} selected`
                  : `${variants.length} options available`}
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                {selectedVariant
                  ? "Ready to continue"
                  : "Choose one option to continue"}
              </p>
            </div>
          </div>
        </header>


        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {variants.length ===
        0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <Sparkles className="h-5 w-5 text-gray-500" />
            </div>

            <h2 className="mt-4 text-lg font-medium text-gray-900">
              No generated options found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Return to the input screen and generate the communication options again.
            </p>

            <button
              type="button"
              onClick={
                handleBack
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Input
            </button>
          </section>
        ) : (
          <>
            <section
              className={`grid gap-5 ${
                variants.length ===
                2
                  ? "lg:grid-cols-2"
                  : "lg:grid-cols-3"
              }`}
            >
              {variants.map(
                (
                  variant
                ) => {
                  const selected =
                    variant.id ===
                    selectedVariantId;

                  return (
                    <VariantCard
                      key={
                        variant.id
                      }
                      variant={
                        variant
                      }
                      selected={
                        selected
                      }
                      onSelect={() => {
                        setSelectedVariantId(
                          variant.id
                        );

                        setError(
                          ""
                        );
                      }}
                    />
                  );
                }
              )}
            </section>


            <section className="mt-7 rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] px-6 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e2f3f0] text-[#07877B]">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Same facts. Different communication approaches.
                  </p>

                  <p className="mt-1 max-w-4xl text-sm leading-6 text-gray-600">
                    Variants should differ in structure, emphasis and level of
                    explanation—not in factual meaning. Full Preview is where you
                    can review and refine the selected version before approval.
                  </p>
                </div>
              </div>
            </section>


            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <p className="text-xs text-gray-500 sm:text-right">
                    Next: review and refine the selected communication
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void handleContinue()
                    }
                    disabled={
                      !selectedVariantId ||
                      saving
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving selection...
                      </>
                    ) : (
                      <>
                        Continue to Full Preview
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


function VariantCard({
  variant,
  selected,
  onSelect,
}: {
  variant:
    StoredVariant;

  selected:
    boolean;

  onSelect:
    () => void;
}) {
  const fallback =
    VARIANT_FALLBACKS[
      variant.variant_key
    ];

  const title =
    variant.variant_name?.trim() ||
    fallback.title;

  const strategy =
    variant.content_data?.strategy?.trim() ||
    fallback.helper;

  const compliance =
    resolveCompliance(
      variant
    );

  const cta =
    variant.cta_data ||
    variant.content_data?.cta ||
    null;

  const previewPoints =
    getPreviewPoints(
      variant.content_data
    );

  return (
    <article
      className={`flex min-h-[640px] flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
        selected
          ? "border-[#07877B] shadow-[0_0_0_3px_rgba(7,135,123,0.08)]"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#07877B]">
                Variant {variant.variant_key}
              </span>

              {selected && (
                <span className="rounded-full bg-[#e8f5f4] px-2 py-0.5 text-[11px] font-medium text-[#075f58]">
                  Selected
                </span>
              )}
            </div>

            <h2 className="mt-2 text-xl font-medium text-gray-900">
              {title}
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {strategy}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onSelect
            }
            aria-label={`Select Variant ${variant.variant_key}`}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
              selected
                ? "border-[#07877B] bg-[#07877B]"
                : "border-gray-300 bg-white hover:border-[#07877B]"
            }`}
          >
            {selected && (
              <Check className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>


      <div className="mx-5 border-t border-gray-100 sm:mx-6" />


      <div className="flex-1 px-5 py-5 sm:px-6">
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <PreviewMeta
            label="Subject"
            value={
              variant.subject_lines?.[
                0
              ] ||
              "No subject line"
            }
          />

          {variant.preheader && (
            <div className="mt-3">
              <PreviewMeta
                label="Preheader"
                value={
                  variant.preheader
                }
              />
            </div>
          )}
        </div>


        {variant.content_data?.hero?.eyebrow && (
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#07877B]">
            {
              variant.content_data.hero.eyebrow
            }
          </p>
        )}

        {variant.content_data?.hero?.title && (
          <h3 className="mt-2 text-xl font-semibold leading-7 text-gray-900">
            {
              variant.content_data.hero.title
            }
          </h3>
        )}

        {variant.content_data?.hero?.subtitle && (
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {
              variant.content_data.hero.subtitle
            }
          </p>
        )}

        {variant.content_data?.body?.intro && (
          <p className="mt-5 text-sm leading-7 text-gray-700">
            {
              variant.content_data.body.intro
            }
          </p>
        )}


        {previewPoints.length >
          0 && (
          <div className="mt-5 space-y-3">
            {previewPoints.map(
              (
                point,
                index
              ) => (
                <div
                  key={`${point.title}-${index}`}
                  className="border-l-2 border-[#bfe4df] pl-3"
                >
                  {point.title && (
                    <p className="text-xs font-semibold text-gray-900">
                      {
                        point.title
                      }
                    </p>
                  )}

                  {point.text && (
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-gray-600">
                      {
                        point.text
                      }
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        )}


        {cta?.enabled &&
          cta.label && (
            <div className="mt-5">
              <span className="inline-flex rounded-lg bg-[#07877B] px-4 py-2 text-xs font-medium text-white">
                {
                  cta.label
                }
              </span>
            </div>
          )}
      </div>


      <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <ComplianceStatus
            status={
              compliance.status
            }
            issueCount={
              compliance.issueCount
            }
          />

          {variant.content_data?.disclaimer?.required && (
            <span className="text-[11px] text-gray-400">
              Disclaimer required
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={
            onSelect
          }
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            selected
              ? "bg-[#07877B] text-white"
              : "border border-[#9bcfc9] bg-white text-[#075f58] hover:bg-[#f3fbfa]"
          }`}
        >
          {selected
            ? "Selected"
            : `Choose Variant ${variant.variant_key}`}
        </button>
      </div>
    </article>
  );
}


function PreviewMeta({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-700">
        {value}
      </p>
    </div>
  );
}


function ComplianceStatus({
  status,
  issueCount,
}: {
  status:
    string;

  issueCount:
    number;
}) {
  const normalized =
    status.toLowerCase();

  if (
    normalized ===
    "pass"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Governance check passed
      </span>
    );
  }

  if (
    normalized ===
      "warning" ||
    issueCount >
      0
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        <ShieldAlert className="h-3.5 w-3.5" />
        {issueCount >
        0
          ? `${issueCount} item${issueCount === 1 ? "" : "s"} to review`
          : "Review suggested"}
      </span>
    );
  }

  if (
    normalized ===
    "fail"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
        <ShieldAlert className="h-3.5 w-3.5" />
        Governance issue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">
      <ShieldCheck className="h-3.5 w-3.5" />
      Governance check
    </span>
  );
}


function resolveCompliance(
  variant:
    StoredVariant
) {
  const nestedCompliance =
    variant.content_data?.compliance;

  const topCompliance =
    variant.compliance_data;

  const status =
    topCompliance?.status ||
    nestedCompliance?.status ||
    "unknown";

  const flags = [
    ...(
      topCompliance?.flags ||
      []
    ),
    ...(
      nestedCompliance?.flags ||
      []
    ),
  ];

  const notes = [
    ...(
      topCompliance?.notes ||
      []
    ),
    ...(
      nestedCompliance?.notes ||
      []
    ),
  ];

  return {
    status,

    issueCount:
      new Set([
        ...flags,
        ...notes,
      ]).size,
  };
}


function getPreviewPoints(
  content:
    VariantContentData | null
):
  Array<{
    title:
      string;

    text:
      string;
  }> {
  const sections =
    content?.body?.sections ||
    [];

  return sections
    .slice(
      0,
      3
    )
    .map(
      (
        section
      ) => {
        const itemText =
          section.items
            ?.slice(
              0,
              2
            )
            .map(
              (
                item
              ) =>
                typeof item ===
                  "string"
                  ? item
                  : `${item.label}: ${item.value}`
            )
            .join(
              " · "
            ) ||
          "";

        return {
          title:
            section.title ||
            formatSectionType(
              section.type
            ),

          text:
            section.content ||
            itemText,
        };
      }
    )
    .filter(
      (
        item
      ) =>
        Boolean(
          item.title ||
          item.text
        )
    );
}


function formatSectionType(
  type:
    VariantSection["type"]
) {
  switch (
    type
  ) {
    case "snapshot":
      return "Snapshot";

    case "highlight":
      return "Highlight";

    case "steps":
      return "Next steps";

    case "timeline":
      return "Timeline";

    case "note":
      return "Important note";

    case "bullets":
      return "Key points";

    case "text":
    default:
      return "";
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
