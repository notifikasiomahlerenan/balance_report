import { Alert, Linking } from 'react-native';

export async function openMailto(email: string, subject?: string): Promise<void> {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  const url = `mailto:${email}${q}`;
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert('Email', `Kirim email ke:\n${email}`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Email', `Kirim email ke:\n${email}`);
  }
}
