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
  navy: "#17324D",
  blueSoft: "#F2F6FA",
  blueBorder: "#D9E3EC",
  slateSoft: "#F7F9FB",
  amberSoft: "#FFF8E8",
  redSoft: "#FDEEEE",
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

  const heroEyebrow =
    category === "research"
      ? "GEOJIT IDEAS"
      : hero?.eyebrow || "";

  /**
   * IMPORTANT:
   * Build researchHero before using it in the
   * client-facing section preparation below.
   *
   * The previous order referenced researchHero before
   * initialization, which caused renderEmailHtml() to throw
   * when the HTML download action called it.
   */
  const researchHero =
    category === "research"
      ? parseResearchHero(
          hero,
          body
        )
      : null;

  const recommendationStyle =
    researchHero?.recommendation
      ? getRecommendationStyle(
          researchHero.recommendation
        )
      : null;

  const clientSections =
    prepareClientFacingSections(
      body?.sections || [],
      category,
      researchHero
    );

  const sectionsHtml =
    clientSections
      .map(renderSection)
      .join("");

  const heroHtml =
    heroEyebrow ||
    hero?.title ||
    hero?.subtitle
      ? `
        <tr>
          <td style="padding:18px 32px 28px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${BRAND.soft};border:1px solid #D8EEEA;border-top:5px solid ${BRAND.teal};border-radius:18px;">
              <tr>
                <td style="padding:34px 30px 30px 30px;">
                  ${
                    heroEyebrow
                      ? `
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.teal};margin:0 0 8px 0;">
                          ${escapeHtml(heroEyebrow)}
                        </div>
                        <div style="width:36px;height:3px;background:${BRAND.teal};border-radius:999px;margin:0 0 22px 0;"></div>
                      `
                      : ""
                  }

                  ${
                    category === "research" &&
                    researchHero
                      ? `
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:25px;line-height:34px;font-weight:700;color:${BRAND.text};margin:0 0 24px 0;">
                          ${escapeHtml(researchHero.companyTitle)}
                        </div>

                        ${
                          researchHero.recommendation ||
                          researchHero.targetPrice ||
                          researchHero.cmp ||
                          researchHero.timeHorizon
                            ? `
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                                <tr>
                                  ${
                                    researchHero.recommendation &&
                                    recommendationStyle
                                      ? `
                                        <td valign="top" style="width:26%;padding:0 18px 0 0;border-right:1px solid #CFE4E1;">
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${BRAND.muted};margin:0 0 8px 0;">
                                            Recommendation
                                          </div>
                                          <span style="display:inline-block;background:${recommendationStyle.background};border:1px solid ${recommendationStyle.border};border-radius:999px;padding:10px 20px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:800;letter-spacing:.03em;color:${recommendationStyle.color};box-shadow:0 1px 0 rgba(0,0,0,.04);">
                                            ${escapeHtml(researchHero.recommendation)}
                                          </span>
                                        </td>
                                      `
                                      : ""
                                  }

                                  ${
                                    researchHero.targetPrice
                                      ? `
                                        <td valign="top" style="width:24%;padding:0 18px;${researchHero.cmp || researchHero.timeHorizon ? "border-right:1px solid #CFE4E1;" : ""}">
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${BRAND.muted};margin:0 0 6px 0;">
                                            Target Price
                                          </div>
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:26px;font-weight:800;color:${BRAND.darkTeal};">
                                            ₹${escapeHtml(researchHero.targetPrice)}
                                          </div>
                                        </td>
                                      `
                                      : ""
                                  }

                                  ${
                                    researchHero.cmp
                                      ? `
                                        <td valign="top" style="width:26%;padding:0 18px;${researchHero.timeHorizon ? "border-right:1px solid #CFE4E1;" : ""}">
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${BRAND.muted};margin:0 0 6px 0;">
                                            Current Market Price
                                          </div>
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:26px;font-weight:800;color:${BRAND.darkTeal};">
                                            ₹${escapeHtml(researchHero.cmp)}
                                          </div>
                                          ${
                                            researchHero.asOnDate
                                              ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:${BRAND.muted};margin-top:3px;">As on ${escapeHtml(researchHero.asOnDate)}</div>`
                                              : ""
                                          }
                                        </td>
                                      `
                                      : ""
                                  }

                                  ${
                                    researchHero.timeHorizon
                                      ? `
                                        <td valign="top" style="width:24%;padding:0 0 0 18px;">
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${BRAND.muted};margin:0 0 6px 0;">
                                            Time Horizon
                                          </div>
                                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:24px;font-weight:800;color:${BRAND.darkTeal};">
                                            ${escapeHtml(normalizeDurationText(researchHero.timeHorizon))}
                                          </div>
                                        </td>
                                      `
                                      : ""
                                  }
                                </tr>
                              </table>

                              ${
                                researchHero.valuationMethod ||
                                researchHero.secondaryText
                                  ? `
                                    <div style="border-top:1px solid #CFE4E1;margin-top:24px;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:${BRAND.muted};">
                                      ${
                                        researchHero.valuationMethod
                                          ? `<strong style="color:${BRAND.text};">Valuation Method:</strong> ${escapeHtml(researchHero.valuationMethod)}`
                                          : ""
                                      }
                                      ${
                                        researchHero.valuationMethod &&
                                        researchHero.secondaryText
                                          ? `<span style="padding:0 10px;color:#A8B2BC;">|</span>`
                                          : ""
                                      }
                                      ${
                                        researchHero.secondaryText
                                          ? escapeHtml(normalizeResearchInlineText(researchHero.secondaryText))
                                          : ""
                                      }
                                    </div>
                                  `
                                  : ""
                              }
                            `
                            : ""
                        }
                      `
                      : `
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
                      `
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const clientIntro =
    getClientFacingIntro(
      body?.intro || "",
      researchHero
    );

  const introHtml = clientIntro
    ? `
      <tr>
        <td style="padding:0 32px 20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.text};">
          ${escapeHtml(clientIntro)}
        </td>
      </tr>`
    : "";

  const clientClosing =
    getClientFacingClosing(
      body?.closing || ""
    );

  const closingHtml = clientClosing
    ? `
      <tr>
        <td style="padding:4px 32px 20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.text};">
          ${escapeHtml(clientClosing)}
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

