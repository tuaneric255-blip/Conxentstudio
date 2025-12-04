
export type ID = string;
export type Language = 'en' | 'vi';
export type Theme = 'light' | 'dark';
export type WritingStyle = 'default' | 'pas' | '3s' | 'aidasas' | 'storytelling' | 'expository' | 'persuasive' | 'descriptive' | 'narrative' | 'technical' | 'conversational';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

// Data Models
interface BaseModel {
  id: ID;
  createdAt: string;
}

export interface ProductInfo extends BaseModel {
  name: string;
  price?: string;
  desiredOutcome?: string;
  location?: string;
}

export type PersonaModel = 'standard' | 'empathy' | 'value-prop' | 'jtbd' | 'journey' | 'mental';

export interface PersonaDetails {
    demographics: string;
    goals: string[];
    challenges: string[];
}

export interface EmpathyMap {
    says: string[];
    thinks: string[];
    does: string[];
    feels: string[];
}

export interface ValueProposition {
    customerJobs: string[];
    pains: string[];
    gains: string[];
    productsServices: string[];
    painRelievers: string[];
    gainCreators: string[];
}

export interface JobsToBeDone {
    jobStatement: string;
    functionalAspects: string[];
    emotionalAspects: string[];
    socialAspects: string[];
}

export interface CustomerJourneyMapStage {
    actions: string[];
    painPoints: string[];
    opportunities: string[];
}

export interface CustomerJourneyMap {
    awareness: CustomerJourneyMapStage;
    consideration: CustomerJourneyMapStage;
    decision: CustomerJourneyMapStage;
}

export interface MentalModel {
    coreBeliefs: string[];
    thoughtProcess: string;
    informationStructure: string;
}

export interface Persona extends BaseModel {
  productId: ID;
  summary: string;
  models: PersonaModel[];
  details?: PersonaDetails;
  empathyMap?: EmpathyMap;
  valueProposition?: ValueProposition;
  jtbd?: JobsToBeDone;
  journey?: CustomerJourneyMap;
  mentalModel?: MentalModel;
}

export interface Keyword {
    id: ID;
    term: string;
    relevance: number;
    searchVolume: number;
    competition: 'Low' | 'Medium' | 'High';
    kei: number;
    kgr: number;
    intent: 'Informational' | 'Navigational' | 'Commercial' | 'Transactional';
    lsiKeywords: string[];
}

export interface KeywordSet extends BaseModel {
    personaId: ID;
    items: Keyword[];
}

export interface BreakthroughPoints {
    uniqueInsights: string;
    humanExperienceEEAT: string;
    hcuExploitation: string;
}

export interface Analysis extends BaseModel {
    keywordIds: ID[];
    summary: string; // Tóm tắt & Tổng hợp
    objectives: string[]; // Mục tiêu (suy luận)
    contentGaps: string[]; // Lỗ hổng Nội dung/Phạm vi đối thủ chưa hoặc quên khai thác hoặc yếu
    creativeIdeas: string[]; // Ý tưởng hay: tạo lôi cuốn, USP
    breakthroughs: BreakthroughPoints; // Điểm Đột phá nội dung mới
    sources: { title: string; uri: string }[];
}


export interface ObjectiveOption {
    id: ID;
    description: string;
    rationale: string;
    score: number;
}
export interface ObjectiveSet extends BaseModel {
    analysisId: ID;
    options: ObjectiveOption[];
}

export interface TitleOption {
    id: ID;
    title: string;
    rationale: string;
    score: number;
}
export interface TitleSet extends BaseModel {
    objectiveIds: ID[];
    options: TitleOption[];
}

export interface MetaDescriptionOption {
    id: ID;
    description: string;
    rationale: string;
    score: number;
}
export interface MetaDescriptionSet extends BaseModel {
    titleId: ID;
    keywordTerm: string;
    title: string;
    options: MetaDescriptionOption[];
}

