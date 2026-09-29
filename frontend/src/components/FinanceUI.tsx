import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput
        style={s.input}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        secureTextEntry={props.secureTextEntry}
        placeholder={props.placeholder}
        placeholderTextColor={COLORS.textMute}
        autoCapitalize="none"
      />
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[s.button, props.disabled && { opacity: 0.5 }]}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      <Text style={s.buttonText}>{props.title}</Text>
    </TouchableOpacity>
  );
}

export function Card(props: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, props.style]}>{props.children}</View>;
}

// Pill-select for a category / income type, with a "+" to add a new one on the fly.
export function CategoryPills(props: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onAdd: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  function confirm() {
    const v = text.trim();
    if (!v) return;
    props.onAdd(v);
    setText("");
    setAdding(false);
  }

  return (
    <View>
      <View style={s.pillWrap}>
        {props.options.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.pill, c === props.selected && s.pillActive]}
            onPress={() => props.onSelect(c)}
          >
            <Text style={[s.pillText, c === props.selected && s.pillTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.pillAdd} onPress={() => setAdding(!adding)}>
          <Text style={s.pillAddText}>+ เพิ่มหมวดหมู่</Text>
        </TouchableOpacity>
      </View>
      {adding && (
        <View style={s.addRow}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            value={text}
            onChangeText={setText}
            placeholder="ชื่อหมวดหมู่ใหม่"
            placeholderTextColor={COLORS.textMute}
            onSubmitEditing={confirm}
          />
          <TouchableOpacity style={s.addBtn} onPress={confirm}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 11, color: COLORS.text2, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: COLORS.line, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    backgroundColor: COLORS.card, color: COLORS.text,
  },
  button: { backgroundColor: COLORS.greenDk, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 4 },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  pill: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  pillActive: { backgroundColor: COLORS.green1, borderColor: COLORS.green1 },
  pillText: { fontSize: 12, color: COLORS.text2 },
  pillTextActive: { color: "#0F3A2C", fontWeight: "600" },
  pillAdd: { borderWidth: 1, borderColor: COLORS.greenDk, borderStyle: "dashed", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  pillAddText: { fontSize: 12, color: COLORS.greenDk, fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 12, alignItems: "center" },
  addBtn: { backgroundColor: COLORS.greenDk, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
});
