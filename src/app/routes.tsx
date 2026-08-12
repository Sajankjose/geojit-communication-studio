import { createBrowserRouter } from "react-router";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CategorySelection } from "./pages/CategorySelection";
import { SmartInputForm } from "./pages/SmartInputForm";
import { GeneratingState } from "./pages/GeneratingState";
import { VariantSelection } from "./pages/VariantSelection";
import { FullPreview } from "./pages/FullPreview";
import { ApprovalSubmission } from "./pages/ApprovalSubmission";
import { ApprovalStatus } from "./pages/ApprovalStatus";
import { ReviewQueue } from "./pages/ReviewQueue";
import { RulesSettings } from "./pages/RulesSettings";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./auth/RoleGuard";

export const router =
  createBrowserRouter([
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

    /**
     * CREATOR / ADMIN CREATION FLOW
     */
    {
      path:
        "/create/category",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <CategorySelection />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    {
      path:
        "/create/form",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <SmartInputForm />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    {
      path:
        "/create/generating",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GeneratingState />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    {
      path:
        "/create/variants",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <VariantSelection />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    /**
     * Full Preview is shared:
     * - creator/admin in creator mode
     * - reviewers in mode=review
     *
     * The page itself enforces review/edit behaviour.
     */
    {
      path:
        "/create/preview",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "marketing_reviewer",
              "corpcom_reviewer",
              "admin",
            ]}
          >
            <FullPreview />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    /**
     * Submission belongs only to creator/admin.
     */
    {
      path:
        "/create/submit",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <ApprovalSubmission />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    /**
     * Approval Status can be viewed by all authenticated roles.
     */
    {
      path:
        "/approval/status",
      element: (
        <ProtectedRoute>
          <ApprovalStatus />
        </ProtectedRoute>
      ),
    },

    /**
     * REVIEW QUEUE
     *
     * Admin is intentionally excluded.
     * Admin is an oversight/configuration role,
     * not an approval authority.
     */
    {
      path: "/reviews",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "marketing_reviewer",
              "corpcom_reviewer",
            ]}
          >
            <ReviewQueue />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },

    /**
     * ADMIN ONLY
     */
    {
      path:
        "/settings/rules",
      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "admin",
            ]}
          >
            <RulesSettings />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },
  ]);
