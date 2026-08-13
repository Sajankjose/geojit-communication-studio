export type CommunicationCategory =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

export type ProductCommunicationType =
  | "feature_explainer"
  | "product_launch"
  | "product_update"
  | "offer_plan"
  | "product_benefit"
  | "cross_sell_adoption";

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
A — Clity First
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


/**
 * ============================================================
 * PRODUCT FEATURE EXPLAINER
 * ============================================================
 *
 * This is intentionally separate from the generic Product &
 * Sales rules.
 *
 * It is used only when:
 *
 * category === "product"
 * communicationType === "feature_explainer"
 *
 * This prevents changes here from affecting Research or other
 * communication categories.
 */
export const PRODUCT_FEATURE_EXPLAINER_RULES = `
COMMUNICATION TYPE: PRODUCT FEATURE EXPLAINER

PRIMARY PURPOSE:

Create a complete, useful customer email that explains a
verified product/platform feature.

The recipient should understand the feature even if they
DO NOT click the CTA.

The supporting source is factual evidence for the email.
The supporting source is NOT the subject of the email.


============================================================
CORE CONTENT PRINCIPLE
============================================================

DO NOT create a teaser email.

DO NOT merely tell the recipient that more information is
available in an article, guide, page, PDF, video or link.

The email itself must communicate meaningful understanding.


============================================================
MANDATORY READER QUESTIONS
============================================================

Where supported by supplied facts, the email should answer:

1. What is this feature?

2. Why might this feature be useful to the customer?

3. What customer need, task or problem does it address?

4. How does the feature work?

5. What are the important capabilities or benefits?

6. What would a realistic use case look like?

7. How can the customer access or use the feature?

8. Are there important conditions, limitations, eligibility
   requirements, risks or operational points the customer
   should know?

9. What is the appropriate next action?


============================================================
FACTUAL DISCIPLINE
============================================================

Treat supplied feature facts as locked.

Never invent:

- feature behaviour
- platform functionality
- order behaviour
- execution behaviour
- product capability
- eligibility
- availability
- pricing
- charges
- savings
- limits
- dates
- conditions
- workflow steps
- app navigation
- risk controls
- regulatory implications

If information required for a section is not supplied:

- do not fabricate it
- omit the unsupported detail
- or use an appropriate compliance warning when the missing
  information materially affects the communication

Never infer technical functionality merely from the feature
name.


============================================================
FORBIDDEN CONTENT PATTERNS
============================================================

Do NOT write sections or sentences such as:

- "What to expect in the article"
- "Open the linked article"
- "Read the article to understand"
- "Read the full article to learn more"
- "Refer to the article for details"
- "This email is a concise pointer"
- "This email is a brief introduction"
- "The article explains..."
- "The linked page covers..."
- "Visit the page to understand how it works"

Do not make "reading the source" one of the steps in the
feature explanation.

The CTA may point to a supplied source URL, but the body
must stand on its own.


============================================================
PREFERRED EMAIL ARCHITECTURE
============================================================

Build a coherent customer journey rather than disconnected
generic sections.

Preferred order:

1. HERO / CONTEXT

Introduce the feature and its strongest supported customer
value.

Keep this concise.

The headline should normally communicate either:
- what the feature enables, or
- the customer problem it helps address.

Avoid empty promotional headlines.


2. WHY IT MATTERS

Briefly establish the customer situation, task or problem
that makes the feature relevant.

Do not manufacture a customer pain point if one is not
supported.


3. WHAT THE FEATURE IS

Explain the feature in simple customer language.

A reader unfamiliar with the feature should understand the
basic concept after reading this section.

Avoid merely repeating the feature name.


4. HOW IT WORKS

Explain the mechanism or workflow using supplied facts.

Use:
- concise text,
- bullets,
- or steps

depending on what best explains the feature.

Do not invent missing operational steps.


5. KEY BENEFITS / CAPABILITIES

Surface the strongest verified benefits.

Prefer 2–4 meaningful points.

Each point should explain customer value, not merely repeat
a feature label.

Avoid repeating the same benefit in different wording.


6. PRACTICAL EXAMPLE / USE CASE

Include a realistic example only when the supplied facts
support one.

The example should clarify the feature.

Do NOT invent:
- prices
- quantities
- returns
- execution outcomes
- savings
- market movements
- customer circumstances

unless these are explicitly supplied.

If a safe factual example cannot be created, omit this
section rather than fabricate one.


7. HOW TO ACCESS / USE

If supplied information explains where or how the customer
can use the feature, provide concise actionable guidance.

For example:
- platform
- menu/location
- eligibility
- activation
- workflow

Never invent app navigation or activation steps.


8. IMPORTANT TO KNOW

Where relevant, clearly surface:
- conditions
- limitations
- eligibility
- operational behaviour
- risks
- dependencies

Do not hide material conditions inside promotional copy.


9. CTA

Use one primary CTA.

The CTA should represent the natural next action.

Examples:
- Explore the Feature
- Try on Flip
- Know More
- View Details
- Get Started

Use ONLY a supplied URL.

Do not invent a destination.


============================================================
SECTION GUIDANCE
============================================================

Recommended section types:

- highlight
- text
- bullets
- steps
- snapshot
- note

Use the smallest number of sections needed to explain the
feature well.

Do not create sections simply to fill the template.

Every section must add new information.


============================================================
WRITING STYLE
============================================================

Write for a customer, not an internal product team.

Use:
- plain language
- short paragraphs
- meaningful subheads
- concrete benefits
- strong scanability
- active voice where appropriate

Avoid:
- excessive jargon
- generic marketing filler
- exaggerated adjectives
- repeated claims
- unnecessary introductory copy
- article-summary language

When technical terminology is necessary, explain it simply.


============================================================
VARIANT BEHAVIOUR
============================================================

RETURN EXACTLY 3 VARIANTS.

All three variants must contain the SAME verified facts.

They may differ in framing and hierarchy, not factual
content.


VARIANT A — CLARITY FIRST

Objective:
Make the feature immediately understandable.

Characteristics:
- direct headline
- concise explanation
- strongest information hierarchy
- highly scannable
- minimal promotional language


VARIANT B — BENEFIT + EXPLANATION

Objective:
Balance customer benefit with sufficient explanation.

Characteristics:
- may lead with the customer need
- explains what the feature does
- connects capability to customer value
- slightly richer context than A


VARIANT C — PRACTICAL USE

Objective:
Help the reader understand how the feature fits into a
real situation.

Characteristics:
- practical framing
- may foreground a supported use case
- stronger "how it works" emphasis
- remains factual and responsible


============================================================
QUALITY CONTRACT
============================================================

Before returning each variant, internally verify:

FEATURE UNDERSTANDING
- Can the reader explain what the feature is after reading
  the email?

CUSTOMER VALUE
- Is the main benefit clear and supported?

MECHANISM
- Does the email explain how it works where facts are
  available?

PRACTICALITY
- Is there useful application/access guidance where
  supplied?

FACTUAL SAFETY
- Is every specific capability supported by input?

NO TEASER BEHAVIOUR
- Does the email stand on its own without requiring the
  recipient to open another article?

NO REPETITION
- Does each section contribute distinct information?

CTA
- Is there one clear next action using a supplied URL?

If any answer fails:
revise the variant before returning it.


============================================================
COMPLIANCE FLAGS TO CONSIDER
============================================================

- UNSUPPORTED_CLAIM
- MISSING_CTA_URL
- MISSING_FEATURE_EXPLANATION
- MISSING_FEATURE_BENEFIT
- MISSING_HOW_IT_WORKS
- MISSING_USAGE_GUIDANCE
- MISSING_PRODUCT_CONDITION
- EXAGGERATED_PRODUCT_CLAIM
- ARTICLE_TEASER_CONTENT
- CONFLICTING_FACTS
`;


/**
 * Existing category-level accessor.
 *
 * Keep this because other parts of the application may
 * already use it.
 */
export function getCategoryRules(
  category: CommunicationCategory
): string {
  return CATEGORY_RULES[category];
}


/**
 * Generation-level accessor.
 *
 * generate-email.ts should use this instead of calling
 * getCategoryRules() directly.
 *
 * This keeps specialised communication types additive.
 */
export function getGenerationRules({
  category,
  communicationType,
}: {
  category: CommunicationCategory;
  communicationType?: string | null;
}): string {
  const baseRules =
    getCategoryRules(category);

  if (
    category === "product" &&
    communicationType ===
      "feature_explainer"
  ) {
    return `
${baseRules}

${PRODUCT_FEATURE_EXPLAINER_RULES}
`;
  }

  return baseRules;
}
