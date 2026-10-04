import { currentMonth } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api } from "../../lib/api";
import { Card } from "../../components/FinanceUI";



export default function Income() {
  const [month, setMonth] = useState(currentMonth);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setItems(await api.getIncomes(month));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function remove(id: string) {
    try { await api.deleteIncome(id); await load(); } catch (e: any) { setError(e.message); }
  }

  const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return (
    <View style={s.wrap}>
      <View style={[s.row, s.between, { paddingHorizontal: 18, paddingTop: 50 }]}>
        <Text style={s.h2}>รายรับ</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/income-add")}>
          <Text style={s.addBtnText}>+ เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <MonthPicker month={month} onChange={setMonth} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.greenDk} />}
      {error && <Text style={s.error}>{error}</Text>}

      {!loading && !error && (
        <FlatList
          style={{ paddingHorizontal: 18 }}
          data={items}
          keyExtractor={(i) => String(i.id)}
          ListEmptyComponent={<Text style={s.muted}>ยังไม่มีรายการ</Text>}
          ListFooterComponent={
            items.length ? (
              <View style={[s.row, s.between, { padding: 8 }]}>
                <Text style={s.muted}>รวมเดือนนี้</Text>
                <Text style={s.bold}>฿{total.toLocaleString("th-TH")}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <View style={[s.row, s.between, { padding: 12 }]}>
                <View>
                  <Text style={s.bold}>{item.type}</Text>
                  <Text style={s.muted}>{item.date}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Text style={s.green}>+฿{Number(item.amount).toLocaleString("th-TH")}</Text>
                  <TouchableOpacity onPress={() => remove(item.id)}>
                    <Text style={s.deleteLink}>ลบ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  h2: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  row: { flexDirection: "row", alignItems: "center" },
  between: { justifyContent: "space-between" },
  addBtn: { backgroundColor: COLORS.green1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: "#0F3A2C", fontWeight: "600", fontSize: 12 },
  muted: { color: COLORS.text2, fontSize: 12, textAlign: "center", marginTop: 12 },
  bold: { fontWeight: "600" },
  green: { color: COLORS.greenDk, fontWeight: "600" },
  deleteLink: { color: COLORS.red, fontSize: 12, fontWeight: "600" },
  error: { color: COLORS.red, textAlign: "center", marginTop: 20 },
});
