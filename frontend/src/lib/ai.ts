import { api } from "./api";
// Deterministic summaries from server records. A model can be connected later.
export const ai = { getInsights: (month: string) => api.getInsights(month) };
