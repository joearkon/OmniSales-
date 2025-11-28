
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Language, AnalysisMode, AnalysisResult, MinedLead, StrategicOutreachResult, CompanyProfile, DeepPersonaResult } from "../types";

// Helper to reliably get API Key across different environments (Vite, Next, Create React App, etc.)
const getApiKey = (): string => {
  // 1. Try Vite / Modern ES Modules (Standard for Vercel + React)
  try {
    if ((import.meta as any).env?.VITE_API_KEY) {
      return (import.meta as any).env.VITE_API_KEY;
    }
    if ((import.meta as any).env?.API_KEY) {
      return (import.meta as any).env.API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }

  // 2. Try Node/Process Environment (If injected by build tool like Webpack/CRA)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
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
          outreachStatus: { type: Type.STRING, enum: ['Likely Uncontacted', 'Likely Contacted', 'Unknown'], description: "Infer from comment specificity" },
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
    coreNeeds: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { need: { type: Type.STRING }, example: { type: Type.STRING } } }
    },
    painPoints: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, example: { type: Type.STRING } } }
    },
    preferences: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { preference: { type: Type.STRING }, example: { type: Type.STRING } } }
    }
  }
};

const commentAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    userPersonas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          profile: { type: Type.STRING },
          characteristics: { type: Type.STRING }
        }
      }
    },
    commonQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    purchaseMotivations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    concerns: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
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
    personaTag: { type: Type.STRING, description: "Short descriptive tag (e.g. 'Quality-conscious Mom')" },
    spendingPower: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
    psychology: { type: Type.STRING, description: "Analysis of mindset, values, and decision drivers." },
    hiddenNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
    killerOpener: { type: Type.STRING, description: "A highly personalized opening message." }
  }
};

