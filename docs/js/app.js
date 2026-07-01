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
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    var h = d.getHours(), ampm = h < 12 ? "오전" : "오후", h12 = h % 12 || 12;
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

  // ---- GitHub API ----
  var GH = "https://api.github.com";
  function ghHeaders() {
    var h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (cfg.token) h["Authorization"] = "Bearer " + cfg.token;
    return h;
  }
  function ghApi(method, path, body) {
    var opt = { method: method, headers: ghHeaders() };
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
    return ghApi("GET", "/contents/" + cfg.dataDir + "/index.json?ref=" + encodeURIComponent(cfg.branch))
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
                   tags: payload.tags || [], attachments: attachments, createdAt: new Date().toISOString() };
      changes.push({ path: cfg.dataDir + "/memo-" + id + ".json", contentBase64: b64encode(JSON.stringify(memo, null, 2)) });
      var newMemos = [memo].concat(memos);
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

  // ---- local server (optional self-host) ----
  function sbase() { return (cfg.apiBase || "").replace(/\/+$/, ""); }
  function serverList() {
    return fetch(sbase() + "/api/memos", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("server"); serverUp = true; return r.json().then(function (j) { return j.memos || []; });
    });
  }
  function serverCreate(payload) {
    return fetch(sbase() + "/api/memos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "저장 실패"); return j.memo; }); });
  }
  function serverRemove(id) {
    return fetch(sbase() + "/api/memos/" + encodeURIComponent(id), { method: "DELETE" })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "삭제 실패"); }); });
  }

  // ---- store abstraction ----
  var store = {
    canWrite: function () { return cfg.mode === "server" ? serverUp : (!!cfg.token && !tokenInvalid); },
    attachmentUrl: function (stored) {
      if (cfg.mode === "server") return sbase() + "/data/attachments/" + encodeURIComponent(stored);
      return "https://raw.githubusercontent.com/" + cfg.owner + "/" + cfg.repo + "/" +
        cfg.branch + "/" + cfg.dataDir + "/attachments/" + stored;
    },
    list: function () { return cfg.mode === "server" ? serverList() : githubList(); },
    create: function (p) { return cfg.mode === "server" ? serverCreate(p) : githubCreate(p); },
    remove: function (id) { return cfg.mode === "server" ? serverRemove(id) : githubRemove(id); }
  };

  // ---- rendering ----
  function render(memos) {
    memoGrid.innerHTML = "";
    if (!memos.length) { emptyState.hidden = false; return; }
    emptyState.hidden = true;
    memos.forEach(function (m) { memoGrid.appendChild(card(m)); });
  }
  function card(m) {
    var el = document.createElement("article");
    el.className = "memo-card";
    var html = "";
    if (m.title) html += '<h3 class="memo-title">' + esc(m.title) + "</h3>";
    html += '<div class="memo-content">' + esc(m.content) + "</div>";
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
    html += '<div class="memo-footer"><span class="memo-date">' + esc(fmtDate(m.createdAt)) + "</span>" +
      '<span class="memo-actions"><button class="icon-btn" data-act="copy">⧉ 복사</button>' +
      (readOnly ? "" : '<button class="icon-btn" data-act="del">삭제</button>') + "</span></div>";
    el.innerHTML = html;

    el.querySelector('[data-act="copy"]').addEventListener("click", function () {
      var text = (m.title ? m.title + "\n\n" : "") + m.content;
      navigator.clipboard.writeText(text).then(
        function () { toast("메모를 복사했습니다"); },
        function () { toast("복사에 실패했습니다", true); });
    });
    var del = el.querySelector('[data-act="del"]');
    if (del) del.addEventListener("click", function () { removeMemo(m.id); });
    return el;
  }

  function updateBanner() {
    if (!readOnly) { statusBanner.hidden = true; return; }
    statusBanner.hidden = false;
    if (cfg.mode === "server") {
      statusBanner.textContent = "⚠ 관리자 PC(server.js)에 연결할 수 없어 읽기 전용입니다. ⚙ 관리자 설정에서 서버 주소를 확인하세요.";
    } else if (tokenInvalid) {
      statusBanner.textContent = "⚠ GitHub 토큰이 유효하지 않아(만료·폐기) 열람 전용으로 표시 중입니다. 새 토큰으로 갱신하세요. (공개 배포된 토큰은 GitHub 보안 스캐닝에 의해 자동 폐기될 수 있습니다.)";
    } else {
      statusBanner.textContent = "🔒 읽기 전용 모드입니다. 메모를 저장하려면 ⚙ 관리자 설정에서 GitHub 토큰을 입력하세요.";
    }
  }

  // ---- loading indicator (animated spinner + elapsed seconds) ----
  var loadingState = $("loadingState");
  var loadTimer = null, loadStart = 0;
  function showLoading() {
    emptyState.hidden = true;
    memoGrid.style.display = "none";
    statusBanner.hidden = true;
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

  function refresh() {
    tokenInvalid = false;
    showLoading();
    return store.list().then(function (memos) {
      hideLoading();
      currentMemos = memos;
      readOnly = !store.canWrite();
      updateBanner();
      render(memos);
    }).catch(function (e) {
      hideLoading();
      readOnly = true;
      serverUp = false;
      statusBanner.hidden = false;
      statusBanner.textContent = "⚠ 메모를 불러오지 못했습니다: " + e.message + " (⚙ 관리자 설정 확인)";
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
    if (!confirm("이 메모를 삭제할까요? (Git에서도 삭제 커밋됩니다)")) return;
    store.remove(id)
      .then(function () { toast("삭제 및 Git 커밋 완료"); return refresh(); })
      .catch(function (e) { toast(e.message || "삭제 실패", true); });
  }

  // ---- new memo modal ----
  var memoModal = $("memoModal"), memoForm = $("memoForm");
  function openMemoModal() {
    if (readOnly) {
      openAdminModal();
      toast(cfg.mode === "server" ? "서버가 오프라인이라 저장할 수 없습니다" : "저장하려면 GitHub 토큰이 필요합니다", true);
      return;
    }
    memoForm.reset(); memoModal.hidden = false; $("memoTitle").focus();
  }
  function closeMemoModal() { memoModal.hidden = true; }

  memoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var saveBtn = $("saveBtn");
    var content = $("memoContent").value.trim();
    if (!content) { toast("내용을 입력하세요", true); return; }
    var tags = $("memoTags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    var files = Array.prototype.slice.call($("memoFiles").files);
    if (files.some(function (f) { return f.size > 10 * 1024 * 1024; })) { toast("10MB를 초과하는 파일이 있습니다", true); return; }

    saveBtn.disabled = true; saveBtn.textContent = "저장 중...";
    Promise.all(files.map(function (f) {
      return readFileAsDataURL(f).then(function (u) { return { name: f.name, size: f.size, dataUrl: u }; });
    }))
      .then(function (fs) { return store.create({ title: $("memoTitle").value.trim(), content: content, tags: tags, files: fs }); })
      .then(function () { toast("저장 및 Git 커밋 완료"); closeMemoModal(); return refresh(); })
      .catch(function (e) { toast(e.message || "저장 실패", true); })
      .finally(function () { saveBtn.disabled = false; saveBtn.textContent = "저장 (Git 커밋)"; });
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
    status.textContent = "확인 중..."; status.className = "admin-status";
    var probe = readAdminForm();
    var saved = cfg; cfg = Object.assign({}, cfg, probe); // temporarily use form values
    var done = function () { cfg = saved; };
    if (probe.mode === "server") {
      fetch(sbase() + "/api/health", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (j) { status.textContent = "✓ 서버 연결됨 · " + (j.repo || "repo") + " (" + (j.branch || "") + ")"; status.className = "admin-status ok"; })
        .catch(function () { status.textContent = "✗ 서버에 연결할 수 없습니다."; status.className = "admin-status err"; })
        .finally(done);
    } else {
      ghApi("GET", "").then(function (r) {
        var extra = probe.token ? " · 토큰 인증됨" : " · 열람 전용(토큰 없음)";
        status.textContent = "✓ 저장소 확인됨: " + r.full_name + " (" + (r.default_branch || "") + ")" + extra;
        status.className = "admin-status ok";
      }).catch(function (e) { status.textContent = "✗ " + e.message; status.className = "admin-status err"; })
        .finally(done);
    }
  }

  // ---- wire up ----
  $("fab").addEventListener("click", openMemoModal);
  $("modalClose").addEventListener("click", closeMemoModal);
  $("cancelBtn").addEventListener("click", closeMemoModal);
  $("adminBtn").addEventListener("click", openAdminModal);
  $("adminClose").addEventListener("click", closeAdminModal);
  $("cfgMode").addEventListener("change", function () { cfg.mode = $("cfgMode").value; syncModeFields(); });
  $("adminCheckBtn").addEventListener("click", checkConnection);
  $("adminSaveBtn").addEventListener("click", function () {
    cfg = Object.assign({}, cfg, readAdminForm());
    // Keep using the injected Secret token when the admin didn't type a personal one.
    var inj = window.MYMEMO_CONFIG || {};
    if (!cfg.token && inj.token) cfg.token = inj.token;
    saveCfg(); closeAdminModal(); toast("설정을 저장했습니다"); refresh();
  });
  [memoModal, adminModal].forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) m.hidden = true; });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { memoModal.hidden = true; adminModal.hidden = true; }
  });

  // ---- init ----
  // Start loading memos only once the access gate is unlocked, so the spinner
  // and timer are visible right when the user enters.
  if (window.__mymemoUnlocked) {
    refresh();
  } else {
    window.addEventListener("mymemo:unlocked", function () { refresh(); }, { once: true });
  }
})();
