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

/**
 * Keep the logo on an absolute HTTPS URL.
 * This is important because the same rendered HTML is used
 * inside the application preview and later by email clients.
 */
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
  const disclaimer = contentData?.disclaimer;

  const sectionsHtml = (body?.sections || [])
    .map(renderSection)
    .join("");

  const heroHtml =
    hero?.eyebrow ||
    hero?.title ||
    hero?.subtitle
      ? `
        <tr>
          <td style="padding:0 32px 24px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.soft};border-radius:12px;">
              <tr>
                <td style="padding:24px;">
                  ${
                    hero?.eyebrow
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.teal};margin:0 0 8px 0;">${escapeHtml(hero.eyebrow)}</div>`
                      : ""
                  }
                  ${
                    hero?.title
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:${BRAND.text};margin:0 0 6px 0;">${escapeHtml(hero.title)}</div>`
                      : ""
                  }
                  ${
                    hero?.subtitle
                      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.muted};margin:0;">${escapeHtml(hero.subtitle)}</div>`
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

  const disclaimerHtml =
    disclaimer?.required
      ? `
        <tr>
          <td style="padding:0 32px 28px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFF8E7;border:1px solid #F3D58A;border-radius:8px;">
              <tr>
                <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#6B5416;">
                  <strong>Disclaimer:</strong>
                  ${escapeHtml(
                    disclaimer.text ||
                      getDisclaimerPlaceholder(
                        disclaimer.type
                      )
                  )}
                </td>
              </tr>
            </table>
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
          ${disclaimerHtml}

          <tr>
            <td style="background:${BRAND.footer};border-top:1px solid ${BRAND.border};padding:22px 32px;text-align:left;">
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
  const title = section.title
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;font-weight:700;color:${BRAND.text};margin:0 0 10px 0;">${escapeHtml(section.title)}</div>`
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
        (item) => `
          <tr>
            <td style="padding:9px 12px;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};width:42%;">
              ${escapeHtml(item.label)}
            </td>
            <td style="padding:9px 12px;border-bottom:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:700;color:${BRAND.text};">
              ${escapeHtml(item.value)}
            </td>
          </tr>`
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
              ${escapeHtml(item)}
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
                  ${escapeHtml(section.content || "")}
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
                  ${escapeHtml(section.content || "")}
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
          ${escapeHtml(section.content || "")}
        </div>
      </td>
    </tr>`;
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

function getDisclaimerPlaceholder(
  type?: string
) {
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
