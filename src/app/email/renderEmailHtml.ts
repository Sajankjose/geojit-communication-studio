export interface SnapshotItem {
  label: string;
  value: string;
}

export interface EmailSection {
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

export interface RenderEmailInput {
  category: string;
  subject: string;
  preheader: string;

  contentData: {
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
  } | null;

  cta: {
    enabled: boolean;
    label: string;
    url: string;
  };
}

const BRAND = {
  teal: "#07877B",
  darkTeal: "#066E65",
  amber: "#FBB041",
  text: "#1F2937",
  muted: "#667085",
  border: "#E5E7EB",
  soft: "#F3FBFA",
  footer: "#F7F8FA",
};

const GEOJIT_LOGO_URL =
  "https://www.geojit.com/HomeDesign/images/logo.png";

const GEOJIT_DISCLAIMER_URL =
  "https://www.geojit.com/gil/disclaimer";

export function renderEmailHtml(
  input: RenderEmailInput
): string {
  const {
    category,
    subject,
    preheader,
    contentData,
    cta,
  } = input;

  const hero = contentData?.hero;
  const body = contentData?.body;

  const sectionsHtml = (body?.sections || [])
    .filter(
      (section) =>
        !shouldHideBodyDisclaimer(
          section
        )
    )
    .map(renderSection)
    .join("");

  const heroEyebrow =
    category === "research"
      ? "GEOJIT IDEAS"
      : hero?.eyebrow || "";

  const heroHtml =
    heroEyebrow ||
    hero?.title ||
    hero?.subtitle
      ? `
        <tr>
          <td style="padding:14px 32px 28px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.soft};border-radius:14px;">
              <tr>
                <td style="padding:34px 30px 32px 30px;">
                  ${
                    heroEyebrow
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:${BRAND.teal};margin:0 0 16px 0;">${escapeHtml(heroEyebrow)}</div>`
                      : ""
                  }
                  ${
                    hero?.title
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:32px;font-weight:700;color:${BRAND.text};margin:0 0 10px 0;">${escapeHtml(hero.title)}</div>`
                      : ""
                  }
                  ${
                    hero?.subtitle
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.muted};margin:0;">${escapeHtml(normalizeResearchInlineText(hero.subtitle))}</div>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const introHtml = body?.intro
    ? `
      <tr>
        <td style="padding:0 32px 20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.text};">
          ${escapeHtml(body.intro)}
        </td>
      </tr>`
    : "";

  const closingHtml = body?.closing
    ? `
      <tr>
        <td style="padding:4px 32px 20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.text};">
          ${escapeHtml(body.closing)}
        </td>
      </tr>`
    : "";

  const ctaHtml =
    cta.enabled && cta.label
      ? `
        <tr>
          <td align="left" style="padding:8px 32px 28px 32px;">
            ${
              cta.url
                ? `<a href="${escapeAttribute(cta.url)}" target="_blank" style="display:inline-block;background:${BRAND.amber};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;padding:13px 22px;border-radius:7px;">${escapeHtml(cta.label)}</a>`
                : `<span style="display:inline-block;background:${BRAND.amber};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;padding:13px 22px;border-radius:7px;">${escapeHtml(cta.label)}</span>`
            }
          </td>
        </tr>`
      : "";


  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject || "Geojit Communication")}</title>
