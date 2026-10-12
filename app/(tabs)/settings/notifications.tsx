/** Account notification preferences persist through the existing settings API. */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, DeviceEventEmitter, Linking, Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import { Card, ScreenShell, SectionTitle, SmallText, ToggleRow } from "@/src/components/settings/_ui";
import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import { getSessionGeneration, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { setPushPreferences, PUSH_PREFERENCES_CHANGED } from "@/src/features/notifications/usePushRegistration";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

const defaults = { push: true, email: false, messages: true, buzz: true, likes: true, wingman: true };
const Notifications = Constants.appOwnership === "expo" ? null : require("expo-notifications");
export default function NotificationSettings() {
  const { colors } = useRomBuzzTheme();
  const [prefs, setPrefs] = useState<typeof defaults | null>(null);
  const [permission, setPermission] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const owner = useRef(getSessionGeneration()).current;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const load = async () => {
      try {
        const data = await rbzApiJson<any>("/settings");
        if (alive.current && isSessionCurrent(owner)) setPrefs({ ...defaults, ...data.settings?.notifications });
      } catch { if (alive.current) Alert.alert("Notifications", "Could not load your preferences. Reopen this screen to retry."); }
    };
    const readPermission = async () => {
      const status = (await Notifications?.getPermissionsAsync())?.status || "unavailable";
      if (alive.current) setPermission(status);
    };
    void load(); void readPermission();
    const app = AppState.addEventListener("change", state => { if (state === "active") void readPermission(); });
    return () => { alive.current = false; app.remove(); };
  }, [owner]);
  const change = async (key: keyof typeof defaults, value: boolean) => {
    if (busy.current || !prefs || !isSessionCurrent(owner)) return;
    busy.current = true; setSaving(true);
    try {
      const data = await rbzApiJson<any>("/settings", { method: "PUT", body: JSON.stringify({ notifications: { [key]: value } }) });
      if (!alive.current || !isSessionCurrent(owner)) return;
      setPrefs({ ...defaults, ...data.settings.notifications });
      setPushPreferences(data.settings.notifications, owner);
      DeviceEventEmitter.emit(PUSH_PREFERENCES_CHANGED, { askPermission: key === "push" && value });
    } catch { if (alive.current && isSessionCurrent(owner)) Alert.alert("Notifications", "Could not save. Your previous setting is still active."); }
    finally { busy.current = false; if (alive.current) setSaving(false); }
  };
  return <ScreenShell title="Notifications">
    <SectionTitle>Preferences</SectionTitle>
    {!prefs ? <ActivityIndicator color={colors.brand} /> : <View pointerEvents={saving ? "none" : "auto"}>
      <Card>
        <ToggleRow icon="notifications-outline" label="Push notifications" value={prefs.push} onChange={value => void change("push", value)} />
        <ToggleRow icon="chatbubble-outline" label="Messages and calls" value={prefs.messages} onChange={value => void change("messages", value)} />
        <ToggleRow icon="heart-outline" label="Matches and buzz" value={prefs.buzz} onChange={value => void change("buzz", value)} />
        <ToggleRow icon="thumbs-up-outline" label="Likes and activity" value={prefs.likes} onChange={value => void change("likes", value)} />
        <ToggleRow icon="sparkles-outline" label="Wingman notifications" value={prefs.wingman} onChange={value => void change("wingman", value)} />
        <ToggleRow icon="mail-outline" label="Email notifications" value={prefs.email} onChange={value => void change("email", value)} />
      </Card>
    </View>}
    {saving && <SmallText>Saving...</SmallText>}
    {permission === "denied" && <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}>
      <Text style={{ color: colors.brand, paddingVertical: 16 }}>Notifications are blocked by your phone. Open system settings.</Text>
    </Pressable>}
  </ScreenShell>;
}
