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
import {
  addExpense,
  updateExpense,
  deleteExpense,
  getAllPersonNamesDisplay,
  savePersonName,
} from '../utils/db';
import { formatIDR, toMonthKey } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Entry'>;

async function uriToDataUri(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read captured image'));
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
  const [place, setPlace] = useState(existing?.place ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [creditText, setCreditText] = useState(existing?.credit ? String(existing.credit) : '');
  const [debitText, setDebitText] = useState(existing?.debit ? String(existing.debit) : '');
  // receiptBase64 holds the NEW photo encoded as data-URI (pending save)
  // existingBase64 holds whatever is already saved in Firebase for this entry
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [existingBase64, setExistingBase64] = useState<string | null>(
    existing?.receiptBase64 ?? null,
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const personRef = useRef<TextInput>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Entry' : 'New Entry' });
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
        Alert.alert('Permission required', 'Camera permission is needed to take receipt photos.');
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
        Alert.alert('Photo error', 'Camera did not return a valid photo. Please retake.');
        return;
      }

      // Preferred path: use base64 directly from image-picker.
      // Fallback: build data URI from file URI without expo-file-system.
      if (asset.base64) {
        setReceiptBase64(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        const dataUri = await uriToDataUri(asset.uri);
        if (!dataUri.startsWith('data:image/')) {
          Alert.alert('Photo error', 'Captured file is not a valid image payload.');
          return;
        }
        setReceiptBase64(dataUri);
      }
    } catch (err) {
      Alert.alert('Photo error', 'Could not process photo: ' + String(err));
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
    if (!person.trim()) return 'Person name is required.';
    if (!place.trim()) return 'Place is required.';
    if (!description.trim()) return 'Description is required.';
    const hasCredit = creditText.trim().length > 0;
    const hasDebit = debitText.trim().length > 0;
    if (hasCredit && hasDebit) return 'Entry must be either credit or debit (not both).';
    if (!hasCredit && !hasDebit) return 'Enter either a credit or a debit amount.';
    const c = Number(cleanMoneyText(creditText));
    const d = Number(cleanMoneyText(debitText));
    if (hasCredit && (!Number.isFinite(c) || c <= 0)) return 'Enter a valid credit amount.';
    if (hasDebit && (!Number.isFinite(d) || d <= 0)) return 'Enter a valid debit amount.';
    return null;
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Incomplete', err); return; }

    setSaving(true);
    try {
      // Use new photo if taken, otherwise keep existing, otherwise null
      const finalBase64: string | null = receiptBase64 ?? existingBase64;

      const isoDate = date.toISOString().split('T')[0];
      const now = Date.now();
      const payload = {
        date: isoDate,
        person: person.trim(),
        place: place.trim(),
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
      Alert.alert('Save failed', String(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete expense',
      'This entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteExpense(monthKey, existing!.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Delete failed', String(err));
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ── Date ── */}
        <Text style={styles.label}>Date</Text>
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

        {/* ── Person ── */}
        <Text style={styles.label}>Person</Text>
        <TextInput
          ref={personRef}
          style={styles.input}
          value={person}
          onChangeText={setPerson}
          placeholder="Enter name"
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

        {/* ── Place ── */}
        <Text style={styles.label}>Place</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder="Enter place"
          placeholderTextColor="#bbb"
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* ── Description ── */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          placeholderTextColor="#bbb"
          multiline
          numberOfLines={2}
          returnKeyType="next"
        />

        {/* ── Credit / Debit ── */}
        <Text style={styles.label}>Credit (IDR)</Text>
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

        <Text style={styles.label}>Balance (Credit − Debit)</Text>
        <View style={[styles.input, { justifyContent: 'center' }]}>
          <Text style={{ fontSize: 17, color: '#222', fontWeight: '700' }}>
            {balancePreview || '—'}
          </Text>
        </View>

        {/* ── Receipt ── */}
        <Text style={styles.label}>Receipt Photo</Text>
        {activeReceipt ? (
          <View style={styles.receiptBox}>
            <Image source={{ uri: activeReceipt }} style={styles.receiptThumb} resizeMode="cover" />
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
                <Text style={styles.retakeBtnText}>📷  Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={removeReceipt}>
                <Text style={styles.removeBtnText}>✕  Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
            <Text style={styles.cameraBtnText}>📷  Take Receipt Photo</Text>
            <Text style={styles.cameraBtnSub}>Optional</Text>
          </TouchableOpacity>
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
              <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Save'}</Text>
            )}
          </TouchableOpacity>

          {isEdit && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
});
