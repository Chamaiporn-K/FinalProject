import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { DateField } from "../components/DateField";
import { localDate } from "../lib/dates";
import { COLORS, SPACE, TYPE } from "../constants/theme";
import { api, Category } from "../lib/api";
import { Field, PrimaryButton, CategoryPills } from "../components/FinanceUI";

export default function IncomeAdd() { const router = useRouter(); const [types, setTypes] = useState<Category[]>([]); const [type, setType] = useState(""); const [amount, setAmount] = useState(""); const [date, setDate] = useState(localDate()); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.getCategories("income").then(rows => { setTypes(rows); setType(rows[0]?.name || ""); }).catch(e => setError(e.message)); }, []);
  async function addCategory(name: string) { try { const row = await api.addCategory(name, "income"); setTypes(rows => [...rows, row]); setType(row.name); } catch (e: any) { setError(e.message); } }
  async function save() { const chosen = types.find(c => c.name === type); const num = Number(amount); if (!chosen) { setError("กรุณาเลือกหรือเพิ่มหมวดหมู่"); return; } if (!Number.isFinite(num) || num <= 0) { setError("กรุณากรอกจำนวนเงินให้ถูกต้อง"); return; } try { setLoading(true); setError(null); await api.addIncome({ categoryId: chosen.id, amount: num, date }); router.back(); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
  return <ScrollView style={s.wrap} contentContainerStyle={s.content}><Text style={s.title}>เพิ่มรายรับ</Text><Text style={s.subtitle}>บันทึกเงินที่ได้รับในวันนี้</Text><Text style={s.label}>หมวดหมู่</Text><CategoryPills options={types.map(c => c.name)} selected={type} onSelect={setType} onAdd={addCategory} /><Field label="จำนวนเงิน" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" /><DateField label="วันที่" value={date} onChange={setDate} />{error ? <Text style={s.error}>{error}</Text> : null}<PrimaryButton title={loading ? "กำลังบันทึก..." : "บันทึกรายรับ"} onPress={save} disabled={loading} /></ScrollView>;
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACE.xl }, title: { ...TYPE.title, color: COLORS.text }, subtitle: { ...TYPE.body, color: COLORS.text2, marginTop: 4, marginBottom: SPACE.xl }, label: { ...TYPE.caption, color: COLORS.text2, fontWeight: "700" }, error: { color: COLORS.danger, ...TYPE.caption, marginBottom: SPACE.sm } });
