import type { Meal, MealType, School } from '../types';

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

/** @deprecated Use {@link APP_SCHOOL}. */
export const VIS_SCHOOL = APP_SCHOOL;

/** @deprecated Use {@link APP_SCHOOL_EN}. */
export const VIS_SCHOOL_EN = APP_SCHOOL_EN;

export function schoolKeyOf(_school: { officeCode: string; schoolCode: string } = APP_SCHOOL): string {
  return APP_SCHOOL_KEY;
}

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
    breakfast: ['소고기야채죽', '베이글 & 크림치즈', '슬라이스햄 & 체다치즈', '삶은달걀'],
    // TODO: 점심/저녁은 원본 식단표가 잘려 있어 이전 요약본을 유지 중.
    lunch: ['잡곡밥', '소고기쌀국수(쌀국수)', '반미샌드위치', '스프링롤', '포기김치'],
    dinner: ['백미밥', '감자수제비국', '순살닭볶음', '회오리감자', '포기김치'],
  },
  '20260903': {
    breakfast: ['미니벨기에와플&시럽', '베이컨스크램블', '바나나'],
    lunch: ['백미밥', '근대된장국', '눈꽃치즈닭갈비', '베이컨감자전', '포기김치'],
    dinner: ['김치볶음밥', '버섯스프', '알리오올리오파스타', '미트볼라따뚜이', '포기김치'],
  },
  '20260904': {
    breakfast: ['하이라이스', '셀프버거', '주스'],
    lunch: ['콩나물불고기국', '참치김치찌개', '순살치킨까스', '도토리묵', '포기김치'],
  },
};

function toMeal(ymd: string, mealType: MealType, dishes: string[]): Meal {
  return {
    id: `vis-${ymd}-${mealType}`,
    type: mealType,
    date: ymd,
    schoolName: APP_SCHOOL.schoolName,
    dishes: dishes.map((name) => ({ name, allergens: [] })),
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
