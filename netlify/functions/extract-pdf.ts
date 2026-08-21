import { createClient } from "@supabase/supabase-js";
import * as PDFParserModule from "pdf2json";

const PDFParser =
  (PDFParserModule as any).default ||
  PDFParserModule;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 50;
const MIN_TEXT_CHARS = 200;
const COMPACT_TEXT_LIMIT = 15000;
const RELEVANT_TEXT_LIMIT = 12000;

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

interface ParsedPdf {
  rawText: string;
  pageCount: number;
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
    });

    return jsonResponse(500, {
      success: false,
      error: "PDF extraction service is not configured.",
    });
  }

  const authHeader = request.headers.get("authorization");

  if (
    !authHeader ||
    !authHeader.toLowerCase().startsWith("bearer ")
  ) {
    return jsonResponse(401, {
      success: false,
      error: "Authentication required.",
    });
  }

  const token = authHeader.slice(7).trim();

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return jsonResponse(401, {
      success: false,
      error: "Invalid or expired session. Please sign in again.",
    });
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "Invalid request body.",
    });
  }

  const sourcePath = body.sourcePath?.trim();
  const category = body.category;

  if (!sourcePath || !category) {
    return jsonResponse(400, {
      success: false,
      error: "Source PDF path and category are required.",
    });
  }

  const firstFolder = sourcePath.split("/")[0];

  if (firstFolder !== userData.user.id) {
    return jsonResponse(403, {
      success: false,
      error: "You do not have access to this source PDF.",
    });
  }

  const {
    data: pdfBlob,
    error: downloadError,
  } = await supabase.storage
    .from("communication-sources")
    .download(sourcePath);

  if (downloadError || !pdfBlob) {
    console.error("PDF download failed:", downloadError);

    return jsonResponse(404, {
      success: false,
      error: "Unable to read the uploaded PDF.",
    });
  }

  if (pdfBlob.size <= 0) {
    return jsonResponse(422, {
      success: false,
      error: "The uploaded PDF is empty.",
      code: "EMPTY_FILE",
    });
  }

  if (pdfBlob.size > MAX_FILE_BYTES) {
    return jsonResponse(413, {
      success: false,
      error: "PDF must be 10 MB or smaller.",
      code: "FILE_TOO_LARGE",
    });
  }

  const arrayBuffer = await pdfBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!hasPdfMagicBytes(bytes)) {
    return jsonResponse(422, {
      success: false,
      error: "The uploaded file is not a valid PDF.",
      code: "INVALID_PDF",
    });
  }

  try {
    const parsed = await parsePdfBuffer(
      Buffer.from(arrayBuffer)
    );

    if (parsed.pageCount > MAX_PAGES) {
      return jsonResponse(422, {
        success: false,
        error: `This PDF has ${parsed.pageCount} pages. The current limit is ${MAX_PAGES} pages.`,
        code: "TOO_MANY_PAGES",
        pageCount: parsed.pageCount,
      });
    }

    const cleanedText = cleanPdfText(parsed.rawText);

    if (cleanedText.length < MIN_TEXT_CHARS) {
      return jsonResponse(422, {
        success: false,
        error:
          "This PDF has very little extractable text. It may be blank, scanned, or image-based.",
        code: "INSUFFICIENT_TEXT",
        pageCount: parsed.pageCount,
        extractedCharacters: cleanedText.length,
        requiresOcr: true,
      });
    }

    const relevance = checkRelevance(
      cleanedText,
      category
    );

    const relevantText = buildRelevantExcerpt(
      cleanedText,
      category
    );

    return jsonResponse(200, {
      success: true,
      extraction: {
        pageCount: parsed.pageCount,
        fileSize: pdfBlob.size,
        rawCharacters: parsed.rawText.length,
        cleanedCharacters: cleanedText.length,
        compactText: cleanedText.slice(
          0,
          COMPACT_TEXT_LIMIT
        ),
        relevantText: relevantText.slice(
          0,
          RELEVANT_TEXT_LIMIT
        ),
        truncated:
          cleanedText.length > COMPACT_TEXT_LIMIT,
        requiresOcr: false,
      },
      relevance,
    });
  } catch (error) {
    console.error("PDF parsing failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const lower = message.toLowerCase();

    if (
      lower.includes("encrypt") ||
      lower.includes("password")
    ) {
      return jsonResponse(422, {
        success: false,
        error:
          "Password-protected or encrypted PDFs are not supported.",
        code: "PASSWORD_PROTECTED",
      });
    }

    return jsonResponse(422, {
      success: false,
      error:
        "The PDF could not be processed. Please try another PDF.",
      code: "PDF_PARSE_FAILED",
    });
  }
};

