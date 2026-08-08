import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { costPerWear, daysSinceLastWear } from '@rail/core';

import { useWardrobe, useWears, useLogWear, useSetInWash } from '../../src/data/garments';
import { GarmentImage } from '../../src/components/GarmentImage';
import { colours, spacing, radius, type as t, minTouch, formatMoney } from '../../src/theme';

export default function GarmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wardrobe = useWardrobe();
  const wears = useWears();
  const logWear = useLogWear();
  const setInWash = useSetInWash();

  const garment = wardrobe.data?.garments.find((g) => g.id === id);

  const wearRows = useMemo(
    () => (wears.data ?? []).map((w) => ({ garmentId: w.garment_id, wornOn: w.worn_on })),
    [wears.data],
  );

  const wearCount = wearRows.filter((w) => w.garmentId === id).length;
  const daysSince = daysSinceLastWear(wearRows, id ?? '');
  const wornToday = daysSince === 0;

  if (wardrobe.isPending) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={colours.accent} />
      </View>
    );
  }

  if (!garment) {
    return (
      <View style={styles.centre}>
        <Text style={styles.heading}>Garment not found</Text>
        <Text style={styles.muted}>It may have been deleted on another device.</Text>
      </View>
    );
  }

  const cpw = costPerWear(garment.purchasePriceCents, wearCount);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GarmentImage path={garment.imagePath} title={garment.title} size={220} style={styles.hero} />

      <View style={styles.block}>
        <Text style={styles.title}>{garment.title}</Text>
        <Text style={styles.muted}>
          {[garment.brandName, garment.categoryDisplayName, garment.sizeLabel]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      <Pressable
        style={[styles.primary, wornToday && styles.primaryDone]}
        onPress={() => logWear.mutate({ garmentId: garment.id })}
        disabled={wornToday}
        accessibilityRole="button"
        accessibilityLabel={wornToday ? 'Already logged as worn today' : 'Log as worn today'}
      >
        <Text style={[styles.primaryText, wornToday && styles.primaryTextDone]}>
          {wornToday ? 'Worn today ✓' : 'Worn today'}
        </Text>
      </Pressable>

      <View style={styles.statRow}>
        <Stat label="Wears" value={String(wearCount)} />
        <Stat
          label="Last worn"
          value={daysSince === null ? 'Never' : daysSince === 0 ? 'Today' : `${daysSince}d ago`}
        />
        <Stat
          label="Per wear"
          value={cpw === null ? '—' : formatMoney(cpw, garment.currency)}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Detail label="Colour" value={garment.colourLabel ?? garment.colourPrimaryHex ?? 'Not set'} />
        <Detail label="Pattern" value={garment.pattern} />
        <Detail label="Material" value={garment.materialMain ?? 'Not set'} />
        <Detail label="Warmth" value={`${garment.warmthRating} of 5`} />
        <Detail label="Formality" value={`${garment.formality} of 5`} />
        <Detail label="Waterproof" value={garment.waterproof ? 'Yes' : 'No'} />
        <Detail label="Condition" value={garment.condition.replace('_', ' ')} />
        <Detail
          label="Bought"
          value={
            garment.purchasedAt
              ? `${garment.purchasedAt} · ${formatMoney(garment.purchasePriceCents, garment.currency)}`
              : 'Not recorded'
          }
        />
      </View>

      <Pressable
        style={styles.secondary}
        onPress={() => setInWash.mutate({ garmentId: garment.id, inWash: !garment.inWash })}
        accessibilityRole="button"
        accessibilityState={{ checked: garment.inWash }}
        accessibilityLabel={garment.inWash ? 'Mark as clean' : 'Mark as in the wash'}
      >
        <Text style={styles.secondaryText}>
          {garment.inWash ? 'Back from the wash' : 'In the wash'}
        </Text>
      </Pressable>

      {garment.inWash && (
        <Text style={styles.footnote}>
          Garments in the wash are left out of outfit suggestions.
        </Text>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },

  hero: { alignSelf: 'center', borderRadius: radius.lg },
  block: { gap: spacing.xs },
  title: { ...t.title, color: colours.text },
  heading: { ...t.heading, color: colours.text },
  muted: { ...t.body, color: colours.textMuted },
  sectionTitle: { ...t.label, color: colours.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },

  primary: {
    minHeight: minTouch,
    borderRadius: radius.md,
    backgroundColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDone: { backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.accent },
  primaryText: { ...t.label, color: colours.accentText, fontSize: 16 },
  primaryTextDone: { color: colours.accent },

  secondary: {
    minHeight: minTouch,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...t.label, color: colours.text },

  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    gap: 2,
  },
  statValue: { ...t.heading, color: colours.text },
  statLabel: { ...t.caption, color: colours.textMuted },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    gap: spacing.md,
  },
  detailLabel: { ...t.caption, color: colours.textMuted },
  detailValue: { ...t.caption, color: colours.text, flexShrink: 1, textAlign: 'right' },

  footnote: { ...t.caption, color: colours.textMuted },
});
