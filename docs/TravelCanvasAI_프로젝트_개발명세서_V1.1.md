# TravelCanvasAI 웹앱 프로젝트 개발 명세서

-   문서 버전: V1.1 (앱 구현 반영: v0.5.3)
-   프로젝트 유형: AI 기반 여행 사진 스토리텔링 웹앱
-   개발 범위: 8시간 수업용 MVP + 스토리 이후의 Story Card·포토북
-   핵심 방향: Local-first + Serverless + AI Storytelling
-   데이터베이스: 서버 DB 미사용. 사진은 브라우저 IndexedDB, 메타데이터는 LocalStorage
-   외부 API: OpenAI API, Unsplash API
-   배포: GitHub `segamja/TravelCanvasAI`의 `main` push가 Vercel 프로젝트 `travel-canvas-ai`로 자동 배포
-   프로덕션: https://travel-canvas-ai.vercel.app
-   앱 버전: `package.json`의 `version`. 화면 상단, 홈, 하단, 왼쪽 아래 고정 표시. `/api/version`과 다르면 한 번 새로고침

## 현재 구현에서 확정된 동작

아래는 코드에 들어가 있는 동작이다. 이 문서의 나머지 절이 초안과 다르면 이 목록을 따른다.

-   한 여행의 사진은 최대 50장이다. 한 번에 더 많이 고르면 선택 순서의 앞 50장만 저장하고 나머지는 버린다. 용량·형식 오류만 건너뜀 메시지로 알린다.
-   같은 파일을 걸러 내는 중복 제거는 없다.
-   촬영 시각은 EXIF `DateTimeOriginal`/`CreateDate`를 쓰고, 없으면 `YYYYMMDD_HHMMSS` 형태 파일 이름을 쓴다. 둘 다 없으면 "날짜 없음"이다. 사진 목록, 장면, 스토리, 앨범은 이 날짜로 묶고 시각을 보여 준다.
-   GPS가 파일에 있으면 위도·경도를 저장하고 분석 요청에 좌표 문자열로 함께 보낸다. 좌표를 시·구 지명으로 바꾸는 단계는 없다. 화면에 나오는 장소 이름은 AI가 사진을 보고 적은 문자열이다.
-   저장 이미지는 긴 변 1600px JPEG다. 분석에 보내는 이미지는 긴 변 1024px JPEG이며, 서버가 8장씩 OpenAI에 전달한다. 장면·스토리·스토리 카드·앨범은 사진 파일을 다시 보내지 않는다.
-   스토리가 끝나면 AI Story Card(한 장)와 날짜별 포토북을 만들 수 있다. 포토북은 추가 OpenAI 호출 없이, 이미 있는 사진과 스토리 문장만으로 구성한다. PDF와 인쇄 주문은 없다.
-   Unsplash는 화면 배경과 포토북 배경으로만 쓰고, 사용자 여행 사진을 대체하지 않는다. 작가 attribution을 표시한다.

------------------------------------------------------------------------

# 1. 프로젝트 개요

## 1.1 서비스명

가칭: **TravelCanvasAI**

## 1.2 서비스 한 줄 정의

> 여행 사진을 업로드하면 AI가 사진 속 여행을 이해하고, 흩어진 기억을
> 하나의 아름다운 여행 이야기로 만들어주는 웹앱

## 1.3 핵심 가치

단순히 사진을 저장하거나 시간순으로 정리하는 여행 다이어리 서비스가
아니다.

핵심 경험은 다음과 같다.

**사진 → 여행의 장면 → 기억 → 이야기**

사용자가 여행 후 사진을 한꺼번에 업로드하면 AI가 사진의 시간, 장소,
내용, 분위기 등을 분석하고 여러 사진을 의미 있는 여행 장면(Scene)으로
재구성한다. 이후 사용자의 기억이 필요한 부분만 질문하고, 그 결과를
반영하여 하나의 여행 Story를 생성한다.

## 1.4 서비스 포지셔닝

### 기존 서비스

-   Polarsteps: 여행 경로와 기록
-   Journi: 사진 기반 여행 앨범
-   FindPenguins: 이동 경로와 여행 기록
-   Steller: 감각적인 사진 스토리
-   Day One: 개인 기억과 기록

### 제안 서비스

> **여행을 기록하는 앱이 아니라, 여행을 기억하고 이야기로 만들어주는
> AI**

핵심 차별화는 AI가 단순히 사진을 설명하거나 사진을 시간순으로 배열하는
것이 아니라 **사진 사이의 관계와 여행의 흐름을 이해하여 이야기를
구성하는 것**이다.

------------------------------------------------------------------------

# 2. 핵심 사용자 경험

## 2.1 전체 사용자 흐름

``` text
[홈]
  ↓
[새 여행 만들기]
  ↓
[여행 사진 일괄 업로드]
  ↓
[AI 사진 분석]
  ↓
[여행 장면(Scene) 자동 구성]
  ↓
[AI가 기억할 만한 순간 발견]
  ↓
[사용자에게 필요한 부분만 질문]
  ↓
[AI 여행 이야기 생성]
  ↓
[사용자 검토/수정]
  ↓
[감성적인 Travel Story 완성]
  ↓
[AI Story Card 한 장] 또는 [날짜별 포토북]
  ↓
[브라우저 로컬 저장]
  ↓
[나의 여행 목록에서 재감상]
```

## 2.2 핵심 사용자 경험 원칙

### 원칙 1. Zero Input

사용자가 여행기를 직접 작성하는 부담을 최소화한다.

> 사진을 올리는 것부터 시작한다.

### 원칙 2. AI가 먼저 이해한다

사용자에게 처음부터 날짜, 장소, 설명을 입력하도록 요구하지 않는다.

사진과 가능한 메타데이터를 먼저 분석한다.

### 원칙 3. 사진을 사건/장면으로 이해한다

사진을 단순한 이미지 목록으로 처리하지 않는다.

예:

``` text
공항 → 비행기 → 도착
= 여행의 시작

거리 → 비 → 우산 → 카페 → 커피
= 갑작스러운 비를 피해 발견한 카페
```

### 원칙 4. 확실하지 않은 기억은 질문한다

AI가 사실을 임의로 만들어내지 않도록, 불확실하거나 개인적인 의미가
필요한 부분은 사용자에게 질문한다.

### 원칙 5. 사진이 주인공이다

