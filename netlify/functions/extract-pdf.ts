import { createClient } from "@supabase/supabase-js";
import {
  PDFParse,
  PasswordException,
} from "pdf-parse";

const MAX_FILE_BYTES =
  10 * 1024 * 1024;

const MAX_PAGES = 50;
const MIN_TEXT_CHARS = 200;
const COMPACT_TEXT_LIMIT = 15000;
const RELEVANT_TEXT_LIMIT = 8000;

type Category =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface RequestBody {
  sourcePath?: string;
  category?: Category;
}

interface RelevanceResult {
  relevant: boolean;
  score: number;
  matchedSignals: string[];
  reason: string;
}

export default async (
  request: Request
) => {
  if (
    request.method !== "POST"
  ) {
    return jsonResponse(
      405,
      {
        success: false,
        error:
          "Method not allowed.",
      }
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env
      .SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey
  ) {
    console.error(
      "Missing Supabase function environment variables."
    );

    return jsonResponse(
      500,
      {
        success: false,
        error:
          "PDF extraction service is not configured.",
      }
    );
  }

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authHeader ||
    !authHeader
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return jsonResponse(
      401,
      {
        success: false,
        error:
          "Authentication required.",
      }
    );
  }

  const token =
    authHeader
      .slice(7)
      .trim();

  const supabase =
    createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession:
            false,
          autoRefreshToken:
            false,
        },
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      }
    );

  const {
    data: userData,
    error: userError,
  } =
    await supabase.auth
      .getUser(token);

  if (
    userError ||
    !userData.user
  ) {
    return jsonResponse(
      401,
      {
        success: false,
        error:
          "Invalid or expired session. Please sign in again.",
      }
    );
  }

  let body:
    RequestBody;

  try {
    body =
      (await request.json()) as RequestBody;
  } catch {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          "Invalid request body.",
      }
    );
  }

  const sourcePath =
    body.sourcePath?.trim();

  const category =
    body.category;

  if (
    !sourcePath ||
    !category
  ) {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          "Source PDF path and category are required.",
      }
    );
  }

  /**
   * Defense in depth:
   * our Storage RLS already restricts
   * access, but the path must also start
   * with the authenticated user's UUID.
   */
  const firstFolder =
    sourcePath.split("/")[0];

  if (
    firstFolder !==
    userData.user.id
  ) {
    return jsonResponse(
      403,
      {
        success: false,
        error:
          "You do not have access to this source PDF.",
      }
    );
  }

  const {
    data: pdfBlob,
    error: downloadError,
  } =
    await supabase.storage
      .from(
        "communication-sources"
      )
      .download(
        sourcePath
      );

  if (
    downloadError ||
    !pdfBlob
  ) {
    console.error(
      "PDF download failed:",
      downloadError
    );

    return jsonResponse(
      404,
      {
        success: false,
        error:
          "Unable to read the uploaded PDF.",
      }
    );
  }

  if (
    pdfBlob.size <= 0
  ) {
    return jsonResponse(
      422,
      {
        success: false,
        error:
          "The uploaded PDF is empty.",
        code:
          "EMPTY_FILE",
      }
    );
  }

  if (
    pdfBlob.size >
    MAX_FILE_BYTES
  ) {
    return jsonResponse(
      413,
      {
        success: false,
        error:
          "PDF must be 10 MB or smaller.",
        code:
          "FILE_TOO_LARGE",
      }
    );
  }

  const arrayBuffer =
    await pdfBlob
      .arrayBuffer();

  const bytes =
    new Uint8Array(
      arrayBuffer
    );

  if (
    !hasPdfMagicBytes(
      bytes
    )
  ) {
    return jsonResponse(
      422,
      {
        success: false,
        error:
          "The uploaded file is not a valid PDF.",
        code:
          "INVALID_PDF",
      }
    );
  }

  const parser =
    new PDFParse({
      data: bytes,
    });

  try {
    const info =
      await parser.getInfo({
        parsePageInfo:
          false,
      });

    const pageCount =
      Number(
        info.total || 0
      );

    if (
      pageCount >
      MAX_PAGES
    ) {
      return jsonResponse(
        422,
        {
          success: false,
          error:
            `This PDF has ${pageCount} pages. The current limit is ${MAX_PAGES} pages.`,
          code:
            "TOO_MANY_PAGES",
          pageCount,
        }
      );
    }

    const textResult =
      await parser.getText();

    const rawText =
      textResult.text || "";

    const cleanedText =
      cleanPdfText(
        rawText
      );

    if (
      cleanedText.length <
      MIN_TEXT_CHARS
    ) {
      return jsonResponse(
        422,
        {
          success: false,
          error:
            "This PDF has very little extractable text. It may be blank, scanned, or image-based.",
          code:
            "INSUFFICIENT_TEXT",
          pageCount,
          extractedCharacters:
            cleanedText.length,
          requiresOcr:
            true,
        }
      );
    }

    const relevance =
      checkRelevance(
        cleanedText,
        category
      );

    const relevantText =
      buildRelevantExcerpt(
        cleanedText,
        category
      );

    return jsonResponse(
      200,
      {
        success: true,

        extraction: {
          pageCount,
          fileSize:
            pdfBlob.size,

          rawCharacters:
            rawText.length,

          cleanedCharacters:
            cleanedText.length,

          compactText:
            cleanedText.slice(
              0,
              COMPACT_TEXT_LIMIT
            ),

          relevantText:
            relevantText.slice(
              0,
              RELEVANT_TEXT_LIMIT
            ),

          truncated:
            cleanedText.length >
            COMPACT_TEXT_LIMIT,

          requiresOcr:
            false,
        },

        relevance,
      }
    );
  } catch (error) {
    if (
      error instanceof
      PasswordException
    ) {
      return jsonResponse(
        422,
        {
          success: false,
          error:
            "Password-protected PDFs are not supported.",
          code:
            "PASSWORD_PROTECTED",
        }
      );
    }

    console.error(
      "PDF parsing failed:",
      error
    );

    return jsonResponse(
      422,
      {
        success: false,
        error:
          "The PDF could not be processed. Please try another PDF.",
        code:
          "PDF_PARSE_FAILED",
      }
    );
  } finally {
    await parser.destroy();
  }
};

