import { useCallback, useState } from "react";
import { ScrollView, Text, ActivityIndicator, View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Card, Field, PrimaryButton, SecondaryButton, SectionTitle } from "../../components/FinanceUI";
import { COLORS } from "../../constants/theme";

function ProfileLegacy() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const p = await api.getProfile();
      setProfile(p);
      setIncome(String(p.baseMonthlyIncome));
      setBudget(String(p.monthlyBudgetGoal));
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    try {
      setBusy(true);
      await api.updateProfile({ baseMonthlyIncome: income, monthlyBudgetGoal: budget });
      setMessage("บันทึกข้อมูลแล้ว");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 50 }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
        บัญชีของฉัน
      </Text>
      <Text>{profile?.name}</Text>
      <Text style={{ marginBottom: 20 }}>{profile?.email}</Text>

      <Field
        label="รายรับประจำที่คาดไว้ต่อเดือน"
        value={income}
        onChangeText={setIncome}
        keyboardType="numeric"
      />
      <Field
        label="เป้าหมายงบรวมต่อเดือน"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />
      <Text style={{ color: COLORS.text2, marginBottom: 12 }}>
        ค่าที่ตั้งไว้ใช้วางแผนเท่านั้น ยอดบนหน้าแรกคำนวณจากรายการที่บันทึกจริง
      </Text>

      {busy ? <ActivityIndicator /> : null}
      {message ? <Text>{message}</Text> : null}
      <PrimaryButton title="บันทึกข้อมูล" onPress={save} disabled={busy || !profile} />
      <PrimaryButton
        title="ออกจากระบบ"
        onPress={async () => {
          await api.logout();
          router.replace("/login");
        }}
      />
    </ScrollView>
  );
}

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [profile, setProfile] = useState<any>(null);
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const p = await api.getProfile();
      setProfile(p);
      setIncome(String(p.baseMonthlyIncome ?? 0));
      setBudget(String(p.monthlyBudgetGoal ?? 0));
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    try {
      setBusy(true);
      await api.updateProfile({ baseMonthlyIncome: income, monthlyBudgetGoal: budget });
      setMessage("บันทึกข้อมูลแล้ว");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={s2.wrap}
      contentContainerStyle={[s2.content, isWide && s2.contentWide]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s2.hero}>
        <Image source={require("../../../assets/images/student-finance-mark.svg")} style={s2.mark} />
        <View style={s2.heroText}>
          <Text style={s2.eyebrow}>บัญชีของฉัน</Text>
          <Text style={s2.title}>จัดการโปรไฟล์</Text>
          <Text style={s2.subtitle}>ตั้งค่าข้อมูลเพื่อให้วางแผนการเงินได้ตรงขึ้น</Text>
        </View>
      </View>

      <Card style={s2.profileCard}>
        <Text style={s2.name}>{profile?.name || "นักศึกษา"}</Text>
        <Text style={s2.email}>{profile?.email || "กำลังโหลดข้อมูล..."}</Text>
        <View style={s2.divider} />
        <View style={s2.statRow}>
          <View><Text style={s2.statLabel}>รายรับที่ตั้งไว้</Text><Text style={s2.statValue}>฿{Number(income || 0).toLocaleString("th-TH")}</Text></View>
          <View><Text style={s2.statLabel}>เป้าหมายงบประมาณ</Text><Text style={s2.statValue}>฿{Number(budget || 0).toLocaleString("th-TH")}</Text></View>
        </View>
      </Card>

      <SectionTitle title="แผนการเงินของฉัน" />
      <Card style={s2.formCard}>
        <Field label="รายรับประจำที่คาดไว้ต่อเดือน" value={income} onChangeText={setIncome} keyboardType="numeric" />
        <Field label="เป้าหมายงบรวมต่อเดือน" value={budget} onChangeText={setBudget} keyboardType="numeric" />
        <Text style={s2.hint}>ใช้สำหรับวางแผนเท่านั้น ยอดบนหน้าภาพรวมจะคำนวณจากรายการที่บันทึกจริง</Text>
      </Card>

      {busy ? <ActivityIndicator color={COLORS.greenDk} style={s2.loading} /> : null}
      {message ? <Text style={s2.message}>{message}</Text> : null}
      <PrimaryButton title="บันทึกการตั้งค่า" onPress={save} disabled={busy || !profile} />
      <SecondaryButton title="ออกจากระบบ" onPress={async () => { await api.logout(); router.replace("/login"); }} />
    </ScrollView>
  );
}

const s2 = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  content: { flexGrow: 1, width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 },
  contentWide: { paddingHorizontal: 32 },
  hero: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  mark: { width: 62, height: 62, marginRight: 14 },
  heroText: { flex: 1 },
  eyebrow: { color: COLORS.greenDk, fontSize: 13, fontWeight: "700", marginBottom: 3 },
  title: { color: COLORS.text, fontSize: 25, lineHeight: 31, fontWeight: "800" },
  subtitle: { color: COLORS.text2, fontSize: 13, lineHeight: 19, marginTop: 5 },
  profileCard: { padding: 20, marginBottom: 28 },
  name: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  email: { color: COLORS.text2, fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  statLabel: { color: COLORS.textMute, fontSize: 12, marginBottom: 5 },
  statValue: { color: COLORS.greenDk, fontSize: 17, fontWeight: "800" },
  formCard: { padding: 18, marginBottom: 16 },
  hint: { color: COLORS.text2, fontSize: 12, lineHeight: 18, marginTop: 2 },
  loading: { marginVertical: 8 },
  message: { color: COLORS.success, fontSize: 13, textAlign: "center", marginVertical: 8 },
});
