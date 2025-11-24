import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lead, OutreachScript, Language } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for structured lead extraction
const leadSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      companyName: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['B2B', 'B2C', 'Distributor', 'Brand'] },
      description: { type: Type.STRING },
      website: { type: Type.STRING },
      location: { type: Type.STRING },
      contactInfo: {
        type: Type.OBJECT,
        properties: {
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          social: { type: Type.STRING },
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
  if (!apiKey) {
    console.error("No API Key found");
    throw new Error("Please set your API_KEY in the environment.");
  }

  const modelId = "gemini-2.5-flash"; 
  
  // Adjust prompt based on language
  const langInstruction = lang === 'zh' 
    ? "Respond in Simplified Chinese. Find companies relevant to the Chinese or International market as implied by the query." 
    : "Respond in English.";

  const refinedQuery = `Find potential ${targetType} clients/partners for a private label (OEM) manufacturer in the intimate products/adult toy industry. Keywords: ${query}. Focus on companies that might need manufacturing or have distribution channels. ${langInstruction}`;

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
        1. Search for real companies, distributors, or e-commerce brands suitable for OEM partnerships.
        2. Extract publicly available information (Name, Website, Location).
        3. Infer their "Potential Needs" based on their business model.
        4. Return a JSON array.
        5. Ensure the 'description' and 'potentialNeeds' fields are written in ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
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
    return [];
  }
};

export const generateOutreach = async (lead: Lead, tone: string, channel: string, lang: Language): Promise<OutreachScript> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    I am a sales manager for a private label factory (OEM/ODM) producing intimate products.
    I want to contact this lead:
    Company: ${lead.companyName}
    Type: ${lead.type}
    Description: ${lead.description}
    Needs: ${lead.potentialNeeds?.join(', ')}

    Write a ${tone} message for ${channel} (e.g. Email, WeChat, LinkedIn).
    The goal is to open a conversation about manufacturing partnerships or supply chain.
    Keep it professional but persuasive.
    Language: ${lang === 'zh' ? 'Simplified Chinese (Professional Business Tone)' : 'English'}.
    ${channel === 'WeChat' ? 'Keep it concise and suitable for instant messaging.' : 'Use a proper subject line if it is email.'}
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
