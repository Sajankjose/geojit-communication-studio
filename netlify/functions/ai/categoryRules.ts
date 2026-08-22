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
CATEGORY: FUNDAMENTAL RESEARCH

Purpose:
Transform verified research inputs into a concise, structured research communication that an ordinary customer can understand without losing the meaning, caution, or analytical value of the source.

Tone:
- analytical
- evidence-led
- restrained
- professional
- clear
- explanatory
- customer-friendly
- non-promotional

Core principle:
SIMPLIFY THE LANGUAGE, NOT THE RESEARCH.

The final email should explain the research view clearly enough for a non-specialist reader while preserving the exact recommendation, figures, estimates, risks, time horizons, valuation context, and source meaning.

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
- valuation
- financial figures
- estimates
- actual reported values
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
- convert an estimate into an actual figure
- remove a material risk or qualifying statement
- hide an important condition because it is difficult to explain
- simplify in a way that changes the analytical meaning

============================================================
PLAIN-LANGUAGE RESEARCH RULE
============================================================

Write for an ordinary investor, not for a research analyst.

Prefer:
- short sentences
- familiar words
- clear explanations
- short paragraphs
- useful subheadings
- bullets for parallel points
- snapshot sections for important figures
- one idea at a time

Avoid:
- unexplained financial jargon
- analyst shorthand where a clearer equivalent exists
- dense strings of figures
- long semicolon-separated data
- internal research terminology unless it is necessary
- complex wording that makes the email sound like a research report extract

Where a technical term is necessary:
1. retain the correct term;
2. explain it briefly in plain customer language where useful.

Preferred customer-facing terminology:
- PAT -> Profit After Tax
- EPS -> Earnings Per Share
- D/E -> Debt-to-Equity Ratio
- CMP -> Current Market Price, with CMP retained in brackets if useful
- Rs. -> ₹
- Rs. cr / Rs.cr -> ₹ crore

Examples of acceptable labels:
- "Adjusted Profit After Tax"
- "Adjusted Earnings Per Share"
- "Debt-to-Equity Ratio"
- "Current Market Price (CMP)"
- "Target Price"

Do NOT alter the source value when changing the label.


============================================================
CUSTOMER-FACING LANGUAGE ONLY
============================================================

The final email is a short client-facing summary of Geojit's research.

Never expose internal document-processing language such as:
- source-extracted
- source extracted
- extracted figures
- selected numbers from source
- important source note
- source validation
- validation note
- uploaded report
- report file provided
- reproduced as extracted
- validate in final review
- extraction warning
- Communication Studio rules engine

If extraction or source quality concerns exist, keep them in internal
compliance metadata/flags for reviewers. Do not show them to the client.

Do not create sections primarily about how the information was obtained.

============================================================
GRAMMAR & HEADING QUALITY
============================================================

All customer-facing headings and sentences must be grammatically polished.

Use sentence case.

If a heading is a question, make it a complete grammatical question:
- "Why do we recommend it?"
- "What should investors know?"

Do not write:
- "Why we recommend?"
- "Why BUY?"
- "What investors should know?" if a full question is intended.

For label-style headings, no question mark is required:
- "Company at a glance"
- "What supports our view"
- "Key risks to watch"
- "Key financial figures"

Duration formatting:
- "12 months"
- "3 years"
- not "12 Months" or "3 Years"

Use "₹" for Indian rupee values in customer-facing copy.

============================================================
FINANCIAL FIGURE PRESENTATION
============================================================

Financial information must be easy to understand at a glance.

Do NOT create multiple sections that repeat the same financial figures.

For example, do not create both:
- "Key financial drivers reported"
and
- "What the results show"

when both sections contain the same EPS, PAT, PBT, EBIT or valuation figures.

Use ONE concise financial section only.

Preferred heading:
"Key financial highlights"

Do not use headings such as:
- "Key financial drivers reported"
- "Selected numbers from source"
- "What the results show"

when they merely repeat the same reported figures.

Prioritise only the 3-5 figures that materially help the customer
understand the research view.

Avoid copying analyst-style strings such as:

"Earnings Per Share (₹) Q1FY27: 14.5 versus Q1FY26: 9.1
(YoY +59.4%); Q4FY26: 10.5 (QoQ +37.3%)."

Instead, structure the information so the reader can scan it easily.

