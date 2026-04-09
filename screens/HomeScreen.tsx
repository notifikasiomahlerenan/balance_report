import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Expense } from '../types';
import { colors } from '../constants/theme';
import { subscribeToMonthExpenses } from '../utils/db';
import { AdBannerPlaceholder } from '../components/AdBannerPlaceholder';
import {
  formatIDR,
  formatDate,
  formatDateShort,
  monthLabel,
  reporterAbbrev,
  shiftMonth,
  toMonthKey,
} from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Column widths tuned for readability on mobile.
// Intentionally wider than the viewport so the header has room (horizontal scroll).
const COL = {
  date: 72,
  rep: 56,
  desc: 200,
  credit: 120,
  debit: 120,
  balance: 120,
  rcpt: 60,
};
const TABLE_WIDTH = Object.values(COL).reduce((a, b) => a + b, 0);
const AD_HEIGHT = 70;

export default function HomeScreen({ navigation }: Props) {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const currentMonthKey = toMonthKey(new Date());

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMonthExpenses(monthKey, (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, [monthKey]);

  const rowBalance = (e: Expense) => e.credit - e.debit;

  const goMonth = (delta: number) => {
    const next = shiftMonth(monthKey, delta);
    if (next > currentMonthKey) return;
    setMonthKey(next);
  };

  const handleExportPDF = useCallback(async () => {
    if (expenses.length === 0) {
      Alert.alert('Tidak ada data', 'Tidak ada transaksi untuk diekspor pada bulan ini.');
      return;
    }
    setExporting(true);
    try {
      const rows = expenses
        .map(
          (e) => `
          <tr>
            <td>${formatDate(e.date)}</td>
            <td>${e.person}</td>
            <td>${e.description}</td>
            <td class="amount">${formatIDR(e.credit)}</td>
            <td class="amount">${formatIDR(e.debit)}</td>
            <td class="amount">${formatIDR(rowBalance(e))}</td>
            <td class="center">${e.receiptBase64 ? '&#10003;' : '&mdash;'}</td>
          </tr>`,
        )
        .join('');

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #222; }
  h2 { font-size: 16px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 10px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${colors.primary}; color: #fff; padding: 7px 6px; text-align: left; font-size: 10px; }
  td { padding: 6px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8f9fa; }
  .amount { text-align: right; }
  .center { text-align: center; }
  .footer { margin-top: 16px; color: #999; font-size: 9px; }
</style>
</head>
<body>
<h2>Buku Kas &ndash; ${monthLabel(monthKey)}</h2>
<p class="subtitle">Dibuat ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;|&nbsp; ${expenses.length} transaksi</p>
<table>
  <thead>
    <tr>
      <th>Tanggal</th><th>Pelapor</th><th>Deskripsi</th>
      <th class="amount">Kredit (IDR)</th><th class="amount">Debit (IDR)</th><th class="amount">Saldo</th><th class="center">Bukti</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p class="footer">Foto bukti tidak disertakan dalam PDF ini. Lihat bukti di aplikasi.</p>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Laporan Kas ${monthLabel(monthKey)}`,
      });
    } catch (err) {
      Alert.alert('Ekspor gagal', String(err));
    } finally {
      setExporting(false);
    }
  }, [expenses, monthKey]);

  // Put PDF action in the native header (same pattern as Entry screen)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightRow}>
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={exporting}
            style={styles.headerPdfBtn}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.headerPdfBtnText}>PDF</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Buka pengaturan"
          >
            <Text style={styles.headerIconBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [exporting, handleExportPDF, navigation]);

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.date }]}>Tgl</Text>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.rep }]}>Pel</Text>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.desc }]}>Deskripsi</Text>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.credit }]}>Kredit</Text>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.debit }]}>Debit</Text>
      <Text style={[styles.th, styles.vSepHeader, { width: COL.balance }]}>Saldo</Text>
      <Text style={[styles.th, { width: COL.rcpt }, styles.thCenter]}>Bukti</Text>
    </View>
  );

  const renderRow = ({ item, index }: { item: Expense; index: number }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Entry', { expense: item, monthKey })}
      style={[styles.row, index % 2 === 1 && styles.rowAlt]}
    >
      <Text style={[styles.td, styles.vSepRow, styles.tdPadLeft, { width: COL.date }]} numberOfLines={1}>
        {formatDateShort(item.date)}
      </Text>
      {/* subtle vertical separators between columns */}
      <Text style={[styles.td, styles.vSepRow, { width: COL.rep }, styles.tdCenter]} numberOfLines={1}>
        {reporterAbbrev(item.person)}
      </Text>
      <Text style={[styles.td, styles.vSepRow, styles.tdPadLeft, { width: COL.desc }]} numberOfLines={1}>
        {item.description}
      </Text>
      <Text style={[styles.td, styles.vSepRow, { width: COL.credit }, styles.tdRight]} numberOfLines={1}>
        {item.credit ? formatIDR(item.credit) : ''}
      </Text>
      <Text style={[styles.td, styles.vSepRow, { width: COL.debit }, styles.tdRight]} numberOfLines={1}>
        {item.debit ? formatIDR(item.debit) : ''}
      </Text>
      <Text style={[styles.td, styles.vSepRow, { width: COL.balance }, styles.tdRight]} numberOfLines={1}>
        {formatIDR(rowBalance(item))}
      </Text>
      <TouchableOpacity
        style={[styles.rcptCell, { width: COL.rcpt }]}
        onPress={() => item.receiptBase64 && setPreviewUrl(item.receiptBase64)}
        disabled={!item.receiptBase64}
      >
        {item.receiptBase64 ? (
          <View style={styles.rcptBadgeYes}>
            <Text style={styles.rcptTextYes}>&#128247;</Text>
          </View>
        ) : (
          <View style={styles.rcptBadgeNo}>
            <Text style={styles.rcptTextNo}>—</Text>
          </View>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageScrollContent, { paddingBottom: 20 + AD_HEIGHT }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Month selector (card, like Entry page inputs) */}
        <View style={styles.card}>
          <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => goMonth(-1)} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel(monthKey)}</Text>
          <TouchableOpacity
            onPress={() => goMonth(1)}
            disabled={monthKey >= currentMonthKey}
            style={styles.monthArrow}
          >
            <Text
              style={[
                styles.monthArrowText,
                monthKey >= currentMonthKey && styles.monthArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* ── Table ── */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
        ) : expenses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Tidak ada transaksi untuk {monthLabel(monthKey)}.</Text>
            <Text style={styles.emptyHint}>Ketuk + untuk menambah.</Text>
          </View>
        ) : (
          <View style={[styles.card, styles.tableCard]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ width: TABLE_WIDTH }}>
                {renderHeader()}
                {expenses.map((e, idx) => (
                  <View key={e.id}>{renderRow({ item: e, index: idx })}</View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Entry', { monthKey })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── Banner ad (placeholder) ── */}
      <View style={[styles.adDock, { height: AD_HEIGHT }]}>
        <AdBannerPlaceholder height={AD_HEIGHT - 10} />
      </View>

      {/* ── Receipt preview modal ── */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewUrl(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalClose}>✕  ketuk untuk menutup</Text>
            {previewUrl && (
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6fb' },
  pageScroll: { flex: 1 },
  pageScrollContent: { padding: 20, paddingBottom: 0 },

  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerPdfBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  headerPdfBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  headerIconBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  headerIconBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  monthArrow: { paddingHorizontal: 18, paddingVertical: 4 },
  monthArrowText: { fontSize: 30, color: colors.primary, fontWeight: '300' },
  monthArrowDisabled: { color: '#ccc' },
  monthLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    minWidth: 180,
    textAlign: 'center',
  },

  tableCard: { marginTop: 12, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  th: { color: '#fff', fontSize: 14, fontWeight: '900', paddingHorizontal: 3, textAlign: 'center' },
  thRight: { textAlign: 'right' },
  thCenter: { textAlign: 'center' },
  vSepHeader: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.6)' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowAlt: { backgroundColor: colors.rowAlt },
  td: { fontSize: 15, color: '#333', paddingHorizontal: 3 },
  tdRight: { textAlign: 'right' },
  tdCenter: { textAlign: 'center' },
  tdPadLeft: { paddingLeft: 10 },
  vSepRow: { borderRightWidth: 1, borderRightColor: '#c9cfdd' },

  rcptCell: { alignItems: 'center', justifyContent: 'center' },
  rcptBadgeYes: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  rcptTextYes: { fontSize: 16 },
  rcptBadgeNo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rcptTextNo: { fontSize: 14, color: '#bbb' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666', fontSize: 16, fontWeight: '600' },
  emptyHint: { color: '#aaa', fontSize: 14, marginTop: 6 },

  fab: {
    position: 'absolute',
    bottom: 28 + AD_HEIGHT,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },

  adDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: { width: '92%', alignItems: 'center' },
  modalClose: { color: '#fff', marginBottom: 12, fontSize: 13 },
  previewImage: { width: '100%', height: 480, borderRadius: 8 },
});
