import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { DateField } from "../components/DateField";
import { localDate } from "../lib/dates";
import { COLORS, SPACE, TYPE } from "../constants/theme";
import { api, Category } from "../lib/api";
import { Field, PrimaryButton, CategoryPills } from "../components/FinanceUI";

export default function ExpenseAdd() { const router = useRouter(); const [categories, setCategories] = useState<Category[]>([]); const [category, setCategory] = useState(""); const [note, setNote] = useState(""); const [amount, setAmount] = useState(""); const [date, setDate] = useState(localDate()); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.getCategories("expense").then(rows => { setCategories(rows); setCategory(rows[0]?.name || ""); }).catch(e => setError(e.message)); }, []);
  async function addCategory(name: string) { try { const row = await api.addCategory(name, "expense"); setCategories(rows => [...rows, row]); setCategory(row.name); } catch (e: any) { setError(e.message); } }
  async function save() { const chosen = categories.find(c => c.name === category); const num = Number(amount); if (!chosen) { setError("กรุณาเลือกหรือเพิ่มหมวดหมู่"); return; } if (!Number.isFinite(num) || num <= 0) { setError("กรุณากรอกจำนวนเงินให้ถูกต้อง"); return; } try { setLoading(true); setError(null); await api.addExpense({ categoryId: chosen.id, note, amount: num, date }); router.back(); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
  return <ScrollView style={s.wrap} contentContainerStyle={s.content}><Text style={s.title}>เพิ่มรายจ่าย</Text><Text style={s.subtitle}>บันทึกค่าใช้จ่ายเพื่อดูภาพรวมที่ชัดขึ้น</Text><Text style={s.label}>หมวดหมู่</Text><CategoryPills options={categories.map(c => c.name)} selected={category} onSelect={setCategory} onAdd={addCategory} /><Field label="รายละเอียด" value={note} onChangeText={setNote} placeholder="เช่น ค่าอาหารกลางวัน" /><Field label="จำนวนเงิน" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" /><DateField label="วันที่" value={date} onChange={setDate} />{error ? <Text style={s.error}>{error}</Text> : null}<PrimaryButton title={loading ? "กำลังบันทึก..." : "บันทึกรายจ่าย"} onPress={save} disabled={loading} /></ScrollView>;
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACE.xl }, title: { ...TYPE.title, color: COLORS.text }, subtitle: { ...TYPE.body, color: COLORS.text2, marginTop: 4, marginBottom: SPACE.xl }, label: { ...TYPE.caption, color: COLORS.text2, fontWeight: "700" }, error: { color: COLORS.danger, ...TYPE.caption, marginBottom: SPACE.sm } });
