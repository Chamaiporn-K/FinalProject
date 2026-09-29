import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api } from "../../lib/api";
import { Card } from "../../components/FinanceUI";

const MONTH = "2026-09"; // TODO: replace with a real month picker later

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await api.getDashboardSummary(MONTH));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Centered><ActivityIndicator color={COLORS.greenDk} /></Centered>;
  if (error) return <Centered><Text style={s.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>ลองใหม่</Text></TouchableOpacity></Centered>;
  if (!data) return null;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18, paddingTop: 50 }}>
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>เงินคงเหลือ · {MONTH}</Text>
        <Text style={s.balanceValue}>฿{fmt(data.balance)}</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
          <Text style={s.balanceSub}>⬇ ฿{fmt(data.totalIncome)}</Text>
          <Text style={s.balanceSub}>⬆ ฿{fmt(data.totalExpense)}</Text>
        </View>
      </View>

      <Text style={s.h3}>ค่าใช้จ่ายแยกตามหมวด</Text>
      <Card>
        {data.expenseByCategory.map((c: any, i: number) => (
          <View key={i} style={[s.row, s.between, s.line]}>
            <Text>{c.category}</Text>
            <Text style={s.bold}>฿{fmt(c.amount)}</Text>
          </View>
        ))}
      </Card>

      <Text style={s.h3}>หมวดที่ใช้เงินมากที่สุด</Text>
      <Text style={{ marginBottom: 20 }}>{data.topCategory.category} — ฿{fmt(data.topCategory.amount)}</Text>
    </ScrollView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={[s.wrap, { justifyContent: "center", alignItems: "center" }]}>{children}</View>;
}
function fmt(n: number) { return Number(n || 0).toLocaleString("th-TH"); }

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  balanceCard: { backgroundColor: COLORS.teal1, borderRadius: 16, padding: 16 },
  balanceLabel: { fontSize: 12, color: "#04342C" },
  balanceValue: { fontSize: 28, fontWeight: "700", color: "#04342C", marginTop: 2 },
  balanceSub: { fontSize: 12, color: "#04342C" },
  h3: { fontSize: 13, fontWeight: "600", marginTop: 18, marginBottom: 8, color: COLORS.text },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  between: { justifyContent: "space-between" },
  line: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  bold: { fontWeight: "600" },
  error: { color: COLORS.red, marginBottom: 8 },
  retry: { color: COLORS.greenDk, fontWeight: "600" },
});
