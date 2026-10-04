import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/theme";
import { CONFIG } from "../lib/config";
import { api } from "../lib/api";
import { Field, PrimaryButton } from "../components/FinanceUI";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name || !email || !password) { setError("กรอกข้อมูลให้ครบทุกช่อง"); return; }
    try {
      setLoading(true); setError(null);
      const { token } = await api.register(name, email, password);
      await AsyncStorage.setItem(CONFIG.TOKEN_KEY, token);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>สมัครสมาชิก</Text>
      <Field label="ชื่อ-นามสกุล" value={name} onChangeText={setName} />
      <Field label="อีเมลมหาวิทยาลัย" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <PrimaryButton title={loading ? "กำลังสมัคร..." : "สร้างบัญชี"} onPress={handleRegister} disabled={loading} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 24, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 20 },
  error: { color: COLORS.red, fontSize: 12, marginBottom: 10 },
});
