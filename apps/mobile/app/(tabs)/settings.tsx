import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ENTITLEMENTS } from '@rail/core';

import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/state/session';
import { useWardrobe } from '../../src/data/garments';
import { colours, spacing, radius, type as t, minTouch } from '../../src/theme';

/**
 * Settings carries the two GDPR obligations that spec §7 says must be
 * implemented rather than stubbed: data export and full account deletion.
 * Both are real here — export writes a file the user can take away, and
 * deletion calls the Edge Function that removes the auth row and the images.
 */
export default function Settings() {
  const { session, entitlement, signOut } = useSession();
  const wardrobe = useWardrobe();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const garmentCount = wardrobe.data?.garments.length ?? 0;
  const limit = ENTITLEMENTS[entitlement].garments;

  const exportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc('export_my_data');
      if (error) throw error;

      const path = `${FileSystem.cacheDirectory}rail-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));

      // Hand it to the share sheet rather than uploading anywhere — the point of
      // a data export is that the user holds the copy.
      await Share.share({ url: path, title: 'Rail data export' });
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This removes your wardrobe, outfits, photos and account permanently. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => void deleteAccount(),
        },
      ],
    );
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      // The auth row is gone, so the local session is meaningless. signOut also
      // clears the SQLite mirror.
      await signOut();
    } catch (error) {
      Alert.alert(
        'Deletion failed',
        error instanceof Error ? error.message : 'Please try again, or contact support.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.body}>{session?.user.email ?? 'Not signed in'}</Text>
        <Text style={styles.muted}>
          {entitlement === 'rail_full'
            ? 'Full access'
            : `Free tier · ${garmentCount} of ${limit} garments`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your data</Text>
        <Text style={styles.muted}>
          Your wardrobe photos are stored privately and are never public. Export takes a
          copy of everything we hold about you.
        </Text>

        <Pressable
          style={styles.secondary}
          onPress={() => void exportData()}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel="Export my data"
        >
          {exporting ? (
            <ActivityIndicator color={colours.accent} />
          ) : (
            <Text style={styles.secondaryText}>Export my data</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign out</Text>
        <Text style={styles.muted}>
          Your saved wardrobe is removed from this device and restored when you sign in again.
        </Text>
        <Pressable
          style={styles.secondary}
          onPress={() => void signOut()}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.secondaryText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delete account</Text>
        <Text style={styles.muted}>
          Removes your wardrobe, outfits, photos and account permanently.
        </Text>
        <Pressable
          style={styles.destructive}
          onPress={confirmDelete}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Delete my account permanently"
        >
          {deleting ? (
            <ActivityIndicator color={colours.danger} />
          ) : (
            <Text style={styles.destructiveText}>Delete my account</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    gap: spacing.sm,
  },
  cardTitle: { ...t.heading, color: colours.text },
  body: { ...t.body, color: colours.text },
  muted: { ...t.caption, color: colours.textMuted },

  secondary: {
    minHeight: minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...t.label, color: colours.accent },

  destructive: {
    minHeight: minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveText: { ...t.label, color: colours.danger },
});
