import { generateCommunication } from "../services/aiGeneration";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  ArrowLeft,
  Sparkles,
  FileText,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  FileUp,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";

import {
  getCommunicationById,
  updateCommunication,
} from "../services/communications";

import {
  SourceFileMetadata,
  formatFileSize,
  removeCommunicationPdf,
  uploadCommunicationPdf,
  validatePdfFile,
} from "../services/sourceUpload";

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface FormData {
  title: string;
  subcategory: string;
  audience: string;

  topic: string;
  keyMessage: string;
  supportingPoints: string;

  ctaText: string;
  ctaUrl: string;

  details: Record<string, string>;
}

export function SmartInputForm() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [category, setCategory] =
    useState<Category>(
      (searchParams.get("category") ||
        "research") as Category
    );

  const [
    inputMethod,
    setInputMethod,
  ] = useState("manual");

  const [saving, setSaving] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [savedMessage, setSavedMessage] =
    useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  const [loadingDraft, setLoadingDraft] =
    useState(true);

  const [formData, setFormData] =
    useState<FormData>({
      title: "",
      subcategory: "",
      audience: "",
      topic: "",
      keyMessage: "",
      supportingPoints: "",
      ctaText: "",
      ctaUrl: "",
      details: {},
    });

  const [sourceFile, setSourceFile] =
    useState<SourceFileMetadata | null>(null);

  const [uploadingFile, setUploadingFile] =
    useState(false);

  const [removingFile, setRemovingFile] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadDraft() {
      if (!communicationId) {
        setLoadingDraft(false);
        return;
      }

      try {
        setLoadingDraft(true);
        setError("");

        const communication =
          await getCommunicationById(
            communicationId
          );

        const savedInput =
          communication.input_data || {};

        const savedDetails =
          (
            savedInput.categorySpecificDetails ||
            {}
          ) as Record<string, string>;

        const savedCategory =
          mapDatabaseCategoryToUi(
            communication.category
          );

        const savedSourceFile =
          savedInput.sourceFile;

        if (
          savedSourceFile &&
          typeof savedSourceFile === "object" &&
          !Array.isArray(savedSourceFile)
        ) {
          setSourceFile(
            savedSourceFile as SourceFileMetadata
          );
        } else {
          setSourceFile(null);
        }

        if (savedCategory) {
          setCategory(savedCategory);
        }

        setInputMethod(
          typeof savedInput.inputMethod ===
            "string"
            ? savedInput.inputMethod
            : "manual"
        );

        setFormData({
          title:
            communication.title ===
            "New Communication"
              ? ""
              : communication.title || "",

          subcategory:
            communication.subcategory || "",

          audience:
            communication.audience || "",

          topic:
            typeof savedInput.topic ===
            "string"
              ? savedInput.topic
              : "",

          keyMessage:
            typeof savedInput.keyMessage ===
            "string"
              ? savedInput.keyMessage
              : "",

          supportingPoints:
            typeof savedInput.supportingPoints ===
            "string"
              ? savedInput.supportingPoints
              : "",

          ctaText:
            typeof savedInput.ctaText ===
            "string"
              ? savedInput.ctaText
              : "",

          ctaUrl:
            typeof savedInput.ctaUrl ===
            "string"
              ? savedInput.ctaUrl
              : "",

          details: savedDetails,
        });
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error(
          "Unable to load draft:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the saved communication."
        );
      } finally {
        setLoadingDraft(false);
      }
    }

    loadDraft();
  }, [communicationId]);

  const subcategories: Record<
    Category,
    string[]
  > = {
    research: [
      "Equity Research",
      "Mutual Funds",
      "Derivatives",
      "IPO Analysis",
      "Sector Reports",
    ],

    education: [
      "Trading Basics",
      "Investment Strategies",
      "Market Fundamentals",
      "Risk Management",
      "Portfolio Building",
    ],

    product: [
      "New Product Launch",
      "Product Update",
      "Limited Offer",
      "Feature Announcement",
      "Pricing Change",
    ],

    service: [
      "Service Update",
      "System Maintenance",
      "Transaction Alert",
      "Account Notification",
      "Platform Upgrade",
    ],

    regulatory: [
      "SEBI Circular",
      "Compliance Update",
      "Policy Change",
      "Tax Regulation",
      "Disclosure Requirement",
    ],

    onboarding: [
      "Welcome Email",
      "Day 1 Onboarding",
      "Feature Introduction",
      "Account Setup",
      "Getting Started Guide",
    ],
  };

  const audienceTypes: Record<
    Category,
    string[]
  > = {
    research: [
      "All Clients",
      "Premium Clients",
      "New Investors",
      "HNI Clients",
      "Institutional Investors",
    ],

    education: [
      "Beginners",
      "Intermediate Traders",
      "Advanced Investors",
      "All Users",
      "New Registrations",
    ],

    product: [
      "Existing Customers",
      "Potential Customers",
      "Premium Segment",
      "All Users",
      "Targeted Segment",
    ],

    service: [
      "All Account Holders",
      "Active Traders",
      "Affected Users",
      "Premium Members",
      "Specific Segment",
    ],

    regulatory: [
      "All Clients",
      "Affected Account Holders",
      "Compliance Officers",
      "Trading Members",
      "Specific Product Users",
    ],

    onboarding: [
      "New Users",
      "Trial Users",
      "Newly Verified",
      "App Downloaders",
      "Registration Completed",
    ],
  };

  function updateField(
    field: keyof Omit<
      FormData,
      "details"
    >,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedMessage("");
    setHasUnsavedChanges(true);
  }

  function updateDetail(
    field: string,
    value: string
  ) {
    setFormData((current) => ({
      ...current,

      details: {
        ...current.details,
        [field]: value,
      },
    }));

    setSavedMessage("");
    setHasUnsavedChanges(true);
  }

  function mapCategoryToDatabase(
    value: Category
  ) {
    switch (value) {
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

  function buildInputData(
    nextSourceFile: SourceFileMetadata | null = sourceFile
  ) {
    return {
      inputMethod,
      title: formData.title,
      audience: formData.audience,
      topic: formData.topic,
      keyMessage: formData.keyMessage,
      supportingPoints: formData.supportingPoints,
      ctaText: formData.ctaText,
      ctaUrl: formData.ctaUrl,
      categorySpecificDetails: formData.details,
      sourceFile: nextSourceFile,
    };
  }

  async function persistSourceFile(
    nextSourceFile: SourceFileMetadata | null
  ) {
    if (!communicationId) {
      throw new Error("Communication ID is missing.");
    }

    await updateCommunication(
      communicationId,
      {
        input_data: buildInputData(
          nextSourceFile
        ),
      }
    );
  }

  async function handlePdfFile(file: File) {
    if (!communicationId || uploadingFile) {
      return;
    }

    const validationError = validatePdfFile(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    try {
      setUploadingFile(true);
      setUploadError("");
      setError("");
      setSavedMessage("");

      const previousFile = sourceFile;

      const uploaded =
        await uploadCommunicationPdf({
          communicationId,
          file,
        });

      try {
        await persistSourceFile(uploaded);
      } catch (metadataError) {
        try {
          await removeCommunicationPdf(
            uploaded.path
          );
        } catch (cleanupError) {
          console.error(
            "Unable to clean up uploaded PDF:",
            cleanupError
          );
        }

        throw metadataError;
      }

      setSourceFile(uploaded);
      setHasUnsavedChanges(false);
      setSavedMessage(
        "PDF uploaded successfully."
      );

      if (
        previousFile?.path &&
        previousFile.path !== uploaded.path
      ) {
        try {
          await removeCommunicationPdf(
            previousFile.path
          );
        } catch (removeOldError) {
          console.warn(
            "New PDF saved, but previous PDF could not be removed:",
            removeOldError
          );
        }
      }
    } catch (err) {
      console.error(
        "PDF upload failed:",
        err
      );

      setUploadError(
        err instanceof Error
          ? err.message
          : "Unable to upload PDF."
      );
    } finally {
      setUploadingFile(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemovePdf() {
    if (!sourceFile || removingFile) {
      return;
    }

    try {
      setRemovingFile(true);
      setUploadError("");
      setError("");

      await removeCommunicationPdf(
        sourceFile.path
      );

      await persistSourceFile(null);

      setSourceFile(null);
      setSavedMessage("PDF removed.");
    } catch (err) {
      console.error(
        "Unable to remove PDF:",
        err
      );

      setUploadError(
        err instanceof Error
          ? err.message
          : "Unable to remove PDF."
      );
    } finally {
      setRemovingFile(false);
    }
  }

  function handleFileInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (file) handlePdfFile(file);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    if (!uploadingFile) {
      setDragActive(true);
    }
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      handlePdfFile(file);
    }
  }

  async function saveToSupabase(
    nextStatus = "draft"
  ) {
    if (!communicationId) {
      throw new Error(
        "Communication ID is missing. Please return to the dashboard and start again."
      );
    }

    const databaseCategory =
      mapCategoryToDatabase(category);

    const inputData =
      buildInputData();

    return updateCommunication(
      communicationId,
      {
        title:
          formData.title.trim() ||
          "New Communication",

        category:
          databaseCategory,

        subcategory:
          formData.subcategory ||
          null,

        audience:
          formData.audience ||
          null,

        objective:
          formData.keyMessage ||
          null,

        status:
          nextStatus,

        input_data:
          inputData,

        classification_data: {
          category:
            databaseCategory,

          subcategory:
            formData.subcategory,

          inputMethod,
        },
      }
    );
  }

  async function handleSaveDraft() {
    try {
      setSaving(true);
      setError("");
      setSavedMessage("");

      await saveToSupabase(
        "draft"
      );

      setSavedMessage(
        "All changes saved."
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(
        "Save draft failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save draft."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (generating) {
      return;
    }

    if (!communicationId) {
      setError(
        "Communication ID is missing. Please return to the dashboard and start again."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSavedMessage("");

      const savedCommunication =
        await saveToSupabase(
          "generating"
        );

      const result =
        await generateCommunication({
          communicationId,
          category,
          title:
            savedCommunication.title,
          subcategory:
            savedCommunication.subcategory,
          audience:
            savedCommunication.audience,
          objective:
            savedCommunication.objective,
          inputData:
            savedCommunication.input_data,
        });

      console.log(
        "AI generation successful:",
        result
      );

      navigate(
        `/create/generating?communicationId=${encodeURIComponent(
          communicationId
        )}&category=${encodeURIComponent(
          category
        )}`
      );
    } catch (err) {
      console.error(
        "Generate communication failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate communication. Please try again."
      );

      try {
        await updateCommunication(
          communicationId,
          {
            status: "draft",
          }
        );
      } catch (statusError) {
        console.error(
          "Unable to restore draft status:",
          statusError
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleBack() {
    navigate(
      `/create/category?communicationId=${communicationId}`
    );
  }

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#07877B]" />

            <p className="text-sm text-gray-600">
              Loading communication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <CommunicationStateBar
        title={
          formData.title ||
          "New Communication"
        }
        category={category}
        status="input-complete"
        currentStep={2}
        totalSteps={5}
        onSaveDraft={
          handleSaveDraft
        }
      />

      <ProgressStepper
        currentStep={2}
      />

      <main className="mx-auto max-w-7xl px-8 py-8">

          {/* Page introduction */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-[#07877B]">
              Step 2 · Add the source information
            </p>
            <h1 className="text-2xl text-gray-900">
              Give AI the facts it needs
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Add only the source facts and instructions that matter. You can enter them manually,
              paste existing content, or prepare a source for upload.
            </p>
          </div>

          <div className="text-sm">
            {saving ? (
              <span className="text-gray-500">Saving…</span>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-700">Unsaved changes</span>
            ) : savedMessage ? (
              <span className="text-green-700">✓ Saved</span>
            ) : null}
          </div>
        </div>

        {/* Messages */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {savedMessage && !hasUnsavedChanges && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {savedMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">

          {/* MAIN FORM */}
          <div className="space-y-8">

            {/* Basic Information */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h2 className="text-lg text-gray-900">
                  Communication basics
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Identify the communication and who should receive it.
                </p>
              </div>

              <div className="space-y-4">

                <TextField
                  label="Communication Title"
                  value={formData.title}
                  onChange={(value) =>
                    updateField(
                      "title",
                      value
                    )
                  }
                  placeholder={
                    getTitlePlaceholder(
                      category
                    )
                  }
                />

                <div className="grid gap-4 sm:grid-cols-2">

                  <SelectField
                    label="Subcategory"
                    value={
                      formData.subcategory
                    }
                    onChange={(value) =>
                      updateField(
                        "subcategory",
                        value
                      )
                    }
                    options={
                      subcategories[
                        category
                      ]
                    }
                    placeholder="Select subcategory"
                  />

                  <SelectField
                    label="Audience Type"
                    value={
                      formData.audience
                    }
                    onChange={(value) =>
                      updateField(
                        "audience",
                        value
                      )
                    }
                    options={
                      audienceTypes[
                        category
                      ]
                    }
                    placeholder="Select audience"
                  />

                </div>

              </div>

            </section>

            {/* Input Method */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h2 className="text-lg text-gray-900">
                  Source information
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the easiest way to provide the facts AI should work from.
                </p>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-3">

                {[
                  {
                    id: "manual",
                    icon: FileText,
                    label:
                      "Manual Entry",
                  },
                  {
                    id: "paste",
                    icon: FileText,
                    label:
                      "Paste Content",
                  },
                  {
                    id: "upload",
                    icon: Upload,
                    label:
                      "Upload File",
                  },
                  {
                    id: "url",
                    icon: LinkIcon,
                    label:
                      "Paste URL",
                  },
                ].map((method) => (

                  <button
                    type="button"
                    key={method.id}
                    onClick={() =>
                      setInputMethod(
                        method.id
                      )
                    }
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                      inputMethod ===
                      method.id
                        ? "border-[#07877B] bg-[#e8f5f4]/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >

                    <method.icon className="h-5 w-5" />

                    <span className="text-sm">
                      {method.label}
                    </span>

                  </button>

                ))}

              </div>

              {/* Manual Entry */}
              {inputMethod ===
                "manual" && (

                <div className="space-y-4">

                  <TextField
                    label={
                      getTopicLabel(
                        category
                      )
                    }
                    value={
                      formData.topic
                    }
                    onChange={(value) =>
                      updateField(
                        "topic",
                        value
                      )
                    }
                    placeholder={
                      getTopicPlaceholder(
                        category
                      )
                    }
                  />

                  <TextAreaField
                    label="Key Message"
                    value={
                      formData.keyMessage
                    }
                    onChange={(value) =>
                      updateField(
                        "keyMessage",
                        value
                      )
                    }
                    rows={3}
                    placeholder={
                      getKeyMessagePlaceholder(
                        category
                      )
                    }
                  />

                  <TextAreaField
                    label="Supporting Points"
                    value={
                      formData.supportingPoints
                    }
                    onChange={(value) =>
                      updateField(
                        "supportingPoints",
                        value
                      )
                    }
                    rows={4}
                    placeholder={
                      getSupportingPlaceholder(
                        category
                      )
                    }
                  />

                </div>
              )}

              {/* Paste */}
              {inputMethod ===
                "paste" && (

                <TextAreaField
                  label="Paste source content"
                  value={
                    formData.details
                      .pastedContent ||
                    ""
                  }
                  onChange={(value) =>
                    updateDetail(
                      "pastedContent",
                      value
                    )
                  }
                  rows={10}
                  placeholder="Paste the available content here. AI will structure it in the next stage."
                />

              )}

              {/* URL */}
              {inputMethod ===
                "url" && (

                <TextField
                  label="Source URL"
                  value={
                    formData.details
                      .sourceUrl ||
                    ""
                  }
                  onChange={(value) =>
                    updateDetail(
                      "sourceUrl",
                      value
                    )
                  }
                  placeholder="https://..."
                />

              )}

              {/* Upload placeholders */}
              {inputMethod ===
                "upload" && (

                <div className="space-y-4">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {!sourceFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                        dragActive
                          ? "border-[#07877B] bg-[#e8f5f4]/50"
                          : "border-gray-300 bg-gray-50/40 hover:border-[#07877B]/60"
                      }`}
                    >
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                        {uploadingFile ? (
                          <RefreshCw className="h-6 w-6 animate-spin text-[#07877B]" />
                        ) : (
                          <FileUp className="h-6 w-6 text-[#07877B]" />
                        )}
                      </div>

                      <p className="font-medium text-gray-900">
                        {uploadingFile
                          ? "Uploading PDF…"
                          : "Drop your PDF here"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        or choose a file from your computer
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={uploadingFile}
                        className="mt-5 rounded-lg border border-[#07877B] bg-white px-5 py-2.5 text-sm font-medium text-[#07877B] transition-colors hover:bg-[#e8f5f4]/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Choose PDF
                      </button>

                      <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>PDF only</span>
                        <span>•</span>
                        <span>Maximum 10 MB</span>
                        <span>•</span>
                        <span>1 file</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50/40 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {sourceFile.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatFileSize(
                                sourceFile.size
                              )}
                              {" · "}
                              Uploaded securely
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                            disabled={
                              uploadingFile ||
                              removingFile
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={handleRemovePdf}
                            disabled={
                              uploadingFile ||
                              removingFile
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {removingFile
                              ? "Removing…"
                              : "Remove"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-green-100 bg-white/70 px-4 py-3 text-xs leading-5 text-gray-600">
                        The PDF is stored privately. Content extraction has not started yet.
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                </div>

              )}

            </section>

            {/* Category Specific */}
            <CategorySpecificFields
              category={category}
              details={
                formData.details
              }
              updateDetail={
                updateDetail
              }
            />

            {/* CTA */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-gray-900">
                    Call to action
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Add this only when the email should drive the reader to a specific action.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <TextField
                  label="CTA Text"
                  value={
                    formData.ctaText
                  }
                  onChange={(value) =>
                    updateField(
                      "ctaText",
                      value
                    )
                  }
                  placeholder="e.g., Read Full Report"
                />

                <TextField
                  label="CTA URL"
                  value={
                    formData.ctaUrl
                  }
                  onChange={(value) =>
                    updateField(
                      "ctaUrl",
                      value
                    )
                  }
                  placeholder="https://..."
                  type="url"
                />

              </div>

            </section>

          </div>

          {/* HELP PANEL */}
          <aside className="space-y-6">

            <div className="rounded-xl border border-[#b3d9d5] bg-[#e8f5f4]/50 p-6">

              <div className="mb-3 flex items-center gap-2">

                <Sparkles className="h-5 w-5 text-[#07877B]" />

                <h3 className="text-sm text-[#075f58]">
                  AI Tip
                </h3>

              </div>

              <p className="text-sm text-[#075f58]">
                {getAiTip(
                  category
                )}
              </p>

            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <h3 className="mb-3 text-sm">
                What makes a good input?
              </h3>

              <ul className="space-y-2 text-sm text-muted-foreground">

                {[
                  "Clear, concise messaging",
                  "Specific data points",
                  "Relevant context",
                  "Actionable takeaways",
                ].map((item) => (

                  <li
                    key={item}
                    className="flex gap-2"
                  >

                    <span className="text-[#07877B]">
                      •
                    </span>

                    <span>
                      {item}
                    </span>

                  </li>

                ))}

              </ul>

            </div>

          </aside>

        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">

          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >

            <ArrowLeft className="h-4 w-4" />

            Back

          </button>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={
                handleSaveDraft
              }
              disabled={
                saving ||
                generating
              }
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving
                ? "Saving..."
                : "Save Draft"}

            </button>

            <button
              type="button"
              onClick={
                handleGenerate
              }
              disabled={
                saving ||
                generating
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Sparkles className="h-4 w-4" />

              {generating
                ? "Generating..."
                : category === "regulatory"
                  ? "Generate 2 Options"
                  : "Generate 3 Options"}

            </button>

          </div>

        </div>

      </main>
    </div>
  );
}


/* =========================================================
   CATEGORY-SPECIFIC FIELDS
   ========================================================= */

function CategorySpecificFields({
  category,
  details,
  updateDetail,
}: {
  category: Category;
  details: Record<string, string>;
  updateDetail: (
    field: string,
    value: string
  ) => void;
}) {
  if (category === "research") {
    return (
      <FormSection title="Research Details">

        <div className="grid gap-4 sm:grid-cols-2">

          <SelectField
            label="Recommendation"
            value={
              details.recommendation ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "recommendation",
                value
              )
            }
            options={[
              "Buy",
              "Sell",
              "Accumulate",
              "Hold",
            ]}
          />

          <SelectField
            label="Time Horizon"
            value={
              details.timeHorizon ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "timeHorizon",
                value
              )
            }
            options={[
              "Short Term (0-3 months)",
              "Medium Term (3-12 months)",
              "Long Term (12+ months)",
            ]}
          />

        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <TextField
            label="Current Price"
            value={
              details.currentPrice ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "currentPrice",
                value
              )
            }
            placeholder="₹ 2,450"
          />

          <TextField
            label="Target Price"
            value={
              details.targetPrice ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "targetPrice",
                value
              )
            }
            placeholder="₹ 2,850"
          />

        </div>

        <TextAreaField
          label="Key Rationale"
          value={
            details.rationale ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "rationale",
              value
            )
          }
          rows={3}
          placeholder="Why this recommendation? Key drivers and catalysts."
        />

        <TextAreaField
          label="Risk Factors"
          value={
            details.riskFactors ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "riskFactors",
              value
            )
          }
          rows={3}
          placeholder="Key risks investors should be aware of."
        />

      </FormSection>
    );
  }

  if (category === "education") {
    return (
      <FormSection title="Education Details">

        <div className="grid gap-4 sm:grid-cols-2">

          <SelectField
            label="Difficulty Level"
            value={
              details.difficulty ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "difficulty",
                value
              )
            }
            options={[
              "Beginner",
              "Intermediate",
              "Advanced",
              "All Levels",
            ]}
          />

          <SelectField
            label="Content Format"
            value={
              details.contentFormat ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "contentFormat",
                value
              )
            }
            options={[
              "Article / Guide",
              "Video Tutorial",
              "Infographic",
              "Step-by-Step Tutorial",
              "Case Study",
            ]}
          />

        </div>

        <TextField
          label="Key Concepts Covered"
          value={
            details.keyConcepts ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "keyConcepts",
              value
            )
          }
          placeholder="e.g., NAV, SIP, Asset Allocation"
        />

        <TextAreaField
          label="Learning Outcome"
          value={
            details.learningOutcome ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "learningOutcome",
              value
            )
          }
          rows={3}
          placeholder="What should readers understand after reading?"
        />

      </FormSection>
    );
  }

  if (category === "product") {
    return (
      <FormSection title="Product Details">

        <TextField
          label="Launch Date / Availability"
          type="date"
          value={
            details.launchDate ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "launchDate",
              value
            )
          }
        />

        <SelectField
          label="Target Segment"
          value={
            details.targetSegment ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "targetSegment",
              value
            )
          }
          options={[
            "All Customers",
            "New Customers",
            "Premium Segment",
            "Active Traders",
            "Investors",
          ]}
        />

        <TextAreaField
          label="Key Features & Benefits"
          value={
            details.features ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "features",
              value
            )
          }
          rows={3}
          placeholder="List the main features and benefits."
        />

        <div className="grid gap-4 sm:grid-cols-2">

          <TextField
            label="Pricing Information"
            value={
              details.pricing ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "pricing",
                value
              )
            }
            placeholder="e.g., ₹999/month"
          />

          <TextField
            label="Offer Validity"
            value={
              details.offerValidity ||
              ""
            }
            onChange={(value) =>
              updateDetail(
                "offerValidity",
                value
              )
            }
            placeholder="e.g., Until 31 March"
          />

        </div>

      </FormSection>
    );
  }

  if (category === "service") {
    return (
      <FormSection title="Service Update Details">

        <SelectField
          label="Update Category"
          value={
            details.updateCategory ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "updateCategory",
              value
            )
          }
          options={[
            "Scheduled Maintenance",
            "Service Enhancement",
            "System Upgrade",
            "Transaction Alert",
            "Account Update",
          ]}
        />

        <TextField
          label="Effective Date/Time"
          type="datetime-local"
          value={
            details.effectiveDate ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "effectiveDate",
              value
            )
          }
        />

        <TextField
          label="Affected Services"
          value={
            details.affectedServices ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "affectedServices",
              value
            )
          }
          placeholder="e.g., Trading Platform, Mobile App"
        />

        <TextAreaField
          label="Customer Impact"
          value={
            details.customerImpact ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "customerImpact",
              value
            )
          }
          rows={3}
        />

        <TextField
          label="Duration / Timeline"
          value={
            details.duration ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "duration",
              value
            )
          }
        />

      </FormSection>
    );
  }

  if (category === "regulatory") {
    return (
      <FormSection title="Regulatory & Compliance Details">

        <SelectField
          label="Regulatory Authority"
          value={
            details.authority ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "authority",
              value
            )
          }
          options={[
            "SEBI",
            "RBI",
            "NSE",
            "BSE",
            "Internal Policy",
          ]}
        />

        <TextField
          label="Reference Number"
          value={
            details.referenceNumber ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "referenceNumber",
              value
            )
          }
        />

        <TextField
          label="Compliance Deadline"
          type="date"
          value={
            details.deadline ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "deadline",
              value
            )
          }
        />

        <SelectField
          label="Priority Level"
          value={
            details.priority ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "priority",
              value
            )
          }
          options={[
            "Critical - Immediate Action",
            "High - Urgent",
            "Medium - Important",
            "Low - Informational",
          ]}
        />

        <TextField
          label="Affected Products/Services"
          value={
            details.affectedProducts ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "affectedProducts",
              value
            )
          }
        />

        <TextAreaField
          label="Required Actions"
          value={
            details.requiredActions ||
            ""
          }
          onChange={(value) =>
            updateDetail(
              "requiredActions",
              value
            )
          }
          rows={3}
        />

      </FormSection>
    );
  }

  return (
    <FormSection title="Onboarding Journey Details">

      <SelectField
        label="Journey Stage"
        value={
          details.journeyStage ||
          ""
        }
        onChange={(value) =>
          updateDetail(
            "journeyStage",
            value
          )
        }
        options={[
          "Welcome Email (Day 0)",
          "Getting Started (Day 1)",
          "Feature Discovery (Day 3)",
          "First Action (Day 7)",
          "Engagement (Day 14)",
          "Milestone Celebration",
        ]}
      />

      <SelectField
        label="User Segment"
        value={
          details.userSegment ||
          ""
        }
        onChange={(value) =>
          updateDetail(
            "userSegment",
            value
          )
        }
        options={[
          "All New Users",
          "First-Time Investors",
          "Experienced Traders",
          "Corporate Clients",
          "Mobile App Users",
        ]}
      />

      <TextField
        label="Primary Goal / Action"
        value={
          details.primaryGoal ||
          ""
        }
        onChange={(value) =>
          updateDetail(
            "primaryGoal",
            value
          )
        }
      />

      <TextAreaField
        label="Key Resources / Next Steps"
        value={
          details.resources ||
          ""
        }
        onChange={(value) =>
          updateDetail(
            "resources",
            value
          )
        }
        rows={3}
      />

      <TextField
        label="Success Metric"
        value={
          details.successMetric ||
          ""
        }
        onChange={(value) =>
          updateDetail(
            "successMetric",
            value
          )
        }
      />

    </FormSection>
  );
}


/* =========================================================
   SIMPLE REUSABLE FORM COMPONENTS
   ========================================================= */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

      <h2 className="mb-6">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>

    </section>
  );
}


function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
      />

    </div>
  );
}


function TextAreaField({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm text-gray-700">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
      />

    </div>
  );
}


function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
      >

        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (

            <option
              key={option}
              value={option}
            >
              {option}
            </option>

          )
        )}

      </select>

    </div>
  );
}


/* =========================================================
   LABEL / HELP TEXT
   ========================================================= */

function getTitlePlaceholder(
  category: Category
) {
  switch (category) {
    case "research":
      return "e.g., Q4 Market Outlook Report";

    case "education":
      return "e.g., Understanding Mutual Funds";

    case "product":
      return "e.g., Introducing New Trading Platform";

    case "service":
      return "e.g., Platform Maintenance Notification";

    case "regulatory":
      return "e.g., New SEBI Guidelines Implementation";

    default:
      return "e.g., Welcome to Geojit";
  }
}


function getTopicLabel(
  category: Category
) {
  switch (category) {
    case "research":
      return "Topic / Security Name";

    case "education":
      return "Learning Topic";

    case "product":
      return "Product Name";

    case "service":
      return "Service / Update Type";

    case "regulatory":
      return "Regulation / Circular Name";

    default:
      return "Journey Stage / Email Type";
  }
}


function getTopicPlaceholder(
  category: Category
) {
  switch (category) {
    case "research":
      return "e.g., Reliance Industries";

    case "education":
      return "e.g., What are Mutual Funds?";

    case "product":
      return "e.g., Geojit Trading App";

    case "service":
      return "e.g., Platform Maintenance";

    case "regulatory":
      return "e.g., SEBI Circular";

    default:
      return "e.g., Welcome Email";
  }
}


function getKeyMessagePlaceholder(
  category: Category
) {
  switch (category) {
    case "research":
      return "What is the main investment message?";

    case "education":
      return "What is the main learning objective?";

    case "product":
      return "What is the key benefit or announcement?";

    case "service":
      return "What is the service update or action required?";

    case "regulatory":
      return "What is the key compliance requirement?";

    default:
      return "What is the main onboarding message?";
  }
}


function getSupportingPlaceholder(
  category: Category
) {
  switch (category) {
    case "research":
      return "Supporting data points, rationale and important facts";

    case "education":
      return "Key concepts, examples and learning points";

    case "product":
      return "Features, benefits and specifications";

    case "service":
      return "Timeline, affected services and next steps";

    case "regulatory":
      return "Implementation details, deadlines and requirements";

    default:
      return "Onboarding steps, benefits and guidance";
  }
}


function getAiTip(
  category: Category
) {
  switch (category) {
    case "research":
      return "Include the recommendation, price information, rationale and risk factors accurately. AI must not invent research facts.";

    case "education":
      return "Focus on the learning objective and provide enough context for AI to simplify the topic without changing its meaning.";

    case "product":
      return "Provide factual features and benefits. AI can improve presentation, but it should not invent product capabilities.";

    case "service":
      return "Include exact timelines, affected services and required actions.";

    case "regulatory":
      return "Provide the official requirement, authority, deadlines and required actions exactly as available.";

    default:
      return "Provide the journey stage, desired customer action and resources required to complete that step.";
  }
}
