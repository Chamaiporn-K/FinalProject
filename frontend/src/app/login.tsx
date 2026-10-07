import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SPACE, TYPE } from "../constants/theme";
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
    if (!email || !password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    try {
      setLoading(true); setError(null);
      const { token } = await api.login(email, password);
      await AsyncStorage.setItem(CONFIG.TOKEN_KEY, token);
      router.replace("/(tabs)");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenContent} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <View style={s.brand}>
          <Image source={require("../../assets/images/student-finance-mark.svg")} style={s.logo} accessibilityLabel="Student Finance logo" />
          <Text style={s.title}>Student Finance</Text>
          <Text style={s.sub}>จัดการเงินให้ง่าย เห็นภาพ และวางแผนได้ทุกเดือน</Text>
        </View>
        <Field label="อีเมล" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
        <Field label="รหัสผ่าน" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <PrimaryButton title={loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} onPress={handleLogin} disabled={loading} />
        {loading ? <ActivityIndicator style={s.loading} color={COLORS.greenDk} /> : null}
        <Link href="/register" style={s.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Link>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  screenContent: { flexGrow: 1, justifyContent: "center", padding: SPACE.lg },
  form: { width: "100%", maxWidth: 520, alignSelf: "center", padding: SPACE.xl },
  brand: { alignItems: "center", marginBottom: SPACE.xxl },
  logo: { width: 84, height: 84, marginBottom: SPACE.md },
  title: { ...TYPE.title, color: COLORS.text },
  sub: { ...TYPE.caption, color: COLORS.text2, textAlign: "center", marginTop: SPACE.sm },
  error: { color: COLORS.danger, ...TYPE.caption, marginBottom: SPACE.sm },
  loading: { marginTop: SPACE.md },
  link: { color: COLORS.greenDk, fontWeight: "800", textAlign: "center", marginTop: SPACE.lg },
});
