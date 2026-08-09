import { useState } from "react";
import { useNavigate } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import {
  ArrowLeft,
  Settings,
  FileText,
  MessageSquare,
  Shield,
  AlertTriangle,
  Home,
} from "lucide-react";

type Tab = "categories" | "tone" | "disclaimer" | "templates" | "restricted";

export function RulesSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const tabs = [
    { id: "categories" as Tab, label: "Categories", icon: FileText },
    { id: "tone" as Tab, label: "Tone Rules", icon: MessageSquare },
    { id: "disclaimer" as Tab, label: "Disclaimers", icon: Shield },
    { id: "templates" as Tab, label: "Templates", icon: Home },
    { id: "restricted" as Tab, label: "Restricted Phrases", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Settings className="h-7 w-7 text-[#07877B]" />
              <h1 className="text-2xl text-gray-900">
                Rules & Governance
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage communication rules, templates, and compliance settings
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
          {/* Left Navigation */}
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-[#07877B] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div>
            {activeTab === "categories" && <CategoriesTab />}
            {activeTab === "tone" && <ToneRulesTab />}
            {activeTab === "disclaimer" && <DisclaimerTab />}
            {activeTab === "templates" && <TemplatesTab />}
            {activeTab === "restricted" && <RestrictedPhrasesTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function CategoriesTab() {
  const categories = [
    {
      name: "Research & Advisory",
      subcategories: ["Equity Research", "Mutual Funds", "Derivatives", "Commodities"],
      status: "Active",
    },
    {
      name: "Investor Education",
      subcategories: ["Market Basics", "Investment Strategies", "Risk Management"],
      status: "Active",
    },
    {
      name: "Product & Sales",
      subcategories: ["New Products", "Offers", "Promotions"],
      status: "Active",
    },
    {
      name: "Service & Transactional",
      subcategories: ["Account Updates", "Transaction Alerts", "Service Notifications"],
      status: "Active",
    },
    {
      name: "Regulatory & Compliance",
      subcategories: ["SEBI Circulars", "KYC Updates", "Policy Changes"],
      status: "Active",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6">Communication Categories</h2>

      <div className="space-y-4">
        {categories.map((category, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 p-6 transition-all hover:border-gray-300 hover:shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="mb-1">{category.name}</h3>
                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {category.status}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Subcategories:
              </p>
              <div className="flex flex-wrap gap-2">
                {category.subcategories.map((sub, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToneRulesTab() {
  const toneRules = [
    {
      category: "Research & Advisory",
      tone: "Professional, analytical, data-driven",
      guidelines: ["Use factual language", "Include data points", "Maintain objectivity"],
    },
    {
      category: "Investor Education",
      tone: "Educational, accessible, encouraging",
      guidelines: ["Simplify complex concepts", "Use examples", "Maintain supportive tone"],
    },
    {
      category: "Product & Sales",
      tone: "Engaging, clear, value-focused",
      guidelines: ["Highlight benefits", "Clear CTAs", "Maintain professionalism"],
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6">Tone & Style Rules</h2>

      <div className="space-y-4">
        {toneRules.map((rule, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 p-6"
          >
            <h3 className="mb-2">{rule.category}</h3>
            <p className="mb-4 text-sm text-gray-600">{rule.tone}</p>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">Guidelines:</p>
              <ul className="space-y-1">
                {rule.guidelines.map((guideline, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-[#07877B]">•</span>
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisclaimerTab() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6">Disclaimer Rules</h2>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-3">Research & Advisory</h3>
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Required Disclaimer:</strong> This communication is for
            informational purposes only. Please read the detailed research
            report and risk factors before making investment decisions.
            Investments in securities are subject to market risks.
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-3">Product & Sales</h3>
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Required Disclaimer:</strong> Mutual fund investments are
            subject to market risks. Please read all scheme-related documents
            carefully before investing.
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-3">Regulatory & Compliance</h3>
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-900">
            <strong>Mandatory Compliance:</strong> All regulatory
            communications must include reference numbers, effective dates, and
            actionable steps.
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6">Template Families</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {["Standard Layout", "Data-Heavy", "Minimal Text", "Visual Focus"].map(
          (template, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 p-6 transition-all hover:border-[#07877B] hover:shadow-sm"
            >
              <h3 className="mb-2">{template}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Optimized for different content types
              </p>
              <div className="h-32 rounded-md border border-gray-200 bg-gray-50"></div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function RestrictedPhrasesTab() {
  const restrictedPhrases = [
    { phrase: "Guaranteed returns", severity: "High", reason: "Misleading claim" },
    { phrase: "Risk-free investment", severity: "High", reason: "False promise" },
    { phrase: "Get rich quick", severity: "High", reason: "Unprofessional" },
    { phrase: "Limited time only", severity: "Medium", reason: "Pressure tactic" },
    { phrase: "Once in a lifetime", severity: "Medium", reason: "Exaggeration" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6">Restricted Phrases</h2>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-600">
                Phrase
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {restrictedPhrases.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.phrase}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      item.severity === "High"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