type ResearchHeroData = {
  companyTitle: string;
  recommendation: string;
  targetPrice: string;
  cmp: string;
  asOnDate: string;
  timeHorizon: string;
  valuationMethod: string;
  secondaryText: string;
};

function prepareClientFacingSections(
  sections: EmailSection[],
  category: string,
  researchHero: ResearchHeroData | null
): EmailSection[] {
  const seen = new Set<string>();
  const seenFinancialMetrics =
    new Set<string>();

  return sections
    .filter(
      (section) =>
        !shouldHideBodyDisclaimer(section)
    )
    .filter(
      (section) =>
        !isInternalOnlySection(section)
    )
    .filter((section) => {
      if (
        category === "research" &&
        researchHero &&
        isHeroDuplicateSnapshot(
          section,
          researchHero
        )
      ) {
        return false;
      }

      return true;
    })
    .map(sanitizeClientSection)
    .filter((section) => {
      /**
       * Avoid two near-identical sections such as
       * "Key financial drivers reported" and
       * "What the results show".
       */
      if (
        isDenseResearchFinancialSection(
          section
        )
      ) {
        const metricKeys =
          getFinancialMetricKeys(
            section
          );

        const overlap =
          metricKeys.filter(
            (key) =>
              seenFinancialMetrics.has(
                key
              )
          ).length;

        if (
          metricKeys.length > 0 &&
          overlap /
            metricKeys.length >=
            0.6
        ) {
          return false;
        }

        metricKeys.forEach(
          (key) =>
            seenFinancialMetrics.add(
              key
            )
        );
      }

      const fingerprint =
        getSectionFingerprint(section);

      if (!fingerprint) {
        return true;
      }

      if (seen.has(fingerprint)) {
        return false;
      }

      seen.add(fingerprint);
      return true;
    });
}

