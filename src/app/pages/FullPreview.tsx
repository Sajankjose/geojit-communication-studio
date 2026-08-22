// ============================================================
// FullPreview.tsx — Approved HTML Export Gate
// Apply the changes below to your current FullPreview.tsx.
// ============================================================


// 1. ADD THIS IMPORT

import {
  assertCommunicationExportAllowed,
} from "../services/communicationExports";


// 2. ADD THIS STATE NEAR YOUR OTHER COMMUNICATION STATE

const [
  communicationStatus,
  setCommunicationStatus,
] = useState("");


// 3. REPLACE YOUR CURRENT canEdit DECLARATION WITH THIS
//
// This also closes an important governance gap:
// an approved or in-review communication is read-only.

const creatorEditableStatuses = [
  "draft",
  "input_ready",
  "generating",
  "variants_ready",
  "variant_selected",
  "preview_ready",
  "changes_requested",
];

const canEdit =
  isCreator &&
  !isReviewMode &&
  creatorEditableStatuses.includes(
    communicationStatus
  );

const canExportHtml =
  isCreator &&
  communicationStatus ===
    "approved";


// 4. INSIDE loadPreview(), IMMEDIATELY AFTER
//
// const communication = await getCommunicationById(...)
//
// ADD:

setCommunicationStatus(
  communication.status || ""
);


// 5. REPLACE handleCopyHtml() WITH:

async function handleCopyHtml() {
  if (
    !communicationId ||
    !canExportHtml
  ) {
    setError(
      "HTML export will be available after final CorpCom approval."
    );
    return;
  }

  try {
    setError("");
    setSavedMessage("");

    /**
     * Server-side approval check.
     * Do not rely only on the disabled button.
     */
    await assertCommunicationExportAllowed(
      communicationId
    );

    const html =
      buildCurrentEmailHtml();

    await navigator.clipboard.writeText(
      html
    );

    setSavedMessage(
      "Approved email HTML copied to clipboard."
    );
  } catch (err) {
    console.error(
      "Unable to copy HTML:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to copy HTML. Please try again."
    );
  }
}


// 6. REPLACE handleDownloadHtml() WITH:

async function handleDownloadHtml() {
  if (
    !communicationId ||
    !canExportHtml
  ) {
    setError(
      "HTML export will be available after final CorpCom approval."
    );
    return;
  }

  try {
    setError("");
    setSavedMessage("");

    /**
     * Server-side approval check immediately before export.
     */
    await assertCommunicationExportAllowed(
      communicationId
    );

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
      "Approved email HTML downloaded."
    );
  } catch (err) {
    console.error(
      "Unable to download HTML:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to download HTML. Please try again."
    );
  }
}


// 7. REPLACE THE EXISTING COPY HTML + DOWNLOAD HTML BUTTONS WITH:

<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="mb-4 flex items-start gap-3">
    <div
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
        canExportHtml
          ? "bg-green-50"
          : "bg-gray-100"
      }`}
    >
      {canExportHtml ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Lock className="h-4 w-4 text-gray-500" />
      )}
    </div>

    <div>
      <p className="text-sm font-medium text-gray-900">
        Final HTML Export
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {canExportHtml
          ? "Final CorpCom approval is complete. The approved HTML can now be copied or downloaded."
          : "Copy and download will be enabled only after final CorpCom approval."}
      </p>
    </div>
  </div>

  <div className="space-y-3">
    <button
      type="button"
      onClick={
        handleCopyHtml
      }
      disabled={
        !canExportHtml
      }
      title={
        canExportHtml
          ? "Copy approved HTML"
          : "Available after final CorpCom approval"
      }
      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
        canExportHtml
          ? "border-gray-300 bg-white text-gray-700 hover:border-[#07877B] hover:bg-[#f7fbfa] hover:text-[#07877B]"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
      }`}
    >
      {!canExportHtml && (
        <Lock className="h-4 w-4" />
      )}

      {canExportHtml && (
        <Copy className="h-4 w-4" />
      )}

      Copy HTML
    </button>

    <button
      type="button"
      onClick={
        handleDownloadHtml
      }
      disabled={
        !canExportHtml
      }
      title={
        canExportHtml
          ? "Download approved HTML"
          : "Available after final CorpCom approval"
      }
      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
        canExportHtml
          ? "border-[#07877B] bg-[#07877B] text-white hover:bg-[#06766a]"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
      }`}
    >
      {!canExportHtml && (
        <Lock className="h-4 w-4" />
      )}

      {canExportHtml && (
        <Download className="h-4 w-4" />
      )}

      Download HTML
    </button>
  </div>
</div>


// 8. OPTIONAL BUT RECOMMENDED:
// In the heading/status area, use the real database status instead
// of always showing preview-ready:
//
// CURRENT:
// <StatusBadge status="preview-ready" />
//
// CHANGE TO:
//
// <StatusBadge
//   status={
//     mapDatabaseStatus(
//       communicationStatus
//     )
//   }
// />
//
// Do the same for CommunicationStateBar if it accepts the workflow status.
