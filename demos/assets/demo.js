// 라이브 데모 공통 유틸 — 헤더/사이드바, ECO LINK 전환, 포맷, 토스트, 저장소, CSV
(function (w) {
  "use strict";
  var D = {};
  D.$ = function (s, r) { return (r || document).querySelector(s); };
  D.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  D.fmt = function (n, d) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    d = d === undefined ? 0 : d;
    return Number(n).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  D.signed = function (n, d) { return (n > 0 ? "+" : n < 0 ? "−" : "") + D.fmt(Math.abs(n), d); };
  D.pct = function (n, d) { return D.fmt(n, d === undefined ? 1 : d) + "%"; };
  D.rand = function (seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  D.jitter = function (v, ratio) { return v * (1 + (Math.random() * 2 - 1) * ratio); };
  D.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  D.now = function () { return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };

  // 세션 저장소 (사생활 모드 등에서 실패해도 동작하도록)
  D.store = {
    get: function (k, def) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ } }
  };

  var toastEl;
  D.toast = function (msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("on"); }, 2200);
  };

  D.csv = function (filename, rows) {
    var body = rows.map(function (r) { return r.map(function (c) { var s = String(c === null || c === undefined ? "" : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(","); }).join("\r\n");
    var blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  D.modal = function (el) {
    var close = function () { el.classList.remove("open"); };
    el.addEventListener("click", function (e) { if (e.target === el || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    return { open: function () { el.classList.add("open"); }, close: close };
  };

  var APPS = [
    { id: "cbam", name: "CBAM-Insight", color: "#7cc04a" },
    { id: "data", name: "Data-Insight", color: "#2f5bea" },
    { id: "eco", name: "ECO-Insight", color: "#0f9f8f" },
    { id: "audit", name: "Audit-Insight", color: "#2563eb" },
    { id: "esg", name: "ESG-Insight", color: "#22a06b" }
  ];

  D.init = function (appId) {
    // ECO LINK: 다른 데모로 이동
    var eco = D.$(".ecolink");
    if (eco) {
      var menu = document.createElement("div"); menu.className = "ecolink-menu";
      menu.innerHTML = "<p>ECO LINK · 다른 솔루션으로 이동</p>" + APPS.map(function (a) {
        return '<a href="' + a.id + '.html"' + (a.id === appId ? ' class="cur"' : "") + '><span style="background:' + a.color + '">' + a.name.charAt(0) + "</span>" + a.name + "</a>";
      }).join("");
      eco.appendChild(menu);
      eco.querySelector("button").addEventListener("click", function (e) { e.stopPropagation(); eco.classList.toggle("open"); });
      document.addEventListener("click", function () { eco.classList.remove("open"); });
    }
    var shell = D.$(".shell"), burger = D.$(".burger");
    if (shell && burger) burger.addEventListener("click", function () {
      if (window.innerWidth <= 760) shell.classList.toggle("open-m"); else shell.classList.toggle("collapsed");
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 220);
    });
    D.$$(".side-grp > b").forEach(function (b) { b.addEventListener("click", function () { b.parentNode.classList.toggle("closed"); }); });
    D.$$(".side-grp > a").forEach(function (a) {
      a.addEventListener("click", function (e) { if (!a.classList.contains("on")) { e.preventDefault(); D.toast("데모에서는 대시보드 화면만 제공됩니다"); } });
    });
    D.$$("[data-demo-only]").forEach(function (b) { b.addEventListener("click", function () { D.toast(b.getAttribute("data-demo-only") || "데모에서는 지원하지 않는 기능입니다"); }); });
    if (w.Chart) {
      Chart.defaults.font.family = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
      Chart.defaults.font.size = 11;
      Chart.defaults.color = "#6b7280";
      Chart.defaults.plugins.legend.labels.boxWidth = 10;
      Chart.defaults.plugins.legend.labels.boxHeight = 10;
      Chart.defaults.maintainAspectRatio = false;
    }
  };

  w.Demo = D;
})(window);
