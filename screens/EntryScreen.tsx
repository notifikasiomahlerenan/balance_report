import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../types';
import { AdBannerPlaceholder } from '../components/AdBannerPlaceholder';
import {
  addExpense,
  updateExpense,
  deleteExpense,
  getAllPersonNamesDisplay,
  savePersonName,
} from '../utils/db';
import { formatIDR, toMonthKey } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Entry'>;
const AD_HEIGHT = 70;

async function uriToDataUri(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca gambar'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export default function EntryScreen({ route, navigation }: Props) {
  const existing = route.params?.expense;
  const monthKey = route.params?.monthKey ?? toMonthKey(new Date());
  const isEdit = !!existing;

  // ── Form state ─────────────────────────────────────────────────
  const [date, setDate] = useState<Date>(
    existing ? new Date(existing.date + 'T00:00:00') : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [person, setPerson] = useState(existing?.person ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [creditText, setCreditText] = useState(existing?.credit ? String(existing.credit) : '');
  const [debitText, setDebitText] = useState(existing?.debit ? String(existing.debit) : '');
  // receiptBase64 holds the NEW photo encoded as data-URI (pending save)
  // existingBase64 holds whatever is already saved locally for this entry
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [existingBase64, setExistingBase64] = useState<string | null>(
    existing?.receiptBase64 ?? null,
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const personRef = useRef<TextInput>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Ubah Transaksi' : 'Transaksi Baru' });
    getAllPersonNamesDisplay().then(setSuggestions).catch(() => {});
  }, [isEdit, navigation]);

  // ── Date picker ────────────────────────────────────────────────
  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  // ── Camera ─────────────────────────────────────────────────────
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin diperlukan', 'Izin kamera diperlukan untuk memotret bukti transaksi.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.3,
        allowsEditing: false,
        base64: true,
        exif: false,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Kesalahan foto', 'Kamera tidak mengembalikan foto valid. Silakan coba lagi.');
        return;
      }

      // Preferred path: use base64 directly from image-picker.
      // Fallback: build data URI from file URI without expo-file-system.
      if (asset.base64) {
        setReceiptBase64(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        const dataUri = await uriToDataUri(asset.uri);
        if (!dataUri.startsWith('data:image/')) {
          Alert.alert('Kesalahan foto', 'Berkas yang diambil bukan gambar valid.');
          return;
        }
        setReceiptBase64(dataUri);
      }
    } catch (err) {
      Alert.alert('Kesalahan foto', 'Tidak dapat memproses foto: ' + String(err));
    }
  };

  const pickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin diperlukan', 'Izin galeri diperlukan untuk mengunggah bukti transaksi.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.3,
        allowsEditing: false,
        base64: true,
        exif: false,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Unggah gagal', 'Tidak dapat membaca gambar yang dipilih. Silakan coba lagi.');
        return;
      }

      if (asset.base64) {
        setReceiptBase64(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        const dataUri = await uriToDataUri(asset.uri);
        if (!dataUri.startsWith('data:image/')) {
          Alert.alert('Unggah gagal', 'Berkas yang dipilih bukan gambar valid.');
          return;
        }
        setReceiptBase64(dataUri);
      }
    } catch (err) {
      Alert.alert('Unggah gagal', 'Tidak dapat memproses gambar: ' + String(err));
    }
  };

  const removeReceipt = () => {
    setReceiptBase64(null);
    setExistingBase64(null);
  };

  // ── Credit/debit input helpers ─────────────────────────────────
  const cleanMoneyText = (text: string) => text.replace(/[^0-9]/g, '');

  const handleCreditChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCreditText(cleaned);
    if (cleaned.length > 0) setDebitText('');
  };

  const handleDebitChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setDebitText(cleaned);
    if (cleaned.length > 0) setCreditText('');
  };

  const creditValue = creditText ? Number(cleanMoneyText(creditText)) : 0;
  const debitValue = debitText ? Number(cleanMoneyText(debitText)) : 0;
  const balanceValue = creditValue - debitValue;

  const creditPreview = creditText ? formatIDR(creditValue) : '';
  const debitPreview = debitText ? formatIDR(debitValue) : '';
  const balancePreview = creditText || debitText ? formatIDR(balanceValue) : '';

  // ── Validate ───────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!person.trim()) return 'Nama pelapor wajib diisi.';
    if (!description.trim()) return 'Deskripsi wajib diisi.';
    const hasCredit = creditText.trim().length > 0;
    const hasDebit = debitText.trim().length > 0;
    if (hasCredit && hasDebit) return 'Isi kredit atau debit saja (bukan keduanya).';
    if (!hasCredit && !hasDebit) return 'Isi nominal kredit atau debit.';
    const c = Number(cleanMoneyText(creditText));
    const d = Number(cleanMoneyText(debitText));
    if (hasCredit && (!Number.isFinite(c) || c <= 0)) return 'Nominal kredit tidak valid.';
    if (hasDebit && (!Number.isFinite(d) || d <= 0)) return 'Nominal debit tidak valid.';
    return null;
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Belum lengkap', err); return; }

    setSaving(true);
    try {
      // Use new photo if taken, otherwise keep existing, otherwise null
      const finalBase64: string | null = receiptBase64 ?? existingBase64;

      const isoDate = date.toISOString().split('T')[0];
      const now = Date.now();
      const payload = {
        date: isoDate,
        person: person.trim(),
        description: description.trim(),
        credit: creditValue,
        debit: debitValue,
        receiptBase64: finalBase64,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (isEdit && existing) {
        await updateExpense(monthKey, existing.id, payload);
      } else {
        await addExpense(monthKey, payload);
      }

      await savePersonName(person.trim()).catch(() => {});
      navigation.goBack();
    } catch (err) {
      Alert.alert('Simpan gagal', String(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Hapus transaksi',
      'Transaksi ini akan dihapus permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteExpense(monthKey, existing!.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Hapus gagal', String(err));
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  // ── Autocomplete filter ────────────────────────────────────────
  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(person.toLowerCase()) &&
      s.toLowerCase() !== person.toLowerCase(),
  );

  // Show new photo if taken, otherwise show existing saved photo
  const activeReceipt = receiptBase64 ?? existingBase64;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: 20 + AD_HEIGHT }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Date ── */}
        <Text style={styles.label}>Tanggal</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>
            {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.dateBtnIcon}>📅</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {/* ── Reporter ── */}
        <Text style={styles.label}>Pelapor</Text>
        <TextInput
          ref={personRef}
          style={styles.input}
          value={person}
          onChangeText={setPerson}
          placeholder="Nama pelapor"
          placeholderTextColor="#bbb"
          autoCapitalize="words"
          returnKeyType="next"
        />
        {person.length > 0 && filteredSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {filteredSuggestions.map((s) => (
              <TouchableOpacity key={s} onPress={() => setPerson(s)} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {person.length === 0 && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} onPress={() => setPerson(s)} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Description ── */}
        <Text style={styles.label}>Deskripsi</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={description}
          onChangeText={setDescription}
          placeholder="Isi deskripsi"
          placeholderTextColor="#bbb"
          multiline
          numberOfLines={2}
          returnKeyType="next"
        />

        {/* ── Credit / Debit ── */}
        <Text style={styles.label}>Kredit (IDR)</Text>
        <TextInput
          style={styles.input}
          value={creditText}
          onChangeText={handleCreditChange}
          placeholder="0"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          returnKeyType="next"
        />
        {creditPreview !== '' && <Text style={styles.amountPreview}>{creditPreview}</Text>}

        <Text style={styles.label}>Debit (IDR)</Text>
        <TextInput
          style={styles.input}
          value={debitText}
          onChangeText={handleDebitChange}
          placeholder="0"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          returnKeyType="done"
        />
        {debitPreview !== '' && <Text style={styles.amountPreview}>{debitPreview}</Text>}

        <Text style={styles.label}>Saldo (Kredit − Debit)</Text>
        <View style={[styles.input, { justifyContent: 'center' }]}>
          <Text style={{ fontSize: 17, color: '#222', fontWeight: '700' }}>
            {balancePreview || '—'}
          </Text>
        </View>

        {/* ── Receipt ── */}
        <Text style={styles.label}>Bukti transaksi</Text>
        {activeReceipt ? (
          <View style={styles.receiptBox}>
            <Image source={{ uri: activeReceipt }} style={styles.receiptThumb} resizeMode="cover" />
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
                <Text style={styles.retakeBtnText}>📷  Ambil ulang</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickFromLibrary}>
                <Text style={styles.uploadBtnText}>🖼️  Unggah</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={removeReceipt}>
                <Text style={styles.removeBtnText}>✕  Hapus bukti</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.receiptChoiceRow}>
            <TouchableOpacity style={[styles.cameraBtn, styles.receiptChoiceBtn]} onPress={takePhoto}>
              <Text style={styles.cameraBtnText}>📷  Ambil foto</Text>
              <Text style={styles.cameraBtnSub}>Opsional</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.libraryBtn, styles.receiptChoiceBtn]} onPress={pickFromLibrary}>
              <Text style={styles.libraryBtnText}>🖼️  Unggah</Text>
              <Text style={styles.cameraBtnSub}>Opsional</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bottom actions ── */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? 'Perbarui' : 'Simpan'}</Text>
            )}
          </TouchableOpacity>

          {isEdit && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Text style={styles.deleteBtnText}>Hapus transaksi</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Banner ad (placeholder) ── */}
      <View style={[styles.adDock, { height: AD_HEIGHT }]}>
        <AdBannerPlaceholder height={AD_HEIGHT - 10} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6fb' },
  container: { padding: 20 },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 17,
    color: '#222',
  },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },

  dateBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBtnText: { fontSize: 17, color: '#222', fontWeight: '600' },
  dateBtnIcon: { fontSize: 18 },

  suggestionsBox: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  chip: {
    backgroundColor: colors.primaryMutedBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 14, color: colors.primary, fontWeight: '700' },

  amountPreview: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },

  cameraBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 22,
    alignItems: 'center',
  },
  cameraBtnText: { fontSize: 16, color: colors.primary, fontWeight: '800' },
  cameraBtnSub: { fontSize: 12, color: '#aaa', marginTop: 4 },

  receiptChoiceRow: { flexDirection: 'row', gap: 12 },
  receiptChoiceBtn: { flex: 1 },
  libraryBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8a8fa3',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 22,
    alignItems: 'center',
  },
  libraryBtnText: { fontSize: 16, color: '#586075', fontWeight: '800' },

  receiptBox: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  receiptThumb: { width: '100%', height: 180 },
  receiptActions: { flexDirection: 'row', padding: 10, gap: 10 },
  retakeBtn: {
    flex: 1,
    backgroundColor: colors.primaryMutedBg,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retakeBtnText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#3f51b5', fontWeight: '800', fontSize: 15 },
  removeBtn: {
    flex: 1,
    backgroundColor: '#fdecea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeBtnText: { color: '#c62828', fontWeight: '800', fontSize: 15 },

  bottomActions: { marginTop: 28, gap: 12 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  deleteBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e53935',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#e53935', fontSize: 16, fontWeight: '800' },

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
});
