import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api } from "../../lib/api";
import { Card } from "../../components/FinanceUI";

const MONTH = "2026-09";

export default function Budget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await api.getBudget(MONTH));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Centered><ActivityIndicator color={COLORS.greenDk} /></Centered>;
  if (error) return <Centered><Text style={s.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>ลองใหม่</Text></TouchableOpacity></Centered>;
  if (!data) return null;

  const g = data.savingGoal;
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100));

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18, paddingTop: 50 }}>
      <Text style={s.h2}>🎯 เป้าหมายออมเงิน</Text>
      <Card style={{ padding: 16, marginTop: 12 }}>
        <Text style={s.big}>฿{fmt(g.saved)} <Text style={s.muted}>/ ฿{fmt(g.target)}</Text></Text>
        <View style={s.bar}><View style={[s.fill, { width: `${pct}%` }]} /></View>
        <Text style={s.muted}>{pct}% · ครบกำหนด {g.deadline}</Text>
      </Card>

      <Text style={s.h3}>งบตามหมวดหมู่</Text>
      <Card style={{ padding: 14 }}>
        {data.categoryBudgets.map((c: any, i: number) => {
          const p = Math.min(100, Math.round((c.spent / c.limit) * 100));
          return (
            <View key={i} style={{ marginBottom: 10 }}>
              <View style={[s.row, s.between]}>
                <Text style={{ fontSize: 12 }}>{c.category}</Text>
                <Text style={s.bold}>฿{fmt(c.spent)}/{fmt(c.limit)}</Text>
              </View>
              <View style={[s.bar, s.barSmall]}><View style={[s.fill, { width: `${p}%` }]} /></View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={[s.wrap, { justifyContent: "center", alignItems: "center" }]}>{children}</View>;
}
function fmt(n: number) { return Number(n || 0).toLocaleString("th-TH"); }

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  h2: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  h3: { fontSize: 13, fontWeight: "600", marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  between: { justifyContent: "space-between" },
  big: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  muted: { color: COLORS.text2, fontSize: 12 },
  bold: { fontWeight: "600", fontSize: 12 },
  bar: { backgroundColor: COLORS.line, borderRadius: 20, height: 10, overflow: "hidden", marginBottom: 4 },
  barSmall: { height: 6 },
  fill: { height: "100%", backgroundColor: COLORS.greenDk },
  error: { color: COLORS.red, marginBottom: 8 },
  retry: { color: COLORS.greenDk, fontWeight: "600" },
});