글보다 사용자 사진이 중심이 되는 감성적인 Editorial/Photo Story UI를
사용한다.

------------------------------------------------------------------------

# 3. MVP 목표

## 3.1 MVP에서 검증할 핵심 가설

> 사용자가 여행 사진을 한꺼번에 업로드했을 때, AI가 사진의 맥락을
> 이해하여 사용자가 직접 작성하는 것보다 쉽고 재미있는 여행 이야기를
> 만들어줄 수 있는가?

## 3.2 MVP 성공 기준

다음 시나리오가 완성되어야 한다.

1.  사용자가 여행 사진을 여러 장 업로드한다.
2.  AI가 사진을 분석한다.
3.  사진을 날짜/장소/내용을 기준으로 의미 있는 Scene으로 묶는다.
4.  AI가 여행의 주요 순간을 발견한다.
5.  필요한 경우 사용자에게 1\~2개의 기억 질문을 한다.
6.  AI가 사진 + 분석 결과 + 사용자 답변을 이용해 여행 이야기를 생성한다.
7.  사용자가 결과를 수정할 수 있다.
8.  완성된 여행기를 감성적인 Story 화면에서 감상할 수 있다.
9.  완성된 여행이 하나의 이야기 프로젝트로 브라우저에 저장된다.
10. 페이지를 새로 열어도 저장된 프로젝트를 다시 볼 수 있다.
11. 저장된 프로젝트를 편집하거나 삭제할 수 있다.
12. 새 프로젝트를 생성하면 기존 프로젝트와 독립적으로 동작한다.
13. Vercel에 배포된 웹앱에서 핵심 흐름이 동작한다.
14. 완성된 스토리를 한 장의 AI Story Card로 저장하고 PNG로 받을 수 있다.
15. 같은 스토리를 날짜별 포토북으로 넘기며 보고, 현재 페이지를 PNG로 받을 수 있다.

------------------------------------------------------------------------

# 4. MVP 기능 명세

## 4.1 홈 화면

### 목적

사용자가 기존 여행을 확인하고 새로운 여행을 시작한다.

### 기능

-   서비스 소개
-   새 여행 시작하기
-   저장된 이야기 프로젝트 목록
-   저장된 이야기 프로젝트 목록
-   이야기 프로젝트 카드 표시
-   여행 제목
-   여행 날짜
-   대표 이미지
-   이야기 프로젝트 삭제
-   이야기 프로젝트 열기
-   이야기 프로젝트 편집
-   현재 앱 버전 표시

### MVP 제외

-   로그인
-   사용자 계정
-   클라우드 동기화
-   친구/팔로우
-   좋아요
-   댓글

------------------------------------------------------------------------

# 5. 이야기 프로젝트 관리

## 5.1 프로젝트 기본 개념

TravelCanvasAI에서 **하나의 여행 = 하나의 이야기 프로젝트**로 관리한다.

이야기 프로젝트는 다음 데이터를 하나의 독립된 작업 단위로 묶는다.

``` text
이야기 프로젝트
 ├── 여행 정보
 ├── 사진
 ├── 사진 분석 결과
 ├── Scene
 ├── Memory 질문/답변
 ├── Travel Story
 ├── AI Story Card (선택)
 └── 포토북 (선택)
```

각 프로젝트는 고유한 `projectId`를 가지며, 모든 사진·분석·Scene·Memory·Story 데이터는 해당 `projectId`에 연결되어야 한다.

## 5.2 새 프로젝트 생성

사용자가 **「새 여행 시작하기」**를 선택하면 새로운 프로젝트를 생성한다.

``` text
홈
 ↓
[새 여행 시작하기]
 ↓
새 projectId 생성
 ↓
새 프로젝트 작업 화면
 ↓
사진 업로드
```

새 프로젝트를 생성해도 기존 프로젝트의 데이터는 변경되지 않는다.

## 5.3 프로젝트 독립성

서로 다른 프로젝트는 완전히 독립적으로 동작해야 한다.

``` text
Project A
 ├── 사진 A
 ├── 분석 A
 ├── Scene A
 └── Story A

Project B
 ├── 사진 B
 ├── 분석 B
 ├── Scene B
 └── Story B
```

Project B에서 사진을 업로드하거나 Story를 생성해도 Project A의 데이터에 영향을 주거나 섞이지 않아야 한다.

## 5.4 프로젝트 저장 및 재진입

이야기 생성이 완료되면 사진과 생성된 이야기를 포함한 전체 결과를 해당 프로젝트에 저장한다.

사진만 업로드했거나 AI 분석이 진행 중인 상태도 프로젝트로 저장하여 나중에 이어서 작업할 수 있어야 한다.

저장된 프로젝트는 홈 화면의 프로젝트 목록에서 다시 열 수 있어야 한다.

## 5.5 프로젝트 편집

사용자는 저장된 프로젝트를 다시 열어 다음 작업을 수행할 수 있어야 한다.

-   사진 추가/삭제
-   Scene 수정
-   Story 제목/본문 수정
-   사진 순서 변경
-   Chapter 순서 변경
-   필요 시 Story 다시 생성

## 5.6 프로젝트 삭제

사용자는 저장된 이야기 프로젝트를 삭제할 수 있어야 한다.

프로젝트 삭제 시 해당 프로젝트에 연결된 사진 및 분석 결과, Scene, Memory, Story 등 프로젝트 데이터도 함께 삭제한다.

삭제 전에는 확인 절차를 제공한다.

------------------------------------------------------------------------

# 7. 여행 생성

## 5.1 새 여행 시작하기

사용자가 **「새 여행 시작하기」**를 누르면 기존 여행 프로젝트와 독립된 새로운 **이야기 프로젝트(Travel Project)**를 생성한다.

하나의 여행은 하나의 이야기 프로젝트로 관리하며, 프로젝트마다 고유한 ID를 가진다.

프로젝트 생성 후 사진 업로드 → AI 분석 → Scene 구성 → 기억 질문 → Story 생성의 전체 과정은 해당 프로젝트에 귀속된다.

### 입력

-   여행 제목
-   여행 시작일
-   여행 종료일
-   대표 이미지

단, 입력을 최소화한다.

### AI 제목 추천

사진 분석 결과를 기반으로 AI가 여행 제목 후보를 생성할 수 있다.

예:

> 바람을 따라 걷다, 제주 4일

사용자는 AI 추천 제목을 사용하거나 직접 수정할 수 있다.

