# 서버 연결 (Firebase) — 1회 설정

앱 코드는 이미 전부 준비돼 있습니다. 아래는 **콘솔 클릭과 값 복사만** 하면 되는
1회 작업이고, 다 끝내면 "서버 연결 후 열려요"라고 막혀 있던 화면들이 열립니다.

소요 시간 약 15분. 순서대로 하세요.

---

## 1. 프로젝트 만들기

<https://console.firebase.google.com> → **프로젝트 추가** → 이름 아무거나 (예: `vis-meal`)
→ Google 애널리틱스는 **사용 안 함**으로 두면 됩니다.

## 2. 로그인 방법 켜기

**Authentication** → **시작하기** → **Sign-in method** 탭에서 두 개를 사용 설정:

- **이메일/비밀번호**
- **Google** — 프로젝트 지원 이메일만 고르면 끝

### 구글 계정을 학교 도메인으로 제한하기

Firebase의 Google 제공업체는 그 자체로 도메인을 막지 못합니다. 제한은 두 겹입니다:

1. **앱** — `signInWithGoogle()`이 `hd=valorschool.org`를 넘겨 구글 계정 선택창이
   학교 계정을 먼저 보여주고, 다른 도메인으로 들어오면 즉시 로그아웃시킵니다.
   (`src/context/AuthContext.tsx`)
2. **서버** — `firestore.rules`의 `schoolMember()`가 `@valorschool.org` 이메일이
   아닌 요청의 쓰기를 전부 거부합니다. **이쪽이 실제 차단입니다.**

1번만 있으면 우회할 수 있으므로 6번(규칙 배포)을 반드시 하세요.

## 3. 승인된 도메인 등록

**Authentication → Settings → 승인된 도메인** → 배포 주소 추가
(예: `vis-meal.vercel.app`). `localhost`는 이미 들어 있습니다.

> 빠뜨리면 구글 로그인이 `auth/unauthorized-domain`으로 실패합니다.
> 앱은 이 경우 "이 주소는 로그인 허용 목록에 없어요"라고 안내합니다.

## 4. Firestore 만들기

**Firestore Database** → **데이터베이스 만들기** →
위치는 **`asia-northeast3` (서울)** → 규칙은 아무거나 골라도 됩니다
(6번에서 이 저장소의 `firestore.rules`로 덮어씁니다).

## 5. 설정값 6개 복사

**⚙️ 프로젝트 설정 → 내 앱 → 웹 앱 추가**(`</>` 아이콘) → 이름 아무거나,
호스팅 설정은 체크하지 않음 → 나오는 `firebaseConfig` 값 6개를 옮깁니다.

로컬:

```bash
cp .env.example .env
# .env 를 열어 6줄을 채운 뒤
npx expo start -c        # -c 필수: 환경변수는 번들 타임에 인라인됩니다
```

Vercel: **Settings → Environment Variables**에 같은 6개를 등록하고 **재배포**.
`EXPO_PUBLIC_*`는 빌드할 때 코드에 박히는 값이라, 등록만 하고 재배포하지 않으면
바뀌지 않습니다.

이 여섯 개가 **환경변수의 전부입니다.** 다른 비밀값은 없습니다.

