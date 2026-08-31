import {
  FilePenLine,
  Loader2,
  Save,
} from "lucide-react";

import {
  useState,
} from "react";


type CommunicationStateBarProps = {
  title:
    string;

  category:
    string;

  status:
    string;

  currentStep:
    number;

  totalSteps:
    number;

  onSaveDraft?:
    () =>
      | void
      | Promise<void>;
};


export function CommunicationStateBar({
  title,
  category,
  status,
  currentStep,
  totalSteps,
  onSaveDraft,
}: CommunicationStateBarProps) {
  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const statusDisplay =
    getStatusDisplay(
      status
    );

  const clampedStep =
    Math.min(
      Math.max(
        currentStep,
        1
      ),
      Math.max(
        totalSteps,
        1
      )
    );


  async function handleSave() {
    if (
      !onSaveDraft ||
      saving
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      await onSaveDraft();
    } finally {
      setSaving(
        false
      );
    }
  }


  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f5f4] text-[#07877B]">
              <FilePenLine className="h-3.5 w-3.5" />
            </div>

            <p className="max-w-[620px] truncate text-sm font-medium text-gray-900">
              {getDisplayTitle(
                title
              )}
            </p>

            <span className="hidden text-gray-300 sm:inline">
              /
            </span>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
              {getCategoryLabel(
                category
              )}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-0 sm:pl-9">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusDisplay.className}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dotClassName}`}
              />

              {
                statusDisplay.label
              }
            </span>

            <span className="text-xs text-gray-400">
              Step{" "}
              {clampedStep} of{" "}
              {Math.max(
                totalSteps,
                1
              )}
            </span>
          </div>
        </div>


        {onSaveDraft && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                saving
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#9bcfc9] hover:bg-[#f3fbfa] hover:text-[#075f58] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function getDisplayTitle(
  title:
    string
) {
  const normalized =
    title
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    !normalized ||
    normalized.toLowerCase() ===
      "new communication"
  ) {
    return "Untitled Communication";
  }

  return normalized;
}


function getStatusDisplay(
  status:
    string
) {
  const normalized =
    status
      .trim()
      .toLowerCase()
      .replace(
        /_/g,
        "-"
      );

  switch (
    normalized
  ) {
    case "draft":
      return {
        label:
          "Draft",

        className:
          "bg-gray-100 text-gray-600",

        dotClassName:
          "bg-gray-400",
      };

    case "input-complete":
    case "input-ready":
      return {
        label:
          "Input Ready",

        className:
          "bg-[#e8f5f4] text-[#075f58]",

        dotClassName:
          "bg-[#07877B]",
      };

    case "generating":
      return {
        label:
          "Generating",

        className:
          "bg-blue-50 text-blue-700",

        dotClassName:
          "bg-blue-500",
      };

    case "generated":
    case "variants-ready":
      return {
        label:
          "Options Ready",

        className:
          "bg-[#e8f5f4] text-[#075f58]",

        dotClassName:
          "bg-[#07877B]",
      };

    case "variant-selected":
    case "selected":
      return {
        label:
          "Option Selected",

        className:
          "bg-[#e8f5f4] text-[#075f58]",

        dotClassName:
          "bg-[#07877B]",
      };

    case "preview-ready":
      return {
        label:
          "Preview Ready",

        className:
          "bg-[#e8f5f4] text-[#075f58]",

        dotClassName:
          "bg-[#07877B]",
      };

    case "pending-approval":
    case "submitted":
      return {
        label:
          "Pending Approval",

        className:
          "bg-blue-50 text-blue-700",

        dotClassName:
          "bg-blue-500",
      };

    case "marketing-review":
      return {
        label:
          "Marketing Review",

        className:
          "bg-blue-50 text-blue-700",

        dotClassName:
          "bg-blue-500",
      };

    case "marketing-approved":
      return {
        label:
          "Marketing Approved",

        className:
          "bg-[#e8f5f4] text-[#075f58]",

        dotClassName:
          "bg-[#07877B]",
      };

    case "corpcom-review":
      return {
        label:
          "CorpCom Review",

        className:
          "bg-blue-50 text-blue-700",

        dotClassName:
          "bg-blue-500",
      };

    case "changes-requested":
      return {
        label:
          "Changes Requested",

        className:
          "bg-amber-50 text-amber-700",

        dotClassName:
          "bg-amber-500",
      };

    case "rejected":
      return {
        label:
          "Rejected",

        className:
          "bg-red-50 text-red-700",

        dotClassName:
          "bg-red-500",
      };

    case "approved":
      return {
        label:
          "Approved",

        className:
          "bg-green-50 text-green-700",

        dotClassName:
          "bg-green-500",
      };

    default:
      return {
        label:
          humanizeStatus(
            status
          ),

        className:
          "bg-gray-100 text-gray-600",

        dotClassName:
          "bg-gray-400",
      };
  }
}


function humanizeStatus(
  value:
    string
) {
  const cleaned =
    value
      .replace(
        /[-_]+/g,
        " "
      )
      .trim();

  if (
    !cleaned
  ) {
    return "In Progress";
  }

  return (
    cleaned.charAt(
      0
    ).toUpperCase() +
    cleaned.slice(
      1
    )
  );
}


function getCategoryLabel(
  category:
    string
) {
  const normalized =
    category
      .trim()
      .toLowerCase();

  switch (
    normalized
  ) {
    case "research":
    case "research & advisory":
    case "fundamental research":
      return "Fundamental Research";

    case "education":
    case "investor education":
      return "Investor Education";

    case "product":
    case "product & sales":
      return "Product & Sales";

    case "service":
    case "service & transactional":
      return "Service & Transactional";

    case "regulatory":
    case "regulatory & compliance":
      return "Regulatory & Compliance";

    case "onboarding":
    case "onboarding & journey":
      return "Onboarding & Journey";

    default:
      return category ||
        "Communication";
  }
}
