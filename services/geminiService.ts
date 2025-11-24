import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lead, OutreachScript, Language } from "../types";

// Schema for structured lead extraction
const leadSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      companyName: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['B2B', 'B2C', 'Distributor', 'Brand', 'Social'] },
      description: { type: Type.STRING },
      website: { type: Type.STRING },
      location: { type: Type.STRING },
      contactInfo: {
        type: Type.OBJECT,
        properties: {
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          wechat: { type: Type.STRING, description: "WeChat ID or Public Account Name" },
          social: { type: Type.STRING, description: "Social media profile link (Douyin, Red, etc)" },
        }
      },
      potentialNeeds: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      confidenceScore: { type: Type.INTEGER, description: "Confidence 0-100 that this is a good match" }
    },
    required: ['companyName', 'type', 'description']
  }
};

export const searchLeads = async (query: string, targetType: string, lang: Language): Promise<Lead[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 
  
  // Adjust prompt based on language
  const langInstruction = lang === 'zh' 
    ? "Respond in Simplified Chinese. Find companies/profiles relevant to the Chinese or International market." 
    : "Respond in English.";

  let searchContext = "";
  if (targetType === 'Social') {
    searchContext = `
      Focus specifically on finding influencers (KOL/KOC), MCN agencies, or brands active on social media platforms like Xiaohongshu (RedNote), Douyin (TikTok), and WeChat Official Accounts. 
      Look for "Business Cooperation" contacts, "WeChat IDs", or profile descriptions that indicate they sell intimate products or are looking for suppliers.
      Keywords to implicitly use in search: "site:xiaohongshu.com", "site:douyin.com", "WeChat Public Account", "商务合作", "supplier needed".
    `;
  } else {
    searchContext = `
      Find potential ${targetType} clients/partners for a private label (OEM) manufacturer in the intimate products/adult toy industry. 
      Focus on companies that might need manufacturing or have distribution channels.
    `;
  }

  const refinedQuery = `${searchContext} User Keywords: "${query}". ${langInstruction}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: refinedQuery,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: leadSchema,
        systemInstruction: `You are a specialized Sales Intelligence Agent for a factory. 
        Your goal is to find high-quality business leads based on the user's query using Google Search.
        
        1. Search for real companies, social media profiles, or distributors suitable for OEM partnerships.
        2. Extract publicly available information (Name, Website/Profile Link, Location).
        3. AGGRESSIVELY look for contact info: Phone numbers, Emails, and specifically "WeChat IDs" (微信号) or "Official Accounts" (公众号) if visible in public snippets or descriptions.
        4. Infer their "Potential Needs" based on their business model.
        5. Return a JSON array.
        6. Ensure the 'description' and 'potentialNeeds' fields are written in ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
        `
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const rawLeads = JSON.parse(jsonText) as any[];
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Source'
    })).filter((s: any) => s.uri) || [];

    return rawLeads.map((l, index) => ({
      ...l,
      id: `lead-${Date.now()}-${index}`,
      searchSources: sources.slice(0, 3)
    }));

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error; 
  }
};

export const generateOutreach = async (lead: Lead, tone: string, channel: string, lang: Language): Promise<OutreachScript> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    I am a sales manager for a private label factory (OEM/ODM) producing intimate products.
    I want to contact this lead:
    Company/Profile: ${lead.companyName}
    Type: ${lead.type}
    Description: ${lead.description}
    Needs: ${lead.potentialNeeds?.join(', ')}

    Write a ${tone} message for ${channel} (e.g. Email, WeChat, LinkedIn).
    The goal is to open a conversation about manufacturing partnerships or supply chain.
    Keep it professional but persuasive.
    
    Language: ${lang === 'zh' ? 'Simplified Chinese (Professional Business Tone)' : 'English'}.
    
    Specific Instructions:
    ${channel === 'WeChat' ? 'Keep it concise and suitable for instant messaging. If they are an influencer/social account, mention how our factory can help them build their own brand (Private Label).' : 'Use a proper subject line if it is email.'}
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
  });

  return {
    channel: channel as any,
    tone: tone as any,
    content: response.text || "Could not generate script."
  };
};