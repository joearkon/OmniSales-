
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Language, AnalysisMode, AnalysisResult, MinedLead, StrategicOutreachResult } from "../types";

// Schemas for Market Analysis
const accountAnalysisSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      platform: { type: Type.STRING },
      accountName: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['Brand', 'Factory', 'KOL', 'Service', 'Other'] },
      coreBusiness: { type: Type.STRING },
      features: { type: Type.STRING },
      contactClues: { type: Type.STRING }
    }
  }
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
          leadType: { type: Type.STRING, enum: ['Factory', 'User', 'KOL'], description: "Strict classification: Factory, User, or KOL" },
          valueCategory: { type: Type.STRING, enum: ['High Value User', 'Medium Value User', 'Low Value User', 'Potential Partner'] },
          reason: { type: Type.STRING, description: "Reason for the value assessment e.g. Clear need + strong purchasing power" },
          suggestedAction: { type: Type.STRING, description: "Specific outreach advice" },
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
      items: { type: Type.OBJECT, properties: { need: { type: Type.STRING }, example: { type: Type.STRING, description: "Include percentage if possible e.g. 'Itching (45%)'" } } }
    },
    painPoints: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, example: { type: Type.STRING, description: "Include percentage if possible e.g. 'Price too high (30%)'" } } }
    },
    preferences: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { preference: { type: Type.STRING }, example: { type: Type.STRING, description: "Include percentage if possible e.g. 'Plant ingredients (85%)'" } } }
    }
  }
};

const competitorAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    competitors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          brand: { type: Type.STRING },
          pros: { type: Type.STRING },
          cons: { type: Type.STRING },
          targetAudience: { type: Type.STRING }
        }
      }
    },
    trends: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, evidence: { type: Type.STRING } } }
    }
  }
};

const sentimentAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentimentBreakdown: {
      type: Type.OBJECT,
      properties: {
        positive: { type: Type.NUMBER },
        neutral: { type: Type.NUMBER },
        negative: { type: Type.NUMBER }
      }
    },
    topKeywords: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, count: { type: Type.INTEGER } } }
    },
    examples: {
      type: Type.OBJECT,
      properties: {
        positive: { type: Type.STRING },
        negative: { type: Type.STRING }
      }
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
          profile: { type: Type.STRING, description: "e.g. Postpartum Mom, Gift Buyer" },
          characteristics: { type: Type.STRING, description: "e.g. Looking for repair, anxious about safety" }
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
        friendly: { type: Type.STRING, description: "Pain Point Resonance / Casual" },
        professional: { type: Type.STRING, description: "Professional Value / Expert" },
        concise: { type: Type.STRING, description: "Private Domain Hook / Call to Action" }
      }
    },
    privateDomainTip: { type: Type.STRING, description: "Formula: Content + Hook + Action" }
  }
};

