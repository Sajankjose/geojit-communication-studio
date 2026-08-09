import { useNavigate } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryTag } from "../components/CategoryTag";
import { Plus, FileText, Clock, CheckCircle, MoreVertical } from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();

  const recentCommunications = [
    {
      id: 1,
      title: "Q4 Investment Outlook - Tech Sector",
      category: "research" as const,
      status: "approved" as const,
      date: "2 days ago",
    },
    {
      id: 2,
      title: "New Mutual Fund Launch - Growth Plus",
      category: "product" as const,
      status: "generated" as const,
      date: "3 days ago",
    },
    {
      id: 3,
      title: "Understanding Portfolio Diversification",
      category: "education" as const,
      status: "draft" as const,
      date: "5 days ago",
    },
    {
      id: 4,
      title: "SEBI Circular - Updated KYC Requirements",
      category: "regulatory" as const,
      status: "pending" as const,
      date: "1 week ago",
    },
  ];

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
              Create structured, compliant, Geojit-aligned emailers in minutes.
            </p>
            <button
              onClick={() => navigate("/create/category")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-4 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Start Creating
            </button>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => {}}
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Drafts
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => {}}
                className="text-sm text-gray-600 transition-colors hover:text-[#07877B]"
              >
                View Recent Communications
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate("/settings/rules")}
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
              <h3 className="text-2xl">12</h3>
            </div>
            <p className="text-sm text-muted-foreground">Total Drafts</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-2xl">5</h3>
            </div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl">48</h3>
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2">
              <h3 className="text-sm text-muted-foreground">
                Most Used Category
              </h3>
            </div>
            <CategoryTag category="research" size="sm" />
          </div>
        </div>

        {/* Recent Communications */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl">Recent Communications</h2>

          <div className="space-y-1">
            {recentCommunications.map((comm) => (
              <div
                key={comm.id}
                className="group flex items-center gap-4 rounded-lg border border-transparent p-4 transition-all hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="mb-2">{comm.title}</h3>
                  <div className="flex items-center gap-3">
                    <CategoryTag category={comm.category} size="sm" />
                    <StatusBadge status={comm.status} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {comm.date}
                    </span>
                  </div>
                </div>

                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-all hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
