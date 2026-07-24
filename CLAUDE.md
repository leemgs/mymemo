# mymemo — Claude Code 작업 지침

## Git 커밋 규칙

모든 커밋 메시지 끝에 반드시 아래 트레일러를 붙인다:

```
Signed-off-by: Geunsik Lim <leemgs@gmail.com>
```

Claude 자동 생성 푸터(`Co-Authored-By: Claude ...`, `Claude-Session: ...`)는 사용하지 않는다.

## 브랜치 정책

- 기능 개발은 `claude/<feature>` 브랜치에서 작업
- 최종 완료 후 `main` 브랜치에 push

## 프로젝트 개요

정적 GitHub Pages 메모 앱. 백엔드 없이 GitHub Contents/Git Data API로 읽기·쓰기.
- `docs/js/auth.js` — 접근 암호 게이트 / ALLOW_ANON / ALLOW_ANON_WRITE 플래그
- `docs/js/app.js` — 메인 앱 (i18n, 렌더링, GitHub API 연동)
- `docs/index.html` — 단일 페이지 HTML
- `docs/css/style.css` — 스타일
- `server.js` — 로컬 서버 모드 (선택)