------------------------------------------------------------------------

# 7. 사진 업로드

## 6.1 핵심 기능

-   다중 사진 업로드
-   파일 선택
-   Drag & Drop
-   업로드 사진 미리보기
-   사진 삭제
-   추가 사진 업로드
-   업로드 개수 표시

### 지원 형식

-   JPG
-   JPEG
-   PNG
-   WEBP

### 장수와 처리

한 프로젝트는 최대 50장이다. 원본은 장당 20MB 이하, JPEG/PNG/WEBP만 받는다.
저장 전에 긴 변 1600px JPEG로 줄인다. 중복 사진은 제거하지 않는다.

촬영일이 있으면 날짜별로 묶어 보여 준다. 날짜는 EXIF를 우선하고, 없으면
파일 이름의 날짜를 쓴다. 앨범 페이지도 이 날짜 묶음을 따른다.

## 6.2 업로드 UX

``` text
┌──────────────────────────────┐
│                              │
│       📸 여행 사진을 올려주세요 │
│                              │
│   사진을 여러 장 선택하세요    │
│                              │
│       [사진 선택하기]         │
│                              │
└──────────────────────────────┘

        32장의 사진
```

------------------------------------------------------------------------

# 8. AI 사진 분석

## 7.1 분석 목적

AI는 각 사진을 단순히 설명하는 것이 아니라 여행 이야기 생성에 필요한
구조화된 정보를 추출한다.

## 7.2 사진 분석 항목

가능한 범위에서 다음 정보를 분석한다.

-   사진 설명
-   촬영 날짜/시간
-   GPS/위치 정보
-   국가
-   도시
-   장소/관광지
-   인물 존재 여부
-   주요 사물
-   음식
-   건물
-   풍경
-   교통수단
-   사진 속 텍스트
-   분위기
-   태그
-   이야기 중요도
-   장면 후보

촬영 시간과 GPS는 이미지 EXIF에 실제 정보가 있는 경우 우선 활용한다.
AI가 사진만 보고 촬영 시간이나 좌표를 확정해서는 안 된다.

현재 구현의 장소 이름은 다음처럼 정해진다.

-   EXIF GPS가 있으면 좌표를 사실로 모델에 전달한다.
-   좌표를 "시드니", "골드코스트" 같은 행정 지명으로 조회하지는 않는다.
-   화면에 보이는 장소 문자열은 모델이 사진(과 좌표 힌트)으로 적은 값이다.
    랜드마크가 뚜렷하지 않으면 나라 이름만 남을 수 있다.
-   GPS가 없는 사진에서는 도시명을 사실로 확정하지 않는다.

## 7.3 분석 결과 예시

``` json
{
  "photoId": "photo_001",
  "description": "바닷가에서 일몰을 바라보는 장면",
  "location": "제주도",
  "confidence": 0.82,
  "tags": ["바다", "일몰", "여행"],
  "mood": "peaceful",
  "importance": 0.91,
  "sceneCandidates": ["sunset", "beach"]
}
```

------------------------------------------------------------------------

# 9. AI 분석 진행 화면

분석 중에는 단순 Spinner가 아니라 AI가 여행을 이해하고 있다는 느낌을
제공한다.

예:

``` text
여행을 살펴보고 있어요.

✓ 사진을 분석하고 있습니다
✓ 장소를 확인하고 있습니다
✓ 여행의 순서를 정리하고 있습니다
● 기억할 만한 장면을 찾고 있습니다
○ 이야기를 구성하고 있습니다
```

### 주의

실제 처리 단계와 진행 상태가 일치하도록 구현한다. 실제로 수행하지 않는
작업을 진행률처럼 표시하지 않는다.

------------------------------------------------------------------------

# 10. 사진 → Scene 자동 구성

## 9.1 핵심 차별화 기능

MVP에서 가장 중요한 AI 기능 중 하나다.

AI가 개별 사진을 분석한 뒤 사진들을 시간, 위치, 내용, 인물, 사건적
연관성 등을 기준으로 의미 있는 Scene으로 묶는다.

## 9.2 예시

``` text
사진 1~8
공항 / 비행기 / 도착
→ ✈️ 여행의 시작

사진 9~22
호텔 / 거리 / 음식
→ 🍜 여행 첫날의 저녁

사진 23~41
관광지 / 비 / 우산 / 카페
→ ☔ 갑작스러운 비

사진 42~58
카페 / 커피 / 거리
→ ☕ 우연히 발견한 카페
```

## 9.3 Scene 데이터

``` ts
interface TravelScene {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  photoIds: string[];
  startTime?: string;
  endTime?: string;
  location?: string;
  confidence?: number;
}
```

## 9.4 Scene 편집

사용자가 다음을 수행할 수 있어야 한다.

-   Scene 제목 수정
-   Scene 설명 수정
-   사진 추가/삭제
-   Scene 순서 변경
-   Scene 삭제

------------------------------------------------------------------------

# 11. AI가 사진 사이의 이야기를 발견

## 10.1 핵심 개념

AI는 개별 사진의 설명을 넘어 여러 사진의 관계를 해석한다.

예:

``` text
거리
↓
비
↓
우산
↓
카페
↓
커피
```

단순 기록:

> 15:32 거리 / 15:48 비 / 16:02 카페

AI Story:

> 갑자기 비가 내리기 시작했다. 우산을 쓰고 걷다가 결국 작은 카페로
> 피신했다. 계획에 없던 곳이었지만 오히려 그날 여행에서 가장 기억에 남는
> 시간이 되었다.

단, 실제로 확인되지 않은 사건은 사실처럼 확정하지 않는다.

------------------------------------------------------------------------

# 12. AI 기억 질문

## 11.1 목적

사진만으로 알 수 없는 개인적인 의미를 사용자에게 확인한다.

## 11.2 질문 예시

> ☕ 이 카페에서 찍은 사진이 여러 장 있어요.\
> 이곳이 특별했던 이유가 있었나요?

선택지:

-   특별한 일이 있었다
-   음식이 맛있었다
-   분위기가 좋았다
-   그냥 잠시 쉬었다
-   잘 모르겠다
-   직접 입력

## 11.3 질문 원칙

-   필요한 경우에만 질문
-   여행 전체에서 1\~2개 정도의 핵심 질문부터 시작
-   답변하지 않아도 Story 생성 가능
-   질문에 대한 답변은 Story 생성의 근거로 활용
-   사용자의 실제 답변과 AI 추론 내용을 구분

