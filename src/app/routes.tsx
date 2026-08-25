import {
  createBrowserRouter,
} from "react-router";

import {
  Login,
} from "./pages/Login";

import {
  Dashboard,
} from "./pages/Dashboard";

/**
 * PHASE 2
 *
 * Creation mode selection:
 * - Guided Creation
 * - Expert Creation
 */
import {
  CreationModeSelection,
} from "./pages/CreationModeSelection";

/**
 * PHASE 2
 *
 * Guided Creation:
 * captures the Creator's raw idea
 * before AI understanding is introduced.
 */
import {
  GuidedCreation,
} from "./pages/GuidedCreation";

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
     * CREATION MODE SELECTION
     * ------------------------------------------------------
     *
     * New Phase 2 entry point.
     *
     * Dashboard
     *    ↓
     * /create/mode
     *
     * User chooses:
     *
     * Guided Creation
     * or
     * Expert Creation
     */

    {
      path:
        "/create/mode",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <CreationModeSelection />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * GUIDED CREATION
     * ------------------------------------------------------
     *
     * New Phase 2 flow.
     *
     * Current purpose:
     *
     * - capture raw user idea
     * - allow natural / imperfect language
     * - use guided starter prompts
     * - prepare for the AI understanding layer
     *
     * IMPORTANT:
     *
     * This does NOT yet call the existing generation engine.
     *
     * It is intentionally isolated so the existing Expert
     * workflow remains unaffected.
     */

    {
      path:
        "/create/guided",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GuidedCreation />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * EXISTING CREATOR / EXPERT FLOW
     * ------------------------------------------------------
     *
     * Expert Creation continues through
     * the existing Phase 1 workflow.
     *
     * Creation Mode
     *      ↓
     * Category Selection
     *      ↓
     * Smart Input Form
     *      ↓
     * AI Generation
     *      ↓
     * Variant Selection
     *      ↓
     * Preview
     *      ↓
     * Approval
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
     * editable where workflow allows
     *
     * Marketing:
     * read-only review preview
     *
     * CorpCom:
     * read-only review preview
     *
     * Admin:
     * read-only oversight preview
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
     * APPROVAL STATUS / AUDIT TRAIL
     * ------------------------------------------------------
     *
     * Canonical route:
     *
     * /approval/status?communicationId=<UUID>
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