export const analyzeMarketData = async (text: string, images: string[], mode: AnalysisMode, lang: Language): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; 

  let promptInstructions = "";
  let schema: Schema | undefined;

  const baseLangInstruction = lang === 'zh' ? "Respond in Simplified Chinese." : "Respond in English.";
  
  // Visual Identification Rules for accurate platform detection
  const visualRules = `
    **VISUAL IDENTIFICATION RULES (CRITICAL):**
    You are likely processing SCREENSHOTS from different apps. Treat EACH image individually.
    1. **Xiaohongshu (RedNote/小红书):** Look for RED buttons/UI elements, the "Notes" (笔记) tab, "Collection" (Star icon), and dual-column feed layout.
    2. **Douyin (TikTok China/抖音):** Look for BLACK background (often), Musical note logo, Right-side vertical action bar (Heart, Comment, Share icons), "Video" interface, or "MCN" badges.
    3. **WeChat (微信):** Look for GREEN UI elements, Chat bubbles, "Official Account" (公众号) header, or Article read counts.
    4. **Web/Other:** Look for browser address bars or standard e-commerce layouts.
    
    **DO NOT assume all images are from the same platform. Identify the platform for EACH entry based on visual cues.**
  `;

  // Strict Filtering Rules
  const filteringRules = `
    **FILTERING RULES (STRICT):**
    1. **Relevance:** ONLY analyze content related to **Intimate Care** (Private parts health), **Female/Male Reproductive Health**, **Functional/Antibacterial Underwear**, **Postpartum Care**, or **Adult Wellness**.
       - **EXCLUDE:** General fashion brands (e.g., Calvin Klein underwear without specific care functions), general clothing, pure entertainment, or unrelated topics.
    2. **Quality/Spam:** IGNORE "Junk Comments" or Spam.
       - **EXCLUDE:** Emojis only, single words like "666" or "good" without context, unrelated advertisements, or bot spam.
    
    If content is irrelevant or spam, DO NOT include it in the output list.
  `;

  switch (mode) {
    case 'LeadMining': // Now acts as "Customer Value Assessment" (Action 3)
      promptInstructions = `
        ${visualRules}
        ${filteringRules}
        Evaluate the value of the following leads/users based on their content. 
        
        Strictly classify each lead into one of these 'leadType' categories:
        1. 'Factory': A manufacturing business, competitor, or OEM.
        2. 'KOL': An influencer, blogger, or content creator.
        3. 'User': An end-user or consumer.

        Then, assign a 'valueCategory':
        - High Value User (Clear need + strong purchasing power, e.g. "Appointment made", "Want safe product")
        - Medium Value User (Has need but limited budget/hesitant)
        - Low Value User (Casual browsing)
        - Potential Partner (Brand, Factory, Channel Distributor, e.g. "OEM needed", "10 years experience")
        
        For each lead found in the TEXT or IMAGES:
        1. Identify the Platform (Douyin/Xiaohongshu/WeChat) using the visual rules.
        2. Identify the Account Name. **CRITICAL: If a user ID is provided in the input text (e.g. "User: Name (ID: 12345)"), YOU MUST include the ID in the 'accountName' field (e.g. "Name (ID: 12345)") so we can track them.**
        3. Identify the Lead Type (Factory/KOL/User).
        4. Assign the 'valueCategory'.
        5. Explain the 'reason' (e.g., "Clear need + health conscious").
        6. Suggest a 'suggestedAction'.
        7. Provide context summary.
        ${baseLangInstruction}
      `;
      schema = leadMiningSchema;
      break;
    case 'Identity': // Now acts as "Identify Client Identity" (Action 1)
      promptInstructions = `
        ${visualRules}
        ${filteringRules}
        Analyze the provided content to identify "Users with intimate care needs" vs "Intimate care practitioners/Brands".
        
        1. Identify each distinct entity (Person or Company) in the text or images.
        2. Classify them into 'User' (End Consumer), 'Brand', 'Factory', or 'Practitioner'.
        3. Extract the Platform (Douyin/Xiaohongshu/WeChat) using visual rules.
        4. Extract Name (Account Name). **CRITICAL: Include User ID if available in text (e.g. "Name (ID: ...)")**.
        5. Extract their specific Need (for users) or Business Scope (for businesses).
        
        Return a JSON array formatted as a table: Platform, Account Name, Type, Description.
        ${baseLangInstruction}
      `;
      schema = identityAnalysisSchema;
      break;
    case 'Needs': // Now acts as "Mine User Pain Points" (Action 2)
      promptInstructions = `
        ${filteringRules}
        Analyze user comments to summarize:
        1. Main Pain Points (e.g. Itchiness, Looseness, Odor) -> include estimated percentage/frequency if possible (e.g. "Itchiness (45%)").
        2. Expected Effects (e.g. Stop itching, Tightening, Improve inflammation) -> include estimated percentage/frequency.
        3. Consumption Preferences (e.g. Price range, Ingredients) -> include estimated percentage/frequency.
        
        Provide an example quote for each.
        ${baseLangInstruction}
      `;
      schema = needsAnalysisSchema;
      break;
    case 'Classification':
      promptInstructions = `
        ${visualRules}
        ${filteringRules}
        Analyze the provided content (text and/or images of social media profiles).
        1. Classify each account (Brand, Factory, KOL, Service, etc.).
        2. Extract key info: Platform (Douyin/Red/WeChat), Account Name (Include ID if available), Core Business, Features, Contact Clues.
        3. Output a JSON array.
        ${baseLangInstruction}
      `;
      schema = accountAnalysisSchema;
      break;
    case 'Competitors':
      promptInstructions = `
        ${filteringRules}
        Analyze the provided content for brand/product comparisons.
        1. List competitors with their Pros, Cons, and Target Audience.
        2. Summarize Market Trends with evidence.
        ${baseLangInstruction}
      `;
      schema = competitorAnalysisSchema;
      break;
    case 'Sentiment':
      promptInstructions = `
        ${filteringRules}
        Perform sentiment analysis on the user reviews/comments provided in text or images.
        1. Calculate percentage of Positive, Neutral, Negative sentiment.
        2. Extract Top 5 keywords with counts.
        3. Provide one positive and one negative example.
        ${baseLangInstruction}
      `;
      schema = sentimentAnalysisSchema;
      break;
    case 'Comments':
      promptInstructions = `
        ${filteringRules}
        Analyze the provided user comments or discussion threads deep dive.
        1. Identify distinct User Personas (who is commenting? e.g., 'Gift buyers', 'First-time users').
        2. List Common Questions asked by potential buyers.
        3. Identify Concerns/Hesitations (why they haven't bought yet).
        4. Identify Purchase Motivations (drivers).
        ${baseLangInstruction}
      `;
      schema = commentAnalysisSchema;
      break;
  }

  const contentParts: any[] = [
    { text: `${promptInstructions}\n\nProvided Text:\n${text}` }
  ];

  // Append images if present
  if (images && images.length > 0) {
    images.forEach(base64String => {
        // Remove the data:image/jpeg;base64, prefix if present to just get the raw base64
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        
        contentParts.push({
            inlineData: {
                mimeType: "image/jpeg", // Assuming converting to JPEG/PNG in frontend
                data: base64Data
            }
        });
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
        parts: contentParts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No analysis generated.");

  return {
    mode: mode,
    data: JSON.parse(jsonText)
  } as AnalysisResult;
};

export const generateStrategicOutreach = async (lead: MinedLead, lang: Language): Promise<StrategicOutreachResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";

  const isUser = lead.valueCategory.includes('User');

  const prompt = `
    You are a sales expert for an intimate care product factory/brand.
    Generate a strategic outreach plan for this specific lead found on ${lead.platform}.

    Lead Name: ${lead.accountName}
    Context: "${lead.context}"
    Reason: ${lead.reason}
    Type: ${lead.valueCategory} (${isUser ? 'End Consumer' : 'Business Partner'})

    Task 1: Generate 3 Outreach Scripts (Max 50 words each).
    - Friendly: Uses "Pain Point Resonance" (Empathy + Solution). For practitioners, use "Compliment + Question".
    - Professional: Uses "Professional Value" (Expertise + Data). For practitioners, use "Factory capabilities + Collaboration".
    - Concise: Uses "Private Domain Hook" (Content + Hook + Action).

    Task 2: ${isUser ? 'Perform a "Problem Diagnosis" based on their context. Guess the likely issue, give 3 nursing tips, and recommend a product type.' : 'Provide a short "Private Domain Conversion Formula" tip specifically for B2B negotiation.'}

    Language: ${lang === 'zh' ? 'Simplified Chinese' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: strategicOutreachSchema
    }
  });

  return JSON.parse(response.text || "{}") as StrategicOutreachResult;
};
