import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Settings, User, LogOut, ChevronDown } from "lucide-react";

export function TopNavBar() {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const employeeName = localStorage.getItem("employeeName") || "Employee";
  const employeeId = localStorage.getItem("employeeId") || "";

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeName");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-8">
        {/* Logo and Product Name */}
        <div className="flex items-center gap-3">
          <img
            src="https://www.geojit.com/HomeDesign/images/logo.png"
            alt="Geojit Financial Services"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-lg leading-tight text-[#07877B]">
              Geojit Communication Engine
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-powered email creation
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-4">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07877B] text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{employeeName}</p>
                <p className="text-xs text-gray-500">{employeeId}</p>
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
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{employeeName}</p>
                    <p className="text-xs text-gray-500">{employeeId}</p>
                  </div>
                  <div className="p-2">
                    <button
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