function hasPdfMagicBytes(
  bytes:
    Uint8Array
) {
  if (
    bytes.length <
    4
  ) {
    return false;
  }

  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

function cleanPdfText(
  value: string
) {
  const normalized =
    value
      .replace(
        /\r\n?/g,
        "\n"
      )
      .replace(
        /\u00a0/g,
        " "
      )
      .replace(
        /[ \t]+/g,
        " "
      );

  const lines =
    normalized
      .split("\n")
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);

  const frequency =
    new Map<
      string,
      number
    >();

  for (
    const line of lines
  ) {
    const key =
      line
        .toLowerCase()
        .replace(
          /\d+/g,
          "#"
        );

    frequency.set(
      key,
      (
        frequency.get(
          key
        ) || 0
      ) + 1
    );
  }

  const cleaned:
    string[] = [];

  let previous = "";

  for (
    const line of lines
  ) {
    if (
      /^page\s+\d+(\s+of\s+\d+)?$/i.test(
        line
      ) ||
      /^\d+$/.test(
        line
      )
    ) {
      continue;
    }

    const key =
      line
        .toLowerCase()
        .replace(
          /\d+/g,
          "#"
        );

    /**
     * Repeated short lines are usually
     * page headers / footers.
     */
    if (
      line.length <
        100 &&
      (
        frequency.get(
          key
        ) || 0
      ) >= 4
    ) {
      continue;
    }

    if (
      line ===
      previous
    ) {
      continue;
    }

    cleaned.push(
      line
    );

    previous =
      line;
  }

  return cleaned
    .join("\n")
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function checkRelevance(
  text: string,
  category: Category
): RelevanceResult {
  const lower =
    text.toLowerCase();

  const signals:
    Record<
      Category,
      string[]
    > = {
      research: [
        "recommendation",
        "target price",
        "current market price",
        "cmp",
        "buy",
        "sell",
        "hold",
        "valuation",
        "investment rationale",
        "outlook",
        "risk",
        "research",
      ],

      regulatory: [
        "sebi",
        "nse",
        "bse",
        "rbi",
        "circular",
        "regulation",
        "compliance",
        "effective date",
        "applicability",
        "required action",
        "deadline",
      ],

      product: [
        "product",
        "feature",
        "benefit",
        "pricing",
        "offer",
        "plan",
        "launch",
        "availability",
      ],

      service: [
        "service",
        "maintenance",
        "downtime",
        "system",
        "platform",
        "effective",
        "affected",
        "customer impact",
        "upgrade",
      ],

      education: [
        "learn",
        "education",
        "guide",
        "understand",
        "example",
        "risk",
        "investment",
        "trading",
      ],

      onboarding: [
        "welcome",
        "onboarding",
        "getting started",
        "account",
        "registration",
        "activate",
        "setup",
        "next step",
      ],
    };

  const matched =
    signals[
      category
    ].filter(
      (signal) =>
        lower.includes(
          signal
        )
    );

  const score =
    Math.min(
      100,
      Math.round(
        (
          matched.length /
          Math.max(
            4,
            signals[
              category
            ].length *
              0.45
          )
        ) * 100
      )
    );

  const relevant =
    matched.length >= 2 ||
    score >= 35;

  return {
    relevant,
    score,
    matchedSignals:
      matched.slice(
        0,
        8
      ),

    reason:
      relevant
        ? "The document contains signals consistent with the selected communication category."
        : "The document does not contain enough signals for the selected communication category.",
  };
}

function buildRelevantExcerpt(
  text: string,
  category: Category
) {
  const keywords:
    Record<
      Category,
      string[]
    > = {
      research: [
        "recommendation",
        "target",
        "cmp",
        "valuation",
        "rationale",
        "outlook",
        "risk",
        "conclusion",
      ],

      regulatory: [
        "circular",
        "subject",
        "effective",
        "applicability",
        "deadline",
        "required",
        "compliance",
        "action",
      ],

      product: [
        "feature",
        "benefit",
        "pricing",
        "offer",
        "launch",
      ],

      service: [
        "service",
        "maintenance",
        "affected",
        "impact",
        "timeline",
      ],

      education: [
        "objective",
        "learn",
        "example",
        "key",
        "risk",
      ],

      onboarding: [
        "welcome",
        "getting started",
        "account",
        "setup",
        "next",
      ],
    };

  const paragraphs =
    text
      .split(
        /\n{1,2}/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        (item) =>
          item.length >= 30
      );

  const scored =
    paragraphs.map(
      (
        paragraph,
        index
      ) => {
        const lower =
          paragraph.toLowerCase();

        const keywordHits =
          keywords[
            category
          ].reduce(
            (
              total,
              keyword
            ) =>
              total +
              (
                lower.includes(
                  keyword
                )
                  ? 1
                  : 0
              ),
            0
          );

        /**
         * Keep opening paragraphs because
         * titles, recommendation metadata,
         * circular refs and dates often
         * appear at the start.
         */
        const openingBoost =
          index < 8
            ? 2
            : 0;

        return {
          paragraph,
          score:
            keywordHits * 3 +
            openingBoost,
          index,
        };
      }
    );

  const selected =
    scored
      .filter(
        (item) =>
          item.score > 0
      )
      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.index -
            b.index
      )
      .slice(
        0,
        30
      )
      .sort(
        (a, b) =>
          a.index -
          b.index
      );

  if (
    selected.length ===
    0
  ) {
    return text.slice(
      0,
      RELEVANT_TEXT_LIMIT
    );
  }

  return selected
    .map(
      (item) =>
        item.paragraph
    )
    .join("\n\n");
}

function jsonResponse(
  status: number,
  body: unknown
) {
  return new Response(
    JSON.stringify(
      body
    ),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store",
      },
    }
  );
}
