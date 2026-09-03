/**
 * Shared domain types for the school meal app.
 */

/** The three meal services published by NEIS (조식 / 중식 / 석식). */
export type MealType = 'breakfast' | 'lunch' | 'dinner';

/** NEIS `MMEAL_SC_CODE` values mapped to our internal meal types. */
export const MEAL_TYPE_BY_CODE: Record<string, MealType> = {
  '1': 'breakfast',
  '2': 'lunch',
  '3': 'dinner',
};

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

/** A school as returned by the NEIS `schoolInfo` endpoint. */
export interface School {
  /** `ATPT_OFCDC_SC_CODE` — the regional office of education code, e.g. `B10`. */
  officeCode: string;
  /** `ATPT_OFCDC_SC_NM`, e.g. 서울특별시교육청. */
  officeName: string;
  /** `SD_SCHUL_CODE` — the 7 digit school code. */
  schoolCode: string;
  /** `SCHUL_NM`, e.g. 서울과학고등학교. */
  schoolName: string;
  /** `SCHUL_KND_SC_NM`, e.g. 고등학교. */
  schoolKind: string;
  /** `LCTN_SC_NM`, e.g. 서울특별시. */
  region: string;
  /** Road name address, may be empty. */
  address: string;
}

/** A single menu item within a meal, with its allergen numbers extracted. */
export interface Dish {
  name: string;
  allergens: number[];
}

/** A `label: value` pair parsed out of NEIS's `<br/>` delimited info blobs. */
export interface InfoPair {
  label: string;
  value: string;
}

/** One meal service for one school on one day. */
export interface Meal {
  /** Stable key: `${schoolCode}-${date}-${type}`. */
  id: string;
  type: MealType;
  /** `YYYYMMDD`. */
  date: string;
  schoolName: string;
  dishes: Dish[];
  /** Kilocalories, or `null` when NEIS does not publish it. */
  calories: number | null;
  /** Number of people served (`MLSV_FGR`). */
  headcount: number | null;
  nutrition: InfoPair[];
  origins: InfoPair[];
}

/** A day's worth of meals, indexed by service. */
export type MealsByType = Record<MealType, Meal | null>;

/** The stored profile document at `users/{uid}`. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  /** A single emoji used as a lightweight avatar. */
  emoji: string;
  school: School | null;
  grade: number | null;
  classNo: number | null;
  /** Six character code other students type in to add this user. */
  friendCode: string;
  createdAt: number;
  updatedAt: number;
}

/** 1 (empty) through 5 (packed). */
export type CrowdLevel = 1 | 2 | 3 | 4 | 5;

/** A crowd observation submitted by a student standing in the cafeteria. */
export interface CrowdReport {
  id: string;
  /** `${officeCode}_${schoolCode}` — partitions every collection by school. */
  schoolKey: string;
  mealType: MealType;
  level: CrowdLevel;
  /** Reported queue length in minutes. */
  waitMinutes: number;
  note: string;
  authorUid: string;
  authorName: string;
  authorEmoji: string;
  createdAt: number;
}

/** Rolled up view of the recent reports for a school. */
export interface CrowdSummary {
  /** Mean level of the recent reports, or `null` when there are none. */
  level: number | null;
  waitMinutes: number | null;
  reportCount: number;
  /** Milliseconds since the most recent report, or `null`. */
  freshnessMs: number | null;
  /** Change versus the previous window: rising, falling or steady. */
  trend: 'rising' | 'falling' | 'steady' | 'unknown';
}

/** A confirmed friend, mirrored under `users/{uid}/friends/{friendUid}`. */
export interface Friend {
  uid: string;
  displayName: string;
  emoji: string;
  schoolKey: string;
  schoolName: string;
  since: number;
}

/** A pending invite in the `friendRequests` collection. */
export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmoji: string;
  fromSchoolName: string;
  toUid: string;
  createdAt: number;
}

/** Quick reaction attached to a rating. */
export type MealTag = 'good' | 'ok' | 'bad';

/** 1 through 5 stars. */
export type StarValue = 1 | 2 | 3 | 4 | 5;

/** One student's verdict on one meal service. */
export interface MealRating {
  /** `${schoolKey}_${date}_${mealType}_${raterId}` — one rating per student. */
  id: string;
  schoolKey: string;
  /** `YYYYMMDD`. */
  date: string;
  mealType: MealType;
  stars: StarValue;
  tag: MealTag | null;
  comment: string;
  /** Firebase uid, or a device-local id for guests. */
  raterId: string;
  authorName: string;
  authorEmoji: string;
  createdAt: number;
}

/** Rolled up ratings for one meal service. */
export interface MealRatingSummary {
  /** Mean stars, or `null` when nobody has rated yet. */
  average: number | null;
  count: number;
  /** Counts per star; index 0 is 1★ through index 4 for 5★. */
  distribution: [number, number, number, number, number];
  /** The reaction picked most often, or `null`. */
  topTag: MealTag | null;
}
