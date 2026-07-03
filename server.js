#!/usr/bin/env node
/*
 * My Memo — admin-PC server.
 *
 * Serves the static site in ./docs, exposes the ./data store, and provides a
 * small JSON API that persists memos to ./data and commits them to git.
 * Zero external dependencies (Node core only).
 *
 *   node server.js                 # http://localhost:9999
 *   PORT=8080 node server.js       # custom port
 *   GIT_PUSH=true node server.js   # also `git push` after each commit
 *
 * When this server (the "admin PC") is off, the page can still be viewed as a
 * read-only static site (e.g. via GitHub Pages), but new memos cannot be saved.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = __dirname;
const DOCS_DIR = path.join(ROOT, "docs");
const DATA_DIR = path.join(ROOT, "data");
const ATTACH_DIR = path.join(DATA_DIR, "attachments");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

const PORT = parseInt(process.env.PORT, 10) || 9999;
const GIT_PUSH = /^(1|true|yes)$/i.test(process.env.GIT_PUSH || "");
const MAX_BODY = 80 * 1024 * 1024; // 80MB

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon"
};

// ---------- utilities ----------
function ensureDirs() {
  fs.mkdirSync(ATTACH_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, JSON.stringify({ memos: [] }, null, 2));
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function safeName(name) {
  return String(name || "file").replace(/[^\w.\-가-힣]+/g, "_").slice(-120) || "file";
}

function readMemos() {
  let files;
  try { files = fs.readdirSync(DATA_DIR); } catch (e) { return []; }
  const memos = [];
  files.filter(f => /^memo-.*\.json$/.test(f)).forEach(f => {
    try { memos.push(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"))); }
    catch (e) { /* skip corrupt */ }
  });
  memos.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return memos;
}

function writeIndex(memos) {
  const manifest = memos.map(m => ({
    id: m.id, title: m.title, content: m.content, tags: m.tags,
    attachments: m.attachments, createdAt: m.createdAt
  }));
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ memos: manifest }, null, 2));
}

function git(args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).trim()));
      resolve(stdout.trim());
    });
  });
}

async function gitCommit(message, paths) {
  await git(["add", "-A", "--", ...paths]);
  // Nothing staged? (e.g. deleting an already-absent file) — skip commit.
  try { await git(["diff", "--cached", "--quiet"]); return "nochange"; }
  catch (e) { /* there are staged changes -> continue */ }
  await git(["commit", "-m", message]);
  if (GIT_PUSH) { try { await git(["push"]); } catch (e) { console.error("git push failed:", e.message); } }
  return "committed";
}

