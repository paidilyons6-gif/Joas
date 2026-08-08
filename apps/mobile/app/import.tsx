import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { INTAKE, ENTITLEMENTS } from '@rail/core';

import { useSession } from '../src/state/session';
import { garmentKeys } from '../src/data/garments';
import {
  importPhoto,
  useImportLink,
  FreeTierLimitError,
  type ImportJob,
} from '../src/data/import';
import { colours, spacing, radius, type as t, minTouch } from '../src/theme';

export default function Import() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, entitlement } = useSession();
  const importLink = useImportLink();

  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [link, setLink] = useState('');
  const [limitHit, setLimitHit] = useState<string | null>(null);

  const userId = session?.user.id;

  const updateJob = (id: string, patch: Partial<ImportJob>) => {
    setJobs((current) => current.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };

  /**
   * Multi-select, then import in batches. Sequential within a batch rather than
   * all-at-once: twenty concurrent uploads on a mobile connection is slower than
   * eight at a time and starves the UI thread.
   */
  const pickPhotos = async (source: 'camera' | 'library') => {
    setLimitHit(null);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 40,
          });

    if (result.canceled || !userId) return;

    const queued: ImportJob[] = result.assets.map((asset, index) => ({
      // Temporary local id; replaced by the garment id once the row exists.
      id: `local-${Date.now()}-${index}`,
      localUri: asset.uri,
      stage: 'queued',
    }));
    setJobs((current) => [...current, ...queued]);

    for (let i = 0; i < queued.length; i += INTAKE.bulkBatchSize) {
      const batch = queued.slice(i, i + INTAKE.bulkBatchSize);

      for (const job of batch) {
        try {
          const done = await importPhoto(userId, job.localUri, (stage) =>
            updateJob(job.id, { stage }),
          );
          // Swap the local id for the real garment id.
          setJobs((current) => current.map((j) => (j.id === job.id ? { ...done } : j)));
        } catch (error) {
          if (error instanceof FreeTierLimitError) {
            setLimitHit(error.resource);
            // Mark everything still queued as failed: continuing would produce
            // the same rejection for each one.
            setJobs((current) =>
              current.map((j) =>
                j.stage === 'queued' || j.stage === 'uploading'
                  ? { ...j, stage: 'failed', error: 'Free tier limit reached' }
                  : j,
              ),
            );
            void queryClient.invalidateQueries({ queryKey: garmentKeys.all });
            return;
          }
          updateJob(job.id, {
            stage: 'failed',
            error: error instanceof Error ? error.message : 'Import failed',
          });
        }
      }
    }

    void queryClient.invalidateQueries({ queryKey: garmentKeys.all });
  };

  const submitLink = () => {
    setLimitHit(null);
    importLink.mutate(
      { url: link },
      {
        onSuccess: () => {
          setLink('');
          router.back();
        },
        onError: (error) => {
          if (error instanceof FreeTierLimitError) setLimitHit(error.resource);
        },
      },
    );
  };

  const inFlight = jobs.filter((j) => j.stage !== 'ready' && j.stage !== 'failed').length;
  const done = jobs.filter((j) => j.stage === 'ready').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        No forms. Photograph a garment or paste the shop link — colour, category and
        material are filled in for you, and you can edit any of it later.
      </Text>

      {/* Path B is listed first because it produces near-perfect metadata and the
          spec says to encourage it (§3B). */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paste a shop link</Text>
        <Text style={styles.cardBody}>
          The most accurate way in. Gets the brand, material and price right.
        </Text>
        <TextInput
          style={styles.input}
          value={link}
          onChangeText={setLink}
          placeholder="https://…"
          placeholderTextColor={colours.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel="Retailer product link"
          editable={!importLink.isPending}
        />
        {importLink.isError && !(importLink.error instanceof FreeTierLimitError) && (
          <Text style={styles.error} accessibilityRole="alert">
            {importLink.error instanceof Error ? importLink.error.message : 'Could not read that link'}
          </Text>
        )}
        <Pressable
          style={[styles.primary, (link.length === 0 || importLink.isPending) && styles.disabled]}
          onPress={submitLink}
          disabled={link.length === 0 || importLink.isPending}
          accessibilityRole="button"
          accessibilityLabel="Import from link"
        >
          {importLink.isPending ? (
            <ActivityIndicator color={colours.accentText} />
          ) : (
            <Text style={styles.primaryText}>Import from link</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photograph your garments</Text>
        <Text style={styles.cardBody}>
          Select as many as you like. They import in the background — you can leave this
          screen. Photos are analysed on our servers and stored privately to your account.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondary}
            onPress={() => void pickPhotos('camera')}
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
          >
            <Text style={styles.secondaryText}>Camera</Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => void pickPhotos('library')}
            accessibilityRole="button"
            accessibilityLabel="Choose photos from your library"
          >
            <Text style={styles.secondaryText}>Choose photos</Text>
          </Pressable>
        </View>
      </View>

      {limitHit !== null && (
        <View style={styles.limitCard} accessibilityRole="alert">
          <Text style={styles.limitTitle}>Free tier full</Text>
          <Text style={styles.cardBody}>
            The free tier holds {ENTITLEMENTS.free.garments} garments. Everything you have
            added is safe — upgrade to add more.
          </Text>
        </View>
      )}

      {jobs.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {inFlight > 0 ? `Importing ${inFlight}…` : `${done} imported`}
          </Text>
          {/* A visible progress state for bulk import, per spec §3. */}
          {jobs.map((job) => (
            <View key={job.id} style={styles.jobRow}>
              <Text style={styles.jobStage}>{STAGE_LABELS[job.stage]}</Text>
              <Text style={styles.jobDetail} numberOfLines={1}>
                {job.error ?? job.guess?.categorySlug ?? job.localUri.split('/').pop()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {entitlement === 'free' && limitHit === null && (
        <Text style={styles.footnote}>
          Free tier: up to {ENTITLEMENTS.free.garments} garments.
        </Text>
      )}
    </ScrollView>
  );
}

const STAGE_LABELS: Record<ImportJob['stage'], string> = {
  queued: 'Queued',
  uploading: 'Uploading',
  analysing: 'Analysing',
  ready: 'Added ✓',
  failed: 'Failed',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  lead: { ...t.body, color: colours.textMuted },

  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    gap: spacing.sm,
  },
  cardTitle: { ...t.heading, color: colours.text },
  cardBody: { ...t.caption, color: colours.textMuted },

  input: {
    minHeight: minTouch,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...t.body,
    color: colours.text,
  },

  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  primary: {
    minHeight: minTouch,
    borderRadius: radius.md,
    backgroundColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...t.label, color: colours.accentText, fontSize: 16 },
  disabled: { opacity: 0.5 },
  secondary: {
    flex: 1,
    minHeight: minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...t.label, color: colours.accent },

  limitCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colours.staleBanner,
    gap: spacing.xs,
  },
  limitTitle: { ...t.heading, color: colours.warning },

  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  jobStage: { ...t.caption, color: colours.text },
  jobDetail: { ...t.caption, color: colours.textMuted, flexShrink: 1 },

  error: { ...t.caption, color: colours.danger },
  footnote: { ...t.caption, color: colours.textMuted, textAlign: 'center' },
});
