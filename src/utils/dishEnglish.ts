/**
 * English names for the dishes on the VIS 식단표.
 *
 * VIS is an international school, so a student who cannot read a Korean dish
 * name still has to be able to tell what is being served. These are readable
 * descriptions rather than transliterations — "Spicy Braised Short Ribs" tells
 * you what arrives on the tray, "Maeun Galbijjim" does not. A few dishes are
 * known by their own name in English (japchae, takoyaki, banh mi); those keep
 * it, with a gloss where the name alone is not enough.
 *
 * Matching ignores Korean spacing, so a menu that writes `떠먹는 요거트` one
 * week and `떠먹는요거트` the next resolves to the same entry.
 */

const DISH_EN: Record<string, string> = {
  // 밥 · 면 · 죽
  백미밥: 'Steamed White Rice',
  잡곡밥: 'Multigrain Rice',
  김가루밥: 'Rice with Seaweed Flakes',
  후리가케밥: 'Furikake Rice',
  '소고기콩나물밥 / 양념장': 'Beef and Bean Sprout Rice with Seasoned Soy Sauce',
  야채볶음밥: 'Vegetable Fried Rice',
  햄야채볶음밥: 'Ham and Vegetable Fried Rice',
  김치볶음밥: 'Kimchi Fried Rice',
  '중화풍 계란볶음밥': 'Chinese-style Egg Fried Rice',
  불고기덮밥: 'Bulgogi Rice Bowl',
  하이라이스덮밥: 'Hayashi Rice Bowl',
  일본식덮밥: 'Japanese-style Rice Bowl',
  바몬드커리라이스: 'Vermont Curry Rice',
  '오므라이스소스 & 계란지단': 'Omurice Sauce with Egg Crepe',
  영양죽: 'Nutritious Rice Porridge',
  영양닭죽: 'Nutritious Chicken Porridge',
  소고기야채죽: 'Beef and Vegetable Porridge',
  소고기미역죽: 'Beef and Seaweed Porridge',
  냉국수: 'Chilled Noodles',
  사천짜장면: 'Sichuan Black Bean Noodles',
  소고기쌀국수: 'Beef Pho',
  김치어묵국수: 'Kimchi Fish Cake Noodle Soup',
  명란크림우동: 'Pollack Roe Cream Udon',
  나폴리탄파스타: 'Napolitan Pasta',
  알리오올리오파스타: 'Aglio e Olio Pasta',
  '투움바 파스타': 'Toowoomba Pasta',
  크림감자뇨끼: 'Creamy Potato Gnocchi',
  마라탕: 'Mala Tang (Spicy Sichuan Soup)',
  '양념깻잎 & 기름막국수': 'Seasoned Perilla Leaves with Oil Buckwheat Noodles',

  // 국 · 찌개 · 탕
  계란국: 'Egg Drop Soup',
  어묵국: 'Fish Cake Soup',
  돼지어묵국: 'Pork and Fish Cake Soup',
  우동국: 'Udon Soup',
  콩나물국: 'Bean Sprout Soup',
  얼큰콩나물국: 'Spicy Bean Sprout Soup',
  순두부국: 'Soft Tofu Soup',
  순두부짬뽕국: 'Spicy Seafood Soft Tofu Soup',
  소고기뭇국: 'Beef and Radish Soup',
  소고기미역국: 'Beef and Seaweed Soup',
  바지락살미역국: 'Clam and Seaweed Soup',
  근대된장국: 'Chard Soybean Paste Soup',
  실파된장국: 'Spring Onion Soybean Paste Soup',
  팽이버섯된장국: 'Enoki Mushroom Soybean Paste Soup',
  감자옹심이국: 'Potato Dumpling Soup',
  유부주머니국: 'Stuffed Tofu Pouch Soup',
  조랭이떡국: 'Jorangi Rice Cake Soup',
  육개장: 'Spicy Beef Soup',
  양송이스프: 'Cream of Mushroom Soup',
  크림스프: 'Cream Soup',
  된장찌개: 'Soybean Paste Stew',
  우삼겹된장찌개: 'Beef Brisket Soybean Paste Stew',
  매콤순두부찌개: 'Spicy Soft Tofu Stew',
  스팸김치찌개: 'Spam Kimchi Stew',
  참치김치찌개: 'Tuna Kimchi Stew',
  '부대찌개 & 라면사리': 'Army Stew with Ramen Noodles',
  '모듬찌개 & 라면사리': 'Assorted Stew with Ramen Noodles',
  감자짜글이: 'Spicy Potato and Pork Stew',
  순살감자탕: 'Boneless Pork and Potato Stew',
  '사골순대국 & 다대기': 'Sundae Soup with Chili Paste',
  닭볶음탕: 'Spicy Braised Chicken',

  // 육류 주요리
  소불고기: 'Beef Bulgogi',
  간장불고기: 'Soy-Marinated Bulgogi',
  바싹돈육불고기: 'Crispy Pork Bulgogi',
  콩나물불고기: 'Bean Sprout Bulgogi',
  제육볶음: 'Stir-fried Spicy Pork',
  오삼볶음: 'Stir-fried Squid and Pork Belly',
  오리훈제볶음: 'Stir-fried Smoked Duck',
  닭갈비볶음: 'Stir-fried Spicy Chicken',
  순살닭갈비볶음: 'Stir-fried Boneless Spicy Chicken',
  치즈닭갈비: 'Cheese Spicy Chicken',
  눈꽃치즈닭갈비: 'Snow Cheese Spicy Chicken',
  돼지갈비찜: 'Braised Pork Ribs',
  매운갈비찜: 'Spicy Braised Short Ribs',
  돈사태떡찜: 'Braised Pork Shank with Rice Cake',
  분모자순살찜: 'Braised Chicken with Sweet Potato Noodles',
  데리야끼갈릭떡갈비: 'Teriyaki Garlic Grilled Short Rib Patty',
  '더블치즈장박스테이크 & 로제소스': 'Double Cheese Steak with Rosé Sauce',
  '텍사스 치킨 스테이크': 'Texas Chicken Steak',
  유린기: 'Yulinji (Crispy Chicken in Soy Vinaigrette)',
  꿔바로우: 'Sweet and Sour Crispy Pork',
  동그랑땡전: 'Pan-fried Meat Patties',
  미트볼라따뚜이: 'Meatball Ratatouille',
  비엔나소시지볶음: 'Stir-fried Vienna Sausages',
  베이컨소시지볶음: 'Stir-fried Bacon and Sausage',
  '미니핫도그 & 케첩': 'Mini Corn Dogs with Ketchup',
  뉴욕핫도그: 'New York Hot Dog',
  셀프햄버거: 'Build-Your-Own Burger',
  '셀프햄버거 (햄/패티/치즈/후라이/피클)':
    'Build-Your-Own Burger (Ham, Patty, Cheese, Fries, Pickles)',
  반미샌드위치: 'Banh Mi Sandwich',
  치킨또띠아: 'Chicken Tortilla',
  '슬라이스햄 & 치즈': 'Sliced Ham and Cheese',
  '슬라이스햄 & 체다치즈': 'Sliced Ham and Cheddar Cheese',

  // 생선 · 튀김
  삼치카레구이: 'Curry-Grilled Mackerel',
  '생선까스 & 타르타르': 'Fish Cutlet with Tartar Sauce',
  '생선까스 & 양파드레싱': 'Fish Cutlet with Onion Dressing',
  '연어까스 & 타르타르소스': 'Salmon Cutlet with Tartar Sauce',
  '대구까스 & 콘마요': 'Cod Cutlet with Corn Mayo',
  '순살치킨까스 & 양파드레싱': 'Boneless Chicken Cutlet with Onion Dressing',
  '고구마치즈돈까스 & 소스': 'Sweet Potato Cheese Pork Cutlet with Sauce',
  '왕새우튀김 & 칠리소스': 'Fried King Prawns with Chili Sauce',
  '김말이 & 만두튀김': 'Fried Seaweed Rolls and Dumplings',
  '야채춘권 & 칠리': 'Vegetable Spring Rolls with Chili Sauce',
  '가지탕수 & 칠리소스': 'Sweet and Sour Eggplant with Chili Sauce',
  '타코야끼 & 소스': 'Takoyaki with Sauce',
  만풍만두: 'Manpung Dumplings',
  회오리감자: 'Tornado Potato',
  고구마치즈스틱: 'Sweet Potato Cheese Sticks',
  라이스찹고구마볼: 'Crispy Rice Sweet Potato Balls',

  // 전 · 부침 · 사이드
  해물파전: 'Seafood Scallion Pancake',
  오징어김치전: 'Squid Kimchi Pancake',
  베이컨감자전: 'Bacon Potato Pancake',
  옥수수전: 'Corn Pancake',
  메밀전병: 'Buckwheat Crepe Rolls',
  계란말이: 'Rolled Omelette',
  잡채: 'Japchae (Glass Noodle Stir-fry)',
  파채자돌떡볶이: 'Tteokbokki with Scallion and Beef',
  '동두부구이 & 양념장': 'Grilled Tofu with Seasoned Soy Sauce',
  메추리알조림: 'Braised Quail Eggs',
  가마보꼬어묵조림: 'Braised Kamaboko Fish Cake',
  어묵볶음: 'Stir-fried Fish Cake',
  감자채볶음: 'Stir-fried Potato Strips',
  브로콜리야채볶음: 'Stir-fried Broccoli and Vegetables',
  느타리버섯호박볶음: 'Stir-fried Oyster Mushroom and Zucchini',
  '콘치즈 포테이토보트': 'Corn Cheese Potato Boat',
  '해쉬브라운 & 케첩': 'Hash Browns with Ketchup',
  팍팍장: 'Spicy Soybean Paste Sauce',

  // 나물 · 무침 · 김치
  포기김치: 'Napa Cabbage Kimchi',
  깍두기: 'Diced Radish Kimchi',
  콩나물무침: 'Seasoned Bean Sprouts',
  숙주미나리무침: 'Seasoned Bean Sprouts and Water Parsley',
  오이무침: 'Seasoned Cucumber',
  오이지무침: 'Seasoned Pickled Cucumber',
  오이양배추무침: 'Seasoned Cucumber and Cabbage',
  무생채무침: 'Seasoned Shredded Radish',
  양배추쌈무침: 'Seasoned Cabbage Wraps',
  도토리묵무침: 'Seasoned Acorn Jelly',
  마늘쫑무침: 'Seasoned Garlic Scapes',
  스틱단무지무침: 'Seasoned Pickled Radish Sticks',
  새콤무침: 'Tangy Seasoned Salad',
  핫타이누들샐러드: 'Hot Thai Noodle Salad',
  바질토마토: 'Basil Tomato',
  '채소 & 요거트소스': 'Vegetables with Yogurt Sauce',
  무피클: 'Pickled Radish',
  '피클 & 할라피뇨': 'Pickles and Jalapeños',

  // 아침 · 빵 · 음료
  '시리얼 & 우유': 'Cereal and Milk',
  '오트밀 & 블루베리 & 우유': 'Oatmeal with Blueberries and Milk',
  '셀프토스트 & 잼 & 버터': 'Make-Your-Own Toast with Jam and Butter',
  프렌치토스트: 'French Toast',
  '베이글 & 크림치즈': 'Bagel with Cream Cheese',
  '베이컨 & 크림치즈': 'Bacon and Cream Cheese',
  베이컨스크램블에그: 'Bacon Scrambled Eggs',
  삶은달걀: 'Boiled Egg',
  바게트피자빵: 'Baguette Pizza Bread',
  '미니벨기에와플 & 시럽': 'Mini Belgian Waffles with Syrup',
  '떠먹는 요거트': 'Spoonable Yogurt',
  요구르트: 'Yogurt Drink',
  엔요주스: 'Enyo Yogurt Drink',
  연유주스: 'Sweetened Milk Drink',
  바나나: 'Banana',
  과일: 'Fresh Fruit',
};

