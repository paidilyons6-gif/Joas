import type { CalcId } from "../data/calculators";
import type { ToolId } from "../data/tools";
import { CALCULATORS } from "../data/calculators";
import { TOOLS } from "../data/tools";

/** Per-item LIVE flags for Calculators + Toolkit (coach-controlled). */
export type BuildLiveSettings = {
  calculators: Record<string, boolean>;
  toolkit: Record<string, boolean>;
};

const KEY = "bbb_build_live_v1";
const EVENT = "bbb-build-live";

function defaults(): BuildLiveSettings {
  return {
    calculators: Object.fromEntries(CALCULATORS.map((c) => [c.id, true])),
    toolkit: Object.fromEntries(TOOLS.map((t) => [t.id, true])),
  };
}

function merge(raw: Partial<BuildLiveSettings> | null | undefined): BuildLiveSettings {
  const base = defaults();
  if (!raw) return base;
  return {
    calculators: { ...base.calculators, ...(raw.calculators || {}) },
    toolkit: { ...base.toolkit, ...(raw.toolkit || {}) },
  };
}

export function readBuildLiveLocal(): BuildLiveSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return merge(JSON.parse(raw) as Partial<BuildLiveSettings>);
  } catch {
    return defaults();
  }
}

export function writeBuildLiveLocal(settings: BuildLiveSettings) {
  localStorage.setItem(KEY, JSON.stringify(merge(settings)));
  window.dispatchEvent(new Event(EVENT));
}

export function isCalcLive(id: CalcId | string, settings?: BuildLiveSettings) {
  const s = settings || readBuildLiveLocal();
  return s.calculators[id] !== false;
}

export function isToolLive(id: ToolId | string, settings?: BuildLiveSettings) {
  const s = settings || readBuildLiveLocal();
  return s.toolkit[id] !== false;
}

export { EVENT as BUILD_LIVE_EVENT, defaults as defaultBuildLive, merge as mergeBuildLive };
