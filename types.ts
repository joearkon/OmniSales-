
export interface Lead {
  id: string;
  companyName: string;
  type: 'B2B' | 'B2C' | 'Distributor' | 'Brand' | 'Social' | 'Exhibition';
  description: string;
  website?: string;
  location?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    wechat?: string;
    social?: string;
  };
  confidenceScore: number; // 0-100
  searchSources?: Array<{ uri: string; title: string }>;
  potentialNeeds?: string[];
}

export interface SearchParams {
  query: string;
  targetType: 'All' | 'B2B' | 'B2C' | 'Distributor' | 'Social' | 'Exhibition';
}

export interface OutreachScript {
  channel: 'Email' | 'WeChat' | 'Phone';
  content: string;
  tone: 'Professional' | 'Friendly' | 'Direct';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LEAD_DETAIL = 'LEAD_DETAIL',
}

export type Language = 'en' | 'zh';

// Market Analysis Types
// Removed Classification, Competitors, Sentiment as requested
export type AnalysisMode = 'Needs' | 'Comments' | 'Identity' | 'LeadMining';

export interface NeedsAnalysisResult {
  coreNeeds: Array<{ need: string; example: string }>;
  painPoints: Array<{ point: string; example: string }>;
  preferences: Array<{ preference: string; example: string }>;
}

export interface CommentAnalysisResult {
  userPersonas: Array<{
    profile: string; // e.g. "Postpartum Mom"
    characteristics: string; // e.g. "Looking for repair, anxious about safety"
  }>;
  commonQuestions: Array<string>;
  purchaseMotivations: Array<string>;
  concerns: Array<string>;
}

export interface IdentityAnalysisItem {
  platform: string;
  name: string;
  identity: 'User' | 'Brand' | 'Factory' | 'Practitioner'; 
  description: string; // Need or Business scope
}

export interface MinedLead {
  platform: string;
  accountName: string;
  leadType: 'Factory' | 'User' | 'KOL'; // Specific classification
  valueCategory: 'High Value User' | 'Medium Value User' | 'Low Value User' | 'Potential Partner';
  outreachStatus: 'Likely Uncontacted' | 'Likely Contacted' | 'Unknown'; // New field
  date?: string; // YYYY-MM-DD
  reason: string; // Why they are high value
  suggestedAction: string; // e.g. "Direct Message product link"
  context: string; // Brief snippet of what they said
}

export interface CRMLead extends MinedLead {
  id: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  addedAt: string;
  notes: string;
  tags: string[];
}

export interface LeadMiningResult {
  leads: MinedLead[];
}

export interface StrategicOutreachResult {
  diagnosis?: {
    problemType: string;
    advice: string[];
    recommendedProduct: string;
  };
  scripts: {
    friendly: string; // "Pain Point Resonance" or "Resource Complementarity"
    professional: string; // "Professional Value"
    concise: string; // "Private Domain Formula"
  };
  privateDomainTip: string;
}

export interface CompanyProfile {
  name: string;
  products: string; // e.g., "Private Care Gel, Probiotic Wash"
  advantages: string; // e.g., "Low MOQ, FDA Certified, 24h Sampling"
  policy: string; // e.g., "MOQ 500pcs, Free Design"
}

export type AnalysisResult = 
  | { mode: 'Needs'; data: NeedsAnalysisResult }
  | { mode: 'Comments'; data: CommentAnalysisResult }
  | { mode: 'Identity'; data: IdentityAnalysisItem[] }
  | { mode: 'LeadMining'; data: LeadMiningResult };
