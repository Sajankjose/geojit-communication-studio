import { createBrowserRouter } from "react-router";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CategorySelection } from "./pages/CategorySelection";
import { SmartInputForm } from "./pages/SmartInputForm";
import { GeneratingState } from "./pages/GeneratingState";
import { VariantSelection } from "./pages/VariantSelection";
import { FullPreview } from "./pages/FullPreview";
import { ApprovalSubmission } from "./pages/ApprovalSubmission";
import { RulesSettings } from "./pages/RulesSettings";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./auth/RoleGuard";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/category",
    element: (
      <ProtectedRoute>
        <CategorySelection />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/form",
    element: (
      <ProtectedRoute>
        <SmartInputForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/generating",
    element: (
      <ProtectedRoute>
        <GeneratingState />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/variants",
    element: (
      <ProtectedRoute>
        <VariantSelection />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/preview",
    element: (
      <ProtectedRoute>
        <FullPreview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create/submit",
    element: (
      <ProtectedRoute>
        <ApprovalSubmission />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings/rules",
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={["admin"]}>
          <RulesSettings />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
]);
