import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Building2, Lock, User, AlertCircle } from "lucide-react";

export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      navigate("/");
    }
  }, [navigate]);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Dummy credentials validation
      if (employeeId === "emp001" && password === "geojit123") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("employeeId", employeeId);
        localStorage.setItem("employeeName", "Rajesh Kumar");
        navigate("/");
      } else if (employeeId === "emp002" && password === "geojit123") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("employeeId", employeeId);
        localStorage.setItem("employeeName", "Priya Sharma");
        navigate("/");
      } else {
        setError("Invalid Employee ID or Password");
      }
      setIsLoading(false);
    }, 800);
  };

  const useDemoCredentials = (empId: string) => {
    setEmployeeId(empId);
    setPassword("geojit123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5f4] via-white to-[#fff8ed] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#07877B] rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Geojit Communication Engine</h1>
          <p className="text-gray-600">Employee Portal Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Employee ID Input */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#07877B] focus:border-transparent transition-all"
                  placeholder="Enter your employee ID"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#07877B] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#07877B] text-white py-3 rounded-xl hover:bg-[#06766c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Credentials:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => useDemoCredentials("emp001")}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rajesh Kumar</p>
                    <p className="text-xs text-gray-500">emp001 / geojit123</p>
                  </div>
                  <div className="text-xs text-[#07877B] font-medium">Use credentials</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => useDemoCredentials("emp002")}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Priya Sharma</p>
                    <p className="text-xs text-gray-500">emp002 / geojit123</p>
                  </div>
                  <div className="text-xs text-[#07877B] font-medium">Use credentials</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Secure internal platform for Geojit Financial Services</p>
        </div>
      </div>
    </div>
  );
}
