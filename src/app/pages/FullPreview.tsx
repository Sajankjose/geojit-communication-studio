import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { StatusBadge } from "../components/StatusBadge";
import { EmailPreview } from "../components/EmailPreview";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Copy,
  Download,
  Lock,
  FileText,
  Tag,
  Users,
} from "lucide-react";

export function FullPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = (location.state?.category || "research") as
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding";
  const variant = location.state?.variant || "balanced";

  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {/* Communication State Bar */}
      <CommunicationStateBar
        title="New Communication"
        category={category}
        status="preview-ready"
        currentStep={5}
        totalSteps={5}
        onSaveDraft={() => console.log("Save draft")}
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={5} />

      <main className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl text-gray-900">Full Preview</h1>
              <CategoryTag category={category} />
              <StatusBadge status="preview-ready" />
            </div>
            <p className="mb-1 text-sm text-muted-foreground">
              Review and make final edits before submission
            </p>
            <p className="text-xs text-muted-foreground">
              Source: <code className="rounded bg-gray-100 px-1.5 py-0.5">communication.selectedVariant</code>
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-1">
            <button
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

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          {/* Left: Email Preview */}
          <div className={viewMode === "mobile" ? "mx-auto w-[375px]" : ""}>
            <EmailPreview variant={variant} category={category} />
          </div>

          {/* Right: Edit Panel */}
          <div className="space-y-6">
            {/* Communication Metadata */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Communication Metadata</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="text-sm text-gray-900">
                      {category === "research" && "Research & Advisory"}
                      {category === "education" && "Investor Education"}
                      {category === "product" && "Product & Sales"}
                      {category === "service" && "Service & Transactional"}
                      {category === "regulatory" && "Regulatory & Compliance"}
                      {category === "onboarding" && "Onboarding & Journey"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Template Type</div>
                    <div className="text-sm text-gray-900">Standard Email</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Variant Style</div>
                    <div className="text-sm text-gray-900 capitalize">{variant}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Sensitivity</div>
                    <div className="text-sm text-gray-900">
                      {category === "regulatory" ? "High - Compliance Required" : "Standard"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6">Editable Fields</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    defaultValue="Reliance Industries - BUY Recommendation"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    Preheader
                  </label>
                  <input
                    type="text"
                    defaultValue="Target ₹2,850 | Strong fundamentals and growth outlook"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    defaultValue="Read Full Research Report"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    CTA URL
                  </label>
                  <input
                    type="url"
                    defaultValue="https://geojit.com/research/reliance-q4-2026"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>
              </div>
            </div>

            {/* Locked Fields */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm text-gray-700">Locked Fields</h3>
              </div>

              <p className="mb-4 text-xs text-muted-foreground">
                These fields are controlled by the system to ensure compliance
                and brand consistency.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Layout</span>
                  <span className="text-gray-700">Controlled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Colors</span>
                  <span className="text-gray-700">Controlled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Structure</span>
                  <span className="text-gray-700">Controlled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disclaimer</span>
                  <span className="text-gray-700">Auto-applied</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm">Metadata</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <CategoryTag category={category} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subcategory</span>
                  <span className="text-gray-700">Equity Research</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sensitivity</span>
                  <span className="text-gray-700">Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disclaimer</span>
                  <span className="text-green-600">Required ✓</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all hover:bg-gray-50">
                <Copy className="h-4 w-4" />
                Copy HTML
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Download HTML
              </button>

              <button
                onClick={() =>
                  navigate("/create/submit", { state: { category, variant } })
                }
                className="w-full rounded-lg bg-[#07877B] px-4 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg"
              >
                Submit for Approval
              </button>

              <button
                onClick={() =>
                  navigate("/create/variants", { state: { category } })
                }
                className="w-full text-center text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                Back to Variants
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
          <button
            onClick={() => navigate("/create/variants", { state: { category } })}
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