export const analyzeMarketData = async (text: string, images: string[], mode: AnalysisMode, lang: Language): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 

  let promptInstructions = "";
  let schema: Schema | undefined;

  const baseLangInstruction = lang === 'zh' ? "Respond in Simplified Chinese." : "Respond in English.";
  
  const visualRules = `
    **VISUAL & TEXT PLATFORM DETECTION RULES:**
    1. **Xiaohongshu:** Text contains "red", "xhs", "xiaohongshu". Images have RED buttons, "Notes" tab, Star icon.
    2. **Douyin:** Text contains "douyin", "tiktok". Images have BLACK background, Musical note logo.
    3. **WeChat:** Text contains "wechat", "wx". Images have GREEN UI, Chat bubbles.
    Identify the platform for EACH entry based on text keywords OR visual cues.
  `;

  const filteringRules = `
    **FILTERING RULES (STRICT):**
    1. **Relevance:** ONLY analyze content related to **Intimate Care** (Private parts health), **Reproductive Health**, **Functional Underwear**, **Postpartum Care**.
       - **EXCLUDE:** General fashion (e.g. CK underwear without function), clothing, entertainment.
    2. **Spam:** IGNORE "Junk Comments" (Emojis only, single numbers like '666', unrelated ads).
    
    If content is irrelevant or spam, DO NOT include it.
  `;

  switch (mode) {
    case 'LeadMining':
      promptInstructions = `
        ${visualRules}
        ${filteringRules}
        Evaluate leads based on content.
        
        Tasks:
        1. Classify 'leadType': 'Factory', 'KOL', 'User'.
        2. Assign 'valueCategory': High/Medium/Low Value User, Potential Partner.
        3. **Determine 'outreachStatus':**
           - 'Likely Uncontacted': Basic questions ("How to proxy?", "Price?"), new account.
           - 'Likely Contacted': Specific comparisons ("Is your price lower than Factory X?", "I asked 3 factories").
           - 'Unknown': Insufficient info.
        4. **Extract Date:** If the input text contains a date (e.g. "| Date: 2024-05-20"), extract it to the 'date' field in YYYY-MM-DD format. If not found, leave empty.
        
        For each lead:
        - Platform, Account Name (Include ID if available), Type, Value, Outreach Status, Date.
        - Explain reason & suggest action.
        ${baseLangInstruction}
      `;
      schema = leadMiningSchema;
      break;
    case 'Identity':
      promptInstructions = `
        ${visualRules}
        ${filteringRules}
        Identify "Users with needs" vs "Practitioners".
        Classify into 'User', 'Brand', 'Factory', 'Practitioner'.
        Include User ID in name if available.
        ${baseLangInstruction}
      `;
      schema = identityAnalysisSchema;
      break;
    case 'Needs':
      promptInstructions = `
        ${filteringRules}
        Summarize:
        1. Main Pain Points (with %)
        2. Expected Effects (with %)
        3. Consumption Preferences (with %)
        ${baseLangInstruction}
      `;
      schema = needsAnalysisSchema;
      break;
    case 'Comments':
      promptInstructions = `
        ${filteringRules}
        Identify User Personas, Questions, Motivations, Concerns.
        ${baseLangInstruction}
      `;
      schema = commentAnalysisSchema;
      break;
    default:
      throw new Error(`Mode ${mode} is no longer supported.`);
  }

  const contentParts: any[] = [
    { text: `${promptInstructions}\n\nProvided Text:\n${text}` }
  ];

  if (images && images.length > 0) {
    images.forEach(base64String => {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        contentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: contentParts },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No analysis generated.");

  return { mode: mode, data: JSON.parse(jsonText) } as AnalysisResult;
};

export const generateStrategicOutreach = async (lead: MinedLead, lang: Language, profile?: CompanyProfile): Promise<StrategicOutreachResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";

  const isUser = lead.valueCategory.includes('User');
  let profileContext = "";

  if (profile && (profile.name || profile.products)) {
      profileContext = `
        **YOUR IDENTITY / COMPANY CONTEXT:**
        You are representing: ${profile.name || 'Our Factory'}
        Your Core Products: ${profile.products || 'Private Care Products'}
        Your Advantages: ${profile.advantages}
        Your Policy: ${profile.policy}
        ${profile.knowledgeBase ? `\n**EXTENDED KNOWLEDGE BASE / FACTORY DETAILS:**\n${profile.knowledgeBase}\n(Use this info to provide specific answers if asked about specs, tech, or background)` : ''}
        
        **INSTRUCTION:** 
        - Mention specific company advantages ONLY if relevant to the lead's problem.
        - Use the Knowledge Base details to sound like an insider expert.
      `;
  }

  const prompt = `
    Sales expert context. Lead: ${lead.accountName} on ${lead.platform}.
    Reason: ${lead.reason}. Type: ${lead.valueCategory}. Content: "${lead.context}".
    
    ${profileContext}

    Task 1: 3 Scripts (Friendly, Professional, Concise).
       - Friendly: Empathize with pain points.
       - Professional: Highlight value/ROI.
       - Concise: Direct hook for private domain.
    Task 2: ${isUser ? 'Problem Diagnosis & Tips' : 'Private Domain Conversion Formula'}.
    
    Language: ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: strategicOutreachSchema }
  });

  return JSON.parse(response.text || "{}") as StrategicOutreachResult;
};

export const generateDeepPersona = async (image: string | null, text: string, lang: Language): Promise<DeepPersonaResult> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key is missing.");
  
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash"; 
  
    const promptInstructions = `
      **ROLE: Consumer Psychology & Sales Expert (AI Profiler)**
      
      **TASK:**
      Analyze the provided social media screenshot (visuals, bio, posts) AND/OR the provided text description.
      Create a deep psychological profile of this user to help a sales rep close the deal.
      
      **OUTPUT FIELDS:**
      1. **Persona Tag**: A sharp, 3-5 word label defining them (e.g. "Price-Sensitive Young Mom" or "High-End Quality Seeker").
      2. **Spending Power**: Estimate High/Medium/Low based on visual cues (clothing, background, phone) or language.
      3. **Psychology**: Analyze their values, fears, and decision-making drivers. (e.g. "She values safety over price due to anxiety about...")
      4. **Hidden Needs**: What do they *really* want but aren't saying?
      5. **Killer Opener**: Write ONE highly personalized DM (Direct Message) that triggers their specific psychological driver. It must be hard to ignore.
      
      **LANGUAGE:**
      ${lang === 'zh' ? "Output strictly in Simplified Chinese." : "Output in English."}
    `;
  
    const contentParts: any[] = [
      { text: `${promptInstructions}\n\nAdditional Text Context:\n${text}` }
    ];
  
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      contentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
  
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contentParts },
      config: { responseMimeType: "application/json", responseSchema: deepPersonaSchema }
    });
  
    return JSON.parse(response.text || "{}") as DeepPersonaResult;
};
