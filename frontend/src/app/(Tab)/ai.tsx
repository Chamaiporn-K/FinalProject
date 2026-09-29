import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api } from "../../lib/api";
import { ai } from "../../lib/ai";
import { Card } from "../../components/FinanceUI";

const MONTH = "2026-09";

export default function AiAdvisor() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      // AI reasons over numbers the backend already computed — never its own math.
      const [summary, budget] = await Promise.all([api.getDashboardSummary(MONTH), api.getBudget(MONTH)]);
      const res = await ai.getInsights(MONTH, summary, budget);
      setInsights(res.insights || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18, paddingTop: 50 }}>
      <View style={[s.row, { gap: 10, marginBottom: 14 }]}>
        <Text style={{ fontSize: 22 }}>🤖</Text>
        <View>
          <Text style={s.h2}>AI Financial Advisor</Text>
          <Text style={s.muted}>วิเคราะห์จากข้อมูลจริงของคุณ</Text>
        </View>
      </View>

      {loading && <ActivityIndicator color={COLORS.greenDk} />}
      {error && (
        <View>
          <Text style={s.error}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={s.retry}>ลองใหม่</Text></TouchableOpacity>
        </View>
      )}
      {!loading && !error && insights.length === 0 && <Text style={s.muted}>ยังไม่มีข้อมูลพอสำหรับวิเคราะห์</Text>}
      {insights.map((i) => (
        <Card key={i.id} style={{ padding: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 20 }}>{i.text}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  row: { flexDirection: "row", alignItems: "center" },
  h2: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  muted: { color: COLORS.text2, fontSize: 12 },
  error: { color: COLORS.red, marginBottom: 6 },
  retry: { color: COLORS.greenDk, fontWeight: "600" },
});
