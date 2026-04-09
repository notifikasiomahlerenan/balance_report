import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

type Item = {
  title: string;
  subtitle?: string;
};

function PlaceholderItem({ title, subtitle }: Item) {
  return (
    <Pressable
      onPress={() => Alert.alert('Placeholder', `"${title}" is UI-only for now (not connected yet).`)}
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

export default function SettingsScreen() {
  const items = useMemo<Item[]>(
    () => [
      { title: 'Privacy Policy', subtitle: 'Required for ads (AdMob)' },
      { title: 'Terms of Use', subtitle: 'Recommended' },
      { title: 'Manage Privacy / Ads Consent', subtitle: 'Consent & ad personalization controls' },
      { title: 'Support / Contact', subtitle: 'Email / WhatsApp / feedback form' },
      { title: 'Rate this app', subtitle: 'Open store listing' },
      { title: 'Share app', subtitle: 'Share store link' },
    ],
    [],
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About & Privacy</Text>
        <View style={styles.list}>
          {items.map((it) => (
            <PlaceholderItem key={it.title} title={it.title} subtitle={it.subtitle} />
          ))}
        </View>
      </View>

      <Text style={styles.footerHint}>
        Links are placeholders for now.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6fb' },
  content: { padding: 20, paddingBottom: 40 },

  section: { marginTop: 14 },
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

