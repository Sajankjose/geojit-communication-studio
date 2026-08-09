import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";

export function TopNavBar() {
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const {
    profile,
    user,
    signOut,
  } = useAuth();

  const employeeName =
    profile?.full_name ||
    user?.email ||
    "Employee";

  const employeeInfo =
    profile?.designation ||
    profile?.department ||
    user?.email ||
    "";

  const handleLogout = async () => {
    try {
      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSettings = () => {
    navigate("/settings/rules");
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center px-6">
        {/* Logo and Product Name */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-4 text-left"
        >
          <div>
            <p className="text-lg font-semibold text-[#07877B]">
              Geojit Communication Engine
            </p>

            <p className="text-xs text-gray-500">
              AI-powered email creation
            </p>
          </div>
        </button>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-4">
          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button
            type="button"
            aria-label="Settings"
            onClick={handleSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setIsUserMenuOpen((current) => !current)
              }
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07877B] text-white">
                <User className="h-4 w-4" />
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium">
                  {employeeName}
                </p>

                <p className="text-xs text-gray-500">
                  {employeeInfo}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />

                <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-900">
                      {employeeName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {user?.email}
                    </p>

                    {profile?.department && (
                      <p className="mt-1 text-xs text-gray-500">
                        {profile.department}
                      </p>
                    )}

                    {profile?.role && (
                      <div className="mt-3">
                        <span className="inline-flex rounded-full bg-[#e8f5f4] px-2.5 py-1 text-xs font-medium text-[#07877B]">
                          {formatRole(profile.role)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function formatRole(role: string) {
  switch (role) {
    case "creator":
      return "Creator";

    case "marketing_reviewer":
      return "Marketing Reviewer";

    case "corpcom_reviewer":
      return "CorpCom Reviewer";

    case "admin":
      return "Admin";

    default:
      return role;
  }
}