function parsePdfBuffer(
  buffer: Buffer
): Promise<ParsedPdf> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(
      null,
      1
    );

    let settled = false;

    const cleanup = () => {
      pdfParser.removeAllListeners();
    };

    pdfParser.on(
      "pdfParser_dataError",
      (errorData: any) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();

        reject(
          errorData?.parserError ||
            new Error("PDF parsing failed.")
        );
      }
    );

    pdfParser.on(
      "pdfParser_dataReady",
      (pdfData: any) => {
        if (settled) {
          return;
        }

        settled = true;

        try {
          const rawText =
            pdfParser.getRawTextContent() || "";

          const pageCount =
            Array.isArray(pdfData?.Pages)
              ? pdfData.Pages.length
              : 0;

          cleanup();

          resolve({
            rawText,
            pageCount,
          });
        } catch (error) {
          cleanup();
          reject(error);
        }
      }
    );

    try {
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

function hasPdfMagicBytes(bytes: Uint8Array) {
  if (bytes.length < 4) {
    return false;
  }

  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

function cleanPdfText(value: string) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ");

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const frequency = new Map<string, number>();

  for (const line of lines) {
    const key = line
      .toLowerCase()
      .replace(/\d+/g, "#");

    frequency.set(
      key,
      (frequency.get(key) || 0) + 1
    );
  }

  const cleaned: string[] = [];
  let previous = "";

  for (const line of lines) {
    if (
      /^page\s+\d+(\s+of\s+\d+)?$/i.test(
        line
      ) ||
      /^\d+$/.test(line)
    ) {
      continue;
    }

    const key = line
      .toLowerCase()
      .replace(/\d+/g, "#");

    if (
      line.length < 100 &&
      (frequency.get(key) || 0) >= 4
    ) {
      continue;
    }

    if (line === previous) {
      continue;
    }

    cleaned.push(line);
    previous = line;
  }

  return cleaned
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type WeightedSignal = {
  label: string;
  weight: number;
  patterns: RegExp[];
};

const CATEGORY_SIGNALS: Record<
  Category,
  WeightedSignal[]
> = {
  research: [
    { label: "recommendation", weight: 4, patterns: [/\brecommendation\b/i, /\bbuy\b/i, /\bsell\b/i, /\bhold\b/i, /\baccumulate\b/i] },
    { label: "price-target", weight: 4, patterns: [/\btarget price\b/i, /\bprice target\b/i, /\bcurrent market price\b/i, /\bcmp\b/i] },
    { label: "valuation", weight: 3, patterns: [/\bvaluation\b/i, /\bmultiple\b/i, /\bearnings\b/i, /\bpe\b/i, /\bp\/e\b/i] },
    { label: "investment-rationale", weight: 3, patterns: [/\binvestment rationale\b/i, /\brationale\b/i, /\boutlook\b/i, /\bkey drivers?\b/i, /\bcatalysts?\b/i] },
    { label: "risk", weight: 2, patterns: [/\brisk\b/i, /\brisks\b/i, /\bdownside\b/i, /\bconcerns?\b/i] },
    { label: "research-document", weight: 1, patterns: [/\bresearch report\b/i, /\bequity research\b/i, /\bresearch\b/i] },
  ],
  regulatory: [
    { label: "authority", weight: 4, patterns: [/\bsebi\b/i, /\brbi\b/i, /\bnse\b/i, /\bbse\b/i] },
    { label: "reference", weight: 4, patterns: [/\bcircular\b/i, /\breference no\b/i, /\breference number\b/i, /\bnotification\b/i] },
    { label: "obligation", weight: 3, patterns: [/\brequired action\b/i, /\bshall\b/i, /\bmandatory\b/i, /\bcompliance\b/i] },
    { label: "timeline", weight: 3, patterns: [/\beffective date\b/i, /\bdeadline\b/i, /\bwith effect from\b/i] },
    { label: "applicability", weight: 2, patterns: [/\bapplicability\b/i, /\bapplicable to\b/i, /\baffected\b/i] },
  ],
  product: [
    { label: "feature", weight: 4, patterns: [/\bfeature\b/i, /\bfunctionality\b/i, /\bcapability\b/i] },
    { label: "customer-benefit", weight: 3, patterns: [/\bbenefit\b/i, /\benables?\b/i, /\bhelps?\b/i] },
    { label: "usage", weight: 3, patterns: [/\bhow to\b/i, /\bsteps?\b/i, /\bavailable on\b/i, /\baccess\b/i] },
    { label: "commercial", weight: 2, patterns: [/\bpricing\b/i, /\boffer\b/i, /\bplan\b/i, /\bcharges?\b/i] },
    { label: "availability", weight: 2, patterns: [/\blaunch\b/i, /\bavailability\b/i, /\beligib/i] },
  ],
  service: [
    { label: "service-event", weight: 4, patterns: [/\bmaintenance\b/i, /\bdowntime\b/i, /\bservice update\b/i, /\bsystem upgrade\b/i] },
    { label: "impact", weight: 3, patterns: [/\baffected\b/i, /\bimpact\b/i, /\bunavailable\b/i] },
    { label: "timing", weight: 3, patterns: [/\beffective\b/i, /\bduration\b/i, /\bfrom\b.*\bto\b/i] },
    { label: "customer-action", weight: 2, patterns: [/\baction required\b/i, /\bcustomer action\b/i, /\bplease\b/i] },
  ],
  education: [
    { label: "learning", weight: 4, patterns: [/\blearn\b/i, /\bunderstand\b/i, /\bguide\b/i, /\bexplains?\b/i] },
    { label: "example", weight: 2, patterns: [/\bexample\b/i, /\bfor instance\b/i, /\bscenario\b/i] },
    { label: "investment-context", weight: 2, patterns: [/\binvestment\b/i, /\btrading\b/i, /\bportfolio\b/i, /\brisk\b/i] },
  ],
  onboarding: [
    { label: "journey", weight: 4, patterns: [/\bwelcome\b/i, /\bonboarding\b/i, /\bgetting started\b/i] },
    { label: "setup", weight: 3, patterns: [/\baccount setup\b/i, /\bactivate\b/i, /\bregistration\b/i, /\bverification\b/i] },
    { label: "next-step", weight: 3, patterns: [/\bnext step\b/i, /\bcomplete\b/i, /\bcontinue\b/i] },
  ],
};

function checkRelevance(
  text: string,
  category: Category
): RelevanceResult {
  const signals = CATEGORY_SIGNALS[category];
  let earnedWeight = 0;

  const totalPossibleWeight =
    signals.reduce(
      (sum, signal) => sum + signal.weight,
      0
    );

  const matchedGroups: string[] = [];

  for (const signal of signals) {
    const matched =
      signal.patterns.some(
        (pattern) => pattern.test(text)
      );

    if (matched) {
      earnedWeight += signal.weight;
      matchedGroups.push(signal.label);
    }
  }

  const score = Math.min(
    100,
    Math.round(
      (earnedWeight /
        Math.max(1, totalPossibleWeight)) *
        100
    )
  );

  const relevant =
    score >= 32 &&
    matchedGroups.length >= 2;

  return {
    relevant,
    score,
    matchedSignals: matchedGroups.slice(0, 8),
    reason: relevant
      ? `The document contains multiple independent signals relevant to ${getCategoryName(category)}: ${matchedGroups.join(", ")}.`
      : `The document does not contain enough independent evidence for ${getCategoryName(category)}.`,
  };
}

function getCategoryName(
  category: Category
) {
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

function buildRelevantExcerpt(
  text: string,
  category: Category
) {
  const paragraphs = text
    .split(/\n{1,2}/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 25);

  const signalPatterns =
    CATEGORY_SIGNALS[category].flatMap(
      (group) =>
        group.patterns.map(
          (pattern) => ({
            pattern,
            weight: group.weight,
          })
        )
    );

  const scored =
    paragraphs.map(
      (paragraph, index) => {
        let score = 0;

        for (const signal of signalPatterns) {
          if (signal.pattern.test(paragraph)) {
            score += signal.weight;
          }
        }

        if (index < 8) {
          score += 2;
        }

        return {
          index,
          paragraph,
          score,
        };
      }
    );

  const seeds =
    scored
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.index -
            b.index
      )
      .slice(0, 18);

  const selectedIndexes =
    new Set<number>();

  for (const seed of seeds) {
    for (const index of [
      seed.index - 1,
      seed.index,
      seed.index + 1,
    ]) {
      if (
        index >= 0 &&
        index < paragraphs.length
      ) {
        selectedIndexes.add(index);
      }
    }
  }

  for (
    let index = 0;
    index < Math.min(6, paragraphs.length);
    index++
  ) {
    selectedIndexes.add(index);
  }

  const selected =
    [...selectedIndexes]
      .sort((a, b) => a - b)
      .map(
        (index) => paragraphs[index]
      );

  if (selected.length === 0) {
    return text.slice(
      0,
      RELEVANT_TEXT_LIMIT
    );
  }

  return selected
    .join("\n\n")
    .slice(
      0,
      RELEVANT_TEXT_LIMIT
    );
}

function jsonResponse(
  status: number,
  body: unknown
) {
  return new Response(
    JSON.stringify(body),
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
