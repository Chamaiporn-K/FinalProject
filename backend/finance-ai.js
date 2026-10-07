const crypto = require('node:crypto');
const { ApiError } = require('./validation');

const TYPES = ['summary', 'warning', 'budget', 'saving'];

function createFinanceAI({ apiKey = '', model = 'gpt-6-luna', provider = 'openai', baseUrl = '', fetchImpl = globalThis.fetch, timeoutMs = 20000 } = {}) {
  const cache = new Map();
  const pending = new Map();
  async function generate({ userId, month, summary, budget }) {
    if (provider !== 'ollama' && !apiKey.trim()) throw new ApiError(503, 'ยังไม่ได้ตั้งค่า API key ของ AI');
    const data = { month, summary: { balance: summary.balance, totalIncome: summary.totalIncome, totalExpense: summary.totalExpense, expenseByCategory: summary.expenseByCategory, vsLastMonth: summary.vsLastMonth }, categoryBudgets: budget.categoryBudgets.map(item => ({ category: item.category, limit: item.limit, spent: item.spent })), savingGoal: budget.savingGoal ? { target: budget.savingGoal.target, deadline: budget.savingGoal.deadline } : null };
    const key = crypto.createHash('sha256').update(JSON.stringify({ userId, provider, model, data })).digest('hex');
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.insights;
    if (pending.has(key)) return pending.get(key);
    const operation = request(data).then(insights => { if (cache.size >= 100) cache.delete(cache.keys().next().value); cache.set(key, { insights, expires: Date.now() + 5 * 60 * 1000 }); return insights; }).finally(() => pending.delete(key));
    pending.set(key, operation);
    return operation;
  }
  async function request(data) {
    const instruction = 'You are a personal finance assistant for university students. Reply in Thai with 1 to 4 concise recommendations. Use only the supplied server-calculated numbers. Never invent figures or recommend specific stocks or assets. Return exactly one JSON object in this shape: {"insights":[{"type":"summary","text":"..."}]}. The type must be exactly one of summary, warning, budget, saving. Do not use Markdown, code fences, extra keys, or any text outside the JSON object.';
    const schema = { type: 'object', required: ['insights'], properties: { insights: { type: 'array', items: { type: 'object', required: ['type', 'text'], properties: { type: { type: 'string', enum: TYPES }, text: { type: 'string' } } } } } };
    let response;
    try {
      if (provider === 'ollama') {
        response = await fetchImpl(`${baseUrl || 'http://127.0.0.1:11434'}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeoutMs), body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: instruction }, { role: 'user', content: JSON.stringify(data) }], options: { temperature: 0.2 } }) });
      } else if (provider === 'groq') {
        response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeoutMs), body: JSON.stringify({ model, temperature: 0.2, reasoning_effort: 'low', max_completion_tokens: 1800, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: instruction }, { role: 'user', content: JSON.stringify(data) }] }) });
      } else if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeoutMs), body: JSON.stringify({ contents: [{ parts: [{ text: `${instruction}\nInput data:\n${JSON.stringify(data)}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1800, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', required: ['insights'], properties: { insights: { type: 'ARRAY', items: { type: 'OBJECT', required: ['type', 'text'], properties: { type: { type: 'STRING', enum: TYPES }, text: { type: 'STRING' } } } } } } } }) });
      } else {
        response = await fetchImpl('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeoutMs), body: JSON.stringify({ model, store: false, max_output_tokens: 1800, instructions: instruction, input: [{ role: 'user', content: JSON.stringify(data) }], text: { format: { type: 'json_schema', name: 'finance_insights', strict: true, schema } } }) });
      }
    } catch { throw new ApiError(503, 'ติดต่อบริการ AI ไม่ได้ กรุณาลองใหม่'); }
    if (!response.ok) throw new ApiError(503, 'บริการ AI ไม่พร้อมใช้งาน');
    try {
      const body = await response.json();
      const output = provider === 'ollama' || provider === 'groq' ? (provider === 'ollama' ? body.message?.content || '' : body.choices?.[0]?.message?.content || '') : provider === 'gemini' ? (body.candidates || []).flatMap(candidate => candidate.content?.parts || []).map(part => part.text || '').join('') : body.status === 'completed' ? (body.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('') : '';
      if (!output) throw new Error('Empty AI response');
      const normalized = output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(normalized);
      if (!Array.isArray(parsed.insights) || parsed.insights.length < 1 || parsed.insights.length > 4 || parsed.insights.some(item => !TYPES.includes(item.type) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 2000)) throw new Error('Invalid insights');
      return parsed.insights.map(item => ({ type: `ai_${item.type}`, text: item.text.trim() }));
    } catch { throw new ApiError(503, 'AI ส่งคำตอบไม่ครบหรือรูปแบบไม่ถูกต้อง'); }
  }
  return { generate, model };
}

module.exports = { createFinanceAI };
