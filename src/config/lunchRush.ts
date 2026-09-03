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
  color: string;
  soft: string;
  /** Bar fill opacity — heavier traffic reads as a denser block. */
  intensity: number;
}

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
    color: '#B91C1C',
    soft: '#FCE9E9',
    intensity: 1,
  },
  {
    level: 'busy',
    start: H(11, 40),
    end: H(12, 0),
    emoji: '🟡',
    status: 'MODERATE',
    label: '조금 혼잡',
    detail: '줄은 있지만 금방 줄어들어요',
    color: '#B45309',
    soft: '#FDF1DF',
    intensity: 0.78,
  },
  {
    level: 'calm',
    start: H(12, 0),
    end: H(12, 30),
    emoji: '🟢',
    status: 'ALMOST EMPTY',
    label: '거의 한산',
    detail: '기다리지 않고 바로 받을 수 있어요',
    color: '#15803D',
    soft: '#E4F5E9',
    intensity: 0.56,
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

/** The quietest band that has not started yet, or `null` once lunch is over. */
export function nextCalmerBand(minutes: Minutes): RushBand | null {
  const current = bandAt(minutes);
  return (
    LUNCH_RUSH_BANDS.find(
      (band) => band.end > minutes && (!current || band.start >= current.end) && band.level === 'calm',
    ) ?? null
  );
}

/** `690` → `11:30`. */
export function formatClock(minutes: Minutes): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

export type RushPhase = 'before' | 'during' | 'after';

export interface RushAdvice {
  phase: RushPhase;
  /** The band happening right now, or `null` when lunch is not being served. */
  current: RushBand | null;
  /** Headline shown at the top of the timeline. */
  headline: string;
  /** Supporting line; empty when the headline says it all. */
  hint: string;
}

/** Turns the current clock into the one sentence a hungry student needs. */
export function rushAdvice(minutes: Minutes): RushAdvice {
  const calm = LUNCH_RUSH_BANDS[LUNCH_RUSH_BANDS.length - 1];

  if (minutes < LUNCH_RUSH_START) {
    return {
      phase: 'before',
      current: null,
      headline: `${formatClock(calm.start)} 이후에 가면 거의 안 기다려요`,
      hint: `배식은 ${formatClock(LUNCH_RUSH_START)}에 시작해요`,
    };
  }

  if (minutes >= LUNCH_RUSH_END) {
    return {
      phase: 'after',
      current: null,
      headline: '오늘 점심 배식이 끝났어요',
      hint: `내일은 ${formatClock(calm.start)} 이후를 노려 보세요`,
    };
  }

  const current = bandAt(minutes)!;

  if (current.level === 'calm') {
    return {
      phase: 'during',
      current,
      headline: '지금 가면 거의 안 기다려요',
      hint: `${formatClock(LUNCH_RUSH_END)}에 배식이 끝나요`,
    };
  }

  const waitMinutes = calm.start - minutes;
  return {
    phase: 'during',
    current,
    headline:
      current.level === 'peak' ? '지금이 제일 붐벼요' : '아직 줄이 조금 있어요',
    hint: `${waitMinutes}분 뒤(${formatClock(calm.start)})면 한산해져요`,
  };
}

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
