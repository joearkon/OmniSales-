
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Language, AnalysisMode, AnalysisResult, MinedLead, StrategicOutreachResult, CompanyProfile, DeepPersonaResult } from "../types";

// Helper to reliably get API Key across different environments (Vite, Next, Create React App, etc.)
const getApiKey = (): string => {
  try {
    if ((import.meta as any).env?.VITE_API_KEY) return (import.meta as any).env.VITE_API_KEY;
    if ((import.meta as any).env?.API_KEY) return (import.meta as any).env.API_KEY;
  } catch (e) {}
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
  }
  return '';
};

const identityAnalysisSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      platform: { type: Type.STRING },
      name: { type: Type.STRING },
      identity: { type: Type.STRING, enum: ['User', 'Brand', 'Factory', 'Practitioner'] },
      description: { type: Type.STRING, description: "Specific user need OR business scope" }
    }
  }
};

const leadMiningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    leads: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          accountName: { type: Type.STRING },
          leadType: { type: Type.STRING, enum: ['Factory', 'User', 'KOL'], description: "Strict classification" },
          valueCategory: { type: Type.STRING, enum: ['High Value User', 'Medium Value User', 'Low Value User', 'Potential Partner'] },
          outreachStatus: { type: Type.STRING, enum: ['Likely Uncontacted', 'Likely Contacted', 'Unknown'] },
          date: { type: Type.STRING, description: "Extracted date YYYY-MM-DD" },
          reason: { type: Type.STRING },
          suggestedAction: { type: Type.STRING },
          context: { type: Type.STRING }
        }
      }
    }
  }
};

const needsAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    coreNeeds: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { need: { type: Type.STRING }, example: { type: Type.STRING } } } },
    painPoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, example: { type: Type.STRING } } } },
    preferences: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { preference: { type: Type.STRING }, example: { type: Type.STRING } } } }
  }
};

const commentAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    userPersonas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { profile: { type: Type.STRING }, characteristics: { type: Type.STRING } } } },
    commonQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    purchaseMotivations: { type: Type.ARRAY, items: { type: Type.STRING } },
    concerns: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

const strategicOutreachSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    diagnosis: {
      type: Type.OBJECT,
      properties: {
        problemType: { type: Type.STRING },
        advice: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedProduct: { type: Type.STRING }
      },
      nullable: true
    },
    scripts: {
      type: Type.OBJECT,
      properties: {
        friendly: { type: Type.STRING },
        professional: { type: Type.STRING },
        concise: { type: Type.STRING }
      }
    },
    privateDomainTip: { type: Type.STRING }
  }
};

const deepPersonaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
    psychology: {
      type: Type.OBJECT,
      properties: {
        buyingLogic: { type: Type.STRING },
        painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        spendingPower: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
      }
    },
    match: {
      type: Type.OBJECT,
      properties: {
        bestProduct: { type: Type.STRING },
        whyFit: { type: Type.STRING }
      }
    },
    approach: {
      type: Type.OBJECT,
      properties: {
        openingLine: { type: Type.STRING },
        toneAdvice: { type: Type.STRING }
      }
    }
  }
};