function isInternalOnlySection(
  section: EmailSection
): boolean {
  const title =
    String(section.title || "")
      .trim()
      .toLowerCase();

  const content =
    String(section.content || "")
      .trim()
      .toLowerCase();

  const combined =
    `${title} ${content}`;

  const blockedTitlePatterns = [
    "important source note",
    "source note",
    "source validation",
    "validation note",
    "extraction note",
    "selected numbers (source-extracted)",
    "selected numbers (source extracted)",
    "source-extracted",
    "source extracted",
    "extracted figures",
    "extracted numbers",
    "reported figures (source)",
    "select reported figures (source)",
  ];

  if (
    blockedTitlePatterns.some(
      (pattern) =>
        title.includes(pattern)
    )
  ) {
    return true;
  }

  const blockedContentPatterns = [
    "report file provided",
    "uploaded report",
    "uploaded file",
    "source includes",
    "source shows",
    "source-extracted",
    "source extracted",
    "reproduced as extracted",
    "should be validated in final review",
    "validate in final review",
    "communication studio rules engine",
    "extraction warning",
  ];

  return blockedContentPatterns.some(
    (pattern) =>
      combined.includes(pattern)
  );
}

function isHeroDuplicateSnapshot(
  section: EmailSection,
  researchHero: ResearchHeroData
): boolean {
  if (section.type !== "snapshot") {
    return false;
  }

  const title =
    String(section.title || "")
      .toLowerCase();

  if (
    !title.includes("at a glance") &&
    !title.includes("snapshot") &&
    !title.includes("recommendation")
  ) {
    return false;
  }

  const labels =
    (section.items || [])
      .filter(
        (
          item
        ): item is SnapshotItem =>
          typeof item === "object" &&
          item !== null &&
          "label" in item
      )
      .map(
        (item) =>
          item.label.toLowerCase()
      );

  const heroLabels = [
    researchHero.recommendation
      ? "recommendation"
      : "",
    researchHero.targetPrice
      ? "target"
      : "",
    researchHero.cmp
      ? "current"
      : "",
    researchHero.timeHorizon
      ? "horizon"
      : "",
  ].filter(Boolean);

  if (heroLabels.length < 2) {
    return false;
  }

  const matches =
    labels.filter((label) =>
      heroLabels.some(
        (heroLabel) =>
          label.includes(heroLabel)
      )
    ).length;

  return matches >= 2;
}

function getFinancialMetricKeys(
  section: EmailSection
): string[] {
  const items =
    (section.items || []).filter(
      (item): item is string =>
        typeof item === "string"
    );

  const keys =
    items
      .map((item) => {
        const text =
          item.toLowerCase();

        if (
          /\b(?:eps|earnings per share)\b/.test(
            text
          )
        ) {
          return "eps";
        }

        if (
          /\b(?:pat|profit after tax)\b/.test(
            text
          )
        ) {
          return "pat";
        }

        if (
          /\b(?:pbt|profit before tax)\b/.test(
            text
          )
        ) {
          return "pbt";
        }

        if (
          /\b(?:ebit|earnings before interest and tax)\b/.test(
            text
          )
        ) {
          return "ebit";
        }

        if (
          /\b(?:p\/e|price-to-earnings)\b/.test(
            text
          )
        ) {
          return "pe";
        }

        if (
          /\bsales\b/.test(text)
        ) {
          return "sales";
        }

        if (
          /\brevenue\b/.test(text)
        ) {
          return "revenue";
        }

        return "";
      })
      .filter(Boolean);

  return Array.from(
    new Set(keys)
  );
}


function sanitizeClientSection(
  section: EmailSection
): EmailSection {
  const title =
    normalizeClientHeading(
      cleanClientFacingTitle(
        section.title || ""
      )
    );

  const content =
    cleanClientFacingText(
      section.content || ""
    );

  const items =
    (section.items || []).map(
      (item) => {
        if (typeof item === "string") {
          return normalizeCustomerSentence(
            cleanClientFacingText(item)
          );
        }

        return {
          ...item,
          label:
            cleanClientFacingTitle(
              item.label
            ),
          value:
            normalizeCustomerSentence(
              cleanClientFacingText(
                item.value
              )
            ),
        };
      }
    );

  return {
    ...section,
    title: title || undefined,
    content: content || undefined,
    items,
  };
}

