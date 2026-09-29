import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../constants/theme";
import { api } from "../lib/api";
import { Field, PrimaryButton, CategoryPills } from "../components/FinanceUI";

const DEFAULT_TYPES = ["เงินจากผู้ปกครอง", "เงินเดือน", "งานพิเศษ", "อื่น ๆ"];

export default function IncomeAdd() {
  const router = useRouter();
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [type, setType] = useState(DEFAULT_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const num = Number(amount);
    if (!num || num <= 0) { setError("กรอกจำนวนเงินให้ถูกต้อง"); return; }
    try {
      setLoading(true); setError(null);
      await api.addIncome({ type, amount: num, date: date.toISOString().slice(0, 10) });
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.label}>ประเภท</Text>
      <CategoryPills options={types} selected={type} onSelect={setType} onAdd={(v) => { setTypes([...types, v]); setType(v); }} />

      <Field label="จำนวนเงิน" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />

      <Text style={s.label}>วันที่</Text>
      <DateTimePicker
        value={date}
        mode="date"
        display={Platform.OS === "ios" ? "compact" : "default"}
        onChange={(_, d) => d && setDate(d)}
        style={{ alignSelf: "flex-start", marginBottom: 16 }}
      />

      {error ? <Text style={s.error}>{error}</Text> : null}
      <PrimaryButton title={loading ? "กำลังบันทึก..." : "บันทึกรายรับ"} onPress={save} disabled={loading} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  label: { fontSize: 11, color: COLORS.text2, marginBottom: 4 },
  error: { color: COLORS.red, fontSize: 12, marginBottom: 10 },
});
