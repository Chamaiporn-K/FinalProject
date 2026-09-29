import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.greenDk,
        tabBarInactiveTintColor: COLORS.textMute,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "หน้าแรก", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="income" options={{ title: "รายรับ", tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} /> }} />
      <Tabs.Screen name="expense" options={{ title: "รายจ่าย", tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} /> }} />
      <Tabs.Screen name="budget" options={{ title: "เป้าหมาย", tabBarIcon: ({ color, size }) => <Ionicons name="flag" color={color} size={size} /> }} />
      <Tabs.Screen name="ai" options={{ title: "AI", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size} /> }} />
    </Tabs>
  );
}
