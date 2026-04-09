import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_CONTACT, PLAY_STORE_LISTING_URL } from '../constants/contact';
import { openMailto } from '../utils/mailto';
import { RootStackParamList } from '../types';

type RowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function SettingsRow({ title, subtitle, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();

  const onPrivacy = useCallback(() => {
    navigation.navigate('PrivacyPolicy');
  }, [navigation]);

  const onTerms = useCallback(() => {
    navigation.navigate('TermsOfUse');
  }, [navigation]);

  const onAdsConsent = useCallback(() => {
    Alert.alert(
      'Kelola privasi & iklan',
      'Setelah AdMob dan Google UMP diaktifkan, menu ini akan membuka pengaturan izin iklan.',
    );
  }, []);

  const onSupport = useCallback(() => {
    Alert.alert('Dukungan / kontak', 'Pilih alamat email:', [
      { text: 'Batal', style: 'cancel' },
      {
        text: APP_CONTACT.supportEmail,
        onPress: () => openMailto(APP_CONTACT.supportEmail, 'Dukungan Buku Kas Debit Kredit'),
      },
      {
        text: APP_CONTACT.supportBukuKasEmail,
        onPress: () =>
          openMailto(APP_CONTACT.supportBukuKasEmail, 'Dukungan Buku Kas Debit Kredit'),
      },
    ]);
  }, []);

  const onRate = useCallback(async () => {
    if (!PLAY_STORE_LISTING_URL) {
      Alert.alert(
        'Nilai aplikasi',
        'Tautan Play Store akan ditambahkan setelah aplikasi dipublikasikan.',
      );
      return;
    }
    try {
      await Linking.openURL(PLAY_STORE_LISTING_URL);
    } catch {
      Alert.alert('Nilai aplikasi', PLAY_STORE_LISTING_URL);
    }
  }, []);

  const onShare = useCallback(async () => {
    if (!PLAY_STORE_LISTING_URL) {
      Alert.alert(
        'Bagikan aplikasi',
        'Tautan Play Store akan ditambahkan setelah aplikasi dipublikasikan.',
      );
      return;
    }
    try {
      await Share.share({
        message: `Buku Kas Debit Kredit – Beserta Bukti Transaksi\n${PLAY_STORE_LISTING_URL}`,
        url: PLAY_STORE_LISTING_URL,
      });
    } catch {
      Alert.alert('Bagikan', PLAY_STORE_LISTING_URL);
    }
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontak</Text>
        <Text style={styles.cardLine}>Dukungan: {APP_CONTACT.supportEmail}</Text>
        <Text style={styles.cardLine}>Buku Kas: {APP_CONTACT.supportBukuKasEmail}</Text>
        <Text style={styles.cardLine}>Kebijakan (email): {APP_CONTACT.privacyEmail}</Text>
        <Text style={styles.cardLine}>Ketentuan (email): {APP_CONTACT.termsEmail}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privasi & tentang</Text>
        <View style={styles.list}>
          <SettingsRow
            title="Kebijakan Privasi"
            subtitle="Baca teks lengkap di aplikasi"
            onPress={onPrivacy}
          />
          <SettingsRow
            title="Ketentuan Penggunaan"
            subtitle="Baca teks lengkap di aplikasi"
            onPress={onTerms}
          />
          <SettingsRow
            title="Kelola Privasi & Izin Iklan"
            subtitle="Akan dihubungkan ke UMP setelah AdMob aktif"
            onPress={onAdsConsent}
          />
          <SettingsRow
            title="Dukungan / Kontak"
            subtitle={`${APP_CONTACT.supportEmail} · ${APP_CONTACT.supportBukuKasEmail}`}
            onPress={onSupport}
          />
          <SettingsRow
            title="Nilai aplikasi ini"
            subtitle={
              PLAY_STORE_LISTING_URL ? 'Buka Play Store' : 'Setelah aplikasi terbit di Play Store'
            }
            onPress={onRate}
          />
          <SettingsRow
            title="Bagikan aplikasi"
            subtitle={
              PLAY_STORE_LISTING_URL ? 'Bagikan tautan Play Store' : 'Setelah ada tautan Play Store'
            }
            onPress={onShare}
          />
        </View>
      </View>

      <Text style={styles.footerHint}>
        Kebijakan Privasi dan Ketentuan Penggunaan dapat dibuka dari menu di atas. Alamat email untuk
        pertanyaan hukum tercantum pada kartu Kontak.
        {!PLAY_STORE_LISTING_URL ? '\n\nNilai dan bagikan akan aktif setelah aplikasi tersedia di Play Store.' : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6fb' },
  content: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#222', marginBottom: 8 },
  cardLine: { fontSize: 12.5, color: '#444', lineHeight: 18, marginBottom: 4 },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  list: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: { fontSize: 15, fontWeight: '800', color: '#222' },
  itemSubtitle: { marginTop: 2, fontSize: 12.5, color: '#777' },
  chevron: { marginLeft: 12, fontSize: 26, color: '#999', lineHeight: 26 },

  footerHint: { marginTop: 12, fontSize: 12.5, color: '#777', lineHeight: 18 },
});
