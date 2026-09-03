/**
 * Dish name → emoji.
 *
 * NEIS publishes menu lines as bare Korean text (`친환경수수밥`, `돈육김치찌개`),
 * so the icon on a menu row has to be inferred from the name. The rules below
 * are ordered most-specific first: `치즈돈까스` should match 돈까스, not 치즈.
 */

interface IconRule {
  emoji: string;
  /** Any of these substrings in the dish name selects this icon. */
  keywords: string[];
}

const RULES: IconRule[] = [
  // Mains — checked first so a garnish word never wins.
  { emoji: '🍗', keywords: ['치킨', '닭', '윙', '봉', '넓적다리', '통살'] },
  { emoji: '🍖', keywords: ['갈비', '불고기', '수육', '보쌈', '삼겹', '목살', '제육', '스테이크', '떡갈비', '함박'] },
  { emoji: '🥩', keywords: ['돈까스', '돈가스', '까스', '가스', '탕수육', '너비아니', '동그랑땡'] },
  { emoji: '🍤', keywords: ['새우', '튀김', '텐더', '프리터', '고로케', '크로켓'] },
  { emoji: '🐟', keywords: ['고등어', '갈치', '삼치', '연어', '생선', '동태', '명태', '가자미', '임연수', '코다리', '어묵', '오뎅'] },
  { emoji: '🦑', keywords: ['오징어', '문어', '낙지', '주꾸미'] },
  { emoji: '🦐', keywords: ['조개', '홍합', '바지락', '해물', '해산물'] },
  { emoji: '🥚', keywords: ['계란', '달걀', '메추리알', '오믈렛', '스크램블', '지단'] },

  // Rice, noodles, bread.
  { emoji: '🍛', keywords: ['카레', '커리', '덮밥', '비빔밥', '볶음밥', '오므라이스', '리조또'] },
  { emoji: '🍚', keywords: ['밥', '쌀', '곤드레', '잡곡', '현미', '흑미', '수수'] },
  { emoji: '🍜', keywords: ['라면', '국수', '우동', '쌀국수', '칼국수', '짬뽕', '냉면', '소바'] },
  { emoji: '🍝', keywords: ['파스타', '스파게티', '까르보', '토마토소스'] },
  { emoji: '🍕', keywords: ['피자'] },
  { emoji: '🍔', keywords: ['버거', '햄버거'] },
  { emoji: '🌭', keywords: ['소시지', '핫도그', '비엔나', '프랑크'] },
  { emoji: '🧇', keywords: ['와플', '팬케이크', '핫케이크', '크레페', '시럽'] },
  { emoji: '🥪', keywords: ['샌드위치', '토스트', '베이글', '크로플'] },
  { emoji: '🍞', keywords: ['빵', '모닝롤', '식빵', '바게트', '머핀', 'casta', '카스테라'] },
  { emoji: '🥟', keywords: ['만두', '교자', '군만두', '딤섬'] },
  { emoji: '🍢', keywords: ['떡볶이', '떡뽁이', '가래떡', '떡꼬치'] },
  { emoji: '🌯', keywords: ['부리또', '타코', '랩'] },
  { emoji: '🍙', keywords: ['김밥', '주먹밥', '유부초밥', '초밥'] },

  // Soups and stews.
  { emoji: '🍲', keywords: ['찌개', '전골', '탕', '스튜', '나베'] },
  { emoji: '🥣', keywords: ['국', '스프', '수프', '죽', '누룽지', '시리얼', '오트밀'] },

  // Sides.
  { emoji: '🥬', keywords: ['김치', '깍두기', '겉절이', '배추'] },
  { emoji: '🥗', keywords: ['샐러드', '무침', '생채', '초무침', '냉채'] },
  { emoji: '🥦', keywords: ['나물', '볶음', '조림', '숙주', '시금치', '브로콜리', '버섯', '가지', '호박', '감자', '고구마', '연근', '우엉'] },
  { emoji: '🧀', keywords: ['치즈', '피자치즈'] },
  { emoji: '🌶️', keywords: ['고추', '매운', '불닭'] },
  { emoji: '🥫', keywords: ['소스', '케찹', '케첩', '마요', '드레싱', '쌈장', '초장'] },
  { emoji: '🍟', keywords: ['감자튀김', '웨지', '해쉬브라운', '해시브라운'] },
  { emoji: '🌽', keywords: ['옥수수', '콘'] },

  // Drinks and desserts.
  { emoji: '🥛', keywords: ['우유', '두유', '요구르트', '요거트', '야쿠르트', '라떼'] },
  { emoji: '🧃', keywords: ['주스', '쥬스', '음료', '에이드', '식혜', '수정과'] },
  { emoji: '🍎', keywords: ['사과', '배', '자두', '천도'] },
  { emoji: '🍊', keywords: ['귤', '오렌지', '한라봉', '자몽'] },
  { emoji: '🍌', keywords: ['바나나'] },
  { emoji: '🍇', keywords: ['포도', '샤인'] },
  { emoji: '🍉', keywords: ['수박', '메론', '멜론', '참외'] },
  { emoji: '🍓', keywords: ['딸기', '베리'] },
  { emoji: '🍍', keywords: ['파인애플', '망고', '키위'] },
  { emoji: '🍰', keywords: ['케이크', '케잌', '타르트', '파이', '푸딩', '무스'] },
  { emoji: '🍪', keywords: ['쿠키', '비스킷', '과자', '크래커', '전병'] },
  { emoji: '🍦', keywords: ['아이스크림', '아이스', '샤베트', '젤라또'] },
  { emoji: '🍮', keywords: ['젤리', '한천'] },
  { emoji: '🍫', keywords: ['초코', '초콜릿'] },
  { emoji: '🍡', keywords: ['떡', '설기', '인절미', '경단'] },
  { emoji: '🥜', keywords: ['견과', '아몬드', '땅콩', '호두', '캐슈'] },
];

/** Shown when nothing matches — still food-shaped, never a blank. */
const FALLBACK = '🍽️';

/**
 * The emoji that best describes a dish.
 *
 * Matching is substring based on the raw name, which is what NEIS gives us;
 * `친환경백미밥` matches 밥 without needing a full menu dictionary.
 */
export function foodEmoji(dishName: string): string {
  const name = dishName.replace(/\s+/g, '');
  if (!name) return FALLBACK;

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.emoji;
    }
  }
  return FALLBACK;
}

/**
 * The dish a student would call "the main" — the first line that maps to a
 * protein or a one-dish meal, falling back to the second line (usually the
 * side after rice) and then the first.
 */
const MAIN_EMOJIS = new Set(['🍗', '🍖', '🥩', '🍤', '🐟', '🦑', '🦐', '🍛', '🍜', '🍝', '🍕', '🍔', '🥟', '🍢']);

export function headlineDish<T extends { name: string }>(dishes: T[]): T | null {
  if (dishes.length === 0) return null;
  return (
    dishes.find((dish) => MAIN_EMOJIS.has(foodEmoji(dish.name))) ?? dishes[1] ?? dishes[0]
  );
}
