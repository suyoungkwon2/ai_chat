## AI Chat (React + TypeScript + Vite + FastAPI)

웹 인터페이스(프런트엔드)와 FastAPI 기반 백엔드가 함께 구성된 AI Chat 앱입니다. 게스트/회원 크레딧, 광고 시청 보너스, 캐릭터별 채팅, 좋아요(Like) 등 MVP 기능이 포함되어 있습니다.

---

### 요구사항
- **Node.js**: 18+ (LTS 권장)
- **Python**: 3.10+ (3.11 권장)

---

### 환경 변수 설정
프로젝트 루트에 있는 `env.example`을 복사하여 `.env` 파일을 만들고 값을 채워주세요.

```bash
cp env.example .env
```

`.env`에서 설정할 수 있는 값:
- `XAI_API_KEY` 또는 `OPENAI_API_KEY`: AI 응답 생성을 위한 API 키. `XAI_API_KEY`가 우선됩니다.
- `GOOGLE_API_KEY`: Google Generative AI 사용 시 (옵션).
- `JWT_SECRET`: JWT 서명 시크릿. 프로덕션에서는 강력한 랜덤 문자열을 사용하세요.
- `DATABASE_URL`: 기본값은 `sqlite+aiosqlite:///./app.db` (SQLite).
- `INITIAL_FREE_CREDITS`: 게스트 초기 무료 크레딧 수 (기본 5).
- `SIGNUP_BONUS_CREDITS`: 회원가입 보너스 크레딧 (기본 10).
- `AD_BONUS_CREDITS`: 광고 시청 보너스 크레딧 (기본 10).
- `AD_MIN_WATCH_SECONDS`: 광고 보상 최소 시청 시간 (기본 15초).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 액세스 토큰 만료(분).

프런트엔드에서 백엔드 주소를 지정하려면 루트 또는 `src` 기준(바이트 빌드 기준)에 **Vite 환경 파일**을 추가하세요.

- 로컬 개발: 프로젝트 루트에 `.env.local` 생성 후 아래 작성
```bash
# Vite 환경 변수 (프런트엔드 전용)
VITE_API_BASE=http://localhost:8000
```

기본값은 코드상 `http://localhost:8000`이므로, 동일 포트 사용 시 `.env.local`은 생략 가능합니다.

---

### 백엔드 실행 (FastAPI)
1) Python 가상환경 생성 및 패키지 설치
```bash
conda activate agent
```

2) `.env` 파일 준비(위 섹션 참고).

3) 서버 실행
- 간단 실행:
```bash
python backend.py
```
- 혹은 자동 리로드(개발 편의):
```bash
uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
```

4) 기본 포트와 정적 파일
- 기본 포트: `8000`
- `public/images`, `public/videos` 디렉토리가 존재하면 `/images`, `/videos` 경로로 서빙됩니다.
- DB는 기본적으로 프로젝트 루트의 `app.db` (SQLite)로 생성됩니다.

---

### 프런트엔드 실행 (Vite + React)
1) 패키지 설치
```bash
npm install
```

2) 개발 서버 실행
```bash
npm run dev
```
- 기본 접속: `http://localhost:5173`
- 프런트엔드는 `VITE_API_BASE`(기본 `http://localhost:8000`)로 백엔드 API에 요청합니다.

3) 프로덕션 빌드 및 미리보기
```bash
npm run build
npm run preview
```

---

### 기능 개요
- **게스트/회원 크레딧 시스템**: 게스트 초기 크레딧 제공, 회원가입 시 보너스, 광고 시청으로 크레딧 충전
- **광고 시청 흐름**: 시작 → 완료 보고 시 보너스 지급(최소 시청 시간 충족 시)
- **캐릭터별 인터랙티브 채팅**: 캐릭터 선택 → 대화(크레딧 1 소모/메시지)
- **좋아요(Like)**: 캐릭터에 대한 좋아요 토글 및 전체 카운트 조회
- **로그인/회원가입**: JWT 기반 인증, 로그인 시 영구(퍼시스턴트) 채팅 저장

