/* My Memo — client-side app.
 *
 * Runs entirely in the browser, so it works on static hosting like GitHub Pages
 * (https://<user>.github.io/<repo>/) with NO backend server.
 *
 *  - READ  : GitHub Contents API  GET /repos/{o}/{r}/contents/data/index.json
 *  - WRITE : GitHub Git Data API  (blob -> tree -> commit -> update ref)
 *            => a real git commit into ./data/ , straight from the browser.
 *
 * A Personal Access Token (fine-grained, Contents: Read and write) is required
 * ONLY for saving/deleting. Viewing a public repo needs no token.
 *
 * An optional "로컬 서버(server.js)" mode is also supported for self-hosting.
 */
(function () {
  "use strict";

  // ---- i18n ----
  var LANG_KEY = "mymemo_lang";
  var currentLang = localStorage.getItem(LANG_KEY) || "ko";
  var I18N = {
    ko: {
      "server.note": "관리자PC가 꺼져있으면 페이지는 쉽니다",
      "admin.btn": "⚙ 관리자 설정",
      "github.title": "GitHub 저장소 열기",
      "lock.sub": "접근하려면 암호를 입력하세요",
      "lock.placeholder": "암호를 입력하세요",
      "lock.btn": "입장하기",
      "lock.foot": "📢 모두의 메모 · 인가된 사용자만 접근하세요",
      "search.placeholder": "제목·내용·태그 검색",
      "loading.text": "GitHub에서 메모를 불러오는 중…",
      "empty.text": "아직 메모가 없습니다. 오른쪽 아래 <strong>+</strong> 버튼으로 첫 메모를 남겨보세요.",
      "loadmore.btn": "더 보기",
      "fab.title": "새 메모 작성",
      "memo.title.label": "제목",
      "memo.title.ph": "제목을 입력하세요 (선택)",
      "memo.content.label": "내용",
      "memo.content.ph": "메모 내용을 입력하세요",
      "memo.tags.label": "태그",
      "memo.tags.ph": "쉼표로 구분 (예: 반도체, 협약, 공지)",
      "memo.color.label": "색상",
      "memo.color.hint": "포스트잇 색을 고르세요. <b>자동</b>은 메모마다 색이 자동 배정됩니다.",
      "memo.existattach.label": "기존 첨부파일",
      "memo.existattach.hint": "체크를 해제하면 저장 시 해당 파일이 삭제됩니다.",
      "memo.files.label": "파일 첨부",
      "memo.files.add": "첨부파일 추가",
      "memo.files.hint": "여러 파일 선택 가능 · 파일당 최대 10MB",
      "btn.cancel": "취소",
      "admin.check.btn": "연결 확인",
      "admin.save.btn": "저장",
      "anon.label": "👀 익명 접근",
      "anon.toggle": "익명 접근 (로그인 접근 암호 불필요) 허용",
      "anonwrite.label": "✏️ 익명 쓰기",
      "anonwrite.toggle": "익명 쓰기 (토큰 없이 저장·수정·삭제) 허용",
      "apply.btn": "적용 (Git 커밋)",
      "pw.label": "🔑 접근 암호 변경",
      "pw.current.ph": "현재 암호",
      "pw.new.ph": "새 암호 (4자 이상)",
      "pw.new2.ph": "새 암호 확인",
      "pw.change.btn": "암호 변경 (Git 커밋)",
      "busy.sub": "GitHub에 Git 커밋 중입니다. 잠시만 기다려 주세요.",
      "card.more": "더 읽기",
      "card.copy": "⧉ 복사",
      "card.edit": "수정",
      "card.del": "삭제",
      "card.modified": "(수정됨)",
      "card.am": "오전",
      "card.pm": "오후",
      "modal.new": "새 메모 작성",
      "modal.edit": "메모 수정",
      "save.btn": "저장 (Git 커밋)",
      "update.btn": "수정 저장 (Git 커밋)",
      "saving": "저장 중...",
      "updating": "수정 중...",
      "confirm.del": "이 메모를 삭제할까요? (Git에서도 삭제 커밋됩니다)",
      "toast.copied": "메모를 복사했습니다",
      "toast.copy.fail": "복사에 실패했습니다",
      "toast.deleted": "삭제 및 Git 커밋 완료",
      "toast.saved": "저장 및 Git 커밋 완료",
      "toast.updated": "수정 및 Git 커밋 완료",
      "toast.need.content": "내용을 입력하세요",
      "toast.file.too.big": "10MB를 초과하는 파일이 있습니다",
      "toast.settings.saved": "설정을 저장했습니다",
      "toast.anon.done": "익명 접근 설정 변경 및 Git 커밋 완료",
      "toast.anonwrite.done": "익명 쓰기 설정 변경 및 Git 커밋 완료",
      "toast.pw.done": "접근 암호 변경 및 Git 커밋 완료",
      "busy.del": "메모를 삭제하고 Git에 커밋하는 중…",
      "busy.save": "메모를 저장하고 Git에 커밋하는 중…",
      "busy.update": "메모를 수정하고 Git에 커밋하는 중…",
      "busy.pw": "접근 암호를 변경하고 Git에 커밋하는 중…",
      "busy.anon": "익명 접근 설정을 변경하고 Git에 커밋하는 중…",
      "busy.anonwrite": "익명 쓰기 설정을 변경하고 Git에 커밋하는 중…",
      "banner.server.offline": "⚠ 관리자 PC(server.js)에 연결할 수 없어 읽기 전용입니다. ⚙ 관리자 설정에서 서버 주소를 확인하세요.",
      "banner.token.invalid": "⚠ GitHub 토큰이 유효하지 않아(만료·폐기) 열람 전용으로 표시 중입니다. 새 토큰으로 갱신하세요.",
      "banner.readonly": "🔒 읽기 전용 모드입니다. 메모를 저장하려면 ⚙ 관리자 설정에서 GitHub 토큰을 입력하세요.",
      "err.load.fail": "⚠ 메모를 불러오지 못했습니다",
      "err.full.fail": "본문을 불러오지 못했습니다",
      "err.no.memo": "수정할 메모를 찾을 수 없습니다",
      "err.need.token": "저장하려면 GitHub 토큰이 필요합니다",
      "err.server.offline": "서버가 오프라인이라 저장할 수 없습니다",
      "err.need.token.first": "먼저 쓰기 토큰을 저장하세요.",
      "err.need.server": "먼저 서버에 연결하세요.",
      "err.pw.wrong": "현재 암호가 올바르지 않습니다.",
      "err.pw.short": "새 암호는 4자 이상이어야 합니다.",
      "err.pw.mismatch": "새 암호 확인이 일치하지 않습니다.",
      "ok.pw.changed": "✓ 변경 완료. 배포 재빌드 후(수 분) 모든 기기에 적용됩니다.",
      "ok.anon.on": "✓ 익명 접근 허용 — 배포 재빌드 후(수 분) 모든 방문자에게 적용됩니다.",
      "ok.anon.off": "✓ 익명 접근 차단 — 배포 재빌드 후(수 분) 모든 방문자에게 적용됩니다.",
      "ok.anonwrite.on": "✓ 익명 쓰기 허용 — 배포 재빌드 후(수 분) 모든 방문자에게 적용됩니다.",
      "ok.anonwrite.off": "✓ 익명 쓰기 차단 — 배포 재빌드 후(수 분) 모든 방문자에게 적용됩니다.",
      "conn.checking": "확인 중...",
      "conn.server.ok": "✓ 서버 연결됨 · ",
      "conn.server.fail": "✗ 서버에 연결할 수 없습니다.",
      "conn.github.ok.token": " · 토큰 인증됨",
      "conn.github.ok.notoken": " · 열람 전용(토큰 없음)",
      "loadmore.info": function(total, shown, left) { return "전체 " + total + "개 중 " + shown + "개 표시 · 남은 " + left + "개"; },
      "loadmore.all": function(total) { return "전체 " + total + "개 모두 표시됨"; },
      "lock.error": "암호가 올바르지 않습니다",
      "search.empty": "🔍 검색/필터 결과가 없습니다."
    },
    en: {
      "server.note": "The page may be unavailable when the admin PC is offline",
      "admin.btn": "⚙ Admin Settings",
      "github.title": "Open GitHub repository",
      "lock.sub": "Enter password to access",
      "lock.placeholder": "Enter password",
      "lock.btn": "Enter",
      "lock.foot": "📢 My Memo · Authorized users only",
      "search.placeholder": "Search title, content, or tags",
      "loading.text": "Loading memos from GitHub…",
      "empty.text": "No memos yet. Use the <strong>+</strong> button at the bottom right to add your first memo.",
      "loadmore.btn": "Load more",
      "fab.title": "Add new memo",
      "memo.title.label": "Title",
      "memo.title.ph": "Title (optional)",
      "memo.content.label": "Content",
      "memo.content.ph": "Enter memo content",
      "memo.tags.label": "Tags",
      "memo.tags.ph": "Comma-separated (e.g. work, meeting, idea)",
      "memo.color.label": "Color",
      "memo.color.hint": "Choose sticky note color. <b>Auto</b> assigns a color per memo.",
      "memo.existattach.label": "Existing attachments",
      "memo.existattach.hint": "Unchecking will delete the file on save.",
      "memo.files.label": "Attach file",
      "memo.files.add": "Add attachment",
      "memo.files.hint": "Multiple files · Max 10MB per file",
      "btn.cancel": "Cancel",
      "admin.check.btn": "Check connection",
      "admin.save.btn": "Save",
      "anon.label": "👀 Anonymous Access",
      "anon.toggle": "Allow anonymous access (no login password required)",
      "anonwrite.label": "✏️ Anonymous Write",
      "anonwrite.toggle": "Allow anonymous write (save/edit/delete without token)",
      "apply.btn": "Apply (Git commit)",
      "pw.label": "🔑 Change Access Password",
      "pw.current.ph": "Current password",
      "pw.new.ph": "New password (min 4 chars)",
      "pw.new2.ph": "Confirm new password",
      "pw.change.btn": "Change Password (Git commit)",
      "busy.sub": "Committing to GitHub. Please wait.",
      "card.more": "Read more",
      "card.copy": "⧉ Copy",
      "card.edit": "Edit",
      "card.del": "Delete",
      "card.modified": "(edited)",
      "card.am": "AM",
      "card.pm": "PM",
      "modal.new": "New Memo",
      "modal.edit": "Edit Memo",
      "save.btn": "Save (Git commit)",
      "update.btn": "Update (Git commit)",
      "saving": "Saving...",
      "updating": "Updating...",
      "confirm.del": "Delete this memo? (Will also be removed from Git)",
      "toast.copied": "Memo copied",
      "toast.copy.fail": "Copy failed",
      "toast.deleted": "Deleted and committed to Git",
      "toast.saved": "Saved and committed to Git",
      "toast.updated": "Updated and committed to Git",
      "toast.need.content": "Please enter content",
      "toast.file.too.big": "A file exceeds the 10MB limit",
      "toast.settings.saved": "Settings saved",
      "toast.anon.done": "Anonymous access setting committed to Git",
      "toast.anonwrite.done": "Anonymous write setting committed to Git",
      "toast.pw.done": "Password changed and committed to Git",
      "busy.del": "Deleting memo and committing to Git…",
      "busy.save": "Saving memo and committing to Git…",
      "busy.update": "Updating memo and committing to Git…",
      "busy.pw": "Changing password and committing to Git…",
      "busy.anon": "Updating anonymous access setting and committing to Git…",
      "busy.anonwrite": "Updating anonymous write setting and committing to Git…",
      "banner.server.offline": "⚠ Cannot connect to admin PC (server.js) — read-only mode. Check the server address in ⚙ Admin Settings.",
      "banner.token.invalid": "⚠ GitHub token is invalid (expired/revoked) — read-only mode. Please update your token.",
      "banner.readonly": "🔒 Read-only mode. To save memos, enter a GitHub token in ⚙ Admin Settings.",
      "err.load.fail": "⚠ Failed to load memos",
      "err.full.fail": "Failed to load memo content",
      "err.no.memo": "Memo not found",
      "err.need.token": "A GitHub token is required to save",
      "err.server.offline": "Cannot save — server is offline",
      "err.need.token.first": "Please save a write token first.",
      "err.need.server": "Please connect to the server first.",
      "err.pw.wrong": "Current password is incorrect.",
      "err.pw.short": "New password must be at least 4 characters.",
      "err.pw.mismatch": "New passwords do not match.",
      "ok.pw.changed": "✓ Done. Will apply to all devices after rebuild (a few minutes).",
      "ok.anon.on": "✓ Anonymous access enabled — will apply after rebuild (a few minutes).",
      "ok.anon.off": "✓ Anonymous access disabled — will apply after rebuild (a few minutes).",
      "ok.anonwrite.on": "✓ Anonymous write enabled — will apply after rebuild (a few minutes).",
      "ok.anonwrite.off": "✓ Anonymous write disabled — will apply after rebuild (a few minutes).",
      "conn.checking": "Checking...",
      "conn.server.ok": "✓ Server connected · ",
      "conn.server.fail": "✗ Cannot connect to server.",
      "conn.github.ok.token": " · token authenticated",
      "conn.github.ok.notoken": " · read-only (no token)",
      "loadmore.info": function(total, shown, left) { return "Showing " + shown + " of " + total + " · " + left + " more"; },
      "loadmore.all": function(total) { return "All " + total + " memos shown"; },
      "lock.error": "Incorrect password",
      "search.empty": "🔍 No results for current search/filter."
    }
  };
  function T(key) {
    var t = I18N[currentLang] || I18N.ko;
    return (key in t) ? t[key] : (I18N.ko[key] || key);
  }
  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      el.innerHTML = T(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function(el) {
      el.placeholder = T(el.getAttribute("data-i18n-ph"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
      el.title = T(el.getAttribute("data-i18n-title"));
    });
    // Mark active lang button
    var koBtn = document.getElementById("langKo"), enBtn = document.getElementById("langEn");
    if (koBtn) koBtn.classList.toggle("active", currentLang === "ko");
    if (enBtn) enBtn.classList.toggle("active", currentLang === "en");
  }
  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    applyI18n();
    updateBanner();
    updateLoadMore();
    if (currentMemos && currentMemos.length) refreshView();
  }

  var CFG_KEY = "mymemo_cfg";

  // ---- config ----
  function detectDefaults() {
    var owner = "leemgs", repo = "mymemo";
    var host = location.hostname;
    if (/\.github\.io$/i.test(host)) {
      owner = host.split(".")[0];
      var seg = location.pathname.split("/").filter(Boolean);
      if (seg[0]) repo = seg[0];
    }
    return { owner: owner, repo: repo };
  }
  function loadCfg() {
    var d = detectDefaults();
    // Config injected at deploy time from repo Secret (docs/config.js).
    var inj = window.MYMEMO_CONFIG || {};
    var base = { mode: "github", owner: d.owner, repo: d.repo, branch: "main",
                 dataDir: "data", token: "", apiBase: "" };
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); } catch (e) {}
    // Precedence: local admin overrides > injected repo config > detected defaults.
    var merged = Object.assign(base, cleanEmpty(inj), saved);
    // Injected token is the fallback when the admin hasn't set one on this browser.
    if (!merged.token && inj.token) merged.token = inj.token;
    return merged;
  }
  // Drop empty-string fields so they don't override real defaults.
  function cleanEmpty(o) {
    var r = {};
    Object.keys(o || {}).forEach(function (k) { if (o[k] !== "" && o[k] != null) r[k] = o[k]; });
    return r;
  }
  function saveCfg() {
    var inj = window.MYMEMO_CONFIG || {};
    var out = Object.assign({}, cfg);
    // Don't cache the injected Secret token; it's re-applied from config.js on load.
    if (inj.token && out.token === inj.token) out.token = "";
    localStorage.setItem(CFG_KEY, JSON.stringify(out));
  }

  var cfg = loadCfg();
  var currentMemos = [];
  var readOnly = true;
  var serverUp = false;
  var tokenInvalid = false; // set when GitHub rejects the token (401) during read

  // ---- DOM helpers ----
  var $ = function (id) { return document.getElementById(id); };
  var memoGrid = $("memoGrid");
  var emptyState = $("emptyState");
  var statusBanner = $("statusBanner");
  function toast(msg, isErr) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (isErr ? " err" : "");
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 3200);
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    if (currentLang === "en") {
      return new Intl.DateTimeFormat("en", {
        year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }).format(d);
    }
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    var h = d.getHours(), ampm = h < 12 ? T("card.am") : T("card.pm"), h12 = h % 12 || 12;
    return d.getFullYear() + ". " + p(d.getMonth() + 1) + ". " + p(d.getDate()) +
      ". " + ampm + " " + p(h12) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function humanSize(b) {
    if (!b) return "";
    var u = ["B", "KB", "MB", "GB"], i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return b.toFixed(b < 10 && i > 0 ? 1 : 0) + u[i];
  }
  function safeName(name) {
    return String(name || "file").replace(/[^\w.\-가-힣]+/g, "_").slice(-120) || "file";
  }
  function newId() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var stamp = "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
      p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    return stamp + "-" + Math.random().toString(36).slice(2, 6);
  }
  // UTF-8 safe base64
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }
  function sha256Hex(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }
  // Rewrite the PASS_HASH line (and drop any plaintext comment) in auth.js source.
  var PASS_HASH_RE = /var PASS_HASH = "[0-9a-fA-F]{64}"/;
  function applyNewPassHash(src, newHash) {
    return src
      .replace(PASS_HASH_RE, 'var PASS_HASH = "' + newHash + '"')
      .replace(/\/\/ SHA-256\("[^"]*"\)/, "// SHA-256 of the access password (변경: ⚙ 관리자 설정 → 접근 암호 변경)");
  }

  // ---- slim index (B: 목록엔 요약만, 본문은 지연 로딩) ----
  var SNIPPET_LEN = 180;
  // 전체 메모 → index.json 용 경량 항목(본문 대신 snippet + more 플래그).
  function toIndexEntry(m) {
    var c = String(m.content || "");
    var more = c.length > SNIPPET_LEN;
    return {
      id: m.id, title: m.title || "",
      snippet: more ? c.slice(0, SNIPPET_LEN) : c, more: more,
      tags: m.tags || [], color: m.color || "",
      attachments: m.attachments || [],
      createdAt: m.createdAt, updatedAt: m.updatedAt
    };
  }
  // 목록 항목 m 의 전체 본문을 보장한다(필요 시 memo-<id>.json 을 지연 로딩해 m 갱신).
  function ensureFull(m) {
    if (m.content != null && !m.more) return Promise.resolve(m);
    return store.getFull(m.id).then(function (full) {
      m.content = full.content || "";
      m.more = false;
      if (full.attachments) m.attachments = full.attachments;
      if (full.tags) m.tags = full.tags;
      if (full.color != null) m.color = full.color;
      return m;
    });
  }

  // ---- GitHub API ----
  var GH = "https://api.github.com";
  function ghHeaders() {
    var h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (cfg.token) h["Authorization"] = "Bearer " + cfg.token;
    return h;
  }
  function ghApi(method, path, body) {
    var opt = { method: method, headers: ghHeaders(), cache: "no-store" };
    if (body) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    return fetch(GH + "/repos/" + cfg.owner + "/" + cfg.repo + path, opt).then(function (r) {
      if (r.status === 204) return null;
      return r.json().then(function (data) {
        if (!r.ok) {
          var msg = (data && data.message) || ("HTTP " + r.status);
          if (r.status === 403 && /rate limit/i.test(msg)) msg = "GitHub API 호출 한도 초과. 잠시 후 다시 시도하거나 토큰을 설정하세요.";
          if (r.status === 401) msg = "GitHub 토큰이 유효하지 않습니다 (401).";
          var err = new Error(msg); err.status = r.status; throw err;
        }
        return data;
      });
    });
  }

  // Create ONE commit containing all given file changes.
  //   changes: [{ path, contentBase64 }]  (add/update)  or  { path, remove:true }
  function commitFiles(message, changes) {
    var latestSha, baseTree;
    return ghApi("GET", "/git/ref/heads/" + encodeURIComponent(cfg.branch))
      .then(function (ref) {
        latestSha = ref.object.sha;
        return ghApi("GET", "/git/commits/" + latestSha);
      })
      .then(function (commit) {
        baseTree = commit.tree.sha;
        // Create blobs for added/updated files (sequentially to keep it simple).
        var tree = [];
        var chain = Promise.resolve();
        changes.forEach(function (c) {
          chain = chain.then(function () {
            if (c.remove) { tree.push({ path: c.path, mode: "100644", type: "blob", sha: null }); return; }
            return ghApi("POST", "/git/blobs", { content: c.contentBase64, encoding: "base64" })
              .then(function (blob) { tree.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha }); });
          });
        });
        return chain.then(function () { return tree; });
      })
      .then(function (tree) { return ghApi("POST", "/git/trees", { base_tree: baseTree, tree: tree }); })
      .then(function (t) { return ghApi("POST", "/git/commits", { message: message, tree: t.sha, parents: [latestSha] }); })
      .then(function (c) { return ghApi("PATCH", "/git/refs/heads/" + encodeURIComponent(cfg.branch), { sha: c.sha }); });
  }

  function rawList() {
    // Fallback read via raw CDN (no API rate limit; may lag ~minutes on updates).
    var url = "https://raw.githubusercontent.com/" + cfg.owner + "/" + cfg.repo + "/" +
      cfg.branch + "/" + cfg.dataDir + "/index.json?t=" + new Date().getTime();
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (r.status === 404) return [];
      if (!r.ok) throw new Error("raw HTTP " + r.status);
      return r.json().then(function (j) { return j.memos || []; });
    });
  }
  function githubList() {
    // cache-buster(_=…) + no-store 로 브라우저/프록시 캐시된 옛 index.json 을 피합니다.
    return ghApi("GET", "/contents/" + cfg.dataDir + "/index.json?ref=" + encodeURIComponent(cfg.branch) + "&_=" + new Date().getTime())
      .then(function (res) { tokenInvalid = false; return (JSON.parse(b64decode(res.content)).memos) || []; })
      .catch(function (e) {
        if (e.status === 404) return [];
        // 401: 토큰이 만료/폐기됨. 읽기는 공개라 토큰이 필요 없으므로 열람은 계속되도록 폴백.
        if (e.status === 401) { tokenInvalid = true; return rawList(); }
        // 403(API 한도) / 네트워크 오류 → raw CDN 폴백.
        if (e.status === 403 || e.status == null) return rawList();
        throw e;
      });
  }
  function githubCreate(payload) {
    return githubList().then(function (memos) {
      var id = newId(), attachments = [], changes = [];
      (payload.files || []).forEach(function (f, i) {
        var b64 = (f.dataUrl.split(",")[1]) || "";
        var stored = id + "__" + i + "__" + safeName(f.name);
        changes.push({ path: cfg.dataDir + "/attachments/" + stored, contentBase64: b64 });
        attachments.push({ name: f.name, size: f.size, stored: stored });
      });
      var memo = { id: id, title: payload.title || "", content: payload.content,
                   tags: payload.tags || [], color: payload.color || "",
                   attachments: attachments, createdAt: new Date().toISOString() };
      changes.push({ path: cfg.dataDir + "/memo-" + id + ".json", contentBase64: b64encode(JSON.stringify(memo, null, 2)) });
      var newMemos = [toIndexEntry(memo)].concat(memos);
      changes.push({ path: cfg.dataDir + "/index.json", contentBase64: b64encode(JSON.stringify({ memos: newMemos }, null, 2)) });
      var title = memo.title || memo.content.slice(0, 30).replace(/\s+/g, " ");
      return commitFiles('memo: add "' + title + '" (' + id + ")", changes).then(function () { return memo; });
    });
  }
  function githubRemove(id) {
    return githubList().then(function (memos) {
      var memo = memos.filter(function (m) { return m.id === id; })[0];
      var changes = [{ path: cfg.dataDir + "/memo-" + id + ".json", remove: true }];
      if (memo) (memo.attachments || []).forEach(function (a) {
        changes.push({ path: cfg.dataDir + "/attachments/" + a.stored, remove: true });
      });
      var newMemos = memos.filter(function (m) { return m.id !== id; });
      changes.push({ path: cfg.dataDir + "/index.json", contentBase64: b64encode(JSON.stringify({ memos: newMemos }, null, 2)) });
      return commitFiles("memo: remove " + id, changes);
    });
  }
  function githubUpdate(id, payload) {
    return githubList().then(function (memos) {
      var idx = -1, existing = null;
      memos.forEach(function (m, i) { if (m.id === id) { existing = m; idx = i; } });
      if (!existing) throw new Error("수정할 메모를 찾을 수 없습니다");

      var keep = payload.keep || [];
      var changes = [];
      // Attachments to keep (checked), and delete the rest.
      var attachments = (existing.attachments || []).filter(function (a) { return keep.indexOf(a.stored) !== -1; });
      (existing.attachments || []).forEach(function (a) {
        if (keep.indexOf(a.stored) === -1) changes.push({ path: cfg.dataDir + "/attachments/" + a.stored, remove: true });
      });
      // Newly added attachments.
      (payload.files || []).forEach(function (f, i) {
        var b64 = (f.dataUrl.split(",")[1]) || "";
        var stored = id + "__n" + Date.now() + i + "__" + safeName(f.name);
        changes.push({ path: cfg.dataDir + "/attachments/" + stored, contentBase64: b64 });
        attachments.push({ name: f.name, size: f.size, stored: stored });
      });

      var memo = {
        id: id,
        title: payload.title || "",
        content: payload.content,
        tags: payload.tags || [],
        color: payload.color || "",
        attachments: attachments,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      };
      changes.push({ path: cfg.dataDir + "/memo-" + id + ".json", contentBase64: b64encode(JSON.stringify(memo, null, 2)) });
      var newMemos = memos.slice();
      newMemos[idx] = toIndexEntry(memo);
      changes.push({ path: cfg.dataDir + "/index.json", contentBase64: b64encode(JSON.stringify({ memos: newMemos }, null, 2)) });
      var title = memo.title || memo.content.slice(0, 30).replace(/\s+/g, " ");
      return commitFiles('memo: edit "' + title + '" (' + id + ")", changes).then(function () { return memo; });
    });
  }
  // 개별 메모 전체 본문 로드(지연). contents API 우선, 실패 시 raw CDN 폴백.
  function githubGetFull(id) {
    return ghApi("GET", "/contents/" + cfg.dataDir + "/memo-" + encodeURIComponent(id) + ".json?ref=" + encodeURIComponent(cfg.branch) + "&_=" + new Date().getTime())
      .then(function (res) { return JSON.parse(b64decode(res.content)); })
      .catch(function (e) {
        var url = "https://raw.githubusercontent.com/" + cfg.owner + "/" + cfg.repo + "/" +
          cfg.branch + "/" + cfg.dataDir + "/memo-" + id + ".json?t=" + new Date().getTime();
        return fetch(url, { cache: "no-store" }).then(function (r) {
          if (!r.ok) throw new Error("본문을 불러오지 못했습니다"); return r.json();
        });
      });
  }
  // Commit a new access-password hash into docs/js/auth.js (global, all devices).
  function githubChangePassword(newHash) {
    return ghApi("GET", "/contents/docs/js/auth.js?ref=" + encodeURIComponent(cfg.branch) + "&_=" + new Date().getTime())
      .then(function (res) {
        var src = b64decode(res.content);
        if (!PASS_HASH_RE.test(src)) throw new Error("auth.js에서 PASS_HASH를 찾을 수 없습니다");
        var updated = applyNewPassHash(src, newHash);
        return commitFiles("chore: change access password", [
          { path: "docs/js/auth.js", contentBase64: b64encode(updated) }
        ]);
      });
  }
  // Toggle anonymous access by committing the ALLOW_ANON flag in docs/js/auth.js.
  var ALLOW_ANON_RE = /var ALLOW_ANON = (?:true|false);/;
  function githubSetAllowAnon(allow) {
    return ghApi("GET", "/contents/docs/js/auth.js?ref=" + encodeURIComponent(cfg.branch) + "&_=" + new Date().getTime())
      .then(function (res) {
        var src = b64decode(res.content);
        if (!ALLOW_ANON_RE.test(src)) throw new Error("auth.js에서 ALLOW_ANON을 찾을 수 없습니다");
        var updated = src.replace(ALLOW_ANON_RE, "var ALLOW_ANON = " + (allow ? "true" : "false") + ";");
        return commitFiles("chore: " + (allow ? "enable" : "disable") + " anonymous access", [
          { path: "docs/js/auth.js", contentBase64: b64encode(updated) }
        ]);
      });
  }

  // Toggle anonymous write by committing the ALLOW_ANON_WRITE flag in docs/js/auth.js.
  var ALLOW_ANON_WRITE_RE = /var ALLOW_ANON_WRITE = (?:true|false);/;
  function githubSetAllowAnonWrite(allow) {
    return ghApi("GET", "/contents/docs/js/auth.js?ref=" + encodeURIComponent(cfg.branch) + "&_=" + new Date().getTime())
      .then(function (res) {
        var src = b64decode(res.content);
        if (!ALLOW_ANON_WRITE_RE.test(src)) throw new Error("auth.js에서 ALLOW_ANON_WRITE를 찾을 수 없습니다");
        var updated = src.replace(ALLOW_ANON_WRITE_RE, "var ALLOW_ANON_WRITE = " + (allow ? "true" : "false") + ";");
        return commitFiles("chore: " + (allow ? "enable" : "disable") + " anonymous write", [
          { path: "docs/js/auth.js", contentBase64: b64encode(updated) }
        ]);
      });
  }

  // ---- local server (optional self-host) ----
  function sbase() { return (cfg.apiBase || "").replace(/\/+$/, ""); }
  function serverList() {
    return fetch(sbase() + "/api/memos", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("server"); serverUp = true; return r.json().then(function (j) { return j.memos || []; });
    });
  }
  function serverGetFull(id) {
    return fetch(sbase() + "/data/memo-" + encodeURIComponent(id) + ".json?t=" + new Date().getTime(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("본문을 불러오지 못했습니다"); return r.json(); });
  }
  function serverCreate(payload) {
    return fetch(sbase() + "/api/memos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "저장 실패"); return j.memo; }); });
  }
  function serverRemove(id) {
    return fetch(sbase() + "/api/memos/" + encodeURIComponent(id), { method: "DELETE" })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "삭제 실패"); }); });
  }
  function serverUpdate(id, payload) {
    return fetch(sbase() + "/api/memos/" + encodeURIComponent(id), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "수정 실패"); return j.memo; }); });
  }
  function serverChangePassword(newHash) {
    return fetch(sbase() + "/api/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: newHash }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "암호 변경 실패"); }); });
  }
  function serverSetAllowAnon(allow) {
    return fetch(sbase() + "/api/anon", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allow: !!allow }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "변경 실패"); }); });
  }
  function serverSetAllowAnonWrite(allow) {
    return fetch(sbase() + "/api/anon-write", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allow: !!allow }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "변경 실패"); }); });
  }

  // ---- store abstraction ----
  var store = {
    canWrite: function () {
      if (window.MYMEMO_ALLOW_ANON_WRITE) return true;
      return cfg.mode === "server" ? serverUp : (!!cfg.token && !tokenInvalid);
    },
    attachmentUrl: function (stored) {
      if (cfg.mode === "server") return sbase() + "/data/attachments/" + encodeURIComponent(stored);
      return "https://raw.githubusercontent.com/" + cfg.owner + "/" + cfg.repo + "/" +
        cfg.branch + "/" + cfg.dataDir + "/attachments/" + stored;
    },
    list: function () { return cfg.mode === "server" ? serverList() : githubList(); },
    getFull: function (id) { return cfg.mode === "server" ? serverGetFull(id) : githubGetFull(id); },
    create: function (p) { return cfg.mode === "server" ? serverCreate(p) : githubCreate(p); },
    update: function (id, p) { return cfg.mode === "server" ? serverUpdate(id, p) : githubUpdate(id, p); },
    remove: function (id) { return cfg.mode === "server" ? serverRemove(id) : githubRemove(id); },
    changePassword: function (h) { return cfg.mode === "server" ? serverChangePassword(h) : githubChangePassword(h); },
    setAllowAnon: function (a) { return cfg.mode === "server" ? serverSetAllowAnon(a) : githubSetAllowAnon(a); },
    setAllowAnonWrite: function (a) { return cfg.mode === "server" ? serverSetAllowAnonWrite(a) : githubSetAllowAnonWrite(a); }
  };

  // ---- rendering (progressive: PAGE_SIZE 씩 점진적으로 그림) ----
  // 메모가 많아도 한 번에 전부 DOM 에 그리지 않고, 초기 PAGE_SIZE 개만 그린 뒤
  // 스크롤(IntersectionObserver) 또는 "더 보기" 버튼으로 이어서 렌더한다.
  var PAGE_SIZE = 30;
  var renderList = [];
  var renderedCount = 0;
  var moreObserver = null;

  function appendCards(n) {
    var frag = document.createDocumentFragment();
    var end = Math.min(renderList.length, renderedCount + n);
    for (var i = renderedCount; i < end; i++) frag.appendChild(card(renderList[i]));
    memoGrid.appendChild(frag);
    renderedCount = end;
  }
  function updateLoadMore() {
    var wrap = $("loadMoreWrap");
    if (!wrap) return;
    var remaining = renderList.length - renderedCount;
    if (remaining > 0) {
      wrap.hidden = false;
      $("loadMoreBtn").hidden = false;
      $("loadMoreInfo").textContent = T("loadmore.info")(renderList.length, renderedCount, remaining);
    } else if (renderList.length > PAGE_SIZE) {
      wrap.hidden = false;
      $("loadMoreBtn").hidden = true;
      $("loadMoreInfo").textContent = T("loadmore.all")(renderList.length);
    } else {
      wrap.hidden = true;
    }
  }
  // 뷰포트가 다 안 찼는데 남은 항목이 있으면 계속 채운다(초기/짧은 목록/무한스크롤 보조).
  function fillViewport() {
    var sentinel = $("scrollSentinel");
    if (!sentinel) { updateLoadMore(); return; }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var guard = 0;
    while (renderedCount < renderList.length && guard < 100) {
      if (sentinel.getBoundingClientRect().top > vh + 300) break;
      appendCards(PAGE_SIZE);
      guard++;
    }
    updateLoadMore();
  }
  function loadMore() {
    if (renderedCount >= renderList.length) return;
    appendCards(PAGE_SIZE);
    fillViewport();
  }
  function ensureObserver() {
    if (moreObserver || !("IntersectionObserver" in window)) return;
    var sentinel = $("scrollSentinel");
    if (!sentinel) return;
    moreObserver = new IntersectionObserver(function (entries) {
      if (entries[0] && entries[0].isIntersecting) loadMore();
    }, { rootMargin: "300px 0px" });
    moreObserver.observe(sentinel);
  }
  function render(memos) {
    renderList = memos || [];
    memoGrid.innerHTML = "";
    if (!renderList.length) {
      emptyState.hidden = false;
      renderedCount = 0;
      updateLoadMore();
      return;
    }
    emptyState.hidden = true;
    // 최초 로드는 PAGE_SIZE, 재렌더(수정/삭제 등) 시엔 이전에 보이던 개수를 유지해 위치 급변을 막는다.
    var target = Math.min(renderList.length, Math.max(PAGE_SIZE, renderedCount));
    renderedCount = 0;
    appendCards(target);
    ensureObserver();
    fillViewport();
  }

  // ---- search & tag filter (C: 로드된 목록을 클라이언트에서 즉시 필터) ----
  // 슬림 인덱스라 본문은 요약(snippet) 범위까지만 검색된다(전체 본문은 지연 로딩).
  var activeQuery = "";
  var activeTags = {};       // { tag: true } 선택된 태그
  var activeTagCount = 0;
  var EMPTY_DEFAULT_HTML = (emptyState.querySelector("p") || {}).innerHTML || "";

  function buildTagFilter() {
    var wrap = $("tagFilter");
    if (!wrap) return;
    var counts = {};
    currentMemos.forEach(function (m) {
      (m.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });
    // 더 이상 없는 태그는 선택 해제.
    Object.keys(activeTags).forEach(function (t) { if (!counts[t]) { delete activeTags[t]; } });
    activeTagCount = Object.keys(activeTags).length;
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || (a < b ? -1 : 1); });
    wrap.innerHTML = "";
    tags.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tag-chip" + (activeTags[t] ? " active" : "");
      b.textContent = "#" + t + " (" + counts[t] + ")";
      b.addEventListener("click", function () {
        if (activeTags[t]) { delete activeTags[t]; } else { activeTags[t] = true; }
        b.classList.toggle("active");
        applyFilter();
      });
      wrap.appendChild(b);
    });
    wrap.hidden = tags.length === 0;
  }

  function applyFilter() {
    var q = activeQuery;
    var selTags = Object.keys(activeTags);
    var filtered = currentMemos.filter(function (m) {
      for (var i = 0; i < selTags.length; i++) {
        if ((m.tags || []).indexOf(selTags[i]) === -1) return false; // 선택 태그 모두 포함(AND)
      }
      if (q) {
        var body = (m.content != null) ? m.content : (m.snippet || "");
        var hay = ((m.title || "") + " " + body + " " + (m.tags || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var filtersActive = !!q || selTags.length > 0;
    var p = emptyState.querySelector("p");
    if (p) p.innerHTML = filtersActive ? T("search.empty") : T("empty.text");
    var fb = $("filterBar");
    if (fb) fb.hidden = currentMemos.length === 0;
    renderedCount = 0;
    render(filtered);
  }

  // 목록 데이터가 바뀐 뒤(로드/저장/수정/삭제) 태그칩을 다시 만들고 필터를 재적용한다.
  function refreshView() { buildTagFilter(); applyFilter(); }

  // 포스트잇 색상/기울기.
  // 색: 메모에 color(팔레트 key)가 있으면 그 색, 없으면 id 해시로 자동 배정.
  // 기울기: 항상 id 해시로 결정해 재렌더 시에도 일정하게 유지한다.
  var STICKY_PALETTE = [
    { key: "yellow", hex: "#fff59d", label: "노랑" },
    { key: "pink",   hex: "#ffcfda", label: "핑크" },
    { key: "blue",   hex: "#c6e6ff", label: "블루" },
    { key: "green",  hex: "#cdf0c4", label: "그린" },
    { key: "orange", hex: "#ffe0b0", label: "오렌지" },
    { key: "purple", hex: "#e3d6ff", label: "퍼플" },
    { key: "mint",   hex: "#c7f2e9", label: "민트" }
  ];
  var STICKY_ROT = [-1.5, 1.1, -0.7, 1.4, -1.1, 0.6, -0.4];
  function stickyIndex(id) {
    var s = String(id || ""), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % STICKY_PALETTE.length;
  }
  function colorKeyToIndex(key) {
    for (var i = 0; i < STICKY_PALETTE.length; i++) if (STICKY_PALETTE[i].key === key) return i;
    return -1;
  }
  function card(m) {
    var el = document.createElement("article");
    var hashIdx = stickyIndex(m.id);
    el.style.setProperty("--rot", STICKY_ROT[hashIdx] + "deg");
    var colorIdx = colorKeyToIndex(m.color);
    if (colorIdx >= 0) {
      el.className = "memo-card";
      el.style.setProperty("--paper", STICKY_PALETTE[colorIdx].hex);
    } else {
      el.className = "memo-card sticky-" + hashIdx; // 자동(색 미지정)
    }
    var html = "";
    if (m.title) html += '<h3 class="memo-title">' + esc(m.title) + "</h3>";
    var body = (m.content != null) ? m.content : (m.snippet || "");
    html += '<div class="memo-content">' + esc(body) +
      (m.more ? '… <button class="more-btn" data-act="more">' + T("card.more") + '</button>' : "") + "</div>";
    if (m.tags && m.tags.length) {
      html += '<div class="memo-tags">' + m.tags.map(function (t) {
        return '<span class="tag">#' + esc(t) + "</span>"; }).join("") + "</div>";
    }
    if (m.attachments && m.attachments.length) {
      html += '<div class="memo-attachments">' + m.attachments.map(function (a) {
        return '<a class="attachment-link" href="' + esc(store.attachmentUrl(a.stored)) +
          '" target="_blank" rel="noopener">📎 ' + esc(a.name) +
          (a.size ? ' <span style="color:#8a94a6">(' + humanSize(a.size) + ")</span>" : "") + "</a>";
      }).join("") + "</div>";
    }
    var dateText = fmtDate(m.createdAt) + (m.updatedAt ? " " + T("card.modified") : "");
    html += '<div class="memo-footer"><span class="memo-date">' + esc(dateText) + "</span>" +
      '<span class="memo-actions"><button class="icon-btn" data-act="copy">' + T("card.copy") + '</button>' +
      (readOnly ? "" :
        '<button class="icon-btn" data-act="edit">' + T("card.edit") + '</button>' +
        '<button class="icon-btn" data-act="del">' + T("card.del") + '</button>') + "</span></div>";
    el.innerHTML = html;

    var moreBtn = el.querySelector('[data-act="more"]');
    if (moreBtn) moreBtn.addEventListener("click", function () {
      moreBtn.disabled = true; moreBtn.textContent = "…";
      ensureFull(m).then(function () { el.replaceWith(card(m)); })
        .catch(function (e) {
          moreBtn.disabled = false; moreBtn.textContent = T("card.more");
          toast(e.message || T("err.full.fail"), true);
        });
    });
    el.querySelector('[data-act="copy"]').addEventListener("click", function () {
      ensureFull(m).then(function () {
        var text = (m.title ? m.title + "\n\n" : "") + (m.content || "");
        return navigator.clipboard.writeText(text);
      }).then(function () { toast(T("toast.copied")); },
        function () { toast(T("toast.copy.fail"), true); });
    });
    var del = el.querySelector('[data-act="del"]');
    if (del) del.addEventListener("click", function () { removeMemo(m.id); });
    var edit = el.querySelector('[data-act="edit"]');
    if (edit) edit.addEventListener("click", function () {
      ensureFull(m).then(function () { openMemoModal(m); })
        .catch(function (e) { toast(e.message || T("err.full.fail"), true); });
    });
    return el;
  }

  function updateBanner() {
    if (!readOnly) { statusBanner.hidden = true; return; }
    statusBanner.hidden = false;
    if (cfg.mode === "server") {
      statusBanner.textContent = T("banner.server.offline");
    } else if (tokenInvalid) {
      statusBanner.textContent = T("banner.token.invalid");
    } else {
      statusBanner.textContent = T("banner.readonly");
    }
  }

  // ---- loading indicator (animated spinner + elapsed seconds) ----
  var loadingState = $("loadingState");
  var loadTimer = null, loadStart = 0;
  function showLoading() {
    emptyState.hidden = true;
    memoGrid.style.display = "none";
    statusBanner.hidden = true;
    if ($("loadMoreWrap")) $("loadMoreWrap").hidden = true;
    if ($("filterBar")) $("filterBar").hidden = true;
    loadingState.hidden = false;
    loadStart = Date.now();
    $("loadingSecs").textContent = "0.0";
    clearInterval(loadTimer);
    loadTimer = setInterval(function () {
      $("loadingSecs").textContent = ((Date.now() - loadStart) / 1000).toFixed(1);
    }, 100);
  }
  function hideLoading() {
    clearInterval(loadTimer);
    loadTimer = null;
    loadingState.hidden = true;
    memoGrid.style.display = "";
  }

  // ---- busy overlay (save / delete git commit in progress) ----
  var busyOverlay = $("busyOverlay");
  var busyTimer = null, busyStart = 0;
  function showBusy(msg) {
    $("busyText").textContent = msg || "처리 중…";
    $("busySecs").textContent = "0.0";
    busyOverlay.hidden = false;
    busyStart = Date.now();
    clearInterval(busyTimer);
    busyTimer = setInterval(function () {
      $("busySecs").textContent = ((Date.now() - busyStart) / 1000).toFixed(1);
    }, 100);
  }
  function hideBusy() {
    clearInterval(busyTimer);
    busyTimer = null;
    busyOverlay.hidden = true;
  }

  function refresh() {
    tokenInvalid = false;
    showLoading();
    return store.list().then(function (memos) {
      hideLoading();
      currentMemos = memos;
      readOnly = !store.canWrite();
      updateBanner();
      refreshView();
    }).catch(function (e) {
      hideLoading();
      readOnly = true;
      serverUp = false;
      statusBanner.hidden = false;
      statusBanner.textContent = T("err.load.fail") + ": " + e.message;
      render([]);
    });
  }

  // ---- data mutations ----
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  function removeMemo(id) {
    if (!confirm(T("confirm.del"))) return;
    showBusy(T("busy.del"));
    store.remove(id)
      .then(function () {
        // 낙관적 업데이트: 삭제된 메모를 즉시 화면에서 제거 (재읽기 불필요).
        currentMemos = currentMemos.filter(function (m) { return m.id !== id; });
        refreshView();
        toast(T("toast.deleted"));
      })
      .catch(function (e) { toast(e.message || "삭제 실패", true); })
      .finally(function () { hideBusy(); });
  }

  // ---- new / edit memo modal ----
  var memoModal = $("memoModal"), memoForm = $("memoForm");
  var editingId = null;
  var selectedColor = ""; // "" = 자동(id 해시 색)

  // 색상 선택 스와치 구성 (자동 + 팔레트 7색). 한 번만 생성.
  function buildColorPicker() {
    var wrap = $("memoColorPicker");
    if (!wrap || wrap.childNodes.length) return;
    var opts = [{ key: "", hex: "", label: "자동" }].concat(STICKY_PALETTE);
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (o.key === "" ? " swatch-auto" : "");
      b.setAttribute("data-color", o.key);
      b.title = o.label;
      b.setAttribute("aria-label", o.label);
      if (o.hex) b.style.background = o.hex;
      b.addEventListener("click", function () { setSelectedColor(o.key); });
      wrap.appendChild(b);
    });
  }
  function setSelectedColor(key) {
    selectedColor = key || "";
    var wrap = $("memoColorPicker");
    Array.prototype.forEach.call(wrap.querySelectorAll(".swatch"), function (s) {
      s.classList.toggle("selected", s.getAttribute("data-color") === selectedColor);
    });
  }

  function renderExistingAttachments(memo) {
    var field = $("existingAttachField");
    var listEl = $("existingAttachList");
    listEl.innerHTML = "";
    var atts = (memo && memo.attachments) || [];
    if (!atts.length) { field.hidden = true; return; }
    field.hidden = false;
    atts.forEach(function (a) {
      var row = document.createElement("label");
      row.className = "existing-attach-item";
      row.innerHTML = '<input type="checkbox" checked data-stored="' + esc(a.stored) + '" /> ' +
        '<span>📎 ' + esc(a.name) + (a.size ? " (" + humanSize(a.size) + ")" : "") + "</span>";
      listEl.appendChild(row);
    });
  }

  function openMemoModal(memo) {
    if (readOnly) {
      openAdminModal();
      toast(cfg.mode === "server" ? T("err.server.offline") : T("err.need.token"), true);
      return;
    }
    memoForm.reset();
    buildColorPicker();
    if (memo && memo.id) {
      editingId = memo.id;
      $("memoModalTitle").textContent = T("modal.edit");
      $("memoTitle").value = memo.title || "";
      $("memoContent").value = memo.content || "";
      $("memoTags").value = (memo.tags || []).join(", ");
      $("fileFieldLabel").textContent = T("memo.files.add");
      $("saveBtn").textContent = T("update.btn");
      setSelectedColor(memo.color || "");
      renderExistingAttachments(memo);
    } else {
      editingId = null;
      $("memoModalTitle").textContent = T("modal.new");
      $("fileFieldLabel").textContent = T("memo.files.label");
      $("saveBtn").textContent = T("save.btn");
      setSelectedColor("");
      $("existingAttachField").hidden = true;
      $("existingAttachList").innerHTML = "";
    }
    memoModal.hidden = false;
    $("memoTitle").focus();
  }
  function closeMemoModal() { memoModal.hidden = true; editingId = null; }

  memoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var saveBtn = $("saveBtn");
    var isEdit = !!editingId;
    var idForEdit = editingId;
    var content = $("memoContent").value.trim();
    if (!content) { toast(T("toast.need.content"), true); return; }
    var tags = $("memoTags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    var files = Array.prototype.slice.call($("memoFiles").files);
    if (files.some(function (f) { return f.size > 10 * 1024 * 1024; })) { toast(T("toast.file.too.big"), true); return; }

    // 유지할 기존 첨부파일 (체크된 것)
    var keep = Array.prototype.slice.call($("existingAttachList").querySelectorAll('input[type="checkbox"]:checked'))
      .map(function (c) { return c.getAttribute("data-stored"); });

    var defaultBtnText = isEdit ? T("update.btn") : T("save.btn");
    saveBtn.disabled = true; saveBtn.textContent = isEdit ? T("updating") : T("saving");
    showBusy(isEdit ? T("busy.update") : T("busy.save"));
    Promise.all(files.map(function (f) {
      return readFileAsDataURL(f).then(function (u) { return { name: f.name, size: f.size, dataUrl: u }; });
    }))
      .then(function (fs) {
        var payload = { title: $("memoTitle").value.trim(), content: content, tags: tags, color: selectedColor, files: fs };
        if (isEdit) { payload.keep = keep; return store.update(idForEdit, payload); }
        return store.create(payload);
      })
      .then(function (savedMemo) {
        closeMemoModal();
        // 커밋에 성공해 돌려받은 메모로 화면을 즉시 갱신(낙관적 업데이트).
        // 여기서 GitHub 를 다시 읽지 않으므로, 캐시된/반영 전 목록이 새 메모를
        // 덮어써 사라지는 문제(하드리프레시 필요)가 발생하지 않습니다.
        if (savedMemo && savedMemo.id) {
          if (isEdit) {
            currentMemos = currentMemos.map(function (m) { return m.id === savedMemo.id ? savedMemo : m; });
          } else {
            currentMemos = [savedMemo].concat(currentMemos);
          }
          refreshView();
        }
        toast(isEdit ? T("toast.updated") : T("toast.saved"));
      })
      .catch(function (e) { toast(e.message || (isEdit ? "수정 실패" : "저장 실패"), true); })
      .finally(function () {
        hideBusy();
        saveBtn.disabled = false;
        saveBtn.textContent = defaultBtnText;
      });
  });

  // ---- admin modal ----
  var adminModal = $("adminModal");
  function syncModeFields() {
    var gh = cfg.mode !== "server";
    $("githubFields").hidden = !gh;
    $("serverFields").hidden = gh;
  }
  function openAdminModal() {
    $("cfgMode").value = cfg.mode;
    $("cfgOwner").value = cfg.owner;
    $("cfgRepo").value = cfg.repo;
    $("cfgBranch").value = cfg.branch;
    $("cfgApiBase").value = cfg.apiBase;
    syncModeFields();
    // Token injected from repo Secret → hide the input, show status only.
    var injected = !!(window.MYMEMO_CONFIG && window.MYMEMO_CONFIG.token);
    $("tokenInjectedBox").hidden = !injected;
    $("tokenInputBox").hidden = injected;
    $("cfgToken").value = injected ? "" : (cfg.token || "");
    $("adminStatus").textContent = ""; $("adminStatus").className = "admin-status";
    // Reflect the current anonymous-access flag (from auth.js).
    $("anonToggle").checked = !!window.MYMEMO_ALLOW_ANON;
    $("anonStatus").textContent = ""; $("anonStatus").className = "pw-status";
    // Reflect the current anonymous-write flag (from auth.js).
    $("anonWriteToggle").checked = !!window.MYMEMO_ALLOW_ANON_WRITE;
    $("anonWriteStatus").textContent = ""; $("anonWriteStatus").className = "pw-status";
    $("pwStatus").textContent = ""; $("pwStatus").className = "pw-status";
    adminModal.hidden = false;
  }
  function closeAdminModal() { adminModal.hidden = true; }

  function readAdminForm() {
    return {
      mode: $("cfgMode").value,
      owner: $("cfgOwner").value.trim(),
      repo: $("cfgRepo").value.trim(),
      branch: $("cfgBranch").value.trim() || "main",
      dataDir: cfg.dataDir,
      token: $("cfgToken").value.trim(),
      apiBase: $("cfgApiBase").value.trim()
    };
  }
  function checkConnection() {
    var status = $("adminStatus");
    status.textContent = T("conn.checking"); status.className = "admin-status";
    var probe = readAdminForm();
    var saved = cfg; cfg = Object.assign({}, cfg, probe); // temporarily use form values
    var done = function () { cfg = saved; };
    if (probe.mode === "server") {
      fetch(sbase() + "/api/health", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (j) { status.textContent = T("conn.server.ok") + (j.repo || "repo") + " (" + (j.branch || "") + ")"; status.className = "admin-status ok"; })
        .catch(function () { status.textContent = T("conn.server.fail"); status.className = "admin-status err"; })
        .finally(done);
    } else {
      ghApi("GET", "").then(function (r) {
        var extra = probe.token ? T("conn.github.ok.token") : T("conn.github.ok.notoken");
        status.textContent = "✓ " + r.full_name + " (" + (r.default_branch || "") + ")" + extra;
        status.className = "admin-status ok";
      }).catch(function (e) { status.textContent = "✗ " + e.message; status.className = "admin-status err"; })
        .finally(done);
    }
  }

  // ---- change access password (commit new hash to auth.js) ----
  function changePassword() {
    var st = $("pwStatus"), btn = $("pwChangeBtn");
    st.className = "pw-status"; st.textContent = "";
    if (!store.canWrite()) {
      st.className = "pw-status err";
      st.textContent = cfg.mode === "server" ? T("err.need.server") : T("err.need.token.first");
      return;
    }
    var cur = $("pwCurrent").value, np = $("pwNew").value, np2 = $("pwNew2").value;
    if (np.length < 4) { st.className = "pw-status err"; st.textContent = T("err.pw.short"); return; }
    if (np !== np2) { st.className = "pw-status err"; st.textContent = T("err.pw.mismatch"); return; }

    var curHash = window.MYMEMO_PASS_HASH;
    sha256Hex(cur).then(function (h) {
      if (curHash && h !== curHash) { var e = new Error(T("err.pw.wrong")); e.handled = true; throw e; }
      return sha256Hex(np);
    }).then(function (newHash) {
      btn.disabled = true;
      showBusy(T("busy.pw"));
      return store.changePassword(newHash).then(function () {
        $("pwCurrent").value = $("pwNew").value = $("pwNew2").value = "";
        st.className = "pw-status ok";
        st.textContent = T("ok.pw.changed");
        toast(T("toast.pw.done"));
      });
    }).catch(function (e) {
      st.className = "pw-status err";
      st.textContent = (e && e.message) || T("err.pw.wrong");
      if (!(e && e.handled)) toast((e && e.message) || T("err.pw.wrong"), true);
    }).finally(function () {
      hideBusy(); btn.disabled = false;
    });
  }

  // ---- anonymous write toggle (commit ALLOW_ANON_WRITE flag to auth.js) ----
  function applyAnonWriteSetting() {
    var st = $("anonWriteStatus"), btn = $("anonWriteApplyBtn"), allow = $("anonWriteToggle").checked;
    st.className = "pw-status"; st.textContent = "";
    if (cfg.mode !== "server" && !cfg.token) {
      st.className = "pw-status err";
      st.textContent = T("err.need.token.first");
      return;
    }
    if (cfg.mode === "server" && !serverUp) {
      st.className = "pw-status err";
      st.textContent = T("err.need.server");
      return;
    }
    btn.disabled = true;
    showBusy(T("busy.anonwrite"));
    store.setAllowAnonWrite(allow).then(function () {
      window.MYMEMO_ALLOW_ANON_WRITE = allow;
      readOnly = !store.canWrite();
      updateBanner();
      refreshView();
      st.className = "pw-status ok";
      st.textContent = allow ? T("ok.anonwrite.on") : T("ok.anonwrite.off");
      toast(T("toast.anonwrite.done"));
    }).catch(function (e) {
      st.className = "pw-status err";
      st.textContent = (e && e.message) || "변경 실패";
      toast((e && e.message) || "변경 실패", true);
    }).finally(function () {
      hideBusy(); btn.disabled = false;
    });
  }

  // ---- anonymous access toggle (commit ALLOW_ANON flag to auth.js) ----
  function applyAnonSetting() {
    var st = $("anonStatus"), btn = $("anonApplyBtn"), allow = $("anonToggle").checked;
    st.className = "pw-status"; st.textContent = "";
    if (!store.canWrite()) {
      st.className = "pw-status err";
      st.textContent = cfg.mode === "server" ? T("err.need.server") : T("err.need.token.first");
      return;
    }
    btn.disabled = true;
    showBusy(T("busy.anon"));
    store.setAllowAnon(allow).then(function () {
      st.className = "pw-status ok";
      st.textContent = allow ? T("ok.anon.on") : T("ok.anon.off");
      toast(T("toast.anon.done"));
    }).catch(function (e) {
      st.className = "pw-status err";
      st.textContent = (e && e.message) || "변경 실패";
      toast((e && e.message) || "변경 실패", true);
    }).finally(function () {
      hideBusy(); btn.disabled = false;
    });
  }

  // ---- wire up ----
  $("langKo").addEventListener("click", function () { setLang("ko"); });
  $("langEn").addEventListener("click", function () { setLang("en"); });
  $("fab").addEventListener("click", function () { openMemoModal(); });
  $("modalClose").addEventListener("click", closeMemoModal);
  $("cancelBtn").addEventListener("click", closeMemoModal);
  $("adminBtn").addEventListener("click", openAdminModal);
  $("adminClose").addEventListener("click", closeAdminModal);
  $("cfgMode").addEventListener("change", function () { cfg.mode = $("cfgMode").value; syncModeFields(); });
  $("adminCheckBtn").addEventListener("click", checkConnection);
  $("pwChangeBtn").addEventListener("click", changePassword);
  $("anonApplyBtn").addEventListener("click", applyAnonSetting);
  $("anonWriteApplyBtn").addEventListener("click", applyAnonWriteSetting);
  $("loadMoreBtn").addEventListener("click", loadMore);
  $("searchInput").addEventListener("input", function () {
    activeQuery = this.value.trim().toLowerCase();
    $("searchClear").hidden = !this.value;
    applyFilter();
  });
  $("searchClear").addEventListener("click", function () {
    $("searchInput").value = ""; activeQuery = ""; this.hidden = true;
    applyFilter(); $("searchInput").focus();
  });
  $("adminSaveBtn").addEventListener("click", function () {
    cfg = Object.assign({}, cfg, readAdminForm());
    // Keep using the injected Secret token when the admin didn't type a personal one.
    var inj = window.MYMEMO_CONFIG || {};
    if (!cfg.token && inj.token) cfg.token = inj.token;
    saveCfg(); closeAdminModal(); toast(T("toast.settings.saved")); refresh();
  });
  [memoModal, adminModal].forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) m.hidden = true; });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { memoModal.hidden = true; adminModal.hidden = true; }
  });

  // ---- init ----
  applyI18n();
  // Start loading memos only once the access gate is unlocked, so the spinner
  // and timer are visible right when the user enters.
  if (window.__mymemoUnlocked) {
    refresh();
  } else {
    window.addEventListener("mymemo:unlocked", function () { refresh(); }, { once: true });
  }
})();
