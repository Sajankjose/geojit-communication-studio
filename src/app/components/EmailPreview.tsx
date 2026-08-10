interface SnapshotItem {
  label: string;
  value: string;
}

interface EmailSection {
  type:
    | "text"
    | "bullets"
    | "snapshot"
    | "highlight"
    | "steps"
    | "timeline"
    | "note";
  title?: string;
  content?: string;
  items?: Array<string | SnapshotItem>;
}

interface EmailContentData {
  variant_name?: string;
  strategy?: string;
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  body?: {
    intro?: string;
    sections?: EmailSection[];
    closing?: string;
  };
  disclaimer?: {
    required?: boolean;
    type?: string;
    text?: string;
  };
  compliance?: {
    status?: string;
    flags?: string[];
    notes?: string[];
  };
}

interface EmailPreviewProps {
  category?: string;
  subject: string;
  preheader: string;
  contentData: EmailContentData | null;
  cta: {
    enabled: boolean;
    label: string;
    url: string;
  };
}

export function EmailPreview({
  category = "research",
  subject,
  preheader,
  contentData,
  cta,
}: EmailPreviewProps) {
  const hero = contentData?.hero;
  const body = contentData?.body;
  const disclaimer = contentData?.disclaimer;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="bg-[#07877B] px-8 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#07877B]">
            G
          </div>
          <div>
            <p className="font-medium">Geojit Financial Services</p>
            <p className="text-sm text-white/80">{getCategoryLabel(category)}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-7 border-b border-gray-100 pb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#07877B]">
            Email Subject
          </p>
          <h1 className="mb-2 text-2xl leading-tight text-gray-900">
            {subject || "Untitled communication"}
          </h1>
          {preheader && (
            <p className="text-sm leading-6 text-gray-600">{preheader}</p>
          )}
        </div>

        {(hero?.eyebrow || hero?.title || hero?.subtitle) && (
          <div className="mb-7 rounded-xl bg-[#f3fbfa] p-6">
            {hero.eyebrow && (
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#07877B]">
                {hero.eyebrow}
              </p>
            )}
            {hero.title && (
              <h2 className="mb-2 text-xl text-gray-900">{hero.title}</h2>
            )}
            {hero.subtitle && (
              <p className="text-sm leading-6 text-gray-600">{hero.subtitle}</p>
            )}
          </div>
        )}

        {body?.intro && (
          <p className="mb-6 leading-7 text-gray-700">{body.intro}</p>
        )}

        <div className="space-y-6">
          {(body?.sections || []).map((section, index) => (
            <SectionRenderer
              key={`${section.type}-${index}`}
              section={section}
            />
          ))}
        </div>

        {body?.closing && (
          <p className="mt-7 leading-7 text-gray-700">{body.closing}</p>
        )}

        {cta.enabled && cta.label && (
          <div className="mt-8">
            <a
              href={cta.url || "#"}
              onClick={(event) => {
                if (!cta.url) event.preventDefault();
              }}
              target={cta.url ? "_blank" : undefined}
              rel="noreferrer"
              className="inline-block rounded-lg bg-[#FBB041] px-6 py-3 text-center font-medium text-white transition-all hover:opacity-90"
            >
              {cta.label}
            </a>
          </div>
        )}

        {disclaimer?.required && (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs leading-5 text-amber-900">
              <strong>Disclaimer:</strong>{" "}
              {disclaimer.text ||
                getDisclaimerPlaceholder(disclaimer.type)}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
        <div className="mb-3 text-center text-xs leading-5 text-gray-600">
          <p className="mb-1">Geojit Financial Services Ltd.</p>
          <p>34/659-P, Civil Line Road, Padivattom, Kochi - 682024</p>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          © 2026 Geojit Financial Services. All rights reserved.
        </div>
      </div>
    </div>
  );
}

function SectionRenderer({ section }: { section: EmailSection }) {
  if (section.type === "snapshot") {
    const snapshotItems = (section.items || []).filter(
      (item): item is SnapshotItem =>
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "value" in item
    );

    return (
      <section>
        {section.title && (
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {section.title}
          </h3>
        )}
        <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2">
          {snapshotItems.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <p className="mb-1 text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (
    section.type === "bullets" ||
    section.type === "steps" ||
    section.type === "timeline"
  ) {
    const textItems = (section.items || []).filter(
      (item): item is string => typeof item === "string"
    );

    return (
      <section>
        {section.title && (
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {section.title}
          </h3>
        )}
        <div className="space-y-2">
          {textItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex gap-3 text-sm leading-6 text-gray-700"
            >
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#07877B]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "highlight") {
    return (
      <section className="rounded-lg border border-[#bfe4df] bg-[#f3fbfa] p-5">
        {section.title && (
          <h3 className="mb-2 text-sm font-medium text-[#06766a]">
            {section.title}
          </h3>
        )}
        {section.content && (
          <p className="text-sm leading-6 text-gray-700">{section.content}</p>
        )}
      </section>
    );
  }

  if (section.type === "note") {
    return (
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        {section.title && (
          <h3 className="mb-2 text-sm font-medium text-gray-900">
            {section.title}
          </h3>
        )}
        {section.content && (
          <p className="text-sm leading-6 text-gray-600">{section.content}</p>
        )}
      </section>
    );
  }

  return (
    <section>
      {section.title && (
        <h3 className="mb-2 text-sm font-medium text-gray-900">
          {section.title}
        </h3>
      )}
      {section.content && (
        <p className="text-sm leading-6 text-gray-700">{section.content}</p>
      )}
    </section>
  );
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "research":
      return "Research & Advisory";
    case "education":
      return "Investor Education";
    case "product":
      return "Product & Sales";
    case "service":
      return "Service & Transactional";
    case "regulatory":
      return "Regulatory & Compliance";
    case "onboarding":
      return "Onboarding & Journey";
    default:
      return "Communication";
  }
}

function getDisclaimerPlaceholder(type?: string) {
  switch (type) {
    case "research":
      return "Approved research disclaimer text will be inserted by the Communication Studio rules engine.";
    case "regulatory":
      return "Approved regulatory disclaimer text will be inserted by the Communication Studio rules engine.";
    case "promotional":
      return "Approved promotional disclaimer text will be inserted by the Communication Studio rules engine.";
    default:
      return "Approved disclaimer text will be inserted by the Communication Studio rules engine.";
  }
}