---

### API 개요 (MVP)
아래는 프런트엔드가 사용하는 주요 엔드포인트입니다. 모든 경로는 기본적으로 `VITE_API_BASE`(기본 `http://localhost:8000`)를 기준으로 합니다.

- **세션/크레딧**
  - `POST /api/interface/guest/init` { anon_id? } → { anon_id, credits_remaining, is_new }
  - `GET /api/interface/usage/status` (Headers: `X-Anon-Id`) → { credits_remaining, authenticated, ad_min_seconds, ad_bonus_credits }
- **광고**
  - `POST /api/interface/ad/start` { anon_id? } (Headers: `X-Anon-Id` 권장) → { ad_session_id, ad_min_seconds }
  - `POST /api/interface/ad/complete` { ad_session_id, watched_seconds } → { awarded, credits_remaining, estimated_revenue_usd }
- **인증**
  - `POST /api/auth/register` { username, password, email? } → 200 or 400(중복)
  - `POST /api/auth/login` { username, password } → { access_token, token_type }
- **캐릭터/채팅 (인터페이스 전용)**
  - `GET /api/interface/characters` → 캐릭터 리스트
  - `POST /api/interface/chat/create_by_id` { user_name, character_id }
    - 로그인 상태: 영구 채팅 생성, 선택적으로 기본 인사말이 메시지로 저장됨
    - 비로그인: 메모리상(세션 한정) 채팅 생성
  - `POST /api/interface/chat/send` { chat_id, sender_id?, content, anon_id?, character_id? }
    - 게스트: `X-Anon-Id` 헤더 또는 `anon_id` 필드 필요. 메시지 1건당 크레딧 1 차감
    - 로그인: 영구 채팅에 메시지 저장, 크레딧 1 차감
- **좋아요(Like)**
  - `GET /api/interface/likes/status` (Headers: `X-Anon-Id`) → { likes: { [character_id]: count }, liked_by_me: { [character_id]: boolean } }
  - `POST /api/interface/likes/toggle` { character_id, anon_id? } (Headers: `X-Anon-Id` 가능) → { character_id, liked_by_me, likes_count }

- **헤더 규칙**
  - 게스트(비로그인) 요청은 `X-Anon-Id: <anon_id>` 헤더를 사용하거나 본문에 `anon_id`를 포함하세요.
  - 로그인 요청은 `Authorization: Bearer <access_token>` 헤더가 필요합니다.

---

### 로컬 사용 흐름
1) 백엔드 실행 (`8000` 포트), 프런트엔드 실행 (`5173` 포트)
2) 브라우저에서 `http://localhost:5173` 접속 → 캐릭터 카드 클릭 → 채팅 시작
3) 게스트는 **초기 5 크레딧** 제공. 크레딧 소진 시 회원가입 또는 **15초 광고 시청**으로 +10 크레딧 획득
4) 회원가입 시 즉시 **+10 보너스** 지급. 로그인 후 영구 채팅 저장 가능

---

### 개발 팁
- 백엔드 CORS는 `*` 허용으로 설정되어 있어 로컬에서 포트가 달라도 바로 호출 가능합니다.
- 프런트엔드 기본 API 베이스는 `http://localhost:8000`입니다. 변경하려면 `.env.local`에 `VITE_API_BASE`를 설정하세요.
- 데이터베이스는 SQLite(파일: `app.db`)이며 서버 시작 시 자동 마이그레이션(스키마 생성)됩니다.
- 정적 리소스를 백엔드에서 서빙하려면 `public/images`, `public/videos` 폴더를 사용하세요. 그 외 정적 자원은 프런트엔드에서 관리됩니다.

---

### (옵션) 간단 Node 서버
`server/` 폴더에는 테스트용 Express 서버(`3001` 포트, `/api/receive_msg`)가 포함되어 있습니다. 현재 앱의 메인 플로우에는 필요하지 않습니다.

```bash
cd server
npm install
node index.js
```

---

### 라이선스
이 저장소는 학습 및 데모 용도로 제공됩니다.
