import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  costPerWear,
  daysSinceLastWear,
  palette,
  BUILDER_SLOT_ORDER,
  SLOT_LABELS,
  type LayerSlot,
} from '@rail/core';

import { useWardrobe, useWears, type WardrobeGarment } from '../../src/data/garments';
import { GarmentImage } from '../../src/components/GarmentImage';
import { colours, spacing, radius, type as t, minTouch, formatMoney } from '../../src/theme';

type SortMode = 'recent' | 'cost-per-wear' | 'least-worn';

const SORT_LABELS: Record<SortMode, string> = {
  recent: 'Recently added',
  'cost-per-wear': 'Cost per wear',
  'least-worn': 'Least worn',
};

export default function Wardrobe() {
  const router = useRouter();
  const wardrobe = useWardrobe();
  const wears = useWears();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const garments = wardrobe.data?.garments ?? [];
  const wearRows = useMemo(
    () => (wears.data ?? []).map((w) => ({ garmentId: w.garment_id, wornOn: w.worn_on })),
    [wears.data],
  );

  const wearCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of wearRows) counts.set(w.garmentId, (counts.get(w.garmentId) ?? 0) + 1);
    return counts;
  }, [wearRows]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? garments.filter(
          (g) =>
            g.title.toLowerCase().includes(needle) ||
            g.brandName?.toLowerCase().includes(needle) ||
            g.categoryDisplayName.toLowerCase().includes(needle),
        )
      : garments;

    // Archived garments are out of the main list but still count against the
    // free tier (docs/DECISIONS.md) — they live behind their own filter.
    return filtered.filter((g) => g.archivedAt === null);
  }, [garments, search]);

  const sorted = useMemo(() => {
    const copy = [...visible];
    if (sort === 'cost-per-wear') {
      copy.sort((a, b) => {
        const ca = costPerWear(a.purchasePriceCents, wearCounts.get(a.id) ?? 0);
        const cb = costPerWear(b.purchasePriceCents, wearCounts.get(b.id) ?? 0);
        // Unpriced garments sort last: they are unknown, not cheap.
        if (ca === null && cb === null) return 0;
        if (ca === null) return 1;
        if (cb === null) return -1;
        return cb - ca;
      });
    } else if (sort === 'least-worn') {
      copy.sort((a, b) => (wearCounts.get(a.id) ?? 0) - (wearCounts.get(b.id) ?? 0));
    }
    return copy;
  }, [visible, sort, wearCounts]);

  /** Auto-sorted sections by layer slot, in builder order (spec §6.4). */
  const sections = useMemo(() => {
    const bySlot = new Map<LayerSlot, WardrobeGarment[]>();
    for (const g of sorted) {
      const list = bySlot.get(g.layerSlot);
      if (list) list.push(g);
      else bySlot.set(g.layerSlot, [g]);
    }
    return BUILDER_SLOT_ORDER.filter((slot) => bySlot.has(slot)).map((slot) => ({
      slot,
      title: SLOT_LABELS[slot],
      data: bySlot.get(slot) ?? [],
    }));
  }, [sorted]);

  const paletteEntries = useMemo(
    () =>
      palette(
        garments.map((g) => ({
          colourPrimaryHex: g.colourPrimaryHex,
          colourLabel: g.colourLabel ?? g.categoryDisplayName,
          archivedAt: g.archivedAt,
        })),
      ).slice(0, 8),
    [garments],
  );

  if (wardrobe.isPending) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={colours.accent} />
      </View>
    );
  }

  if (wardrobe.isError) {
    return (
      <View style={styles.centre}>
        <Text style={styles.errorTitle}>Could not load your wardrobe</Text>
        <Text style={styles.errorBody}>
          {wardrobe.error instanceof Error ? wardrobe.error.message : 'Unknown error'}
        </Text>
        <Pressable style={styles.retry} onPress={() => void wardrobe.refetch()} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {wardrobe.data?.fromCache === true && (
        // Stale data must be labelled as such (spec §7).
        <View style={styles.staleBanner} accessibilityRole="alert">
          <Text style={styles.staleText}>Offline — showing your saved wardrobe.</Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        // Virtualisation settings tuned for the 200-garment / 60fps criterion:
        // small windows keep the number of mounted rows down, and a fixed row
        // height lets SectionList skip measurement entirely.
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        getItemLayout={(_data, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.count}>
              {garments.length} {garments.length === 1 ? 'garment' : 'garments'}
            </Text>

            {paletteEntries.length > 0 && (
              <View style={styles.paletteBlock}>
                <View
                  style={styles.paletteBar}
                  accessible
                  // Colour is never the sole carrier of meaning (spec §7): the bar
                  // gets a full text equivalent for screen readers.
                  accessibilityLabel={`Wardrobe palette: ${paletteEntries
                    .map((p) => `${p.count} ${p.label}`)
                    .join(', ')}`}
                >
                  {paletteEntries.map((entry) => (
                    <View
                      key={entry.hex}
                      style={[
                        styles.paletteSegment,
                        { backgroundColor: entry.hex, flex: entry.count },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.paletteCaption}>
                  {paletteEntries
                    .slice(0, 3)
                    .map((p) => `${p.label} ×${p.count}`)
                    .join(' · ')}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, brand or category"
              placeholderTextColor={colours.textMuted}
              accessibilityLabel="Search your wardrobe"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            <View style={styles.sortRow}>
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.chip, sort === mode && styles.chipActive]}
                  onPress={() => setSort(mode)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sort === mode }}
                  accessibilityLabel={`Sort by ${SORT_LABELS[mode]}`}
                >
                  <Text style={[styles.chipText, sort === mode && styles.chipTextActive]}>
                    {SORT_LABELS[mode]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            {section.title} · {section.data.length}
          </Text>
        )}
        renderItem={({ item }) => (
          <GarmentRow
            garment={item}
            wearCount={wearCounts.get(item.id) ?? 0}
            daysSince={daysSinceLastWear(wearRows, item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {search ? 'Nothing matches that' : 'Your wardrobe is empty'}
            </Text>
            {!search && (
              <Text style={styles.emptyBody}>
                Add garments by photo or by pasting a retailer link. No forms.
              </Text>
            )}
          </View>
        }
        refreshing={wardrobe.isFetching}
        onRefresh={() => void wardrobe.refetch()}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/import')}
        accessibilityRole="button"
        accessibilityLabel="Add garments"
      >
        <Text style={styles.fabText}>Add</Text>
      </Pressable>
    </View>
  );
}

const ROW_HEIGHT = 84;

function GarmentRow({
  garment,
  wearCount,
  daysSince,
}: {
  garment: WardrobeGarment;
  wearCount: number;
  daysSince: number | null;
}) {
  const cpw = costPerWear(garment.purchasePriceCents, wearCount);

  const wearSummary =
    daysSince === null
      ? 'Never worn'
      : daysSince === 0
        ? 'Worn today'
        : `Worn ${wearCount}× · ${daysSince}d ago`;

  return (
    <Link href={`/garment/${garment.id}`} asChild>
      <Pressable
        style={styles.row}
        accessibilityRole="link"
        accessibilityLabel={`${garment.title}. ${wearSummary}. ${
          cpw === null ? 'No purchase price recorded' : `${formatMoney(cpw, garment.currency)} per wear`
        }`}
      >
        <GarmentImage path={garment.imagePath} title={garment.title} size={60} />

        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {garment.title}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {[garment.brandName, garment.categoryDisplayName, garment.sizeLabel]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {wearSummary}
            {cpw !== null && ` · ${formatMoney(cpw, garment.currency)}/wear`}
          </Text>
        </View>

        {garment.inWash && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Wash</Text>
          </View>
        )}
        {garment.condition === 'needs_repair' && (
          <View style={[styles.badge, styles.badgeWarn]}>
            <Text style={styles.badgeText}>Repair</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  listContent: { paddingBottom: spacing.xxl * 3 },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  count: { ...t.title, color: colours.text },

  paletteBlock: { gap: spacing.xs },
  paletteBar: { flexDirection: 'row', height: 12, borderRadius: radius.sm, overflow: 'hidden' },
  paletteSegment: { height: '100%' },
  paletteCaption: { ...t.caption, color: colours.textMuted },

  search: {
    minHeight: minTouch,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.md,
    ...t.body,
    color: colours.text,
  },

  sortRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    minHeight: minTouch,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  chipActive: { backgroundColor: colours.accent, borderColor: colours.accent },
  chipText: { ...t.caption, color: colours.text },
  chipTextActive: { color: colours.accentText },

  sectionHeader: {
    ...t.label,
    color: colours.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...t.body, color: colours.text, fontWeight: '500' },
  rowMeta: { ...t.caption, color: colours.textMuted },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colours.border,
  },
  badgeWarn: { backgroundColor: colours.staleBanner },
  badgeText: { ...t.caption, color: colours.text, fontSize: 11 },

  staleBanner: { backgroundColor: colours.staleBanner, padding: spacing.sm, alignItems: 'center' },
  staleText: { ...t.caption, color: colours.warning },

  empty: { padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  emptyTitle: { ...t.heading, color: colours.text },
  emptyBody: { ...t.body, color: colours.textMuted, textAlign: 'center' },

  errorTitle: { ...t.heading, color: colours.text },
  errorBody: { ...t.caption, color: colours.textMuted, textAlign: 'center' },
  retry: {
    minHeight: minTouch,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colours.accent,
  },
  retryText: { ...t.label, color: colours.accentText },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    minWidth: 72,
    minHeight: minTouch + 8,
    borderRadius: radius.lg,
    backgroundColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { ...t.label, color: colours.accentText, fontSize: 16 },
});
