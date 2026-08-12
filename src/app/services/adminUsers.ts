import { supabase } from "../../lib/supabase";

export type UserRole =
  | "creator"
  | "marketing_reviewer"
  | "corpcom_reviewer"
  | "admin";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  designation: string;
  department: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

async function getToken() {
  const {
    data: {
      session,
    },
    error,
  } =
    await supabase.auth
      .getSession();

  if (
    error ||
    !session?.access_token
  ) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return session.access_token;
}

export async function getAdminUsers():
  Promise<AdminUser[]> {
  const token =
    await getToken();

  const response =
    await fetch(
      "/.netlify/functions/admin-users",
      {
        method: "GET",

        headers: {
          "x-supabase-access-token":
            token,

          "accept":
            "application/json",
        },
      }
    );

  const payload =
    await readPayload(
      response
    );

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ||
        "Unable to load users."
    );
  }

  return payload.users as AdminUser[];
}

export async function createAdminUser({
  email,
  password,
  fullName,
  designation,
  department,
  role,
}: {
  email: string;
  password: string;
  fullName: string;
  designation: string;
  department: string;
  role: UserRole;
}): Promise<AdminUser> {
  const token =
    await getToken();

  const response =
    await fetch(
      "/.netlify/functions/admin-users",
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          "accept":
            "application/json",

          /**
           * IMPORTANT:
           * Do not use Authorization here.
           * Netlify may interpret Bearer tokens
           * as Netlify Identity JWTs before the
           * function receives the request.
           */
          "x-supabase-access-token":
            token,
        },

        body:
          JSON.stringify({
            email,
            password,
            fullName,
            designation,
            department,
            role,
          }),
      }
    );

  const payload =
    await readPayload(
      response
    );

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ||
        "Unable to create user."
    );
  }

  return payload.user as AdminUser;
}

async function readPayload(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error:
        text,
    };
  }
}
