import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api, Category } from "../../lib/api";
import { currentMonth, localDate } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import { DateField } from "../../components/DateField";
import { Card, Field, PrimaryButton, CategoryPills } from "../../components/FinanceUI";

export default function Budget() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(localDate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [budget, rows] = await Promise.all([api.getBudget(month), api.getCategories("expense")]);
      setData(budget); setCategories(rows);
      setCategory(selected => rows.some(c => c.name === selected) ? selected : rows[0]?.name || "");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [month]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function save(action: () => Promise<any>) {
    try { setSaving(true); setError(null); await action(); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function saveBudget() {
    const c = categories.find(c => c.name === category);
    if (!c) { setError("เลือกหมวดหมู่ก่อนบันทึก"); return; }
    await save(() => api.setCategoryBudget({ month, categoryId: c.id, limit }));
  }
  async function addCategory(value: string) {
    try { const row = await api.addCategory(value, "expense"); setCategories(rows => [...rows, row]); setCategory(row.name); }
    catch (e: any) { setError(e.message); }
  }
  const g = data?.savingGoal;
  return <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18, paddingTop: 50 }}>
    <MonthPicker month={month} onChange={setMonth} />
    {loading && <ActivityIndicator color={COLORS.greenDk} />}
    {error && <View><Text style={s.error}>{error}</Text><TouchableOpacity onPress={load}><Text>ลองใหม่</Text></TouchableOpacity></View>}
    <Text style={s.heading}>🎯 เป้าหมายออมเงิน</Text>
    <Card style={{ padding: 16, marginBottom: 12 }}>
      {g ? <>
        <Text style={s.heading}>{g.name}</Text>
        <Text style={s.big}>เป้าหมาย ฿{fmt(g.target)}</Text>
        <Text>ครบกำหนด {g.deadline}</Text>
        <Text style={s.muted}>ฐานข้อมูลปัจจุบันเก็บเป้าหมายออมเงิน แต่ยังไม่มีข้อมูลยอดออมสะสม</Text>
      </> : <Text>ยังไม่มีเป้าหมายออมเงิน</Text>}
    </Card>
    <Card style={{ padding: 16, marginBottom: 18 }}>
      <Text style={s.heading}>{g ? "สร้างเป้าหมายใหม่" : "ตั้งเป้าหมายแรก"}</Text>
      <Field label="ชื่อเป้าหมาย" value={name} onChangeText={setName} />
      <Field label="จำนวนเงินเป้าหมาย" value={target} onChangeText={setTarget} keyboardType="numeric" />
      <DateField label="วันครบกำหนด" value={deadline} onChange={setDeadline} />
      <PrimaryButton title="บันทึกเป้าหมาย" disabled={saving || loading} onPress={() => save(async () => { await api.setSavingGoal({ name, target, startDate: localDate(), deadline }); setName(""); setTarget(""); })} />
      {g && <Text style={s.muted}>หน้าจอแสดงเป้าหมายล่าสุด ประวัติเป้าหมายเดิมยังเก็บไว้</Text>}
    </Card>
    <Text style={s.heading}>งบตามหมวดหมู่ · {month}</Text>
    <Card style={{ padding: 14, marginBottom: 12 }}>
      {!data?.categoryBudgets?.length && <Text>ยังไม่ได้ตั้งงบเดือนนี้</Text>}
      {data?.categoryBudgets?.map((c: any) => <View key={c.id} style={{ marginBottom: 12 }}>
        <Text>{c.category} · ฿{fmt(c.spent)} / ฿{fmt(c.limit)}</Text>
        <View style={s.bar}><View style={[s.fill, { width: `${c.limit > 0 ? Math.min(100, Math.round(c.spent / c.limit * 100)) : 0}%`, backgroundColor: c.spent > c.limit ? COLORS.red : COLORS.greenDk }]} /></View>
      </View>)}
    </Card>
    <Card style={{ padding: 16 }}>
      <Text style={s.heading}>ตั้งหรือแก้ไขงบรายหมวด</Text>
      <CategoryPills options={categories.map(c => c.name)} selected={category} onSelect={setCategory} onAdd={addCategory} />
      <Field label="งบประมาณ (บาท)" value={limit} onChangeText={setLimit} keyboardType="numeric" />
      <PrimaryButton title="บันทึกงบ" disabled={saving || loading} onPress={saveBudget} />
    </Card>
  </ScrollView>;
}
function fmt(n: number) { return Number(n || 0).toLocaleString("th-TH"); }
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg }, heading: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: COLORS.text },
  big: { fontSize: 20, marginBottom: 8 }, bar: { backgroundColor: COLORS.line, borderRadius: 20, height: 8, overflow: "hidden", marginVertical: 8 },
  fill: { height: "100%", backgroundColor: COLORS.greenDk }, muted: { color: COLORS.text2, fontSize: 12, marginTop: 10 }, error: { color: COLORS.red, marginBottom: 8 },
});
