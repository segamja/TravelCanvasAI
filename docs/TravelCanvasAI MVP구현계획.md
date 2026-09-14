Ready for review
Select text to add comments on the plan
TravelCanvasAI MVP 구현 계획
Context
docs/TravelCanvasAI_프로젝트_개발명세서_V1.1.md에 정의된 MVP를 처음부터 구현한다. 현재 프로젝트 디렉터리(D:\AI_Project\seoul-ict\TravelCanvasAI)에는 docs/ 외에 코드가 전혀 없는 완전 신규(greenfield) 상태이며 git 저장소도 아니다. 명세서는 폴더 구조(§29), 데이터 모델(§30), AI 파이프라인(§22, §31), 화면 목록(§34), 8단계 개발 우선순위(§38)를 매우 구체적으로 지정하고 있으므로, 이 계획은 명세서를 최대한 그대로 따르는 실행 순서를 정리한다.

사용자는 OpenAI/Unsplash API 키를 곧 제공할 예정이므로, 실제 API를 호출하는 구조로 만들되 키가 아직 없어도 앱이 죽지 않고 사용자 친화적 오류를 보여주도록 만든다. GitHub push / Vercel 배포는 사용자의 계정이 필요한 영역이라 이번 세션 범위에서는 제외하고, 로컬 git 저장소 초기화 + 로컬 개발 서버에서 전체 흐름이 동작하는 것까지를 목표로 한다.

기술 스택 (명세서 §19-22, §41 그대로 채택)
Next.js (App Router) + TypeScript, Tailwind CSS, Lucide React
상태관리: React Hooks + Context API (Redux/Zustand 미사용)
AI: OpenAI SDK (Vision + Structured Output + Text Generation), 서버 Route Handler 경유
외부 이미지: Unsplash API, 서버 Route Handler 경유
저장소: IndexedDB(사진), LocalStorage(프로젝트 메타데이터/Scene/Story)
패키지 매니저: npm (Node v24, npm v11 설치 확인됨)
EXIF 파싱용 경량 라이브러리 exifr 추가 (촬영일시/GPS를 AI 추측이 아닌 실제 메타데이터로 우선 사용하기 위함, §7.2 요구사항)
프로젝트 구조 (명세서 §29 그대로)
app/
  page.tsx                      # Home
  travel/new/page.tsx           # 새 프로젝트 생성 진입점 (projectId 생성 후 /travel/[id]로 이동)
  travel/[id]/page.tsx          # 프로젝트 작업 화면: project.status에 따라 업로드→분석→Scene→질문→Story생성→ StoryView/Edit 단계를 렌더링
  api/analyze/route.ts
  api/scenes/route.ts           # 명세 §23 예시엔 없지만 "예:"(예시)로 명시된 목록이라 단계형 파이프라인(§22,§35)을 지키기 위해 추가
  api/generate-story/route.ts
  api/unsplash/route.ts
components/
  travel/{TravelCard,TravelList,TravelHeader,TravelInfoForm}.tsx
  photo/{PhotoUploader,PhotoGrid,PhotoCard}.tsx
  analysis/AnalysisProgress.tsx
  scene/{SceneCard,SceneEditor}.tsx
  memory/MemoryQuestionCard.tsx   # 명세에 없지만 §12 기억 질문 UI에 필요해서 추가
  story/{StoryEditor,StoryViewer}.tsx
  ui/ (공용 Button/ConfirmDialog/ErrorBanner 등 최소 컴포넌트)
services/
  openai.ts     # 서버 전용: analyzePhotos(), generateScenes(), generateStory()
  unsplash.ts   # 서버 전용: searchPhotos()
storage/
  indexedDB.ts      # 저수준 IndexedDB wrapper (사진 blob put/get/delete)
  localStorage.ts   # 저수준 localStorage JSON wrapper
  photoStorage.ts   # photoStorage.savePhoto/getPhoto/deletePhoto/listByProject (indexedDB 사용)
  travelStorage.ts  # travelStorage.createProject/getProject/listProjects/updateProject/deleteProject/saveScenes/saveStory (localStorage 사용)
types/
  travel.ts   # TravelProject, ProjectStatus
  photo.ts    # Photo, PhotoAnalysis
  scene.ts    # TravelScene, MemoryQuestion
  story.ts    # TravelStory, StoryChapter
lib/
  utils.ts        # id 생성, 이미지 리사이즈/압축(canvas), 날짜 포맷
  exif.ts          # EXIF에서 capturedAt/GPS 추출 (exifr 사용)
  constants.ts     # MAX_PHOTOS(30~50), SUPPORTED_FORMATS, 기억질문 기본 선택지
