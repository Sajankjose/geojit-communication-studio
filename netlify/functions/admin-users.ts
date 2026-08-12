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

const ALLOWED_ROLES: AppRole[] = [
  "creator",
  "marketing_reviewer",
  "corpcom_reviewer",
  "admin",
];

export default async (
  request: Request
) => {
  if (
    request.method !== "GET" &&
    request.method !== "POST"
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
    console.error(
      "Admin user service environment variables are missing.",
      {
        hasUrl:
          Boolean(supabaseUrl),
        hasPublishableKey:
          Boolean(publishableKey),
        hasServiceRoleKey:
          Boolean(serviceRoleKey),
      }
    );

    return jsonResponse(500, {
      success: false,
      error:
        "User management service is not configured.",
    });
  }

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authHeader ||
    !authHeader
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return jsonResponse(401, {
      success: false,
      error:
        "Authentication required.",
    });
  }

  const token =
    authHeader
      .slice(7)
      .trim();

  /**
   * Normal user client:
   * validate the caller and read their profile
   * under normal RLS/auth context.
   */
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
    await userClient.auth
      .getUser(token);

  if (
    userError ||
    !userData.user
  ) {
    return jsonResponse(401, {
      success: false,
      error:
        "Invalid or expired session.",
    });
  }

  const {
    data: profile,
    error: profileError,
  } =
    await userClient
      .from("profiles")
      .select(
        "id, role"
      )
      .eq(
        "id",
        userData.user.id
      )
      .single();

  if (
    profileError ||
    !profile
  ) {
    return jsonResponse(403, {
      success: false,
      error:
        "Unable to verify your administrator profile.",
    });
  }

  if (
    profile.role !==
    "admin"
  ) {
    return jsonResponse(403, {
      success: false,
      error:
        "Administrator access is required.",
    });
  }

  /**
   * Privileged client:
   * exists only inside this Netlify Function.
   * NEVER expose this key in VITE_* variables.
   */
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

  if (
    request.method ===
    "GET"
  ) {
    return listUsers(
      adminClient
    );
  }

  return createUser(
    request,
    adminClient
  );
};

async function listUsers(
  adminClient:
    ReturnType<
      typeof createClient
    >
) {
  const {
    data: authData,
    error: authError,
  } =
    await adminClient.auth
      .admin
      .listUsers({
        page: 1,
        perPage: 200,
      });

  if (authError) {
    console.error(
      "Unable to list auth users:",
      authError
    );

    return jsonResponse(500, {
      success: false,
      error:
        "Unable to load users.",
    });
  }

  const {
    data: profiles,
    error: profileError,
  } =
    await adminClient
      .from("profiles")
      .select(
        `
        id,
        full_name,
        designation,
        department,
        role
        `
      );

  if (profileError) {
    console.error(
      "Unable to list profiles:",
      profileError
    );

    return jsonResponse(500, {
      success: false,
      error:
        "Unable to load user profiles.",
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
    authData.users.map(
      (user) => {
        const profile =
          profileMap.get(
            user.id
          ) as any;

        return {
          id:
            user.id,

          email:
            user.email ||
            "",

          fullName:
            profile?.full_name ||
            user.user_metadata
              ?.full_name ||
            "",

          designation:
            profile?.designation ||
            "",

          department:
            profile?.department ||
            "",

          role:
            profile?.role ||
            "creator",

          createdAt:
            user.created_at,

          lastSignInAt:
            user.last_sign_in_at ||
            null,

          emailConfirmed:
            Boolean(
              user.email_confirmed_at
            ),
        };
      }
    );

  return jsonResponse(200, {
    success: true,
    users,
  });
}

async function createUser(
  request: Request,
  adminClient:
    ReturnType<
      typeof createClient
    >
) {
  let body:
    CreateUserBody;

  try {
    body =
      (await request.json()) as CreateUserBody;
  } catch {
    return jsonResponse(400, {
      success: false,
      error:
        "Invalid request body.",
    });
  }

  const email =
    body.email
      ?.trim()
      .toLowerCase();

  const password =
    body.password ||
    "";

  const fullName =
    body.fullName
      ?.trim() ||
    "";

  const designation =
    body.designation
      ?.trim() ||
    "";

  const department =
    body.department
      ?.trim() ||
    "";

  const role =
    body.role;

  if (!email) {
    return jsonResponse(400, {
      success: false,
      error:
        "Email is required.",
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return jsonResponse(400, {
      success: false,
      error:
        "Enter a valid email address.",
    });
  }

  if (
    password.length < 8
  ) {
    return jsonResponse(400, {
      success: false,
      error:
        "Temporary password must contain at least 8 characters.",
    });
  }

  if (!fullName) {
    return jsonResponse(400, {
      success: false,
      error:
        "Full name is required.",
    });
  }

  if (
    !role ||
    !ALLOWED_ROLES.includes(
      role
    )
  ) {
    return jsonResponse(400, {
      success: false,
      error:
        "A valid role is required.",
    });
  }

  /**
   * Create Auth user on the server.
   */
  const {
    data: created,
    error: createError,
  } =
    await adminClient.auth
      .admin
      .createUser({
        email,
        password,

        /**
         * Current internal-user workflow:
         * create as email-confirmed.
         *
         * Later we can replace this with
         * an invite/password-reset workflow.
         */
        email_confirm:
          true,

        user_metadata: {
          full_name:
            fullName,
        },
      });

  if (
    createError ||
    !created.user
  ) {
    console.error(
      "Admin create user failed:",
      createError
    );

    const duplicate =
      createError?.message
        ?.toLowerCase()
        .includes(
          "already"
        );

    return jsonResponse(
      duplicate
        ? 409
        : 400,
      {
        success: false,
        error:
          duplicate
            ? "A user with this email already exists."
            : createError?.message ||
              "Unable to create user.",
      }
    );
  }

  /**
   * Auth and public profile are kept together.
   */
  const {
    error: profileInsertError,
  } =
    await adminClient
      .from("profiles")
      .upsert(
        {
          id:
            created.user.id,

          full_name:
            fullName,

          designation:
            designation ||
            null,

          department:
            department ||
            null,

          role,
        },
        {
          onConflict:
            "id",
        }
      );

  if (
    profileInsertError
  ) {
    console.error(
      "Profile creation failed:",
      profileInsertError
    );

    /**
     * Avoid leaving an unusable Auth-only user
     * if profile creation failed.
     */
    await adminClient.auth
      .admin
      .deleteUser(
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
      id:
        created.user.id,

      email,

      fullName,
      designation,
      department,
      role,

      createdAt:
        created.user
          .created_at,
    },
  });
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
