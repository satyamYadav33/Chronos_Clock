
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchTimeZone = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the IANA timezone and display name for: "${query}". Return the result as a single JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "City or Region name" },
            zone: { type: Type.STRING, description: "IANA Timezone string, e.g., Europe/London" },
            offset: { type: Type.STRING, description: "Current UTC offset, e.g., UTC+1" }
          },
          required: ["name", "zone", "offset"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini timezone search error:", error);
    return null;
  }
};

export const getZoneFact = async (zone: string, name: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a very short, one-sentence fun fact or interesting local information about the time/culture in ${name} (${zone}). Keep it under 15 words.`,
    });
    return response.text;
  } catch (error) {
    return null;
  }
};
