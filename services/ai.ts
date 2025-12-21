
import { GoogleGenAI } from "@google/genai";

// Lazy initialization prevents top-level crashes if env vars are missing
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("NEXA SYSTEM WARNING: API Key not found. AI features will be offline.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

export const getCrewChiefAdvice = async (context: string, stats: any): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "COMM LINK OFFLINE: CHECK API CONFIGURATION";

  try {
    const prompt = `
      You are NEXA, an AI Crew Chief for a futuristic high-speed racing team. 
      The user is a driver named Ahtesham (or Salman).
      Keep responses short (under 50 words), hype-filled, and technical.
      
      Current Context: ${context}
      Stats: Speed ${stats.speed}km/h, Score: ${stats.score}.
      
      Give strategic advice or motivation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    
    return response.text || "Systems operational. Drive fast.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Connection to HQ unstable. Maintain current trajectory.";
  }
};

export const getCarAnalysis = async (config: any): Promise<string> => {
   const ai = getAiClient();
   if (!ai) return "ANALYSIS UNAVAILABLE";

   try {
    const prompt = `
      Analyze this car configuration for a cyberpunk racing game:
      Color: ${config.color}
      Rims: ${config.rimColor}
      Spoiler: ${config.spoiler ? 'Yes' : 'No'}
      Neon: ${config.neon ? 'Active' : 'Inactive'}

      Rate the "Aesthetics" and "Aerodynamics" out of 10 and give a one sentence comment.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "Configuration analysis complete. Vehicle ready.";
   } catch (error) {
     return "Analysis offline.";
   }
}