------------------------------------------------------------------------

# 13. AI 여행 이야기 생성

## 12.1 입력 데이터

Story 생성 시 다음 정보를 결합한다.

-   여행 제목
-   여행 날짜
-   사진 분석 결과
-   Scene 목록
-   Scene별 대표 사진
-   장소 정보
-   시간 정보
-   사용자 기억 질문/답변

## 12.2 생성 결과

### 전체 여행 제목

예:

> 바람을 따라 걷다

### Chapter

예:

-   제주에 도착한 날
-   계획에 없던 오후
-   우연히 발견한 작은 카페
-   바다를 바라보던 저녁

### Chapter Story

각 Chapter의 사진과 연결되는 짧은 여행 이야기.

## 12.3 Story 작성 원칙

-   사진에서 확인 가능한 사실을 우선한다.
-   사용자 답변을 실제 기억으로 우선 반영한다.
-   AI가 추론한 내용은 사실처럼 단정하지 않는다.
-   과도하게 문학적인 표현을 사용하지 않는다.
-   사진을 설명하는 캡션 모음이 아니라 하나의 흐름을 만든다.
-   여행의 시작 → 전개 → 특별한 순간 → 마무리의 흐름을 고려한다.

------------------------------------------------------------------------

# 14. Story 편집

사용자가 AI 결과를 최종적으로 검토하고 수정할 수 있어야 한다.

## MVP 기능

-   제목 수정
-   Chapter 제목 수정
-   본문 수정
-   사진 삭제
-   사진 순서 변경
-   Chapter 순서 변경

복잡한 문서 편집기는 MVP에서 필요하지 않다.

------------------------------------------------------------------------

# 15. Story View

## 14.1 목적

서비스에서 가장 감성적인 화면이다.

사진이 중심이고 AI Story가 사진 사이를 연결한다.

예:

``` text
KYOTO

2026.05.03–05

천 개의 붉은 문을 지나

[HERO PHOTO]

Chapter 01

교토에 도착한 날

[PHOTO]

신칸센을 타고 교토에 도착했다...

[PHOTO]

Chapter 02

계획에 없던 오후

[PHOTO]

갑자기 비가 내리기 시작했다...
```

## 14.2 디자인 방향

-   큰 사진
-   충분한 여백
-   감성적인 Typography
-   Editorial 레이아웃
-   모바일 우선
-   최소한의 UI
-   사진과 이야기에 집중

완성된 스토리 화면에서 **AI Story Card 만들기**와 **앨범 만들기**로
이어진다. 챕터 사진도 촬영일별로 묶고 시각을 보여 준다.

## 14.3 AI Story Card

스토리를 한 장의 카드로 만든다. 자세한 구성은
[`AI Story Card.md`](AI%20Story%20Card.md)를 따른다.

-   대표 사진, 핵심 문장, 날짜, 장소, 키워드는 이미 있는 스토리와 사진
    정보 안에서만 고른다. 없는 장소나 날짜를 만들지 않는다.
-   키가 없으면 서버는 `missing_api_key`를 반환하고, 화면은 로컬 규칙으로
    카드를 구성한다.
-   다시 만들기, 이 브라우저에 저장, PNG 다운로드, 브라우저 공유를 제공한다.

## 14.4 날짜별 포토북

사진 덤프가 아니라 포토북 페이지다. OpenAI를 다시 호출하지 않는다.

-   표지, 촬영일별 본문, 마지막 페이지.
-   사용자 사진, 그 날짜와 겹치는 스토리 문장, 알려진 장면 장소, 촬영 시각.
-   폼에서 고르는 값은 제목, 포함할 날짜, 밀도(한 페이지 4장 또는 2장),
    판형(editorial, journal, cinematic, minimal)이다. 판형은 종이색과
    사진 테두리·그림자를 바꾼다. 날짜와 장소를 새로 입력하지 않는다.
-   페이지 안 사진 배치는 촬영 순서를 유지한 채 가로·세로를 본다. 가로
    사진은 한 줄을 모두 쓰고, 세로 사진은 두 장씩 나란히 둔다. 화면과
    PNG가 같은 규칙을 쓴다.
-   Unsplash 사진은 페이지 배경과 attribution만 담당한다. 검색어는 알려진
    장소, 없으면 태그 또는 분위기에서 만들고, 검색어 자체를 사실처럼
    보여 주지 않는다.
-   페이지를 넘기며 미리보고, 이 브라우저에 저장하고, 보고 있는 페이지만
    PNG로 받는다.
-   PDF, 인쇄 주문, 실물 책 발간은 포함하지 않는다.

------------------------------------------------------------------------

# 16. 로컬 데이터 저장

## 15.1 MVP 원칙

서버 DB를 사용하지 않는다.

사용자 데이터는 브라우저에 저장한다.

## 15.2 저장 구조

### IndexedDB

대용량 사용자 사진 저장.

``` text
IndexedDB
 ├── photo_001
 ├── photo_002
 ├── photo_003
 └── ...
```

### LocalStorage

작은 JSON 기반 메타데이터 저장.

여행 프로젝트 목록과 각 프로젝트의 메타데이터는 `projectId`를 기준으로 독립적으로 저장한다.

``` text
LocalStorage
 ├── travel project metadata
 ├── project별 Scene
 ├── project별 Story
 ├── project별 Story Card
 ├── project별 포토북
 └── settings
```

## 15.3 중요한 원칙

사진을 LocalStorage에 직접 대량 저장하지 않는다.

사진은 IndexedDB를 우선 사용한다.

## 15.4 데이터 구조

``` ts
interface TravelProject {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  coverPhotoId?: string;
  photoIds: string[];
  scenes: TravelScene[];
  memoryQuestions: MemoryQuestion[];
  story?: TravelStory;
  storyCard?: StoryCard;
  album?: TravelAlbum;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}
```

------------------------------------------------------------------------

# 17. Unsplash API

## 16.1 목적

Unsplash는 사용자 여행 사진을 대체하지 않는다.

**사용자 사진 = 핵심 콘텐츠**

**Unsplash 이미지 = 보조 콘텐츠**

로 정의한다.

## 16.2 활용 예

AI 분석 결과:

``` text
Kyoto
Gion
Fushimi Inari
Japanese cafe
```

