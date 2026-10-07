import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACE, TYPE } from "../constants/theme";

export function MonthPicker({ month, onChange }: { month: string; onChange: (value: string) => void }) {
  function move(offset: number) { const [year, m] = month.split("-").map(Number); const d = new Date(year, m - 1 + offset, 1); onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
  const [year, m] = month.split("-");
  const label = new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  return <View style={s.wrap}><TouchableOpacity accessibilityLabel="เดือนก่อนหน้า" onPress={() => move(-1)}><Text style={s.arrow}>‹</Text></TouchableOpacity><Text style={s.label}>{label}</Text><TouchableOpacity accessibilityLabel="เดือนถัดไป" onPress={() => move(1)}><Text style={s.arrow}>›</Text></TouchableOpacity></View>;
}
const s = StyleSheet.create({ wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACE.lg }, label: { ...TYPE.body, fontWeight: "800", color: COLORS.text }, arrow: { color: COLORS.greenDk, fontSize: 32, lineHeight: 32, paddingHorizontal: SPACE.sm, backgroundColor: COLORS.green1, borderRadius: RADIUS.pill } });
