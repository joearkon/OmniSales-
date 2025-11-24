export interface Lead {
  id: string;
  companyName: string;
  type: 'B2B' | 'B2C' | 'Distributor' | 'Brand';
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
  targetType: 'All' | 'B2B' | 'B2C' | 'Distributor';
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