// New Module V2.0: Sapo
export interface SapoOption {
    id: ID;
    content: string;
    rationale: string;
}
export interface SapoSet extends BaseModel {
    metaDescriptionId: ID;
    options: SapoOption[];
}

// New Module V2.0: CTA
export interface CtaOption {
    id: ID;
    content: string;
    rationale: string;
}
export interface CtaSet extends BaseModel {
    sapoId: ID;
    options: CtaOption[];
}

export interface OutlineSection {
    h2: string;
    bullets: string[];
}
export interface Outline extends BaseModel {
    personaId: ID;
    analysisId: ID;
    sections: OutlineSection[];
}

export interface ImageOption {
    id: ID;
    url: string;
    prompt: string;
}
export interface ImageSet extends BaseModel {
    outlineId: ID;
    options: ImageOption[];
}

export interface Article extends BaseModel {
    title: string;
    content: string; // The final merged content
    // V2.1: Store parts separately to allow editing before final merge if needed
    parts?: {
        part1: string;
        part2: string;
        part3: string;
    };
    metaDescription: string;
    sapo: string; // V2.0
    cta: string; // V2.0
    outlineId: ID;
    featureImage: string;
    images: string[];
    // Context for SEO evaluation
    personaId: ID;
    analysisId: ID;
    primaryKeywordId: ID;
    objectiveIds: ID[];
    writingStyle: WritingStyle;
    generationOptions: {
      includeFaq: boolean;
      useTables: boolean;
      useQuotes: boolean; // V2.5
      addWikipediaLinks: boolean;
      internalLinks?: string[]; // V2.2
      externalLinks?: string[]; // V2.2
    };
}

export interface SeoChecklistItem {
  pass: boolean;
  reason: string;
}

export interface SeoChecklistResult {
  primaryKeyword: SeoChecklistItem;
  title: SeoChecklistItem;
  metaDescription: SeoChecklistItem;
  sapo: SeoChecklistItem;
  aiOverview: SeoChecklistItem;
  h1: SeoChecklistItem;
  headings: SeoChecklistItem;
  writingStyle: SeoChecklistItem;
  tables: SeoChecklistItem;
  trust: SeoChecklistItem;
  expertise: SeoChecklistItem;
  images: SeoChecklistItem;
  faqs: SeoChecklistItem;
  objectives: SeoChecklistItem;
  creativity: SeoChecklistItem;
}


// Application State
export interface AppData {
  products: Record<ID, ProductInfo>;
  personas: Record<ID, Persona>;
  keywordSets: Record<ID, KeywordSet>;
  analyses: Record<ID, Analysis>;
  objectiveSets: Record<ID, ObjectiveSet>;
  titleSets: Record<ID, TitleSet>;
  metaDescriptionSets: Record<ID, MetaDescriptionSet>;
  sapoSets: Record<ID, SapoSet>; // V2.0
  ctaSets: Record<ID, CtaSet>; // V2.0
  outlines: Record<ID, Outline>;
  imageSets: Record<ID, ImageSet>;
  articles: Record<ID, Article>;
}

export interface ActiveIds {
  productId?: ID;
  personaId?: ID;
  keywordSetId?: ID;
  keywordIds?: ID[];
  analysisId?: ID;
  objectiveSetId?: ID;
  objectiveIds?: ID[];
  titleSetId?: ID;
  titleId?: ID;
  metaDescriptionSetId?: ID;
  metaDescriptionId?: ID;
  sapoSetId?: ID; // V2.0
  sapoId?: ID; // V2.0
  ctaSetId?: ID; // V2.0
  ctaId?: ID; // V2.0 (Primary)
  ctaIds?: ID[]; // V2.2 (Multiple)
  outlineId?: ID;
  imageSetId?: ID;
  imageIds?: ID[];
  featureImageId?: ID;
  activeArticleId?: ID;
}

export interface GoogleConfig {
    clientId: string;
    apiKey: string;
}