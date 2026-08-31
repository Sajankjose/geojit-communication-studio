import {
  generateCommunication,
} from "../services/aiGeneration";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  DragEvent,
  ReactNode,
  RefObject,
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
  CircleCheckBig,
  FileText,
  FileUp,
  Link as LinkIcon,
  Loader2,
  PencilLine,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";

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
  markCreatorRevisionComplete,
} from "../services/revisionTracking";

import {
  SourceFileMetadata,
  formatFileSize,
  removeCommunicationPdf,
  uploadCommunicationPdf,
  validatePdfFile,
} from "../services/sourceUpload";

import {
  PdfExtractionResult,
  extractCommunicationPdf,
} from "../services/pdfExtraction";

import {
  FactExtractionResponse,
  extractPdfFacts,
} from "../services/pdfFactExtraction";


type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

type InputMethod =
  | "manual"
  | "paste"
  | "upload"
  | "url";

interface FormData {
  title: string;
  subcategory: string;
  audience: string;

  topic: string;
  keyMessage: string;
  supportingPoints: string;

  ctaText: string;
  ctaUrl: string;

  details: Record<
    string,
    string
  >;
}


const SUBCATEGORIES:
  Record<
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
      "Trading Platform",
      "Trading Feature / Tool",
      "Investment Product",
      "Pricing / Plan",
      "Offer / Campaign",
      "General Product Communication",
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


const AUDIENCE_TYPES:
  Record<
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


const INPUT_METHODS: Array<{
  id: InputMethod;
  label: string;
  helper: string;
  icon: typeof FileText;
}> = [
  {
    id: "manual",
    label: "Manual Entry",
    helper:
      "Enter the important facts directly.",
    icon:
      FileText,
  },

  {
    id: "paste",
    label: "Paste Content",
    helper:
      "Use existing source copy or notes.",
    icon:
      FileText,
  },

  {
    id: "upload",
    label: "Upload PDF",
    helper:
      "Extract and verify facts from a PDF.",
    icon:
      Upload,
  },

  {
    id: "url",
    label: "Source URL",
    helper:
      "Save a reference link with the brief.",
    icon:
      LinkIcon,
  },
];


