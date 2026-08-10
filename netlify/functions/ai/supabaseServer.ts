import {
  createClient,
} from "@supabase/supabase-js";

export function createUserSupabaseClient(
  authorizationHeader: string
) {
  /**
   * Use exactly the same Supabase
   * project configuration as the frontend.
   *
   * These are public/publishable values,
   * not privileged service-role secrets.
   */
  const supabaseUrl =
    process.env
      .VITE_SUPABASE_URL;

  const supabaseKey =
    process.env
      .VITE_SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey
  ) {
    console.error(
      "Supabase environment configuration missing:",
      {
        hasUrl:
          Boolean(supabaseUrl),

        hasPublishableKey:
          Boolean(supabaseKey),
      }
    );

    throw new Error(
      "Supabase server environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: {
          Authorization:
            authorizationHeader,
        },
      },

      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
