import {
  createClient,
} from "@supabase/supabase-js";

export function createUserSupabaseClient(
  authorizationHeader: string
) {
  const supabaseUrl =
  process.env.VITE_SUPABASE_URL;

  const supabaseKey =
    process.env
      .SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey
  ) {
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
      },
    }
  );
}
