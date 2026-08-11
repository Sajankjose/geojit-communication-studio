import { supabase } from "../../lib/supabase";

export interface FactExtractionResponse {
  success: true;
  facts: Record<string, unknown>;

  usage: {
    sourceCharacters: number;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    model: string;
  };
}

export async function extractPdfFacts({
  communicationId,
  category,
  relevantText,
}: {
  communicationId: string;
  category: string;
  relevantText: string;
}): Promise<FactExtractionResponse> {
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

  if (
    !relevantText.trim()
  ) {
    throw new Error(
      "Process the PDF again before extracting facts."
    );
  }

  const response =
    await fetch(
      "/.netlify/functions/extract-pdf-facts",
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          authorization:
            `Bearer ${session.access_token}`,
        },

        body:
          JSON.stringify({
            communicationId,
            category,
            relevantText:
              relevantText.slice(
                0,
                8000
              ),
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
      "The fact extraction service returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ||
        "Unable to extract facts from the PDF."
    );
  }

  return payload as FactExtractionResponse;
}
