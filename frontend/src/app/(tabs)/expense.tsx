import { currentMonth } from "../../lib/dates";
import { MonthPicker } from "../../components/MonthPicker";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS } from "../../constants/theme";
import { api } from "../../lib/api";
import { Card } from "../../components/FinanceUI";




export default function Expense() {
  const [month, setMonth] = useState(currentMonth);
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<string[]>(["ทั้งหมด"]);
  const [filter, setFilter] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params: Record<string, string> = { month: month };
      if (filter !== "ทั้งหมด") params.category = filter;
      const [rows, categories] = await Promise.all([api.getExpenses(params), api.getCategories("expense")]);
      setItems(rows); setFilters(["ทั้งหมด", ...new Set(categories.map(c => c.name))]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function remove(id: string) {
    try { await api.deleteExpense(id); await load(); } catch (e: any) { setError(e.message); }
  }

  return (
    <View style={s.wrap}>
      <View style={[s.row, s.between, { paddingHorizontal: 18, paddingTop: 50 }]}>
        <Text style={s.h2}>รายจ่าย</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/expense-add")}>
          <Text style={s.addBtnText}>+ เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 18, marginTop: 12 }}>
        {filters.map((f) => (
          <TouchableOpacity key={f} style={[s.filterPill, f === filter && s.filterPillActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, f === filter && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <MonthPicker month={month} onChange={setMonth} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.greenDk} />}
      {error && <Text style={s.error}>{error}</Text>}

      {!loading && !error && (
        <FlatList
          style={{ paddingHorizontal: 18, marginTop: 10 }}
          data={items}
          keyExtractor={(i) => String(i.id)}
          ListEmptyComponent={<Text style={s.muted}>ยังไม่มีรายการ</Text>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <View style={[s.row, s.between, { padding: 12 }]}>
                <View>
                  <Text style={s.bold}>{item.category}{item.note ? ` — ${item.note}` : ""}</Text>
                  <Text style={s.muted}>{item.date}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Text style={s.red}>-฿{Number(item.amount).toLocaleString("th-TH")}</Text>
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
  filterPill: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  filterPillActive: { backgroundColor: COLORS.greenDk, borderColor: COLORS.greenDk },
  filterText: { fontSize: 12, color: COLORS.text2 },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  muted: { color: COLORS.text2, fontSize: 12, textAlign: "center", marginTop: 12 },
  bold: { fontWeight: "600" },
  red: { color: COLORS.red, fontWeight: "600" },
  deleteLink: { color: COLORS.red, fontSize: 12, fontWeight: "600" },
  error: { color: COLORS.red, textAlign: "center", marginTop: 20 },
});
