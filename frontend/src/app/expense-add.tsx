import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DateField } from "../components/DateField";
import { localDate } from "../lib/dates";
import { COLORS } from "../constants/theme";
import { api, Category } from "../lib/api";
import { Field, PrimaryButton, CategoryPills } from "../components/FinanceUI";


export default function ExpenseAdd() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.getCategories("expense").then(rows => { setCategories(rows); setCategory(rows[0]?.name || ""); }).catch(e => setError(e.message)); }, []);
  async function addCategory(name: string) {
    try { const row = await api.addCategory(name, "expense"); setCategories(rows => [...rows, row]); setCategory(row.name); }
    catch (e: any) { setError(e.message); }
  }
  async function save() {
    const chosen = categories.find(c => c.name === category);
    if (!chosen) { setError("เลือกหมวดหมู่ก่อนบันทึก"); return; }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) { setError("กรอกจำนวนเงินให้ถูกต้อง"); return; }
    try {
      setLoading(true); setError(null);
      await api.addExpense({ categoryId: chosen.id, note, amount: num, date });
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.label}>หมวดหมู่</Text>
      <CategoryPills options={categories.map(c => c.name)} selected={category} onSelect={setCategory} onAdd={addCategory} />

      <Field label="รายละเอียด (ไม่บังคับ)" value={note} onChangeText={setNote} />
      <Field label="จำนวนเงิน" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />

      <DateField value={date} onChange={setDate} />

      {error ? <Text style={s.error}>{error}</Text> : null}
      <PrimaryButton title={loading ? "กำลังบันทึก..." : "บันทึกรายจ่าย"} onPress={save} disabled={loading} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  label: { fontSize: 11, color: COLORS.text2, marginBottom: 4 },
  error: { color: COLORS.red, fontSize: 12, marginBottom: 10 },
});
