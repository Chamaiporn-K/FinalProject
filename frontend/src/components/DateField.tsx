import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, RADIUS, SPACE, TYPE } from "../constants/theme";
import { localDate } from "../lib/dates";

export function DateField({ value, onChange, label = "วันที่" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const [open, setOpen] = useState(false); const parsed = new Date(value + "T12:00:00"); const date = Number.isFinite(parsed.getTime()) ? parsed : new Date();
  return <View style={s.container}><Text style={s.label}>{label}</Text><Pressable style={s.input} accessibilityRole="button" accessibilityLabel={`เลือก${label}`} onPress={() => setOpen(true)}><Text style={s.value}>{date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</Text></Pressable>{open ? <DateTimePicker value={date} mode="date" display="default" onChange={(event, selected) => { setOpen(false); if (event.type === "set" && selected) onChange(localDate(selected)); }} /> : null}</View>;
}
const s = StyleSheet.create({ container: { marginBottom: SPACE.lg }, label: { ...TYPE.caption, color: COLORS.text2, marginBottom: SPACE.xs, fontWeight: "600" }, input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, paddingVertical: 13 }, value: { color: COLORS.text, fontSize: 15 } });
