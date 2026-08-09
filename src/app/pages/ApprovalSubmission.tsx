import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";

export function ApprovalSubmission() {
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

  const [checklist, setChecklist] = useState({
    content: false,
    cta: false,
    data: false,
    attachments: false,
  });

  const allChecked = Object.values(checklist).every((v) => v);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    // Simulate submission
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);
  };

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
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={5} />

      <main className="mx-auto max-w-4xl px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5f4]">
              <Send className="h-8 w-8 text-[#07877B]" />
            </div>
          </div>
          <h1 className="mb-3 text-3xl text-gray-900">
            Submit for Approval
          </h1>
          <p className="text-gray-600">
            Review the summary and submit your communication for marketing team
            approval
          </p>
        </div>

        {/* Summary Card */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6">Communication Summary</h2>

          <div className="space-y-6">
            {/* Email Preview Thumbnail */}
            <div className="overflow-hidden rounded-lg border border-gray-300 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[#07877B]"></div>
                <span className="text-xs text-muted-foreground">
                  Email Preview
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 rounded bg-gray-200"></div>
                <div className="h-3 w-4/6 rounded bg-gray-200"></div>
                <div className="h-3 w-3/6 rounded bg-gray-200"></div>
              </div>
              <div className="mt-4 h-8 w-32 rounded bg-[#FBB041]"></div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="max-w-md text-right text-sm text-gray-900">
                  Reliance Industries - BUY Recommendation
                </span>
              </div>

              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <span className="text-sm text-muted-foreground">Category</span>
                <CategoryTag category={category} size="sm" />
              </div>

              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <span className="text-sm text-muted-foreground">Variant</span>
                <span className="text-sm capitalize text-gray-900">
                  {variant}
                </span>
              </div>

              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <span className="text-sm text-muted-foreground">
                  Subject Line
                </span>
                <span className="max-w-md text-right text-sm text-gray-900">
                  Reliance Industries - BUY Recommendation
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Target Audience
                </span>
                <span className="text-sm text-gray-900">All Clients</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6">Verification Checklist</h2>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.content}
                onChange={() => toggleCheck("content")}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#07877B] focus:ring-[#07877B]"
              />
              <div>
                <p className="text-sm">Content Reviewed</p>
                <p className="text-xs text-muted-foreground">
                  All content has been reviewed for accuracy and compliance
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.cta}
                onChange={() => toggleCheck("cta")}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#07877B] focus:ring-[#07877B]"
              />
              <div>
                <p className="text-sm">CTA Verified</p>
                <p className="text-xs text-muted-foreground">
                  Call-to-action text and URLs have been verified
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.data}
                onChange={() => toggleCheck("data")}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#07877B] focus:ring-[#07877B]"
              />
              <div>
                <p className="text-sm">Data Verified</p>
                <p className="text-xs text-muted-foreground">
                  All data points, prices, and figures are accurate
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.attachments}
                onChange={() => toggleCheck("attachments")}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#07877B] focus:ring-[#07877B]"
              />
              <div>
                <p className="text-sm">Attachments Verified</p>
                <p className="text-xs text-muted-foreground">
                  All necessary attachments and links are included
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleSubmit}
            disabled={!allChecked}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#07877B] disabled:hover:shadow-md"
          >
            <CheckCircle2 className="h-5 w-5" />
            Submit to Marketing
          </button>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/create/preview", { state: { category, variant } })}
              className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
            >
              Return to Edit
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
            >
              Save as Draft
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            onClick={() => navigate("/create/preview", { state: { category, variant } })}
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