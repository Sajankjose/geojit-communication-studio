import {
  createBrowserRouter,
} from "react-router";

import {
  Login,
} from "./pages/Login";

import {
  Dashboard,
} from "./pages/Dashboard";

import {
  CategorySelection,
} from "./pages/CategorySelection";

import {
  SmartInputForm,
} from "./pages/SmartInputForm";

import {
  GeneratingState,
} from "./pages/GeneratingState";

import {
  VariantSelection,
} from "./pages/VariantSelection";

import {
  FullPreview,
} from "./pages/FullPreview";

import {
  ApprovalSubmission,
} from "./pages/ApprovalSubmission";

import {
  ApprovalStatus,
} from "./pages/ApprovalStatus";

import {
  ReviewQueue,
} from "./pages/ReviewQueue";

import {
  RulesSettings,
} from "./pages/RulesSettings";

import {
  UserManagement,
} from "./pages/UserManagement";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  RoleGuard,
} from "./auth/RoleGuard";


export const router =
  createBrowserRouter([
    /**
     * ------------------------------------------------------
     * PUBLIC
     * ------------------------------------------------------
     */

    {
      path:
        "/login",

      Component:
        Login,
    },


    /**
     * ------------------------------------------------------
     * DASHBOARD
     * ------------------------------------------------------
     *
     * Dashboard is available to every authenticated role.
     *
     * Each role can render its own relevant dashboard content.
     */

    {
      path:
        "/",

      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * CREATOR FLOW
     * ------------------------------------------------------
     *
     * Creator:
     * - creates communication
     * - enters inputs
     * - generates variants
     * - selects copy
     * - previews
     * - submits for approval
     *
     * Admin is currently retained here for creation-flow
     * visibility / testing because that is how your existing
     * application is configured.
     *
     * Individual screens should still prevent Admin from
     * acting as Creator where required.
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
     * ------------------------------------------------------
     * SHARED FULL PREVIEW
     * ------------------------------------------------------
     *
     * Creator:
     * editable preview
     *
     * Marketing:
     * read-only review preview
     *
     * CorpCom:
     * read-only review preview
     *
     * Admin:
     * read-only oversight preview
     *
     * FullPreview itself controls whether the page is editable
     * based on role + mode.
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
     * ------------------------------------------------------
     * APPROVAL SUBMISSION
     * ------------------------------------------------------
     *
     * Creator submits the selected communication
     * to Marketing review.
     *
     * Admin may reach this route under the existing role
     * configuration, but the page/service layer should
     * prevent Admin from impersonating Creator.
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
     * ------------------------------------------------------
     * COMMUNICATION APPROVAL STATUS / AUDIT TRAIL
     * ------------------------------------------------------
     *
     * IMPORTANT:
     *
     * This is the canonical route:
     *
     * /approval/status?communicationId=<UUID>
     *
     * Do NOT navigate to:
     *
     * /approval-status
     *
     * Creator, Marketing, CorpCom and Admin may all use this
     * page subject to Supabase/RPC access rules.
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
     * ------------------------------------------------------
     * REVIEW QUEUE
     * ------------------------------------------------------
     *
     * Marketing Reviewer:
     * - Marketing pending queue
     * - My Activity
     *
     * CorpCom Reviewer:
     * - CorpCom pending queue
     * - My Activity
     *
     * Admin is intentionally excluded because Admin is an
     * oversight/configuration role rather than an approver.
     */

    {
      path:
        "/reviews",

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
     * ------------------------------------------------------
     * ADMIN - COMMUNICATION RULES
     * ------------------------------------------------------
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


    /**
     * ------------------------------------------------------
     * ADMIN - USER MANAGEMENT
     * ------------------------------------------------------
     */

    {
      path:
        "/settings/users",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "admin",
            ]}
          >
            <UserManagement />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },
  ]);