function normalizeClientHeading(
  value: string
): string {
  const clean =
    value
      .replace(/\s{2,}/g, " ")
      .trim();

  const normalized =
    clean
      .toLowerCase()
      .replace(/[?.!]+$/g, "")
      .trim();

  const headingMap: Record<
    string,
    string
  > = {
    "why we recommend":
      "Why do we recommend it?",
    "why we recommend it":
      "Why do we recommend it?",
    "why recommend":
      "Why do we recommend it?",
    "why buy":
      "Why do we recommend it?",
    "what investors should know":
      "What should investors know?",
    "what investors should watch next":
      "What should investors watch next?",
    "company at a glance":
      "Company at a glance",
    "key risks to watch":
      "Key risks to watch",
    "what matters (plain language)":
      "What supports our view",
    "what matters":
      "What supports our view",
    "top investor takeaways":
      "Why do we recommend it?",
    "selected numbers":
      "Key financial figures",
    "key financial figures":
      "Key financial figures",
    "selected result details":
      "Key financial highlights",
    "result details":
      "Key financial highlights",
    "key financial drivers reported":
      "Key financial highlights",
    "what the results show":
      "Key financial highlights",
  };

  if (headingMap[normalized]) {
    return headingMap[normalized];
  }

  return clean;
}


function normalizeDurationText(
  value: string
): string {
  return value
    .replace(
      /\b(\d+)\s*[- ]?\s*(month|months)\b/gi,
      (_, number) => {
        const n =
          Number(number);

        return `${number} ${
          n === 1
            ? "month"
            : "months"
        }`;
      }
    )
    .replace(
      /\b(\d+)\s*[- ]?\s*(year|years)\b/gi,
      (_, number) => {
        const n =
          Number(number);

        return `${number} ${
          n === 1
            ? "year"
            : "years"
        }`;
      }
    );
}


function normalizeCustomerSentence(
  value: string
): string {
  return normalizeDurationText(
    value
  )
    .replace(
      /\bRs\.?\s*/gi,
      "₹"
    )
    .replace(
      /\bINR\s*/gi,
      "₹"
    )
    .replace(
      /\s+([,.;:!?])/g,
      "$1"
    )
    .replace(
      /([!?.,]){2,}/g,
      "$1"
    )
    .replace(
      /\s{2,}/g,
      " "
    )
    .trim();
}


