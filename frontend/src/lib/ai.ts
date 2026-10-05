import { api } from "./api";
// All AI requests go through the authenticated Backend; no API key in the app.
export const ai = { getInsights: (month: string) => api.getInsights(month) };
