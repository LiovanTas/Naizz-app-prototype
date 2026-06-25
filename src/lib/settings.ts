import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotifPrefs = {
  likes: boolean;
  follows: boolean;
  replies: boolean;
};

const KEY = 'naizz:notifPrefs';
const DEFAULTS: NotifPrefs = { likes: true, follows: true, replies: true };

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
