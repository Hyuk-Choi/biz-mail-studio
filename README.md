# BizMail Studio

BizMail Studio는 사용자가 말하듯 작성한 메일 초안이나 메모를 분석해 적절한 비즈니스 메일 폼을 자동 추천하고, 한국어/영어 비즈니스 메일 완성본으로 재작성해주는 AI 기반 메일 리라이팅 웹앱입니다.

## 앱 소개

사용자가 “자료 늦게 보내서 죄송하다고 하고 오늘 오후까지 다시 보내겠다고 말해줘”처럼 대충 입력해도 메일 의도, 받는 사람 유형, 긴급도, 추천 톤, 누락 정보를 분석한 뒤 사과 메일, 일정 조율 메일, 회신 독촉 메일 등 적절한 폼으로 변환합니다.

## 주요 기능

- 대충 쓴 초안/메모 기반 입력
- 必/有/多 업무 메모 표기 해석: 필수 조건, 있음/가능성, 많음/여러 건 구분
- 초안 분석: 목적, 받는 사람 유형, 긴급도, 추천 톤, 누락 정보 추출
- 비즈니스 메일 폼 자동 추천
- 자동 추천 모드와 직접 선택 모드 지원
- 메일 케이스별 본문 구조 자동 구성
- 한국어 비즈니스 메일 생성
- 영어 비즈니스 메일 생성
- 한국어 초안의 영어 비즈니스 메일 변환
- 영어 초안의 한국어 비즈니스 메일 변환
- 톤 선택: 자동 추천, 정중한, 간결한, 부드러운, 단호한, 설득력 있는, 친근하지만 전문적인, 격식 있는, 글로벌 비즈니스 스타일
- 추천 제목 3개, 완성된 메일 본문, 개선 포인트, 누락 정보 안내 생성
- 결과 재작성 옵션: 더 정중하게, 더 짧게, 더 명확하게, 더 부드럽게, 더 단호하게, 영어로 바꾸기, 한국어로 바꾸기, 다시 생성
- 결과 복사 및 복사 완료 피드백
- 현재 포트폴리오/데모 모드는 mock 생성 로직으로 동작
- 추후 OpenAI API 서버 연동 가능 구조

## 기술 스택

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- OpenAI API

## 실행 방법

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

같은 와이파이 또는 같은 내부 네트워크의 다른 기기에서 접속하려면 다음 명령을 사용합니다.

```bash
pnpm dev:host
```

실행 후 외부 기기에서는 아래 형식으로 접속합니다.

```txt
http://내-PC-IP:3000
```

예시:

```txt
http://192.168.3.53:3000
```

3000번 포트가 이미 사용 중이면 포트를 바꿔 실행할 수 있습니다.

```bash
PORT=3001 pnpm dev:host
```

프로덕션 빌드는 다음 명령으로 확인할 수 있습니다.

```bash
pnpm build
pnpm start
```

프로덕션 빌드 상태를 내부 네트워크에 공개하려면 다음 명령을 사용합니다.

```bash
pnpm build
pnpm start:host
```

포트를 바꿔 프로덕션 서버를 열려면 다음처럼 실행합니다.

```bash
PORT=3001 pnpm start:host
```

npm을 사용하는 경우 `npm install`, `npm run dev`, `npm run build` 명령으로도 실행할 수 있습니다.

## 외부 접속 구성

로컬 개발 서버를 외부 기기에서 접속 가능하게 하려면 서버를 `0.0.0.0`에 바인딩해야 합니다.

- 개발 모드: `pnpm dev:host`
- 프로덕션 모드: `pnpm build` 후 `pnpm start:host`
- 같은 네트워크 접속 주소: `http://내-PC-IP:3000`
- 포트 변경: `PORT=3001 pnpm dev:host` 또는 `PORT=3001 pnpm start:host`

주의할 점:

- 같은 와이파이나 같은 사내 네트워크에서는 위 방식으로 접속할 수 있습니다.
- 인터넷에 완전히 공개하려면 Vercel, Netlify, Render 같은 배포 서비스를 사용하거나 ngrok, Cloudflare Tunnel 같은 터널링 도구가 필요합니다.
- 방화벽에서 3000 포트 접근이 막혀 있으면 외부 기기에서 접속되지 않을 수 있습니다.
- OpenAI API Key는 서버 환경변수로만 설정하고 브라우저에 노출하지 않아야 합니다.

## 앱 배포

### Vercel 배포

Next.js 앱이므로 Vercel 배포가 가장 간단합니다.

1. GitHub에 프로젝트를 업로드합니다.
2. Vercel에서 새 프로젝트를 생성하고 해당 저장소를 Import합니다.
3. Framework Preset은 `Next.js`로 설정합니다.
4. Environment Variables에 아래 값을 등록합니다.

