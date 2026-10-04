const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const { createApp } = require('../app');
const { date, money, monthRange } = require('../validation');
const secret = 'finance-integration-test-secret';
const user = { user_id: 7, full_name: 'Student', email: 'test@example.com', monthly_income: '0.00', monthly_budget: '0.00', password: 'fixture-password-hash' };
const auth = jwt.sign({ credential: crypto.createHash('sha256').update(user.password).digest('hex') }, secret, { subject: '7', audience: 'student-finance', issuer: 'student-finance-api' });
async function fixture(t, handler = () => undefined) {
  const events = [];
  async function query(sql, args = []) {
    events.push({ sql, args });
    const custom = await handler(sql, args);
    if (custom !== undefined) return [custom];
    if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
    if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
    if (sql.includes('MAX(user_id)')) return [[{ next_id: 7 }]];
    if (sql.includes('MAX(category_id)')) return [[{ next_id: 8 }]];
    if (/^SET TRANSACTION/.test(sql)) return [[]];
    if (/^SELECT .* FROM users WHERE user_id/.test(sql)) return [[user]];
    if (/^SELECT \* FROM categories/.test(sql)) return [[{ category_id: 3, category_type: 'expense' }]];
    throw new Error('Unexpected query: ' + sql);
  }
  const connection = { query, beginTransaction: async () => events.push({ sql: 'BEGIN' }), commit: async () => events.push({ sql: 'COMMIT' }), rollback: async () => events.push({ sql: 'ROLLBACK' }), release: () => events.push({ sql: 'RELEASE' }) };
  const app = createApp({ pool: { query, getConnection: async () => connection }, jwtSecret: secret });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, body, method = 'POST', authenticated = true) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${auth}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }
  return { request, events };
}
const expense = { categoryId: 3, amount: 120.50, date: '2026-10-04', note: 'Lunch' };

