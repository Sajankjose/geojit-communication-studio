import {
  createBrowserRouter,
  Navigate,
  useLocation,
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
 * and prepares it for the Guided brief.
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
 * Communication summary + channel generation.
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
  NotFoundPage,
} from "./pages/NotFoundPage";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  RoleGuard,
} from "./auth/RoleGuard";


function LegacyApprovalStatusRedirect() {
  const location =
    useLocation();

  return (
    <Navigate
      to={{
        pathname:
          "/approval/status",

        search:
          location.search,

        hash:
          location.hash,
      }}
      replace
    />
  );
}


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
     * COMMUNICATION SUMMARY / CHANNEL GENERATION
     * ------------------------------------------------------
     *
     * Prepares the communication summary from the
     * confirmed Guided Brief.
     *
     * Then generates selected channel options.
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
     * Displays generated A/B/C options for
     * every selected channel.
     *
     * Current channels:
     *
     * - Email
     * - WhatsApp
     * - Leaflet
     *
     * Creator selects one option per channel.
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
     * Creator:
     * - prepares / inspects the package
     * - submits the package into approval
     *
     * Marketing / CorpCom:
     * - always open the package read-only
     * - never rebuild or modify the Creator's package
     *
     * Admin:
     * - may inspect the package for oversight/testing
     *
     * Example:
     *
     * /create/guided/approval-package?communicationId=<UUID>
     */

    {
      path:
        "/create/guided/approval-package",

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
        "/approval-status",

      element: (
        <ProtectedRoute>
          <LegacyApprovalStatusRedirect />
        </ProtectedRoute>
      ),
    },


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


    /**
     * ------------------------------------------------------
     * FALLBACK / INVALID URL
     * ------------------------------------------------------
     */

    {
      path:
        "*",

      Component:
        NotFoundPage,
    },
  ]);