</head>
<body style="margin:0;padding:0;background:#EEF1F4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${escapeHtml(preheader || "")}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#EEF1F4;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-collapse:separate;border-spacing:0;">

          <tr>
            <td style="background:#ffffff;padding:22px 32px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" align="left">
                    <img
                      src="${escapeAttribute(GEOJIT_LOGO_URL)}"
                      width="150"
                      alt="Geojit Financial Services"
                      style="display:block;width:150px;max-width:150px;height:auto;min-height:1px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;"
                    >
                  </td>
                  <td valign="middle" align="right" style="padding-left:20px;">
                    <span style="display:inline-block;background:${BRAND.soft};border:1px solid #B9E3DE;border-radius:999px;padding:6px 11px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:700;color:${BRAND.teal};">
                      ${escapeHtml(getCategoryLabel(category))}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${heroHtml}
          ${introHtml}
          ${sectionsHtml}
          ${closingHtml}
          ${ctaHtml}

          <tr>
            <td style="background:${BRAND.footer};border-top:1px solid ${BRAND.border};padding:24px 32px;text-align:left;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:19px;color:${BRAND.muted};">
                <strong style="color:${BRAND.text};">Our Customer Care Numbers:</strong>
                <br>
                <strong>Toll Free:</strong>
                1800 571 5501 / 1800 103 5501,
                <strong>Paid Line:</strong>
                0484 6193200

                <br><br>

                <strong>E-mail:</strong>
                <a
                  href="mailto:customercare@geojit.com"
                  style="color:${BRAND.teal};text-decoration:none;font-weight:700;"
                >
                  customercare@geojit.com
                </a>

                <br><br>

                <a
                  href="${escapeAttribute(GEOJIT_DISCLAIMER_URL)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color:${BRAND.teal};text-decoration:underline;font-weight:700;"
                >
                  Disclaimer
                </a>
              </div>

              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:#98A2B3;margin-top:14px;">
                © 2026 Geojit Financial Services. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSection(
  section: EmailSection
): string {
  const readableSectionTitle =
    getReadableSectionTitle(
      section.title || ""
    );

  const title = readableSectionTitle
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;font-weight:700;color:${BRAND.text};margin:0 0 10px 0;">${escapeHtml(readableSectionTitle)}</div>`
    : "";

  if (section.type === "snapshot") {
    const items = (section.items || []).filter(
      (item): item is SnapshotItem =>
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "value" in item
    );

    const cells = items
      .map(
        (item) => {
          const readableLabel =
            getReadableFinancialLabel(
              item.label
            );

          return `
          <tr>
            <td valign="top" style="padding:12px;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};width:38%;">
              <div style="font-weight:700;color:${BRAND.text};">
                ${escapeHtml(readableLabel.label)}
              </div>
              ${
                readableLabel.explanation
                  ? `<div style="margin-top:3px;font-size:10px;line-height:15px;color:#98A2B3;">${escapeHtml(
                      readableLabel.explanation
                    )}</div>`
                  : ""
              }
            </td>
            <td valign="top" style="padding:12px;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:${BRAND.text};">
              ${renderReadableSnapshotValue(
                item.label,
                item.value
              )}
            </td>
          </tr>`;
        }
      )
      .join("");

    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          ${title}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFB;border:1px solid ${BRAND.border};border-radius:8px;">
            ${cells}
          </table>
        </td>
      </tr>`;
  }

  if (
    section.type === "bullets" ||
    section.type === "steps" ||
    section.type === "timeline"
  ) {
    const items = (section.items || []).filter(
      (item): item is string =>
        typeof item === "string"
    );

    const list = items
      .map(
        (item, index) => `
          <tr>
            <td valign="top" style="width:22px;padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${BRAND.teal};font-weight:700;">
              ${
                section.type === "steps"
                  ? `${index + 1}.`
                  : "•"
              }
            </td>
            <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.text};">
              ${escapeHtml(cleanListItem(item))}
            </td>
          </tr>`
      )
      .join("");

    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          ${title}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${list}
          </table>
        </td>
      </tr>`;
  }

  if (section.type === "highlight") {
    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.soft};border-left:4px solid ${BRAND.teal};">
            <tr>
              <td style="padding:16px 18px;">
                ${title}
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.text};">
                  ${escapeHtml(normalizeResearchInlineText(section.content || ""))}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  if (section.type === "note") {
    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFB;border:1px solid ${BRAND.border};">
            <tr>
              <td style="padding:14px 16px;">
                ${title}
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:${BRAND.muted};">
                  ${escapeHtml(normalizeResearchInlineText(section.content || ""))}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  return `
    <tr>
      <td style="padding:4px 32px 24px 32px;">
        ${title}
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.text};">
          ${escapeHtml(normalizeResearchInlineText(section.content || ""))}
        </div>
      </td>
    </tr>`;
}

function getReadableSectionTitle(
  title: string
): string {
  const normalized =
    title
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "reported figures"
    ) ||
    normalized.includes(
      "select reported figures"
    ) ||
    normalized.includes(
      "source figures"
    )
  ) {
    return "Key Financial Figures";
  }

  return title;
}


function getReadableFinancialLabel(
  label: string
): {
  label: string;
  explanation: string;
} {
  const normalized =
    label
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "d/e"
    ) ||
    normalized.includes(
      "debt-to-equity"
    )
  ) {
    return {
      label:
        "Debt-to-Equity Ratio",
      explanation:
        "Shows the company's debt compared with shareholders' equity.",
    };
  }

  if (
    normalized.includes(
      "adjusted pat"
    ) ||
    normalized === "pat"
  ) {
    return {
      label:
        "Adjusted Profit After Tax",
      explanation:
        "Profit remaining after tax, adjusted for specified items.",
    };
  }

  if (
    normalized.includes(
      "adjusted eps"
    ) ||
    normalized === "eps"
  ) {
    return {
      label:
        "Adjusted Earnings Per Share",
      explanation:
        "Adjusted profit attributable to each share.",
    };
  }

  if (
    normalized.includes(
      "pat"
    )
  ) {
    return {
      label:
        label.replace(
          /\bPAT\b/gi,
          "Profit After Tax"
        ),
      explanation:
        "",
    };
  }

  if (
    normalized.includes(
      "eps"
    )
  ) {
    return {
      label:
        label.replace(
          /\bEPS\b/gi,
          "Earnings Per Share"
        ),
      explanation:
        "",
    };
  }

  return {
    label:
      label
        .replace(
          /\(rs\.?\s*cr\.?\)/gi,
          ""
        )
        .replace(
          /\(rs\.?\)/gi,
          ""
        )
        .trim(),
    explanation:
      "",
  };
}


