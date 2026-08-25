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
 * and runs the Idea Understanding layer.
 */
import {
  GuidedCreation,
} from "./pages/GuidedCreation";

/**
 * PHASE 2
 *
 * Guided Brief:
 * confirms audience, purpose,
 * personalisation and channels.
 */
import {
  GuidedBrief,
} from "./pages/GuidedBrief";

/**
 * PHASE 2
 *
 * Communication Master + channel generation.
 */
import {
  GuidedReady,
} from "./pages/GuidedReady";

/**
 * PHASE 2
 *
 * Channel Preview:
 * compare A/B/C variants for Email,
 * WhatsApp and Leaflet and select
 * one variant per channel.
 */
import {
  GuidedChannelPreview,
} from "./pages/GuidedChannelPreview";

/**
 * PHASE 2
 *
 * Approval Package:
 * combines the selected channel outputs
 * into one governed review package.
 */
import {
  GuidedApprovalPackage,
} from "./pages/GuidedApprovalPackage";

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
     * Captures rawInput and uses AI
     * to understand the employee's idea.
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
     * GUIDED BRIEF
     * ------------------------------------------------------
     *
     * Creator confirms:
     *
     * - audience
     * - purpose
     * - personalisation
     * - channels
     */

    {
      path:
        "/create/guided/brief",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GuidedBrief />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * COMMUNICATION MASTER / CHANNEL GENERATION
     * ------------------------------------------------------
     *
     * Builds the Communication Master from the
     * confirmed Guided Brief.
     *
     * Then generates selected channel variants.
     */

    {
      path:
        "/create/guided/ready",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GuidedReady />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * GUIDED CHANNEL PREVIEW
     * ------------------------------------------------------
     *
     * Displays generated A/B/C variants for
     * every selected channel.
     *
     * Current channels:
     *
     * - Email
     * - WhatsApp
     * - Leaflet
     *
     * Creator selects one variant per channel.
     */

    {
      path:
        "/create/guided/channels",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GuidedChannelPreview />
          </RoleGuard>
        </ProtectedRoute>
      ),
    },


    /**
     * ------------------------------------------------------
     * GUIDED APPROVAL PACKAGE
     * ------------------------------------------------------
     *
     * Combines the selected channel outputs into
     * one review package.
     *
     * Example:
     *
     * /create/guided/approval-package?communicationId=<UUID>
     *
     * Current checkpoint:
     *
     * - package is prepared
     * - selected outputs are shown together
     * - package is saved in Supabase
     *
     * Submission into Marketing → CorpCom
     * will be connected in the next stage.
     */

    {
      path:
        "/create/guided/approval-package",

      element: (
        <ProtectedRoute>
          <RoleGuard
            allowedRoles={[
              "creator",
              "admin",
            ]}
          >
            <GuidedApprovalPackage />
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
