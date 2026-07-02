/* My Memo — access gate.
 *
 * NOTE: This is a client-side "soft" gate for a static site. It keeps casual
 * visitors out, but is NOT strong security — a determined user could read the
 * data directly from the public GitHub repo. Do not rely on it for secrets.
 *
 * The password is never stored in plaintext here; only its SHA-256 digest is.
 */
(function () {
  "use strict";

  var UNLOCK_KEY = "mymemo_unlocked";
  // SHA-256 of the access password (변경: ⚙ 관리자 설정 → 접근 암호 변경)
  var PASS_HASH = "75685048a6cbb5b83c924be356248ea11eb0e1c2f48cec9794d3a72e3850806e";
  // Expose the current digest so the admin "접근 암호 변경" menu (app.js) can
  // verify the current password before committing a new one.
  window.MYMEMO_PASS_HASH = PASS_HASH;

  var screen = document.getElementById("lockScreen");
  var form = document.getElementById("lockForm");
  var input = document.getElementById("lockInput");
  var errEl = document.getElementById("lockError");

  function signalUnlocked() {
    window.__mymemoUnlocked = true;
    window.dispatchEvent(new Event("mymemo:unlocked"));
  }

  function unlock() {
    screen.classList.add("unlocked");
    document.body.classList.remove("locked");
    setTimeout(function () { screen.style.display = "none"; }, 350);
    signalUnlocked();
  }

  // Already unlocked this session?
  if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
    screen.style.display = "none";
    document.body.classList.remove("locked");
    // Set flag synchronously so app.js (loaded next) starts loading immediately.
    window.__mymemoUnlocked = true;
    return;
  }

  document.body.classList.add("locked");
  setTimeout(function () { try { input.focus(); } catch (e) {} }, 100);

  function sha256Hex(str) {
    var bytes = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  function reject() {
    errEl.textContent = "암호가 올바르지 않습니다";
    screen.querySelector(".lock-card").classList.remove("shake");
    // reflow to restart animation
    void screen.querySelector(".lock-card").offsetWidth;
    screen.querySelector(".lock-card").classList.add("shake");
    input.value = "";
    input.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var val = input.value;
    if (!val) { reject(); return; }
    sha256Hex(val).then(function (hex) {
      if (hex === PASS_HASH) {
        sessionStorage.setItem(UNLOCK_KEY, "1");
        unlock();
      } else {
        reject();
      }
    }).catch(function () {
      // crypto.subtle unavailable (e.g. non-HTTPS/localhost edge) — fail closed.
      reject();
    });
  });
})();