function decodeDataUrl(dataUrl) {
  const m = /^data:([^;,]*)?(;base64)?,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  return Buffer.from(m[3], m[2] ? "base64" : "utf8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error("요청이 너무 큽니다 (첨부 파일 용량 초과)")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ---------- API handlers ----------
async function handleCreate(req, res) {
  const raw = await readBody(req);
  let data;
  try { data = JSON.parse(raw.toString("utf8")); } catch (e) { return sendJSON(res, 400, { error: "잘못된 JSON" }); }

  const content = (data.content || "").trim();
  if (!content) return sendJSON(res, 400, { error: "내용은 필수입니다" });

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const id = stamp + "-" + Math.floor(Math.random() * 1e6).toString(36);

  const attachments = [];
  const attachPaths = [];
  (data.files || []).forEach((f, i) => {
    const buf = decodeDataUrl(f.dataUrl);
    if (!buf) return;
    const stored = id + "__" + i + "__" + safeName(f.name);
    fs.writeFileSync(path.join(ATTACH_DIR, stored), buf);
    attachments.push({ name: f.name, size: buf.length, stored: stored });
    attachPaths.push(path.join("data", "attachments", stored));
  });

  const memo = {
    id: id,
    title: (data.title || "").trim(),
    content: content,
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    attachments: attachments,
    createdAt: now.toISOString()
  };

  const memoFile = path.join(DATA_DIR, "memo-" + id + ".json");
  fs.writeFileSync(memoFile, JSON.stringify(memo, null, 2));

  const memos = readMemos();
  writeIndex(memos);

  const title = memo.title || content.slice(0, 30).replace(/\s+/g, " ");
  try {
    await gitCommit("memo: add \"" + title + "\" (" + id + ")",
      [path.join("data", "memo-" + id + ".json"), "data/index.json", ...attachPaths]);
  } catch (e) {
    return sendJSON(res, 500, { error: "저장은 되었으나 Git 커밋에 실패했습니다: " + e.message, memo: memo });
  }
  sendJSON(res, 201, { ok: true, memo: memo });
}

async function handleUpdate(req, res, id) {
  if (!/^[\w-]+$/.test(id)) return sendJSON(res, 400, { error: "잘못된 id" });
  const memoFile = path.join(DATA_DIR, "memo-" + id + ".json");
  if (!fs.existsSync(memoFile)) return sendJSON(res, 404, { error: "메모를 찾을 수 없습니다" });

  const raw = await readBody(req);
  let data;
  try { data = JSON.parse(raw.toString("utf8")); } catch (e) { return sendJSON(res, 400, { error: "잘못된 JSON" }); }
  const content = (data.content || "").trim();
  if (!content) return sendJSON(res, 400, { error: "내용은 필수입니다" });

  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(memoFile, "utf8")); } catch (e) {}

  const keep = Array.isArray(data.keep) ? data.keep : (existing.attachments || []).map(a => a.stored);
  const commitPaths = [path.join("data", "memo-" + id + ".json"), "data/index.json"];

  // 유지할 첨부만 남기고 나머지는 삭제
  const attachments = (existing.attachments || []).filter(a => keep.indexOf(a.stored) !== -1);
  (existing.attachments || []).forEach(a => {
    if (keep.indexOf(a.stored) === -1) {
      const p = path.join(ATTACH_DIR, a.stored);
      if (fs.existsSync(p)) fs.unlinkSync(p);
      commitPaths.push(path.join("data", "attachments", a.stored));
    }
  });
  // 새로 추가된 첨부
  (data.files || []).forEach((f, i) => {
    const buf = decodeDataUrl(f.dataUrl);
    if (!buf) return;
    const stored = id + "__n" + Date.now() + i + "__" + safeName(f.name);
    fs.writeFileSync(path.join(ATTACH_DIR, stored), buf);
    attachments.push({ name: f.name, size: buf.length, stored: stored });
    commitPaths.push(path.join("data", "attachments", stored));
  });

  const memo = {
    id: id,
    title: (data.title || "").trim(),
    content: content,
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    attachments: attachments,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(memoFile, JSON.stringify(memo, null, 2));
  writeIndex(readMemos());

  const title = memo.title || content.slice(0, 30).replace(/\s+/g, " ");
  try {
    await gitCommit("memo: edit \"" + title + "\" (" + id + ")", commitPaths);
  } catch (e) {
    return sendJSON(res, 500, { error: "수정은 되었으나 Git 커밋에 실패했습니다: " + e.message, memo: memo });
  }
  sendJSON(res, 200, { ok: true, memo: memo });
}

async function handleChangePassword(req, res) {
  const raw = await readBody(req);
  let data;
  try { data = JSON.parse(raw.toString("utf8")); } catch (e) { return sendJSON(res, 400, { error: "잘못된 JSON" }); }
  const hash = String(data.hash || "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) return sendJSON(res, 400, { error: "잘못된 해시" });

  const authFile = path.join(DOCS_DIR, "js", "auth.js");
  let src;
  try { src = fs.readFileSync(authFile, "utf8"); } catch (e) { return sendJSON(res, 500, { error: "auth.js를 읽을 수 없습니다" }); }
  if (!/var PASS_HASH = "[0-9a-fA-F]{64}"/.test(src)) return sendJSON(res, 500, { error: "auth.js에서 PASS_HASH를 찾을 수 없습니다" });

  const updated = src
    .replace(/var PASS_HASH = "[0-9a-fA-F]{64}"/, 'var PASS_HASH = "' + hash + '"')
    .replace(/\/\/ SHA-256\("[^"]*"\)/, "// SHA-256 of the access password (변경: ⚙ 관리자 설정 → 접근 암호 변경)");
  fs.writeFileSync(authFile, updated);

  try {
    await gitCommit("chore: change access password", [path.join("docs", "js", "auth.js")]);
  } catch (e) {
    return sendJSON(res, 500, { error: "변경은 되었으나 Git 커밋에 실패했습니다: " + e.message });
  }
  sendJSON(res, 200, { ok: true });
}

async function handleSetAnon(req, res) {
  const raw = await readBody(req);
  let data;
  try { data = JSON.parse(raw.toString("utf8")); } catch (e) { return sendJSON(res, 400, { error: "잘못된 JSON" }); }
  const allow = data.allow === true;

  const authFile = path.join(DOCS_DIR, "js", "auth.js");
  let src;
  try { src = fs.readFileSync(authFile, "utf8"); } catch (e) { return sendJSON(res, 500, { error: "auth.js를 읽을 수 없습니다" }); }
  if (!/var ALLOW_ANON = (?:true|false);/.test(src)) return sendJSON(res, 500, { error: "auth.js에서 ALLOW_ANON을 찾을 수 없습니다" });

  const updated = src.replace(/var ALLOW_ANON = (?:true|false);/, "var ALLOW_ANON = " + (allow ? "true" : "false") + ";");
  fs.writeFileSync(authFile, updated);

  try {
    await gitCommit("chore: " + (allow ? "enable" : "disable") + " anonymous access", [path.join("docs", "js", "auth.js")]);
  } catch (e) {
    return sendJSON(res, 500, { error: "변경은 되었으나 Git 커밋에 실패했습니다: " + e.message });
  }
  sendJSON(res, 200, { ok: true });
}

async function handleDelete(res, id) {
  if (!/^[\w-]+$/.test(id)) return sendJSON(res, 400, { error: "잘못된 id" });
  const memoFile = path.join(DATA_DIR, "memo-" + id + ".json");
  if (!fs.existsSync(memoFile)) return sendJSON(res, 404, { error: "메모를 찾을 수 없습니다" });

  let memo = {};
  try { memo = JSON.parse(fs.readFileSync(memoFile, "utf8")); } catch (e) {}
  const paths = [path.join("data", "memo-" + id + ".json"), "data/index.json"];

  fs.unlinkSync(memoFile);
  (memo.attachments || []).forEach(a => {
    const p = path.join(ATTACH_DIR, a.stored);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    paths.push(path.join("data", "attachments", a.stored));
  });

  writeIndex(readMemos());
  try {
    await gitCommit("memo: remove " + id, paths);
  } catch (e) {
    return sendJSON(res, 500, { error: "삭제되었으나 Git 커밋에 실패했습니다: " + e.message });
  }
  sendJSON(res, 200, { ok: true });
}

// ---------- static files ----------
function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";

  let baseDir, filePath;
  if (rel.startsWith("/data/")) {
    baseDir = DATA_DIR;
    filePath = path.join(DATA_DIR, rel.slice("/data/".length));
  } else {
    baseDir = DOCS_DIR;
    filePath = path.join(DOCS_DIR, rel);
  }
  // prevent path traversal
  if (!path.resolve(filePath).startsWith(path.resolve(baseDir))) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    });
    res.end(buf);
  });
}

