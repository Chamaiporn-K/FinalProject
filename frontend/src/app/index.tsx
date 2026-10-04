import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../lib/config";
import { api } from "../lib/api";
export default function Index() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await AsyncStorage.getItem(CONFIG.TOKEN_KEY);
      if (!token) { if (active) router.replace("/login"); return; }
      try { await api.getProfile(); if (active) router.replace("/(tabs)"); }
      catch { if (active) router.replace("/login"); }
    })().catch(() => { if (active) router.replace("/login"); });
    return () => { active = false; };
  }, [router]);
  return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
}
