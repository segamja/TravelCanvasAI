# TravelCanvasAI

여행 사진을 업로드하면 AI가 사진 속 여행을 이해하고, 흩어진 기억을 하나의 아름다운 여행 이야기로 만들어주는 웹앱입니다. 자세한 기획/기술 명세는 [`docs/TravelCanvasAI_프로젝트_개발명세서_V1.1.md`](docs/TravelCanvasAI_프로젝트_개발명세서_V1.1.md)를 참고하세요.

## 기술 스택

- **Frontend**: Next.js (App Router) + TypeScript, Tailwind CSS v4, Lucide React
- **AI**: OpenAI API (Vision + Structured Output + Text Generation), 3단계 파이프라인(사진 분석 → Scene 구성 → Story 생성)으로 서버 Route Handler에서만 호출. 스토리 완성 후 AI Story Card는 같은 서버 경로에서 카드 구성만 판단합니다.
- **외부 이미지**: Unsplash API (보조 이미지 전용)
- **저장소**: 서버 DB 없음 — 사진은 브라우저 IndexedDB, 프로젝트/Scene/Story 메타데이터는 LocalStorage

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 키를 채워주세요
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

### 환경 변수 (`.env.local`)

```
OPENAI_API_KEY=
UNSPLASH_ACCESS_KEY=
```

두 키가 없어도 앱은 실행되며 사진 업로드/저장까지는 정상 동작합니다. AI 분석·Scene 구성·Story 생성·Unsplash 검색을 호출하는 시점에만 키가 필요하며, 키가 없으면 사용자에게 안내 메시지가 표시됩니다. Story Card는 키가 없으면 이미 만든 스토리와 사진 정보만으로 카드를 구성합니다.

## AI Story Card

스토리 화면의 **AI Story Card 만들기**는 여행 제목, 대표 사진, 핵심 문장, 날짜·장소를 한 장의 카드로 만듭니다. 날짜와 장소는 프로젝트와 사진에 있는 값만 쓰고, 결과는 이 브라우저에 저장하거나 PNG로 받을 수 있습니다. 앨범, PDF, 계정, 서버 DB는 이 기능에 포함하지 않습니다.

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드 결과 실행
- `npm run lint` — ESLint

## 프로젝트 구조

```
app/            페이지 및 API Route Handler
components/     화면 단위(step)와 재사용 UI 컴포넌트
services/       OpenAI/Unsplash 서버 전용 클라이언트
storage/        LocalStorage/IndexedDB 저장소 추상화 (UI는 이 계층을 통해서만 접근)
types/          공통 TypeScript 타입
lib/            유틸리티, 상수, EXIF 파싱, React 훅
```

## 배포

GitHub 저장소에 push한 뒤 Vercel에 연결하고, `OPENAI_API_KEY`/`UNSPLASH_ACCESS_KEY`를 Vercel 프로젝트 환경 변수에 등록하면 됩니다.
