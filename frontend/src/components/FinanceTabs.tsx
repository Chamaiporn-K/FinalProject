import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: COLORS.bg }, tabBarActiveTintColor: COLORS.greenDk, tabBarInactiveTintColor: COLORS.textMute, tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 10, backgroundColor: COLORS.card, borderTopColor: COLORS.line }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: "ภาพรวม", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="income" options={{ title: "รายรับ", tabBarIcon: ({ color, size }) => <Ionicons name="trending-up-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="expense" options={{ title: "รายจ่าย", tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="budget" options={{ title: "งบประมาณ", tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="ai" options={{ title: "คำแนะนำ", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: "บัญชี", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
  </Tabs>;
}