function cleanClientFacingTitle(
  value: string
): string {
  return value
    .replace(
      /\s*\(source[- ]?extracted\)\s*/gi,
      ""
    )
    .replace(
      /\s*\(source\)\s*/gi,
      ""
    )
    .replace(
      /\bsource[- ]?extracted\b/gi,
      ""
    )
    .replace(
      /\bsource figures\b/gi,
      "Key figures"
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanClientFacingText(
  value: string
): string {
  return normalizeResearchInlineText(
    value
  )
    .replace(
      /\bfrom the source\b/gi,
      ""
    )
    .replace(
      /\bsource[- ]?extracted\b/gi,
      ""
    )
    .replace(
      /\bsource includes\b/gi,
      ""
    )
    .replace(
      /\bsource shows\b/gi,
      ""
    )
    .replace(
      /\buploaded report\b/gi,
      "research report"
    )
    .replace(
      /\buploaded file\b/gi,
      "research report"
    )
    .replace(
      /\breproduced as extracted\b/gi,
      ""
    )
    .replace(
      /\bshould be validated in final review\b/gi,
      ""
    )
    .replace(
      /\s+([,.;:])/g,
      "$1"
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getClientFacingIntro(
  value: string,
  researchHero: ResearchHeroData | null
): string {
  if (!value) {
    return "";
  }

  const lower =
    value.toLowerCase();

  if (
    lower.includes(
      "summary of the research note uploaded"
    ) &&
    researchHero?.companyTitle
  ) {
    const recommendation =
      researchHero.recommendation
        ? ` ${researchHero.recommendation}`
        : "";

    const target =
      researchHero.targetPrice
        ? ` with a target price of ₹${researchHero.targetPrice}`
        : "";

    const horizon =
      researchHero.timeHorizon
        ? ` over ${researchHero.timeHorizon}`
        : "";

    return `Geojit Research has a${recommendation} view on ${researchHero.companyTitle}${target}${horizon}. Here is a short summary of the key reasons and risks to consider.`;
  }

  return normalizeCustomerSentence(
    cleanClientFacingText(value)
  );
}

function getClientFacingClosing(
  value: string
): string {
  if (!value) {
    return "";
  }

  const lower =
    value.toLowerCase();

  const internalPhrases = [
    "check final validated figures",
    "validate the figures",
    "validated figures before acting",
    "source validation",
    "final review",
  ];

  if (
    internalPhrases.some(
      (phrase) =>
        lower.includes(phrase)
    )
  ) {
    return "";
  }

  return normalizeCustomerSentence(
    cleanClientFacingText(value)
  );
}

function getSectionFingerprint(
  section: EmailSection
): string {
  const itemText =
    (section.items || [])
      .map((item) =>
        typeof item === "string"
          ? item
          : `${item.label}:${item.value}`
      )
      .join("|");

  return [
    section.title || "",
    section.content || "",
    itemText,
  ]
    .join("|")
    .toLowerCase()
    .replace(
      /[^a-z0-9₹]+/g,
      " "
    )
    .trim()
    .slice(0, 220);
}


function isDenseResearchFinancialSection(
  section: EmailSection
): boolean {
  const title =
    String(
      section.title || ""
    ).toLowerCase();

  const titleLooksFinancial =
    [
      "financial",
      "results show",
      "key numbers",
      "key figures",
      "earnings",
      "reported",
      "selected result details",
      "result details",
      "results",
      "quarterly result",
    ].some(
      (term) =>
        title.includes(term)
    );

  const items =
    (section.items || []).filter(
      (item): item is string =>
        typeof item === "string"
    );

  const financialSignalCount =
    items.filter((item) =>
      /\b(?:EPS|earnings per share|PAT|profit after tax|PBT|profit before tax|EBIT|P\/E|price[- ]to[- ]earnings|YoY|QoQ|Q[1-4]FY\d{2}|FY\d{2})\b/i.test(
        item
      )
    ).length;

  return (
    titleLooksFinancial &&
    financialSignalCount >= 2
  );
}


function expandResearchMetricName(
  value: string
): string {
  return value
    .replace(
      /\bAdjusted\s+PAT\b/gi,
      "Adjusted Profit After Tax"
    )
    .replace(
      /\bPAT\b/g,
      "Profit After Tax"
    )
    .replace(
      /\bPBT\b/g,
      "Profit Before Tax"
    )
    .replace(
      /\bEBIT\b/g,
      "Earnings Before Interest and Tax"
    )
    .replace(
      /\bEPS\b/g,
      "Earnings Per Share"
    )
    .replace(
      /\bP\/E\s*ratio\b/gi,
      "Price-to-Earnings Ratio"
    )
    .replace(
      /\bYoY\b/g,
      "year-on-year"
    )
    .replace(
      /\bQoQ\b/g,
      "quarter-on-quarter"
    )
    .replace(
      /\(₹\s*crore\)/gi,
      ""
    )
    .replace(
      /\(₹\)/g,
      ""
    )
    .replace(
      /\s{2,}/g,
      " "
    )
    .trim();
}


function splitResearchMetricItem(
  value: string
): {
  metric: string;
  currentLabel: string;
  currentValue: string;
  comparisonLabel: string;
  comparisonValue: string;
  extra: string[];
} {
  const clean =
    normalizeCustomerSentence(
      expandResearchMetricName(
        cleanListItem(value)
      )
    );

  const firstPeriod =
    clean.search(
      /\b(?:Q[1-4]\s*FY\d{2}|Q[1-4]FY\d{2}|FY\d{2}[AE]?)\b/i
    );

  let metric =
    firstPeriod > 0
      ? clean
          .slice(0, firstPeriod)
          .replace(/[:\-–—,\s]+$/g, "")
          .trim()
      : "Financial update";

  const rest =
    firstPeriod > 0
      ? clean.slice(firstPeriod).trim()
      : clean;

  const periodValuePattern =
    /(Q[1-4]\s*FY\d{2}|Q[1-4]FY\d{2}|FY\d{2}[AE]?)\s*[:\-]?\s*₹?\s*([0-9][0-9,]*(?:\.\d+)?)/gi;

  const matches =
    [...rest.matchAll(periodValuePattern)];

  const currentLabel =
    matches[0]?.[1]
      ? formatPeriodLabel(matches[0][1])
      : "";

  const currentValue =
    matches[0]?.[2] || "";

  const comparisonLabel =
    matches[1]?.[1]
      ? formatPeriodLabel(matches[1][1])
      : "";

  const comparisonValue =
    matches[1]?.[2] || "";

  let extraText = rest;

  for (const match of matches) {
    extraText =
      extraText.replace(
        match[0],
        ""
      );
  }

  const extra =
    extraText
      .replace(/[()]/g, "")
      .split(/[;|]/)
      .map((item) =>
        item
          .replace(/^[\s,.:–—-]+/, "")
          .replace(/[\s,.:–—-]+$/, "")
          .trim()
      )
      .filter(
        (item) =>
          item &&
          !/^versus$/i.test(item)
      );

  return {
    metric:
      normalizeCustomerSentence(metric),
    currentLabel,
    currentValue,
    comparisonLabel,
    comparisonValue,
    extra,
  };
}


function renderReadableResearchFinancialSection(
  section: EmailSection,
  title: string
): string {
  const items =
    (section.items || []).filter(
      (item): item is string =>
        typeof item === "string"
    );

  const rows =
    items
      .map((item, index) => {
        const parsed =
          splitResearchMetricItem(item);

        const accent =
          index % 3 === 0
            ? BRAND.navy
            : index % 3 === 1
              ? BRAND.teal
              : "#8A6A12";

        const bg =
          index % 3 === 0
            ? BRAND.blueSoft
            : index % 3 === 1
              ? "#F3FBFA"
              : BRAND.amberSoft;

        const valuePrefix =
          /earnings per share/i.test(
            parsed.metric
          )
            ? "₹"
            : /(profit after tax|profit before tax|earnings before interest and tax|sales|revenue)/i.test(
                parsed.metric
              )
              ? "₹"
              : "";

        const valueSuffix =
          /(profit after tax|profit before tax|earnings before interest and tax|sales|revenue)/i.test(
            parsed.metric
          )
            ? " crore"
            : "";

        const extraHtml =
          parsed.extra.length
            ? `
              <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
                ${escapeHtml(
                  parsed.extra.join(" • ")
                )}
              </div>`
            : "";

        return `
          <tr>
            <td style="padding:0 0 12px 0;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  background:${bg};
                  border:1px solid ${BRAND.border};
                  border-left:4px solid ${accent};
                  border-radius:10px;
                "
              >
                <tr>
                  <td style="padding:14px 16px;">
                    <div
                      style="
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:14px;
                        line-height:20px;
                        font-weight:700;
                        color:${BRAND.text};
                        margin-bottom:10px;
                      "
                    >
                      ${escapeHtml(parsed.metric)}
                    </div>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        ${
                          parsed.currentLabel &&
                          parsed.currentValue
                            ? `
                              <td
                                valign="top"
                                style="
                                  padding:0 24px 0 0;
                                "
                              >
                                <div
                                  style="
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:10px;
                                    line-height:14px;
                                    text-transform:uppercase;
                                    letter-spacing:.04em;
                                    color:${BRAND.muted};
                                  "
                                >
                                  ${escapeHtml(parsed.currentLabel)}
                                </div>

                                <div
                                  style="
                                    margin-top:3px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:18px;
                                    line-height:23px;
                                    font-weight:800;
                                    color:${accent};
                                  "
                                >
                                  ${valuePrefix}${escapeHtml(parsed.currentValue)}${valueSuffix}
                                </div>
                              </td>
                            `
                            : ""
                        }

                        ${
                          parsed.comparisonLabel &&
                          parsed.comparisonValue
                            ? `
                              <td
                                valign="top"
                                style="
                                  padding-left:20px;
                                  border-left:1px solid ${BRAND.blueBorder};
                                "
                              >
                                <div
                                  style="
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:10px;
                                    line-height:14px;
                                    text-transform:uppercase;
                                    letter-spacing:.04em;
                                    color:${BRAND.muted};
                                  "
                                >
                                  ${escapeHtml(parsed.comparisonLabel)}
                                </div>

                                <div
                                  style="
                                    margin-top:3px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:15px;
                                    line-height:21px;
                                    font-weight:700;
                                    color:${BRAND.text};
                                  "
                                >
                                  ${valuePrefix}${escapeHtml(parsed.comparisonValue)}${valueSuffix}
                                </div>
                              </td>
                            `
                            : ""
                        }
                      </tr>
                    </table>

                    ${extraHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join("");

  return `
    <tr>
      <td style="padding:4px 32px 24px 32px;">
        <div
          style="
            font-family:Arial,Helvetica,sans-serif;
            font-size:16px;
            line-height:22px;
            font-weight:700;
            color:${BRAND.navy};
            margin:0 0 12px 0;
          "
        >
          ${escapeHtml(
            normalizeClientHeading(
              title ||
                "Key financial highlights"
            )
          )}
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="width:100%;"
        >
          ${rows}
        </table>
      </td>
    </tr>`;
}


function renderSection(
  section: EmailSection
): string {
  const readableSectionTitle =
    normalizeClientHeading(
      getReadableSectionTitle(
        section.title || ""
      )
    );

  const title = readableSectionTitle
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;font-weight:700;color:${BRAND.text};margin:0 0 10px 0;">${escapeHtml(readableSectionTitle)}</div>`
    : "";

  if (
    readableSectionTitle
      .toLowerCase() ===
      "company at a glance"
  ) {
    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:100%;
              background:#F8FAFB;
              border:1px solid ${BRAND.border};
              border-radius:10px;
            "
          >
            <tr>
              <td style="padding:18px 20px;">
                ${title}
                <div
                  style="
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    line-height:23px;
                    color:${BRAND.text};
                  "
                >
                  ${escapeHtml(
                    cleanClientFacingText(
                      section.content || ""
                    )
                  )}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

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
    section.type === "bullets" &&
    isDenseResearchFinancialSection(
      section
    )
  ) {
    return renderReadableResearchFinancialSection(
      section,
      readableSectionTitle ||
        "Key financial highlights"
    );
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
    const isTopLineSummary =
      (section.title || "")
        .toLowerCase()
        .includes("top-line");

    return `
      <tr>
        <td style="padding:4px 32px 24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.blueSoft};border-left:4px solid ${BRAND.navy};">
            <tr>
              <td style="padding:18px 20px;">
                ${title}
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.text};">
                  ${
                    isTopLineSummary
                      ? renderResearchSummaryContent(
                          section.content || ""
                        )
                      : escapeHtml(
                          normalizeResearchInlineText(
                            section.content || ""
                          )
                        )
                  }
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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.slateSoft};border:1px solid ${BRAND.blueBorder};">
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


function renderResearchSummaryContent(
  value: string
): string {
  const normalized =
    normalizeResearchInlineText(
      value
    );

  const match =
    normalized.match(
      /\b(BUY|SELL|HOLD|ACCUMULATE|REDUCE)\b/i
    );

  if (!match) {
    return escapeHtml(
      normalized
    );
  }

  const recommendation =
    match[1].toUpperCase();

  const style =
    getRecommendationStyle(
      recommendation
    );

  const before =
    normalized.slice(
      0,
      match.index
    );

  const after =
    normalized.slice(
      (match.index || 0) +
        match[0].length
    );

  return `
    ${escapeHtml(before)}
    <span
      style="
        display:inline-block;
        background:${style.background};
        border:1px solid ${style.border};
        border-radius:999px;
        padding:2px 10px;
        margin:0 3px;
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:18px;
        font-weight:800;
        color:${style.color};
      "
    >
      ${escapeHtml(recommendation)}
    </span>
    ${escapeHtml(after)}
  `;
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


function getRecommendationStyle(
  recommendation: string
): {
  background: string;
  border: string;
  color: string;
} {
  const value =
    recommendation
      .trim()
      .toLowerCase();

  if (
    value === "buy" ||
    value === "accumulate"
  ) {
    return {
      background: BRAND.teal,
      border: BRAND.teal,
      color: "#FFFFFF",
    };
  }

  if (
    value === "sell" ||
    value === "reduce"
  ) {
    return {
      background: "#C0392B",
      border: "#C0392B",
      color: "#FFFFFF",
    };
  }

  if (value === "hold") {
    return {
      background: BRAND.amber,
      border: BRAND.amber,
      color: "#5C4300",
    };
  }

  return {
    background: BRAND.darkTeal,
    border: BRAND.darkTeal,
    color: "#FFFFFF",
  };
}


function parseResearchHero(
  hero:
    | {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
      }
    | undefined,
  body:
    | {
        intro?: string;
        sections?: EmailSection[];
        closing?: string;
      }
    | undefined
): {
  companyTitle: string;
  recommendation: string;
  targetPrice: string;
  cmp: string;
  asOnDate: string;
  timeHorizon: string;
  valuationMethod: string;
  secondaryText: string;
} {
  const heroTitle =
    hero?.title || "";

  const heroSubtitle =
    hero?.subtitle || "";

  const sectionText =
    (body?.sections || [])
      .map((section) => {
        const items =
          (section.items || [])
            .map((item) =>
              typeof item === "string"
                ? item
                : `${item.label}: ${item.value}`
            )
            .join(" | ");

        return [
          section.title || "",
          section.content || "",
          items,
        ]
          .filter(Boolean)
          .join(" | ");
      })
      .join(" | ");

  const allText = [
    heroTitle,
    heroSubtitle,
    body?.intro || "",
    sectionText,
    body?.closing || "",
  ]
    .filter(Boolean)
    .join(" | ");

  const recommendationMatch =
    allText.match(
      /(?:recommendation\s*[:\-]?\s*)?\b(BUY|SELL|HOLD|ACCUMULATE|REDUCE)\b/i
    );

  const targetMatch =
    allText.match(
      /(?:target(?:\s*price)?|tp)\s*[:₹Rs.\s-]*([0-9][0-9,]*(?:\.\d+)?)/i
    );

  const cmpMatch =
    allText.match(
      /(?:current\s*market\s*price(?:\s*\(cmp\))?|cmp)\s*[:₹Rs.\s-]*([0-9][0-9,]*(?:\.\d+)?)/i
    );

  const dateMatch =
    allText.match(
      /(?:as\s*on|as\s*of)\s*[:\-]?\s*([0-9]{1,2}[\/.\-][0-9]{1,2}[\/.\-][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})/i
    );

  const horizonMatch =
    allText.match(
      /(?:time\s*horizon\s*[:\-]?\s*)?(\d+\s*[- ]?\s*(?:month|months|year|years))/i
    );

  const valuationMatch =
    allText.match(
      /(?:valuation(?:\s*method)?\s*[:\-]?\s*)?((?:SOTP(?:[- ]based)?(?:\s+valuation|\s+approach)?|DCF(?:[- ]based)?(?:\s+valuation|\s+approach)?|sum[- ]of[- ]the[- ]parts(?:\s+valuation)?))\b/i
    );

  let companyTitle =
    heroTitle
      .replace(
        /\s*[—–-]\s*(BUY|SELL|HOLD|ACCUMULATE|REDUCE)\b.*$/i,
        ""
      )
      .replace(
        /\s*\((?:Target|TP).*?\)\s*$/i,
        ""
      )
      .trim();

  if (!companyTitle) {
    companyTitle =
      heroTitle || "Research Update";
  }

  let secondaryText =
    heroSubtitle
      .replace(
        /\brecommendation\s*[:\-]?\s*(BUY|SELL|HOLD|ACCUMULATE|REDUCE)\b/gi,
        ""
      )
      .replace(
        /\b(BUY|SELL|HOLD|ACCUMULATE|REDUCE)\b/gi,
        ""
      )
      .replace(
        /(?:target(?:\s*price)?|tp)\s*[:₹Rs.\s-]*[0-9][0-9,]*(?:\.\d+)?/gi,
        ""
      )
      .replace(
        /(?:current\s*market\s*price(?:\s*\(cmp\))?|cmp)\s*[:₹Rs.\s-]*[0-9][0-9,]*(?:\.\d+)?/gi,
        ""
      )
      .replace(
        /(?:time\s*horizon\s*[:\-]?\s*)?\d+\s*[- ]?\s*(?:month|months|year|years)/gi,
        ""
      )
      .replace(
        /\b(?:time\s*)?horizon\b\s*[:\-]?/gi,
        ""
      )
      .replace(
        /\|\s*\|/g,
        "|"
      )
      .replace(
        /^\s*\|\s*|\s*\|\s*$/g,
        ""
      )
      .replace(
        /^\s*[-–—|,:;]+|[-–—|,:;]+\s*$/g,
        ""
      )
      .trim();

  return {
    companyTitle,
    recommendation:
      recommendationMatch
        ? recommendationMatch[1].toUpperCase()
        : "",
    targetPrice:
      targetMatch
        ? targetMatch[1]
        : "",
    cmp:
      cmpMatch
        ? cmpMatch[1]
        : "",
    asOnDate:
      dateMatch
        ? dateMatch[1]
        : "",
    timeHorizon:
      horizonMatch
        ? horizonMatch[1]
            .replace(/\s+/g, " ")
            .replace(/(\d+)\s+(month|months|year|years)/i, "$1 $2")
        : "",
    valuationMethod:
      valuationMatch
        ? valuationMatch[1]
            .trim()
            .replace(/\s+/g, " ")
        : "",
    secondaryText,
  };
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
      return "Fundamental Research";
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
