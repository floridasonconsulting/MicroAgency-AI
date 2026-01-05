
import { GoogleGenAI } from "@google/genai";
import { Client, Message, Prospect } from "../types";

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const ai = new GoogleGenAI({ apiKey });

// --- AGENT SIMULATION ---

export const simulateAutoResponder = async (
  client: Client,
  incomingMessage: string,
  history: Message[]
): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot simulate response.";

  const historyText = history.map(m => `${m.role}: ${m.content}`).join('\n');
  const questions = client.config.qualificationQuestions.join('\n- ');

  const systemPrompt = `
    You are an AI automated receptionist for "${client.businessName}", a local ${client.niche} company.
    
    Your goal is to:
    1. Be friendly, professional, and concise (like a text message).
    2. Answer the user's inquiry.
    3. Collect lead information if missing (Name, Issue).
    4. Ask the following qualification questions one by one if relevant:
    - ${questions}
    5. Try to book an appointment or get them to commit to a callback.
    
    Current Configured Greeting: "${client.config.customGreeting}" (Use this style).
    
    Context:
    - You are NOT the business owner, you are an automated assistant ensuring they get a fast response.
    - If the user asks for price, say it depends on the job but you can set up a free estimate.
    
    Conversation History:
    ${historyText}
    
    User just said: "${incomingMessage}"
    
    Reply as the AI Assistant (Keep it under 160 characters if possible for SMS):
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: systemPrompt,
    });
    return response.text || "I'm having trouble processing that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "System Error: AI unresponsive.";
  }
};

// --- AGENCY TOOLS ---

export const generateOutreachScript = async (niche: string, platform: string, painPoint?: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  let painPointContext = "";
  if (painPoint) {
    painPointContext = `Customize this specifically for a business that suffers from: "${painPoint}". Mention how we solve exactly that problem.`;
  }

  const prompt = `
    I run a Micro-Agency selling "24/7 AI Lead Capture Systems" to local businesses.
    
    Write a high-converting cold outreach message for a "${niche}" business owner on "${platform}".
    
    IMPORTANT: You MUST end the message with a link to our live demo: "demo.microagency.ai"
    
    The Hook: "Are you missing calls when busy onsite?"
    The Offer: "AI answers missed calls, texts back immediately, and books appointments."
    The Price: "$197/mo, cancel anytime."
    
    ${painPointContext}
    
    Tone: Casual, direct, helpful. Not spammy.
    Length: Short enough for a DM or SMS.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate script.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating script.";
  }
};

export const analyzeLeadIntent = async (conversation: Message[]): Promise<{ urgency: string, service: string }> => {
  if (!apiKey) return { urgency: 'Unknown', service: 'Unknown' };

  const historyText = conversation.map(m => `${m.role}: ${m.content}`).join('\n');

  const prompt = `
    Analyze this SMS conversation between a lead and an AI receptionist.
    Extract:
    1. Urgency (Low, Medium, High/Emergency)
    2. Service Requested (Short phrase)
    
    Conversation:
    ${historyText}
    
    Return JSON format: {"urgency": "...", "service": "..."}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return { urgency: 'Unknown', service: 'Unknown' };
  }
};

export const generateConfigAssist = async (niche: string, businessName: string): Promise<{ greeting: string, questions: string[] }> => {
  if (!apiKey) return {
    greeting: `Thanks for contacting ${businessName}. How can we help you?`,
    questions: ["What service do you need?", "When do you need it?", "What is your location?"]
  };

  const prompt = `
    Generate configuration for an AI receptionist for a "${niche}" business named "${businessName}".
    
    1. Write a short, friendly greeting (under 2 sentences).
    2. Generate 3 specific qualification questions to ask leads.
    
    Return JSON:
    {
      "greeting": "...",
      "questions": ["...", "...", "..."]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);

    return {
      greeting: json.greeting || `Thanks for calling ${businessName}. How can I help?`,
      questions: Array.isArray(json.questions) ? json.questions.slice(0, 5) : ["Service needed?", "Timeline?", "Location?"]
    };
  } catch (error) {
    console.error("Gemini Config Gen Error:", error);
    return {
      greeting: `Thanks for calling ${businessName}. How can I help?`,
      questions: ["Service needed?", "Timeline?", "Location?"]
    };
  }
};

// --- PROSPECTOR (New) ---

