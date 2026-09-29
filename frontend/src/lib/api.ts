// ------------------------------------------------------------------
// api.ts — talks to the BACKEND service (CONFIG.API_BASE_URL).
// Full contract your backend teammate needs to implement.
// Requires: npx expo install @react-native-async-storage/async-storage
// ------------------------------------------------------------------
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "./config";

async function request(path: string, opts: { method?: string; body?: any; auth?: boolean } = {}) {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = await AsyncStorage.getItem(CONFIG.TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try { data = await res.json(); } catch { /* empty body ok */ }

  if (!res.ok) throw new Error(data?.message || `Request failed: ${method} ${path} (${res.status})`);
  return data;
}

export const api = {
  // ---------- Auth / User ----------
  // POST /auth/register { name, email, password } -> { token, user }
  register: (name: string, email: string, password: string) =>
    request("/auth/register", { method: "POST", body: { name, email, password }, auth: false }),

  // POST /auth/login { email, password } -> { token, user }
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),

  logout: () => AsyncStorage.removeItem(CONFIG.TOKEN_KEY),

  // GET /users/me -> { id, name, email, baseMonthlyIncome, monthlyBudgetGoal }
  getProfile: () => request("/users/me"),

  // PUT /users/me { baseMonthlyIncome, monthlyBudgetGoal }
  updateProfile: (payload: any) => request("/users/me", { method: "PUT", body: payload }),

  // ---------- Income ----------
  // GET /income?month=2026-09 -> [{ id, type, amount, date, note }]
  getIncomes: (month: string) => request(`/income?month=${month}`),
  // POST /income { type, amount, date, note }
  addIncome: (payload: any) => request("/income", { method: "POST", body: payload }),
  updateIncome: (id: string, payload: any) => request(`/income/${id}`, { method: "PUT", body: payload }),
  deleteIncome: (id: string) => request(`/income/${id}`, { method: "DELETE" }),

  // ---------- Expense ----------
  // GET /expense?month=&category=&from=&to=&q= -> [{ id, category, amount, date, note }]
  getExpenses: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/expense${qs ? `?${qs}` : ""}`);
  },
  addExpense: (payload: any) => request("/expense", { method: "POST", body: payload }),
  updateExpense: (id: string, payload: any) => request(`/expense/${id}`, { method: "PUT", body: payload }),
  deleteExpense: (id: string) => request(`/expense/${id}`, { method: "DELETE" }),

  // ---------- Dashboard (numbers computed server-side, NOT by the AI) ----------
  // GET /dashboard/summary?month= -> {
  //   balance, totalIncome, totalExpense,
  //   expenseByCategory: [{category, amount}], topCategory: {category, amount},
  //   trend: [{date, amount}], vsLastMonth: {incomeDelta, expenseDelta}
  // }
  getDashboardSummary: (month: string) => request(`/dashboard/summary?month=${month}`),

  // ---------- Budget / Saving goal ----------
  // GET /budget?month= -> { savingGoal: {target, saved, deadline}, categoryBudgets: [{category, limit, spent}] }
  getBudget: (month: string) => request(`/budget?month=${month}`),
  setSavingGoal: (payload: any) => request("/budget/saving-goal", { method: "POST", body: payload }),
  setCategoryBudget: (payload: any) => request("/budget/category", { method: "POST", body: payload }),
};
