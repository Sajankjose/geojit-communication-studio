import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { TopNavBar } from "../components/TopNavBar";
import { CategoryTag } from "../components/CategoryTag";
import { CommunicationStateBar } from "../components/CommunicationStateBar";
import { ProgressStepper } from "../components/ProgressStepper";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

export function SmartInputForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = (location.state?.category || "research") as
    | "research"
    | "education"
    | "product"
    | "service"
    | "regulatory"
    | "onboarding";

  const [inputMethod, setInputMethod] = useState<string>("manual");

  // Category-specific subcategories
  const subcategories = {
    research: ["Equity Research", "Mutual Funds", "Derivatives", "IPO Analysis", "Sector Reports"],
    education: ["Trading Basics", "Investment Strategies", "Market Fundamentals", "Risk Management", "Portfolio Building"],
    product: ["New Product Launch", "Product Update", "Limited Offer", "Feature Announcement", "Pricing Change"],
    service: ["Service Update", "System Maintenance", "Transaction Alert", "Account Notification", "Platform Upgrade"],
    regulatory: ["SEBI Circular", "Compliance Update", "Policy Change", "Tax Regulation", "Disclosure Requirement"],
    onboarding: ["Welcome Email", "Day 1 Onboarding", "Feature Introduction", "Account Setup", "Getting Started Guide"]
  };

  // Category-specific audience types
  const audienceTypes = {
    research: ["All Clients", "Premium Clients", "New Investors", "HNI Clients", "Institutional Investors"],
    education: ["Beginners", "Intermediate Traders", "Advanced Investors", "All Users", "New Registrations"],
    product: ["Existing Customers", "Potential Customers", "Premium Segment", "All Users", "Targeted Segment"],
    service: ["All Account Holders", "Active Traders", "Affected Users", "Premium Members", "Specific Segment"],
    regulatory: ["All Clients", "Affected Account Holders", "Compliance Officers", "Trading Members", "Specific Product Users"],
    onboarding: ["New Users", "Trial Users", "Newly Verified", "App Downloaders", "Registration Completed"]
  };

  const handleGenerate = () => {
    navigate("/create/generating", { state: { category } });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      {/* Communication State Bar */}
      <CommunicationStateBar
        title="New Communication"
        category={category}
        status="input-complete"
        currentStep={2}
        totalSteps={5}
        onSaveDraft={() => console.log("Save draft")}
      />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={2} />

      <main className="mx-auto max-w-7xl px-8 py-8">
        {/* Header with System Context */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-900">
              <strong>This information builds your communication</strong> — All inputs become structured data that AI will use to generate variants
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          {/* Main Form */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    Communication Title
                  </label>
                  <input
                    type="text"
                    placeholder={
                      category === "research" ? "e.g., Q4 Market Outlook Report" :
                      category === "education" ? "e.g., Understanding Mutual Funds - Beginner's Guide" :
                      category === "product" ? "e.g., Introducing New Trading Platform" :
                      category === "service" ? "e.g., Platform Maintenance Notification" :
                      category === "regulatory" ? "e.g., New SEBI Guidelines Implementation" :
                      "e.g., Welcome to Geojit - Your Journey Begins"
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Subcategory
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                      <option>Select subcategory</option>
                      {subcategories[category].map((sub) => (
                        <option key={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Audience Type
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                      {audienceTypes[category].map((audience) => (
                        <option key={audience}>{audience}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Input Options */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6">Input Method</h2>

              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  { id: "manual", icon: FileText, label: "Manual Entry" },
                  { id: "paste", icon: FileText, label: "Paste Content" },
                  { id: "upload", icon: Upload, label: "Upload File" },
                  { id: "url", icon: LinkIcon, label: "Paste URL" },
                  { id: "image", icon: ImageIcon, label: "Upload Image" },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setInputMethod(method.id)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                      inputMethod === method.id
                        ? "border-[#07877B] bg-[#e8f5f4]/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <method.icon className="h-5 w-5" />
                    <span className="text-sm">{method.label}</span>
                  </button>
                ))}
              </div>

              {inputMethod === "manual" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      {category === "research" ? "Topic / Security Name" :
                       category === "education" ? "Learning Topic" :
                       category === "product" ? "Product Name" :
                       category === "service" ? "Service / Update Type" :
                       category === "regulatory" ? "Regulation / Circular Name" :
                       "Journey Stage / Email Type"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        category === "research" ? "e.g., Reliance Industries" :
                        category === "education" ? "e.g., What are Mutual Funds?" :
                        category === "product" ? "e.g., Geojit Pro Trading App" :
                        category === "service" ? "e.g., Platform Maintenance" :
                        category === "regulatory" ? "e.g., SEBI Circular 2024/03" :
                        "e.g., Welcome Email - Day 1"
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Key Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        category === "research" ? "What's the main investment message you want to convey?" :
                        category === "education" ? "What's the main learning objective?" :
                        category === "product" ? "What's the key benefit or announcement?" :
                        category === "service" ? "What's the service update or action required?" :
                        category === "regulatory" ? "What's the key compliance requirement?" :
                        "What's the main message for this onboarding stage?"
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Be clear and concise. This will be the core of your
                      email.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Supporting Points
                    </label>
                    <textarea
                      rows={4}
                      placeholder={
                        category === "research" ? "Add supporting details, data points, or rationale" :
                        category === "education" ? "Add key concepts, examples, or learning points" :
                        category === "product" ? "Add features, benefits, or specifications" :
                        category === "service" ? "Add timeline, affected services, or next steps" :
                        category === "regulatory" ? "Add implementation details, deadlines, or requirements" :
                        "Add onboarding steps, benefits, or guidance"
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Category-Specific Fields */}
            {category === "research" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Research Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Recommendation
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Buy</option>
                        <option>Sell</option>
                        <option>Accumulate</option>
                        <option>Hold</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Time Horizon
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Short Term (0-3 months)</option>
                        <option>Medium Term (3-12 months)</option>
                        <option>Long Term (12+ months)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Current Price
                      </label>
                      <input
                        type="text"
                        placeholder="₹ 2,450"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Target Price
                      </label>
                      <input
                        type="text"
                        placeholder="₹ 2,850"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Key Rationale
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Why this recommendation? Key drivers and catalysts"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {category === "education" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Education Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Difficulty Level
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>All Levels</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Content Format
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Article / Guide</option>
                        <option>Video Tutorial</option>
                        <option>Infographic</option>
                        <option>Step-by-Step Tutorial</option>
                        <option>Case Study</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Key Concepts Covered
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., NAV, SIP, Asset Allocation"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Separate multiple concepts with commas
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Learning Outcome
                    </label>
                    <textarea
                      rows={3}
                      placeholder="What will readers learn or be able to do after reading?"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {category === "product" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Product Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Launch Date / Availability
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Target Segment
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>All Customers</option>
                        <option>New Customers</option>
                        <option>Premium Segment</option>
                        <option>Active Traders</option>
                        <option>Investors</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Key Features & Benefits
                    </label>
                    <textarea
                      rows={3}
                      placeholder="List the main features and benefits of this product"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Pricing Information
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Free for 3 months, ₹999/month"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Offer Validity (if applicable)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Limited time, Until March 31"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {category === "service" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Service Update Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Update Category
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Scheduled Maintenance</option>
                        <option>Service Enhancement</option>
                        <option>System Upgrade</option>
                        <option>Transaction Alert</option>
                        <option>Account Update</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Effective Date/Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Affected Services
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Trading Platform, Mobile App"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Customer Impact
                    </label>
                    <textarea
                      rows={2}
                      placeholder="How will this affect customers? Any action required?"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Duration / Timeline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2 hours, March 23 10:00 PM - 12:00 AM"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {category === "regulatory" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Regulatory & Compliance Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Regulatory Authority
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>SEBI</option>
                        <option>RBI</option>
                        <option>NSE</option>
                        <option>BSE</option>
                        <option>Internal Policy</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., SEBI/HO/CFD/CMD1/CIR/2024/03"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Compliance Deadline
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Priority Level
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Critical - Immediate Action</option>
                        <option>High - Urgent</option>
                        <option>Medium - Important</option>
                        <option>Low - Informational</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Affected Products/Services
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Equity Trading, Mutual Funds, Derivatives"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Required Actions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="What actions do customers need to take?"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {category === "onboarding" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6">Onboarding Journey Details</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Journey Stage
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>Welcome Email (Day 0)</option>
                        <option>Getting Started (Day 1)</option>
                        <option>Feature Discovery (Day 3)</option>
                        <option>First Action (Day 7)</option>
                        <option>Engagement (Day 14)</option>
                        <option>Milestone Celebration</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        User Segment
                      </label>
                      <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20">
                        <option>All New Users</option>
                        <option>First-Time Investors</option>
                        <option>Experienced Traders</option>
                        <option>Corporate Clients</option>
                        <option>Mobile App Users</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Primary Goal / Action
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Complete KYC, Make first trade, Add funds"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Key Resources / Next Steps
                    </label>
                    <textarea
                      rows={3}
                      placeholder="What resources or guidance should we provide?"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">
                      Success Metric
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., User completes profile, Downloads app"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6">Call to Action</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Read Full Report"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">
                    CTA URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Help Panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm text-blue-900">AI Tip</h3>
              </div>
              <p className="text-sm text-blue-800">
                {category === "research" && "The more specific your inputs, the better the AI can structure your email. Include key data points and clear messaging."}
                {category === "education" && "Focus on clarity and simplicity. Educational emails should break down complex topics into digestible insights."}
                {category === "product" && "Highlight benefits over features. Show customers how this product solves their problems."}
                {category === "service" && "Be clear about timelines and customer impact. Service emails should be informative and actionable."}
                {category === "regulatory" && "Ensure compliance language is clear but not overwhelming. Focus on required actions and deadlines."}
                {category === "onboarding" && "Welcome emails should be encouraging and guide users to their first success moment quickly."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm">What makes a good input?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Clear, concise messaging</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Specific data points</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Relevant context</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Actionable takeaways</span>
                </li>
              </ul>
            </div>

            {category === "research" && (
              <div className="rounded-xl border border-[#07877B]/20 bg-[#e8f5f4]/30 p-6">
                <h3 className="mb-2 text-sm text-[#07877B]">
                  Research Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  A good research email includes: company overview, financial
                  highlights, recommendation with rationale, price targets, and
                  risk factors.
                </p>
              </div>
            )}

            {category === "education" && (
              <div className="rounded-xl border border-[#07877B]/20 bg-[#e8f5f4]/30 p-6">
                <h3 className="mb-2 text-sm text-[#07877B]">
                  Education Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  Effective education emails use simple language, real examples, visual aids, and end with clear next steps or practice opportunities.
                </p>
              </div>
            )}

            {category === "product" && (
              <div className="rounded-xl border border-[#FBB041]/20 bg-orange-50/50 p-6">
                <h3 className="mb-2 text-sm text-[#FBB041]">
                  Product Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  Great product emails create excitement, clearly explain benefits, include social proof or credibility, and have a strong call-to-action.
                </p>
              </div>
            )}

            {category === "service" && (
              <div className="rounded-xl border border-gray-300/50 bg-gray-50/50 p-6">
                <h3 className="mb-2 text-sm text-gray-700">
                  Service Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  Service emails should be brief, state the impact clearly, provide exact timelines, and offer support contact if needed.
                </p>
              </div>
            )}

            {category === "regulatory" && (
              <div className="rounded-xl border border-red-200/50 bg-red-50/30 p-6">
                <h3 className="mb-2 text-sm text-red-700">
                  Regulatory Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  Compliance emails must state the regulation clearly, explain customer impact, list required actions, and provide deadlines and resources.
                </p>
              </div>
            )}

            {category === "onboarding" && (
              <div className="rounded-xl border border-blue-200/50 bg-blue-50/30 p-6">
                <h3 className="mb-2 text-sm text-blue-700">
                  Onboarding Email Example
                </h3>
                <p className="text-xs text-gray-600">
                  Welcome emails should be warm, provide clear next steps, highlight key features, and make users feel confident about getting started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <button
            onClick={() => navigate("/create/category")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex gap-3">
            <button className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50">
              Save Draft
            </button>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-8 py-3 text-white shadow-md transition-all hover:bg-[#06766a] hover:shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              Generate 3 Options
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}