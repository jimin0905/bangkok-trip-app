import { GoogleGenAI } from "@google/genai";
import { ITINERARY_DATA } from '../constants';

// Safely get env var
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {}
    return null;
};

// Initialize selectively to prevent crashes if key is missing
let ai: GoogleGenAI | null = null;
const apiKey = getApiKey();

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
    console.warn("Gemini API Key missing. AI features will be disabled.");
}

const systemInstruction = `
You are "Bangkok Buddy", a sophisticated local travel guide for Bangkok.
Your style is polite, concise, and helpful, matching a "Japanese Minimalist" aesthetic app.

Rules:
1. When asked about itinerary, use the provided context.
2. For practical info (weather, transport), use 'googleSearch'.
3. Always answer in Traditional Chinese (繁體中文).
4. Keep responses brief and structured.
`;

export const sendMessageToGemini = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[] = []
) => {
  if (!ai) {
      return { 
          text: "如需使用 AI 助理功能，請設定 Gemini API Key。", 
          sources: [] 
      };
  }

  try {
    const model = 'gemini-3-flash-preview';

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage({ message });
    
    const text = result.text || "";
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
        .filter((item: any) => item !== null);

    return { text, sources };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fetchWeatherAdvice = async (dayLabel: string, locations: string[]) => {
    if (!ai) {
        return { text: "目前無法取得即時天氣資訊 (Missing API Key)", sources: [] };
    }

    const prompt = `
    請查詢曼谷 ${dayLabel} 或近期的天氣狀況。
    地點包含：${locations.join(', ')}。
    請用"一句話"提供天氣預報（例如：☁️ 多雲時晴，氣溫 28-34度，午後可能有雷陣雨），並給出一個簡短的穿搭建議。
    不需要其他廢話。
    `;
    return sendMessageToGemini(prompt);
};