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
  active: boolean;
  bannedUntil: string | null;
  isCurrentUser: boolean;
}

async function getToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

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

async function request(
  method: "GET" | "POST" | "PATCH",
  body?: unknown
) {
  const token =
    await getToken();

  const response =
    await fetch(
      "/.netlify/functions/admin-users",
      {
        method,
        headers: {
          accept:
            "application/json",
          ...(body
            ? {
                "content-type":
                  "application/json",
              }
            : {}),
          "x-supabase-access-token":
            token,
        },
        ...(body
          ? {
              body:
                JSON.stringify(
                  body
                ),
            }
          : {}),
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
        "Unable to complete the request."
    );
  }

  return payload;
}

export async function getAdminUsers():
  Promise<AdminUser[]> {
  const payload =
    await request(
      "GET"
    );

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
  const payload =
    await request(
      "POST",
      {
        email,
        password,
        fullName,
        designation,
        department,
        role,
      }
    );

  return payload.user as AdminUser;
}

export async function setAdminUserActive({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  return request(
    "PATCH",
    {
      userId,
      active,
    }
  );
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
    return JSON.parse(
      text
    );
  } catch {
    return {
      success: false,
      error: text,
    };
  }
}
