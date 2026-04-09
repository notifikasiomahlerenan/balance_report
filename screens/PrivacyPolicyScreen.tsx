/**
 * Dev reminder: if the app later adds cloud sync or a remote backend, revise this text
 * and the public policy page accordingly.
 */
import React, { useLayoutEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { APP_CONTACT, PRIVACY_POLICY_URL } from '../constants/contact';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: PRIVACY_POLICY_URL
        ? () => (
            <TouchableOpacity
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL!)}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={styles.headerLink}>Situs</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation]);

  const updated = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>Terakhir diperbarui: {updated}</Text>

      <Text style={styles.h1}>Kebijakan Privasi</Text>
      <Text style={styles.p}>
        Kebijakan ini menjelaskan bagaimana aplikasi <Text style={styles.bold}>Buku Kas Debit Kredit – Beserta Bukti Transaksi</Text>{' '}
        (“Aplikasi”) memproses informasi ketika Anda menggunakannya.
      </Text>

      <Text style={styles.h2}>1. Informasi yang diproses</Text>
      <Text style={styles.p}>
        • Data transaksi yang Anda masukkan: tanggal, nama pelapor, deskripsi, nominal kredit/debit, dan informasi terkait saldo per baris.{'\n'}
        • Foto bukti transaksi (opsional), jika Anda mengambil atau mengunggah gambar.
      </Text>

      <Text style={styles.h2}>2. Penyimpanan di perangkat Anda</Text>
      <Text style={styles.p}>
        Data transaksi dan foto bukti (jika ada) disimpan secara lokal di perangkat Anda, termasuk melalui basis data lokal (misalnya SQLite) sesuai versi Aplikasi yang terpasang. Kami tidak mengunggah data transaksi atau bukti tersebut ke server kami untuk sinkronisasi cloud melalui Aplikasi ini.
      </Text>

      <Text style={styles.h2}>3. Iklan (Google AdMob)</Text>
      <Text style={styles.p}>
        Jika Aplikasi menampilkan iklan melalui Google AdMob, Google dapat mengumpulkan dan memproses informasi terkait penyajian dan pengukuran iklan sesuai kebijakan Google, yang dapat mencakup pengenal periklanan pada perangkat Anda.
      </Text>

      <Text style={styles.h2}>4. Berbagi kepada pihak ketiga</Text>
      <Text style={styles.p}>
        Data transaksi dan bukti Anda tidak dikirim ke server kami sebagaimana dijelaskan di atas. Untuk iklan, Google (AdMob) dapat memproses data terkait iklan sesuai kebijakannya. Kami tidak menjual data pribadi Anda.
      </Text>

      <Text style={styles.h2}>5. Retensi dan penghapusan</Text>
      <Text style={styles.p}>
        Data lokal tetap ada di perangkat hingga Anda menghapusnya melalui fitur dalam Aplikasi atau menghapus Aplikasi dari perangkat. Untuk bantuan khusus, hubungi kami melalui email di bawah.
      </Text>

      <Text style={styles.h2}>6. Anak-anak</Text>
      <Text style={styles.p}>Aplikasi tidak ditujukan untuk anak di bawah 13 tahun.</Text>

      <Text style={styles.h2}>7. Perubahan</Text>
      <Text style={styles.p}>
        Kami dapat memperbarui Kebijakan ini. Tanggal pembaruan dicantumkan di bagian atas halaman ini. Versi yang sama dapat dipublikasikan di situs web publik bila tersedia (tombol “Situs” di pojok kanan atas ketika URL sudah diatur).
      </Text>

      <Text style={styles.h2}>8. Kontak</Text>
      <Text style={styles.p}>
        Dukungan: {APP_CONTACT.supportEmail}{'\n'}
        Buku Kas: {APP_CONTACT.supportBukuKasEmail}{'\n'}
        Pertanyaan kebijakan privasi: {APP_CONTACT.privacyEmail}
      </Text>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6fb' },
  content: { padding: 20, paddingBottom: 48 },
  headerLink: { color: '#fff', fontWeight: '800', fontSize: 15 },
  meta: { fontSize: 12, color: '#666', marginBottom: 16 },
  h1: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 18, marginBottom: 8 },
  p: { fontSize: 15, color: '#333', lineHeight: 24 },
  bold: { fontWeight: '800' },
});