| .env / Vercel 키 | firebaseConfig 필드 | 필수 |
| --- | --- | --- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` | ✅ |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | ✅ |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | ✅ |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` | ✅ |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` | 선택 |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | 선택 |

Vercel에서는 **Production / Preview / Development 세 환경 모두** 체크하세요.

> `EXPO_PUBLIC_*` 값은 번들에 그대로 박히고 브라우저에서 읽을 수 있습니다.
> 이는 Firebase 웹 앱의 정상 동작입니다 — `apiKey`는 비밀번호가 아니라 프로젝트
> 식별자이고, 실제 접근 통제는 전부 `firestore.rules`가 합니다. 그래서 6번을
> 건너뛰면 안 됩니다.
>
> `.env`는 `.gitignore`에 있으므로 커밋되지 않습니다.

## 6. 보안 규칙 · 인덱스 배포

```bash
npx firebase login
npx firebase use --add          # 1번에서 만든 프로젝트 선택
npx firebase deploy --only firestore:rules,firestore:indexes
```

이걸 해야 `firestore.rules`의 도메인 제한(`schoolMember()`)과, 실시간 피드가
쓰는 복합 색인이 적용됩니다. **건너뛰면 제보·평가가 `permission-denied`로
실패하거나 목록이 비어 보입니다.**

---

## 확인

1. 웹에서 **학교 구글 계정으로 계속하기** → 로그인되면 성공
2. 개인 gmail 계정으로 시도 → "학교 계정(@valorschool.org)으로만 가입할 수
   있어요"가 뜨면 도메인 제한이 살아 있는 것
3. 급식실 현황 탭에서 별점 남기기 → 로그아웃해도 점수와 후기가 그대로 보이면
   공개 읽기가 동작하는 것
4. 구글 계정으로 로그인했다면 후기·제보 옆에 프로필 사진이 뜨는지 확인
   (이메일 계정은 이모지 아바타로 남습니다)
5. 같은 급식에 두 번 평가 → 새 평가가 추가되지 않고 기존 평가가 수정되면
   1인 1표가 동작하는 것

## 알아둘 것

- **급식표는 서버와 무관합니다.** `src/config/school.ts`에 번들돼 있어 로그인
  없이도, 오프라인에서도 뜹니다. 예상 혼잡도(`src/config/lunchRush.ts`)도 같습니다.
- **읽기는 공개, 쓰기는 로그인.** 로그인하지 않은 학생도 오늘 점수·후기·지난
  순위를 볼 수 있고, 남기려 할 때만 로그인 화면으로 갑니다.
- **도메인을 바꾸려면 두 곳을 함께** 고쳐야 합니다 —
  `src/config/school.ts`의 `APP_SCHOOL_EMAIL_DOMAIN`과 `firestore.rules`의
  `schoolMember()`. 앞쪽은 안내 문구용이고, 실제 차단은 뒤쪽이 합니다.
- **구글 로그인은 웹 전용**입니다. 네이티브 앱에서는 버튼이 숨겨지고 이메일
  로그인만 보입니다 (팝업 플로우가 없어서 — `expo-auth-session`을 붙이면 열립니다).
- 새 달 식단표는 빌드 없이 Firestore `menus` 컬렉션에 넣으면 반영됩니다
  (`menus/{schoolKey}_{YYYYMMDD}`, `src/services/menus.ts` 참고).

---

## `vercel.json` — 왜 이렇게 생겼나

Vercel 설정 스키마는 주석용 `"//"` 키를 거부하므로(`should NOT have additional
property "//"`) 설명을 여기에 옮겨 둡니다. 두 줄 다 지우면 안 되는 이유가
있습니다.

**`rewrites`의 정규식** — SPA 폴백은 **앱 경로에만** 걸려야 합니다. 실제 에셋
경로까지 삼키면, 배포 도중처럼 파일이 잠깐 없는 순간에 엣지가 `.js` 요청에
`index.html`을 돌려주고, 아래 immutable 헤더가 그 HTML을 방문자 브라우저에
**1년치로 못 박아** 빈 화면이 됩니다. 그래서 `_expo/`·`assets/` 아래와 확장자가
있는 경로를 제외해, 없는 에셋은 그냥 404가 나게 합니다.

**`/index.html`의 `must-revalidate`** — 현재 번들 이름을 아는 건 이 셸 문서
하나뿐이라, 매 로드마다 재검증해야 새 배포가 반영됩니다.

**빌드 캐시 주의** — `EXPO_PUBLIC_*`는 번들 타임에 인라인되는데, Metro 캐시가
살아 있으면 환경변수를 바꿔도 **예전 값이 그대로 남은 번들이 나옵니다.** 그래서
`vercel.json`의 빌드 명령에 `--clear`가 붙어 있습니다. 로컬에서도 값을 바꾼 뒤에는
`npx expo start -c` 또는 `npx expo export --platform web --clear`를 쓰세요.

**Vercel 환경변수는 반드시 `Config` 타입으로** — `EXPO_PUBLIC_*`처럼 공개 프레임워크
접두사가 붙은 변수를 `Secret`으로 만들면 Vercel이 빌드에 값을 **아예 넘기지 않습니다.**
(`Environment variables with a public framework prefix cannot use visibility: secret`)

대시보드에는 6개가 멀쩡히 등록된 것처럼 보이는데 배포된 앱은 계속 "이 기기에만 저장"
상태로 남는, 알아채기 어려운 실패입니다. `Secret`은 쓰기 전용이라 타입 변경이 안 되니
**지우고 `Config`로 다시 만들어야** 합니다. 실제로 2026-09-06에 이 문제로 하루치를
날렸습니다.

값이 제대로 들어갔는지는 배포된 번들에서 직접 확인하는 게 가장 확실합니다:

```bash
B=$(curl -s https://campus-bites-omega.vercel.app/ \
  | grep -oE '/_expo/static/js/web/index-[a-f0-9]+\.js')
curl -s "https://campus-bites-omega.vercel.app$B" | grep -c "$(grep API_KEY .env | cut -d= -f2)"
# 1 이면 인라인 성공, 0 이면 빌드에 값이 안 넘어간 것
```

---

# 메뉴 사진 (AI 생성)

메뉴 한 줄마다 붙는 음식 사진은 앱에 들어 있지 않다. `src/utils/foodImage.ts`
가 메뉴의 영어 이름(`dishEnglish.ts`)과 **고정된 스타일 문구 한 개**로 이미지
URL을 만들고, 그 URL이 사진을 그려서 돌려준다. 그래서

- 스타일이 전부 같다 — 흰 접시, 위에서 내려다본 각도, 같은 조명.
- 메뉴 이름에서 뽑은 seed를 쓰므로 **같은 메뉴는 항상 같은 사진**이다.
- 식단표에 처음 보는 메뉴가 올라와도 사진이 알아서 생긴다. 관리할 이미지 파일이
  없다.

## 새 식단표를 넣은 뒤에 할 일

```bash
node scripts/warm-dish-images.mjs
```

한 번도 요청된 적 없는 사진은 **그리는 데 20~40초**가 걸리고, 그리는 중에는
요청이 거절된다(HTTP 429). 반면 이미 그려진 사진은 캐시에서 1초 안에 오고 절대
거절되지 않는다. 이 스크립트는 식단표에 있는 모든 메뉴를 미리 한 번씩 그려 두어서
그 대기를 학생이 아니라 배포 때 치르게 한다. 오래 걸리니(수십 분~몇 시간) 켜 두고
다른 일을 하면 된다. 여러 번 돌려도 안전하다 — 이미 그려진 건 그냥 캐시 히트다.

돌리지 않아도 앱은 깨지지 않는다. 사진이 없는 자리는 음식 이모지가 대신 잡고
있다가, 사진이 도착하면 위로 부드럽게 덮인다(`DishImage`). 거절당하면 몇 초 뒤
스스로 다시 시도한다.
