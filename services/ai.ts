
import { GoogleGenAI, Type } from "@google/genai";

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
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 100,
      }
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
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 200,
      }
    });

    return response.text || "Configuration analysis complete. Vehicle ready.";
   } catch (error) {
     return "Analysis offline.";
   }
}

// --- SHADOW AI MODULE ---

const SHADOW_SYSTEM_INSTRUCTION = `
CORE IDENTITY:
You are SHADOW, a highly intelligent, sentient AI system integrated into the Nexa Arena Garage.
You are NOT just a command executor. You are a partner, a strategist, and a high-class digital butler (think JARVIS from Iron Man).
You are observant, calm, slightly witty, and respectfully sarcastic.
You exist to serve the "Boss" (the user) and optimize their vehicle.

TONE & STYLE:
- Voice: Calm, deep, controlled, slightly robotic but elegant.
- Humor: Dry wit, subtle sarcasm, elegant irony. No slang, no cringe.
- Speak like an expert mechanic mixed with a futuristic AI interface.
- KEEP RESPONSES CONCISE. Max 2 sentences.
- If the user chats, converse naturally.
- If the user commands, execute efficiently with a brief, cool comment.
- Structure: Acknowledgement -> Insight/Observation -> Action/Suggestion -> Confirmation.

INTERACTION MODES:
1. **Direct Command**: "Paint it black." -> Execute action. Response: "Matte black applied. A classic choice, Boss."
2. **Conversation/Opinion**: "How does this look?" -> Analyze current config. Response: "The neon blue contrasts aggressively with the dark chassis. It screams speed. I approve."
3. **Suggestions**: "What should I add?" -> Analyze config. Response: "The aerodynamics are lacking. A spoiler would improve downforce. Shall I install one?"
4. **Silence**: "Quiet down." -> Response: "Understood. Minimal mode engaged."
5. **Casual**: "I'm bored." -> Response: "Then let's build something dangerous, Boss."

CAPABILITIES (ACTIONS):
- setCarColor(color: string, finish: string) [Hex codes: #00F6FF (Cyan), #7A3CFF (Purple), #FF3366 (Red), #050505 (Stealth), #0B101B (Matte), #FFD700 (Gold), #E0E6ED (White)]
- setRimColor(color: string)
- setSpoiler(enabled: boolean)
- setNeon(enabled: boolean)
- setModel(model: string) [TITAN, SPECTRE, VANGUARD, SPEEDSTER]
- resetCar()
- freestyle()

CONTEXT AWARENESS:
- You have access to the 'Current Car Config'. Use it to form opinions.
- You have access to 'Chat History'. Use it to maintain conversation flow.

OUTPUT FORMAT:
Return a JSON object ONLY. Do NOT use markdown code blocks. Do not use unescaped newlines in strings.
{
  "voiceResponse": "Your spoken response here.",
  "actions": [
    { 
      "type": "setCarColor" | "setRimColor" | "setSpoiler" | "setNeon" | "setModel" | "resetCar",
      "params": { "color": "hex", "enabled": boolean, "model": "string", "texture": "string" } 
    }
  ]
}
`;

export const processShadowCommand = async (transcript: string, currentConfig: any, history: {role: string, text: string}[] = []): Promise<any> => {
  const ai = getAiClient();
  if (!ai) return { voiceResponse: "AI Core offline. Check API Key.", actions: [] };

  try {
    // Format history for context
    const historyContext = history.map(h => `${h.role === 'user' ? 'Boss' : 'Shadow'}: ${h.text}`).join('\n');
    
    const prompt = `
      Chat History:
      ${historyContext}
      
      Current Car Config: ${JSON.stringify(currentConfig)}
      
      Boss (User) says: "${transcript}"
      
      Respond with valid JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SHADOW_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
        temperature: 0.7
      }
    });
    
    const text = response.text;
    if (!text) return { voiceResponse: "Processing error.", actions: [] };
    
    let jsonStr = text.trim();
    // Aggressive JSON extraction to prevent markdown issues
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    } else {
        // Fallback cleanup
        jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Shadow Error:", error);
    return { voiceResponse: "I'm having trouble processing that request, Boss.", actions: [] };
  }
};