검색 키워드를 만들고 Unsplash API를 통해 보조 이미지를 검색한다.

## 16.3 현재 활용 범위

-   앱 전체 화면의 계절 배경 (`/api/unsplash/background`)
-   스토리 화면의 장소/분위기 보조 검색 (`/api/unsplash`)
-   포토북 페이지 배경. 사용자 사진 자리에 넣지 않는다.

## 16.4 제외

-   Unsplash 이미지를 여행기의 핵심 콘텐츠로 사용
-   사용자 사진과 Unsplash 이미지를 구분 없이 표시

Unsplash 콘텐츠의 라이선스/Attribution 및 API 이용 정책은 실제 구현 시
최신 공식 문서를 확인한다.

------------------------------------------------------------------------

# 18. API 보안

## 17.1 원칙

OpenAI API Key와 Unsplash API Key를 브라우저 코드에 직접 넣지 않는다.

잘못된 구조:

``` text
Browser
  ↓
OpenAI API
```

안전한 구조:

``` text
Browser
  ↓
Next.js Route Handler
  ↓
OpenAI API
```

## 17.2 서버 환경변수

``` text
OPENAI_API_KEY
UNSPLASH_ACCESS_KEY
```

Vercel Environment Variables에서 관리한다.

GitHub에 API Key를 커밋하지 않는다.

------------------------------------------------------------------------

# 19. 추천 기술 스택

## 18.1 Frontend / Framework

### Next.js + TypeScript

선택 이유:

-   React 기반
-   UI와 API 기능을 하나의 프로젝트에서 구성 가능
-   OpenAI/Unsplash API를 Route Handler로 안전하게 연결 가능
-   Vercel 배포와 궁합이 좋음
-   향후 인증/DB/Storage를 추가하기 쉬움
-   8시간 수업 이후 실제 서비스로 확장하기 좋음

이번 프로젝트에서는 Next.js의 모든 기능을 학습하지 않는다.

필요한 범위:

-   React Component
-   페이지
-   상태
-   Client Component
-   Route Handler

SSR, Server Actions, 복잡한 캐싱 등은 MVP 범위에서 다루지 않는다.

------------------------------------------------------------------------

# 20. UI 기술

## Tailwind CSS

선택 이유:

-   빠른 UI 개발
-   반응형 구현
-   사진 중심 디자인에 적합
-   Editorial 스타일 구현 용이
-   별도의 CSS 구조를 복잡하게 만들지 않음

## 아이콘

### Lucide React

선택 이유:

-   깔끔한 스타일
-   일관된 아이콘
-   React 사용 편리

------------------------------------------------------------------------

# 21. 상태 관리

## MVP

### React Hooks + Context API

사용:

-   useState
-   useReducer
-   useContext
-   useEffect

MVP 규모에서는 Redux/Zustand 같은 별도 상태관리 라이브러리를 필수로
사용하지 않는다.

향후 상태 복잡도가 커지면 Zustand 등의 도입을 검토한다.

------------------------------------------------------------------------

# 22. AI 기술

## OpenAI API

활용 범위:

### 1. Vision

사진 분석

### 2. Structured Output

사진 분석 및 Scene 결과를 일정한 JSON 구조로 반환

### 3. Text Generation

여행 Story 생성

## AI 처리 단계

``` text
사진
 ↓
사진별 분석
 ↓
구조화된 분석 결과
 ↓
시간/장소/내용 기반 그룹화
 ↓
Scene 생성
 ↓
기억 질문
 ↓
사용자 답변
 ↓
전체 Story 생성
 ↓
Story Card 구성 판단 (선택, 사실 검증은 클라이언트)
 ↓
포토북 페이지 구성 (선택, 추가 모델 호출 없음)
```

AI에게 단순히 다음과 같이 요청하는 방식은 지양한다.

> "사진을 보고 여행기를 써줘."

대신 단계별로 구조화한다.

------------------------------------------------------------------------

# 23. 서버

## Next.js Route Handlers / Serverless

별도의 Express/Node.js 서버를 만들지 않는다.

예:

``` text
app/api/
 ├── analyze/route.ts
 ├── scenes/route.ts
 ├── generate-story/route.ts
 ├── suggest-title/route.ts
 ├── story-card/route.ts
 ├── unsplash/route.ts
 ├── unsplash/background/route.ts
 └── version/route.ts
```

## 역할

### `/api/analyze`

-   클라이언트 요청 수신
-   OpenAI 호출
-   사진 분석 결과 반환

### `/api/generate-story`

-   Scene 및 사용자 답변 수신
-   OpenAI 호출
-   Story 반환

### `/api/unsplash`, `/api/unsplash/background`

-   검색 또는 계절 랜덤 사진
-   Unsplash API 호출
-   배경·보조 이미지와 attribution 반환

### `/api/story-card`

-   이미 만든 스토리와 사진 사실만 전달
-   카드 구성(대표 사진, 문장, 판형) 판단
-   날짜·장소 사실 검증은 클라이언트가 한다

### `/api/version`

-   `package.json` 버전을 매 요청마다 읽어 반환
-   클라이언트가 배포된 버전과 다르면 새로고침

------------------------------------------------------------------------

# 24. 최종 아키텍처

``` text
                         사용자
                           │
                           ▼
              ┌─────────────────────┐
              │       Next.js       │
              │  TypeScript         │
              │  Tailwind CSS       │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      IndexedDB      LocalStorage   Route Handlers
       📸 사진        📝 여행 데이터       │
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                         OpenAI API            Unsplash API
                            🤖                      🖼️
```

------------------------------------------------------------------------

# 25. 배포

## GitHub + Vercel

저장소 https://github.com/segamja/TravelCanvasAI 의 `main`에 push하면
Vercel 팀 프로젝트 `careeredu/travel-canvas-ai`가 프로덕션을 배포한다.
로컬 커밋만으로는 배포되지 않는다.

프로덕션 주소는 https://travel-canvas-ai.vercel.app 이다. Deployment
Protection이 켜져 있으면 로그인해야 페이지가 열린다.

개발 흐름:

``` text
VS Code
   ↓
Git
   ↓
GitHub
   ↓
Vercel
   ↓
Build / Deploy
   ↓
웹앱
```

## 환경변수

Vercel에 다음을 등록한다.

``` text
OPENAI_API_KEY
UNSPLASH_ACCESS_KEY
```

개발 환경에서는 `.env.local`을 사용한다.