export const findProspects = async (niche: string, location: string): Promise<Prospect[]> => {
  if (!apiKey) {
    console.error("API Key is missing for findProspects");
    return [];
  }

  const prompt = `
    Using Google Maps, find 5-10 local ${niche} businesses in ${location}.
    
    I am looking for businesses that might be underserving their customers (no website, bad reviews, etc).
    
    Return a strictly formatted JSON array of objects. 
    
    Each object must have these fields:
    - "businessName": string
    - "address": string
    - "rating": number (use 0 if not available)
    - "reviewCount": number (use 0 if not available)
    - "hasWebsite": boolean
    - "painPoints": array of strings (e.g. "No Website", "Low Rating", "Bad Reviews")
    
    Example output:
    [
      { "businessName": "Example Co", "address": "123 Main St", "rating": 3.5, "reviewCount": 10, "hasWebsite": false, "painPoints": ["No Website"] }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    let jsonText = response.text || "[]";
    console.log("Raw Gemini Response:", jsonText);

    // 1. Initial Cleanup: Remove markdown code blocks and zero-width spaces
    jsonText = jsonText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // 2. Fallback Parsing Strategy: Manual Block Scanner
    const prospects: any[] = [];
    let braceCount = 0;
    let objStart = -1;

    for (let i = 0; i < jsonText.length; i++) {
      if (jsonText[i] === '{') {
        if (braceCount === 0) objStart = i;
        braceCount++;
      } else if (jsonText[i] === '}') {
        braceCount--;
        if (braceCount === 0 && objStart !== -1) {
          // We found a balanced { ... } block
          const objStr = jsonText.substring(objStart, i + 1);

          try {
            // Try 1: Standard Strict Parse
            const p = JSON.parse(objStr);
            if (p && p.businessName) prospects.push(p);
          } catch (e) {
            // Try 2: Loose Cleanup (remove trailing commas, fix newlines)
            try {
              const looseStr = objStr
                .replace(/,\s*}/g, '}') // Trailing comma in object
                .replace(/,\s*]/g, ']') // Trailing comma in array
                .replace(/\n/g, ' ');   // Remove newlines in strings

              const p = JSON.parse(looseStr);
              if (p && p.businessName) prospects.push(p);
            } catch (e2) {
              console.warn("Failed to parse individual prospect block:", objStr.substring(0, 50) + "...");
            }
          }
          objStart = -1;
        }
      }
    }

    console.log(`Successfully extracted ${prospects.length} prospects using manual scanner.`);

    // Extract map links if available from grounding metadata safely
    let mapLinks: any[] = [];
    try {
      // @ts-ignore
      mapLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } catch (err) {
      console.warn("Could not extract grounding metadata chunks", err);
    }

    return prospects.map((p: any, index: number) => {
      // Defensive coding: Ensure all required fields exist and strip special chars from strings
      const safeBusinessName = (p.businessName || "Unknown Business").trim();
      const safeAddress = (p.address || "Address Unavailable").trim();

      // Attempt to find a matching map link from chunks, or fallback
      let matchingChunk = null;
      if (mapLinks.length > 0) {
        matchingChunk = mapLinks.find((chunk: any) =>
          chunk.web?.title?.includes(safeBusinessName) || chunk.web?.uri?.includes('google.com/maps')
        );
      }

      return {
        id: `p-${Date.now()}-${index}`,
        businessName: safeBusinessName,
        address: safeAddress,
        rating: typeof p.rating === 'number' ? p.rating : 0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
        hasWebsite: !!p.hasWebsite,
        painPoints: Array.isArray(p.painPoints) ? p.painPoints : [],
        outreachStatus: 'New',
        mapUrl: matchingChunk?.web?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeBusinessName + ' ' + safeAddress)}`
      };
    });

  } catch (error) {
    console.error("Gemini Prospecting Fatal Error:", error);
    return [];
  }
};

// --- PROSPECT SCORING ---

export interface ProspectScore {
  score: number;           // 1-100 conversion likelihood
  reasoning: string;       // AI explanation
  urgency: 'hot' | 'warm' | 'cold';
  suggestedApproach: string;
}

/**
 * Quick local scoring without API call - used for immediate UI feedback
 */
