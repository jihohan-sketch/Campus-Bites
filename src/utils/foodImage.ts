/**
 * Dish name → a photo of that dish.
 *
 * The 식단표 gives us Korean menu lines and nothing else — no photography — so
 * every thumbnail on a menu row is generated on demand from the dish's English
 * name. One shared style suffix and a name-derived seed are what make the wall
 * of them read as a single set rather than as a scrapbook: same white dish,
 * same overhead angle, same light, and the same image every time for a given
 * menu line.
 *
 * The URL is the whole integration. There is no key, no build step and no
 * bundled asset, which also means a menu line that has never been served
 * before still gets a picture the first time it appears.
 */

import { englishDishName } from './dishEnglish';

/**
 * Appended to every prompt, unchanged. This is the entire style contract — if
 * it drifts, the grid stops looking like one set, so change it deliberately
 * and all at once rather than per dish.
 */
const STYLE =
  ', korean school cafeteria food, one portion plated in a simple white ceramic dish, ' +
  'centered, straight top-down overhead shot, soft even studio lighting, ' +
  'pure white seamless background, appetizing realistic food photography, ' +
  'sharp focus, no text, no hands, no cutlery';

const ENDPOINT = 'https://image.pollinations.ai/prompt/';

/**
 * English subjects for dishes the translation table does not cover, keyed the
 * same way `foodIcon` picks an emoji: most specific first, substring matched on
 * the despaced Korean name. A generated picture of "Korean braised chicken" is
 * far closer to what lands on the tray than the generic tray fallback, so this
 * runs before giving up.
 */
interface SubjectRule {
  subject: string;
  keywords: string[];
}

const SUBJECT_RULES: SubjectRule[] = [
  // Mains first, so a garnish word never names the plate.
  { subject: 'Korean braised chicken', keywords: ['치킨', '닭', '윙', '봉', '넓적다리', '통살'] },
  {
    subject: 'Korean grilled marinated beef and pork',
    keywords: ['갈비', '불고기', '수육', '보쌈', '삼겹', '목살', '제육', '스테이크', '떡갈비', '함박'],
  },
  { subject: 'Korean breaded pork cutlet', keywords: ['돈까스', '돈가스', '까스', '가스', '너비아니'] },
  { subject: 'Korean sweet and sour fried pork', keywords: ['탕수육', '꿔바로우'] },
  { subject: 'Korean pan-fried meat patties', keywords: ['동그랑땡', '미트볼'] },
  { subject: 'Korean fried shrimp and tempura', keywords: ['새우', '튀김', '텐더', '프리터', '고로케', '크로켓'] },
  {
    subject: 'Korean grilled fish',
    keywords: ['고등어', '갈치', '삼치', '연어', '생선', '동태', '명태', '가자미', '임연수', '코다리', '대구'],
  },
  { subject: 'Korean braised fish cakes', keywords: ['어묵', '오뎅', '가마보꼬'] },
  { subject: 'Korean stir-fried squid', keywords: ['오징어', '문어', '낙지', '주꾸미', '오삼'] },
  { subject: 'Korean seafood dish with clams', keywords: ['조개', '홍합', '바지락', '해물', '해산물'] },
  { subject: 'Korean egg dish', keywords: ['계란', '달걀', '메추리알', '오믈렛', '스크램블', '지단'] },

  // Rice, noodles, bread.
  { subject: 'Korean curry rice', keywords: ['카레', '커리'] },
  { subject: 'Korean rice bowl topped with meat and vegetables', keywords: ['덮밥', '비빔밥'] },
  { subject: 'Korean fried rice', keywords: ['볶음밥', '오므라이스', '리조또'] },
  { subject: 'bowl of steamed Korean rice', keywords: ['밥', '쌀', '곤드레', '잡곡', '현미', '흑미', '수수'] },
  {
    subject: 'Korean noodle soup',
    keywords: ['라면', '국수', '우동', '쌀국수', '칼국수', '짬뽕', '냉면', '소바', '떡국'],
  },
  { subject: 'creamy pasta', keywords: ['파스타', '스파게티', '까르보', '뇨끼'] },
  { subject: 'slice of pizza', keywords: ['피자'] },
  { subject: 'hamburger', keywords: ['버거', '햄버거'] },
  { subject: 'grilled sausages', keywords: ['소시지', '핫도그', '비엔나', '프랑크'] },
  { subject: 'waffles with syrup', keywords: ['와플', '팬케이크', '핫케이크', '크레페'] },
  { subject: 'sandwich', keywords: ['샌드위치', '토스트', '베이글', '크로플', '또띠아', '부리또', '타코'] },
  { subject: 'bread roll', keywords: ['빵', '모닝롤', '식빵', '바게트', '머핀', '카스테라'] },
  { subject: 'Korean steamed dumplings', keywords: ['만두', '교자', '딤섬', '김말이'] },
  { subject: 'Korean spicy rice cakes', keywords: ['떡볶이', '떡뽁이', '가래떡', '떡꼬치'] },
  { subject: 'Korean gimbap rice rolls', keywords: ['김밥', '주먹밥', '유부초밥', '초밥'] },

  // Soups and stews.
  { subject: 'Korean stew in a bowl', keywords: ['찌개', '전골', '탕', '스튜', '나베', '짜글이'] },
  { subject: 'Korean clear soup in a bowl', keywords: ['국', '스프', '수프'] },
  { subject: 'Korean rice porridge', keywords: ['죽', '누룽지', '오트밀'] },
  { subject: 'bowl of cereal with milk', keywords: ['시리얼'] },

  // Sides.
  { subject: 'Korean napa cabbage kimchi', keywords: ['김치', '깍두기', '겉절이', '배추'] },
  { subject: 'fresh green salad', keywords: ['샐러드'] },
  { subject: 'Korean seasoned vegetable side dish', keywords: ['무침', '생채', '초무침', '냉채', '나물'] },
  {
    subject: 'Korean stir-fried vegetable side dish',
    keywords: ['볶음', '조림', '숙주', '시금치', '브로콜리', '버섯', '가지', '호박', '연근', '우엉', '옥수수', '콘'],
  },
  { subject: 'Korean potato side dish', keywords: ['감자', '고구마', '웨지', '해쉬브라운', '해시브라운'] },
  { subject: 'Korean pan-fried savoury pancake', keywords: ['전', '부침개', '파전'] },
  { subject: 'Korean seasoned tofu', keywords: ['두부', '순두부'] },
  { subject: 'cheese', keywords: ['치즈'] },
  { subject: 'Korean pickled vegetables', keywords: ['피클', '단무지', '할라피뇨'] },
  { subject: 'small dish of sauce', keywords: ['소스', '케찹', '케첩', '마요', '드레싱', '쌈장', '초장', '다대기', '양념장'] },

  // Drinks and desserts.
  { subject: 'glass of milk', keywords: ['우유', '두유', '라떼'] },
  { subject: 'cup of yogurt', keywords: ['요구르트', '요거트', '야쿠르트'] },
  { subject: 'glass of fruit juice', keywords: ['주스', '쥬스', '음료', '에이드', '식혜', '수정과'] },
  { subject: 'fresh apple', keywords: ['사과', '자두', '천도'] },
  { subject: 'fresh mandarin oranges', keywords: ['귤', '오렌지', '한라봉', '자몽'] },
  { subject: 'fresh banana', keywords: ['바나나'] },
  { subject: 'fresh grapes', keywords: ['포도', '샤인'] },
  { subject: 'sliced watermelon and melon', keywords: ['수박', '메론', '멜론', '참외'] },
  { subject: 'fresh strawberries', keywords: ['딸기', '베리'] },
  { subject: 'sliced tropical fruit', keywords: ['파인애플', '망고', '키위', '과일'] },
  { subject: 'slice of cake', keywords: ['케이크', '케잌', '타르트', '파이', '푸딩', '무스'] },
  { subject: 'cookies', keywords: ['쿠키', '비스킷', '과자', '크래커', '전병'] },
  { subject: 'scoop of ice cream', keywords: ['아이스크림', '샤베트', '젤라또'] },
  { subject: 'fruit jelly', keywords: ['젤리', '한천'] },
  { subject: 'chocolate dessert', keywords: ['초코', '초콜릿'] },
  { subject: 'Korean rice cakes', keywords: ['떡', '설기', '인절미', '경단'] },
  { subject: 'mixed nuts', keywords: ['견과', '아몬드', '땅콩', '호두', '캐슈'] },
];

