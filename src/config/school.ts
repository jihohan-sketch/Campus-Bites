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

/** 10–11월 식단표. 새 달이 추가되면 가장 오래된 달을 지운다. */
const MENUS: Record<string, DayMenu> = {
  // 10월 1주차 (9.28~10.16 식단표 개정본)
  '20261001': {
    breakfast: [
      '하이라이스 & 스팸밥',
      '계란국',
      '베이컨소시지볶음',
      '셀프토스트 & 잼 & 버터',
      '시리얼 & 우유',
    ],
    lunch: [
      '잡곡밥',
      '된장 & 닭안심거리',
      '해물둥근감자전',
      '어묵볶음',
      '부추무생채무침',
      '깍두기',
    ],
    dinner: ['잡곡밥', '부추달걀국', '마파두부', '고추잡채 & 꽃빵', '포기김치'],
  },

  '20261002': {
    breakfast: [
      '셀프햄버거 (햄/패티/치즈/후라이/피클)',
      '연유주스',
      '바나나',
      '시리얼 & 우유',
    ],
    lunch: [
      '백미밥',
      '소고기미역국',
      '제육볶음',
      '생선까스 & 타르타르소스',
      '굴소스청경채볶음',
      '포기김치',
    ],
    // 금요일 저녁은 급식 없음.
  },

  // 10월 3~11일은 추석 연휴로 급식 없음.

  // 10월 3주차
  '20261012': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: [
      '잡곡밥',
      '돼지고기고추장찌개',
      '순살닭살볶음',
      '애호박전 & 칠리소스',
      '감자조림',
      '포기김치',
    ],
    dinner: ['잡곡밥', '사골순대국', '고구마치즈볼 & 소스', '메추리알조림', '깍두기'],
  },
  '20261013': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는 요거트', '시리얼 & 우유'],
    lunch: ['백미밥', '갈비탕', '오징어김치전', '메밀콩나물무침', '아삭이고추무침', '깍두기'],
    dinner: [
      '백미밥',
      '양송이스프',
      '함박스테이크 & 체다치즈소스',
      '감자보트 & 에그스프레드',
      '포기김치',
    ],
  },
  '20261014': {
    breakfast: [
      '소고기야채죽',
      '베이글 & 크림치즈',
      '슬라이스햄 & 체다치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    lunch: [
      '김가루밥',
      '나가사키짬뽕국',
      '꿔바로우 & 소스',
      '토마토달걀볶음',
      '짜요짜요',
      '포기김치',
    ],
    // 붙여넣은 식단표가 '백미밥, 스팸…'에서 끊겨 나머지는 이전 값 유지.
    dinner: ['백미밥', '스팸김치찌개', '스윗칠리치킨봉', '군만두 & 초간장', '포기김치'],
  },
  '20261015': {
    breakfast: ['불고기주먹밥', '우동국', '무말랭이', '프렌치토스트', '시리얼 & 우유'],
    lunch: [
      '잡곡밥',
      '얼큰순두부국',
      '돼지갈비찜',
      '감자채파프리카볶음',
      '해물비빔국수',
      '포기김치',
    ],
    dinner: ['잡곡밥', '닭개장', '대패삼겹볶음', '해쉬브라운 & 케찹', '포기김치'],
  },
  '20261016': {
    breakfast: [
      '셀프햄버거',
      '흰죽 / 치즈 / 우유 / 시리얼',
      '엔요요구르트',
      '바나나',
      '시리얼 & 우유',
    ],
    lunch: [
      '잡곡밥',
      '떡국',
      '돈육간장불고기',
      '해물파전',
      '속배추겉절이 & 쌈장',
      '포기김치',
    ],
    // 금요일 저녁은 급식 없음.
  },

  // 10월 4주차
  '20261019': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: ['백미밥', '유부장국', '돈육카레라이스', '칠리탕수육', '콘샐러드브레드', '포기김치'],
    dinner: ['백미밥', '김치콩나물국', '닭강정', '참치두부양념조림', '포기김치'],
  },
  '20261020': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는 요구르트', '시리얼 & 우유'],
    lunch: [
      '백미밥',
      '소고기국밥',
      '너비아니 & 부추무침',
      '매콤감자조림',
      '굴소스가지볶음',
      '포기김치',
    ],
    dinner: ['백미밥', '시래기된장국', '제육볶음', '계란말이', '포기김치'],
  },
  '20261021': {
    breakfast: [
      '소고기야채죽',
      '베이컨스크램블에그',
      '슬라이스햄 & 치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    lunch: ['곤약밥', '우동국', '고추장불고기', '오꼬노미야끼', '요구르트', '피클 & 할라피뇨'],
    dinner: ['흑미밥', '순두부', '돈육볶음', '버터갈릭감자튀김', '단무지무침'],
  },
  '20261022': {
    breakfast: ['불고기햄버거', '베이컨스크램블에그', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: [
      '잡곡밥',
      '북어무국',
      '고추장순살닭볶음',
      '양념두부조림',
      '도토리묵무침',
      '포기김치',
    ],
    dinner: ['백미밥', '마라탕', '타코야끼', '치킨너겟 & 머스터드', '포기김치'],
  },
  '20261023': {
    breakfast: ['샐러드버거', '연유주스', '바나나', '시리얼 & 우유'],
    lunch: ['백미밥', '잔치국수', '동파육', '깻잎쌈 & 쌈장', '옥수수샐러드', '포기김치'],
    // 금요일 저녁은 급식 없음.
  },

  // 10월 5주차
  '20261026': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: ['잡곡밥', '감자탕', '바베큐돈육찜', '한식잡채', '도라지오이무침', '포기김치'],
    dinner: ['후리가케밥', '백미밥', '꼬치어묵국', '국물떡볶이', '김말이튀김', '깍두기'],
  },
  '20261027': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는 요구르트', '시리얼 & 우유'],
    // 사진 판독본 기준. '빨간콩소고기무침'은 원본 PDF 확인 필요.
    lunch: ['이색채소밥', '빨간콩소고기무침', '빈대떡 & 전', '파채장육', '피클 & 할라피뇨'],
    dinner: ['백미밥', '크림스프 & 크루통', '양배추오리훈제', '미트볼조림', '오이피클'],
  },
  '20261028': {
    breakfast: [
      '소고기야채죽',
      '베이컨스크램블에그',
      '슬라이스햄 & 치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    // 사진 판독본 기준. '주먹국'은 원본 PDF 확인 필요.
    lunch: ['주먹밥', '주먹국', '치킨', '치킨소스', '요구르트'],
    dinner: ['백미밥', '순살우거지감자탕', '군만두', '콘샐러드', '매실잼', '포기김치'],
  },
  '20261029': {
    breakfast: ['하이라이스샌드', '계란찜', '프렌치토스트', '시리얼 & 우유'],
    lunch: ['백미밥', '소고기미역국', '소불고기', '숙주맛살무침', '포기김치'],
    // 사진 판독본 기준. '연잎피박로우'는 원본 PDF 확인 필요.
    dinner: ['백미밥', '콩나물국', '마라샹궈', '연잎피박로우', '포기김치'],
  },
  '20261030': {
    breakfast: ['샐러드버거', '연유주스', '바나나', '시리얼 & 우유'],
    lunch: ['잡곡밥', '참치김치찌개', '궁중떡갈비', '교자만두찜', '포기김치'],
    // 금요일 저녁은 급식 없음.
  },

  // 11월 1주차
  '20261102': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: [
      '백미밥',
      '바지락순두국',
      '치킨마크니커리 & 또띠아',
      '고구마치즈돈까스 & 소스',
      '오이탕탕이',
      '포기김치',
    ],
    dinner: ['백미밥', '샤브샤브국', '마파두부', '닭강정', '포기김치'],
  },
  '20261103': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는요거트', '시리얼 & 우유'],
    lunch: ['백미밥', '물만둣국', '제육볶음', '뿌링클감자튀김', '도토리묵무침', '포기김치'],
    dinner: ['백미밥', '돼지국밥', '오징어떡볶음', '고구마고로케 & 케찹', '포기김치'],
  },
  '20261104': {
    breakfast: [
      '소고기야채죽',
      '베이글 & 크림치즈',
      '슬라이스햄 & 체다치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    lunch: ['잡곡밥', '돈코츠라멘', '멘보샤 & 소스', '모닝빵햄치즈토스트', '요구르트', '포기김치'],
    dinner: ['백미밥', '육개장', '생선까스 & 타르타르소스', '쫄면무침', '포기김치'],
  },
  '20261105': {
    breakfast: [
      '불고기덮밥',
      '어묵국',
      '비엔나소시지볶음',
      '셀프토스트 & 잼 & 버터',
      '시리얼 & 우유',
    ],
    lunch: ['백미밥', '얼갈이된장국', '돈사태떡조림', '갈비만두', '애호박새우젓볶음', '포기김치'],
    dinner: ['잡곡밥', '감자옹심이국', '묵은지닭볶음탕', '해쉬브라운 & 케찹', '깍두기'],
  },
  '20261106': {
    breakfast: ['셀프햄버거 (햄/패티/치즈/후라이/피클)', '엔요주스', '바나나', '시리얼 & 우유'],
    lunch: ['잡곡밥', '물떡꼬치국', '돈간장불고기', '해물땡전', '오이부추무침', '포기김치'],
    // 금요일 저녁은 급식 없음.
  },

  // 11월 2주차
  '20261109': {
    breakfast: ['영양닭죽', '삶은달걀', '바나나', '셀프토스트 & 잼 & 버터', '시리얼 & 우유'],
    lunch: [
      '나물비빔밥',
      '시금치된장국',
      '돈장조림',
      '계란후라이 & 약고추장',
      '고구마맛탕',
      '포기김치',
    ],
    dinner: ['김가루밥', '우동국', '크림카레떡볶이', '김치메밀전병', '포기김치'],
  },
  '20261110': {
    breakfast: ['뉴욕핫도그', '베이컨스크램블에그', '떠먹는요거트', '시리얼 & 우유'],
    lunch: ['잡곡밥', '닭곰탕 & 당면', '왕만두찜 & 양념장', '햄감자조림', '참나물된장무침', '깍두기'],
    dinner: ['백미밥', '계란파국', '사천짜장볶음우동', '탕수육 & 소스', '건파래볶음'],
  },
  '20261111': {
    breakfast: [
      '소고기야채죽',
      '베이글 & 크림치즈',
      '슬라이스햄 & 체다치즈',
      '삶은달걀',
      '시리얼 & 우유',
    ],
    lunch: ['김치볶음밥', '양송이스프', '로제파스타', '회오리감자', '마늘빵', '오이피클'],
    dinner: ['백미밥', '소고기미역국', '돈육김치볶음', '온두부', '파래김'],
  },
  '20261112': {
    breakfast: ['하이라이스덮밥', '계란국', '프렌치토스트', '시리얼 & 우유', '포기김치'],
    lunch: [
      '치킨마요덮밥',
      '유부장국',
      '불고기퀘사디아',
      '베이컨그린빈볶음',
      '짜요짜요',
      '포기김치',
    ],
    dinner: [
      '백미밥',
      '동태찌개',
      '명란한떡갈비 & 부추무침',
      '시금치프리타타 (계란찜)',
      '포기김치',
    ],
  },
  '20261113': {
    breakfast: ['셀프햄버거 (햄/패티/치즈/후라이/피클)', '엔요주스', '바나나', '시리얼 & 우유'],
    lunch: ['백미밥', '짬뽕국', '고추잡채 & 꽃빵', '모짜렐라치즈볼', '청경채굴소스찜', '포기김치'],
    // 금요일 저녁은 급식 없음.
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
