const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { ApiError, text, id, money, date, monthRange } = require('./validation');
const profile = u => ({ id: u.user_id, name: u.full_name, email: u.email,
  baseMonthlyIncome: Number(u.monthly_income), monthlyBudgetGoal: Number(u.monthly_budget) });

function createApp({ pool, jwtSecret = crypto.randomBytes(32).toString('hex'), financeAI = null }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  const route = fn => async (req, res, next) => { try { await fn(req, res, next); } catch (e) { next(e); } };
  const credential = password => crypto.createHash('sha256').update(password).digest('hex');
  const token = u => jwt.sign({ credential: credential(u.password) }, jwtSecret, { subject: String(u.user_id), expiresIn: '7d', audience: 'student-finance', issuer: 'student-finance-api' });
  async function transaction(userId, fn, allocationTable = null) {
    const connection = await pool.getConnection();
    let lockHeld = false, begun = false;
    try {
      // A named lock is shared by all API processes using this database.
      // Hold it through commit so manual IDs work without schema changes.
      if (allocationTable) {
        const [locks] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':finance-id-', ?), 10) AS acquired", [allocationTable]);
        if (Number(locks[0].acquired) !== 1) throw new ApiError(503, 'ระบบกำลังบันทึกข้อมูล กรุณาลองใหม่');
        lockHeld = true;
      }
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction(); begun = true;
      let user;
      if (userId !== null) {
        const [users] = await connection.query('SELECT * FROM users WHERE user_id = ? FOR UPDATE', [userId]);
        if (!users.length) throw new ApiError(401, 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
        user = users[0];
      }
      const result = await fn(connection, user);
      await connection.commit(); begun = false;
      return result;
    } catch (error) { if (begun) await connection.rollback(); throw error; }
    finally {
      let reusable = true;
      if (lockHeld) {
        try { await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':finance-id-', ?))", [allocationTable]); }
        catch { reusable = false; connection.destroy(); }
      }
      if (reusable) connection.release();
    }
  }
  async function nextId(connection, table, column) {
    // Identifiers only come from the two fixed call sites below, never user input.
    const [rows] = await connection.query(`SELECT COALESCE(MAX(${column}), 0) + 1 AS next_id FROM ${table}`);
    return id(rows[0].next_id);
  }
  async function category(connection, categoryId, expectedType) {
    const [rows] = await connection.query('SELECT * FROM categories WHERE category_id = ? FOR UPDATE', [id(categoryId)]);
    if (!rows.length) throw new ApiError(404, 'ไม่พบหมวดหมู่');
    if (rows[0].category_type !== expectedType) throw new ApiError(400, 'ประเภทหมวดหมู่ไม่ตรงกับรายการ');
    return rows[0];
  }
  app.get('/api', (req, res) => res.json({ name: 'Student Finance API' }));
  app.post('/api/auth/register', route(async (req, res) => {
    const name = text(req.body?.name, 'ชื่อ', 100);
    const email = text(req.body?.email, 'อีเมล', 150).toLowerCase();
    const password = req.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'อีเมลไม่ถูกต้อง');
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) throw new ApiError(400, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์');
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await transaction(null, async c => {
      const userId = await nextId(c, 'users', 'user_id');
      await c.query('INSERT INTO users (user_id, full_name, email, password, monthly_income, monthly_budget, created_at) VALUES (?, ?, ?, ?, 0, 0, NOW())', [userId, name, email, hashedPassword]);
      return userId;
    }, 'users');
    const user = { user_id: userId, full_name: name, email, password: hashedPassword, monthly_income: 0, monthly_budget: 0 };
    res.status(201).json({ token: token(user), user: profile(user) });
  }));
  app.post('/api/auth/login', route(async (req, res) => {
    const email = text(req.body?.email, 'อีเมล', 150).toLowerCase();
    const password = req.body?.password;
    if (typeof password !== 'string' || !password) throw new ApiError(400, 'กรอกรหัสผ่าน');
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!users.length || !await bcrypt.compare(password, users[0].password)) throw new ApiError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    res.json({ token: token(users[0]), user: profile(users[0]) });
  }));
  app.use('/api', route(async (req, res, next) => {
    let payload;
    try {
      payload = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), jwtSecret,
        { audience: 'student-finance', issuer: 'student-finance-api' });
      req.userId = id(payload.sub);
    } catch { throw new ApiError(401, 'กรุณาเข้าสู่ระบบใหม่'); }
    const [users] = await pool.query('SELECT user_id, password FROM users WHERE user_id = ?', [req.userId]);
    if (!users.length || payload.credential !== credential(users[0].password)) throw new ApiError(401, 'กรุณาเข้าสู่ระบบใหม่');
    next();
  }));
  app.get('/api/users/me', route(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.userId]);
    if (!rows.length) throw new ApiError(401, 'ไม่พบบัญชีผู้ใช้');
    res.json(profile(rows[0]));
  }));
  app.put('/api/users/me', route(async (req, res) => {
    const updated = await transaction(req.userId, async (c, u) => {
      const income = money(req.body?.baseMonthlyIncome ?? u.monthly_income, true);
      const budget = money(req.body?.monthlyBudgetGoal ?? u.monthly_budget, true);
      await c.query('UPDATE users SET monthly_income = ?, monthly_budget = ? WHERE user_id = ?', [income, budget, req.userId]);
      return profile({ ...u, monthly_income: income, monthly_budget: budget });
    });
    res.json(updated);
  }));
  app.delete('/api/users/me', route(async (req, res) => {
    await transaction(req.userId, async c => {
      for (const table of ['incomes', 'expenses', 'budgets', 'saving_goals', 'ai_insights']) {
        const [refs] = await c.query(`SELECT 1 FROM ${table} WHERE user_id = ? LIMIT 1`, [req.userId]);
        if (refs.length) throw new ApiError(409, 'บัญชีนี้มีข้อมูลอ้างอิงอยู่ ไม่สามารถลบได้');
      }
      await c.query('DELETE FROM users WHERE user_id = ?', [req.userId]);
    });
    res.json({ success: true });
  }));
  app.get('/api/categories', route(async (req, res) => {
    const type = req.query.type;
    if (type !== undefined && !['income', 'expense'].includes(type)) throw new ApiError(400, 'ประเภทหมวดหมู่ไม่ถูกต้อง');
    const [rows] = await pool.query(`SELECT category_id AS id, category_name AS name, category_type AS type, icon FROM categories ${type ? 'WHERE category_type = ?' : ''} ORDER BY category_id`, type ? [type] : []);
    res.json(rows);
  }));
  app.post('/api/categories', route(async (req, res) => {
    const name = text(req.body?.name, 'ชื่อหมวดหมู่', 50);
    const type = req.body?.type;
    const icon = text(req.body?.icon ?? '💰', 'ไอคอน', 20);
    if (!['income', 'expense'].includes(type)) throw new ApiError(400, 'ประเภทหมวดหมู่ไม่ถูกต้อง');
    const result = await transaction(req.userId, async c => {
      const [existing] = await c.query('SELECT category_id AS id, category_name AS name, category_type AS type, icon FROM categories WHERE category_name = ? AND category_type = ? LIMIT 1 FOR UPDATE', [name, type]);
      if (existing.length) return existing[0];
      const categoryId = await nextId(c, 'categories', 'category_id');
      await c.query('INSERT INTO categories (category_id, category_name, category_type, icon, created_at) VALUES (?, ?, ?, ?, NOW())', [categoryId, name, type, icon]);
      return { id: categoryId, name, type, icon };
    }, 'categories');
    res.status(201).json(result);
  }));
  // Categories in the supplied schema are shared. Deletion requires recent password verification.
  app.delete('/api/categories/:id', route(async (req, res) => {
    const categoryId = id(req.params.id);
    await transaction(req.userId, async (c, u) => {
      if (typeof req.body?.password !== 'string' || !await bcrypt.compare(req.body.password, u.password)) throw new ApiError(403, 'กรอกรหัสผ่านเพื่อยืนยันการลบหมวดหมู่ส่วนกลาง');
      const [rows] = await c.query('SELECT category_id FROM categories WHERE category_id = ? FOR UPDATE', [categoryId]);
      if (!rows.length) throw new ApiError(404, 'ไม่พบหมวดหมู่');
      for (const table of ['incomes', 'expenses', 'budgets']) {
        const [refs] = await c.query(`SELECT 1 FROM ${table} WHERE category_id = ? LIMIT 1`, [categoryId]);
        if (refs.length) throw new ApiError(409, 'หมวดหมู่นี้มีการใช้งานอยู่ ไม่สามารถลบได้');
      }
      await c.query('DELETE FROM categories WHERE category_id = ?', [categoryId]);
    });
    res.json({ success: true });
  }));

  for (const kind of ['income', 'expense']) {
    const table = kind === 'income' ? 'incomes' : 'expenses';
    const key = `${kind}_id`, dateColumn = `${kind}_date`;
    app.get(`/api/${kind}`, route(async (req, res) => {
      const range = monthRange(req.query.month);
      let where = `t.user_id = ? AND t.${dateColumn} >= ? AND t.${dateColumn} < ?`;
      const args = [req.userId, range.start, range.end];
      if (req.query.category) { where += ' AND c.category_name = ?'; args.push(text(req.query.category, 'หมวดหมู่', 50)); }
      if (req.query.from) { where += ` AND t.${dateColumn} >= ?`; args.push(date(req.query.from)); }
      if (req.query.to) { where += ` AND t.${dateColumn} <= ?`; args.push(date(req.query.to)); }
      if (req.query.q) { where += ' AND (t.description LIKE ? OR c.category_name LIKE ?)'; const q = `%${text(req.query.q, 'คำค้น', 255)}%`; args.push(q, q); }
      const [rows] = await pool.query(`SELECT t.${key} AS id, t.category_id AS categoryId, c.category_name AS ${kind === 'income' ? 'type' : 'category'}, t.amount, DATE_FORMAT(t.${dateColumn}, '%Y-%m-%d') AS date, t.description AS note FROM ${table} t JOIN categories c ON c.category_id = t.category_id WHERE ${where} ORDER BY t.${dateColumn} DESC, t.${key} DESC`, args);
      res.json(rows.map(row => ({ ...row, amount: Number(row.amount) })));
    }));
    const save = updating => route(async (req, res) => {
      const itemId = updating ? id(req.params.id) : null;
      const amount = money(req.body?.amount);
      const itemDate = date(req.body?.date);
      const note = text(req.body?.note, 'รายละเอียด', 255, true);
      const result = await transaction(req.userId, async c => {
        const cat = await category(c, req.body?.categoryId, kind);
        if (updating) {
          const [existing] = await c.query(`SELECT ${key} FROM ${table} WHERE ${key} = ? AND user_id = ? FOR UPDATE`, [itemId, req.userId]);
          if (!existing.length) throw new ApiError(404, 'ไม่พบรายการ');
          await c.query(`UPDATE ${table} SET category_id = ?, amount = ?, ${dateColumn} = ?, description = ? WHERE ${key} = ? AND user_id = ?`, [cat.category_id, amount, itemDate, note, itemId, req.userId]);
          return itemId;
        }
        const [insert] = await c.query(`INSERT INTO ${table} (user_id, category_id, amount, ${dateColumn}, description) VALUES (?, ?, ?, ?, ?)`, [req.userId, cat.category_id, amount, itemDate, note]);
        return insert.insertId;
      });
      res.status(updating ? 200 : 201).json({ id: result, success: true });
    });
    app.post(`/api/${kind}`, save(false));
    app.put(`/api/${kind}/:id`, save(true));
    app.delete(`/api/${kind}/:id`, route(async (req, res) => {
      const itemId = id(req.params.id);
      await transaction(req.userId, async c => {
        const [result] = await c.query(`DELETE FROM ${table} WHERE ${key} = ? AND user_id = ?`, [itemId, req.userId]);
        if (!result.affectedRows) throw new ApiError(404, 'ไม่พบรายการ');
      });
      res.json({ success: true });
    }));
  }

  async function summary(userId, selectedMonth) {
    const range = monthRange(selectedMonth);
    const [year, month] = range.month.split('-').map(Number);
    const previous = monthRange(`${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`);
    async function totals(r) {
      const [rows] = await pool.query(`SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = ? AND income_date >= ? AND income_date < ?) AS income,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date < ?) AS expense`, [userId, r.start, r.end, userId, r.start, r.end]);
      return { income: Number(rows[0].income), expense: Number(rows[0].expense) };
    }
    const current = await totals(range), last = await totals(previous);
    const [categories] = await pool.query(`SELECT c.category_name AS category, SUM(e.amount) AS amount FROM expenses e JOIN categories c ON c.category_id = e.category_id WHERE e.user_id = ? AND e.expense_date >= ? AND e.expense_date < ? GROUP BY c.category_name ORDER BY amount DESC`, [userId, range.start, range.end]);
    const [trend] = await pool.query(`SELECT DATE_FORMAT(expense_date, '%Y-%m-%d') AS date, SUM(amount) AS amount FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date < ? GROUP BY expense_date ORDER BY expense_date`, [userId, range.start, range.end]);
    const expenseByCategory = categories.map(row => ({ ...row, amount: Number(row.amount) }));
    return { balance: Number((current.income - current.expense).toFixed(2)), totalIncome: current.income, totalExpense: current.expense,
      expenseByCategory, topCategory: expenseByCategory[0] || { category: 'ยังไม่มีรายจ่าย', amount: 0 },
      trend: trend.map(row => ({ ...row, amount: Number(row.amount) })),
      vsLastMonth: { incomeDelta: Number((current.income - last.income).toFixed(2)), expenseDelta: Number((current.expense - last.expense).toFixed(2)) } };
  }
  app.get('/api/dashboard/summary', route(async (req, res) => res.json(await summary(req.userId, req.query.month))));
  async function budget(userId, selectedMonth) {
    const range = monthRange(selectedMonth);
    const [goals] = await pool.query(`SELECT goal_id AS id, goal_name AS name, target_amount AS target, DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(target_date, '%Y-%m-%d') AS deadline FROM saving_goals WHERE user_id = ? ORDER BY goal_id DESC LIMIT 1`, [userId]);
    let savingGoal = null;
    if (goals.length) {
      const goal = goals[0];
      savingGoal = { ...goal, target: Number(goal.target), saved: null };
    }
    const [rows] = await pool.query(`SELECT b.budget_id AS id, b.category_id AS categoryId, c.category_name AS category, b.budget_amount AS amount_limit,
      (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.user_id = b.user_id AND e.category_id = b.category_id AND e.expense_date >= ? AND e.expense_date < ?) AS spent
      FROM budgets b JOIN categories c ON c.category_id = b.category_id WHERE b.user_id = ? AND b.budget_month = ? ORDER BY b.category_id`, [range.start, range.end, userId, range.start]);
    return { savingGoal, categoryBudgets: rows.map(row => ({ id: row.id, categoryId: row.categoryId, category: row.category, limit: Number(row.amount_limit), spent: Number(row.spent) })) };
  }
  app.get('/api/budget', route(async (req, res) => res.json(await budget(req.userId, req.query.month))));
  app.post('/api/budget/category', route(async (req, res) => {
    const range = monthRange(req.body?.month);
    const limit = money(req.body?.limit);
    await transaction(req.userId, async c => {
      const cat = await category(c, req.body?.categoryId, 'expense');
      const [existing] = await c.query('SELECT budget_id FROM budgets WHERE user_id = ? AND category_id = ? AND budget_month = ? FOR UPDATE', [req.userId, cat.category_id, range.start]);
      if (existing.length) await c.query('UPDATE budgets SET budget_amount = ? WHERE user_id = ? AND category_id = ? AND budget_month = ?', [limit, req.userId, cat.category_id, range.start]);
      else await c.query('INSERT INTO budgets (user_id, category_id, budget_month, budget_amount) VALUES (?, ?, ?, ?)', [req.userId, cat.category_id, range.start, limit]);
    });
    res.json({ success: true });
  }));
  app.post('/api/budget/saving-goal', route(async (req, res) => {
    const name = text(req.body?.name, 'ชื่อเป้าหมาย', 100);
    const target = money(req.body?.target);
    const start = date(req.body?.startDate), deadline = date(req.body?.deadline);
    if (deadline < start) throw new ApiError(400, 'วันครบกำหนดต้องไม่ก่อนวันเริ่มต้น');
    const goalId = await transaction(req.userId, async c => {
      const [result] = await c.query('INSERT INTO saving_goals (user_id, goal_name, target_amount, start_date, target_date) VALUES (?, ?, ?, ?, ?)', [req.userId, name, target, start, deadline]);
      return result.insertId;
    });
    res.status(201).json({ id: goalId, success: true });
  }));
  app.post('/api/ai/insights', route(async (req, res) => {
    // Always calculate from authenticated database records; never trust client totals.
    const month = monthRange(req.body?.month).month;
    const data = await summary(req.userId, month), limits = await budget(req.userId, month);
    let insights = [];
    let source = "rules";
    let message = "ยังไม่ได้ตั้งค่า AI แสดงสรุปจากกฎแทน";
    if (data.totalIncome || data.totalExpense) {
      insights.push({ type: 'summary', text: `เดือน ${month} มีรายรับ ${data.totalIncome.toLocaleString('th-TH')} บาท รายจ่าย ${data.totalExpense.toLocaleString('th-TH')} บาท และคงเหลือสุทธิ ${data.balance.toLocaleString('th-TH')} บาท` });
      if (data.balance < 0) insights.push({ type: 'warning', text: 'รายจ่ายมากกว่ารายรับ ลองทบทวนรายการที่ลดได้และกำหนดงบรายหมวด' });
      for (const b of limits.categoryBudgets) if (b.spent > b.limit) insights.push({ type: 'budget', text: `หมวด ${b.category} ใช้เกินงบ ${(b.spent - b.limit).toFixed(2)} บาท` });
    }
    if (financeAI && (data.totalIncome || data.totalExpense)) {
      try {
        insights = await financeAI.generate({ userId: req.userId, month, summary: data, budget: limits });
        source = 'openai'; message = 'คำแนะนำจาก AI โดยใช้ข้อมูลสรุปของคุณ';
      } catch {
        message = 'AI ยังไม่พร้อมใช้งาน แสดงสรุปจากกฎแทน';
      }
    } else if (!data.totalIncome && !data.totalExpense) {
      message = 'ยังไม่มีรายการรายรับหรือรายจ่ายสำหรับเดือนนี้';
    }
    const saved = await transaction(req.userId, async c => {
      const result = [];
      for (const insight of insights) {
        const [existing] = await c.query('SELECT insight_id FROM ai_insights WHERE user_id = ? AND title = ? AND content = ? AND insight_type = ? LIMIT 1', [req.userId, `สรุปการเงิน ${month}`, insight.text, insight.type]);
        if (existing.length) { result.push({ ...insight, id: existing[0].insight_id }); continue; }
        const [row] = await c.query('INSERT INTO ai_insights (user_id, title, content, insight_type) VALUES (?, ?, ?, ?)', [req.userId, `สรุปการเงิน ${month}`, insight.text, insight.type]);
        result.push({ ...insight, id: row.insertId });
      }
      return result;
    });
    res.json({ insights: saved, source, message, model: source === 'openai' ? financeAI.model : null });
  }));
  app.use((req, res) => res.status(404).json({ message: 'ไม่พบเส้นทางที่ร้องขอ' }));
  app.use((error, req, res, next) => {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'อีเมลหรือข้อมูลนี้มีอยู่แล้ว' });
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'ข้อมูลที่ส่งมีขนาดใหญ่เกินไป' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง' });
    console.error('Finance API error:', error.code || error.message);
    res.status(500).json({ message: 'ระบบไม่สามารถดำเนินการได้ กรุณาลองใหม่' });
  });
  return app;
}
module.exports = { createApp };