/** Used when nothing matches — still a plated meal, never an empty frame. */
const FALLBACK_SUBJECT = 'Korean school lunch dish';

/**
 * A stable 32-bit hash of the dish name, used as the generator's seed.
 *
 * The seed is what makes 백미밥 the same photograph today and next Tuesday: the
 * URL is identical, so the CDN serves the cached image instead of drawing a new
 * one, and the menu does not shuffle its own pictures between visits.
 */
function seedOf(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 1000000;
}

/**
 * What to ask for a picture of.
 *
 * The English name is the best prompt we have — it was written to describe what
 * arrives on the tray — so a translated dish uses it verbatim. Everything else
 * falls back to the keyword rules, and only then to a generic plate.
 */
export function dishImageSubject(name: string): string {
  const english = englishDishName(name);
  if (english) return english;

  const despaced = name.replace(/\s+/g, '');
  for (const rule of SUBJECT_RULES) {
    if (rule.keywords.some((keyword) => despaced.includes(keyword))) return rule.subject;
  }
  return FALLBACK_SUBJECT;
}

/**
 * The photo URL for a dish.
 *
 * `size` is the pixel size actually requested from the generator, not the size
 * it is drawn at — a menu row renders a 40pt tile from a 256px image so it
 * stays sharp on a 3x screen without asking for a picture nobody will look at
 * closely. Keep it a power-of-two-ish small number: generation time scales with
 * it, and the first student to open a new menu pays that cost.
 */
export function dishImageUrl(name: string, size = 256): string {
  const prompt = encodeURIComponent(`${dishImageSubject(name)}${STYLE}`);
  const query = `width=${size}&height=${size}&seed=${seedOf(name)}&nologo=true`;
  return `${ENDPOINT}${prompt}?${query}`;
}
