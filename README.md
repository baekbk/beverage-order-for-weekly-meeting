# Very Vary 커피 주문 — Vercel 배포 가이드

이 폴더를 그대로 Vercel에 올리면, claude.ai 밖에서도 팀원들이 실시간(4초 폴링)으로
주문을 함께 저장/확인할 수 있는 웹앱이 됩니다.

GitHub의 `main` 브랜치에 변경 사항을 push하면 Vercel이 자동으로 배포를 시작합니다.

## 구성
- `index.html` — 화면 전체 (기존 페이지와 동일, 데이터 저장 방식만 백엔드 API 호출로 변경)
- `api/data.js` — 서버리스 API. GET(전체 조회) / POST(저장) 을 처리하고, Upstash Redis에 데이터를 씁니다.
- `package.json` — `@upstash/redis` 패키지 의존성

## 배포 순서

### 1) GitHub에 올리기 (또는 CLI로 바로 배포해도 됨)
- 새 GitHub 저장소를 만들고 이 폴더 전체를 push 하세요.
- CLI로 바로 하고 싶다면 이 폴더에서 `npx vercel` 실행 후 안내에 따라 로그인/배포하면
  GitHub 없이도 배포됩니다.

### 2) vercel.com 가입 & 프로젝트 생성
1. https://vercel.com 에서 가입 (GitHub 계정으로 가입하면 편해요)
2. "Add New… → Project" 에서 방금 만든 저장소를 선택 → Import
3. Framework Preset은 **Other**로 두고 그대로 Deploy (별도 빌드 설정 필요 없음)

### 3) 데이터베이스(Upstash Redis) 연결 — 가장 중요한 단계
1. 배포된 프로젝트 대시보드에서 **Storage** 탭 클릭
2. **Create Database** → **Upstash** → **Redis** 선택 (무료 티어로 충분합니다)
3. 만든 데이터베이스를 방금 그 프로젝트에 **Connect/Link**
   → 이 과정에서 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 환경변수가
     프로젝트에 자동으로 주입됩니다. (이름이 다르게 보이면, Settings → Environment
     Variables에서 실제 변수명을 확인해 `api/data.js`의 `Redis.fromEnv()` 부분을
     맞춰주세요.)
4. **Deployments** 탭에서 최신 배포를 **Redeploy** — 환경변수는 재배포해야 반영됩니다.

### 4) 완료
- 배포된 주소(예: `https://your-project.vercel.app`)가 팀 공유 링크입니다.
- 링크를 가진 사람은 누구나 (조직 밖이어도) 접속해서 주문을 저장할 수 있어요.

## 참고 (claude.ai 버전과의 차이)
- claude.ai 버전은 `window.claude.use('db')`로 즉시(실시간) 동기화됐지만, 이 버전은
  4초마다 서버에 새 데이터를 물어보는 "폴링" 방식이라 최대 4초 정도 지연이 있을 수
  있어요. 소규모 팀 주문용으로는 체감상 거의 차이가 없습니다.
- 과거 4건의 주문 이력(Loop 단락/0624/0902/뭘닝 커피)은 최초 배포 후 첫 API 호출 시
  자동으로 한 번만 시딩됩니다.
