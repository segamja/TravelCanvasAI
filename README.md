# TravelCanvasAI

여행 사진을 업로드하면 AI가 사진 속 여행을 이해하고, 흩어진 기억을 하나의 여행 이야기로 만들어 주는 웹앱입니다. 앱 버전은 **0.5.2**입니다. 기획과 현재 구현의 기준은 [`docs/TravelCanvasAI_프로젝트_개발명세서_V1.1.md`](docs/TravelCanvasAI_프로젝트_개발명세서_V1.1.md)이고, 한 장 카드의 기준은 [`docs/AI Story Card.md`](docs/AI%20Story%20Card.md)입니다.

## 기술 스택

- **Frontend**: Next.js (App Router) + TypeScript, Tailwind CSS v4, Lucide React
- **AI**: OpenAI API. 서버 Route Handler에서만 호출한다. 사진 분석(Vision, 8장씩) → Scene → Story 순이다. Story Card는 이미 만든 스토리의 구성만 판단하고, 포토북은 모델을 다시 호출하지 않는다.
- **외부 이미지**: Unsplash API. 전체 화면 배경, 장소 영감, 포토북 배경. 사용자 여행 사진을 대체하지 않으며 attribution을 표시한다.
- **저장소**: 서버 DB 없음. 사진은 브라우저 IndexedDB(긴 변 1600px JPEG), 프로젝트·Scene·Story·Story Card·포토북 메타데이터는 LocalStorage.

한 여행은 최대 50장이다. 촬영일은 EXIF를 우선하고, 없으면 파일 이름의 날짜로 묶어 시각과 함께 보여 준다. GPS 좌표는 있을 때만 저장하고, 도시명으로 바꾸지는 않는다. 중복 사진 제거, PDF, 인쇄 주문은 없다.

분석이 시작되면 긴 변 1024px JPEG가 서버를 거쳐 OpenAI로 간다. 그 뒤 단계와 앨범은 사진 파일을 다시 보내지 않는다. 홈의 “서버 저장 없이 브라우저에만 저장돼요”는 보관 위치를 말한다.

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

두 키가 없어도 앱은 실행되며 사진 업로드와 로컬 저장까지는 동작합니다. AI 분석·Scene·Story·제목 추천·Unsplash를 부르는 시점에 키가 필요합니다. 키가 없으면 안내 메시지가 나옵니다. Story Card는 키가 없으면 이미 만든 스토리와 사진 정보만으로 카드를 구성합니다. 포토북은 키 없이 만들 수 있고, 배경 사진만 Unsplash 키가 있을 때 채워집니다.

## 스토리 이후

완성된 스토리 화면에서 두 가지를 만들 수 있습니다.

- **AI Story Card**: 제목, 대표 사진, 핵심 문장, 알려진 날짜·장소를 한 장으로 만듭니다. 이 브라우저에 저장하고, PNG로 받거나 공유할 수 있습니다.
- **포토북**: 표지, 촬영일별 페이지, 마지막 페이지입니다. 제목, 포함할 날짜, 밀도(4장 또는 2장), 판형을 고릅니다. 페이지를 넘기고, 이 브라우저에 저장하고, 보고 있는 페이지를 PNG로 받습니다.

## 버전

`package.json`의 버전이 상단 로고, 홈의 “현재 버전”, 하단, 화면 왼쪽 아래에 표시됩니다. 열린 페이지는 `/api/version`을 확인해, 배포된 버전이 더 새로우면 한 번 새로고침합니다.

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드 결과 실행
- `npm run lint` — ESLint

## 프로젝트 구조

```
app/            페이지 및 API Route Handler
components/     화면 단위(step), Story Card, 포토북, 레이아웃
services/       OpenAI/Unsplash 서버 전용 클라이언트
storage/        LocalStorage/IndexedDB 저장소 추상화 (UI는 이 계층을 통해서만 접근)
types/          공통 TypeScript 타입
lib/            유틸리티, 상수, EXIF, 날짜 분류, 카드/앨범 렌더, React 훅
```

## 배포

`main`에 push하면 Vercel 프로젝트 `careeredu/travel-canvas-ai`가 프로덕션을 배포합니다. 주소는 [https://travel-canvas-ai.vercel.app](https://travel-canvas-ai.vercel.app) 입니다. `OPENAI_API_KEY`와 `UNSPLASH_ACCESS_KEY`는 Vercel 환경 변수에 등록합니다. 배포 보호가 켜져 있으면 로그인 후에 사이트가 열립니다.
