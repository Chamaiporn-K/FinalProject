import { useCallback, useState } from "react";
import { ScrollView, Text, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Field, PrimaryButton } from "../../components/FinanceUI";
import { COLORS } from "../../constants/theme";
export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try { setBusy(true); const p = await api.getProfile(); setProfile(p); setIncome(String(p.baseMonthlyIncome)); setBudget(String(p.monthlyBudgetGoal)); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function save() {
    try { setBusy(true); await api.updateProfile({ baseMonthlyIncome: income, monthlyBudgetGoal: budget }); setMessage("บันทึกข้อมูลแล้ว"); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  return <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 24, paddingTop: 50 }}>
    <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>บัญชีของฉัน</Text>
    <Text>{profile?.name}</Text><Text style={{ marginBottom: 20 }}>{profile?.email}</Text>
    <Field label="รายรับประจำที่คาดไว้ต่อเดือน" value={income} onChangeText={setIncome} keyboardType="numeric" />
    <Field label="เป้าหมายงบรวมต่อเดือน" value={budget} onChangeText={setBudget} keyboardType="numeric" />
    <Text style={{ color: COLORS.text2, marginBottom: 12 }}>ค่าที่ตั้งไว้ใช้วางแผน ยอดบนหน้าแรกคำนวณจากรายการที่บันทึกจริง</Text>
    {busy && <ActivityIndicator />}{message && <Text>{message}</Text>}
    <PrimaryButton title="บันทึกข้อมูล" onPress={save} disabled={busy || !profile} />
    <PrimaryButton title="ออกจากระบบ" onPress={async () => { await api.logout(); router.replace("/login"); }} />
  </ScrollView>;
}
