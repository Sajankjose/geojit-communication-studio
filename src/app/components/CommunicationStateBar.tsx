import { Edit2, Save, RotateCcw } from "lucide-react";
import { CategoryTag } from "./CategoryTag";
import { StatusBadge } from "./StatusBadge";

type Category = "research" | "education" | "product" | "service" | "regulatory" | "onboarding";
type Status = "draft" | "input-complete" | "generating" | "variants-ready" | "selected" | "preview-ready" | "submitted";

interface CommunicationStateBarProps {
  title: string;
  category: Category;
  status: Status;
  currentStep: number;
  totalSteps?: number;
  onEditTitle?: () => void;
  onSaveDraft?: () => void;
  onReset?: () => void;
}

export function CommunicationStateBar({
  title,
  category,
  status,
  currentStep,
  totalSteps = 5,
  onEditTitle,
  onSaveDraft,
  onReset,
}: CommunicationStateBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-[#e8f5f4]/20">
      <div className="mx-auto max-w-7xl px-8 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left Section - Communication Details */}
          <div className="flex flex-1 items-center gap-6">
            {/* Communication Title */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Communication</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{title}</span>
                  {onEditTitle && (
                    <button
                      onClick={onEditTitle}
                      className="text-gray-400 transition-colors hover:text-[#07877B]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300"></div>

            {/* Category */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Category</span>
              <CategoryTag category={category} size="sm" />
            </div>

            <div className="h-8 w-px bg-gray-300"></div>

            {/* Status */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Status</span>
              <StatusBadge status={status} size="sm" />
            </div>

            <div className="h-8 w-px bg-gray-300"></div>

            {/* Step Progress */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Step</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentStep} of {totalSteps}
                </span>
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#07877B] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {onSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-all hover:bg-gray-50"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-500 transition-all hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
