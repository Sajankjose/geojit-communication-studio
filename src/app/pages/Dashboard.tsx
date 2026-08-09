import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router";

import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  MoreVertical,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryTag } from "../components/CategoryTag";

import { useAuth } from "../auth/useAuth";

import {
  CommunicationRecord,
  createCommunication,
  getMyCommunications,
} from "../services/communications";

export function Dashboard() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const [
    communications,
    setCommunications,
  ] = useState<CommunicationRecord[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /**
   * Load real communications from Supabase
   * when the Dashboard opens.
   */
  useEffect(() => {
    async function loadCommunications() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getMyCommunications();

        setCommunications(data);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load communications."
        );
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadCommunications();
    }
  }, [user]);

  /**
   * Create a REAL draft record in Supabase
   * before moving to Category Selection.
   */
  const handleStartCreating =
    async () => {
      if (!user) {
        return;
      }

      try {
        setCreating(true);
        setError("");

        const communication =
          await createCommunication(
            user.id
          );

        /**
         * The communication ID travels to
         * the creation journey.
         *
         * Later we'll move this into our
         * central CommunicationContext.
         */
        navigate(
          `/create/category?communicationId=${communication.id}`
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to create a new communication. Please try again."
        );
      } finally {
        setCreating(false);
      }
    };

  /**
   * Calculate real dashboard numbers.
   */
  const totalDrafts =
    useMemo(() => {
      return communications.filter(
        (item) =>
          item.status === "draft"
      ).length;
    }, [communications]);

  const pendingApproval =
    useMemo(() => {
      const pendingStatuses = [
        "submitted",
        "marketing_review",
        "marketing_approved",
        "corpcom_review",
      ];

      return communications.filter(
        (item) =>
          pendingStatuses.includes(
            item.status
          )
      ).length;
    }, [communications]);

  const approved =
    useMemo(() => {
      return communications.filter(
        (item) =>
          item.status === "approved"
      ).length;
    }, [communications]);

  const mostUsedCategory =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      communications.forEach((item) => {
        if (!item.category) {
          return;
        }

        counts[item.category] =
          (counts[item.category] || 0) +
          1;
      });

      const sorted =
        Object.entries(counts).sort(
          (a, b) => b[1] - a[1]
        );

      return sorted[0]?.[0] || null;
    }, [communications]);

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-8 py-12">

        {/* Hero Section */}
        <div className="mb-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#e8f5f4]/30 p-10 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">

            <h1 className="mb-4 text-3xl text-gray-900">
              Create New Communication
            </h1>

            <p className="mb-8 text-lg text-gray-600">
              Create structured,
              compliant,
              Geojit-aligned emailers
              in minutes.
            </p>

            <button
              onClick={
                handleStartCreating
              }
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-5 w-5" />

              {creating
                ? "Creating..."
                : "Start Creating"}
            </button>

            {error && (
              <div className="mx-auto mt-5 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">

              <button
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Drafts
              </button>

              <span className="text-gray-300">
                •
              </span>

              <button
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Recent Communications
              </button>

              <span className="text-gray-300">
                •
              </span>

              <button
                onClick={() =>
                  navigate(
                    "/settings/rules"
                  )
                }
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                Templates / Rules
              </button>

            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <h3 className="text-2xl">
                {loading
                  ? "—"
                  : totalDrafts}
              </h3>

            </div>

            <p className="text-sm text-muted-foreground">
              Total Drafts
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>

              <h3 className="text-2xl">
                {loading
                  ? "—"
                  : pendingApproval}
              </h3>

            </div>

            <p className="text-sm text-muted-foreground">
              Pending Approval
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <h3 className="text-2xl">
                {loading
                  ? "—"
                  : approved}
              </h3>

            </div>

            <p className="text-sm text-muted-foreground">
              Approved
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-2">
              <h3 className="text-sm text-muted-foreground">
                Most Used Category
              </h3>
            </div>

            {mostUsedCategory ? (
              <CategoryTag
                category={
                  mapDatabaseCategory(
                    mostUsedCategory
                  )
                }
                size="sm"
              />
            ) : (
              <p className="text-sm text-gray-400">
                No data yet
              </p>
            )}

          </div>

        </div>

        {/* Recent Communications */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

          <h2 className="mb-6 text-xl">
            Recent Communications
          </h2>

          {loading && (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading communications...
            </div>
          )}

          {!loading &&
            communications.length ===
              0 && (
              <div className="py-12 text-center">

                <FileText className="mx-auto mb-4 h-10 w-10 text-gray-300" />

                <h3 className="mb-2 text-gray-900">
                  No communications yet
                </h3>

                <p className="text-sm text-gray-500">
                  Start by creating your
                  first communication.
                </p>

              </div>
            )}

          {!loading &&
            communications.length >
              0 && (
              <div className="space-y-1">

                {communications
                  .slice(0, 10)
                  .map((comm) => (
                    <div
                      key={comm.id}
                      className="group flex items-center gap-4 rounded-lg border border-transparent p-4 transition-all hover:border-gray-200 hover:bg-gray-50"
                    >

                      <button
                        onClick={() =>
                          navigate(
                            `/create/category?communicationId=${comm.id}`
                          )
                        }
                        className="flex-1 text-left"
                      >

                        <h3 className="mb-2">
                          {comm.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">

                          {comm.category && (
                            <CategoryTag
                              category={
                                mapDatabaseCategory(
                                  comm.category
                                )
                              }
                              size="sm"
                            />
                          )}

                          <StatusBadge
                            status={
                              mapDatabaseStatus(
                                comm.status
                              )
                            }
                            size="sm"
                          />

                          <span className="text-sm text-muted-foreground">
                            {formatDate(
                              comm.updated_at
                            )}
                          </span>

                        </div>

                      </button>

                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                    </div>
                  ))}

              </div>
            )}

        </div>

      </main>
    </div>
  );
}


/**
 * Converts our database category names
 * to the names already understood by
 * the existing CategoryTag component.
 */
function mapDatabaseCategory(
  category: string
):
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding" {

  switch (category) {

    case "Research & Advisory":
      return "research";

    case "Investor Education":
      return "education";

    case "Product & Sales":
      return "product";

    case "Service & Transactional":
      return "service";

    case "Regulatory & Compliance":
      return "regulatory";

    case "Onboarding & Journey":
      return "onboarding";

    default:
      return "research";
  }
}


/**
 * Maps database workflow statuses into
 * the StatusBadge values already present
 * in the current UI.
 */
function mapDatabaseStatus(
  status: string
):
  | "draft"
  | "generated"
  | "pending"
  | "approved" {

  switch (status) {

    case "approved":
      return "approved";

    case "variants_ready":
    case "variant_selected":
    case "preview_ready":
      return "generated";

    case "submitted":
    case "marketing_review":
    case "marketing_approved":
    case "corpcom_review":
      return "pending";

    default:
      return "draft";
  }
}


/**
 * Simple readable date for the Dashboard.
 */
function formatDate(
  dateValue: string
) {
  const date =
    new Date(dateValue);

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
