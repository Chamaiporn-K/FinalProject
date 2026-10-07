require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const mysql = require('mysql2/promise');
const { createApp } = require('./app');
const { createFinanceAI } = require('./finance-ai');
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: process.env.DB_PORT || 3306,
  waitForConnections: true, connectionLimit: 10, timezone: '+07:00', dateStrings: true,
});
async function start() {
  // Validate existing finance tables only; never create or alter the database.
  for (const table of ['users', 'categories', 'incomes', 'expenses', 'budgets', 'saving_goals', 'ai_insights']) {
    await pool.query(`SELECT 1 FROM ${table} LIMIT 0`);
  }
  const financeAI = process.env.AI_PROVIDER === 'ollama'
    ? createFinanceAI({ provider: 'ollama', model: process.env.OLLAMA_MODEL || 'llama3.2:3b', baseUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434' })
    : process.env.AI_PROVIDER === 'groq' && process.env.GROQ_API_KEY?.trim()
      ? createFinanceAI({ provider: 'groq', apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b' })
      : process.env.GEMINI_API_KEY?.trim()
    ? createFinanceAI({ provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' })
    : process.env.OPENAI_API_KEY?.trim()
      ? createFinanceAI({ provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4.1-mini' }) : null;
  const app = createApp({ pool, jwtSecret: process.env.JWT_SECRET || undefined, financeAI });
  const port = Number(process.env.PORT || 3012);
  app.listen(port, '0.0.0.0', () => console.log(`Student Finance API listening on ${port}`));
}
start().catch(async error => {
  console.error('Cannot start Student Finance API:', error.code || error.message);
  await pool.end();
  process.exitCode = 1;
});
