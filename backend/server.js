require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });
const mysql = require('mysql2/promise');
const { createApp } = require('./app');
const { createFinanceAI } = require('./finance-ai');
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: 'ip_std6730202092', port: process.env.DB_PORT || 3306,
  waitForConnections: true, connectionLimit: 10, timezone: '+07:00', dateStrings: true,
});
async function start() {
  // Validate existing finance tables only; never create or alter the database.
  for (const table of ['users', 'categories', 'incomes', 'expenses', 'budgets', 'saving_goals', 'ai_insights']) {
    await pool.query(`SELECT 1 FROM ${table} LIMIT 0`);
  }
  const financeAI = process.env.OPENAI_API_KEY?.trim()
    ? createFinanceAI({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-6-luna' }) : null;
  const app = createApp({ pool, jwtSecret: process.env.JWT_SECRET || undefined, financeAI });
  const port = Number(process.env.PORT || 3012);
  app.listen(port, '0.0.0.0', () => console.log(`Student Finance API listening on ${port}`));
}
start().catch(async error => {
  console.error('Cannot start Student Finance API:', error.code || error.message);
  await pool.end();
  process.exitCode = 1;
});