export const analyzeMarketData = async (text: string, images: string[], mode: AnalysisMode, lang: Language): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 

  const baseLangInstruction = lang === 'zh' ? "Respond in Simplified Chinese." : "Respond in English.";
  
  const visualRules = `
    **PLATFORM RULES:**
    - "red", "xhs", "xiaohongshu" -> Xiaohongshu (Red).
    - "douyin", "tiktok" -> Douyin (Black).
    - "wechat", "wx" -> WeChat (Green).
  `;

  let prompt = "";
  let schema: Schema | undefined;

  switch (mode) {
    case 'LeadMining':
      prompt = `
        ${visualRules}
        Analyze content.
        1. Lead Type: Factory, KOL, User.
        2. Value: High/Medium/Low, Potential Partner.
        3. Outreach Status: Likely Uncontacted (basic question), Likely Contacted (comparing prices), Unknown.
        4. Date extraction: YYYY-MM-DD.
        ${baseLangInstruction}
      `;
      schema = leadMiningSchema;
      break;
    case 'Identity':
      prompt = `Identify Identity (User/Brand/Factory). ${baseLangInstruction}`;
      schema = identityAnalysisSchema;
      break;
    case 'Needs':
      prompt = `Summarize Needs, Pain Points, Preferences. ${baseLangInstruction}`;
      schema = needsAnalysisSchema;
      break;
    case 'Comments':
      prompt = `Analyze Personas, Questions, Motivations. ${baseLangInstruction}`;
      schema = commentAnalysisSchema;
      break;
  }

  const contentParts: any[] = [{ text: `${prompt}\n\nText:\n${text}` }];
  images.forEach(img => contentParts.push({ inlineData: { mimeType: "image/jpeg", data: img.replace(/^data:image\/\w+;base64,/, "") } }));

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: contentParts },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return { mode: mode, data: JSON.parse(response.text || "{}") } as AnalysisResult;
};

export const generateStrategicOutreach = async (lead: MinedLead, lang: Language, profile?: CompanyProfile): Promise<StrategicOutreachResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";

  let productCatalog = "";
  if (profile?.productsList && profile.productsList.length > 0) {
      productCatalog = `
        **AVAILABLE PRODUCT CATALOG:**
        ${profile.productsList.map(p => `- ${p.name} (SKU: ${p.sku || 'N/A'}): ${p.sellingPoints}`).join('\n')}
      `;
  }

  const promptText = `
    Lead: ${lead.accountName} on ${lead.platform}. Type: ${lead.leadType}. Value: ${lead.valueCategory}. Content: "${lead.context}".
    
    My Company: ${profile?.name}. Products: ${profile?.products}. Advantages: ${profile?.advantages}.
    Capacity: ${profile?.capacity}. Certs: ${profile?.certifications}.
    
    ${productCatalog}
    
    **If a specific product from the catalog matches the lead's problem, recommend it by name.**

    Rules:
    - Priority Leads (KOL/High Value): Detailed diagnosis, 3 scripts (Friendly, Professional, Concise).
    - Standard Leads: NULL Diagnosis. Scripts max 30 chars (Casual).
    
    Lang: ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
  `;

  const contentParts: any[] = [];
  if (profile?.images) {
      profile.images.forEach(img => contentParts.push({ inlineData: { mimeType: "image/jpeg", data: img.replace(/^data:image\/\w+;base64,/, "") } }));
  }
  contentParts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: contentParts },
    config: { responseMimeType: "application/json", responseSchema: strategicOutreachSchema }
  });

  return JSON.parse(response.text || "{}") as StrategicOutreachResult;
};

export const generateDeepPersona = async (lead: MinedLead, extraText: string, extraImages: string[], lang: Language, profile?: CompanyProfile): Promise<DeepPersonaResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";

  let productCatalog = "";
  if (profile?.productsList && profile.productsList.length > 0) {
      productCatalog = `
        **PRODUCT CATALOG:**
        ${profile.productsList.map(p => `- ${p.name}: ${p.sellingPoints}`).join('\n')}
      `;
  }

  const prompt = `
    Role: Consumer Psychologist.
    Analyze user ${lead.accountName}.
    Bio/Text: ${extraText}.
    
    Factory Info: ${profile?.products} ${profile?.advantages}.
    ${productCatalog}

    1. Tags.
    2. Visual Evidence (from screenshots).
    3. Psychology (Buying logic, Pain points).
    4. Spending Power (High/Med/Low).
    5. Match: Recommend BEST product from catalog.
    6. Approach: Killer Opener (Personalized).

    Lang: ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
  `;

  const contentParts: any[] = [{ text: prompt }];
  extraImages.forEach(img => contentParts.push({ inlineData: { mimeType: "image/jpeg", data: img.replace(/^data:image\/\w+;base64,/, "") } }));

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: contentParts },
    config: { responseMimeType: "application/json", responseSchema: deepPersonaSchema }
  });

  return JSON.parse(response.text || "{}") as DeepPersonaResult;
};
