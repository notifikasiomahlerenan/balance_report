import React, { useLayoutEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { APP_CONTACT, TERMS_OF_USE_URL } from '../constants/contact';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfUse'>;

export default function TermsOfUseScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: TERMS_OF_USE_URL
        ? () => (
            <TouchableOpacity
              onPress={() => Linking.openURL(TERMS_OF_USE_URL!)}
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

      <Text style={styles.h1}>Ketentuan Penggunaan</Text>
      <Text style={styles.p}>
        Dengan mengunduh atau menggunakan aplikasi <Text style={styles.bold}>Buku Kas Debit Kredit – Beserta Bukti Transaksi</Text>{' '}
        (“Aplikasi”), Anda menyetujui ketentuan berikut.
      </Text>

      <Text style={styles.h2}>1. Lisensi penggunaan</Text>
      <Text style={styles.p}>
        Kami memberi Anda lisensi terbatas, non-eksklusif, dan dapat dibatalkan untuk menggunakan Aplikasi sesuai peruntukannya: pencatatan kas debit/kredit, bukti transaksi opsional, dan ekspor PDF, sesuai fitur yang tersedia pada versi yang Anda pasang.
      </Text>

      <Text style={styles.h2}>2. Data Anda</Text>
      <Text style={styles.p}>
        Anda bertanggung jawab atas kebenaran data yang Anda masukkan. Data disimpan di perangkat Anda; Anda bertanggung jawab atas cadangan, keamanan perangkat, dan risiko kehilangan data jika perangkat rusak atau Aplikasi dihapus, kecuali Anda memiliki salinan cadangan sendiri.
      </Text>

      <Text style={styles.h2}>3. Iklan</Text>
      <Text style={styles.p}>
        Aplikasi dapat menampilkan iklan (misalnya melalui Google AdMob). Penyedia iklan memiliki kebijakan sendiri mengenai data yang diproses untuk menyajikan dan mengukur iklan.
      </Text>

      <Text style={styles.h2}>4. Perubahan Aplikasi</Text>
      <Text style={styles.p}>
        Kami dapat memperbarui, mengubah, atau menghentikan fitur Aplikasi sewaktu-waktu. Ketentuan ini dapat diperbarui; tanggal pembaruan dicantumkan di bagian atas halaman ini.
      </Text>

      <Text style={styles.h2}>5. Penyangkalan</Text>
      <Text style={styles.p}>
        Aplikasi disediakan “sebagaimana adanya”. Aplikasi ini tidak merupakan saran akuntansi, pajak, atau hukum. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan Aplikasi, sejauh diizinkan oleh hukum yang berlaku.
      </Text>

      <Text style={styles.h2}>6. Hukum yang berlaku</Text>
      <Text style={styles.p}>
        Ketentuan ini tunduk pada hukum Republik Indonesia, kecuali ditentukan lain oleh hukum wajib di wilayah Anda.
      </Text>

      <Text style={styles.h2}>7. Kontak</Text>
      <Text style={styles.p}>
        Dukungan: {APP_CONTACT.supportEmail}{'\n'}
        Buku Kas: {APP_CONTACT.supportBukuKasEmail}{'\n'}
        Pertanyaan ketentuan: {APP_CONTACT.termsEmail}
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
