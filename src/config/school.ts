import type { Meal, MealType, School } from '../types';
import { parseDishLine } from '../utils/meal';

/** Internal partition key for Firestore collections. */
export const APP_SCHOOL_KEY = 'VIS_0000001';

/** The only school this app serves — 베일러국제학교 (VIS). */
export const APP_SCHOOL: School = {
  officeCode: 'VIS',
  officeName: '경기도',
  schoolCode: '0000001',
  schoolName: '베일러국제학교',
  schoolKind: '국제학교',
  region: '경기도 안성시',
  address: '경기도 안성시 보개면 성공길 1',
};

export const APP_SCHOOL_EN = 'Valor International School';
export const APP_SCHOOL_SHORT = 'VIS';

/**
 * The only email domain that may hold an account.
 *
 * 급식표는 누구나 볼 수 있지만, 제보·평가·친구는 학교 구성원만 쓸 수 있어야
 * 합니다. 클라이언트의 검사는 안내용이고, 실제 강제는 `firestore.rules`의
 * `schoolMember()`가 합니다 — 둘을 함께 고쳐야 합니다.
 */
export const APP_SCHOOL_EMAIL_DOMAIN = 'valorschool.org';

/** True when `email` belongs to {@link APP_SCHOOL_EMAIL_DOMAIN}. */
export function isSchoolEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${APP_SCHOOL_EMAIL_DOMAIN}`);
}

/**
 * The product name, used everywhere the app names itself. Keep this in sync
 * with `expo.name` in app.json, which is what the browser tab and the home
 * screen icon show.
 */
export const APP_NAME = 'VIS 급식';

export function schoolKeyOf(_school: { officeCode: string; schoolCode: string } = APP_SCHOOL): string {
  return APP_SCHOOL_KEY;
}

/**
 * A day's menu. Dish strings may carry a NEIS style allergen suffix, e.g.
 * `돈까스 (1.5.6)`, which is parsed out into {@link Dish.allergens}.
 */
type DayMenu = Partial<Record<MealType, string[]>>;

/** 8–9월 식단표 (새해오름). */
const MENUS: Record<string, DayMenu> = {
  '20260824': {
    lunch: ['백미밥', '냉국수', '해물파전', '제육볶음', '마늘쫑무침', '포기김치'],
  },
  '20260825': {
    lunch: ['잡곡밥', '된장찌개', '닭갈비볶음', '어묵볶음', '포기김치'],
    dinner: ['백미밥', '소고기미역국', '돼지갈비찜', '잡채', '포기김치'],
  },
  // 8/26 (수) 개학
  '20260826': {
    breakfast: ['불고기덮밥', '우동국', '무피클', '프렌치토스트', '시리얼 & 우유'],
    lunch: [
      '야채볶음밥',
      '크림스프',
      '텍사스 치킨 스테이크',
      '투움바 파스타',
      '콘치즈 포테이토보트',
      '포기김치',
    ],
    dinner: ['백미밥', '부대찌개 & 라면사리', '생선까스 & 타르타르', '계란말이', '포기김치'],
  },
  '20260827': {
    breakfast: [
      '소고기야채죽',
      '셀프햄버거 (햄/패티/치즈/후라이/피클)',
      '과일',
      '시리얼 & 우유',
    ],
    lunch: [
      '일본식덮밥',
      '팽이버섯된장국',
      '타코야끼 & 소스',
      '핫타이누들샐러드',
      '바질토마토',
      '포기김치',
    ],
    dinner: ['잡곡밥', '스팸김치찌개', '콩나물불고기', '가지탕수 & 칠리소스', '포기김치'],
  },
  '20260828': {
    breakfast: [
      '하이라이스덮밥',
      '계란국',
      '비엔나소시지볶음',
      '셀프토스트 & 잼 & 버터',
      '시리얼 & 우유',
    ],
    lunch: [
      '잡곡밥',
      '매콤순두부찌개',
      '오리훈제볶음',
      '왕새우튀김 & 칠리소스',
      '브로콜리야채볶음',
      '포기김치',
    ],
  },
  '20260831': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: ['백미밥', '순두부짬뽕국', '사천짜장면', '유린기', '스틱단무지무침', '요구르트'],
    dinner: ['잡곡밥', '팍팍장', '간장불고기', '만풍만두', '포기김치'],
  },
  '20260901': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는요거트', '오트밀 & 블루베리 & 우유'],
    lunch: [
      '햄야채볶음밥',
      '우삼겹된장찌개',
      '더블치즈장박스테이크 & 로제소스',
      '오므라이스소스 & 계란지단',
      '무생채무침',
      '포기김치',
    ],
    dinner: ['백미밥', '바지락살미역국', '닭볶음탕', '대구까스 & 콘마요', '포기김치'],
  },
  '20260902': {
    breakfast: [
      '소고기야채죽',
      '베이글 & 크림치즈',
      '슬라이스햄 & 체다치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    lunch: [
      '잡곡밥',
      '소고기쌀국수',
      '반미샌드위치',
      '야채춘권 & 칠리',
      '오이무침',
      '포기김치',
    ],
    dinner: ['백미밥', '감자옹심이국', '순살닭갈비볶음', '회오리감자', '포기김치'],
  },
  '20260903': {
    breakfast: [
      '미니벨기에와플 & 시럽',
      '베이컨스크램블에그',
      '바나나',
      '오트밀 & 블루베리 & 우유',
    ],
    lunch: [
      '백미밥',
      '근대된장국',
      '눈꽃치즈닭갈비',
      '베이컨감자전',
      '콩나물무침',
      '포기김치',
    ],
    dinner: ['김치볶음밥', '양송이스프', '알리오올리오파스타', '미트볼라따뚜이'],
  },
  '20260904': {
    breakfast: [
      '하이라이스덮밥',
      '셀프햄버거 (햄/패티/치즈/후라이/피클)',
      '엔요주스',
      '시리얼 & 우유',
    ],
    lunch: [
      '소고기콩나물밥 / 양념장',
      '참치김치찌개',
      '순살치킨까스 & 양파드레싱',
      '도토리묵무침',
      '감자채볶음',
      '포기김치',
    ],
  },
};

export function toMeal(ymd: string, mealType: MealType, dishes: string[]): Meal {
  return {
    id: `vis-${ymd}-${mealType}`,
    type: mealType,
    date: ymd,
    schoolName: APP_SCHOOL.schoolName,
    dishes: dishes.map(parseDishLine),
    calories: null,
    headcount: null,
    nutrition: [],
    origins: [],
  };
}

/** Returns every meal service on the given `YYYYMMDD` dates. */
export function fetchMealsInRange(fromYmd: string, toYmd: string): Meal[] {
  const meals: Meal[] = [];
  const from = Number(fromYmd);
  const to = Number(toYmd);

  Object.entries(MENUS).forEach(([ymd, day]) => {
    const key = Number(ymd);
    if (key < from || key > to) return;
    (['breakfast', 'lunch', 'dinner'] as MealType[]).forEach((type) => {
      const dishes = day[type];
      if (dishes?.length) meals.push(toMeal(ymd, type, dishes));
    });
  });

  return meals.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}

const MENU_DATES = Object.keys(MENUS).sort();

/**
 * The span the bundled 식단표 actually covers.
 *
 * Screens use this to tell a student "the menu has not been published yet"
 * instead of implying the school simply is not serving that day.
 */
export const MENU_COVERAGE: { first: string; last: string } = {
  first: MENU_DATES[0] ?? '',
  last: MENU_DATES[MENU_DATES.length - 1] ?? '',
};

/** True when `ymd` falls past the last day the bundled menu covers. */
export function isBeyondMenuCoverage(ymd: string): boolean {
  return MENU_COVERAGE.last.length > 0 && ymd > MENU_COVERAGE.last;
}

/**
 * Printed on the school's own 식단표. The menu is a plan, not a promise, and
 * every screen that shows a future day has to say so.
 */
export const MENU_DISCLAIMER =
  '식단은 식자재 수급 및 학원 사정에 따라 변경될 수 있습니다.';