`.env.local`은 `.gitignore`에 포함한다.

------------------------------------------------------------------------

# 26. MVP에서 제외할 기능

다음 기능은 매력적이지만 이번 MVP의 핵심 검증 범위를 벗어나므로
제외한다.

## 계정/서버

-   회원가입
-   로그인
-   비밀번호 관리
-   서버 DB
-   클라우드 동기화
-   사용자 계정 기반 데이터 관리

## 여행 기능

-   여행 일정 관리
-   항공권 예약
-   호텔 예약
-   맛집 예약
-   실시간 GPS 추적
-   실시간 여행 경로 기록

## 소셜

-   팔로우
-   친구
-   좋아요
-   댓글
-   피드
-   DM
-   공동 편집
-   실시간 여행 공유

## 콘텐츠 고도화

-   AI 여행 영상 생성
-   AI 이미지 생성
-   자동 포토북 주문과 인쇄. 화면 포토북과 페이지 PNG는 구현되어 있다.
-   PDF 앨범
-   중복 사진 자동 제거
-   GPS 좌표를 도시명으로 바꾸는 역지오코딩
-   복잡한 사진 편집
-   필터/보정
-   고급 콜라주

## 기타

-   다국어 지원
-   결제
-   구독
-   광고
-   복잡한 관리자 시스템

------------------------------------------------------------------------

# 27. 향후 확장 계획

MVP가 성공하면 기존 구조를 유지하면서 다음 기능을 단계적으로 추가한다.

## Phase 1: MVP

``` text
Next.js
+
OpenAI
+
Unsplash
+
IndexedDB
+
LocalStorage
+
Vercel
```

## Phase 2: 사용자 계정

``` text
Supabase Auth
```

## Phase 3: 클라우드 저장

``` text
Supabase PostgreSQL
Supabase Storage
```

## Phase 4: 여행 공유

-   공개 여행 URL
-   링크 공유
-   비공개/공개 설정

## Phase 5: 가족/친구 공동 여행

-   여러 사용자의 사진 합치기
-   가족 구성원별 관점
-   공동 여행기

예:

``` text
아빠가 본 제주
엄마가 본 제주
아이의 제주
우리가 함께한 제주
```

## Phase 6: AI 콘텐츠 확장

-   AI 여행 영상
-   SNS용 Story
-   포토스토리
-   여행 에세이
-   미래의 나에게 보내는 편지

## Phase 7: Memory Archive

시간이 지난 후 과거 여행을 다시 발견하는 기능.

예:

> 1년 전 오늘, 우리는 제주에 있었습니다.

------------------------------------------------------------------------

# 28. 향후 확장을 위한 코드 구조 원칙

MVP부터 다음 계층을 분리한다.

``` text
app/
components/
lib/
services/
storage/
types/
```

## components

UI 컴포넌트

## services

외부 API 및 AI 서비스

``` text
services/
 ├── openai.ts
 └── unsplash.ts
```

## storage

저장소 추상화

``` text
storage/
 ├── travelStorage.ts
 ├── photoStorage.ts
 ├── localStorage.ts
 └── indexedDB.ts
```

## types

공통 TypeScript 타입

``` text
types/
 ├── travel.ts
 ├── photo.ts
 ├── scene.ts
 └── story.ts
```

## 핵심 원칙

UI가 LocalStorage/IndexedDB를 직접 호출하지 않도록 한다.

예:

``` text
UI
 ↓
travelStorage.saveTravel()
 ↓
LocalStorage
```

향후:

``` text
UI
 ↓
travelStorage.saveTravel()
 ↓
Supabase
```

로 교체할 수 있도록 한다.

------------------------------------------------------------------------

# 29. 추천 프로젝트 구조

``` text
TravelCanvasAI/
│
├── app/
│   ├── page.tsx
│   ├── travel/
│   │   ├── new/
│   │   └── [id]/
│   └── api/
│       ├── analyze/
│       │   └── route.ts
│       ├── generate-story/
│       │   └── route.ts
│       └── unsplash/
│           └── route.ts
│
├── components/
│   ├── travel/
│   │   ├── TravelCard.tsx
│   │   ├── TravelList.tsx
│   │   └── TravelHeader.tsx
│   ├── photo/
│   │   ├── PhotoUploader.tsx
│   │   ├── PhotoGrid.tsx
│   │   └── PhotoCard.tsx
│   ├── analysis/
│   │   └── AnalysisProgress.tsx
│   ├── scene/
│   │   ├── SceneCard.tsx
│   │   └── SceneEditor.tsx
│   └── story/
│       ├── StoryEditor.tsx
│       └── StoryViewer.tsx
│
├── services/
│   ├── openai.ts
│   └── unsplash.ts
│
├── storage/
│   ├── travelStorage.ts
│   ├── photoStorage.ts
│   ├── localStorage.ts
│   └── indexedDB.ts
│
├── types/
│   ├── travel.ts
│   ├── photo.ts
│   ├── scene.ts
│   └── story.ts
│
├── lib/
│   ├── utils.ts
│   └── constants.ts
│
├── public/
│
├── .env.local
├── .gitignore
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 30. 핵심 데이터 모델

## Photo

``` ts
interface Photo {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  analysis?: PhotoAnalysis;
}
```

## PhotoAnalysis

``` ts
interface PhotoAnalysis {
  description: string;
  location?: string;
  tags: string[];
  objects?: string[];
  peopleDetected?: boolean;
  mood?: string;
  importance: number;
  sceneCandidates?: string[];
  confidence?: number;
}
```

## TravelScene

``` ts
interface TravelScene {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  photoIds: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  confidence?: number;
}
```

## TravelStory

``` ts
interface TravelStory {
  projectId: string;
  title: string;
  subtitle?: string;
  chapters: StoryChapter[];
  theme?: string;
}
```

## StoryChapter

``` ts
interface StoryChapter {
  id: string;
  title: string;
  photoIds: string[];
  body: string;
}
```

------------------------------------------------------------------------

# 31. AI 처리 아키텍처

## Step 1. Photo Analysis

각 사진에 대해 구조화된 분석 결과를 생성한다.

``` text
Photo
 ↓
OpenAI Vision
 ↓
PhotoAnalysis JSON
```

## Step 2. Scene Generation

사진 분석 결과를 묶는다.

``` text
PhotoAnalysis[]
 ↓
Scene Generator
 ↓
