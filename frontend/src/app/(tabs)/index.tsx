import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS, SPACE, TYPE } from "../../constants/theme";
import { currentMonth } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import { api } from "../../lib/api";
import { Card, ProgressBar, SectionTitle } from "../../components/FinanceUI";

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth); const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setLoading(true); setError(null); setData(await api.getDashboardSummary(month)); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [month]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.greenDk} /></View>;
  if (error) return <View style={s.center}><Text style={s.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>ลองใหม่</Text></TouchableOpacity></View>;
  if (!data) return null;
  return <ScrollView style={s.wrap} contentContainerStyle={s.content}><Text style={s.eyebrow}>ภาพรวมการเงิน</Text><Text style={s.title}>สวัสดี 👋</Text><MonthPicker month={month} onChange={setMonth} />
    <View style={s.balance}><Text style={s.balanceLabel}>ยอดคงเหลือสุทธิ</Text><Text style={s.balanceValue}>฿{fmt(data.balance)}</Text><View style={s.balanceRow}><Text style={s.balanceSub}>รายรับ ฿{fmt(data.totalIncome)}</Text><Text style={s.balanceSub}>รายจ่าย ฿{fmt(data.totalExpense)}</Text></View></View>
    <View style={s.stats}><Card style={s.stat}><Text style={s.statLabel}>รายรับ</Text><Text style={[s.statValue, { color: COLORS.success }]}>฿{fmt(data.totalIncome)}</Text></Card><Card style={s.stat}><Text style={s.statLabel}>รายจ่าย</Text><Text style={[s.statValue, { color: COLORS.danger }]}>฿{fmt(data.totalExpense)}</Text></Card></View>
    <SectionTitle title="ค่าใช้จ่ายตามหมวด" /><Card style={s.categoryCard}>{data.expenseByCategory?.length ? data.expenseByCategory.slice(0, 5).map((c: any, i: number) => <View key={i} style={s.category}><View style={s.categoryTop}><Text style={s.categoryName}>{c.category}</Text><Text style={s.categoryAmount}>฿{fmt(c.amount)}</Text></View><ProgressBar value={data.totalExpense ? c.amount / data.totalExpense * 100 : 0} color={i === 0 ? COLORS.danger : COLORS.greenDk} /></View>) : <Text style={s.muted}>ยังไม่มีรายจ่ายในเดือนนี้</Text>}</Card>
    <SectionTitle title="หมวดที่ใช้จ่ายสูงสุด" /><Card style={s.topCard}><Text style={s.topName}>{data.topCategory?.category || "ยังไม่มีข้อมูล"}</Text><Text style={s.muted}>฿{fmt(data.topCategory?.amount || 0)}</Text></Card>
  </ScrollView>;
}
function fmt(n: number) { return Number(n || 0).toLocaleString("th-TH"); }
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: COLORS.bg }, content: { flexGrow: 1, width: "100%", maxWidth: 1120, alignSelf: "center", padding: SPACE.lg, paddingTop: 32, paddingBottom: 100 }, center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", padding: SPACE.xl }, eyebrow: { ...TYPE.caption, color: COLORS.text2 }, title: { ...TYPE.title, color: COLORS.text, marginTop: 3 }, balance: { backgroundColor: COLORS.greenDeep, borderRadius: 24, padding: SPACE.xl, marginBottom: SPACE.md }, balanceLabel: { color: COLORS.green1, ...TYPE.caption }, balanceValue: { color: COLORS.white, fontSize: 34, fontWeight: "800", marginTop: 4 }, balanceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACE.lg }, balanceSub: { color: "#B7DCCB", ...TYPE.caption }, stats: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.xl }, stat: { flex: 1, padding: SPACE.lg }, statLabel: { ...TYPE.caption, color: COLORS.text2 }, statValue: { fontSize: 18, fontWeight: "800", marginTop: 4 }, categoryCard: { padding: SPACE.lg, marginBottom: SPACE.xl }, category: { marginBottom: SPACE.md }, categoryTop: { flexDirection: "row", justifyContent: "space-between" }, categoryName: { color: COLORS.text, fontWeight: "700" }, categoryAmount: { color: COLORS.text2, fontWeight: "700" }, topCard: { padding: SPACE.lg }, topName: { ...TYPE.heading, color: COLORS.text }, muted: { color: COLORS.text2, ...TYPE.caption }, error: { color: COLORS.danger, textAlign: "center", marginBottom: SPACE.md }, retry: { color: COLORS.greenDk, fontWeight: "800" } });
