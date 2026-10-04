import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DateField } from "../components/DateField";
import { localDate } from "../lib/dates";
import { COLORS } from "../constants/theme";
import { api, Category } from "../lib/api";
import { Field, PrimaryButton, CategoryPills } from "../components/FinanceUI";


export default function IncomeAdd() {
  const router = useRouter();
  const [types, setTypes] = useState<Category[]>([]);
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.getCategories("income").then(rows => { setTypes(rows); setType(rows[0]?.name || ""); }).catch(e => setError(e.message)); }, []);
  async function addCategory(name: string) {
    try { const row = await api.addCategory(name, "income"); setTypes(rows => [...rows, row]); setType(row.name); }
    catch (e: any) { setError(e.message); }
  }
  async function save() {
    const chosen = types.find(c => c.name === type);
    if (!chosen) { setError("เลือกหมวดหมู่ก่อนบันทึก"); return; }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) { setError("กรอกจำนวนเงินให้ถูกต้อง"); return; }
    try {
      setLoading(true); setError(null);
      await api.addIncome({ categoryId: chosen.id, amount: num, date });
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.label}>ประเภท</Text>
      <CategoryPills options={types.map(c => c.name)} selected={type} onSelect={setType} onAdd={addCategory} />

      <Field label="จำนวนเงิน" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />

      <DateField value={date} onChange={setDate} />

      {error ? <Text style={s.error}>{error}</Text> : null}
      <PrimaryButton title={loading ? "กำลังบันทึก..." : "บันทึกรายรับ"} onPress={save} disabled={loading} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  label: { fontSize: 11, color: COLORS.text2, marginBottom: 4 },
  error: { color: COLORS.red, fontSize: 12, marginBottom: 10 },
});