TravelScene[]
```

## Step 3. Memory Questions

Scene 중 개인적 의미가 불확실한 부분을 찾는다.

``` text
TravelScene[]
 ↓
Question Generator
 ↓
Memory Question[]
```

## Step 4. Story Generation

``` text
TravelProject
+
PhotoAnalysis[]
+
TravelScene[]
+
Memory Answers
 ↓
OpenAI
 ↓
TravelStory
```

------------------------------------------------------------------------

# 32. AI 프롬프트 설계 원칙

## 사진 분석 프롬프트

-   관찰 가능한 정보 중심
-   알 수 없는 정보는 추측하지 않음
-   위치/시간은 확실하지 않으면 confidence를 낮춤
-   JSON 구조를 준수
-   여행 Story에 필요한 정보 중심

## Scene 프롬프트

-   시간 순서 우선
-   장소 연속성 고려
-   동일 활동/사건을 하나의 Scene으로 묶음
-   비슷한 사진은 여러 Scene으로 나누지 않고 한 장면에 모은다. 파일을
    삭제하는 중복 제거는 하지 않는다.
-   장면의 의미가 드러나는 제목 생성

## Story 프롬프트

-   사용자가 제공한 정보 우선
-   사진 분석 결과 활용
-   허구의 사건 생성 금지
-   여행 전체의 흐름 유지
-   사진과 글의 연결성 강화
-   과장된 감정 표현 최소화

------------------------------------------------------------------------

# 33. UX 상세 흐름

## Step 1

홈

> 당신의 여행을 이야기로 만들어보세요.

`[새 여행 만들기]`

## Step 2

사진 업로드

> 여행 사진을 모두 올려주세요.

`[사진 선택]`

## Step 3

분석

> 사진 속 여행을 살펴보고 있어요.

## Step 4

Scene 확인

> 여행에서 6개의 장면을 찾았어요.

## Step 5

기억 질문

> 이 순간을 특별하게 만든 이야기가 있었나요?

## Step 6

Story 생성

> 당신의 여행 이야기를 만들고 있어요.

## Step 7

완성

> **당신의 여행 이야기가 완성되었습니다.**

## Step 8

Story 감상

사진 중심의 세로 스크롤 Editorial UI. 챕터 안 사진은 날짜별로 구분한다.

## Step 9

AI Story Card 또는 날짜별 포토북

스토리 화면에서 선택한다. 둘 다 이 브라우저에 저장한다.

------------------------------------------------------------------------

# 34. MVP 화면 목록

최소 다음 화면을 구현한다.

### 1. Home

-   서비스 소개
-   여행 목록
-   새 여행

### 2. Create Travel Project

-   여행 기본 정보
-   사진 업로드

### 3. Photo Review

-   사진 미리보기
-   삭제/추가

### 4. AI Analysis

-   분석 진행 상태

### 5. Scene Review

-   AI가 만든 Scene
-   Scene 수정

### 6. Memory Question

-   AI 질문
-   선택/텍스트 답변

### 7. Story Generation

-   생성 진행

### 8. Story View

-   여행 제목
-   Hero Image
-   Chapter
-   사진
-   Story

### 9. Story Edit

-   제목/본문 수정
-   사진 추가/삭제
-   프로젝트 저장
-   프로젝트 삭제

### 10. AI Story Card

-   한 장 미리보기
-   다시 만들기, 로컬 저장, PNG, 공유

### 11. 포토북

-   제목, 날짜 범위, 밀도, 판형
-   페이지 넘김
-   로컬 저장, 현재 페이지 PNG

------------------------------------------------------------------------

# 35. 성능 및 비용 고려

## 사진 처리

-   원본은 장당 20MB까지 받고, 저장본은 긴 변 1600px JPEG 한 장이다.
-   AI에는 긴 변 1024px JPEG만 보낸다. 브라우저는 요청 용량이 한도를 넘지 않도록 나눠 `/api/analyze`로 보내고, 서버는 받은 묶음을 8장씩 OpenAI에 호출한다.
-   분석 결과는 사진 메타데이터에 저장하고, 이후 단계는 그 문장을 재사용한다.

## AI 호출

사진 한 장마다 무조건 여러 번 AI를 호출하지 않는다.

``` text
사진별 분석 (8장 배치)
→ Scene 단위 처리
→ 전체 Story 처리
→ Story Card는 선택, 포토북은 모델 호출 없음
```

중복 호출을 최소화한다.

## 오류 처리

다음 상황을 고려한다.

-   AI API 실패
-   Unsplash API 실패
-   네트워크 오류
-   잘못된 이미지 형식
-   너무 큰 이미지
-   LocalStorage/IndexedDB 저장 실패
-   API Rate Limit
-   JSON Parsing 실패

사용자에게 기술 오류 메시지를 그대로 노출하지 말고 이해하기 쉬운
메시지를 제공한다.

------------------------------------------------------------------------

# 36. 보안

## 필수

-   API Key 클라이언트 노출 금지
-   `.env.local` Git 제외
-   Vercel 환경변수 사용
-   서버 Route Handler에서 외부 API 호출
-   사용자 입력을 AI 프롬프트에 넣을 때 안전하게 처리
-   파일 타입/크기 검증

## 개인정보

서버 DB에 사용자 사진을 저장하지 않는다.

사진 파일은 브라우저 IndexedDB에, 메타데이터는 LocalStorage에 남는다.
홈의 "서버 저장 없이 브라우저에만 저장돼요"는 이 보관 위치를 말한다.

사진 분석을 시작하면 줄인 JPEG가 우리 Route Handler를 거쳐 OpenAI로
전달된다. 장면 나누기, 스토리, 스토리 카드, 앨범은 그 이후 사진 파일을
다시 보내지 않는다. Unsplash에는 사용자 사진을 보내지 않는다.

OpenAI API로 보낸 데이터의 학습 사용 여부와 보관 기간은 제공자의 최신
정책(API는 기본적으로 학습에 쓰지 않으며, 악용 모니터링용 단기 보관이
있을 수 있음)을 배포 시점에 다시 확인한다. 얼굴과 여행 일정이 들어 있는
사진이므로, 분석은 사진을 기기 밖으로 보내는 단계다.

------------------------------------------------------------------------

# 37. MVP 범위 확정

## 반드시 구현

-   [x] Next.js 기반 웹앱
-   [x] TypeScript
-   [x] Tailwind CSS
-   [x] 이야기 프로젝트 생성
-   [x] 프로젝트별 독립적인 데이터 관리
-   [x] 다중 사진 업로드
-   [x] 사진 미리보기
-   [x] 사진 삭제/추가
-   [x] OpenAI 사진 분석
-   [x] 구조화된 AI 분석 결과
-   [x] 사진 → Scene 구성
-   [x] Scene 검토/수정
-   [x] AI 기억 질문
-   [x] AI 여행 Story 생성
-   [x] Story 편집
-   [x] 이야기 프로젝트 재진입/편집
-   [x] 이야기 프로젝트 삭제
-   [x] 감성적인 Story View
-   [x] IndexedDB 사진 저장
-   [x] LocalStorage 여행 데이터 저장
-   [x] Unsplash API 연동
-   [x] Next.js Route Handler
-   [x] 환경변수 관리
-   [x] Vercel 배포
-   [x] 촬영일 기준 사진 분류와 시각 표시
-   [x] 앱 버전 표시와 배포 후 자동 새로고침
-   [x] Unsplash 전체 화면 배경
-   [x] AI Story Card
-   [x] 날짜별 포토북 미리보기, 로컬 저장, 페이지 PNG

## MVP에서 제외

-   [ ] 회원가입/로그인
-   [ ] 서버 DB
-   [ ] 클라우드 사진 저장
-   [ ] 실시간 GPS
-   [ ] 여행 일정/예약
-   [ ] SNS
-   [ ] 좋아요/댓글
-   [ ] 공동 편집
-   [ ] AI 영상
-   [ ] 포토북 인쇄 주문과 PDF
-   [ ] 중복 사진 자동 제거
-   [ ] GPS 역지오코딩(도시명)
-   [ ] 결제
-   [ ] 다국어
-   [ ] 복잡한 사진 편집

------------------------------------------------------------------------

# 38. 8시간 수업 개발 우선순위

## 1단계: 기본 프로젝트

-   Next.js 생성
-   TypeScript
-   Tailwind
-   기본 레이아웃

## 2단계: 여행 프로젝트 생성/사진 업로드

-   새 여행 시작
-   독립적인 projectId 생성
-   다중 업로드
-   미리보기
-   프로젝트 로컬 저장

## 3단계: AI 분석

-   Route Handler
-   OpenAI 연결
-   이미지 분석
-   Structured Output

## 4단계: Scene

-   분석 결과 표시
-   Scene 생성
-   Scene 수정

## 5단계: Story

-   기억 질문
-   답변 수집
-   Story 생성
-   Story 편집

## 6단계: Story UI

-   Hero Image
-   Chapter
-   사진
-   본문
-   Editorial 디자인

## 7단계: Unsplash

-   보조 이미지 검색
-   대표 이미지 후보

## 8단계: 저장/배포

-   IndexedDB
-   LocalStorage
-   GitHub
-   Vercel
-   환경변수
-   최종 테스트

------------------------------------------------------------------------

# 39. 최종 서비스 경험

사용자는 여행 후 앱을 열고 사진을 업로드한다.

``` text
"사진 36장을 올렸어요."
        ↓
