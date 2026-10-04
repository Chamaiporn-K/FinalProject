import { View, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/theme";
export function MonthPicker({ month, onChange }: { month: string; onChange: (value: string) => void }) {
  function move(offset: number) {
    const [year, m] = month.split("-").map(Number);
    const d = new Date(year, m - 1 + offset, 1);
    onChange(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
    <TouchableOpacity accessibilityLabel="เดือนก่อนหน้า" onPress={() => move(-1)}><Text style={{ color: COLORS.greenDk }}>◀ ก่อนหน้า</Text></TouchableOpacity>
    <Text>{month}</Text>
    <TouchableOpacity accessibilityLabel="เดือนถัดไป" onPress={() => move(1)}><Text style={{ color: COLORS.greenDk }}>ถัดไป ▶</Text></TouchableOpacity>
  </View>;
}