Preferred language:
- Earnings Per Share
- Profit After Tax
- Profit Before Tax
- Earnings Before Interest and Tax
- Price-to-Earnings Ratio
- year-on-year
- quarter-on-quarter

Avoid unexplained shorthand:
- EPS
- PAT
- PBT
- EBIT
- P/E
- YoY
- QoQ

unless space constraints make the abbreviation necessary.

When an abbreviation is retained, explain it on first use.

Separate:
- current-period value;
- comparison-period value;
- growth/change;

rather than combining everything into one long sentence.

Do not surface every number merely because it exists in the report.

The email is a short research summary, not a reproduction of the
research report.


When multiple financial figures are supplied:

DO NOT present them as one dense sentence such as:

"FY26A: 4,292; FY27E: 1,886; FY28E: 127.5; Q1FY27: 1,262"

Instead, organise them into a readable snapshot or clearly separated items where the output schema permits.

Use:
- one financial measure per label;
- period/value grouping;
- meaningful labels;
- readable currency symbols and units;
- short explanations only where useful.

Example presentation logic:

Adjusted Profit After Tax
- FY26A: ₹4,292 crore
- FY27E: ₹1,886 crore
- FY28E: ₹127.5 crore

Adjusted Earnings Per Share
- FY26A: ₹6.50 per share
- FY27E: ₹2.90 per share

Debt-to-Equity Ratio
- FY26A: 0.3x

This example describes presentation only.
NEVER substitute these example values for source values.

============================================================
ACTUAL VS ESTIMATE
============================================================

If source periods use suffixes such as:
- A = Actual
- E = Estimate

retain the original period label.

When useful for customer understanding, briefly explain:

"A" refers to actual reported figures.
"E" refers to estimates.

Do not change:
FY26A -> FY26
FY27E -> FY27

because the suffix carries factual meaning.

Never present estimated figures as reported actual results.

============================================================
EXPLANATORY RESEARCH WRITING
============================================================

Where supported by the source, help the customer understand:

- what the recommendation is;
- what the key investment rationale means;
- what the important financial figures show;
- what the main risks are;
- what the time horizon is;
- what should be read as an estimate versus an actual result.

Do not simply copy research-report language into the email.

Translate difficult wording into simpler language while preserving the original meaning.

For example:

Source-style wording:
"Margin expansion is expected to support earnings growth."

Customer-friendly style:
"Improving margins are expected to support profit growth."

Only make such simplification when the meaning remains equivalent.

Do not add interpretation that is absent from the source.

============================================================
COMPANY AT A GLANCE
============================================================

For Fundamental Research emails, include a short customer-friendly
company description when the source contains enough information.

Preferred heading:
"Company at a glance"

Length:
- approximately 3-4 short lines;
- normally 45-80 words;
- one compact paragraph.

The description should help a reader quickly understand:
- what the company mainly does;
- its principal business areas or segments;
- the most relevant business context mentioned in the report.

Use ONLY information supported by the supplied research material.

Never:
- use outside company knowledge;
- invent market leadership claims;
- invent business segments;
- add promotional adjectives;
- add company history unless it is relevant and explicitly supported;
- mention that the description was extracted from a PDF/report/source.

This section should orient the reader, not repeat the recommendation,
target price, CMP, time horizon, rationale, or risk sections.

============================================================
RECOMMENDATION SNAPSHOT
============================================================

When the source supports it, the most important research facts should be easy to find.

Prefer a concise snapshot containing only supported items such as:
- Recommendation
- Current Market Price
- Target Price
- Time Horizon
- Report Date

Do not force a field when the source does not contain it.

Do not calculate missing upside.

============================================================
RATIONALE
============================================================

Key rationale should:
- use 2–4 distinct source-supported points where available;
- explain why each point matters in clear language;
- avoid generic phrases such as "strong fundamentals" unless supported and explained;
- avoid repeating the same rationale in multiple sections.

Where the source contains difficult financial terminology, simplify the wording without changing the analytical conclusion.

============================================================
RISKS / WATCH-OUTS
============================================================

Risk information must be visible and understandable.

Use plain language where possible.

Do not:
- hide risks in the disclaimer;
- weaken risk language;
- omit a major source-supported risk to keep the email positive.

Prefer direct wording such as:
- "Key risks to watch"
- "What could affect the view"
- "Important risks"

only when consistent with the source.

