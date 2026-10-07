import { currentMonth } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS, SPACE, TYPE } from "../../constants/theme";
import { ai } from "../../lib/ai";
import { Card, SectionTitle } from "../../components/FinanceUI";

export default function AiAdvisor() {
  const [month, setMonth] = useState(currentMonth); const [status, setStatus] = useState("กำลังเตรียมคำแนะนำ..."); const [insights, setInsights] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setLoading(true); setError(null); const res = await ai.getInsights(month); setInsights(res.insights || []); setStatus(res.message || "สรุปจากข้อมูลการเงินของคุณ"); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [month]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <ScrollView style={s.wrap} contentContainerStyle={s.content}><MonthPicker month={month} onChange={setMonth} /><View style={s.hero}><View style={s.icon}><Text>✦</Text></View><View style={{ flex: 1 }}><Text style={s.title}>คำแนะนำการเงิน</Text><Text style={s.muted}>{status}</Text></View></View><SectionTitle title="คำแนะนำสำหรับเดือนนี้" />
    {loading ? <ActivityIndicator color={COLORS.greenDk} /> : error ? <Card style={s.errorCard}><Text style={s.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>ลองใหม่</Text></TouchableOpacity></Card> : insights.length ? insights.map((item, index) => <Card key={item.id || index} style={s.card}><View style={s.cardBadge}><Text style={s.badge}>{item.type === "warning" ? "ควรระวัง" : item.type === "budget" ? "งบประมาณ" : "สรุป"}</Text></View><Text style={s.cardText}>{item.text}</Text></Card>) : <Card><Text style={s.muted}>ยังไม่มีคำแนะนำสำหรับเดือนนี้</Text></Card>}
  </ScrollView>;
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: COLORS.bg }, content: { flexGrow: 1, width: "100%", maxWidth: 1120, alignSelf: "center", padding: SPACE.lg, paddingTop: 32, paddingBottom: 100 }, hero: { flexDirection: "row", alignItems: "center", gap: SPACE.md, backgroundColor: COLORS.green1, padding: SPACE.lg, borderRadius: 20, marginBottom: SPACE.xl }, icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: COLORS.greenDk, alignItems: "center", justifyContent: "center" }, iconText: { color: COLORS.white }, title: { ...TYPE.heading, color: COLORS.greenDeep }, muted: { ...TYPE.caption, color: COLORS.text2, marginTop: 3 }, card: { padding: SPACE.lg, marginBottom: SPACE.sm }, cardBadge: { flexDirection: "row", marginBottom: SPACE.sm }, badge: { color: COLORS.greenDk, backgroundColor: COLORS.green1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "800" }, cardText: { ...TYPE.body, color: COLORS.text }, errorCard: { padding: SPACE.lg }, error: { color: COLORS.danger }, retry: { color: COLORS.greenDk, fontWeight: "800", marginTop: SPACE.sm } });
