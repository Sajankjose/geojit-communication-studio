import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Lock,
  Monitor,
  Smartphone,
  Tag,
  Users,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { StatusBadge } from "../components/StatusBadge";
import { EmailPreview } from "../components/EmailPreview";
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

  const communicationId = searchParams.get("communicationId");
  const variantId = searchParams.get("variantId");
  const urlCategory = searchParams.get("category") as Category | null;

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
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

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
        setSubject(loadedVariant.subject_lines?.[0] || "");
        setPreheader(loadedVariant.preheader || "");

        const cta =
          loadedVariant.cta_data ||
          loadedVariant.content_data?.cta ||
          {};

        setCtaEnabled(Boolean(cta.enabled));
        setCtaText(cta.label || "");
        setCtaUrl(cta.url || "");
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
  }, [communicationId, variantId]);

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
      ...(variant.content_data || {}),
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

    await updateCommunication(communicationId, {
      selected_variant_id: variantId,
      status: "preview_ready",
    });
  }

  async function handleSave() {
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

  async function handleSubmit() {
    if (!communicationId || !variantId) return;

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

  function handleBack() {
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
    ...(variant?.content_data || {}),
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
        onSaveDraft={handleSave}
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

            <p className="text-sm text-muted-foreground">
              Review the selected AI-generated communication before submission.
            </p>

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

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2>Editable Fields</h2>
                <span className="text-xs text-gray-500">Live preview</span>
              </div>

              <div className="space-y-4">
                <EditableField
                  label="Subject Line"
                  value={subject}
                  onChange={setSubject}
                />

                <EditableField
                  label="Preheader"
                  value={preheader}
                  onChange={setPreheader}
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
                    onChange={(event) =>
                      setCtaEnabled(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#07877B]"
                  />
                </div>

                <EditableField
                  label="CTA Text"
                  value={ctaText}
                  onChange={setCtaText}
                  disabled={!ctaEnabled}
                />

                <EditableField
                  label="CTA URL"
                  type="url"
                  value={ctaUrl}
                  onChange={setCtaUrl}
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
                disabled
                title="HTML renderer will be connected in the next implementation step."
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-400 opacity-70"
              >
                <Copy className="h-4 w-4" />
                Copy HTML
              </button>

              <button
                type="button"
                disabled
                title="HTML renderer will be connected in the next implementation step."
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-400 opacity-70"
              >
                <Download className="h-4 w-4" />
                Download HTML
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="w-full rounded-lg bg-[#07877B] px-4 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit for Approval"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-center text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                Back to Variants
              </button>
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
            Back
          </button>
        </div>
      </main>
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
