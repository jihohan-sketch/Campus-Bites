/**
 * The lunch queue is predictable: everyone leaves class at the same time, so
 * the first ten minutes of service are the worst and the tail is empty. These
 * bands turn that into something a student can act on before walking over.
 */

/** Minutes since midnight, KST. */
export type Minutes = number;

export type RushLevel = 'peak' | 'busy' | 'calm';

export interface RushBand {
  level: RushLevel;
  /** Inclusive start, exclusive end, in minutes since midnight. */
  start: Minutes;
  end: Minutes;
  emoji: string;
  /** Status shown on the live badge, e.g. `VERY BUSY`. */
  status: string;
  label: string;
  /** One line a student can act on. */
  detail: string;
  /** Short crowd word for the meter — the same wording as the 혼잡도 scale. */
  crowdLabel: string;
  /**
   * How full the queue is at the band's start and end, 0–1. Bands are
   * contiguous (each starts where the previous ended) so a reading taken every
   * few seconds slides along one continuous curve instead of stepping.
   */
  load: readonly [number, number];
  /** Queue wait in minutes at the band's start and end, interpolated the same way. */
  wait: readonly [number, number];
  /** The one line shown under the crowd bar. */
  message: string;
}

/**
 * Colours live in the theme (`theme.rush[level]`), not here — a band is a fact
 * about the timetable, and the same fact has to render in light and dark.
 */

const H = (hour: number, minute: number): Minutes => hour * 60 + minute;

/** 11:30 – 12:30, ordered and contiguous. */
export const LUNCH_RUSH_BANDS: RushBand[] = [
  {
    level: 'peak',
    start: H(11, 30),
    end: H(11, 40),
    emoji: '🔴',
    status: 'VERY BUSY',
    label: '가장 혼잡',
    detail: '배식 시작 직후라 한 번에 몰려요',
    crowdLabel: '매우 혼잡',
    load: [0.72, 0.98],
    wait: [6, 12],
    message: '지금은 많이 붐벼요',
  },
  {
    level: 'busy',
    start: H(11, 40),
    end: H(12, 0),
    emoji: '🟡',
    status: 'MODERATE',
    label: '조금 혼잡',
    detail: '줄은 있지만 금방 줄어들어요',
    crowdLabel: '혼잡',
    load: [0.98, 0.34],
    wait: [12, 3],
    message: '지금은 조금 붐벼요',
  },
  {
    level: 'calm',
    start: H(12, 0),
    end: H(12, 30),
    emoji: '🟢',
    status: 'ALMOST EMPTY',
    label: '거의 한산',
    detail: '기다리지 않고 바로 받을 수 있어요',
    crowdLabel: '한산',
    load: [0.34, 0.05],
    wait: [3, 0],
    message: '지금 가면 거의 안 기다려요',
  },
];

export const LUNCH_RUSH_START = LUNCH_RUSH_BANDS[0].start;
export const LUNCH_RUSH_END = LUNCH_RUSH_BANDS[LUNCH_RUSH_BANDS.length - 1].end;
export const LUNCH_RUSH_SPAN = LUNCH_RUSH_END - LUNCH_RUSH_START;

/** The band covering `minutes`, or `null` outside the service window. */
export function bandAt(minutes: Minutes): RushBand | null {
  return (
    LUNCH_RUSH_BANDS.find((band) => minutes >= band.start && minutes < band.end) ?? null
  );
}

/** `690` → `11:30`. */
export function formatClock(minutes: Minutes): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

export type RushPhase = 'before' | 'during' | 'after';

/** Where `minutes` sits across the service window, clamped to 0–1. */
export function progressOf(minutes: Minutes): number {
  return Math.min(1, Math.max(0, (minutes - LUNCH_RUSH_START) / LUNCH_RUSH_SPAN));
}

/** The band students should aim for. */
export const BEST_BAND: RushBand = LUNCH_RUSH_BANDS[LUNCH_RUSH_BANDS.length - 1];

/**
 * These bands come from the timetable, not from a sensor or a live headcount.
 * Every surface that shows them has to say so.
 */
export const RUSH_ESTIMATE_DISCLAIMER =
  '실제 측정값이 아니라 배식 시간표 기반 예상 혼잡도예요';