export function SmartInputForm() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const communicationId =
    searchParams.get(
      "communicationId"
    );

  const [
    category,
    setCategory,
  ] =
    useState<Category>(
      (
        searchParams.get(
          "category"
        ) ||
        "research"
      ) as Category
    );

  const [
    inputMethod,
    setInputMethod,
  ] =
    useState<InputMethod>(
      "manual"
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    generating,
    setGenerating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    savedMessage,
    setSavedMessage,
  ] =
    useState("");

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges,
  ] =
    useState(false);

  const [
    loadingDraft,
    setLoadingDraft,
  ] =
    useState(true);

  const [
    formData,
    setFormData,
  ] =
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

  const [
    sourceFile,
    setSourceFile,
  ] =
    useState<
      SourceFileMetadata | null
    >(null);

  const [
    uploadingFile,
    setUploadingFile,
  ] =
    useState(false);

  const [
    removingFile,
    setRemovingFile,
  ] =
    useState(false);

  const [
    uploadError,
    setUploadError,
  ] =
    useState("");

  const [
    processingPdf,
    setProcessingPdf,
  ] =
    useState(false);

  const [
    extractionResult,
    setExtractionResult,
  ] =
    useState<
      PdfExtractionResult | null
    >(null);

  const [
    extractionError,
    setExtractionError,
  ] =
    useState("");

  const [
    extractingFacts,
    setExtractingFacts,
  ] =
    useState(false);

  const [
    factExtraction,
    setFactExtraction,
  ] =
    useState<
      FactExtractionResponse | null
    >(null);

  const [
    factExtractionError,
    setFactExtractionError,
  ] =
    useState("");

  const [
    verifiedFacts,
    setVerifiedFacts,
  ] =
    useState<
      Record<string, any>
    >({});

  const [
    factsApplied,
    setFactsApplied,
  ] =
    useState(false);

  const [
    dragActive,
    setDragActive,
  ] =
    useState(false);

  const fileInputRef =
    useRef<
      HTMLInputElement | null
    >(null);


  useEffect(() => {
    async function loadDraft() {
      if (
        !communicationId
      ) {
        setLoadingDraft(
          false
        );

        return;
      }

      try {
        setLoadingDraft(
          true
        );

        setError(
          ""
        );

        const communication =
          await getCommunicationById(
            communicationId
          );

        const savedInput =
          communication.input_data ||
          {};

        const savedDetails =
          (
            savedInput.categorySpecificDetails ||
            {}
          ) as Record<
            string,
            string
          >;

        const savedCategory =
          mapDatabaseCategoryToUi(
            communication.category
          );

        const savedSourceFile =
          savedInput.sourceFile;

        if (
          savedSourceFile &&
          typeof savedSourceFile ===
            "object" &&
          !Array.isArray(
            savedSourceFile
          )
        ) {
          setSourceFile(
            savedSourceFile as SourceFileMetadata
          );
        } else {
          setSourceFile(
            null
          );
        }

        const savedVerifiedFacts =
          savedInput.verifiedSourceFacts;

        if (
          savedVerifiedFacts &&
          typeof savedVerifiedFacts ===
            "object" &&
          !Array.isArray(
            savedVerifiedFacts
          )
        ) {
          const facts =
            savedVerifiedFacts as Record<
              string,
              any
            >;

          setVerifiedFacts(
            facts
          );

          setFactExtraction({
            success:
              true,

            facts,

            usage: {
              sourceCharacters:
                0,
              promptTokens:
                null,
              completionTokens:
                null,
              totalTokens:
                null,
              model:
                "saved",
            },
          });

          setFactsApplied(
            Boolean(
              savedInput.sourceFactsApplied
            )
          );
        } else {
          setVerifiedFacts(
            {}
          );

          setFactExtraction(
            null
          );

          setFactsApplied(
            false
          );
        }

        const savedExtraction =
          savedInput.sourceExtraction;

        if (
          savedExtraction &&
          typeof savedExtraction ===
            "object" &&
          !Array.isArray(
            savedExtraction
          )
        ) {
          setExtractionResult({
            success:
              true,

            extraction: {
              pageCount:
                Number(
                  savedExtraction.pageCount ||
                  0
                ),

              fileSize:
                Number(
                  savedExtraction.fileSize ||
                  0
                ),

              rawCharacters:
                Number(
                  savedExtraction.rawCharacters ||
                  0
                ),

              cleanedCharacters:
                Number(
                  savedExtraction.cleanedCharacters ||
                  0
                ),

              compactText:
                "",

              relevantText:
                "",

              truncated:
                Boolean(
                  savedExtraction.truncated
                ),

              requiresOcr:
                Boolean(
                  savedExtraction.requiresOcr
                ),
            },

            relevance: {
              relevant:
                Boolean(
                  savedExtraction.relevant
                ),

              score:
                Number(
                  savedExtraction.relevanceScore ||
                  0
                ),

              matchedSignals:
                Array.isArray(
                  savedExtraction.matchedSignals
                )
                  ? savedExtraction.matchedSignals
                  : [],

              reason:
                typeof savedExtraction.reason ===
                  "string"
                  ? savedExtraction.reason
                  : "",
            },
          });
        } else {
          setExtractionResult(
            null
          );
        }

        if (
          savedCategory
        ) {
          setCategory(
            savedCategory
          );
        }

        setInputMethod(
          isInputMethod(
            savedInput.inputMethod
          )
            ? savedInput.inputMethod
            : "manual"
        );

        setFormData({
          title:
            communication.title ===
              "New Communication"
              ? ""
              : communication.title ||
                "",

          subcategory:
            communication.subcategory ||
            "",

          audience:
            communication.audience ||
            "",

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

          details:
            savedDetails,
        });

        setHasUnsavedChanges(
          false
        );
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
        setLoadingDraft(
          false
        );
      }
    }

    void loadDraft();
  }, [communicationId]);


  function updateField(
    field:
      keyof Omit<
        FormData,
        "details"
      >,
    value:
      string
  ) {
    setFormData(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );

    setSavedMessage(
      ""
    );

    setHasUnsavedChanges(
      true
    );
  }


  function updateDetail(
    field:
      string,
    value:
      string
  ) {
    setFormData(
      (current) => ({
        ...current,

        details: {
          ...current.details,
          [field]:
            value,
        },
      })
    );

    setSavedMessage(
      ""
    );

    setHasUnsavedChanges(
      true
    );
  }


  function handleInputMethodChange(
    method:
      InputMethod
  ) {
    setInputMethod(
      method
    );

    setSavedMessage(
      ""
    );

    setError(
      ""
    );

    setHasUnsavedChanges(
      true
    );
  }


  function buildInputData(
    nextSourceFile:
      SourceFileMetadata | null =
        sourceFile
  ) {
    const communicationType =
      category ===
        "product"
        ? formData.details.communicationType ||
          null
        : null;

    const sourceExtraction =
      extractionResult
        ? {
            pageCount:
              extractionResult.extraction.pageCount,

            fileSize:
              extractionResult.extraction.fileSize,

            rawCharacters:
              extractionResult.extraction.rawCharacters,

            cleanedCharacters:
              extractionResult.extraction.cleanedCharacters,

            truncated:
              extractionResult.extraction.truncated,

            requiresOcr:
              extractionResult.extraction.requiresOcr,

            relevant:
              extractionResult.relevance.relevant,

            relevanceScore:
              extractionResult.relevance.score,

            matchedSignals:
              extractionResult.relevance.matchedSignals,

            reason:
              extractionResult.relevance.reason,
          }
        : null;

    return {
      inputMethod,

      title:
        formData.title,

      audience:
        formData.audience,

      topic:
        formData.topic,

      keyMessage:
        formData.keyMessage,

      supportingPoints:
        formData.supportingPoints,

      ctaText:
        formData.ctaText,

      ctaUrl:
        formData.ctaUrl,

      communicationType,

      categorySpecificDetails:
        formData.details,

      sourceFile:
        nextSourceFile,

      sourceExtraction,

      verifiedSourceFacts:
        Object.keys(
          verifiedFacts
        ).length >
          0
          ? verifiedFacts
          : null,

      sourceFactsApplied:
        factsApplied,
    };
  }


  async function persistSourceFile(
    nextSourceFile:
      SourceFileMetadata | null
  ) {
    if (
      !communicationId
    ) {
      throw new Error(
        "Communication ID is missing."
      );
    }

    await updateCommunication(
      communicationId,
      {
        input_data:
          buildInputData(
            nextSourceFile
          ),
      }
    );
  }


  async function persistExtractionResult(
    result:
      PdfExtractionResult | null
  ) {
    if (
      !communicationId
    ) {
      throw new Error(
        "Communication ID is missing."
      );
    }

    await updateCommunication(
      communicationId,
      {
        input_data: {
          ...buildInputData(),

          sourceExtraction:
            result
              ? {
                  pageCount:
                    result.extraction.pageCount,

                  fileSize:
                    result.extraction.fileSize,

                  rawCharacters:
                    result.extraction.rawCharacters,

                  cleanedCharacters:
                    result.extraction.cleanedCharacters,

                  truncated:
                    result.extraction.truncated,

                  requiresOcr:
                    result.extraction.requiresOcr,

                  relevant:
                    result.relevance.relevant,

                  relevanceScore:
                    result.relevance.score,

                  matchedSignals:
                    result.relevance.matchedSignals,

                  reason:
                    result.relevance.reason,

                  processedAt:
                    new Date().toISOString(),
                }
              : null,
        },
      }
    );
  }


  async function handleProcessPdf() {
    if (
      !sourceFile ||
      processingPdf
    ) {
      return;
    }

    try {
      setProcessingPdf(
        true
      );

      setExtractionError(
        ""
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      const result =
        await extractCommunicationPdf({
          sourcePath:
            sourceFile.path,

          category,
        });

      setExtractionResult(
        result
      );

      await persistExtractionResult(
        result
      );

      setSavedMessage(
        result.relevance.relevant
          ? "PDF processed successfully."
          : "PDF processed, but relevance needs review."
      );
    } catch (err) {
      console.error(
        "PDF processing failed:",
        err
      );

      setExtractionResult(
        null
      );

      try {
        await persistExtractionResult(
          null
        );
      } catch (
        persistError
      ) {
        console.error(
          "Unable to clear extraction metadata:",
          persistError
        );
      }

      setExtractionError(
        err instanceof Error
          ? err.message
          : "Unable to process PDF."
      );
    } finally {
      setProcessingPdf(
        false
      );
    }
  }


  async function persistVerifiedFacts(
    nextFacts:
      Record<
        string,
        any
      >,
    applied =
      factsApplied
  ) {
    if (
      !communicationId
    ) {
      throw new Error(
        "Communication ID is missing."
      );
    }

    await updateCommunication(
      communicationId,
      {
        input_data: {
          ...buildInputData(),

          verifiedSourceFacts:
            Object.keys(
              nextFacts
            ).length >
              0
              ? nextFacts
              : null,

          sourceFactsApplied:
            applied,
        },
      }
    );
  }


  async function handleExtractFacts() {
    if (
      !communicationId ||
      !extractionResult ||
      extractingFacts
    ) {
      return;
    }

    if (
      !extractionResult.extraction.relevantText
    ) {
      setFactExtractionError(
        "Process the PDF again before extracting facts."
      );

      return;
    }

    try {
      setExtractingFacts(
        true
      );

      setFactExtractionError(
        ""
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      setFactsApplied(
        false
      );

      const result =
        await extractPdfFacts({
          communicationId,

          category,

          relevantText:
            extractionResult.extraction.relevantText,
        });

      const facts =
        result.facts as Record<
          string,
          any
        >;

      setFactExtraction(
        result
      );

      setVerifiedFacts(
        facts
      );

      await persistVerifiedFacts(
        facts,
        false
      );

      setSavedMessage(
        "Key facts extracted. Please verify before using them."
      );
    } catch (err) {
      console.error(
        "Fact extraction failed:",
        err
      );

      setFactExtractionError(
        err instanceof Error
          ? err.message
          : "Unable to extract key facts."
      );
    } finally {
      setExtractingFacts(
        false
      );
    }
  }


  function updateVerifiedFact(
    key:
      string,
    value:
      any
  ) {
    setVerifiedFacts(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );

    setFactsApplied(
      false
    );

    setSavedMessage(
      ""
    );
  }


  function updateVerifiedListItem(
    key:
      string,
    index:
      number,
    value:
      string
  ) {
    setVerifiedFacts(
      (current) => {
        const currentList =
          Array.isArray(
            current[
              key
            ]
          )
            ? [
                ...current[
                  key
                ],
              ]
            : [];

        currentList[
          index
        ] =
          value;

        return {
          ...current,
          [key]:
            currentList,
        };
      }
    );

    setFactsApplied(
      false
    );

    setSavedMessage(
      ""
    );
  }


  async function handleApplyFacts() {
    const facts =
      verifiedFacts;

    if (
      Object.keys(
        facts
      ).length ===
      0
    ) {
      return;
    }

    const nextDetails = {
      ...formData.details,
    };

    let nextTitle =
      formData.title;

    let nextTopic =
      formData.topic;

    let nextKeyMessage =
      formData.keyMessage;

    let nextSupportingPoints =
      formData.supportingPoints;

    if (
      category ===
      "research"
    ) {
      if (
        typeof facts.securityOrCompany ===
          "string" &&
        facts.securityOrCompany.trim()
      ) {
        nextTopic =
          facts.securityOrCompany.trim();

        if (
          !nextTitle.trim()
        ) {
          nextTitle =
            `${facts.securityOrCompany.trim()} Research Communication`;
        }
      }

      if (
        typeof facts.recommendation ===
        "string"
      ) {
        nextDetails.recommendation =
          facts.recommendation ||
          "";
      }

      if (
        typeof facts.currentPrice ===
        "string"
      ) {
        nextDetails.currentPrice =
          facts.currentPrice ||
          "";
      }

      if (
        typeof facts.targetPrice ===
        "string"
      ) {
        nextDetails.targetPrice =
          facts.targetPrice ||
          "";
      }

      if (
        typeof facts.timeHorizon ===
        "string"
      ) {
        nextDetails.timeHorizon =
          facts.timeHorizon ||
          "";
      }

      if (
        Array.isArray(
          facts.keyRationale
        )
      ) {
        nextDetails.rationale =
          facts.keyRationale
            .filter(
              Boolean
            )
            .join(
              "\n• "
            );
      }

      if (
        Array.isArray(
          facts.riskFactors
        )
      ) {
        nextDetails.riskFactors =
          facts.riskFactors
            .filter(
              Boolean
            )
            .join(
              "\n• "
            );
      }

      if (
        Array.isArray(
          facts.keyFacts
        )
      ) {
        nextSupportingPoints =
          facts.keyFacts
            .filter(
              Boolean
            )
            .join(
              "\n• "
            );
      }

      if (
        typeof facts.recommendation ===
          "string" &&
        facts.recommendation.trim()
      ) {
        nextKeyMessage =
          `Recommendation: ${facts.recommendation.trim()}`;
      }
    }

    if (
      category ===
      "regulatory"
    ) {
      if (
        typeof facts.subject ===
          "string" &&
        facts.subject.trim()
      ) {
        nextTopic =
          facts.subject.trim();

        if (
          !nextTitle.trim()
        ) {
          nextTitle =
            facts.subject.trim();
        }
      }

      if (
        typeof facts.authority ===
        "string"
      ) {
        nextDetails.authority =
          facts.authority ||
          "";
      }

      if (
        typeof facts.circularOrReferenceNumber ===
        "string"
      ) {
        nextDetails.referenceNumber =
          facts.circularOrReferenceNumber ||
          "";
      }

      if (
        typeof facts.effectiveDate ===
        "string"
      ) {
        nextDetails.deadline =
          normalizeDateForInput(
            facts.effectiveDate
          );
      }

      if (
        typeof facts.affectedProductsOrUsers ===
        "string"
      ) {
        nextDetails.affectedProducts =
          facts.affectedProductsOrUsers ||
          "";
      }

      if (
        Array.isArray(
          facts.requiredActions
        )
      ) {
        nextDetails.requiredActions =
          facts.requiredActions
            .filter(
              Boolean
            )
            .join(
              "\n• "
            );
      }

      if (
        Array.isArray(
          facts.keyFacts
        )
      ) {
        nextSupportingPoints =
          facts.keyFacts
            .filter(
              Boolean
            )
            .join(
              "\n• "
            );
      }

      if (
        typeof facts.applicability ===
          "string" &&
        facts.applicability.trim()
      ) {
        nextKeyMessage =
          facts.applicability.trim();
      }
    }

    setFormData(
      (current) => ({
        ...current,

        title:
          nextTitle,

        topic:
          nextTopic,

        keyMessage:
          nextKeyMessage,

        supportingPoints:
          nextSupportingPoints,

        details:
          nextDetails,
      })
    );

    setFactsApplied(
      true
    );

    setHasUnsavedChanges(
      true
    );

    try {
      await persistVerifiedFacts(
        facts,
        true
      );
    } catch (err) {
      console.error(
        "Unable to persist verified facts:",
        err
      );
    }

    setSavedMessage(
      "Verified facts applied to the form."
    );
  }


  async function handlePdfFile(
    file:
      File
  ) {
    if (
      !communicationId ||
      uploadingFile
    ) {
      return;
    }

    const validationError =
      validatePdfFile(
        file
      );

    if (
      validationError
    ) {
      setUploadError(
        validationError
      );

      return;
    }

    try {
      setUploadingFile(
        true
      );

      setUploadError(
        ""
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      const previousFile =
        sourceFile;

      const uploaded =
        await uploadCommunicationPdf({
          communicationId,
          file,
        });

      try {
        await persistSourceFile(
          uploaded
        );
      } catch (
        metadataError
      ) {
        try {
          await removeCommunicationPdf(
            uploaded.path
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to clean up uploaded PDF:",
            cleanupError
          );
        }

        throw metadataError;
      }

      setSourceFile(
        uploaded
      );

      setExtractionResult(
        null
      );

      setExtractionError(
        ""
      );

      setFactExtraction(
        null
      );

      setVerifiedFacts(
        {}
      );

      setFactsApplied(
        false
      );

      setFactExtractionError(
        ""
      );

      setHasUnsavedChanges(
        false
      );

      setSavedMessage(
        "PDF uploaded successfully."
      );

      if (
        previousFile?.path &&
        previousFile.path !==
          uploaded.path
      ) {
        try {
          await removeCommunicationPdf(
            previousFile.path
          );
        } catch (
          removeOldError
        ) {
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
      setUploadingFile(
        false
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }


  async function handleRemovePdf() {
    if (
      !sourceFile ||
      removingFile
    ) {
      return;
    }

    try {
      setRemovingFile(
        true
      );

      setUploadError(
        ""
      );

      setError(
        ""
      );

      await removeCommunicationPdf(
        sourceFile.path
      );

      await persistSourceFile(
        null
      );

      setSourceFile(
        null
      );

      setExtractionResult(
        null
      );

      setExtractionError(
        ""
      );

      setFactExtraction(
        null
      );

      setVerifiedFacts(
        {}
      );

      setFactsApplied(
        false
      );

      setFactExtractionError(
        ""
      );

      setSavedMessage(
        "PDF removed."
      );
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
      setRemovingFile(
        false
      );
    }
  }


  function handleFileInputChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[
        0
      ];

    if (
      file
    ) {
      void handlePdfFile(
        file
      );
    }
  }


  function handleDragOver(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (
      !uploadingFile
    ) {
      setDragActive(
        true
      );
    }
  }


  function handleDragLeave(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(
      false
    );
  }


  function handleDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragActive(
      false
    );

    const file =
      event.dataTransfer.files?.[
        0
      ];

    if (
      file
    ) {
      void handlePdfFile(
        file
      );
    }
  }


  async function saveToSupabase(
    nextStatus =
      "draft"
  ) {
    if (
      !communicationId
    ) {
      throw new Error(
        "Communication ID is missing. Please return to the dashboard and start again."
      );
    }

    const normalizedCommunicationName =
      formData.title
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (
      normalizedCommunicationName.length <
      3
    ) {
      throw new Error(
        "Communication Name must contain at least 3 characters."
      );
    }

    if (
      normalizedCommunicationName.length >
      100
    ) {
      throw new Error(
        "Communication Name cannot exceed 100 characters."
      );
    }

    const databaseCategory =
      mapCategoryToDatabase(
        category
      );

    const inputData =
      buildInputData();

    const hadCreatorChanges =
      hasUnsavedChanges;

    const result =
      await updateCommunication(
        communicationId,
        {
          title:
            normalizedCommunicationName,

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

            communicationType:
              category ===
                "product"
                ? formData.details.communicationType ||
                  null
                : null,
          },
        }
      );

    if (
      formData.title !==
      normalizedCommunicationName
    ) {
      setFormData(
        (current) => ({
          ...current,
          title:
            normalizedCommunicationName,
        })
      );
    }

    if (
      hadCreatorChanges
    ) {
      await markCreatorRevisionComplete(
        communicationId
      );
    }

    return result;
  }


  async function handleSaveDraft() {
    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

      await saveToSupabase(
        "draft"
      );

      setSavedMessage(
        "All changes saved."
      );

      setHasUnsavedChanges(
        false
      );
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
      setSaving(
        false
      );
    }
  }


  async function handleGenerate() {
    if (
      generating
    ) {
      return;
    }

    if (
      inputMethod ===
        "upload" &&
      sourceFile &&
      !extractionResult
    ) {
      setError(
        "Please process the uploaded PDF before generating communication options."
      );

      return;
    }

    if (
      inputMethod ===
        "upload" &&
      sourceFile &&
      extractionResult &&
      !extractionResult.relevance.relevant
    ) {
      setError(
        "This PDF may not be relevant to the selected category. Please review the document or choose another PDF before generating."
      );

      return;
    }

    if (
      inputMethod ===
        "upload" &&
      sourceFile &&
      extractionResult?.relevance.relevant &&
      !factExtraction
    ) {
      setError(
        "Please extract and verify the key facts from the PDF before generating communication options."
      );

      return;
    }

    if (
      inputMethod ===
        "upload" &&
      sourceFile &&
      factExtraction &&
      !factsApplied
    ) {
      setError(
        "Please review the extracted facts and click “Use these facts” before generating communication options."
      );

      return;
    }

    if (
      category ===
        "product" &&
      formData.details.communicationType ===
        "feature_explainer"
    ) {
      const featureIssues =
        getFeatureExplainerInputIssues({
          inputMethod,

          details:
            formData.details,

          pastedContent:
            formData.details.pastedContent ||
            "",

          verifiedFacts,

          factsApplied,
        });

      if (
        featureIssues.length >
        0
      ) {
        setError(
          featureIssues[
            0
          ]
        );

        return;
      }
    }

    if (
      !communicationId
    ) {
      setError(
        "Communication ID is missing. Please return to the dashboard and start again."
      );

      return;
    }

    try {
      setGenerating(
        true
      );

      setError(
        ""
      );

      setSavedMessage(
        ""
      );

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
            status:
              "draft",
          }
        );
      } catch (
        statusError
      ) {
        console.error(
          "Unable to restore draft status:",
          statusError
        );
      }
    } finally {
      setGenerating(
        false
      );
    }
  }


  function handleBack() {
    if (
      communicationId
    ) {
      navigate(
        `/create/category?communicationId=${encodeURIComponent(
          communicationId
        )}`
      );

      return;
    }

    navigate("/");
  }


  if (
    loadingDraft
  ) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />

        <main className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#07877B]" />
            Loading communication...
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
          formData.title ||
          "Untitled Communication"
        }
        category={
          category
        }
        status="input-complete"
        currentStep={
          2
        }
        totalSteps={
          5
        }
        onSaveDraft={
          handleSaveDraft
        }
      />

      <ProgressStepper
        currentStep={
          2
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-9 sm:px-8 sm:py-10">
        <button
          type="button"
          onClick={
            handleBack
          }
          disabled={
            saving ||
            generating
          }
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#07877B] disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Category
        </button>

        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#07877B]" />

              <p className="text-sm font-medium text-[#07877B]">
                Expert Creation
              </p>
            </div>

            <h1 className="text-3xl text-gray-900">
              Give AI the source information
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              Add the verified facts and instructions that should shape the communication.
              You can enter them manually, paste source material, upload a PDF for
              extraction, or retain a source URL for reference.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e8f5f4] px-3 py-1.5 text-xs font-medium text-[#075f58]">
              {getCategoryLabel(
                category
              )}
            </span>

            <SaveState
              saving={
                saving
              }
              hasUnsavedChanges={
                hasUnsavedChanges
              }
              savedMessage={
                savedMessage
              }
            />
          </div>
        </header>

        {!communicationId && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Communication ID is missing. Please return to the Dashboard and start again.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {savedMessage &&
          !hasUnsavedChanges && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {savedMessage}
            </div>
          )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <FormSection
              number="01"
              title="Communication basics"
              helper="Identify the communication and who should receive it."
            >
              <TextField
                label="Communication Name"
                value={
                  formData.title
                }
                onChange={(value) =>
                  updateField(
                    "title",
                    value
                  )
                }
                placeholder="e.g., SIP Awareness – September 2026"
                required
                maxLength={
                  100
                }
                helper="Internal working name used in Communication History and approvals. Channel-facing titles and subjects are generated separately."
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
                    SUBCATEGORIES[
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
                    AUDIENCE_TYPES[
                      category
                    ]
                  }
                  placeholder="Select audience"
                />
              </div>
            </FormSection>


            <FormSection
              number="02"
              title="Source information"
              helper="Choose the easiest way to provide the facts AI should work from."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {INPUT_METHODS.map(
                  (
                    method
                  ) => {
                    const Icon =
                      method.icon;

                    const selected =
                      inputMethod ===
                      method.id;

                    return (
                      <button
                        type="button"
                        key={
                          method.id
                        }
                        onClick={() =>
                          handleInputMethodChange(
                            method.id
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? "border-[#07877B] bg-[#f3fbfa]"
                            : "border-gray-200 bg-white hover:border-[#9bcfc9] hover:bg-gray-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-[#dff2ef] text-[#07877B]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <SelectionIndicator
                            selected={
                              selected
                            }
                          />
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-900">
                          {
                            method.label
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {
                            method.helper
                          }
                        </p>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
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
                      rows={
                        3
                      }
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
                      rows={
                        4
                      }
                      placeholder={
                        getSupportingPlaceholder(
                          category
                        )
                      }
                    />
                  </div>
                )}

                {inputMethod ===
                  "paste" && (
                  <TextAreaField
                    label="Paste source content"
                    value={
                      formData.details.pastedContent ||
                      ""
                    }
                    onChange={(value) =>
                      updateDetail(
                        "pastedContent",
                        value
                      )
                    }
                    rows={
                      12
                    }
                    placeholder="Paste the available source content here. AI will structure it in the next stage."
                  />
                )}

                {inputMethod ===
                  "url" && (
                  <div className="space-y-3">
                    <TextField
                      label="Source URL"
                      value={
                        formData.details.sourceUrl ||
                        ""
                      }
                      onChange={(value) =>
                        updateDetail(
                          "sourceUrl",
                          value
                        )
                      }
                      placeholder="https://..."
                      type="url"
                    />

                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                      The URL is retained as a source reference. For communication types
                      that require verified facts, add those facts in the category-specific
                      section rather than relying on the URL alone.
                    </div>
                  </div>
                )}

                {inputMethod ===
                  "upload" && (
                  <PdfSourcePanel
                    sourceFile={
                      sourceFile
                    }
                    uploadingFile={
                      uploadingFile
                    }
                    removingFile={
                      removingFile
                    }
                    dragActive={
                      dragActive
                    }
                    fileInputRef={
                      fileInputRef
                    }
                    uploadError={
                      uploadError
                    }
                    processingPdf={
                      processingPdf
                    }
                    extractionResult={
                      extractionResult
                    }
                    extractionError={
                      extractionError
                    }
                    extractingFacts={
                      extractingFacts
                    }
                    factExtraction={
                      factExtraction
                    }
                    factExtractionError={
                      factExtractionError
                    }
                    category={
                      category
                    }
                    verifiedFacts={
                      verifiedFacts
                    }
                    factsApplied={
                      factsApplied
                    }
                    onFileInputChange={
                      handleFileInputChange
                    }
                    onDragOver={
                      handleDragOver
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={
                      handleDrop
                    }
                    onReplace={() =>
                      fileInputRef.current?.click()
                    }
                    onRemove={() =>
                      void handleRemovePdf()
                    }
                    onProcess={() =>
                      void handleProcessPdf()
                    }
                    onExtractFacts={() =>
                      void handleExtractFacts()
                    }
                    onChangeFact={
                      updateVerifiedFact
                    }
                    onChangeListItem={
                      updateVerifiedListItem
                    }
                    onApplyFacts={() =>
                      void handleApplyFacts()
                    }
                  />
                )}
              </div>
            </FormSection>


            <CategorySpecificFields
              category={
                category
              }
              details={
                formData.details
              }
              updateDetail={
                updateDetail
              }
            />


            <FormSection
              number="04"
              title="Call to action"
              helper="Optional. Add this only when the communication should drive the reader to a specific action."
            >
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
            </FormSection>
          </div>


          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#07877B]" />

                <p className="text-sm font-medium text-gray-900">
                  AI guidance
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {getAiTip(
                  category
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-medium text-gray-900">
                Input readiness
              </p>

              <div className="mt-4 space-y-3">
                <ReadinessItem
                  ready={
                    formData.title
                      .trim()
                      .length >=
                    3
                  }
                  label="Communication name"
                />

                <ReadinessItem
                  ready={
                    Boolean(
                      formData.subcategory
                    )
                  }
                  label="Subcategory"
                />

                <ReadinessItem
                  ready={
                    Boolean(
                      formData.audience
                    )
                  }
                  label="Audience"
                />

                <ReadinessItem
                  ready={
                    getSourceReady({
                      inputMethod,
                      formData,
                      sourceFile,
                      extractionResult,
                      factExtraction,
                      factsApplied,
                    })
                  }
                  label="Source information"
                />
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs leading-5 text-gray-500">
                  AI will generate from the information you provide. Specific facts,
                  dates, prices, recommendations and mandatory requirements should
                  always come from a verified source.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleSaveDraft()
              }
              disabled={
                saving ||
                generating ||
                !communicationId
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
          </aside>
        </div>


        <div className="mt-9 border-t border-gray-200 pt-6">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={
                handleBack
              }
              disabled={
                saving ||
                generating
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <p className="text-xs text-gray-500 sm:text-right">
                Next: AI generates the communication options
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleGenerate()
                }
                disabled={
                  saving ||
                  generating ||
                  !communicationId
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {category ===
                    "regulatory"
                      ? "Generate 2 Options"
                      : "Generate 3 Options"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


function PdfSourcePanel({
  sourceFile,
  uploadingFile,
  removingFile,
  dragActive,
  fileInputRef,
  uploadError,
  processingPdf,
  extractionResult,
  extractionError,
  extractingFacts,
  factExtraction,
  factExtractionError,
  category,
  verifiedFacts,
  factsApplied,
  onFileInputChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onReplace,
  onRemove,
  onProcess,
  onExtractFacts,
  onChangeFact,
  onChangeListItem,
  onApplyFacts,
}: {
  sourceFile:
    SourceFileMetadata | null;

  uploadingFile:
    boolean;

  removingFile:
    boolean;

  dragActive:
    boolean;

  fileInputRef:
    RefObject<HTMLInputElement | null>;

  uploadError:
    string;

  processingPdf:
    boolean;

  extractionResult:
    PdfExtractionResult | null;

  extractionError:
    string;

  extractingFacts:
    boolean;

  factExtraction:
    FactExtractionResponse | null;

  factExtractionError:
    string;

  category:
    Category;

  verifiedFacts:
    Record<string, any>;

  factsApplied:
    boolean;

  onFileInputChange:
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => void;

  onDragOver:
    (
      event:
        DragEvent<HTMLDivElement>
    ) => void;

  onDragLeave:
    (
      event:
        DragEvent<HTMLDivElement>
    ) => void;

  onDrop:
    (
      event:
        DragEvent<HTMLDivElement>
    ) => void;

  onReplace:
    () => void;

  onRemove:
    () => void;

  onProcess:
    () => void;

  onExtractFacts:
    () => void;

  onChangeFact:
    (
      key:
        string,
      value:
        any
    ) => void;

  onChangeListItem:
    (
      key:
        string,
      index:
        number,
      value:
        string
    ) => void;

  onApplyFacts:
    () => void;
}) {
  return (
    <div className="space-y-4">
      <input
        ref={
          fileInputRef
        }
        type="file"
        accept=".pdf,application/pdf"
        onChange={
          onFileInputChange
        }
        className="hidden"
      />

      {!sourceFile ? (
        <div
          onDragOver={
            onDragOver
          }
          onDragLeave={
            onDragLeave
          }
          onDrop={
            onDrop
          }
          className={`rounded-2xl border border-dashed px-6 py-10 text-center transition-all ${
            dragActive
              ? "border-[#07877B] bg-[#f3fbfa]"
              : "border-gray-300 bg-gray-50/60"
          }`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
            {uploadingFile ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#07877B]" />
            ) : (
              <FileUp className="h-5 w-5 text-[#07877B]" />
            )}
          </div>

          <p className="mt-4 text-sm font-medium text-gray-900">
            {uploadingFile
              ? "Uploading PDF..."
              : "Drop a PDF here or choose a file"}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            PDF only · Maximum 10 MB · One source file
          </p>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              uploadingFile
            }
            className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Choose PDF
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f5f4]">
                <CheckCircle2 className="h-5 w-5 text-[#07877B]" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {
                    sourceFile.name
                  }
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

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={
                  onReplace
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
                onClick={
                  onRemove
                }
                disabled={
                  uploadingFile ||
                  removingFile
                }
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {removingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <InlineError>
          {uploadError}
        </InlineError>
      )}

      {sourceFile &&
        !extractionResult && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Process the PDF
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Extract text and check whether the document is relevant to the selected communication category.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onProcess
                }
                disabled={
                  processingPdf
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#06766a] disabled:opacity-50"
              >
                {processingPdf ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanSearch className="h-4 w-4" />
                )}

                {processingPdf
                  ? "Processing..."
                  : "Process PDF"}
              </button>
            </div>
          </div>
        )}

      {extractionError && (
        <InlineError>
          {extractionError}
        </InlineError>
      )}

      {extractionResult && (
        <div
          className={`rounded-2xl border p-5 ${
            extractionResult.relevance.relevant
              ? "border-green-200 bg-green-50/40"
              : "border-amber-200 bg-amber-50/50"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  extractionResult.relevance.relevant
                    ? "bg-green-100"
                    : "bg-amber-100"
                }`}
              >
                {extractionResult.relevance.relevant ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {extractionResult.relevance.relevant
                    ? "Document looks relevant"
                    : "Relevance needs review"}
                </p>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-600">
                  {
                    extractionResult.relevance.reason
                  }
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                extractionResult.relevance.relevant
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {extractionResult.relevance.score}% relevance
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Pages"
              value={
                String(
                  extractionResult.extraction.pageCount
                )
              }
            />

            <Metric
              label="Extracted text"
              value={`${extractionResult.extraction.cleanedCharacters.toLocaleString()} chars`}
            />

            <Metric
              label="OCR required"
              value={
                extractionResult.extraction.requiresOcr
                  ? "Yes"
                  : "No"
              }
            />
          </div>

          {extractionResult.relevance.matchedSignals.length >
            0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-600">
                Matched signals
              </p>

              <div className="flex flex-wrap gap-2">
                {extractionResult.relevance.matchedSignals.map(
                  (
                    signal
                  ) => (
                    <span
                      key={
                        signal
                      }
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600"
                    >
                      {signal}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {extractionResult.relevance.relevant &&
            !factExtraction && (
              <div className="mt-5 border-t border-green-200 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Extract the key facts
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      AI identifies the important source facts so you can verify them before generation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      onExtractFacts
                    }
                    disabled={
                      extractingFacts
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#07877B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#06766a] disabled:opacity-50"
                  >
                    {extractingFacts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <WandSparkles className="h-4 w-4" />
                    )}

                    {extractingFacts
                      ? "Extracting facts..."
                      : "Extract Key Facts"}
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {factExtractionError && (
        <InlineError>
          {factExtractionError}
        </InlineError>
      )}

      {factExtraction && (
        <FactVerificationPanel
          category={
            category
          }
          facts={
            verifiedFacts
          }
          usage={
            factExtraction.usage
          }
          applied={
            factsApplied
          }
          onChange={
            onChangeFact
          }
          onChangeListItem={
            onChangeListItem
          }
          onApply={
            onApplyFacts
          }
        />
      )}
    </div>
  );
}


function FactVerificationPanel({
  category,
  facts,
  usage,
  applied,
  onChange,
  onChangeListItem,
  onApply,
}: {
  category:
    Category;

  facts:
    Record<
      string,
      any
    >;

  usage: {
    sourceCharacters:
      number;

    promptTokens:
      number | null;

    completionTokens:
      number | null;

    totalTokens:
      number | null;

    model:
      string;
  };

  applied:
    boolean;

  onChange:
    (
      key:
        string,
      value:
        any
    ) => void;

  onChangeListItem:
    (
      key:
        string,
      index:
        number,
      value:
        string
    ) => void;

  onApply:
    () => void;
}) {
  const visibleFields =
    getFactFields(
      category
    );

  return (
    <div className="rounded-2xl border border-[#bfe4df] bg-[#f7fcfb] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PencilLine className="h-4 w-4 text-[#07877B]" />

            <h3 className="text-sm font-medium text-gray-900">
              Review extracted facts
            </h3>
          </div>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            Check these source facts before using them in the communication.
          </p>
        </div>

        {usage.totalTokens !==
          null &&
          usage.model !==
            "saved" && (
            <div className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
              {usage.totalTokens.toLocaleString()} tokens
            </div>
          )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleFields.map(
          (
            field
          ) => {
            const value =
              facts[
                field.key
              ];

            if (
              field.type ===
              "list"
            ) {
              const items =
                Array.isArray(
                  value
                )
                  ? value
                  : [];

              return (
                <div
                  key={
                    field.key
                  }
                  className="sm:col-span-2"
                >
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    {
                      field.label
                    }
                  </label>

                  {items.length ===
                  0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-xs text-gray-400">
                      Not found in source
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map(
                        (
                          item:
                            string,
                          index:
                            number
                        ) => (
                          <input
                            key={`${field.key}-${index}`}
                            value={
                              item ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              onChangeListItem(
                                field.key,
                                index,
                                event.target.value
                              )
                            }
                            className={inputClassName}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={
                  field.key
                }
              >
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  {
                    field.label
                  }
                </label>

                <input
                  value={
                    typeof value ===
                      "string"
                      ? value
                      : ""
                  }
                  onChange={(
                    event
                  ) =>
                    onChange(
                      field.key,
                      event.target.value
                    )
                  }
                  placeholder="Not found in source"
                  className={inputClassName}
                />
              </div>
            );
          }
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[#d8ebe8] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-gray-500">
          Missing facts can stay blank. Do not add information that is not supported by the source.
        </p>

        <button
          type="button"
          onClick={
            onApply
          }
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
            applied
              ? "border border-green-200 bg-green-50 text-green-700"
              : "bg-[#07877B] text-white hover:bg-[#06766a]"
          }`}
        >
          <CircleCheckBig className="h-4 w-4" />

          {applied
            ? "Facts applied"
            : "Use these facts"}
        </button>
      </div>
    </div>
  );
}


function CategorySpecificFields({
  category,
  details,
  updateDetail,
}: {
  category:
    Category;

  details:
    Record<
      string,
      string
    >;

  updateDetail:
    (
      field:
        string,
      value:
        string
    ) => void;
}) {
  if (
    category ===
    "research"
  ) {
    return (
      <FormSection
        number="03"
        title="Fundamental Research details"
        helper="Add the verified recommendation, price information, rationale and risk factors."
      >
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
          rows={
            4
          }
          placeholder="Why this recommendation? Add the key verified drivers and catalysts."
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
          rows={
            4
          }
          placeholder="Key risks investors should be aware of."
        />
      </FormSection>
    );
  }


  if (
    category ===
    "education"
  ) {
    return (
      <FormSection
        number="03"
        title="Investor Education details"
        helper="Define the complexity, format and learning outcome."
      >
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
          rows={
            3
          }
          placeholder="What should readers understand after reading?"
        />
      </FormSection>
    );
  }


  if (
    category ===
    "product"
  ) {
    const communicationType =
      details.communicationType ||
      "";

    const isFeatureExplainer =
      communicationType ===
      "feature_explainer";

    return (
      <FormSection
        number="03"
        title="Product & Sales details"
        helper="Choose the communication intent and provide the verified product facts."
      >
        <div className="rounded-xl border border-[#bfe4df] bg-[#f7fcfb] p-4">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#07877B]" />

            <p className="text-sm font-medium text-gray-900">
              Communication intent
            </p>
          </div>

          <p className="mb-4 text-xs leading-5 text-gray-500">
            This controls the content architecture used by AI.
          </p>

          <ValueSelectField
            label="Communication Type"
            value={
              communicationType
            }
            onChange={(value) =>
              updateDetail(
                "communicationType",
                value
              )
            }
            placeholder="Select communication type"
            options={[
              {
                value:
                  "feature_explainer",
                label:
                  "Feature Explainer",
              },
              {
                value:
                  "product_launch",
                label:
                  "Product Launch",
              },
              {
                value:
                  "product_update",
                label:
                  "Product Update",
              },
              {
                value:
                  "offer_plan",
                label:
                  "Offer / Plan",
              },
              {
                value:
                  "product_benefit",
                label:
                  "Product Benefit",
              },
              {
                value:
                  "cross_sell_adoption",
                label:
                  "Cross-sell / Adoption",
              },
            ]}
          />
        </div>

        {isFeatureExplainer ? (
          <>
            <div className="rounded-xl bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">
                Provide the facts, not the email copy
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Add enough verified information for AI to explain what the feature is,
                why it matters, how it works and how customers can use it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Feature Name *"
                value={
                  details.featureName ||
                  ""
                }
                onChange={(value) =>
                  updateDetail(
                    "featureName",
                    value
                  )
                }
                placeholder="e.g., One-Cancel-Other (OCO) Orders"
              />

              <TextField
                label="Product / Platform *"
                value={
                  details.productPlatform ||
                  ""
                }
                onChange={(value) =>
                  updateDetail(
                    "productPlatform",
                    value
                  )
                }
                placeholder="e.g., Flip"
              />
            </div>

            <TextAreaField
              label="What is the feature? *"
              value={
                details.featureExplanation ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "featureExplanation",
                  value
                )
              }
              rows={
                4
              }
              placeholder="Explain the feature factually in simple terms. What does it enable the customer to do?"
            />

            <TextAreaField
              label="Customer need / problem it addresses"
              value={
                details.customerProblem ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "customerProblem",
                  value
                )
              }
              rows={
                3
              }
              placeholder="What customer situation, task or problem makes this feature useful?"
            />

            <TextAreaField
              label="How does it work? *"
              value={
                details.howItWorks ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "howItWorks",
                  value
                )
              }
              rows={
                4
              }
              placeholder="Describe the verified mechanism or workflow. Do not add unsupported steps."
            />

            <TextAreaField
              label="Key benefits / capabilities *"
              value={
                details.keyBenefits ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "keyBenefits",
                  value
                )
              }
              rows={
                4
              }
              placeholder={"One benefit per line, for example:\nManage two related orders together\nReduce manual order monitoring"}
            />

            <TextAreaField
              label="Practical example / use case"
              value={
                details.practicalExample ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "practicalExample",
                  value
                )
              }
              rows={
                4
              }
              placeholder="Add a verified example or scenario. Leave blank if the source does not support one."
            />

            <TextAreaField
              label="How to access / use the feature"
              value={
                details.usageGuidance ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "usageGuidance",
                  value
                )
              }
              rows={
                4
              }
              placeholder="Where is the feature available and what should the customer do? Add only verified steps."
            />

            <TextAreaField
              label="Important conditions / limitations"
              value={
                details.conditionsLimitations ||
                ""
              }
              onChange={(value) =>
                updateDetail(
                  "conditionsLimitations",
                  value
                )
              }
              rows={
                4
              }
              placeholder="Eligibility, operational conditions, limitations, risks or other points customers should know."
            />

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

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
              rows={
                4
              }
              placeholder="List the main verified features and benefits."
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
          </>
        )}
      </FormSection>
    );
  }


  if (
    category ===
    "service"
  ) {
    return (
      <FormSection
        number="03"
        title="Service & Transactional details"
        helper="Describe the service change, timing and customer impact."
      >
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
          rows={
            3
          }
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


  if (
    category ===
    "regulatory"
  ) {
    return (
      <FormSection
        number="03"
        title="Regulatory & Compliance details"
        helper="Capture the authority, reference, deadline and required action exactly."
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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
          rows={
            4
          }
        />
      </FormSection>
    );
  }


  return (
    <FormSection
      number="03"
      title="Onboarding & Journey details"
      helper="Define the journey stage, user segment and expected next action."
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

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
        rows={
          3
        }
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


function FormSection({
  number,
  title,
  helper,
  children,
}: {
  number:
    string;

  title:
    string;

  helper:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5 sm:px-7">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 text-xs font-semibold tracking-[0.14em] text-[#07877B]">
            {number}
          </span>

          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {helper}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6 sm:px-7">
        {children}
      </div>
    </section>
  );
}


const inputClassName =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#07877B] focus:ring-4 focus:ring-[#07877B]/10";


function TextField({
  label,
  value,
  onChange,
  placeholder =
    "",
  type =
    "text",
  required =
    false,
  maxLength,
  helper,
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  placeholder?:
    string;

  type?:
    string;

  required?:
    boolean;

  maxLength?:
    number;

  helper?:
    string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span
            className="ml-1 text-red-500"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        maxLength={
          maxLength
        }
        aria-required={
          required
            ? true
            : undefined
        }
        className={
          inputClassName
        }
      />

      {helper && (
        <p className="mt-2 text-xs leading-5 text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
}


function TextAreaField({
  label,
  value,
  onChange,
  placeholder =
    "",
  rows =
    3,
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  placeholder?:
    string;

  rows?:
    number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <textarea
        rows={
          rows
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className={`${inputClassName} resize-y leading-6`}
      />
    </div>
  );
}


function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder =
    "Select",
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  options:
    string[];

  placeholder?:
    string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClassName
        }
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  );
}


function ValueSelectField({
  label,
  value,
  onChange,
  options,
  placeholder =
    "Select",
}: {
  label:
    string;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  options:
    Array<{
      value:
        string;

      label:
        string;
    }>;

  placeholder?:
    string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClassName
        }
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </div>
  );
}


function SelectionIndicator({
  selected,
}: {
  selected:
    boolean;
}) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        selected
          ? "border-[#07877B] bg-[#07877B]"
          : "border-gray-300 bg-white"
      }`}
    >
      {selected && (
        <Check className="h-3.5 w-3.5 text-white" />
      )}
    </div>
  );
}


function Metric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-3">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}


function InlineError({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}


function SaveState({
  saving,
  hasUnsavedChanges,
  savedMessage,
}: {
  saving:
    boolean;

  hasUnsavedChanges:
    boolean;

  savedMessage:
    string;
}) {
  if (
    saving
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving
      </span>
    );
  }

  if (
    hasUnsavedChanges
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        Unsaved changes
      </span>
    );
  }

  if (
    savedMessage
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }

  return null;
}


function ReadinessItem({
  ready,
  label,
}: {
  ready:
    boolean;

  label:
    string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ready
            ? "bg-[#e8f5f4] text-[#07877B]"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {ready ? (
          <Check className="h-3 w-3" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>

      <span
        className={`text-sm ${
          ready
            ? "text-gray-700"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}


function getSourceReady({
  inputMethod,
  formData,
  sourceFile,
  extractionResult,
  factExtraction,
  factsApplied,
}: {
  inputMethod:
    InputMethod;

  formData:
    FormData;

  sourceFile:
    SourceFileMetadata | null;

  extractionResult:
    PdfExtractionResult | null;

  factExtraction:
    FactExtractionResponse | null;

  factsApplied:
    boolean;
}) {
  switch (
    inputMethod
  ) {
    case "manual":
      return Boolean(
        formData.topic.trim() ||
        formData.keyMessage.trim() ||
        formData.supportingPoints.trim()
      );

    case "paste":
      return Boolean(
        formData.details.pastedContent?.trim()
      );

    case "url":
      return Boolean(
        formData.details.sourceUrl?.trim()
      );

    case "upload":
      return Boolean(
        sourceFile &&
        extractionResult?.relevance.relevant &&
        factExtraction &&
        factsApplied
      );
  }
}


function getFactFields(
  category:
    Category
) {
  if (
    category ===
    "research"
  ) {
    return [
      {
        key:
          "securityOrCompany",
        label:
          "Company / Security",
        type:
          "text",
      },
      {
        key:
          "reportDate",
        label:
          "Report Date",
        type:
          "text",
      },
      {
        key:
          "recommendation",
        label:
          "Recommendation",
        type:
          "text",
      },
      {
        key:
          "currentPrice",
        label:
          "Current Price / CMP",
        type:
          "text",
      },
      {
        key:
          "targetPrice",
        label:
          "Target Price",
        type:
          "text",
      },
      {
        key:
          "timeHorizon",
        label:
          "Time Horizon",
        type:
          "text",
      },
      {
        key:
          "valuation",
        label:
          "Valuation",
        type:
          "text",
      },
      {
        key:
          "keyRationale",
        label:
          "Key Rationale",
        type:
          "list",
      },
      {
        key:
          "riskFactors",
        label:
          "Risk Factors",
        type:
          "list",
      },
      {
        key:
          "keyFacts",
        label:
          "Other Key Facts",
        type:
          "list",
      },
    ];
  }

  if (
    category ===
    "regulatory"
  ) {
    return [
      {
        key:
          "authority",
        label:
          "Authority",
        type:
          "text",
      },
      {
        key:
          "circularOrReferenceNumber",
        label:
          "Circular / Reference Number",
        type:
          "text",
      },
      {
        key:
          "subject",
        label:
          "Subject",
        type:
          "text",
      },
      {
        key:
          "issueDate",
        label:
          "Issue Date",
        type:
          "text",
      },
      {
        key:
          "effectiveDate",
        label:
          "Effective Date",
        type:
          "text",
      },
      {
        key:
          "applicability",
        label:
          "Applicability",
        type:
          "text",
      },
      {
        key:
          "affectedProductsOrUsers",
        label:
          "Affected Products / Users",
        type:
          "text",
      },
      {
        key:
          "requiredActions",
        label:
          "Required Actions",
        type:
          "list",
      },
      {
        key:
          "deadlines",
        label:
          "Deadlines",
        type:
          "list",
      },
      {
        key:
          "keyFacts",
        label:
          "Other Key Facts",
        type:
          "list",
      },
    ];
  }

  return [
    {
      key:
        "topicOrProduct",
      label:
        "Topic / Product",
      type:
        "text",
    },
    {
      key:
        "dateOrTimeline",
      label:
        "Date / Timeline",
      type:
        "text",
    },
    {
      key:
        "audienceOrApplicability",
      label:
        "Audience / Applicability",
      type:
        "text",
    },
    {
      key:
        "keyMessage",
      label:
        "Key Message",
      type:
        "text",
    },
    {
      key:
        "keyFacts",
      label:
        "Key Facts",
      type:
        "list",
    },
    {
      key:
        "requiredActions",
      label:
        "Required Actions",
      type:
        "list",
    },
    {
      key:
        "riskOrLimitations",
      label:
        "Risks / Limitations",
      type:
        "list",
    },
  ];
}


function getFeatureExplainerInputIssues({
  inputMethod,
  details,
  pastedContent,
  verifiedFacts,
  factsApplied,
}: {
  inputMethod:
    string;

  details:
    Record<
      string,
      string
    >;

  pastedContent:
    string;

  verifiedFacts:
    Record<
      string,
      any
    >;

  factsApplied:
    boolean;
}) {
  const issues:
    string[] =
      [];

  const hasStructuredCore =
    Boolean(
      details.featureName?.trim()
    ) &&
    Boolean(
      details.featureExplanation?.trim()
    ) &&
    Boolean(
      details.howItWorks?.trim()
    ) &&
    Boolean(
      details.keyBenefits?.trim()
    );

  const hasSubstantialPaste =
    inputMethod ===
      "paste" &&
    pastedContent.trim().length >=
      220;

  const hasVerifiedUploadFacts =
    inputMethod ===
      "upload" &&
    factsApplied &&
    Object.keys(
      verifiedFacts
    ).length >
      0;

  if (
    inputMethod ===
      "url" &&
    !hasStructuredCore
  ) {
    issues.push(
      "A source URL alone is not enough for a Feature Explainer. Add the verified feature facts below — what the feature is, how it works and its key benefits — or paste/upload the supporting content."
    );

    return issues;
  }

  if (
    !hasStructuredCore &&
    !hasSubstantialPaste &&
    !hasVerifiedUploadFacts
  ) {
    issues.push(
      "Please provide enough verified information for the Feature Explainer. At minimum add the Feature Name, What is the feature?, How does it work? and Key benefits / capabilities, or provide substantial pasted/uploaded source content."
    );
  }

  return issues;
}


function normalizeDateForInput(
  value:
    string
) {
  const trimmed =
    value.trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      trimmed
    )
  ) {
    return trimmed;
  }

  return "";
}


function mapCategoryToDatabase(
  value:
    Category
) {
  switch (
    value
  ) {
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


function getCategoryLabel(
  category:
    Category
) {
  switch (
    category
  ) {
    case "research":
      return "Fundamental Research";

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


function getTopicLabel(
  category:
    Category
) {
  switch (
    category
  ) {
    case "research":
      return "Topic / Security Name";

    case "education":
      return "Learning Topic";

    case "product":
      return "Product / Feature Name";

    case "service":
      return "Service / Update Type";

    case "regulatory":
      return "Regulation / Circular Name";

    case "onboarding":
      return "Journey Stage / Email Type";
  }
}


function getTopicPlaceholder(
  category:
    Category
) {
  switch (
    category
  ) {
    case "research":
      return "e.g., Reliance Industries";

    case "education":
      return "e.g., What are Mutual Funds?";

    case "product":
      return "e.g., Flip — OCO Orders";

    case "service":
      return "e.g., Platform Maintenance";

    case "regulatory":
      return "e.g., SEBI Circular";

    case "onboarding":
      return "e.g., Welcome Email";
  }
}


function getKeyMessagePlaceholder(
  category:
    Category
) {
  switch (
    category
  ) {
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

    case "onboarding":
      return "What is the main onboarding message?";
  }
}


function getSupportingPlaceholder(
  category:
    Category
) {
  switch (
    category
  ) {
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

    case "onboarding":
      return "Onboarding steps, benefits and guidance";
  }
}


function getAiTip(
  category:
    Category
) {
  switch (
    category
  ) {
    case "research":
      return "Include the recommendation, price information, rationale and risk factors accurately. AI must not invent research facts.";

    case "education":
      return "Focus on the learning objective and provide enough context for AI to simplify the topic without changing its meaning.";

    case "product":
      return "Choose the communication intent first. For feature explainers, provide verified facts about what the feature is, how it works, its benefits and any limitations.";

    case "service":
      return "Be precise about timing, affected services, customer impact and any action required.";

    case "regulatory":
      return "Use the exact authority, reference, applicability, deadline and required actions. Mandatory facts should come directly from the source.";

    case "onboarding":
      return "Keep the journey stage and next action clear so the communication can guide the customer without overwhelming them.";
  }
}


function isInputMethod(
  value:
    unknown
):
  value is InputMethod {
  return [
    "manual",
    "paste",
    "upload",
    "url",
  ].includes(
    String(
      value
    )
  );
}
