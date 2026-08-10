export type CommunicationCategory =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

export type SectionType =
  | "text"
  | "bullets"
  | "snapshot"
  | "highlight"
  | "steps"
  | "timeline"
  | "note";

export interface GenerationMeta {
  schema_version: string;
  generated_at: string;
  variant_count: number;
  source_type: string;
  language: string;
}

export interface CommunicationContext {
  category: CommunicationCategory;
  subcategory: string;
  audience: string;
  tone: string;
  primary_goal: string;
}

export interface LockedFact {
  label: string;
  value: string;
  source: string;
}

export interface FactsBlock {
  locked: boolean;
  items: LockedFact[];
}

export interface SnapshotItem {
  label: string;
  value: string;
}

export interface EmailSection {
  type: SectionType;
  title?: string;

  /**
   * Used by text / highlight / note sections.
   */
  content?: string;

  /**
   * Used by bullets / steps / timeline.
   */
  items?: Array<string | SnapshotItem>;
}

export interface EmailHero {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export interface EmailBody {
  intro: string;
  sections: EmailSection[];
  closing?: string;
}

export interface EmailCTA {
  enabled: boolean;
  label?: string;
  url?: string;
}

export interface EmailDisclaimer {
  required: boolean;

  /**
   * e.g. research, regulatory,
   * promotional, standard
   */
  type: string;

  /**
   * May remain blank if the application
   * will inject an approved disclaimer.
   */
  text?: string;
}

export interface ComplianceResult {
  status:
    | "pass"
    | "warning"
    | "fail";

  flags: string[];
  notes: string[];
}

export interface CommunicationVariant {
  variant_key:
    | "A"
    | "B"
    | "C";

  variant_name: string;

  strategy: string;

  subject_lines: string[];

  preheader?: string;

  hero: EmailHero;

  body: EmailBody;

  cta: EmailCTA;

  disclaimer: EmailDisclaimer;

  compliance: ComplianceResult;
}

export interface AIEmailGeneration {
  generation_meta: GenerationMeta;

  communication: CommunicationContext;

  facts: FactsBlock;

  variants: CommunicationVariant[];
}