test('rejects missing authentication before any query', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/expense', expense, 'POST', false)).status, 401);
  assert.equal(f.events.length, 0);
});
test('rejects tokens for deleted users', async t => {
  const f = await fixture(t, sql => sql.startsWith('SELECT user_id, password FROM users') ? [] : undefined);
  assert.equal((await f.request('/expense', expense)).status, 401);
});
test('validates dates, precision and month boundaries', () => {
  for (const value of ['2026-02-30', '2026-13-01', 'invalid', null]) assert.throws(() => date(value), e => e.status === 400);
  for (const value of [-1, 0, 1.001, NaN, Infinity, '', null, true]) assert.throws(() => money(value), e => e.status === 400);
  assert.equal(money('0', true), '0.00');
  assert.equal(date('2024-02-29'), '2024-02-29');
  assert.deepEqual(monthRange('2026-12'), { month: '2026-12', start: '2026-12-01', end: '2027-01-01' });
});
test('invalid amount never begins transaction', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/expense', { ...expense, amount: -10 })).status, 400);
  assert.ok(!f.events.some(e => e.sql === 'BEGIN'));
});
test('nonexistent category rolls back and never inserts', async t => {
  const f = await fixture(t, sql => sql.startsWith('SELECT * FROM categories') ? [] : undefined);
  assert.equal((await f.request('/expense', expense)).status, 404);
  assert.ok(f.events.some(e => e.sql === 'ROLLBACK'));
  assert.ok(!f.events.some(e => e.sql.startsWith('INSERT')));
});
test('income category cannot be used for expense', async t => {
  const f = await fixture(t, sql => sql.startsWith('SELECT * FROM categories') ? [{ category_id: 3, category_type: 'income' }] : undefined);
  assert.equal((await f.request('/expense', expense)).status, 400);
  assert.ok(!f.events.some(e => e.sql.startsWith('INSERT')));
});
test('writes authenticated owner and locks parents before insert', async t => {
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('INSERT INTO expenses')) { assert.deepEqual(args, [7, 3, '120.50', expense.date, 'Lunch']); return { insertId: 10 }; }
  });
  const result = await f.request('/expense', { ...expense, user_id: 999, userId: 999 });
  assert.equal(result.status, 201);
  assert.equal(result.body.id, 10);
  const locks = f.events.filter(e => e.sql.includes('FOR UPDATE'));
  assert.ok(locks[0].sql.includes('users'));
  assert.ok(locks[1].sql.includes('categories'));
  assert.ok(f.events.some(e => e.sql === 'COMMIT'));
});
test('cannot update a transaction owned by someone else', async t => {
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('SELECT expense_id')) { assert.deepEqual(args, [10, 7]); return []; }
  });
  assert.equal((await f.request('/expense/10', expense, 'PUT')).status, 404);
  assert.ok(!f.events.some(e => e.sql.startsWith('UPDATE')));
});
test('cannot delete a transaction owned by someone else', async t => {
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('DELETE FROM expenses')) { assert.deepEqual(args, [10, 7]); return { affectedRows: 0 }; }
  });
  assert.equal((await f.request('/expense/10', undefined, 'DELETE')).status, 404);
  assert.ok(f.events.some(e => e.sql === 'ROLLBACK'));
});
test('category deletion is blocked if any user references it', async t => {
  const password = 'test-password';
  const hash = await bcrypt.hash(password, 4);
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('SELECT * FROM users')) return [{ ...user, password: hash }];
    if (sql.startsWith('SELECT category_id FROM categories')) return [{ category_id: 3 }];
    if (sql.startsWith('SELECT 1 FROM incomes')) { assert.deepEqual(args, [3]); assert.ok(!sql.includes('user_id')); return [{ 1: 1 }]; }
  });
  assert.equal((await f.request('/categories/3', { password }, 'DELETE')).status, 409);
  assert.ok(!f.events.some(e => e.sql.startsWith('DELETE')));
});
test('account deletion is blocked when child records exist', async t => {
  const f = await fixture(t, sql => sql.startsWith('SELECT 1 FROM incomes') ? [{ 1: 1 }] : undefined);
  assert.equal((await f.request('/users/me', undefined, 'DELETE')).status, 409);
  assert.ok(!f.events.some(e => e.sql.startsWith('DELETE')));
});
test('old tokens cannot access a new account reusing a manual ID', async t => {
  const f = await fixture(t, sql => sql.startsWith('SELECT user_id, password FROM users') ? [{ ...user, password: 'new-account-password-hash' }] : undefined);
  assert.equal((await f.request('/expense', expense)).status, 401);
});
test('creates categories without AUTO_INCREMENT and releases ID lock after commit', async t => {
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('SELECT category_id AS id')) return [];
    if (sql.startsWith('INSERT INTO categories')) { assert.deepEqual(args, [8, 'Food', 'expense', '💰']); return { affectedRows: 1 }; }
  });
  const response = await f.request('/categories', { name: 'Food', type: 'expense' });
  assert.equal(response.status, 201); assert.equal(response.body.id, 8);
  const commit = f.events.findIndex(e => e.sql === 'COMMIT');
  const release = f.events.findIndex(e => e.sql.includes('RELEASE_LOCK'));
  assert.ok(commit >= 0 && release > commit);
});
test('ID lock timeout does not start a write', async t => {
  const f = await fixture(t, sql => sql.includes('GET_LOCK') ? [{ acquired: 0 }] : undefined);
  assert.equal((await f.request('/categories', { name: 'Food', type: 'expense' })).status, 503);
  assert.ok(!f.events.some(e => e.sql === 'BEGIN' || e.sql.startsWith('INSERT')));
});
test('existing monthly category budget is updated rather than duplicated', async t => {
  const f = await fixture(t, (sql, args) => {
    if (sql.startsWith('SELECT budget_id')) { assert.deepEqual(args, [7, 3, '2026-10-01']); return [{ budget_id: 1 }]; }
    if (sql.startsWith('UPDATE budgets')) { assert.deepEqual(args, ['500.00', 7, 3, '2026-10-01']); return { affectedRows: 1 }; }
  });
  assert.equal((await f.request('/budget/category', { month: '2026-10', categoryId: 3, limit: 500 })).status, 200);
  assert.ok(!f.events.some(e => e.sql.startsWith('INSERT')));
});
test('empty budget has null goal rather than fictitious savings', async t => {
  const f = await fixture(t, sql => sql.includes('FROM saving_goals') || sql.includes('FROM budgets b') ? [] : undefined);
  const response = await f.request('/budget?month=2026-10', undefined, 'GET');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { savingGoal: null, categoryBudgets: [] });
});
test('registration stores a hash and returns finance profile', async t => {
  const f = await fixture(t, async (sql, args) => {
    if (sql.startsWith('INSERT INTO users')) {
      assert.equal(args[0], 7); assert.equal(args[1], 'Student'); assert.equal(args[2], 'test@example.com');
      assert.ok(await bcrypt.compare('password123', args[3])); return { insertId: 7 };
    }
  });
  const response = await f.request('/auth/register', { name: 'Student', email: 'TEST@example.com', password: 'password123' }, 'POST', false);
  assert.equal(response.status, 201);
  assert.equal(response.body.user.name, 'Student');
  assert.ok(!('password' in response.body.user));
  assert.equal(jwt.verify(response.body.token, secret).sub, '7');
});
