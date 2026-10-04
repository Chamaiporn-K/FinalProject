class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function text(value, label, max, optional = false) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) {
    throw new ApiError(400, `${label}ไม่ถูกต้อง`);
  }
  return value.trim();
}
function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) throw new ApiError(400, 'รหัสข้อมูลไม่ถูกต้อง');
  return Number(value);
}
function money(value, allowZero = false) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value))) throw new ApiError(400, 'จำนวนเงินต้องเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
  const number = Number(value);
  if (!Number.isFinite(number) || number > 99999999.99 || (allowZero ? number < 0 : number <= 0)) throw new ApiError(400, 'จำนวนเงินไม่ถูกต้อง');
  return number.toFixed(2);
}
function date(value) {
  const parsed = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : new Date(NaN);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000
    || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ApiError(400, 'วันที่ไม่ถูกต้อง (YYYY-MM-DD)');
  return value;
}
function currentMonth() {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
}
function monthRange(value = currentMonth()) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || Number(value.slice(0, 4)) < 1000 || value === '9999-12') throw new ApiError(400, 'เดือนไม่ถูกต้อง (YYYY-MM)');
  const [year, month] = value.split('-').map(Number);
  return { month: value, start: `${value}-01`, end: `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01` };
}
module.exports = { ApiError, text, id, money, date, monthRange };
