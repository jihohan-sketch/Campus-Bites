/**
 * The live read on the lunch queue.
 *
 * Nothing in the cafeteria is wired up yet — there is no sensor and no
 * headcount feed — so the numbers here are simulated from the service
 * timetable. The simulation is deliberately shaped like a feed: one immutable
 * `LunchLineSnapshot` produced at a point in time, with no UI concepts in it.
 *
 * To go real, replace `simulateLunchLine` inside `useLunchLine` with a
 * Firestore subscription that yields the same shape (`crowdLevel`,
 * `estimatedWait`, `currentTimeSlot`, `recommendedTime`, `lastUpdated`) and
 * flip `source` to `live`. No component has to change.
 */

import {
  BEST_BAND,
  LUNCH_RUSH_END,
  LUNCH_RUSH_START,
  bandAt,
  formatClock,
  progressOf,
  type Minutes,
  type RushBand,
  type RushLevel,
  type RushPhase,
} from '../config/lunchRush';
import { kstMinutesAt } from '../utils/date';

/** `closed` covers both "not started" and "finished" — the queue is empty. */
export type LunchCrowdLevel = RushLevel | 'closed';

/** The slice of the service window the reading belongs to. */
export interface LunchTimeSlot {
  level: RushLevel;
  start: Minutes;
  end: Minutes;
  /** `11:40 – 12:00`. */
  label: string;
}

export interface LunchLineSnapshot {
  /** How busy the line is right now. */
  crowdLevel: LunchCrowdLevel;
  /** Same reading as a 0–1 fill, for the 혼잡도 bar. */
  crowdRatio: number;
  /** Whole minutes a student joining the line right now would wait. */
  estimatedWait: number;
  /** The band the clock sits in, or `null` outside the service window. */
  currentTimeSlot: LunchTimeSlot | null;
  /** When to go instead, in minutes since midnight. `null` means "go now". */
  recommendedTime: Minutes | null;
  /** Epoch ms this reading was produced. */
  lastUpdated: number;

  /* ---- derived, kept on the snapshot so every surface reads the same thing */

  /** Where the clock sits across 11:30 – 12:30, 0–1. Drives the marker. */
  timelineProgress: number;
  /** The reading's own clock, in minutes since midnight (fractional). */
  clock: Minutes;
  phase: RushPhase;
  /** The one line a student acts on: "지금은 조금 붐벼요". */
  message: string;
  /** `simulated` until a real feed is wired up. */
  source: 'simulated' | 'live';
}

const lerp = (from: number, to: number, ratio: number): number =>
  from + (to - from) * ratio;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * A slow, continuous wander in roughly ±0.03. Two sine waves at unrelated
 * periods never repeat visibly, and because it is a function of time rather
 * than a random draw the reading drifts — it never jumps between refreshes.
 */
function drift(atMs: number): number {
  return 0.02 * Math.sin(atMs / 41000) + 0.01 * Math.sin(atMs / 17000);
}

function slotOf(band: RushBand): LunchTimeSlot {
  return {
    level: band.level,
    start: band.start,
    end: band.end,
    label: `${formatClock(band.start)} – ${formatClock(band.end)}`,
  };
}

/** How far through its own band `clock` is, 0–1. */
function bandProgress(band: RushBand, clock: Minutes): number {
  return clamp((clock - band.start) / (band.end - band.start), 0, 1);
}

const CLOSED = {
  crowdLevel: 'closed' as const,
  estimatedWait: 0,
  currentTimeSlot: null,
  source: 'simulated' as const,
};

/**
 * Builds the reading for a moment in time.
 *
 * `atMs` is the wall clock the drift is sampled from; `clockOverride` freezes
 * the position in the service window, which is what previews and tests want.
 */
export function simulateLunchLine(
  atMs: number = Date.now(),
  clockOverride?: Minutes,
): LunchLineSnapshot {
  const clock = clockOverride ?? kstMinutesAt(atMs);
  const timelineProgress = progressOf(clock);

  if (clock < LUNCH_RUSH_START) {
    return {
      ...CLOSED,
      crowdRatio: 0,
      recommendedTime: BEST_BAND.start,
      lastUpdated: atMs,
      timelineProgress,
      clock,
      phase: 'before',
      message: `배식은 ${formatClock(LUNCH_RUSH_START)}에 시작해요`,
    };
  }

  if (clock >= LUNCH_RUSH_END) {
    return {
      ...CLOSED,
      crowdRatio: 0,
      recommendedTime: null,
      lastUpdated: atMs,
      timelineProgress,
      clock,
      phase: 'after',
      message: '오늘 점심 배식이 끝났어요',
    };
  }

  const band = bandAt(clock)!;
  const progress = bandProgress(band, clock);
  const wobble = drift(atMs);

  const crowdRatio = clamp(lerp(band.load[0], band.load[1], progress) + wobble, 0.03, 1);
  // The same wobble moves the wait, so the bar and the minutes never disagree.
  const wait = lerp(band.wait[0], band.wait[1], progress) + wobble * 24;

  return {
    crowdLevel: band.level,
    crowdRatio,
    estimatedWait: Math.max(0, Math.round(wait)),
    currentTimeSlot: slotOf(band),
    // Once the line is calm there is nothing better to wait for.
    recommendedTime: band.level === 'calm' ? null : BEST_BAND.start,
    lastUpdated: atMs,
    timelineProgress,
    clock,
    phase: 'during',
    message: band.message,
    source: 'simulated',
  };
}

/** `12:00 이후` / `지금 바로` — the recommendation as a student reads it. */
export function formatRecommendedTime(recommendedTime: Minutes | null): string {
  return recommendedTime === null ? '지금 바로' : `${formatClock(recommendedTime)} 이후`;
}

/** `8분` / `대기 없음`. */
export function formatWait(minutes: number): string {
  return minutes <= 0 ? '대기 없음' : `${minutes}분`;
}
