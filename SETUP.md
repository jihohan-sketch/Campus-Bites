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

| .env 키 | firebaseConfig 필드 |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |

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
