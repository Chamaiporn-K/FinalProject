import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACE, TYPE } from "../constants/theme";

export function Field(props: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean; placeholder?: string; error?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput
        style={[s.input, props.error ? s.inputError : null]}
        value={props.value} onChangeText={props.onChangeText}
        keyboardType={props.keyboardType} secureTextEntry={props.secureTextEntry}
        placeholder={props.placeholder} placeholderTextColor={COLORS.textMute}
        autoCapitalize="none"
      />
      {props.error ? <Text style={s.error}>{props.error}</Text> : null}
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[s.button, props.disabled && s.disabled]} onPress={props.onPress} disabled={props.disabled}>
    <Text style={s.buttonText}>{props.title}</Text>
  </TouchableOpacity>;
}

export function SecondaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[s.secondaryButton, props.disabled && s.disabled]} onPress={props.onPress} disabled={props.disabled}>
    <Text style={s.secondaryText}>{props.title}</Text>
  </TouchableOpacity>;
}

export function Card(props: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, props.style]}>{props.children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={s.sectionRow}><Text style={s.sectionTitle}>{title}</Text>{action && onAction ? <TouchableOpacity onPress={onAction}><Text style={s.action}>{action}</Text></TouchableOpacity> : null}</View>;
}

export function ProgressBar({ value, color = COLORS.greenDk }: { value: number; color?: string }) {
  return <View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>;
}

export function EmptyState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={s.empty}><Text style={s.emptyIcon}>○</Text><Text style={s.emptyTitle}>{title}</Text>{action && onAction ? <TouchableOpacity onPress={onAction}><Text style={s.action}>{action}</Text></TouchableOpacity> : null}</View>;
}

export function CategoryPills(props: { options: string[]; selected: string; onSelect: (v: string) => void; onAdd: (v: string) => void }) {
  const [adding, setAdding] = useState(false); const [text, setText] = useState("");
  function confirm() { const value = text.trim(); if (!value) return; props.onAdd(value); setText(""); setAdding(false); }
  return <View>
    <View style={s.pillWrap}>{props.options.map(c => <TouchableOpacity key={c} style={[s.pill, c === props.selected && s.pillActive]} onPress={() => props.onSelect(c)}><Text style={[s.pillText, c === props.selected && s.pillTextActive]}>{c}</Text></TouchableOpacity>)}
      <TouchableOpacity style={s.pillAdd} onPress={() => setAdding(v => !v)}><Text style={s.pillAddText}>+ เพิ่มหมวด</Text></TouchableOpacity>
    </View>
    {adding ? <View style={s.addRow}><TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={text} onChangeText={setText} placeholder="ชื่อหมวดหมู่" placeholderTextColor={COLORS.textMute} onSubmitEditing={confirm} /><TouchableOpacity style={s.addBtn} onPress={confirm}><Text style={s.addBtnText}>เพิ่ม</Text></TouchableOpacity></View> : null}
  </View>;
}

const s = StyleSheet.create({
  field: { marginBottom: SPACE.md }, label: { ...TYPE.caption, color: COLORS.text2, marginBottom: SPACE.xs, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, paddingVertical: 12, fontSize: 15, backgroundColor: COLORS.card, color: COLORS.text },
  inputError: { borderColor: COLORS.danger }, error: { color: COLORS.danger, ...TYPE.caption, marginTop: SPACE.xs },
  button: { backgroundColor: COLORS.greenDk, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: "center", marginTop: SPACE.sm }, buttonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  secondaryButton: { backgroundColor: COLORS.green1, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: "center", marginTop: SPACE.sm }, secondaryText: { color: COLORS.greenDeep, fontWeight: "800", fontSize: 14 }, disabled: { opacity: 0.5 },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: SPACE.sm },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm }, sectionTitle: { ...TYPE.heading, color: COLORS.text }, action: { color: COLORS.greenDk, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.line, overflow: "hidden", marginTop: SPACE.sm }, progressFill: { height: "100%", borderRadius: RADIUS.pill },
  empty: { alignItems: "center", paddingVertical: SPACE.xxl }, emptyIcon: { color: COLORS.textMute, fontSize: 28, marginBottom: SPACE.sm }, emptyTitle: { color: COLORS.text2, ...TYPE.body, textAlign: "center" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: SPACE.sm }, pill: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 }, pillActive: { backgroundColor: COLORS.green1, borderColor: COLORS.green1 }, pillText: { ...TYPE.caption, color: COLORS.text2 }, pillTextActive: { color: COLORS.greenDeep, fontWeight: "800" }, pillAdd: { borderWidth: 1, borderColor: COLORS.greenDk, borderStyle: "dashed", borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 }, pillAddText: { color: COLORS.greenDk, fontWeight: "800", fontSize: 12 },
  addRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.md, alignItems: "center" }, addBtn: { backgroundColor: COLORS.greenDk, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.lg, paddingVertical: 12 }, addBtnText: { color: COLORS.white, fontWeight: "800" },
});
