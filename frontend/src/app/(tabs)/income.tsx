import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, SPACE, TYPE } from "../../constants/theme";
import { currentMonth } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import { api } from "../../lib/api";
import { Card } from "../../components/FinanceUI";

export default function Income() {
  const [month, setMonth] = useState(currentMonth); const router = useRouter(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setLoading(true); setError(null); setItems(await api.getIncomes(month)); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [month]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function remove(id: string) { try { await api.deleteIncome(id); await load(); } catch (e: any) { setError(e.message); } }
  const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  return <View style={s.wrap}><View style={s.header}><View><Text style={s.eyebrow}>รายการเงิน</Text><Text style={s.title}>รายรับ</Text></View><TouchableOpacity style={s.add} onPress={() => router.push("/income-add")}><Text style={s.addText}>＋ เพิ่ม</Text></TouchableOpacity></View><MonthPicker month={month} onChange={setMonth} />
    <Card style={s.totalCard}><Text style={s.totalLabel}>รายรับรวมเดือนนี้</Text><Text style={s.total}>฿{total.toLocaleString("th-TH")}</Text><Text style={s.totalHint}>{items.length} รายการ</Text></Card>
    {loading ? <ActivityIndicator style={{ marginTop: SPACE.xl }} color={COLORS.greenDk} /> : error ? <Text style={s.error}>{error}</Text> : <FlatList contentContainerStyle={s.list} data={items} keyExtractor={i => String(i.id)} ListEmptyComponent={<Text style={s.empty}>ยังไม่มีรายการรายรับในเดือนนี้</Text>} renderItem={({ item }) => <Card style={s.item}><View><Text style={s.itemTitle}>{item.type}</Text><Text style={s.muted}>{item.date}</Text></View><View style={s.itemRight}><Text style={s.amount}>+฿{Number(item.amount).toLocaleString("th-TH")}</Text><TouchableOpacity onPress={() => remove(item.id)}><Text style={s.delete}>ลบ</Text></TouchableOpacity></View></Card>} />}
  </View>;
}
const s = StyleSheet.create({ wrap: { flex: 1, width: "100%", maxWidth: 1120, alignSelf: "center", backgroundColor: COLORS.bg, paddingHorizontal: SPACE.lg }, header: { paddingTop: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eyebrow: { ...TYPE.caption, color: COLORS.text2 }, title: { ...TYPE.title, color: COLORS.text }, add: { backgroundColor: COLORS.greenDk, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }, addText: { color: COLORS.white, fontWeight: "800" }, totalCard: { backgroundColor: COLORS.greenDeep, padding: SPACE.xl, marginBottom: SPACE.lg }, totalLabel: { color: COLORS.green1, ...TYPE.caption }, total: { color: COLORS.white, fontSize: 32, fontWeight: "800", marginTop: 4 }, totalHint: { color: "#B7DCCB", ...TYPE.caption, marginTop: 4 }, list: { paddingBottom: 100 }, item: { padding: SPACE.lg, marginBottom: SPACE.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, itemTitle: { ...TYPE.body, fontWeight: "800", color: COLORS.text }, muted: { ...TYPE.caption, color: COLORS.text2, marginTop: 3 }, itemRight: { alignItems: "flex-end", gap: 5 }, amount: { color: COLORS.success, fontWeight: "800" }, delete: { color: COLORS.danger, ...TYPE.caption }, empty: { color: COLORS.text2, textAlign: "center", marginTop: SPACE.xl }, error: { color: COLORS.danger, textAlign: "center", marginTop: SPACE.xl } });
