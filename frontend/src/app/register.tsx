import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SPACE, TYPE } from "../constants/theme";
import { CONFIG } from "../lib/config";
import { api } from "../lib/api";
import { Field, PrimaryButton } from "../components/FinanceUI";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name || !email || !password) { setError("กรุณากรอกข้อมูลให้ครบทุกช่อง"); return; }
    try {
      setLoading(true); setError(null);
      const { token } = await api.register(name, email, password);
      await AsyncStorage.setItem(CONFIG.TOKEN_KEY, token);
      router.replace("/(tabs)");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenContent} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        <TouchableOpacity style={s.backButton} onPress={() => router.replace("/login")} accessibilityRole="button" accessibilityLabel="กลับเข้าสู่ระบบ">
          <Text style={s.backText}>← กลับเข้าสู่ระบบ</Text>
        </TouchableOpacity>
        <Image source={require("../../assets/images/student-finance-mark.svg")} style={s.logo} accessibilityLabel="Student Finance logo" />
        <Text style={s.eyebrow}>เริ่มต้นใช้งาน</Text>
        <Text style={s.title}>สมัครสมาชิก</Text>
        <Text style={s.sub}>สร้างบัญชีเพื่อเริ่มวางแผนการเงินของคุณ</Text>
        <Field label="ชื่อ-นามสกุล" value={name} onChangeText={setName} placeholder="ชื่อของคุณ" />
        <Field label="อีเมล" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
        <Field label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <PrimaryButton title={loading ? "กำลังสมัคร..." : "สร้างบัญชี"} onPress={handleRegister} disabled={loading} />
        <Link href="/login" style={s.link}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  screenContent: { flexGrow: 1, justifyContent: "center", padding: SPACE.lg },
  form: { width: "100%", maxWidth: 520, alignSelf: "center", padding: SPACE.xl },
  backButton: { alignSelf: "flex-start", marginBottom: SPACE.xl, paddingVertical: SPACE.xs, paddingHorizontal: SPACE.xs },
  backText: { color: COLORS.greenDk, fontWeight: "800", fontSize: 14 },
  logo: { width: 56, height: 56, marginBottom: SPACE.lg },
  eyebrow: { ...TYPE.caption, color: COLORS.greenDk, fontWeight: "700" },
  title: { ...TYPE.title, color: COLORS.text, marginTop: 4 },
  sub: { ...TYPE.body, color: COLORS.text2, marginTop: 4, marginBottom: SPACE.xl },
  error: { color: COLORS.danger, ...TYPE.caption, marginBottom: SPACE.sm },
  link: { color: COLORS.greenDk, fontWeight: "800", textAlign: "center", marginTop: SPACE.lg },
});