// ---------- router ----------
const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url.split("?")[0];

    if (req.method === "OPTIONS") return sendJSON(res, 204, {});

    if (urlPath === "/api/health") {
      let branch = "", repo = path.basename(ROOT);
      try { branch = await git(["rev-parse", "--abbrev-ref", "HEAD"]); } catch (e) {}
      return sendJSON(res, 200, { ok: true, repo: repo, branch: branch, push: GIT_PUSH });
    }
    if (urlPath === "/api/memos" && req.method === "GET") {
      return sendJSON(res, 200, { memos: readMemos() });
    }
    if (urlPath === "/api/memos" && req.method === "POST") {
      return await handleCreate(req, res);
    }
    if (urlPath.startsWith("/api/memos/") && req.method === "PUT") {
      return await handleUpdate(req, res, urlPath.slice("/api/memos/".length));
    }
    if (urlPath.startsWith("/api/memos/") && req.method === "DELETE") {
      return await handleDelete(res, urlPath.slice("/api/memos/".length));
    }
    if (urlPath === "/api/password" && req.method === "PUT") {
      return await handleChangePassword(req, res);
    }
    if (urlPath === "/api/anon" && req.method === "PUT") {
      return await handleSetAnon(req, res);
    }
    if (urlPath.startsWith("/api/")) {
      return sendJSON(res, 404, { error: "알 수 없는 API" });
    }

    return serveStatic(req, res, urlPath);
  } catch (e) {
    sendJSON(res, 500, { error: e.message || "서버 오류" });
  }
});

ensureDirs();
server.listen(PORT, () => {
  console.log("📢 My Memo server running:  http://localhost:" + PORT);
  console.log("   docs:  " + DOCS_DIR);
  console.log("   data:  " + DATA_DIR);
  console.log("   git push after commit: " + (GIT_PUSH ? "ON" : "OFF (set GIT_PUSH=true to enable)"));
});
