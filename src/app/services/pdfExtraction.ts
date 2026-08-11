import { supabase } from "../../lib/supabase";

export interface PdfExtractionResult {
  success: true;

  extraction: {
    pageCount: number;
    fileSize: number;
    rawCharacters: number;
    cleanedCharacters: number;
    compactText: string;
    relevantText: string;
    truncated: boolean;
    requiresOcr: boolean;
  };

  relevance: {
    relevant: boolean;
    score: number;
    matchedSignals: string[];
    reason: string;
  };
}

export async function extractCommunicationPdf({
  sourcePath,
  category,
}: {
  sourcePath: string;
  category: string;
}): Promise<PdfExtractionResult> {
  const {
    data: {
      session,
    },
  } =
    await supabase.auth
      .getSession();

  if (
    !session?.access_token
  ) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response =
    await fetch(
      "/.netlify/functions/extract-pdf",
      {
        method:
          "POST",

        headers: {
          "content-type":
            "application/json",

          authorization:
            `Bearer ${session.access_token}`,
        },

        body:
          JSON.stringify({
            sourcePath,
            category,
          }),
      }
    );

  let payload:
    any = null;

  try {
    payload =
      await response.json();
  } catch {
    throw new Error(
      "The PDF service returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ||
        "Unable to process PDF."
    );
  }

  return payload as PdfExtractionResult;
}