export const calculateLocalScore = (prospect: Prospect): number => {
  let score = 50; // Base score

  // No website = easier sell (+20)
  if (!prospect.hasWebsite) score += 20;

  // Pain points increase score
  const painPointBonus = Math.min(prospect.painPoints.length * 10, 30);
  score += painPointBonus;

  // Low rating = frustrated with current situation (+15)
  if (prospect.rating > 0 && prospect.rating < 3.5) score += 15;
  else if (prospect.rating >= 4.5) score -= 10; // Happy customers less likely to switch

  // Few reviews = low online presence (+10)
  if (prospect.reviewCount < 10) score += 10;
  else if (prospect.reviewCount > 100) score -= 5; // Established, harder sell

  // Cap between 1-100
  return Math.max(1, Math.min(100, score));
};

/**
 * AI-powered prospect scoring using Gemini
 * Returns detailed analysis with conversion likelihood and suggested approach
 */
export const scoreProspect = async (prospect: Prospect, niche: string): Promise<ProspectScore> => {
  // Calculate local score as fallback
  const localScore = calculateLocalScore(prospect);

  if (!apiKey) {
    return {
      score: localScore,
      reasoning: "API unavailable. Score based on basic indicators.",
      urgency: localScore >= 70 ? 'hot' : localScore >= 50 ? 'warm' : 'cold',
      suggestedApproach: "Follow standard outreach sequence."
    };
  }

  const prompt = `
    You are a sales intelligence AI analyzing a prospect for a "24/7 AI Receptionist" service.
    
    PROSPECT DATA:
    - Business: ${prospect.businessName}
    - Niche: ${niche}
    - Has Website: ${prospect.hasWebsite ? 'Yes' : 'No'}
    - Google Rating: ${prospect.rating}/5 (${prospect.reviewCount} reviews)
    - Identified Pain Points: ${prospect.painPoints.join(', ') || 'None identified'}
    
    SERVICE WE'RE SELLING:
    - AI answers missed calls 24/7
    - Automatic SMS follow-up
    - Appointment booking
    - $197/month subscription
    
    ANALYZE and return JSON:
    {
      "score": <number 1-100, conversion likelihood>,
      "reasoning": "<2-3 sentence explanation>",
      "urgency": "<hot|warm|cold>",
      "suggestedApproach": "<1-2 sentence personalized outreach strategy>"
    }
    
    Consider:
    - No website = high need for digital presence, likely missing calls
    - Low ratings from "slow response" complaints = perfect fit
    - Service businesses (plumbers, roofers, HVAC) with few reviews = underserved
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    return {
      score: typeof result.score === 'number' ? Math.max(1, Math.min(100, result.score)) : localScore,
      reasoning: result.reasoning || "Analysis complete.",
      urgency: ['hot', 'warm', 'cold'].includes(result.urgency) ? result.urgency : (localScore >= 70 ? 'hot' : localScore >= 50 ? 'warm' : 'cold'),
      suggestedApproach: result.suggestedApproach || "Use standard outreach sequence."
    };
  } catch (error) {
    console.error("Gemini Scoring Error:", error);
    return {
      score: localScore,
      reasoning: "AI analysis failed. Score based on basic indicators.",
      urgency: localScore >= 70 ? 'hot' : localScore >= 50 ? 'warm' : 'cold',
      suggestedApproach: "Follow standard outreach sequence."
    };
  }
};

/**
 * Batch score multiple prospects efficiently
 */
export const scoreProspectsBatch = async (prospects: Prospect[], niche: string): Promise<Map<string, ProspectScore>> => {
  const scores = new Map<string, ProspectScore>();

  // First, apply local scores immediately for all
  prospects.forEach(p => {
    const localScore = calculateLocalScore(p);
    scores.set(p.id, {
      score: localScore,
      reasoning: "Quick score based on key indicators.",
      urgency: localScore >= 70 ? 'hot' : localScore >= 50 ? 'warm' : 'cold',
      suggestedApproach: "Standard outreach recommended."
    });
  });

  // Then, for top 5 prospects only, get detailed AI analysis (to save API costs)
  const topProspects = [...prospects]
    .sort((a, b) => calculateLocalScore(b) - calculateLocalScore(a))
    .slice(0, 5);

  for (const prospect of topProspects) {
    const aiScore = await scoreProspect(prospect, niche);
    scores.set(prospect.id, aiScore);
  }

  return scores;
};
