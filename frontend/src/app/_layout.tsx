import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="income-add"
        options={{ presentation: "modal", headerShown: true, title: "เพิ่มรายรับ" }}
      />
      <Stack.Screen
        name="expense-add"
        options={{ presentation: "modal", headerShown: true, title: "เพิ่มรายจ่าย" }}
      />
    </Stack>
  );
}
