import { createClient } from "@supabase/supabase-js";

type AppRole =
  | "creator"
  | "marketing_reviewer"
  | "corpcom_reviewer"
  | "admin";

interface CreateUserBody {
  email?: string;
  password?: string;
  fullName?: string;
  designation?: string;
  department?: string;
  role?: AppRole;
}

interface UserStatusBody {
  userId?: string;
  active?: boolean;
}

const ALLOWED_ROLES: AppRole[] = [
  "creator",
  "marketing_reviewer",
  "corpcom_reviewer",
  "admin",
];

export default async (request: Request) => {
  if (
    request.method !== "GET" &&
    request.method !== "POST" &&
    request.method !== "PATCH"
  ) {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !publishableKey ||
    !serviceRoleKey
  ) {
    return jsonResponse(500, {
      success: false,
      error: "User management service is not configured.",
    });
  }

  const token =
    request.headers
      .get("x-supabase-access-token")
      ?.trim();

  if (!token) {
    return jsonResponse(401, {
      success: false,
      error: "Supabase authentication token is missing.",
    });
  }

  const userClient =
    createClient(
      supabaseUrl,
      publishableKey,
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
  } = await userClient.auth.getUser(token);

  if (
    userError ||
    !userData.user
  ) {
    return jsonResponse(401, {
      success: false,
      error: "Invalid or expired Supabase session.",
    });
  }

  const {
    data: profile,
    error: profileError,
  } = await userClient
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return jsonResponse(403, {
      success: false,
      error: "Administrator access is required.",
    });
  }

  const adminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

  if (request.method === "GET") {
    return listUsers(
      adminClient,
      userData.user.id
    );
  }

  if (request.method === "PATCH") {
    return updateUserStatus(
      request,
      adminClient,
      userData.user.id
    );
  }

  return createUser(
    request,
    adminClient
  );
};

async function listUsers(
  adminClient: ReturnType<typeof createClient>,
  currentUserId: string
) {
  const {
    data: authData,
    error: authError,
  } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (authError) {
    return jsonResponse(500, {
      success: false,
      error: "Unable to load users.",
    });
  }

  const {
    data: profiles,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select(`
      id,
      full_name,
      designation,
      department,
      role
    `);

  if (profileError) {
    return jsonResponse(500, {
      success: false,
      error: "Unable to load user profiles.",
    });
  }

  const profileMap =
    new Map(
      (profiles || []).map(
        (item: any) => [
          item.id,
          item,
        ]
      )
    );

  const users =
    authData.users.map((user) => {
      const profile =
        profileMap.get(user.id) as any;

      return {
        id: user.id,
        email: user.email || "",
        fullName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          "",
        designation:
          profile?.designation || "",
        department:
          profile?.department || "",
        role:
          profile?.role || "creator",
        createdAt: user.created_at,
        lastSignInAt:
          user.last_sign_in_at || null,
        emailConfirmed:
          Boolean(user.email_confirmed_at),
        active:
          !isBanned(user.banned_until),
        bannedUntil:
          user.banned_until || null,
        isCurrentUser:
          user.id === currentUserId,
      };
    });

  return jsonResponse(200, {
    success: true,
    users,
  });
}

async function createUser(
  request: Request,
  adminClient: ReturnType<typeof createClient>
) {
  let body: CreateUserBody;

  try {
    body =
      (await request.json()) as CreateUserBody;
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "Invalid request body.",
    });
  }

  const email =
    body.email?.trim().toLowerCase();

  const password =
    body.password || "";

  const fullName =
    body.fullName?.trim() || "";

  const designation =
    body.designation?.trim() || "";

  const department =
    body.department?.trim() || "";

  const role = body.role;

  if (!email) {
    return jsonResponse(400, {
      success: false,
      error: "Email is required.",
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return jsonResponse(400, {
      success: false,
      error: "Enter a valid email address.",
    });
  }

  if (password.length < 8) {
    return jsonResponse(400, {
      success: false,
      error:
        "Temporary password must contain at least 8 characters.",
    });
  }

  if (!fullName) {
    return jsonResponse(400, {
      success: false,
      error: "Full name is required.",
    });
  }

  if (
    !role ||
    !ALLOWED_ROLES.includes(role)
  ) {
    return jsonResponse(400, {
      success: false,
      error: "A valid role is required.",
    });
  }

  const {
    data: created,
    error: createError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (
    createError ||
    !created.user
  ) {
    const duplicate =
      createError?.message
        ?.toLowerCase()
        .includes("already");

    return jsonResponse(
      duplicate ? 409 : 400,
      {
        success: false,
        error: duplicate
          ? "A user with this email already exists."
          : createError?.message ||
            "Unable to create user.",
      }
    );
  }

  const {
    error: profileInsertError,
  } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: created.user.id,
        full_name: fullName,
        designation:
          designation || null,
        department:
          department || null,
        role,
      },
      {
        onConflict: "id",
      }
    );

  if (profileInsertError) {
    await adminClient.auth.admin.deleteUser(
      created.user.id
    );

    return jsonResponse(500, {
      success: false,
      error:
        "The login was created but the user profile could not be created. The partial account was rolled back.",
    });
  }

  return jsonResponse(201, {
    success: true,
    user: {
      id: created.user.id,
      email,
      fullName,
      designation,
      department,
      role,
      createdAt:
        created.user.created_at,
      lastSignInAt: null,
      emailConfirmed: true,
      active: true,
      bannedUntil: null,
      isCurrentUser: false,
    },
  });
}

async function updateUserStatus(
  request: Request,
  adminClient: ReturnType<typeof createClient>,
  currentUserId: string
) {
  let body: UserStatusBody;

  try {
    body =
      (await request.json()) as UserStatusBody;
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "Invalid request body.",
    });
  }

  const userId =
    body.userId?.trim();

  const active = body.active;

  if (
    !userId ||
    typeof active !== "boolean"
  ) {
    return jsonResponse(400, {
      success: false,
      error: "User ID and active status are required.",
    });
  }

  if (
    userId === currentUserId &&
    active === false
  ) {
    return jsonResponse(400, {
      success: false,
      error:
        "You cannot deactivate your own administrator account.",
    });
  }

  const {
    data: targetResult,
    error: targetError,
  } = await adminClient.auth.admin.getUserById(
    userId
  );

  if (
    targetError ||
    !targetResult.user
  ) {
    return jsonResponse(404, {
      success: false,
      error: "User not found.",
    });
  }

  const {
    data: updated,
    error: updateError,
  } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      ban_duration:
        active
          ? "none"
          : "876000h",
    }
  );

  if (
    updateError ||
    !updated.user
  ) {
    return jsonResponse(500, {
      success: false,
      error:
        active
          ? "Unable to reactivate user."
          : "Unable to deactivate user.",
    });
  }

  return jsonResponse(200, {
    success: true,
    userId,
    active,
    bannedUntil:
      updated.user.banned_until || null,
  });
}

function isBanned(
  bannedUntil?: string | null
) {
  if (!bannedUntil) {
    return false;
  }

  const timestamp =
    new Date(bannedUntil).getTime();

  return (
    Number.isFinite(timestamp) &&
    timestamp > Date.now()
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
        "cache-control": "no-store",
      },
    }
  );
}