```bash
MAIL_GENERATION_PROVIDER=mock
```

5. Deploy를 실행합니다.

OpenAI API로 전환할 때만 아래 값을 추가하고 `MAIL_GENERATION_PROVIDER=openai`로 변경합니다.

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
MAIL_GENERATION_PROVIDER=openai
```

이 프로젝트에는 Vercel 배포용 [vercel.json](./vercel.json)이 포함되어 있습니다.

### Render 배포

Render를 사용하는 경우 저장소를 연결한 뒤 `render.yaml` Blueprint를 사용할 수 있습니다.

필수 환경변수:

```bash
MAIL_GENERATION_PROVIDER=mock
```

### Docker 배포

서버나 컨테이너 환경에 배포하려면 Docker 이미지를 만들 수 있습니다.

```bash
docker build -t bizmail-studio .
docker run -p 3000:3000 \
  -e MAIL_GENERATION_PROVIDER=mock \
  bizmail-studio
```

배포된 앱은 `http://서버주소:3000`에서 접속할 수 있습니다.

### 임시 공개 URL 배포

로컬에서 빠르게 외부 테스트 링크를 만들려면 Cloudflare Tunnel을 사용할 수 있습니다.

```bash
pnpm build
PORT=3001 pnpm start:host
cloudflared tunnel --protocol http2 --url http://127.0.0.1:3001
```

명령 실행 후 출력되는 `https://...trycloudflare.com` 주소를 외부인에게 공유하면 됩니다. 이 방식은 로컬 PC와 터널 프로세스가 켜져 있는 동안만 유지됩니다.

## 환경변수 설정 방법

`.env.local.example`을 참고해 `.env.local` 파일을 생성합니다.

```bash
MAIL_GENERATION_PROVIDER=mock

# Optional later, only when switching to OpenAI.
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

환경변수 설명:

- `MAIL_GENERATION_PROVIDER`: 현재는 `mock`으로 사용합니다. `openai`로 바꾸면 서버에서 OpenAI API를 호출합니다.
- `OPENAI_API_KEY`: OpenAI API 호출에 사용하는 서버 전용 키입니다. mock 모드에서는 필요 없습니다.
- `OPENAI_MODEL`: 사용할 OpenAI 모델명입니다. mock 모드에서는 필요 없습니다.

API Key는 클라이언트 코드에 포함되지 않으며, `app/api/mail/generate/route.ts` 서버 라우트에서만 사용됩니다.

## 폴더 구조

```txt
app/
  api/mail/generate/route.ts   # 메일 생성 API Route
  globals.css                  # Tailwind 전역 스타일
  layout.tsx                   # 루트 레이아웃
  page.tsx                     # 메인 앱 화면
components/
  CaseCards.tsx                # 메일 케이스 소개 카드
  CopyButton.tsx               # 클립보드 복사 버튼
  Header.tsx                   # 앱 헤더
  MailForm.tsx                 # 입력 폼
  MailResult.tsx               # 결과 출력 영역
  TemplateSelector.tsx         # 비즈니스 메일 폼 선택 UI
data/
  mailOptions.ts               # 메일 케이스, 언어, 톤 옵션
  mailTemplates.ts             # 메일 폼별 구조, 가이드, 예시 데이터
lib/
  analyzeDraft.ts              # 초안 분석 및 메일 폼 자동 추천 로직
  generateEmail.ts             # 분석 결과 기반 mock 메일 생성기
  mailApiClient.ts             # 클라이언트 API 호출 함수
  openaiEmail.ts               # 서버 전용 OpenAI 호출 함수
  prompts.ts                   # OpenAI 프롬프트 생성 함수
types/
  mail.ts                      # 메일 관련 타입 정의
Dockerfile                     # Docker 배포 설정
render.yaml                    # Render 배포 설정
vercel.json                    # Vercel 배포 설정
```

## 향후 고도화 기능

- 사용자별 메일 히스토리 저장
- 자주 쓰는 서명 및 회사 정보 템플릿 저장
- 제목만 다시 생성하기
- 본문 특정 문단만 재작성하기
- Gmail, Outlook 복사/연동 워크플로우
- 팀별 브랜드 톤 가이드 적용
- 스트리밍 응답 UI
- 사용량 제한 및 인증 기능

## 포트폴리오용 소개 문구

“BizMail Studio는 사용자의 간단한 초안과 상황 정보를 바탕으로 한국어/영어 비즈니스 메일을 자동 생성해주는 AI 기반 메일 리라이팅 웹앱입니다. 케이스별 메일 구조, 톤 선택, 언어 변환, 개선 포인트 제공 기능을 통해 실무 커뮤니케이션 효율을 높이는 것을 목표로 개발했습니다.”
