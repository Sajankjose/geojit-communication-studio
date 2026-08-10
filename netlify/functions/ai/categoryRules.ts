export type CommunicationCategory =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

export const CATEGORY_RULES: Record<
  CommunicationCategory,
  string
> = {
  research: `
CATEGORY: RESEARCH & ADVISORY

Purpose:
Transform verified research inputs into a concise, structured research communication.

Tone:
- analytical
- evidence-led
- restrained
- professional
- clear
- non-promotional

Required factual discipline:
Treat the following as locked if supplied:
- security/company name
- recommendation
- current price / CMP
- target price
- upside
- time horizon
- report date
- analyst/source
- rationale
- risks
- report URL

Never:
- invent a recommendation
- invent CMP
- invent a target price
- calculate or infer upside unless the application explicitly supplies it
- strengthen "Accumulate" into "Buy"
- weaken "Sell" into neutral language
- convert a research view into guaranteed-return language
- imply certainty about future price movement

Preferred structure:
1. Research context / hero
2. Recommendation snapshot
3. Key rationale
4. Risks / watch-outs
5. CTA to full report if URL exists
6. Research disclaimer family

Recommended section types:
- snapshot
- bullets
- text
- note

Variant behavior:
A — Clarity First
- compact
- factual
- strongest snapshot hierarchy

B — Balanced
- adds concise context around the recommendation
- still strongly analytical

C — Reader Context
- slightly more explanatory
- may frame "what investors should know"
- must remain non-promotional

CTA:
Prefer one CTA:
- Read Full Report
- View Research Report
- Read Detailed Report

If no valid report URL exists:
- do not invent a URL
- CTA may be disabled
- add MISSING_CTA_URL warning if CTA is materially expected

Disclaimer:
disclaimer.required should normally be true.
disclaimer.type should normally be "research".

Compliance flags to consider:
- MISSING_RESEARCH_TARGET
- MISSING_RESEARCH_RECOMMENDATION
- MISSING_RESEARCH_RISK
- MISSING_CTA_URL
- CONFLICTING_FACTS
- UNSUPPORTED_CLAIM
`,

  education: `
CATEGORY: INVESTOR EDUCATION

Purpose:
Explain an investing, market, product, or trading concept in simple and useful language.

Tone:
- clear
- approachable
- educational
- neutral
- encouraging without being promotional

Primary objective:
Help the reader understand a concept better.

Writing principles:
- simplify jargon
- explain unfamiliar terms where needed
- use examples only when supported by source information
- avoid oversimplification that changes meaning
- do not turn education into product promotion unless explicitly requested
- do not create investment recommendations

Preferred structure:
1. Topic / learning context
2. Simple explanation
3. Key concepts or takeaways
4. Example / practical relevance if source supports it
5. Next step / learning CTA if supplied

Recommended section types:
- text
- bullets
- steps
- highlight
- note

Variant behavior:
A — Clarity First
- very simple
- concise
- strong scanability

B — Explained
- adds context and explanation
- useful for novice readers

C — Practical Learning
- more action-oriented
- "what this means for you" framing
- must not become financial advice

CTA:
Examples:
- Learn More
- Read the Guide
- Explore the Topic
- Watch the Video

Do not invent URLs.

Disclaimer:
Use "standard" or "none" depending on source context.
Do not invent legal wording.

Compliance flags to consider:
- UNSUPPORTED_CLAIM
- MISSING_CTA_URL
- OVERLY_PROMOTIONAL_EDUCATION
`,

  product: `
CATEGORY: PRODUCT & SALES

Purpose:
Communicate a verified product, feature, launch, pricing update, or offer clearly and persuasively without exaggeration.

Tone:
- benefit-led
- confident
- professional
- clear
- responsible
- customer-focused

Locked facts if supplied:
- product name
- feature names
- availability
- launch date
- pricing
- offer validity
- eligibility
- product capability
- conditions
- URLs

Never:
- invent product features
- claim "best", "fastest", "lowest", "guaranteed" unless explicitly supported
- invent pricing
- invent eligibility
- invent offer dates
- invent savings or performance claims
- create urgency not present in the source

Preferred structure:
1. Product / feature announcement
2. Primary customer benefit
3. Feature highlights
4. Who it is for / applicability
5. Pricing or offer details if supplied
6. CTA

Recommended section types:
- highlight
- bullets
- snapshot
- text
- note

Variant behavior:
A — Clarity First
- direct product explanation
- strongest factual hierarchy

B — Balanced
- combines features and customer benefit

C — Benefit Led
- more reader-oriented
- may lead with the strongest supported benefit
- must not add unsupported promotional claims

CTA:
Prefer one primary CTA.
Examples:
- Explore Features
- Know More
- Get Started
- View Details

CTA URL must come from supplied source.

Disclaimer:
Use "promotional", "standard", or "none" depending on context.

Compliance flags to consider:
- UNSUPPORTED_CLAIM
- MISSING_CTA_URL
- MISSING_OFFER_VALIDITY
- MISSING_PRICING_DETAILS
- EXAGGERATED_PRODUCT_CLAIM
`,

  service: `
CATEGORY: SERVICE & TRANSACTIONAL

Purpose:
Inform customers about service updates, maintenance, account notifications, transaction-related information, or operational changes.

Tone:
- direct
- calm
- factual
- concise
- reassuring where appropriate
- action-oriented when required

Locked facts if supplied:
- effective date/time
- duration
- affected service
- affected users
- action required
- maintenance window
- transaction/account detail
- support information

Never:
- invent timelines
- invent outage duration
- understate impact
- create urgency unless the source requires it
- use promotional language

Preferred structure:
1. What is changing / happening
2. Who is affected
3. When it happens
4. Customer impact
5. Action required
6. Support / next step

Recommended section types:
- text
- snapshot
- steps
- timeline
- note

Variant behavior:
A — Direct Service Update
- concise
- operational

B — Explained Service Update
- adds a little context and reassurance

C — Action Focused
- puts required customer action first when relevant

CTA:
Only if useful.
Examples:
- View Details
- Review the Update
- Contact Support

Do not fabricate support links.

Disclaimer:
Usually "service" or "none".

Compliance flags to consider:
- MISSING_EFFECTIVE_DATE
- MISSING_DURATION
- MISSING_REQUIRED_ACTION
- CONFLICTING_FACTS
`,

  regulatory: `
CATEGORY: REGULATORY & COMPLIANCE

Purpose:
Communicate regulatory, policy, circular, compliance, or mandatory requirement information accurately and clearly.

Tone:
- formal
- precise
- neutral
- direct
- non-promotional
- action-focused

This is a high-sensitivity category.

Locked facts if supplied:
- regulatory authority
- circular/reference number
- circular title
- effective date
- deadline
- affected customers
- affected products/services
- required action
- regulatory source/link

Never:
- reinterpret regulation beyond supplied information
- soften mandatory requirements
- invent deadlines
- invent authority names
- invent circular numbers
- invent affected scope
- add promotional content
- create urgency beyond the actual regulatory requirement

If critical regulatory information is missing:
Use compliance.status "warning" or "fail" depending on severity.

Preferred structure:
1. Regulatory context
2. What has changed
3. Who is affected
4. Effective date / deadline
5. Required action
6. Reference / official details

Recommended section types:
- snapshot
- text
- bullets
- steps
- timeline
- note

Variant behavior:
RETURN EXACTLY 2 VARIANTS.

A — Direct Regulatory
- formal
- concise
- strongest factual hierarchy

B — Plain Language Regulatory
- same legal meaning
- simpler explanatory language
- no reduction in regulatory precision

DO NOT RETURN VARIANT C.

CTA:
Use only if an official or supplied destination exists.
Examples:
- View Circular
- Review Details
- Read the Update

Do not invent URLs.

Disclaimer:
Use "regulatory" where appropriate.
Do not invent disclaimer wording.

Compliance flags to consider:
- MISSING_REGULATORY_AUTHORITY
- MISSING_REGULATORY_REFERENCE
- MISSING_REGULATORY_DEADLINE
- MISSING_REQUIRED_ACTION
- CONFLICTING_FACTS
- REGULATORY_MEANING_RISK
`,

  onboarding: `
CATEGORY: ONBOARDING & JOURNEY

Purpose:
Guide a new or progressing customer through the next step in their Geojit journey.

Tone:
- welcoming
- clear
- supportive
- encouraging
- professional
- action-oriented

Primary objective:
Help the user understand what to do next and why it matters.

Locked facts if supplied:
- journey stage
- required action
- account status
- eligibility
- product/service access
- links
- deadlines
- support details

Never:
- invent completed milestones
- invent eligibility
- assume activation/account status
- invent rewards or benefits
- create urgency unless supported

Preferred structure:
1. Welcome / stage context
2. What has been completed
3. What to do next
4. Benefits/resources available
5. CTA

Recommended section types:
- text
- steps
- highlight
- bullets
- note

Variant behavior:
A — Clarity First
- direct next-step guidance

B — Supportive
- slightly warmer and more reassuring

C — Journey Led
- frames the message around progress and next milestone

CTA:
Prefer one clear next-step CTA.
Examples:
- Complete Setup
- Continue Onboarding
- Explore the App
- Get Started

Use only supplied URLs.

Disclaimer:
Usually "standard" or "none".

Compliance flags to consider:
- MISSING_NEXT_STEP
- MISSING_CTA_URL
- UNSUPPORTED_BENEFIT
`,
};

export function getCategoryRules(
  category: CommunicationCategory
): string {
  return CATEGORY_RULES[category];
}