function renderReadableSnapshotValue(
  label: string,
  value: string
): string {
  const parts =
    value
      .split(";")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  /**
   * Convert dense source strings such as:
   * FY26A: 4,292; FY27E: 1,886; FY28E: 127.5
   *
   * into clear period/value rows.
   *
   * This changes presentation only — not the source values.
   */
  const periodRows =
    parts
      .map((part) => {
        const match =
          part.match(
            /^([^:]{2,24}):\s*(.+)$/
          );

        if (!match) {
          return null;
        }

        return {
          period:
            formatPeriodLabel(
              match[1].trim()
            ),
          value:
            formatFinancialValue(
              label,
              match[2].trim()
            ),
        };
      })
      .filter(
        (
          row
        ): row is {
          period: string;
          value: string;
        } =>
          Boolean(row)
      );

  if (
    periodRows.length >= 2
  ) {
    const rows =
      periodRows
        .map(
          (row) => `
            <tr>
              <td style="padding:3px 12px 3px 0;font-size:12px;line-height:18px;color:${BRAND.muted};white-space:nowrap;">
                ${escapeHtml(row.period)}
              </td>
              <td style="padding:3px 0;font-size:13px;line-height:18px;font-weight:700;color:${BRAND.text};">
                ${escapeHtml(row.value)}
              </td>
            </tr>`
        )
        .join("");

    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        ${rows}
      </table>`;
  }

  return escapeHtml(
    formatFinancialValue(
      label,
      value
    )
  );
}


function formatFinancialValue(
  label: string,
  value: string
): string {
  const clean =
    value.trim();

  if (!clean) {
    return clean;
  }

  /**
   * Keep values that already include an explicit
   * currency/unit exactly as supplied.
   */
  if (
    /₹|rs\.?|inr|crore|cr\.?|%|x\b/i.test(
      clean
    )
  ) {
    return clean
      .replace(
        /\bRs\.?\s*/gi,
        "₹"
      )
      .replace(
        /\bcr\.?\b/gi,
        "crore"
      );
  }

  const normalized =
    label.toLowerCase();

  if (
    normalized.includes(
      "pat"
    ) ||
    normalized.includes(
      "profit after tax"
    ) ||
    normalized.includes(
      "rs.cr"
    ) ||
    normalized.includes(
      "rs. cr"
    )
  ) {
    return `₹${clean} crore`;
  }

  if (
    normalized.includes(
      "eps"
    ) ||
    normalized.includes(
      "earnings per share"
    )
  ) {
    return `₹${clean} per share`;
  }

  if (
    normalized.includes(
      "d/e"
    ) ||
    normalized.includes(
      "debt-to-equity"
    )
  ) {
    return clean.endsWith(
      "x"
    )
      ? clean
      : `${clean}x`;
  }

  return clean;
}


function formatPeriodLabel(
  value: string
): string {
  return value
    .replace(
      /Q([1-4])FY(\d{2})/gi,
      "Q$1 FY$2"
    )
    .replace(
      /FY(\d{2})([AE])/gi,
      "FY$1$2"
    );
}


function cleanListItem(
  value: string
): string {
  let clean =
    value.trim();

  /**
   * The renderer owns list numbering.
   * Remove numbering accidentally generated by AI.
   *
   * Examples:
   * 1) Text
   * 1. Text
   * (1) Text
   * 1 - Text
   */
  for (let i = 0; i < 3; i++) {
    clean = clean
      .replace(
        /^\s*\(\d+\)\s*/i,
        ""
      )
      .replace(
        /^\s*\d+\s*[\)\.\-:]\s*/i,
        ""
      )
      .trim();
  }

  return normalizeResearchInlineText(
    clean
  );
}


function shouldHideBodyDisclaimer(
  section: EmailSection
): boolean {
  const title =
    String(
      section.title || ""
    ).toLowerCase();

  const content =
    String(
      section.content || ""
    ).toLowerCase();

  const stringItems =
    (section.items || [])
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .join(" ")
      .toLowerCase();

  const combined =
    `${title} ${content} ${stringItems}`;

  return (
    title.includes(
      "disclaimer"
    ) ||
    title.includes(
      "risk disclaimer"
    ) ||
    combined.includes(
      "approved research disclaimer text will be inserted"
    ) ||
    combined.includes(
      "approved disclaimer text will be inserted"
    ) ||
    combined.includes(
      "communication studio rules engine"
    )
  );
}


function normalizeResearchInlineText(
  value: string
): string {
  return value
    .replace(
      /\bCMP\b/g,
      "Current Market Price"
    )
    .replace(
      /\bTP\b/g,
      "Target Price"
    )
    .replace(
      /\bRs\.?\s*/gi,
      "₹"
    )
    .replace(
      /\bPAT\b/g,
      "Profit After Tax"
    )
    .replace(
      /\bEPS\b/g,
      "Earnings Per Share"
    )
    .replace(
      /\bD\/E\b/g,
      "Debt-to-Equity Ratio"
    );
}


function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(
  value: string
): string {
  return escapeHtml(value)
    .replace(/`/g, "&#096;");
}

function getCategoryLabel(
  category: string
) {
  switch (category) {
    case "research":
      return "Research";
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
