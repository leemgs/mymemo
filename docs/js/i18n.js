/* Lightweight KO/EN translation for the static GitHub Pages app. */
(function () {
  "use strict";

  var STORAGE_KEY = "mymemo_lang";
  var translations = {
    "접근하려면 암호를 입력하세요": "Enter the password to continue",
    "입장하기": "Enter",
    "📢 모두의 메모 · 인가된 사용자만 접근하세요": "📢 Shared memos · Authorized users only",
    "암호가 올바르지 않습니다": "The password is incorrect",
    "관리자PC가 꺼져있으면 페이지는 쉽니다": "The page may be unavailable when the admin PC is offline",
    "⚙ 관리자 설정": "⚙ Admin settings",
    "GitHub에서 메모를 불러오는 중…": "Loading memos from GitHub…",
    "초": "s",
    "아직 메모가 없습니다. 오른쪽 아래": "No memos yet. Use the",
    "버튼으로 첫 메모를 남겨보세요.": "button at the bottom right to add one.",
    "더 보기": "Load more",
    "새 메모 작성": "New memo",
    "메모 수정": "Edit memo",
    "제목": "Title",
    "내용": "Content",
    "태그": "Tags",
    "색상": "Color",
    "포스트잇 색을 고르세요.": "Choose a sticky-note color.",
    "은 메모마다 색이 자동 배정됩니다.": "assigns a color to each memo.",
    "자동": "Auto",
    "기존 첨부파일": "Existing attachments",
    "체크를 해제하면 저장 시 해당 파일이 삭제됩니다.": "Uncheck a file to delete it when saving.",
    "파일 첨부": "Attach files",
    "첨부파일 추가": "Add attachments",
    "여러 파일 선택 가능 · 파일당 최대 10MB": "Multiple files allowed · 10 MB maximum per file",
    "취소": "Cancel",
    "저장 (Git 커밋)": "Save (Git commit)",
    "수정 저장 (Git 커밋)": "Save changes (Git commit)",
    "저장 방식": "Storage mode",
    "GitHub API (정적 호스팅 · GitHub Pages)": "GitHub API (static hosting · GitHub Pages)",
    "로컬 서버 (server.js)": "Local server (server.js)",
    "GitHub 토큰 (쓰기 권한)": "GitHub token (write access)",
    "API 서버 주소": "API server URL",
    "server.js를 실행 중인 관리자 PC의 주소입니다.": "The address of the admin PC running server.js.",
    "연결 확인": "Check connection",
    "저장": "Save",
    "👀 익명 접근": "👀 Anonymous access",
    "익명 접근 (로그인 접근 암호 불필요) 허용": "Allow anonymous access (no sign-in password)",
    "적용 (Git 커밋)": "Apply (Git commit)",
    "✏️ 익명 쓰기": "✏️ Anonymous write",
    "익명 쓰기 (토큰 없이 저장·수정·삭제) 허용": "Allow anonymous writing (save, edit, and delete without a token)",
    "🔑 접근 암호 변경": "🔑 Change access password",
    "암호 변경 (Git 커밋)": "Change password (Git commit)",
    "처리 중…": "Working…",
    "GitHub에 Git 커밋 중입니다. 잠시만 기다려 주세요.": "Committing to GitHub. Please wait.",
    "복사": "Copy",
    "수정": "Edit",
    "삭제": "Delete",
    "더 읽기": "Read more",
    "불러오는 중…": "Loading…",
    "노랑": "Yellow",
    "핑크": "Pink",
    "블루": "Blue",
    "그린": "Green",
    "오렌지": "Orange",
    "퍼플": "Purple",
    "민트": "Mint",
    "🔍 검색/필터 결과가 없습니다.": "🔍 No search or filter results.",
    "검색/필터 결과가 없습니다.": "No search or filter results.",
    "메모를 복사했습니다": "Memo copied",
    "복사에 실패했습니다": "Could not copy the memo",
    "내용을 입력하세요": "Please enter memo content",
    "10MB를 초과하는 파일이 있습니다": "A file exceeds the 10 MB limit",
    "수정 중...": "Saving changes...",
    "저장 중...": "Saving...",
    "수정 및 Git 커밋 완료": "Changes committed to Git",
    "저장 및 Git 커밋 완료": "Memo committed to Git",
    "삭제 및 Git 커밋 완료": "Memo deleted and committed to Git",
    "확인 중...": "Checking...",
    "설정을 저장했습니다": "Settings saved",
    "🔒 읽기 전용 모드입니다. 메모를 저장하려면 ⚙ 관리자 설정에서 GitHub 토큰을 입력하세요.": "🔒 Read-only mode. Add a GitHub token in ⚙ Admin settings to save memos.",
    "⚠ 관리자 PC(server.js)에 연결할 수 없어 읽기 전용입니다. ⚙ 관리자 설정에서 서버 주소를 확인하세요.": "⚠ Read-only mode because the admin PC (server.js) is unavailable. Check the server URL in ⚙ Admin settings.",
    "⚠ GitHub 토큰이 유효하지 않아(만료·폐기) 열람 전용으로 표시 중입니다. 새 토큰으로 갱신하세요. (공개 배포된 토큰은 GitHub 보안 스캐닝에 의해 자동 폐기될 수 있습니다.)": "⚠ Read-only mode because the GitHub token is invalid or expired. Update the token in Admin settings.",
    "본문을 불러오지 못했습니다": "Could not load memo content",
    "저장 실패": "Save failed",
    "수정 실패": "Update failed",
    "삭제 실패": "Delete failed",
    "먼저 서버에 연결하세요.": "Connect to the server first.",
    "먼저 쓰기 토큰을 저장하세요.": "Save a write token first.",
    "새 암호는 4자 이상이어야 합니다.": "The new password must contain at least 4 characters.",
    "새 암호 확인이 일치하지 않습니다.": "The password confirmation does not match.",
    "현재 암호가 올바르지 않습니다.": "The current password is incorrect.",
    "변경 실패": "Change failed",
    "(수정됨)": "(edited)"
  };

  var placeholders = {
    "암호를 입력하세요": "Enter password",
    "제목·내용·태그 검색": "Search title, content, or tags",
    "제목을 입력하세요 (선택)": "Enter a title (optional)",
    "메모 내용을 입력하세요": "Write your memo",
    "쉼표로 구분 (예: 반도체, 협약, 공지)": "Comma separated (e.g. project, idea, notice)",
    "예: http://10.253.2.128:9999": "e.g. http://10.253.2.128:9999",
    "현재 암호": "Current password",
    "새 암호 (4자 이상)": "New password (4+ characters)",
    "새 암호 확인": "Confirm new password"
  };

  var attributes = {
    "GitHub 저장소 열기": "Open GitHub repository",
    "GitHub 저장소": "GitHub repository",
    "검색 지우기": "Clear search",
    "새 메모 작성": "New memo",
    "언어 선택": "Language"
  };

  var saved = localStorage.getItem(STORAGE_KEY);
  var lang = saved === "ko" || saved === "en"
    ? saved
    : (/^en\b/i.test(navigator.language) ? "en" : "ko");
  var translating = false;

  function dynamicTranslation(value) {
    var match;
    if ((match = value.match(/^전체 (\d+)개 중 (\d+)개 표시 · 남은 (\d+)개$/))) {
      return "Showing " + match[2] + " of " + match[1] + " · " + match[3] + " remaining";
    }
    if ((match = value.match(/^전체 (\d+)개 모두 표시됨$/))) return "All " + match[1] + " memos shown";
    if ((match = value.match(/^(\d+)개$/))) return match[1] + (match[1] === "1" ? " memo" : " memos");
    if ((match = value.match(/^(.+) \(수정됨\)$/))) return match[1] + " (edited)";
    if (value === "이 메모를 삭제할까요? (Git에서도 삭제 커밋됩니다)") {
      return "Delete this memo? The deletion will also be committed to Git.";
    }
    if (value.indexOf("메모를 불러오지 못했습니다:") === 0) {
      return value.replace("메모를 불러오지 못했습니다:", "Could not load memos:")
        .replace("(⚙ 관리자 설정 확인)", "(check ⚙ Admin settings)");
    }
    return translations[value] || value;
  }

  function translateText(node) {
    if (lang !== "en" || !node.nodeValue || /^(SCRIPT|STYLE|CODE)$/.test(node.parentNode && node.parentNode.nodeName)) return;
    if (node.parentElement && node.parentElement.closest(".memo-title, .memo-content, .memo-tags, .memo-attachments")) return;
    var raw = node.nodeValue;
    var trimmed = raw.trim();
    if (!trimmed) return;
    var translated = dynamicTranslation(trimmed);
    if (translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
  }

  function translateElement(el) {
    if (!el || el.nodeType !== 1) return;
    ["placeholder", "title", "aria-label"].forEach(function (name) {
      var value = el.getAttribute(name);
      if (!value) return;
      var translated = name === "placeholder" ? placeholders[value] : attributes[value];
      if (translated) el.setAttribute(name, translated);
    });
  }

  function apply(root) {
    document.documentElement.lang = lang;
    document.title = lang === "en" ? "My Memo" : "My Memo";
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (lang !== "en") return;

    translating = true;
    var scope = root || document.body;
    if (scope.nodeType === 3) {
      translateText(scope);
    } else {
      translateElement(scope);
      scope.querySelectorAll && scope.querySelectorAll("[placeholder], [title], [aria-label]").forEach(translateElement);
      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) translateText(node);
    }
    translating = false;
  }

  window.mymemoI18n = {
    getLang: function () { return lang; },
    t: function (ko, en) { return lang === "en" ? (en || dynamicTranslation(ko)) : ko; },
    apply: apply
  };

  document.addEventListener("DOMContentLoaded", function () {
    apply(document.body);
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-lang");
        if (next === lang) return;
        localStorage.setItem(STORAGE_KEY, next);
        location.reload();
      });
    });

    if (lang === "en" && window.MutationObserver) {
      new MutationObserver(function (mutations) {
        if (translating) return;
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) { apply(node); });
          if (mutation.type === "characterData") apply(mutation.target);
        });
      }).observe(document.body, { childList: true, characterData: true, subtree: true });
    }
  });
})();
