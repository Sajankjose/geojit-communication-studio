import { ReactNode } from "react";
import { Navigate } from "react-router";

import {
  AppRole,
} from "./AuthProvider";

import {
  useAuth,
} from "./useAuth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps) {
  const {
    profile,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-600">
          Checking access...
        </p>
      </div>
    );
  }

  if (
    !profile ||
    !allowedRoles.includes(
      profile.role
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}
