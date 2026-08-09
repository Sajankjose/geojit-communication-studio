interface EmailPreviewProps {
  variant?: "clarity" | "balanced" | "impact";
  category?: string;
}

export function EmailPreview({ variant = "balanced", category }: EmailPreviewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-gray-100 p-8 shadow-lg">
      {/* Email Container */}
      <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-lg bg-white shadow-md">
        {/* Email Header */}
        <div className="border-b border-gray-200 bg-[#07877B] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#07877B]">
              <span className="text-lg">G</span>
            </div>
            <div>
              <h2 className="text-lg text-white">Geojit Financial Services</h2>
              <p className="text-xs text-white/80">Research & Advisory</p>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="px-8 py-8">
          {/* Subject Area */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl text-gray-900">
              Reliance Industries - BUY Recommendation
            </h1>
            <p className="text-sm text-gray-600">
              Target ₹2,850 | Strong fundamentals and growth outlook
            </p>
          </div>

          {/* Greeting */}
          <p className="mb-6 text-gray-700">Dear Valued Investor,</p>

          {/* Main Content */}
          <div className="mb-6 space-y-4">
            <p className="text-gray-700">
              We are pleased to share our latest research recommendation on
              Reliance Industries Limited (RIL). Based on our comprehensive
              analysis, we recommend a <strong className="text-[#07877B]">BUY</strong> rating with a
              target price of <strong>₹2,850</strong>.
            </p>

            {/* Info Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Current Price
                  </p>
                  <p className="text-lg">₹2,450</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Target Price
                  </p>
                  <p className="text-lg text-[#07877B]">₹2,850</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Upside Potential
                  </p>
                  <p className="text-lg text-green-600">16.3%</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Time Horizon
                  </p>
                  <p className="text-lg">12 months</p>
                </div>
              </div>

              <div className="inline-flex items-center rounded-full bg-[#07877B] px-4 py-2 text-sm text-white">
                Recommendation: BUY
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <h3 className="mb-2 text-sm text-gray-900">Key Investment Rationale:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>
                    Strong revenue growth across telecom and retail segments
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>
                    Successful commissioning of new energy projects
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Robust cash flow generation and deleveraging</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#07877B]">•</span>
                  <span>Favorable valuation compared to sector peers</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-6">
            <a
              href="#"
              className="inline-block rounded-lg bg-[#FBB041] px-6 py-3 text-center text-white transition-all hover:bg-[#e9a030]"
            >
              Read Full Research Report →
            </a>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-900">
              <strong>Disclaimer:</strong> This communication is for
              informational purposes only. Please read the detailed research
              report and risk factors before making investment decisions.
              Investments in securities are subject to market risks.
            </p>
          </div>
        </div>

        {/* Email Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          <div className="mb-3 text-center text-xs text-gray-600">
            <p className="mb-1">Geojit Financial Services Ltd.</p>
            <p>34/659-P, Civil Line Road, Padivattom, Kochi - 682024</p>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>
              © 2026 Geojit Financial Services. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
