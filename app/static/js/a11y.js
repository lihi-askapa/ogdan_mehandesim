/* =========================================================
   תפריט נגישות
   כפתור צף שפותח חלונית עם הגדרות תצוגה. כל הגדרה מוסיפה
   מחלקה ל-<html>, והבחירות נשמרות בדפדפן לביקור הבא.
   בלי ספריות חיצוניות ובלי שליחת מידע לשום מקום.
========================================================= */

(function () {
  const STORAGE_KEY = "ogdan-a11y";
  const root = document.documentElement;
  const SIZES = [100, 112, 125, 137, 150];          // אחוזי גודל טקסט

  const OPTIONS = [
    { key: "contrast", label: "ניגודיות גבוהה", icon: "fa-adjust" },
    { key: "gray", label: "גווני אפור", icon: "fa-tint" },
    { key: "links", label: "הדגשת קישורים", icon: "fa-link" },
    { key: "readable", label: "גופן קריא", icon: "fa-font" },
    { key: "spacing", label: "ריווח טקסט", icon: "fa-text-height" },
    { key: "noanim", label: "עצירת אנימציות", icon: "fa-pause-circle" },
    { key: "cursor", label: "סמן גדול", icon: "fa-mouse-pointer" },
    { key: "focus", label: "הדגשת מיקוד", icon: "fa-square-o" }
  ];

  /* ---------- שמירה וטעינה ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* פרטיות / מצב גלישה בסתר – ממשיכים בלי לשמור */ }
  }

  let state = load();
  if (typeof state.size !== "number") state.size = 0;

  /* ---------- החלת ההגדרות ---------- */
  function apply() {
    OPTIONS.forEach(function (o) {
      root.classList.toggle("a11y-" + o.key, !!state[o.key]);
    });
    root.style.fontSize = state.size ? SIZES[state.size] + "%" : "";

    // עצירת אנימציות: גם הסרטונים נעצרים
    document.querySelectorAll("video").forEach(function (v) {
      if (state.noanim) v.pause();
    });
  }

  apply();   // מיד, עוד לפני שהחלונית נבנית, כדי שלא יהיה "הבהוב"

  /* ---------- בניית הכפתור והחלונית ---------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function icon(name) {
    return el("i", { class: "fa " + name, "aria-hidden": "true" });
  }

  function build() {
    const toggle = el("button", {
      type: "button",
      class: "a11y-toggle",
      "aria-label": "פתיחת תפריט נגישות",
      "aria-expanded": "false",
      "aria-controls": "a11y-panel"
    }, [icon("fa-universal-access")]);

    const closeBtn = el("button", {
      type: "button", class: "a11y-close", "aria-label": "סגירת תפריט הנגישות", text: "×"
    });

    // גודל טקסט
    const sizeValue = el("span", { class: "a11y-size-value", "aria-live": "polite" });
    const minus = el("button", { type: "button", "aria-label": "הקטנת טקסט", text: "A-" });
    const plus = el("button", { type: "button", "aria-label": "הגדלת טקסט", text: "A+" });
    const sizeRow = el("div", { class: "a11y-size" }, [
      el("span", { text: "גודל טקסט" }),
      el("div", { class: "a11y-size-buttons" }, [minus, sizeValue, plus])
    ]);

    const grid = el("div", { class: "a11y-grid" }, [sizeRow]);
    const optionButtons = OPTIONS.map(function (o) {
      const b = el("button", {
        type: "button", class: "a11y-option", "aria-pressed": String(!!state[o.key])
      }, [icon(o.icon), el("span", { text: o.label })]);
      b.addEventListener("click", function () {
        state[o.key] = !state[o.key];
        b.setAttribute("aria-pressed", String(state[o.key]));
        save(state);
        apply();
      });
      grid.appendChild(b);
      return b;
    });

    const reset = el("button", { type: "button", class: "a11y-reset", text: "איפוס הגדרות" });
    const statement = el("a", {
      href: "/accessibility-statement", class: "a11y-statement-link", text: "הצהרת נגישות"
    });

    const panel = el("div", {
      id: "a11y-panel",
      class: "a11y-panel",
      role: "dialog",
      "aria-modal": "false",
      "aria-labelledby": "a11y-title",
      hidden: ""
    }, [
      el("div", { class: "a11y-panel-header" }, [
        el("h2", { id: "a11y-title", class: "a11y-panel-title", text: "תפריט נגישות" }),
        closeBtn
      ]),
      grid,
      el("div", { class: "a11y-footer" }, [reset, statement])
    ]);

    function showSize() {
      sizeValue.textContent = SIZES[state.size] + "%";
      minus.disabled = state.size === 0;
      plus.disabled = state.size === SIZES.length - 1;
    }

    minus.addEventListener("click", function () {
      if (state.size > 0) { state.size--; save(state); apply(); showSize(); }
    });
    plus.addEventListener("click", function () {
      if (state.size < SIZES.length - 1) { state.size++; save(state); apply(); showSize(); }
    });

    reset.addEventListener("click", function () {
      state = { size: 0 };
      save(state);
      apply();
      showSize();
      optionButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    });

    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "סגירת תפריט נגישות");
      closeBtn.focus();
    }

    function close(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "פתיחת תפריט נגישות");
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (panel.hidden) open(); else close(false);
    });
    closeBtn.addEventListener("click", function () { close(true); });

    // Esc סוגר, ולחיצה מחוץ לחלונית סוגרת
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close(true);
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) close(false);
    });

    showSize();
    document.body.appendChild(toggle);
    document.body.appendChild(panel);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();

  // אם הדף נטען עם "עצירת אנימציות", לעצור גם סרטונים שמתחילים לנגן אחר כך
  document.addEventListener("play", function (e) {
    if (state.noanim && e.target.tagName === "VIDEO") e.target.pause();
  }, true);
})();