UI는 절대 localStorage/IndexedDB를 직접 호출하지 않고 storage/*를 통해서만 접근한다 (§28 핵심 원칙).

핵심 데이터 모델 (명세 §15.4, §30 + 보강)
TravelProject: id, title, startDate?, endDate?, coverPhotoId?, photoIds[], scenes[], story?, status(draft|photos-uploaded|analyzing|scenes-ready|questions-pending|generating|completed), createdAt, updatedAt
Photo, PhotoAnalysis: 명세 §30 그대로
TravelScene: 명세 §30 그대로
MemoryQuestion (신규 보강 타입): id, sceneId, question, options(string[] + "직접 입력"), answer?, isCustomAnswer?
TravelStory, StoryChapter: 명세 §30 그대로
AI 파이프라인 (3단계, §22/§35의 "사진별 분석 → Scene 단위 처리 → 전체 Story 처리"에 대응)
POST /api/analyze — 업로드된 사진(리사이즈된 base64) 배치를 받아 OpenAI Vision + Structured Output으로 PhotoAnalysis[] 반환. EXIF에서 얻은 capturedAt/GPS가 있으면 그대로 우선 사용하고 AI에게는 확정하지 말라고 프롬프트에 명시.
POST /api/scenes — PhotoAnalysis[]를 받아 시간/장소/내용 기준으로 그룹화한 TravelScene[]과, confidence가 낮거나 importance가 높은 장면에 대한 MemoryQuestion[] 후보를 한 번의 호출로 함께 생성 (중복 AI 호출 최소화, §35).
POST /api/generate-story — project 정보 + scenes + memory 답변을 받아 TravelStory(제목/부제/Chapter[])를 생성. 허구 사건 생성 금지, 사용자 답변 우선 반영 원칙을 프롬프트에 명시 (§32).
POST /api/unsplash는 AI 호출이 아닌 단순 중계로, 키워드로 보조 이미지를 검색해 반환.

모든 프롬프트는 §32 원칙(관찰 가능한 정보 중심, 불확실하면 confidence 낮춤, JSON 구조 준수, 허구 금지)을 시스템 프롬프트에 반영한다.

화면/흐름 (명세 §33, §34)
app/travel/[id]/page.tsx 하나가 project.status를 기준으로 단계별 컴포넌트를 렌더링하는 방식으로 구현 (별도 라우트를 늘리지 않고 진행 상태를 프로젝트에 저장해 새로고침 후에도 이어서 작업 가능하게 함, §5.4 요구사항과 직결):

Home (app/page.tsx): 소개, 프로젝트 목록(TravelList/TravelCard), 새 여행 시작 버튼
여행 기본 정보 입력 (TravelInfoForm) → 프로젝트 생성 직후 저장
사진 업로드/미리보기 (PhotoUploader/PhotoGrid, 다중 업로드, Drag&Drop, 30~50장 권장 제한)
AI 분석 진행 화면 (AnalysisProgress, 실제 진행 단계와 표시 동기화)
Scene 검토/수정 (SceneCard/SceneEditor)
기억 질문 (MemoryQuestionCard, 답변 없이도 다음 단계 진행 가능)
Story 생성 진행 표시
Story View (StoryViewer, Editorial 세로 스크롤 레이아웃, 모바일 우선)
Story Edit (StoryEditor, 제목/Chapter/본문/사진 순서 수정 + 프로젝트 저장/삭제)
저장/보안
사진은 IndexedDB에만 저장, 메타데이터/Scene/Story는 LocalStorage(JSON, projectId 기준 분리)
OpenAI/Unsplash 키는 .env.local(.gitignore 처리)에서만 읽고 Route Handler 내부에서만 사용, 클라이언트 번들에 노출 금지
파일 타입(JPG/JPEG/PNG/WEBP)·크기 검증, 업로드 시 canvas 리사이즈로 AI 전송 payload 최소화
API 실패/네트워크 오류/JSON 파싱 실패 시 기술 메시지 대신 사용자 친화적 메시지 표시
실행 순서 (명세 §38의 8단계 우선순위를 그대로 따름)
create-next-app으로 Next.js+TS+Tailwind+ESLint(App Router) 뼈대 생성 후 §29 폴더 구조로 정리, exifr/openai 패키지 설치, .env.local/.env.example/.gitignore 구성, git init + 최초 커밋
타입(types/) + storage 계층(IndexedDB/LocalStorage wrapper + photoStorage/travelStorage) + Home 화면 + 새 프로젝트 생성/사진 업로드/미리보기
services/openai.ts + /api/analyze + 분석 진행 화면 연동
/api/scenes + Scene 검토/수정 화면
기억 질문 화면 + /api/generate-story + Story 편집
Story View Editorial UI
services/unsplash.ts + /api/unsplash 연동 (대표 이미지 후보, 보조 이미지)
전체 흐름 로컬 검증 (npm run dev로 업로드→분석→Scene→질문→Story생성→저장→재진입→편집→삭제 시나리오 수동 확인), npm run build로 빌드 오류 확인
검증 방법
npm run dev로 개발 서버 구동 후 브라우저에서 전체 사용자 흐름(§2.1, §33)을 실제로 수행: 사진 업로드 → 분석 → Scene 확인 → 기억 질문 → Story 생성 → Story 감상/수정 → 홈에서 프로젝트 재진입/삭제
API 키가 아직 없다면 각 API 실패 시 사용자 친화적 에러가 표시되는지 확인하고, 키를 받으면 실제 OpenAI/Unsplash 응답으로 재검증
npm run build 및 npx tsc --noEmit으로 타입/빌드 오류 확인
GitHub push / Vercel 배포는 이번 세션에서 수행하지 않고, 로컬 git 커밋 상태까지만 진행 (필요 시 이후 별도 요청으로 진행)