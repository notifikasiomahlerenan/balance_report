import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /**
   * Typical banner sizes are 50 (phone) or 90 (large banner).
   * We default to 60 to visually approximate a standard banner + padding.
   */
  height?: number;
};

export function AdBannerPlaceholder({ height = 60 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.inner}>
        <Text style={styles.small}>Sponsored</Text>
        <Text style={styles.main}>AdMob Banner (placeholder)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inner: {
    width: '100%',
    maxWidth: 520,
    height: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { fontSize: 11, color: '#6b7280', fontWeight: '700' },
  main: { marginTop: 2, fontSize: 13, color: '#111827', fontWeight: '900' },
});