"여행을 살펴보고 있어요."
        ↓
"6개의 장면을 발견했어요."
        ↓
"이 카페에서 특별한 일이 있었나요?"
        ↓
사용자 답변
        ↓
"여행 이야기를 만들고 있어요."
        ↓
"당신의 여행 이야기가 완성되었습니다."
```

그리고 최종적으로:

> **사진을 정리한 것이 아니라, 여행의 기억을 다시 만나는 경험**

을 제공한다.

------------------------------------------------------------------------

# 40. 서비스 차별화 핵심 요약

### 기존 여행 앱

**여행을 기록한다.**

### 이 서비스

**여행의 기억을 이야기로 만든다.**

핵심 차별화 요소:

1.  **Zero Input** --- 사진만 올리면 시작
2.  **AI Photo Understanding** --- 사진의 의미 분석
3.  **Scene Reconstruction** --- 사진을 여행 장면으로 재구성
4.  **Memory Interview** --- AI가 필요한 기억을 질문
5.  **AI Storytelling** --- 여행 전체를 하나의 이야기로 구성
6.  **Story-first UI** --- 사진 중심의 감성적인 결과물
7.  **Local-first** --- MVP에서 서버 DB 없이 사용자의 브라우저에 저장
8.  **확장 가능한 구조** --- 향후 Supabase 기반 실제 서비스로 확장 가능

------------------------------------------------------------------------

# 41. 최종 기술 선택

``` text
Frontend
Next.js + TypeScript

UI
Tailwind CSS + Lucide React

AI
OpenAI API
- Vision
- Structured Output
- Text Generation

External API
Unsplash API

Browser Storage
IndexedDB
- 사진

LocalStorage
- 여행 메타데이터
- Scene
- Story
- Story Card
- 포토북

Server
Next.js Route Handlers
- OpenAI API 중계
- Unsplash API 중계

Database
MVP: 없음
Future: Supabase PostgreSQL

Cloud Storage
MVP: 없음
Future: Supabase Storage

Authentication
MVP: 없음
Future: Supabase Auth

Deployment
GitHub + Vercel
```

------------------------------------------------------------------------

# 41. 최종 아키텍처 원칙

> **MVP는 단순하게, 구조는 확장 가능하게 만든다.**

MVP에서는 서버 DB를 사용하지 않고 브라우저에 데이터를 저장한다.

하지만 UI가 저장 방식에 직접 의존하지 않도록 Storage Layer를 분리한다.

외부 API는 Route Handler를 통해 호출하여 API Key를 보호한다.

AI는 한 번의 프롬프트로 여행기를 생성하지 않고:

**사진 분석 → Scene 구성 → 기억 질문 → Story 생성 → (선택) Story Card / 포토북**

의 단계적 파이프라인으로 설계한다.

최종적으로 이 프로젝트의 가장 중요한 기능은 기술 스택이나 저장 방식이
아니라 다음 사용자 경험이다.

> **"나는 여행 사진을 올렸을 뿐인데, AI가 내가 여행에서 무엇을 보고 어떤
> 순간을 보냈는지 이해하고, 내가 잊고 있던 기억까지 꺼내서 하나의 여행
> 이야기로 만들어주었다."**

이 경험을 MVP의 최우선 성공 기준으로 삼는다.
