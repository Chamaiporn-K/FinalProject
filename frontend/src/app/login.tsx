import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/theme";
import { CONFIG } from "../lib/config";
import { api } from "../lib/api";
import { Field, PrimaryButton } from "../components/FinanceUI";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) { setError("กรอกอีเมลและรหัสผ่านให้ครบ"); return; }
    try {
      setLoading(true); setError(null);
      const { token } = await api.login(email, password);
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
      <Text style={s.logo}>💰</Text>
      <Text style={s.title}>Student Finance</Text>
      <Text style={s.sub}>เข้าสู่ระบบเพื่อเริ่มจัดการเงิน</Text>

      <Field label="อีเมล" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="รหัสผ่าน" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={s.error}>{error}</Text> : null}

      <PrimaryButton title={loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} color={COLORS.greenDk} />}

      <Link href="/register" style={s.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Link>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 24, justifyContent: "center" },
  logo: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.text2, textAlign: "center", marginBottom: 24 },
  error: { color: COLORS.red, fontSize: 12, marginBottom: 10 },
  link: { textAlign: "center", color: COLORS.greenDk, fontWeight: "600", marginTop: 18, fontSize: 12 },
});
