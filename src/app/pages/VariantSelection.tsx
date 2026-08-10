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
  RefreshCw,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { VariantCard } from "../components/VariantCard";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";

import {
  getCommunicationById,
  updateCommunication,
} from "../services/communications";

import { supabase } from "../../lib/supabase";


type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

type VariantCardStyle =
  | "clarity"
  | "balanced"
  | "impact";

interface StoredVariant {
  id: string;
  communication_id: string;
  ai_run_id: string | null;
  variant_key: "A" | "B" | "C";
  variant_name: string;
  subject_lines: string[];
  preheader: string | null;
  content_data: {
    strategy?: string;
    hero?: {
      eyebrow?: string;
      title?: string;
      subtitle?: string;
    };
    body?: {
      intro?: string;
      sections?: unknown[];
      closing?: string;
    };
    cta?: {
      enabled?: boolean;
      label?: string;
      url?: string;
    };
    compliance?: {
      status?: string;
      flags?: string[];
      notes?: string[];
    };
  } | null;
  compliance_data: {
    status?: string;
    flags?: string[];
    notes?: string[];
  } | null;
  is_selected: boolean;
  created_at: string;
}

interface LatestAiRun {
  id: string;
  status: string;
  created_at: string;
}

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
    variants,
    setVariants,
  ] =
    useState<StoredVariant[]>(
      []
    );

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] =
    useState<string | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingSelection,
    setSavingSelection,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const isRegulatory =
    category === "regulatory";


  /**
   * Load:
   * 1. communication
   * 2. latest completed AI run
   * 3. variants belonging to that run
   */
  useEffect(() => {
    if (!communicationId) {
      setError(
        "Communication ID is missing."
      );
      setLoading(false);
      return;
    }

    let cancelled =
      false;

    async function loadVariants() {
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

        const resolvedCategory =
          mapDatabaseCategoryToUi(
            communication.category
          );

        if (resolvedCategory) {
          setCategory(
            resolvedCategory
          );
        }

        /**
         * Get the most recent completed
         * generation for this communication.
         */
        const {
          data: runData,
          error: runError,
        } =
          await supabase
            .from("ai_runs")
            .select(
              "id,status,created_at"
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .eq(
              "status",
              "completed"
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle();

        if (runError) {
          throw new Error(
            runError.message
          );
        }

        const latestRun =
          runData as
            | LatestAiRun
            | null;

        if (!latestRun) {
          throw new Error(
            "No completed AI generation was found for this communication."
          );
        }

        /**
         * Load only the variants from
         * the latest completed run.
         */
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
              compliance_data,
              is_selected,
              created_at
              `
            )
            .eq(
              "communication_id",
              communicationId!
            )
            .eq(
              "ai_run_id",
              latestRun.id
            )
            .order(
              "variant_key",
              {
                ascending: true,
              }
            );

        if (variantsError) {
          throw new Error(
            variantsError.message
          );
        }

        if (cancelled) {
          return;
        }

        const loadedVariants =
          (variantRows ||
            []) as StoredVariant[];

        if (
          loadedVariants.length ===
          0
        ) {
          throw new Error(
            "AI variants are not available yet."
          );
        }

        setVariants(
          loadedVariants
        );

        /**
         * Restore a previously selected
         * variant when reopening Step 4.
         */
        const selectedFromCommunication =
          communication
            .selected_variant_id;

        if (
          selectedFromCommunication &&
          loadedVariants.some(
            (variant) =>
              variant.id ===
              selectedFromCommunication
          )
        ) {
          setSelectedVariantId(
            selectedFromCommunication
          );
        } else {
          const selectedRow =
            loadedVariants.find(
              (variant) =>
                variant.is_selected
            );

          if (selectedRow) {
            setSelectedVariantId(
              selectedRow.id
            );
          }
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to load AI variants:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load AI-generated variants."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVariants();

    return () => {
      cancelled = true;
    };
  }, [communicationId]);


  const displayVariants =
    useMemo(
      () =>
        variants.map(
          (variant) => ({
            ...variant,

            cardStyle:
              mapVariantKeyToCardStyle(
                variant.variant_key
              ),

            subject:
              variant
                .subject_lines?.[0] ||
              variant.variant_name,

            preheader:
              variant.preheader ||
              "",

            styleNote:
              variant
                .content_data
                ?.strategy ||
              getFallbackStyleNote(
                variant.variant_key
              ),
          })
        ),
      [variants]
    );


  async function saveSelection(
    variantId: string
  ) {
    if (!communicationId) {
      throw new Error(
        "Communication ID is missing."
      );
    }

    /**
     * Clear old selected flag for
     * this communication.
     */
    const {
      error:
        clearError,
    } =
      await supabase
        .from(
          "communication_variants"
        )
        .update({
          is_selected: false,
        })
        .eq(
          "communication_id",
          communicationId
        );

    if (clearError) {
      throw new Error(
        clearError.message
      );
    }

    /**
     * Mark selected variant.
     */
    const {
      error:
        selectError,
    } =
      await supabase
        .from(
          "communication_variants"
        )
        .update({
          is_selected: true,
        })
        .eq(
          "id",
          variantId
        )
        .eq(
          "communication_id",
          communicationId
        );

    if (selectError) {
      throw new Error(
        selectError.message
      );
    }

    /**
     * Persist selection on the
     * parent communication as well.
     */
    await updateCommunication(
      communicationId,
      {
        selected_variant_id:
          variantId,
      }
    );
  }


  async function handleContinue() {
    if (
      !selectedVariantId ||
      !communicationId
    ) {
      return;
    }

    try {
      setSavingSelection(
        true
      );
      setError("");

      await saveSelection(
        selectedVariantId
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
    } catch (err) {
      console.error(
        "Unable to save selected variant:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your selected variant."
      );
    } finally {
      setSavingSelection(
        false
      );
    }
  }


  function handlePreview(
    variantId: string
  ) {
    if (!communicationId) {
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


  function handleEditInput() {
    if (!communicationId) {
      navigate("/");
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <CommunicationStateBar
          title={
            communicationTitle
          }
          category={category}
          status="variants-ready"
          currentStep={4}
          totalSteps={5}
        />

        <ProgressStepper
          currentStep={4}
        />

        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />

            <p className="text-sm text-gray-600">
              Loading AI-generated options...
            </p>
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
        category={category}
        status="variants-ready"
        currentStep={4}
        totalSteps={5}
      />

      <ProgressStepper
        currentStep={4}
      />

      <main className="mx-auto max-w-7xl px-8 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">

            <h1 className="text-2xl text-gray-900">
              Choose your preferred version
            </h1>

            <CategoryTag
              category={category}
            />

          </div>

          <p className="text-gray-600">
            Each option uses the same verified source facts, while changing the communication emphasis and information hierarchy.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {isRegulatory
              ? "Regulatory communications provide two controlled variants."
              : "Compare all three AI-generated approaches before continuing."}
          </p>
        </div>


        {/* Error */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* Variants Grid */}
        {displayVariants.length >
        0 ? (
          <div
            className={`mb-8 grid gap-6 ${
              isRegulatory
                ? "md:grid-cols-2"
                : "lg:grid-cols-3"
            }`}
          >
            {displayVariants.map(
              (variant) => (
                <VariantCard
                  key={
                    variant.id
                  }
                  variant={
                    variant.cardStyle
                  }
                  subject={
                    variant.subject
                  }
                  preheader={
                    variant.preheader
                  }
                  styleNote={
                    variant.styleNote
                  }
                  selected={
                    selectedVariantId ===
                    variant.id
                  }
                  onSelect={() =>
                    setSelectedVariantId(
                      variant.id
                    )
                  }
                  onPreview={() =>
                    handlePreview(
                      variant.id
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-700">
              No generated variants are available.
            </p>
          </div>
        )}


        {/* Additional Options */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row">

          <button
            type="button"
            onClick={
              handleEditInput
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-all hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />

            Edit input & regenerate
          </button>

          <span className="hidden text-gray-300 sm:inline">
            •
          </span>

          <p className="text-center text-sm text-gray-500">
            Regeneration starts from the input screen so you can verify or refine the source information first.
          </p>

        </div>


        {/* Actions */}
        <div className="flex items-center justify-between">

          <button
            type="button"
            onClick={
              handleEditInput
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={
              handleContinue
            }
            disabled={
              !selectedVariantId ||
              savingSelection
            }
            className="rounded-lg bg-[#07877B] px-8 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#07877B] disabled:hover:shadow-md"
          >
            {savingSelection
              ? "Saving..."
              : "Continue to Preview"}
          </button>

        </div>

      </main>
    </div>
  );
}


function mapVariantKeyToCardStyle(
  variantKey:
    | "A"
    | "B"
    | "C"
): VariantCardStyle {
  switch (variantKey) {
    case "A":
      return "clarity";

    case "B":
      return "balanced";

    case "C":
      return "impact";
  }
}


function getFallbackStyleNote(
  variantKey:
    | "A"
    | "B"
    | "C"
) {
  switch (variantKey) {
    case "A":
      return "Clarity First — direct, structured and highly scannable.";

    case "B":
      return "Balanced — combines clarity with useful context.";

    case "C":
      return "Engagement Led — more reader-oriented while preserving the same verified facts.";
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
