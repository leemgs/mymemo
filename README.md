# 📢 My Memo

Git 저장소 기반의 **온라인 메모 홈페이지**입니다.
카드형 UI로 메모를 열람하고, 새 메모(제목·내용·태그·첨부파일)를 작성하면
**브라우저 자바스크립트가 GitHub API로 저장소의 `./data/` 폴더에 직접 Git 커밋**합니다.

> 서버(백엔드)가 필요 없으므로 **GitHub Pages 같은 정적 호스팅에서 그대로 동작**합니다.
> 예: `https://<사용자>.github.io/<저장소>/`

## 동작 방식

- **열람 (누구나)** — GitHub Contents API로 `./data/index.json`을 읽어 카드로 표시합니다.
  공개 저장소면 토큰 없이도 열람됩니다. (익명은 시간당 60회 제한)
- **저장/삭제 (관리자)** — GitHub Git Data API(blob → tree → commit → ref)로
  `./data/`에 파일을 만들고 **한 번의 커밋**으로 반영합니다.
  이때 **쓰기 권한 토큰(PAT)** 이 필요합니다.

```
브라우저(JS)  ──GitHub API(REST)──▶  github.com/<owner>/<repo>  ──▶  ./data/ 에 커밋
```

## 구조

```
mymemo/
├─ docs/                 # 정적 프론트엔드 (GitHub Pages 소스 폴더로 지정)
│  ├─ index.html
│  ├─ css/style.css
│  └─ js/app.js          # GitHub API 읽기/커밋, 목록·작성·삭제 로직
├─ data/                 # 메모 저장소 (여기에 커밋됩니다)
│  ├─ index.json         #   전체 메모 목록 (열람 소스)
│  ├─ memo-<id>.json     #   메모 1건 = 파일 1개
│  └─ attachments/       #   첨부파일
├─ server.js             # (선택) 로컬 자체 호스팅용 Node 서버
└─ package.json
```

## 접근 암호 (가벼운 차단)

홈페이지에 들어가려면 잠금화면에서 암호를 입력해야 합니다. (기본: `leemgs75`)
바꾸려면 `docs/js/auth.js`의 `PASS_HASH`를 새 암호의 SHA-256 해시로 교체하세요.

```bash
printf '%s' '새암호' | sha256sum   # 출력된 해시를 PASS_HASH에 붙여넣기
```

> ⚠️ 정적 사이트라 브라우저에서만 검사하는 **가벼운 차단**입니다. 저장소가 공개면
> 데이터/설정 파일에 URL로 직접 접근할 수 있으니 기밀 보호용이 아닙니다.

## 토큰(PAT)으로 저장 활성화

저장·삭제는 저장소에 커밋하므로 **쓰기 권한 토큰(fine-grained PAT)** 이 필요합니다. (열람만 하면 불필요)

발급: GitHub → **Settings → Developer settings → Fine-grained personal access tokens**
→ Repository access: `mymemo` → **Repository permissions → Contents: Read and write**

토큰을 사용하는 방법은 두 가지입니다.

### 방법 A) repo 환경변수(Secret) + Actions 주입 — 팀 공용 (현재 기본)

토큰을 저장소에 저장해 두면, 배포 시 `docs/config.js`에 자동 주입되어
**누가 접속하든(암호만 알면) 저장 가능**합니다.

1. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `MYMEMO_WRITE_TOKEN`
   - Value: 위에서 만든 `github_pat_...`
2. **Settings → Pages → Build and deployment → Source: `GitHub Actions`** 로 변경
3. `main`에 push하면 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)이
   토큰을 주입해 Pages로 배포합니다. (토큰은 배포 결과물에만 있고 저장소에는 커밋되지 않음)

> 🔴 **보안 경고**: 이 방식은 토큰이 **공개된 `config.js`로 내려받힙니다**
> (`https://<user>.github.io/<repo>/config.js`). 접근 암호로도 막히지 않습니다.
> 반드시 **`mymemo` 저장소의 Contents R/W 로만 범위를 좁힌** 토큰을 쓰고,
> 유출 시 즉시 폐기(revoke)하세요. GitHub 비밀 스캐닝이 자동 폐기할 수도 있습니다.

### 방법 B) 브라우저에만 저장 — 개인용 (더 안전)

토큰을 공개하지 않고, **⚙ 관리자 설정 → GitHub 토큰**에 직접 입력합니다.
해당 브라우저의 localStorage에만 저장되어 외부로 노출되지 않습니다.
(방법 A의 Secret을 비워 두면 이 방식만 동작합니다. Pages Source는 `main`/`docs` 브랜치여도 됩니다.)

Owner/Repo는 접속 URL에서 자동 인식되며, 필요하면 **⚙ 관리자 설정**에서 바꿀 수 있습니다.

## 사용법

- 오른쪽 아래 **+** 버튼 → 제목·내용·태그·파일첨부 입력 → **저장 (Git 커밋)**
  - 저장 시 `memo-<id>.json` + 첨부파일 + `index.json`이 **하나의 커밋**으로 반영됩니다.
- 카드의 **삭제** 버튼 → 해당 파일 삭제 커밋
- **복사** 버튼 → 메모 내용을 클립보드로 복사
- 토큰이 없으면 **읽기 전용 모드**로 열람만 됩니다.

## (선택) 로컬 서버 모드

토큰 대신 로컬 PC에서 직접 git 커밋하고 싶다면 `server.js`를 쓸 수 있습니다.

```bash
node server.js                 # http://localhost:9999
GIT_PUSH=true node server.js   # 커밋 후 원격으로 push까지
```

그 후 **⚙ 관리자 설정 → 저장 방식: 로컬 서버**를 선택하고 서버 주소를 입력하세요.
이 경우 `./data/`에 파일을 쓰고 로컬 git으로 커밋합니다.
(정적 GitHub Pages에서는 서버가 없으므로 이 모드는 동작하지 않습니다.)
