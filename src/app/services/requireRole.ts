import { supabase } from "../../lib/supabase";

export type AppRole =
  | "creator"
  | "marketing_reviewer"
  | "corpcom_reviewer"
  | "admin";

export async function requireCurrentUserRole(
  allowedRoles: AppRole[]
) {
  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth
      .getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id, role"
      )
      .eq(
        "id",
        user.id
      )
      .single();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "Your profile could not be verified."
    );
  }

  const role =
    profile.role as AppRole;

  if (
    !allowedRoles.includes(
      role
    )
  ) {
    throw new Error(
      "You do not have permission to perform this action."
    );
  }

  return {
    user,
    role,
  };
}