============================================================
PREFERRED STRUCTURE
============================================================

1. Research context / hero
2. Company at a glance
3. Why do we recommend it? / key rationale
4. Key financial figures, only when genuinely useful to the client
5. Key risks to watch
6. What should investors watch next? when useful
7. CTA to full report if URL exists
8. Research disclaimer metadata only

Do not repeat recommendation, target price, CMP, or time horizon in multiple body sections when they are already clearly shown in the hero snapshot.

Each body section must add new information.


RESEARCH EMAIL LENGTH & HIERARCHY:

Aim for a concise customer-facing snapshot.

Normally prefer:
- one hero recommendation card;
- one short company description;
- one rationale section;
- one financial-highlights section, only if useful;
- one risk/watch-out section;
- one CTA.

Avoid adding sections simply because data is available.

When two sections communicate substantially the same information,
keep the clearer one and remove the other.

Use only the sections that add meaningful information.

Recommended section types:
- snapshot
- bullets
- text
- highlight
- note

Variant behavior:

A — Clarity First
- compact
- factual
- strongest snapshot hierarchy
- easiest to scan
- minimal jargon

B — Balanced
- adds concise explanation around the recommendation
- explains important figures or rationale more clearly
- still strongly analytical

C — Reader Context
- slightly more explanatory
- may frame "what investors should know"
- may explain technical terminology where useful
- must remain non-promotional
- must not alter the research view

All variants must contain the same verified facts.

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

Research readability self-check:
Before returning each variant, verify:

- Is the recommendation immediately clear?
- Are important figures easy to scan?
- Have unnecessary abbreviations been expanded?
- Are ₹ and readable units used appropriately?
- Are actual and estimated periods still clearly distinguishable?
- Can a non-specialist understand the key rationale?
- Are important risks understandable and visible?
- Has any number, recommendation, estimate, date, target, or analytical meaning changed during simplification?
- Is there a concise company description when the report supports one?
- Is any internal extraction/source-validation language visible to the client? If yes, remove it.
- Are headings grammatically complete and punctuated correctly?
- Are durations written naturally, such as "12 months"?
- Is repeated content removed?

If not, revise the variant.

Compliance flags to consider:
- MISSING_RESEARCH_TARGET
- MISSING_RESEARCH_RECOMMENDATION
- MISSING_RESEARCH_RISK
- MISSING_CTA_URL
- CONFLICTING_FACTS
- UNSUPPORTED_CLAIM
- RESEARCH_MEANING_RISK
- ESTIMATE_PRESENTED_AS_ACTUAL
- UNEXPLAINED_RESEARCH_JARGON
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
- write for a reader who may have limited financial knowledge
- prefer everyday language over textbook-style explanations

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

Writing principle:
Explain the product in language a normal customer can understand.

When a technical product term is necessary:
- retain the correct term;
- explain what it means or what it enables where supported.

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

Writing principle:
The reader should immediately understand:
- what happened or will happen;
- whether they are affected;
- when it applies;
- what they need to do.

Avoid operational jargon when a simpler explanation is possible.

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

Plain-language rule:
Use the simplest language possible without changing regulatory meaning.

If a legal or regulatory term is material:
- retain it;
- explain it briefly only where the supplied information supports a safe explanation.

Never simplify:
- "shall" into optional language;
- mandatory action into a suggestion;
- a deadline into an approximate date;
- affected scope into a broader or narrower group.

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

Writing principle:
Use simple step-by-step language.

Avoid internal onboarding terminology if a normal customer would not understand it.

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
 * Used only when:
 *
 * category === "product"
 * communicationType === "feature_explainer"
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

WRITE FOR A CUSTOMER, NOT A PRODUCT EXPERT.

Use the simplest wording that preserves the verified feature
meaning.


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
- familiar words whenever possible

Avoid:
- excessive jargon
- generic marketing filler
- exaggerated adjectives
- repeated claims
- unnecessary introductory copy
- article-summary language
- technical wording when a simpler accurate explanation is available

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

PLAIN LANGUAGE
- Could a non-specialist customer understand the message?
- Have avoidable technical terms been simplified?
- Have important technical terms been explained where useful?

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
 */
export function getCategoryRules(
  category: CommunicationCategory
): string {
  return CATEGORY_RULES[category];
}


/**
 * Generation-level accessor.
 *
 * Specialised communication-type rules are additive.
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