/** Collapses runs of whitespace; the readable key used for the primary match. */
function normalize(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * Drops whitespace entirely. Korean spacing between a modifier and its noun is
 * genuinely optional, and the 식단표 uses both — `떠먹는 요거트` one week and
 * `떠먹는요거트` the next. Collapsing runs of spaces does not make those equal,
 * so the fallback lookup removes spacing altogether.
 */
function despace(name: string): string {
  return name.replace(/\s+/g, '');
}

/** Lookup keyed on the normalised name, built once. */
const BY_NORMALIZED = new Map<string, string>(
  Object.entries(DISH_EN).map(([korean, english]) => [normalize(korean), english]),
);

/** Spacing-insensitive fallback. First entry wins on a collision. */
const BY_DESPACED = new Map<string, string>();
Object.entries(DISH_EN).forEach(([korean, english]) => {
  const key = despace(korean);
  if (!BY_DESPACED.has(key)) BY_DESPACED.set(key, english);
});

/** The separators the 식단표 uses to join two dishes into one line. */
const SEPARATORS = [' & ', ' / '] as const;

/**
 * The English name for a dish, or `null` when there is no translation.
 *
 * Returning `null` rather than echoing the Korean lets the caller render
 * nothing at all, which is honest: a wrong or missing translation should not
 * look like a real one.
 */
export function englishDishName(name: string): string | null {
  const key = normalize(name);
  const direct = BY_NORMALIZED.get(key) ?? BY_DESPACED.get(despace(name));
  if (direct) return direct;

  // A combined line ("가지탕수 & 칠리소스") that is not itself an entry can
  // still resolve if every part does, so a new pairing of known dishes does
  // not need its own row here.
  for (const separator of SEPARATORS) {
    if (!key.includes(separator)) continue;
    const parts = key
      .split(separator)
      .map((part) => BY_NORMALIZED.get(part.trim()) ?? BY_DESPACED.get(despace(part)));
    if (parts.every((part): part is string => Boolean(part))) {
      return parts.join(separator === ' & ' ? ' & ' : ' / ');
    }
  }

  return null;
}
