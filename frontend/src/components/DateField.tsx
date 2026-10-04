import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../constants/theme";
import { localDate } from "../lib/dates";

export function DateField({ value, onChange, label = "วันที่" }: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = new Date(value + "T12:00:00");
  const date = Number.isFinite(parsed.getTime()) ? parsed : new Date();
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Pressable style={styles.input} accessibilityRole="button" accessibilityLabel={`เลือก${label}`}
      onPress={() => setOpen(true)}>
      <Text style={styles.value}>{date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</Text>
    </Pressable>
    {open && <DateTimePicker value={date} mode="date" display="default"
      onChange={(event, selected) => {
        setOpen(false);
        if (event.type === "set" && selected) onChange(localDate(selected));
      }} />}
  </View>;
}
const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 11, color: COLORS.text2, marginBottom: 4 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  value: { color: COLORS.text, fontSize: 14 },
});
