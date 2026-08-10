import { supabase } from "../../lib/supabase";

export interface GenerateCommunicationRequest {
  communicationId: string;
  category:
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding";

  title?: string;
  subcategory?: string | null;
  audience?: string | null;
  objective?: string | null;

  inputData?: Record<string, unknown>;
}

export async function generateCommunication(
  request: GenerateCommunicationRequest
) {
  /**
   * Get the currently logged-in
   * Supabase session.
   */
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(
      "Unable to read Supabase session:",
      sessionError
    );

    throw new Error(
      "Unable to verify your login session."
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  /**
   * Call our protected Netlify
   * AI generation function.
   */
  const response = await fetch(
    "/.netlify/functions/generate-email",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization:
          `Bearer ${session.access_token}`,
      },

      body: JSON.stringify(request),
    }
  );

  let result: any;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The AI service returned an unreadable response."
    );
  }

  if (!response.ok || !result.success) {
    console.error(
      "AI generation failed:",
      result
    );

    throw new Error(
      result.error ||
        "Unable to generate communication."
    );
  }

  return result;
}
