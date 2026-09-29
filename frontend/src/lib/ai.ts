// ------------------------------------------------------------------
// ai.ts — talks to the AI service (CONFIG.AI_API_BASE_URL), owned by
// your AI teammate. It only reasons over numbers the backend already
// computed — it never calculates totals itself.
// ------------------------------------------------------------------
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "./config";

async function aiRequest(path: string, body: any) {
  const token = await AsyncStorage.getItem(CONFIG.TOKEN_KEY);
  const res = await fetch(`${CONFIG.AI_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `AI request failed: ${path} (${res.status})`);
  return data;
}

export const ai = {
  // POST /ai/insights { month, dashboardSummary, budget } -> { insights: [{id, type, text}] }
  getInsights: (month: string, dashboardSummary: any, budget: any) =>
    aiRequest("/insights", { month, dashboardSummary, budget }),

  // POST /ai/chat { message, month } -> { reply }   (optional, for later)
  chat: (message: string, month: string) => aiRequest("/chat", { message, month }),
};
