// dev-han portfolio — 雲龍 (Ink & Night)
// 수묵 렌더링: 한지 질감 · 운룡도(구름 사이를 누비는 용과 여의주) · 산수 배경(달, 학, 매화 꽃잎)
// 카드 수묵화(산·매화·대나무·소나무·달) 생성, 메뉴, 등장 효과, 프로젝트 필터, 라이브 데모 모달
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var TAU = Math.PI * 2;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seeded = function (s) { s = (s % 2147483646) + 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  /* ======================================================
     붓 도구: 폭이 변하는 획(ribbon) · 베지어 샘플링
     ====================================================== */
  var ribbonPath = function (g, pts, wf) {
    var n = pts.length, L = [], R = [], i;
    for (i = 0; i < n; i++) {
      var a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / d, ny = dx / d, w = wf(n > 1 ? i / (n - 1) : 0, i) / 2;
      L.push(pts[i].x + nx * w, pts[i].y + ny * w); R.push(pts[i].x - nx * w, pts[i].y - ny * w);
    }
    g.beginPath(); g.moveTo(L[0], L[1]);
    for (i = 2; i < L.length; i += 2) g.lineTo(L[i], L[i + 1]);
    for (i = R.length - 2; i >= 0; i -= 2) g.lineTo(R[i], R[i + 1]);
    g.closePath();
  };
  var taper = function (t) { return Math.sin(Math.min(1, t * 4) * Math.PI / 2) * Math.pow(1 - t, .7); };
  var brush = function (g, pts, w, col, alpha, prof) {
    g.globalAlpha = alpha == null ? 1 : alpha; g.fillStyle = col;
    ribbonPath(g, pts, function (t, i) { return w * (prof ? prof(t, i) : taper(t)); }); g.fill();
    g.globalAlpha = 1;
  };
  var bez = function (p0, p1, p2, p3, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push({ x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
                 y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1] });
    }
    return out;
  };
  // 각도가 조금씩 꺾이며 나아가는 획 (가지, 수염, 털)
  var walk = function (x, y, ang, step, n, turn, wob) {
    var out = [{ x: x, y: y }];
    for (var i = 1; i <= n; i++) {
      ang += turn + (wob ? wob(i) : 0);
      x += Math.cos(ang) * step; y += Math.sin(ang) * step;
      out.push({ x: x, y: y });
    }
    return out;
  };
  var softDot = function (g, x, y, r, rgb, a) {
    if (!(r > 0)) return;
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(" + rgb + "," + a + ")"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };

  /* ======================================================
     한지: 기본 색 + 얼룩 + 섬유 + 잡음 + 가장자리 그을음
     ====================================================== */
  var makePaper = function (w, h, seed) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d"), r = seeded(seed || 11), i;
    g.fillStyle = "#dbcfb5"; g.fillRect(0, 0, w, h);
    for (i = 0; i < 18; i++) softDot(g, r() * w, r() * h, (.15 + r() * .35) * Math.max(w, h), r() < .5 ? "150,120,80" : "245,236,214", .06 + r() * .05);
    var id = g.getImageData(0, 0, w, h), d = id.data;
    for (var p = 0; p < d.length; p += 4) { var n = (r() - .5) * 16; d[p] += n; d[p + 1] += n; d[p + 2] += n * .85; }
    g.putImageData(id, 0, 0);
    g.lineCap = "round";
    var fibers = (w * h) / 1400;
    for (i = 0; i < fibers; i++) {
      var x = r() * w, y = r() * h, a = r() * TAU, l = 4 + r() * 22;
      g.strokeStyle = r() < .6 ? "rgba(120,96,62," + (.05 + r() * .08) + ")" : "rgba(250,244,228," + (.12 + r() * .12) + ")";
      g.lineWidth = .4 + r() * .7;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (i = 0; i < 7; i++) softDot(g, r() * w, r() * h, 2 + r() * 7, "130,90,45", .08 + r() * .08);   // 세월 얼룩
    var vg = g.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75);
    vg.addColorStop(0, "rgba(80,55,28,0)"); vg.addColorStop(1, "rgba(80,55,28,.32)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    return c;
  };
  var grainTile = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 160;
    var g = c.getContext("2d"), id = g.createImageData(160, 160), d = id.data;
    for (var p = 0; p < d.length; p += 4) { var v = 205 + Math.random() * 50; d[p] = v; d[p + 1] = v * .98; d[p + 2] = v * .94; d[p + 3] = 255; }
    g.putImageData(id, 0, 0);
    return c;
  })();

  /* ======================================================
     민화(채색화) 공통 도구 — 또렷한 먹선 + 평면 채색
     구름(운문) · 파도(청해파와 물보라) · 달 · 불꽃 · 비늘
     ====================================================== */
  var LINE = "#3a2311";
  var C = {
    gold: "#d3a03c", goldHi: "#f2d78a", goldSh: "#9a661b",
    red: "#c4372a", redHi: "#ee7d3c", redSh: "#6e170f",
    navy: ["#7e9bd6", "#34498c", "#18224a"],
    teal: ["#86c7b4", "#2e8376", "#174a42"],
    cream: "#f1e7cf", creamSh: "#b9a888",
    sea: ["#183f40", "#2c7a73", "#9fd1c1", "#3b8d84"],
    cloudLine: "#67625c"
  };
  var hash = function (a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  // 외곽선이 있는 붓획(불꽃·갈기·꼬리 등)
  var flame = function (g, pts, w, fill, line, prof, lw) {
    ribbonPath(g, pts, function (t, i) { return w * (prof ? prof(t, i) : taper(t)); });
    g.fillStyle = fill; g.fill();
    if (line) { g.strokeStyle = line; g.lineWidth = lw || .7; g.lineJoin = "round"; g.stroke(); }
  };
  var drawMoon = function (g, x, y, r) {
    softDot(g, x, y, r * 2.6, "255,226,120", .5);
    var mg = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
    mg.addColorStop(0, "#fff6b8"); mg.addColorStop(1, "#f1c93a");
    g.fillStyle = mg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = "rgba(150,110,20,.55)"; g.lineWidth = .8; g.stroke();
  };
  // 구름: 타원 마디를 이어 붙이고, 외곽선 → 채움 → 안쪽 말림선 순서로 그린다
  var cloudLobes = function (b, t) {
    var out = [], drift = Math.sin(t * .05 * (b.sp || 1) + b.x) * (b.dr == null ? 14 : b.dr);
    for (var k = 0; k < b.n; k++) {
      var f = b.n > 1 ? k / (b.n - 1) : 0, h = hash(k, b.x + b.y);
      out.push({ x: b.x + f * b.len + drift, y: b.y - Math.sin(f * Math.PI) * b.r1 * .45 + (h - .5) * b.r0 * .5,
                 r: (b.r0 + (b.r1 - b.r0) * (.2 + .8 * Math.sin(f * Math.PI)) * (.6 + h * .8)) * (1 + .03 * Math.sin(t * .5 + k)) });
    }
    return out;
  };
  var drawCloud = function (g, b, t, sc) {
    var ls = cloudLobes(b, t), s = sc || 1, top = 1e9, bot = -1e9, i, l;
    for (i = 0; i < ls.length; i++) { top = Math.min(top, ls[i].y - ls[i].r * .62); bot = Math.max(bot, ls[i].y + ls[i].r * .62); }
    var dir = b.tail || -1, e0 = dir < 0 ? ls[0] : ls[ls.length - 1], e1 = dir < 0 ? ls[ls.length - 1] : ls[0];
    var tail = bez([e1.x, e1.y + e1.r * .25], [lerp(e1.x, e0.x, .5), e0.y + b.r0 * .55], [e0.x, e0.y + b.r0 * .5], [e0.x + dir * b.len * .45, e0.y + b.r0 * .2 + Math.sin(t * .4 + b.x) * 2], 16);
    var tw = function (tt) { return b.r0 * 1.15 * Math.pow(1 - tt, .9) * Math.min(1, (1 - tt) * 6); };
    g.fillStyle = C.cloudLine;
    ribbonPath(g, tail, function (tt) { return tw(tt) + 3 * s; }); g.fill();
    for (i = 0; i < ls.length; i++) { l = ls[i]; g.beginPath(); g.ellipse(l.x, l.y, l.r + 1.5 * s, l.r * .62 + 1.5 * s, 0, 0, TAU); g.fill(); }
    var gr = g.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, "#fdfcf8"); gr.addColorStop(.55, "#ecE9e2"); gr.addColorStop(1, "#c3beb5");
    g.fillStyle = gr;
    ribbonPath(g, tail, tw); g.fill();
    for (i = 0; i < ls.length; i++) { l = ls[i]; g.beginPath(); g.ellipse(l.x, l.y, l.r, l.r * .62, 0, 0, TAU); g.fill(); }
    g.strokeStyle = "rgba(103,98,92,.6)"; g.lineWidth = .7 * s;
    var mid = tail.map(function (p, k) { return { x: p.x, y: p.y + tw(k / (tail.length - 1)) * .1 }; });
    g.beginPath(); mid.slice(4).forEach(function (p, k) { if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke();
    g.strokeStyle = "rgba(103,98,92,.75)"; g.lineWidth = .8 * s; g.lineCap = "round";
    for (i = 0; i < ls.length; i++) {
      l = ls[i];
      g.beginPath(); g.ellipse(l.x - l.r * .05, l.y + l.r * .12, l.r * .62, l.r * .36, 0, Math.PI * 1.05, Math.PI * 1.85); g.stroke();
    }
    [ls[0], ls[ls.length - 1]].forEach(function (e, k) {   // 양 끝 소용돌이
      var dir = k ? 1 : -1, cx = e.x + dir * e.r * .25, cy = e.y + e.r * .05, rr = e.r * .48;
      g.beginPath();
      for (var a = 0; a <= 1.001; a += .04) { var ang = Math.PI * (1.2 + a * 3.2) * dir, rad = rr * (1 - a * .82); var px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * .7; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
    });
  };
  // 파도 한 마디: 동심원 4겹
  var waveUnit = function (g, cx, cy, r) {
    var rings = [1, .76, .52, .3];
    for (var k = 0; k < 4; k++) {
      g.beginPath(); g.arc(cx, cy, r * rings[k], 0, TAU);
      g.fillStyle = C.sea[k]; g.fill();
      g.strokeStyle = "#0f2e2f"; g.lineWidth = .7; g.stroke();
    }
  };
  // 물보라: 흰 띠 + 손가락처럼 말린 끝 + 물방울
  var foam = function (g, cx, cy, r, t, seed) {
    var a0 = Math.PI * 1.08, a1 = Math.PI * 1.62, wd = r * .2;
    var band = function (col, w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, r * .9, a0, a1); g.stroke(); };
    band("#24504f", wd + 2); band("#f7f6f1", wd);
    var ex = cx + Math.cos(a1) * r * .9, ey = cy + Math.sin(a1) * r * .9;
    for (var k = 0; k < 3; k++) {
      var fx = ex + k * r * .2, fy = ey + k * r * .05, fr = r * (.16 - k * .03);
      g.strokeStyle = "#24504f"; g.lineWidth = wd * .7 + 2; g.beginPath(); g.arc(fx + fr, fy, fr, Math.PI, Math.PI * 2.3); g.stroke();
      g.strokeStyle = "#f7f6f1"; g.lineWidth = wd * .7; g.beginPath(); g.arc(fx + fr, fy, fr, Math.PI, Math.PI * 2.3); g.stroke();
    }
    for (var d = 0; d < 2; d++) {
      var dx = cx - r * .2 + hash(seed, d) * r * 1.3, dy = cy - r * 1.05 - hash(d, seed) * r * .6 + Math.sin(t * 2 + d + seed) * 1.5, dr = .9 + hash(seed + d, 3) * 1.6;
      g.fillStyle = "#f7f6f1"; g.strokeStyle = "#24504f"; g.lineWidth = .6;
      g.beginPath(); g.arc(dx, dy, dr, 0, TAU); g.fill(); g.stroke();
    }
  };
  // 바다: 위에서 아래로 줄을 쌓는다. rows 범위를 나눠 그리면 용 앞/뒤에 배치할 수 있다
  var seaRows = function (yTop, yBot, rTop, rBot) {
    var rows = [], y = yTop, j = 0;
    while (y < yBot + rBot) { var r = lerp(rTop, rBot, clamp((y - yTop) / Math.max(1, yBot - yTop), 0, 1)); rows.push({ y: y, r: r, j: j }); y += r * .58; j++; }
    return rows;
  };
  var drawSea = function (g, x0, x1, rows, from, to, t, foamP) {
    for (var ri = from; ri < Math.min(to, rows.length); ri++) {
      var row = rows[ri], r = row.r, step = r * 2;
      var off = (row.j % 2) * r + Math.sin(t * .3 + row.j * 1.7) * r * .4;
      var i0 = Math.floor((x0 - off) / step) - 1, i1 = Math.ceil((x1 - off) / step) + 1;
      for (var i = i0; i <= i1; i++) {
        var cx = off + i * step, cy = row.y + Math.sin(t * 1.2 + row.j * .9 + i * .7) * 1.3;
        waveUnit(g, cx, cy, r);
      }
      for (i = i0; i <= i1; i++) {
        if (hash(row.j, i) < (foamP == null ? .3 : foamP) * (ri < 3 ? 1.4 : .45)) {
          var fx = off + i * step, fy = row.y + Math.sin(t * 1.2 + row.j * .9 + i * .7) * 1.3;
          foam(g, fx, fy, r, t, row.j * 31 + i);
        }
      }
    }
  };

  /* ======================================================
     카드 그림 (민화풍: 오봉산 · 매화 · 대나무 · 소나무 · 달과 바다)
     ====================================================== */
  var pineTree = function (g, x, y, s, r) {
    var trunk = bez([x, y], [x + 6 * s, y - 30 * s], [x - 10 * s, y - 60 * s], [x + 4 * s, y - 92 * s], 14);
    flame(g, trunk, 9 * s, "#8c4a2b", LINE, function (t) { return 1 - t * .55; }, 1);
    g.strokeStyle = "rgba(58,35,17,.6)"; g.lineWidth = .8;
    for (var b = 0; b < 8; b++) { var p = trunk[1 + ((b * 1.6) | 0)]; g.beginPath(); g.ellipse(p.x, p.y, 2.6 * s, 1.6 * s, .3, 0, TAU); g.stroke(); }
    [[4, -1], [7, 1], [10, -1], [13, 1]].forEach(function (lv, k) {
      var p = trunk[lv[0]], R = (22 - k * 3) * s, cx = p.x + lv[1] * R * .6, cy = p.y;
      g.fillStyle = "#2f6a48"; g.strokeStyle = LINE; g.lineWidth = .9;
      g.beginPath(); g.ellipse(cx, cy, R, R * .38, 0, Math.PI, TAU); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "#173d29"; g.lineWidth = .7;
      for (var n = 0; n < 11; n++) { var a = Math.PI + (n + .5) / 11 * Math.PI; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R * .92, cy + Math.sin(a) * R * .34); g.stroke(); }
    });
  };
  var SCENES = {
    mountain: function (g, w, h, r) {
      var sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "rgba(120,150,150,.25)"); sky.addColorStop(1, "rgba(120,150,150,0)");
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = "#c8392b"; g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.arc(w * .16, h * .2, 26, 0, TAU); g.fill(); g.stroke();
      drawMoon(g, w * .86, h * .2, 22);
      var peaks = [[.5, .1, .17], [.27, .26, .14], [.73, .26, .14], [.08, .44, .13], [.93, .44, .13]];
      peaks.slice().reverse().forEach(function (p) {
        var cx = p[0] * w, top = p[1] * h, hw = p[2] * w, base = h * .78;
        var gr = g.createLinearGradient(0, top, 0, base); gr.addColorStop(0, "#1f5a4a"); gr.addColorStop(.6, "#3f8a6c"); gr.addColorStop(1, "#9cc8a6");
        g.beginPath(); g.moveTo(cx - hw * 1.6, base);
        g.bezierCurveTo(cx - hw * .9, base - (base - top) * .45, cx - hw * .55, top, cx, top);
        g.bezierCurveTo(cx + hw * .55, top, cx + hw * .9, base - (base - top) * .45, cx + hw * 1.6, base);
        g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1.3; g.stroke();
        g.strokeStyle = "rgba(20,50,40,.55)"; g.lineWidth = .9;
        for (var k = -2; k <= 2; k++) { if (!k) continue; g.beginPath(); g.moveTo(cx + k * hw * .12, top + (base - top) * .12); g.quadraticCurveTo(cx + k * hw * .45, top + (base - top) * .5, cx + k * hw * .8, base - 4); g.stroke(); }
      });
      drawSea(g, 0, w, seaRows(h * .74, h, 40, 34), 0, 99, 0, .3);
    },
    plum: function (g, w, h, r) {
      var tips = [];
      var branch = function (x, y, ang, len, wd, depth) {
        var seg = 5, pts = [{ x: x, y: y }], cx = x, cy = y, a = ang;
        for (var i = 0; i < seg; i++) {
          a += (r() - .5) * .7; var sl = len / seg;
          cx += Math.cos(a) * sl; cy += Math.sin(a) * sl; pts.push({ x: cx, y: cy });
          if (depth > 0 && i > 0 && r() < .65) branch(cx, cy, a + (r() < .5 ? -1 : 1) * (.55 + r() * .4), len * (.35 + r() * .2), wd * .5, depth - 1);
          if (r() < .55) tips.push({ x: cx + (r() - .5) * wd * 1.6, y: cy + (r() - .5) * wd * 1.6 });
        }
        tips.push({ x: cx, y: cy });
        flame(g, pts, wd, "#4b2f1d", LINE, function (t) { return 1 - t * .72; }, 1);
        g.strokeStyle = "rgba(240,220,190,.25)"; g.lineWidth = 1;
        g.beginPath(); pts.forEach(function (p, i) { var o = wd * .18 * (1 - i / seg); if (i) g.lineTo(p.x - o, p.y - o); else g.moveTo(p.x - o, p.y - o); }); g.stroke();
      };
      drawMoon(g, w * .74, h * .3, 46);
      branch(-20, h * .95, -.6, w * .78, 20, 2);
      branch(w + 10, h * .06, 2.65, w * .34, 9, 1);
      tips.forEach(function (p, i) {
        if (i % 4 === 3) { g.fillStyle = "#b8332c"; g.strokeStyle = LINE; g.lineWidth = .7; g.beginPath(); g.ellipse(p.x, p.y, 3.2, 4, r() * 3, 0, TAU); g.fill(); g.stroke(); return; }
        var s = 13 + r() * 6, rot = r() * TAU;
        for (var k = 0; k < 5; k++) {
          var a = rot + k * TAU / 5;
          g.fillStyle = "#f2b3ad"; g.strokeStyle = "#8f3a35"; g.lineWidth = .8;
          g.beginPath(); g.arc(p.x + Math.cos(a) * s * .55, p.y + Math.sin(a) * s * .55, s * .5, 0, TAU); g.fill(); g.stroke();
        }
        g.fillStyle = "#e6c25a"; g.beginPath(); g.arc(p.x, p.y, s * .28, 0, TAU); g.fill();
        g.strokeStyle = "#8f3a35"; g.lineWidth = .7;
        for (var st = 0; st < 7; st++) { var sa = st / 7 * TAU, sl = s * .55; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(sa) * sl, p.y + Math.sin(sa) * sl); g.stroke(); }
      });
    },
    bamboo: function (g, w, h, r) {
      g.fillStyle = "#b8b29f"; g.strokeStyle = LINE; g.lineWidth = 1.2;   // 괴석
      g.beginPath(); g.moveTo(w * .02, h); g.bezierCurveTo(w * .0, h * .72, w * .14, h * .62, w * .2, h * .74); g.bezierCurveTo(w * .26, h * .66, w * .34, h * .8, w * .32, h); g.closePath(); g.fill(); g.stroke();
      var leaf = function (x, y, ang, len, wd, dark) {
        var pts = walk(x, y, ang, len / 10, 10, (r() - .5) * .06);
        flame(g, pts, wd, dark ? "#2d6a3a" : "#4f9356", LINE, function (t) { return t < .22 ? .3 + t / .22 * .7 : Math.pow((1 - t) / .78, 1.1); }, .8);
        g.strokeStyle = "rgba(20,50,25,.6)"; g.lineWidth = .6; g.beginPath(); g.moveTo(pts[1].x, pts[1].y); g.lineTo(pts[8].x, pts[8].y); g.stroke();
      };
      [{ x: w * .3, wd: 18, lean: .05 }, { x: w * .52, wd: 13, lean: -.03 }, { x: w * .76, wd: 16, lean: .06 }].forEach(function (s, si) {
        var y = h + 10, x = s.x, segs = [];
        while (y > -40) {
          var sl = 64 + r() * 30, ny = y - sl, nx = x + s.lean * sl;
          segs.push([nx, ny]);
          var gr = g.createLinearGradient(x - s.wd / 2, 0, x + s.wd / 2, 0); gr.addColorStop(0, "#9cc583"); gr.addColorStop(.5, "#5f9a55"); gr.addColorStop(1, "#356b37");
          flame(g, [{ x: x, y: y - 2 }, { x: (x + nx) / 2, y: (y + ny) / 2 }, { x: nx, y: ny + 2 }], s.wd, gr, LINE, function () { return 1; }, 1);
          g.strokeStyle = LINE; g.lineWidth = 1.6; g.beginPath(); g.moveTo(nx - s.wd * .6, ny + 1); g.quadraticCurveTo(nx, ny - 3, nx + s.wd * .6, ny + 1); g.stroke();
          x = nx; y = ny;
        }
        segs.forEach(function (sg, k) {
          if (k < 1 || r() < .35) return;
          var dir = (k + si) % 2 ? 1 : -1;
          var twig = walk(sg[0], sg[1], -Math.PI / 2 + dir * (.6 + r() * .3), 9, 6, dir * .05);
          flame(g, twig, 2.4, "#3f6b35", null, function (t) { return 1 - t * .5; });
          var end = twig[twig.length - 1], base = dir > 0 ? .35 : Math.PI - .35, nl = 3 + ((r() * 3) | 0);
          for (var l = 0; l < nl; l++) leaf(end.x, end.y, base + (l - nl / 2) * .4 + (r() - .5) * .2 + .5, 54 + r() * 30, 12 + r() * 4, l % 2);
        });
      });
    },
    pine: function (g, w, h, r) {
      g.fillStyle = "#c8392b"; g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.arc(w * .2, h * .22, 24, 0, TAU); g.fill(); g.stroke();
      drawCloud(g, { x: w * .26, y: h * .4, n: 6, len: w * .3, r0: 24, r1: 40, dr: 0 }, 0, 1.6);
      var trunk = bez([w * .9, h + 20], [w * .76, h * .62], [w * .64, h * .44], [w * .44, h * .2], 30);
      flame(g, trunk, 44, "#8f4c2c", LINE, function (t) { return 1 - t * .55; }, 1.4);
      g.strokeStyle = "rgba(58,35,17,.65)"; g.lineWidth = 1;
      for (var b = 0; b < 40; b++) { var p = trunk[1 + ((r() * 26) | 0)]; g.beginPath(); g.ellipse(p.x + (r() - .5) * 16, p.y + (r() - .5) * 16, 4 + r() * 4, 2.4 + r() * 2, r() * 3, 0, TAU); g.stroke(); }
      var clusters = [];
      [[.32, -2.9, .5], [.58, -3.05, .4], [.85, -2.6, .3], [.5, -.35, .24]].forEach(function (bd) {
        var s = trunk[(bd[0] * 30) | 0], br = walk(s.x, s.y, bd[1], w * bd[2] / 8, 8, 0, function () { return (r() - .5) * .45; });
        flame(g, br, 11, "#7c4126", LINE, function (t) { return 1 - t * .65; }, 1);
        br.forEach(function (q, i) { if (i > 2 && i % 2 === 0) clusters.push(q); });
        clusters.push(br[br.length - 1]);
      });
      clusters.forEach(function (c) {
        var R0 = 34 + r() * 16;
        [[0, 0, 1, "#24583a"], [-.25, -.18, .72, "#3a7a52"], [.28, -.14, .66, "#4b8f60"]].forEach(function (lay) {
          var R = R0 * lay[2], cx = c.x + lay[0] * R0, cy = c.y + lay[1] * R0;
          g.fillStyle = lay[3]; g.strokeStyle = LINE; g.lineWidth = 1;
          g.beginPath(); g.ellipse(cx, cy, R, R * .46, 0, Math.PI, TAU); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = "rgba(14,40,24,.75)"; g.lineWidth = .8;
          for (var k = 0; k < 13; k++) { var a = Math.PI + (k + .5) / 13 * Math.PI; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R * .92, cy + Math.sin(a) * R * .42); g.stroke(); }
        });
      });
    },
    moon: function (g, w, h, r) {
      var sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#8f8c87"); sky.addColorStop(1, "#b3b0a9");
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      drawMoon(g, w * .7, h * .3, 48);
      drawCloud(g, { x: w * .08, y: h * .22, n: 6, len: w * .32, r0: 26, r1: 42, dr: 0 }, 0, 1.6);
      drawCloud(g, { x: w * .46, y: h * .52, n: 6, len: w * .36, r0: 24, r1: 40, dr: 0, tail: 1 }, 0, 1.6);
      drawSea(g, 0, w, seaRows(h * .7, h, 42, 34), 0, 99, 0, .32);
    }
  };
  var cardPaper = null;
  document.querySelectorAll("[data-ink]").forEach(function (el) {
    var paint = SCENES[el.getAttribute("data-ink")];
    if (!paint) return;
    var w = 760, h = 460, c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d");
    if (!cardPaper) cardPaper = makePaper(w, h, 77);
    g.drawImage(cardPaper, 0, 0);
    g.lineCap = "round"; g.lineJoin = "round";
    paint(g, w, h, seeded(+(el.getAttribute("data-seed") || 1) * 7919));
    g.globalCompositeOperation = "multiply"; g.globalAlpha = .3; g.fillStyle = g.createPattern(grainTile, "repeat"); g.fillRect(0, 0, w, h);
    el.style.backgroundImage = "url(" + c.toDataURL("image/jpeg", .88) + ")";
  });

  /* ======================================================
     운룡도 (히어로) — 민화 채색, 논리 좌표 400 x 500
     파도 위로 솟아 구름을 휘감고 달을 향하는 용
     ====================================================== */
  var hero = document.getElementById("dragon");
  if (hero) (function () {
    var LW = 400, LH = 500, N = 160, HU = 21;
    var g = hero.getContext("2d"), sky = null, K = 1, CH = 1, grainPat = null;
    var CTRL = [[178, 146], [128, 162], [100, 204], [118, 256], [206, 272], [286, 300], [290, 350], [222, 378], [164, 404], [236, 434], [336, 398]];
    var MOON = { x: 330, y: 96, r: 30 };
    var BACK = [
      { x: -30, y: 58, n: 8, len: 200, r0: 13, r1: 22, sp: 1 },
      { x: 236, y: 168, n: 7, len: 190, r0: 12, r1: 22, sp: -.8 },
      { x: -24, y: 300, n: 6, len: 130, r0: 13, r1: 21, sp: .7 },
      { x: 268, y: 238, n: 5, len: 130, r0: 11, r1: 19, sp: 1.2 },
      { x: 20, y: 364, n: 11, len: 380, r0: 14, r1: 25, sp: -.6 }
    ];
    var FRONT = [{ x: 150, y: 214, n: 5, len: 90, r0: 10, r1: 17, sp: .9 }, { x: 318, y: 322, n: 4, len: 80, r0: 10, r1: 16, sp: -1 }];
    var ROWS = seaRows(384, 500, 25, 18), FRONT_ROW = 3;
    var attn = { x: 0, y: 0 }, attnT = { x: 0, y: 0 }, roarAt = -10, nextRoar = 3.2, puffs = [], visible = true, lastT = 0;

    var resize = function () {
      var w = hero.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!w) return;
      hero.width = Math.round(w * dpr); hero.height = Math.round(w * dpr * LH / LW);
      K = hero.width / LW;
      sky = makePaper(hero.width, hero.height, 23);
      var sg = sky.getContext("2d");
      sg.globalCompositeOperation = "multiply";
      var gr = sg.createLinearGradient(0, 0, 0, hero.height);
      gr.addColorStop(0, "#8a8781"); gr.addColorStop(.55, "#a7a49d"); gr.addColorStop(1, "#bcb8b0");
      sg.fillStyle = gr; sg.fillRect(0, 0, hero.width, hero.height);
      sg.globalCompositeOperation = "source-over";
      sg.setTransform(K, 0, 0, K, 0, 0); drawMoon(sg, MOON.x, MOON.y, MOON.r);
      grainPat = g.createPattern(grainTile, "repeat");
      if (reduce) frame(4000);
    };

    var catmull = function (P) {
      var out = [], n = P.length, SEG = 16;
      for (var i = 0; i < n - 1; i++) {
        var p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n - 1)];
        for (var s = 0; s < SEG; s++) {
          var t = s / SEG, t2 = t * t, t3 = t2 * t;
          out.push({
            x: .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            y: .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
          });
        }
      }
      out.push({ x: P[n - 1][0], y: P[n - 1][1] });
      return out;
    };
    var resample = function (pts, n) {
      var cum = [0], i;
      for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      var total = cum[cum.length - 1], out = [], j = 1;
      for (i = 0; i < n; i++) {
        var target = total * i / (n - 1);
        while (j < cum.length - 1 && cum[j] < target) j++;
        var f = (target - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
        out.push({ x: lerp(pts[j - 1].x, pts[j].x, f), y: lerp(pts[j - 1].y, pts[j].y, f) });
      }
      out.total = total;
      return out;
    };
    var frames = function (P) {
      for (var i = 0, n = P.length; i < n; i++) {
        var a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
        var tx = a.x - b.x, ty = a.y - b.y, d = Math.hypot(tx, ty) || 1;
        P[i].tx = tx / d; P[i].ty = ty / d;
        P[i].bx = -CH * P[i].ty; P[i].by = CH * P[i].tx;
      }
    };
    var radius = function (s) {
      if (s < .05) return 13 + s / .05 * 3;
      if (s < .28) return 16 + (s - .05) / .23 * 3.5;
      return 19.5 - 16 * Math.pow((s - .28) / .72, 1.25);
    };
    var spine = function (t) {
      var Cs = CTRL.map(function (p, i) {
        var w = i === 0 ? 1 : i === 1 ? .55 : i === 2 ? .2 : 0;
        return [p[0] + Math.sin(t * .5 + i * 1.3) * 3.5 + attn.x * w + (i < 2 ? Math.sin(t * .9) * 3 : 0),
                p[1] + Math.cos(t * .4 + i) * 3.5 + attn.y * w + (i < 2 ? Math.cos(t * .7) * 3 : 0)];
      });
      var P = resample(catmull(Cs), N), total = P.total, i;
      CH = 1; frames(P);
      for (i = 0; i < N; i++) {
        var s = i / (N - 1), A = 5 * clamp(s / .12, 0, 1), off = A * Math.sin(s * total / 170 * TAU - t * 1.25);
        P[i].x += -P[i].ty * off; P[i].y += P[i].tx * off;
      }
      CH = 1; frames(P);
      if (P[0].by < 0) { CH = -1; frames(P); }
      for (i = 0; i < N; i++) P[i].r = radius(i / (N - 1));
      return P;
    };
    var back = function (q, f) { return { x: q.x - q.bx * q.r * f, y: q.y - q.by * q.r * f }; };
    var bel = function (q, f) { return { x: q.x + q.bx * q.r * f, y: q.y + q.by * q.r * f }; };
    var rot = function (v, a) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; };
    var nrm = function (v) { var d = Math.hypot(v.x, v.y) || 1; return { x: v.x / d, y: v.y / d }; };

    // 붉은 화염 갈기 한 가닥 (안쪽에 주황 줄)
    var fire = function (pts, w, a) {
      g.globalAlpha = a == null ? 1 : a;
      flame(g, pts, w, C.red, C.redSh, null, .8);
      flame(g, pts.slice(0, Math.max(3, (pts.length * .75) | 0)), w * .38, C.redHi, null);
      g.globalAlpha = 1;
    };

    var leg = function (P, idx, front, near, t, ph) {
      var q = P[idx], T = { x: q.tx, y: q.ty }, B = { x: q.bx, y: q.by }, ds = front ? 1 : -1;
      var sw = Math.sin(t * 1.5 + ph) * .3, a = near ? 1 : .8;
      var u1 = rot(nrm({ x: B.x * .85 + T.x * ds * .55, y: B.y * .85 + T.y * ds * .55 }), sw * .5 * CH);
      var u2 = rot(nrm({ x: B.x * .15 + T.x * ds, y: B.y * .15 + T.y * ds }), sw * CH);
      var base = bel(q, .35);
      var elbow = { x: base.x + u1.x * q.r * 1.9, y: base.y + u1.y * q.r * 1.9 };
      var wrist = { x: elbow.x + u2.x * q.r * 1.5, y: elbow.y + u2.y * q.r * 1.5 };
      var limb = bez([base.x, base.y], [elbow.x - u1.x * q.r * .3, elbow.y - u1.y * q.r * .3], [elbow.x + u2.x * q.r * .2, elbow.y + u2.y * q.r * .2], [wrist.x, wrist.y], 12);
      var w0 = q.r * 1.0, w1 = q.r * .42;
      var lw = function (t2) { return lerp(w0, w1, Math.pow(t2, .8)) * (1 + .15 * Math.sin(t2 * Math.PI)); };
      g.globalAlpha = a;
      // 팔꿈치 화염
      for (var h = 0; h < 3; h++) {
        var ang = Math.atan2(-T.y * ds + B.y * .3, -T.x * ds + B.x * .3) + (h - 1) * .4 * CH;
        fire(walk(elbow.x, elbow.y, ang, q.r * .2, 7, .12 * CH, function (k) { return Math.sin(t * 2 + k + h) * .05; }), q.r * .5, a);
      }
      g.globalAlpha = a;
      flame(g, limb, 1, near ? C.gold : "#b48632", LINE, lw, 1.1);
      g.strokeStyle = "rgba(242,215,138,.8)"; g.lineWidth = 1;
      var pa = Math.atan2(-u2.y, -u2.x);
      for (var sc = 2; sc < 12; sc += 2) { var lp = limb[sc]; g.beginPath(); g.arc(lp.x, lp.y, lw(sc / 12) * .34, pa - 1.1, pa + 1.1); g.stroke(); }
      [-.8, -.27, .27, .75].forEach(function (s) {   // 발톱
        var d = rot(u2, s), cl = q.r * 1.0;
        var claw = bez([wrist.x, wrist.y], [wrist.x + d.x * cl * .7, wrist.y + d.y * cl * .7], [wrist.x + d.x * cl * 1.05 + B.x * cl * .2, wrist.y + d.y * cl * 1.05 + B.y * cl * .2], [wrist.x + d.x * cl * .78 + B.x * cl * .62, wrist.y + d.y * cl * .78 + B.y * cl * .62], 8);
        flame(g, claw, 5, C.cream, LINE, function (t2) { return 1 - t2 * .88; }, .8);
      });
      g.fillStyle = C.gold; g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.arc(wrist.x, wrist.y, w1 * .62, 0, TAU); g.fill(); g.stroke();
      g.globalAlpha = 1;
    };

    var drawHead = function (P, t, open) {
      var q = P[0], u = HU, i, k;
      g.save(); g.translate(q.x, q.y); g.transform(q.tx, q.ty, q.bx, q.by, 0, 0);
      // 청록 갈기
      [[.3, -1.05, 3.8], [-.1, -.7, 3.5], [-.35, -.2, 3.2], [-.3, .35, 2.9], [0, .85, 2.55], [.55, .95, 2.2]].forEach(function (s, idx) {
        var len = (3 + (idx % 3) * .6) * u;
        var pts = walk(s[0] * u, s[1] * u, s[2], len / 10, 10, idx < 3 ? .035 : -.045, function (j) { return Math.sin(t * 1.8 + idx * .9 + j * .45) * .07; });
        flame(g, pts, .62 * u, C.teal[1], C.teal[2], null, .8);
        flame(g, pts.slice(0, 8), .2 * u, C.teal[0], null);
      });
      // 먼 뿔
      var hornF = bez([.55 * u, -1.05 * u], [-.2 * u, -2.0 * u], [-1.2 * u, -2.5 * u], [-2.5 * u, -2.55 * u], 16);
      flame(g, hornF, 1, C.creamSh, LINE, function (t2) { return lerp(.42 * u, .08 * u, t2); }, .8);
      // 뺨 화염
      for (k = 0; k < 3; k++) fire(walk((.5 + k * .25) * u, (.35 + k * .18) * u, 2.6 + k * .2, .3 * u, 8, .08, function (j) { return Math.sin(t * 2 + j * .5 + k) * .06; }), .42 * u);
      // 입 안 · 혀
      var jawA = open * .5, hx = 1.2 * u, hy = .15 * u;
      var jtX = hx + Math.cos(jawA) * 2.4 * u, jtY = hy + Math.sin(jawA) * 2.4 * u;
      g.fillStyle = "#5c120d"; g.beginPath(); g.moveTo(hx - .2 * u, hy); g.lineTo(3.7 * u, -.06 * u); g.lineTo(jtX, jtY); g.closePath(); g.fill();
      var tongue = bez([hx, hy + .1 * u], [2.2 * u, .25 * u + open * .3 * u], [3.4 * u, open * .2 * u], [4.3 * u, -.25 * u + open * .5 * u], 10);
      if (open > .25) flame(g, tongue, .3 * u, "#d6493c", LINE, function (t2) { return 1 - t2 * .7; }, .7);
      // 아래턱
      g.save(); g.translate(hx, hy); g.rotate(jawA);
      g.beginPath(); g.moveTo(-.45 * u, .05 * u); g.lineTo(2.3 * u, 0); g.bezierCurveTo(2.6 * u, .02 * u, 2.65 * u, .32 * u, 2.4 * u, .42 * u);
      g.bezierCurveTo(1.8 * u, .62 * u, .9 * u, .82 * u, .05 * u, .8 * u); g.closePath();
      var jg = g.createLinearGradient(0, 0, 0, .8 * u); jg.addColorStop(0, C.goldSh); jg.addColorStop(1, C.gold);
      g.fillStyle = jg; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = C.red; g.lineWidth = 1.6; g.beginPath(); g.moveTo(.0, .1 * u); g.lineTo(2.25 * u, .06 * u); g.stroke();
      g.fillStyle = "#fffaf0"; g.strokeStyle = LINE; g.lineWidth = .6;
      [[.8, .18], [1.25, .2], [1.75, .22], [2.05, .38]].forEach(function (tt) { g.beginPath(); g.moveTo(tt[0] * u, .04 * u); g.lineTo((tt[0] + .1) * u, -tt[1] * u); g.lineTo((tt[0] + .2) * u, .04 * u); g.closePath(); g.fill(); g.stroke(); });
      g.strokeStyle = "rgba(58,35,17,.6)"; g.lineWidth = .7;
      for (i = 0; i < 4; i++) { g.beginPath(); g.arc((.4 + i * .45) * u, .58 * u, .2 * u, Math.PI * .1, Math.PI * .9); g.stroke(); }
      g.restore();
      // 위턱 · 머리
      var skull = function () {
        g.beginPath();
        g.moveTo(-.3 * u, -1.0 * u);
        g.bezierCurveTo(.2 * u, -1.75 * u, 1.1 * u, -1.85 * u, 1.62 * u, -1.42 * u);
        g.bezierCurveTo(1.95 * u, -1.18 * u, 2.4 * u, -1.02 * u, 2.9 * u, -.98 * u);
        g.bezierCurveTo(3.4 * u, -.95 * u, 3.75 * u, -1.12 * u, 4.05 * u, -1.2 * u);
        g.bezierCurveTo(4.55 * u, -1.28 * u, 4.82 * u, -.88 * u, 4.62 * u, -.46 * u);
        g.bezierCurveTo(4.45 * u, -.12 * u, 4.0 * u, -.04 * u, 3.6 * u, -.08 * u);
        g.lineTo(1.5 * u, .05 * u);
        g.bezierCurveTo(1.0 * u, .2 * u, .6 * u, .6 * u, .1 * u, .95 * u);
        g.lineTo(-.35 * u, .9 * u); g.closePath();
      };
      var hg = g.createLinearGradient(0, -1.6 * u, 0, .95 * u);
      hg.addColorStop(0, C.goldHi); hg.addColorStop(.45, C.gold); hg.addColorStop(1, C.goldSh);
      skull(); g.fillStyle = hg; g.fill();
      g.save(); skull(); g.clip();
      g.strokeStyle = "rgba(154,102,27,.7)"; g.lineWidth = .8;
      for (i = 0; i < 6; i++) { g.beginPath(); g.arc((.2 + (i % 3) * .42) * u, (-.1 + Math.floor(i / 3) * .38) * u, .22 * u, -.3, Math.PI * .7); g.stroke(); }
      g.restore();
      skull(); g.strokeStyle = LINE; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = C.red; g.lineWidth = 1.8; g.beginPath(); g.moveTo(1.55 * u, .02 * u); g.lineTo(3.6 * u, -.07 * u); g.stroke();   // 윗입술
      for (i = 0; i < 3; i++) { g.strokeStyle = LINE; g.lineWidth = .9; g.beginPath(); g.arc((2.75 + i * .32) * u, (-.74 - i * .05) * u, .2 * u, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      g.fillStyle = C.red; g.strokeStyle = LINE; g.lineWidth = 1;   // 붉은 코
      g.beginPath(); g.ellipse(4.3 * u, -.82 * u, .42 * u, .32 * u, -.35, 0, TAU); g.fill(); g.stroke();
      g.lineWidth = 1.1; g.beginPath(); g.arc(4.36 * u, -.8 * u, .13 * u, -.5, Math.PI * 1.6); g.stroke();
      g.fillStyle = "#fffaf0"; g.lineWidth = .6;   // 윗니 · 송곳니
      [[2.2, .18], [2.6, .2], [3.0, .22], [3.35, .46]].forEach(function (tt) { g.beginPath(); g.moveTo(tt[0] * u, -.04 * u); g.lineTo((tt[0] + .1) * u, tt[1] * u); g.lineTo((tt[0] + .21) * u, -.04 * u); g.closePath(); g.fill(); g.stroke(); });
      // 눈 (크고 또렷하게)
      g.fillStyle = "#fffdf4"; g.strokeStyle = LINE; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(1.55 * u, -.78 * u); g.quadraticCurveTo(1.95 * u, -1.2 * u, 2.42 * u, -.86 * u); g.quadraticCurveTo(2.0 * u, -.55 * u, 1.55 * u, -.78 * u); g.closePath(); g.fill(); g.stroke();
      var ig = g.createRadialGradient(2.06 * u, -.86 * u, 0, 2.06 * u, -.86 * u, .17 * u); ig.addColorStop(0, "#f3c64a"); ig.addColorStop(1, "#b8741c");
      g.fillStyle = ig; g.beginPath(); g.arc(2.06 * u, -.86 * u, .16 * u, 0, TAU); g.fill();
      g.fillStyle = "#120c06"; g.beginPath(); g.ellipse(2.08 * u, -.86 * u, .05 * u, .13 * u, 0, 0, TAU); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(2.0 * u, -.92 * u, .035 * u, 0, TAU); g.fill();
      g.strokeStyle = C.red; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1.5 * u, -.82 * u); g.quadraticCurveTo(1.95 * u, -1.26 * u, 2.5 * u, -.9 * u); g.stroke();
      if (open > .5) softDot(g, 1.98 * u, -.84 * u, 1.0 * u, "255,220,120", .3 * open);
      // 눈썹 화염
      for (k = 0; k < 4; k++) fire(walk((1.45 + k * .3) * u, (-1.22 - (k % 2) * .06) * u, 3.7 + k * .08, (.32 + (k % 2) * .06) * u, 9, -.08, function (j) { return Math.sin(t * 2.2 + j * .6 + k) * .05; }), (.36 + (k % 2) * .08) * u);
      flame(g, bez([1.4 * u, -1.22 * u], [1.8 * u, -1.42 * u], [2.3 * u, -1.36 * u], [2.6 * u, -1.14 * u], 10), .3 * u, C.red, LINE, function (t2) { return .5 + .5 * Math.sin(t2 * Math.PI); }, .8);
      // 뿔
      var horn = bez([.95 * u, -1.28 * u], [.2 * u, -2.4 * u], [-1.0 * u, -3.0 * u], [-2.7 * u, -3.15 * u], 18);
      flame(g, horn, 1, C.cream, LINE, function (t2) { return lerp(.55 * u, .09 * u, t2); }, 1);
      flame(g, horn.slice(2, 16), 1, C.creamSh, null, function (t2) { return lerp(.16 * u, .03 * u, t2); });
      var tb = horn[7];
      flame(g, bez([tb.x, tb.y], [tb.x - .2 * u, tb.y - .5 * u], [tb.x + .1 * u, tb.y - .9 * u], [tb.x + .4 * u, tb.y - 1.2 * u], 8), .34 * u, C.cream, LINE, function (t2) { return 1 - t2 * .8; }, .9);
      // 수염
      [[4.45, -.75, -.7, .13, 0], [3.9, .02, .3, .1, 1.7]].forEach(function (wh) {
        var pts = walk(wh[0] * u, wh[1] * u, wh[2], .4 * u, 15, wh[3] * (wh[2] < 0 ? -1 : 1), function (j) { return Math.sin(t * 1.4 + j * .42 + wh[4]) * .1; });
        flame(g, pts, .17 * u, "#24170b", null, function (t2) { return 1 - t2 * .85; });
      });
      // 턱수염 (청록)
      for (k = 0; k < 3; k++) {
        var bd = walk((1.5 + k * .35) * u, .82 * u, 2.0 + k * .1, .32 * u, 8, .05, function (j) { return Math.sin(t * 1.6 + j * .5 + k) * .06; });
        flame(g, bd, .34 * u, C.teal[1], C.teal[2], null, .7);
      }
      g.restore();
      return { x: q.x + q.tx * 3.9 * u + q.bx * .2 * u, y: q.y + q.ty * 3.9 * u + q.by * .2 * u };
    };

    var frame = function (ms) {
      var t = ms / 1000, i, k, q;
      if (!sky) return;
      var dt = clamp(t - lastT || .016, 0, .05); lastT = t;
      attn.x += (attnT.x - attn.x) * .05; attn.y += (attnT.y - attn.y) * .05;
      if (!reduce && t > nextRoar) { roarAt = t; nextRoar = t + rnd(9, 13); }
      var rx = (t - roarAt) / 1.8, open = .14 + Math.sin(t * 1.3) * .05;
      if (rx >= 0 && rx < 1) open = Math.max(open, rx < .15 ? rx / .15 : rx < .7 ? 1 : 1 - (rx - .7) / .3);

      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      g.drawImage(sky, 0, 0);
      g.setTransform(K, 0, 0, K, 0, 0); g.lineCap = "round"; g.lineJoin = "round";
      BACK.forEach(function (b) { drawCloud(g, b, t); });
      drawSea(g, 0, LW, ROWS, 0, FRONT_ROW, t, .4);

      var P = spine(t), ds = P.total / (N - 1);
      leg(P, 26, true, false, t, 1.4);
      leg(P, 92, false, false, t, 3.6);

      // 등지느러미 (붉은 화염)
      for (i = 4, k = 0; i < N * .92; i += 3, k++) {
        q = P[i]; var q2 = P[Math.min(i + 3, N - 1)], hh = (q.r * .8 + 5) * (k % 2 ? .6 : 1);
        var b0 = back(q, .8), b1 = back(q2, .8), mx = (b0.x + b1.x) / 2, my = (b0.y + b1.y) / 2;
        var tip = { x: mx - q.bx * hh - q.tx * hh * 1.05, y: my - q.by * hh - q.ty * hh * 1.05 };
        var finPath = function (sc) {
          var tx2 = mx + (tip.x - mx) * sc, ty2 = my + (tip.y - my) * sc;
          g.beginPath(); g.moveTo(b0.x, b0.y);
          g.bezierCurveTo(b0.x - q.bx * hh * .75 * sc, b0.y - q.by * hh * .75 * sc, tx2 + q.tx * hh * .5 * sc, ty2 + q.ty * hh * .5 * sc, tx2, ty2);
          g.quadraticCurveTo(mx - q.bx * hh * .2 * sc - q.tx * hh * .25 * sc, my - q.by * hh * .2 * sc - q.ty * hh * .25 * sc, b1.x, b1.y); g.closePath();
        };
        finPath(1); g.fillStyle = C.red; g.fill(); g.strokeStyle = C.redSh; g.lineWidth = .9; g.stroke();
        finPath(.55); g.fillStyle = C.redHi; g.fill();
      }

      // 몸통
      var BK = [], BL = [];
      for (i = 0; i < N; i++) { BK.push(back(P[i], 1)); BL.push(bel(P[i], 1)); }
      var bodyPath = function () {
        g.beginPath(); g.moveTo(BK[0].x, BK[0].y);
        for (i = 1; i < N; i++) g.lineTo(BK[i].x, BK[i].y);
        for (i = N - 1; i >= 0; i--) g.lineTo(BL[i].x, BL[i].y);
        g.closePath();
      };
      bodyPath(); g.fillStyle = C.goldSh; g.fill();
      // 비늘: 꼬리 쪽부터 머리 쪽으로 겹쳐 그린다
      var scales = [];
      [-.74, -.38, -.02, .34].forEach(function (f, ri) {
        var idx = 2 + (ri % 2) * Math.max(1, (P[2].r * .46) / ds) * .5;
        while (idx < N - 2) {
          q = P[Math.round(idx)];
          if (q.r < 3.2) break;
          scales.push({ i: idx, x: q.x + q.bx * f * q.r, y: q.y + q.by * f * q.r, s: q.r * .44, a: Math.atan2(-q.ty, -q.tx) });
          idx += Math.max(1, (q.r * .5) / ds);
        }
      });
      scales.sort(function (a, b) { return b.i - a.i; });
      g.save(); bodyPath(); g.clip();
      scales.forEach(function (s) {
        g.beginPath(); g.arc(s.x, s.y, s.s, 0, TAU);
        g.fillStyle = C.gold; g.fill(); g.strokeStyle = LINE; g.lineWidth = .8; g.stroke();
        g.strokeStyle = C.goldSh; g.lineWidth = 1.4; g.beginPath(); g.arc(s.x, s.y, s.s - 1.1, s.a - 1.1, s.a + 1.1); g.stroke();
        g.strokeStyle = C.goldHi; g.lineWidth = 1.1; g.beginPath(); g.arc(s.x, s.y, s.s * .62, s.a - 1.0, s.a + 1.0); g.stroke();
      });
      g.restore();
      bodyPath(); g.strokeStyle = LINE; g.lineWidth = 1.5; g.stroke();
      // 배 비늘: 남색 구슬
      var beads = [], bi = 3;
      while (bi < N - 3) { q = P[Math.round(bi)]; if (q.r < 3.5) break; beads.push(q); bi += Math.max(1, (q.r * .82) / ds); }
      for (k = beads.length - 1; k >= 0; k--) {
        q = beads[k]; var bc = bel(q, .74), br = q.r * .44;
        var ng = g.createRadialGradient(bc.x - q.bx * br * .3 + q.tx * br * .2, bc.y - q.by * br * .3 + q.ty * br * .2, br * .1, bc.x, bc.y, br);
        ng.addColorStop(0, C.navy[0]); ng.addColorStop(.6, C.navy[1]); ng.addColorStop(1, C.navy[2]);
        g.fillStyle = ng; g.beginPath(); g.arc(bc.x, bc.y, br, 0, TAU); g.fill();
        g.strokeStyle = LINE; g.lineWidth = .9; g.stroke();
        g.strokeStyle = "rgba(220,232,255,.55)"; g.lineWidth = .8; g.beginPath(); g.arc(bc.x, bc.y, br * .62, Math.atan2(-q.by, -q.bx) - .9, Math.atan2(-q.by, -q.bx) + .2); g.stroke();
      }
      // 꼬리 화염
      q = P[N - 1];
      for (k = 0; k < 9; k++) {
        var ta = Math.atan2(-q.ty, -q.tx) + (k - 4) * .2;
        fire(walk(q.x, q.y, ta, 4 + (k % 3) * .8, 9, (k - 4) * .025, function (j) { return Math.sin(t * 2.2 + j * .5 + k) * .08; }), 6);
      }
      leg(P, 20, true, true, t, 0);
      leg(P, 86, false, true, t, 2.2);
      var mouth = drawHead(P, t, open);

      // 포효: 흰 입김 구름
      if (rx > .1 && rx < .6 && !reduce) puffs.push({ x: mouth.x, y: mouth.y, vx: P[0].tx * rnd(.8, 1.5) + rnd(-.3, .3), vy: P[0].ty * rnd(.8, 1.5) + rnd(-.3, .3), r: rnd(3, 5), life: 1 });
      for (i = puffs.length - 1; i >= 0; i--) {
        var pf = puffs[i]; pf.x += pf.vx * dt * 60; pf.y += pf.vy * dt * 60; pf.vx *= .97; pf.vy *= .97; pf.r += .4 * dt * 60; pf.life -= .012 * dt * 60;
        if (pf.life <= 0) { puffs.splice(i, 1); continue; }
        softDot(g, pf.x, pf.y, pf.r, "250,248,240", .55 * pf.life);
      }
      FRONT.forEach(function (b) { drawCloud(g, b, t); });
      drawSea(g, 0, LW, ROWS, FRONT_ROW, 99, t, .3);

      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "multiply"; g.globalAlpha = .28; g.fillStyle = grainPat; g.fillRect(0, 0, hero.width, hero.height);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    };

    var loop = function (ms) { if (visible) frame(ms); if (!reduce) requestAnimationFrame(loop); };
    var roar = function () { roarAt = performance.now() / 1000; if (reduce) frame(performance.now()); };
    hero.addEventListener("click", roar);
    hero.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); roar(); } });
    hero.addEventListener("pointermove", function (e) {
      var rc = hero.getBoundingClientRect();
      var dx = (e.clientX - rc.left) / rc.width * LW - CTRL[0][0], dy = (e.clientY - rc.top) / rc.height * LH - CTRL[0][1];
      var d = Math.hypot(dx, dy) || 1, m = Math.min(d, 60) / d * .45;
      attnT.x = dx * m; attnT.y = dy * m;
    });
    hero.addEventListener("pointerleave", function () { attnT.x = attnT.y = 0; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(resize, 150); });
    resize();
    if (!reduce) requestAnimationFrame(loop);
  })();

  /* ======================================================
     배경: 달 · 겹겹의 산 · 안개 · 학 · 매화 꽃잎 · 먹물 파문
     ====================================================== */
  var canvas = document.getElementById("realm");
  if (canvas) (function () {
    var ctx = canvas.getContext("2d"), DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, land = document.createElement("canvas"), petals = [], ripples = [], flock = null, nextFlock = 4, lastT = 0;

    var pine = function (g, x, y, s, col) {
      var trunk = bez([x, y], [x + 2 * s, y - 14 * s], [x - 3 * s, y - 26 * s], [x + 1 * s, y - 40 * s], 10);
      brush(g, trunk, 3.2 * s, col, 1, function (t) { return 1 - t * .6; });
      g.fillStyle = col;
      for (var k = 0; k < 6; k++) {
        var p = trunk[Math.min(10, 3 + k)], wd = (16 - k * 2) * s, dir = k % 2 ? 1 : -1;
        g.beginPath(); g.ellipse(p.x + dir * wd * .35, p.y + 2 * s, wd * .62, 3.2 * s, dir * .08, 0, TAU); g.fill();
      }
    };
    var build = function () {
      land.width = Math.round(W * DPR); land.height = Math.round(H * DPR);
      var g = land.getContext("2d"), r = seeded(1234 + Math.round(W)), L, x;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = "round";
      var narrow = W < 760, mx = W * (narrow ? .82 : .91), my = H * (narrow ? .1 : .2), mr = clamp(Math.min(W, H) * .06, 30, 64);
      softDot(g, mx, my, mr * 6, "214,196,150", .07);
      softDot(g, mx, my, mr * 2.2, "226,212,172", .08);
      var mg = g.createRadialGradient(mx - mr * .3, my - mr * .3, 0, mx, my, mr);
      mg.addColorStop(0, "#ece3cc"); mg.addColorStop(1, "#c8bb9c");
      g.globalAlpha = .9; g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill(); g.globalAlpha = 1;
      for (var c = 0; c < 6; c++) softDot(g, mx + (r() - .5) * mr, my + (r() - .5) * mr, mr * (.15 + r() * .25), "140,124,98", .12);
      var TONES = [[64, 58, 49, .5], [42, 38, 32, .72], [25, 22, 19, .9], [12, 11, 9, 1]];
      for (L = 0; L < 4; L++) {
        var base = H * (narrow ? .7 : .64) + L * H * .085, amp = Math.min(H, W * 1.1) * (.2 - L * .03), peaks = [];
        var np = Math.max(3, Math.round(W / 320)) + L;
        for (var k = 0; k < np; k++) peaks.push({ c: r() * W, h: amp * (.45 + r() * .55), w: Math.max(W * (.035 + r() * .07), 46 + r() * 60) });
        var ridge = function (xx) { var y = base; for (var j = 0; j < peaks.length; j++) { var q = (xx - peaks[j].c) / peaks[j].w; y -= peaks[j].h * Math.exp(-q * q); } return y + Math.sin(xx * .02 + L * 2) * 6 + Math.sin(xx * .07) * 2; };
        var tc = TONES[L], top = H;
        for (x = 0; x <= W; x += 8) top = Math.min(top, ridge(x));
        var gr = g.createLinearGradient(0, top, 0, L === 3 ? H : base + H * .12);
        gr.addColorStop(0, "rgba(" + tc[0] + "," + tc[1] + "," + tc[2] + "," + tc[3] + ")");
        gr.addColorStop(1, "rgba(" + tc[0] + "," + tc[1] + "," + tc[2] + "," + (L === 3 ? 1 : tc[3] * .15) + ")");
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
        for (x = 0; x <= W; x += 4) g.lineTo(x, ridge(x));
        g.lineTo(W, H); g.closePath(); g.fill();
        g.strokeStyle = "rgba(226,210,172," + (.08 - L * .016) + ")"; g.lineWidth = 1;
        g.beginPath(); for (x = 0; x <= W; x += 4) { if (x) g.lineTo(x, ridge(x)); else g.moveTo(x, ridge(x)); } g.stroke();
        if (L < 3) { g.strokeStyle = "rgba(0,0,0," + (.14 + L * .04) + ")"; for (x = 0; x < W; x += 6) if (r() < .35) { var yy = ridge(x) + 3; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + r() * 4 - 2, yy + 8 + r() * 26); g.stroke(); } }
        if (L >= 2) for (var pi = 0; pi < 3 + L; pi++) { var px = r() * W; pine(g, px, ridge(px) + 4, .7 + r() * .6 + (L - 2) * .3, "rgb(" + tc[0] + "," + tc[1] + "," + tc[2] + ")"); }
        if (L < 3) { var fg = g.createLinearGradient(0, base - H * .02, 0, base + H * .1); fg.addColorStop(0, "rgba(190,178,150,0)"); fg.addColorStop(.5, "rgba(190,178,150,.035)"); fg.addColorStop(1, "rgba(190,178,150,0)"); g.fillStyle = fg; g.fillRect(0, base - H * .02, W, H * .12); }
      }
    };
    var newPetal = function (any) {
      var cols = ["176,58,48", "196,82,68", "214,150,136", "160,40,36"];
      return { x: rnd(-.1, 1) * W, y: any ? rnd(0, H) : -12, vx: rnd(.05, .35), vy: rnd(.22, .55), rot: rnd(0, TAU), vr: rnd(-.02, .02), fl: rnd(0, TAU), vf: rnd(.02, .05), s: rnd(2.6, 5.2), c: cols[(Math.random() * cols.length) | 0], a: rnd(.45, .85), ph: rnd(0, TAU) };
    };
    var resize = function () {
      var nw = window.innerWidth, nh = window.innerHeight;
      if (nw === W && Math.abs(nh - H) < 120 && land.width) return;
      W = nw; H = nh;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      build();
      var n = clamp(Math.round(W / 70), 8, 24);
      petals = []; for (var i = 0; i < n; i++) petals.push(newPetal(true));
      if (reduce) frame(0);
    };

    var crane = function (x, y, s, ph, dir, a) {
      var f = .25 + .75 * Math.sin(ph);
      ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.globalAlpha = a; ctx.lineCap = "round";
      var wing = function (amp, col, band) {
        var y1 = -3 - 22 * amp, y2 = -3 - 44 * amp, y3 = -3 - 30 * amp, y4 = -2 - 11 * amp;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(4, -3); ctx.quadraticCurveTo(2, y1 * .6 - 2, -2, y1); ctx.lineTo(-16, y2);
        ctx.quadraticCurveTo(-22, y3, -20, y3); ctx.lineTo(-12, y4); ctx.lineTo(-8, -1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(-12, y4); ctx.lineTo(-19, y3 + 2 * amp); ctx.lineTo(-13, y3 + 6 * amp); ctx.lineTo(-5, y4 + 3 * amp); ctx.closePath(); ctx.fill();
      };
      wing(f * .85, "#8d877b", "#2a2622");
      ctx.strokeStyle = "#2b2723"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(-40, 6); ctx.moveTo(-8, 4); ctx.lineTo(-39, 8.5); ctx.stroke();
      ctx.fillStyle = "#ebe5d8"; ctx.beginPath(); ctx.ellipse(0, 0, 15, 5.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#141210"; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-20, 0); ctx.lineTo(-11, 4); ctx.closePath(); ctx.fill();
      brush(ctx, bez([11, -2], [22, -4], [30, -6], [40, -5], 8), 1, "#141210", 1, function (t) { return 3.4 - t * 1.2; });
      ctx.fillStyle = "#141210"; ctx.beginPath(); ctx.ellipse(42, -5, 4.2, 2.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#e9e3d6"; ctx.beginPath(); ctx.ellipse(40.5, -4, 1.6, 1, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#b3261e"; ctx.beginPath(); ctx.ellipse(42.5, -7.2, 2.1, 1.2, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#a39a7a"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(45.5, -5); ctx.lineTo(55, -4.2); ctx.stroke();
      wing(f, "#ece6d9", "#1a1714");
      ctx.restore();
    };

    var frame = function (ms) {
      var t = ms / 1000, dt = clamp(t - lastT || .016, 0, .05), i; lastT = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(land, 0, 0);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      for (i = 0; i < 3; i++) {   // 흐르는 안개
        var span = W * 1.8, mxp = ((t * (6 + i * 3) + i * W * .6) % span) - W * .4, myp = H * (.66 + i * .085);
        ctx.save(); ctx.translate(mxp, myp); ctx.scale(1, .1); softDot(ctx, 0, 0, W * .4, "196,184,158", .05); ctx.restore();
      }
      if (!reduce && !flock && t > nextFlock) {
        var dir = Math.random() < .5 ? 1 : -1, sc = rnd(.5, .85), cnt = 1 + ((Math.random() * 3) | 0), birds = [];
        for (var b = 0; b < cnt; b++) birds.push({ dx: -b * 64 * sc, dy: (b % 2 ? 1 : -1) * Math.ceil(b / 2) * 20 * sc, sc: sc * rnd(.9, 1.05), ph: rnd(0, TAU) });
        flock = { dir: dir, x: dir > 0 ? -80 : W + 80, y: H * rnd(.1, .32), sp: rnd(.55, .8), birds: birds };
      }
      if (flock) {
        flock.x += flock.dir * flock.sp * dt * 60;
        flock.birds.forEach(function (bd) {
          bd.ph += dt * 3.1;
          crane(flock.x + bd.dx * flock.dir, flock.y + bd.dy + Math.sin(t * .8 + bd.ph * .1) * 6, bd.sc, bd.ph, flock.dir, .78);
        });
        if (flock.x < -300 || flock.x > W + 300) { flock = null; nextFlock = t + rnd(18, 30); }
      }
      for (i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.x += (p.vx + Math.sin(t * .6 + p.ph) * .3) * dt * 60; p.y += p.vy * dt * 60; p.rot += p.vr * dt * 60; p.fl += p.vf * dt * 60;
        if (p.y > H + 12 || p.x > W + 20) { petals[i] = newPetal(false); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.fl));
        ctx.fillStyle = "rgba(" + p.c + "," + p.a + ")"; ctx.beginPath();
        ctx.moveTo(-p.s, 0); ctx.quadraticCurveTo(0, -p.s * 1.15, p.s, -p.s * .18); ctx.lineTo(p.s * .72, 0); ctx.lineTo(p.s, p.s * .18); ctx.quadraticCurveTo(0, p.s * 1.15, -p.s, 0); ctx.fill();
        ctx.restore();
      }
      for (i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i], age = t - rp.t;
        if (age > 1.8) { ripples.splice(i, 1); continue; }
        for (var k = 0; k < 2; k++) {
          var ag = age - k * .25; if (ag < 0) continue;
          ctx.strokeStyle = "rgba(226,214,190," + (.2 * (1 - ag / 1.55)) + ")"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(rp.x, rp.y, 4 + ag * 70, (4 + ag * 70) * .9, 0, 0, TAU); ctx.stroke();
        }
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", function (e) { if (!reduce && !e.target.closest("a,button,canvas,.world,summary,iframe")) ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() / 1000 }); });
    resize();
    if (!reduce) requestAnimationFrame(frame);
  })();

  /* ---------------- 커서 빛 ---------------- */
  var cg = document.querySelector(".cursor-glow");
  if (cg && finePointer && !reduce) {
    window.addEventListener("mousemove", function (e) {
      cg.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      cg.classList.add("on");
    }, { passive: true });
  }

  /* ---------------- 헤더 / 메뉴 ---------------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("scrolled", window.pageYOffset > 24); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------------- 스크롤 등장 ---------------- */
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach(function (el, i) { el.style.setProperty("--d", ((i % 3) * 0.12) + "s"); io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- 프로젝트 필터 ---------------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var items = document.querySelectorAll(".item[data-tags]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.classList.toggle("on", c === chip); });
      items.forEach(function (it) {
        var tags = it.getAttribute("data-tags").split(" ");
        it.classList.toggle("hidden", f !== "all" && tags.indexOf(f) < 0);
      });
    });
  });

  /* ---------------- 라이브 데모 모달 ---------------- */
  var modal = document.querySelector(".demo-modal");
  if (modal) {
    var frameEl = modal.querySelector("iframe"), ttl = modal.querySelector(".ttl"), ext = modal.querySelector(".ext"), lastFocus = null;
    var open = function (src, title) {
      lastFocus = document.activeElement;
      frameEl.src = src; ttl.textContent = title; ext.href = src;
      modal.classList.add("open"); document.body.classList.add("lock");
      modal.querySelector(".close").focus();
    };
    var close = function () {
      modal.classList.remove("open"); document.body.classList.remove("lock"); frameEl.src = "about:blank";
      if (history.replaceState && location.hash.indexOf("#demo-") === 0) history.replaceState(null, "", location.pathname);
      if (lastFocus) lastFocus.focus();
    };
    modal.querySelector(".close").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
    document.querySelectorAll("[data-demo]").forEach(function (w) {
      var go = function (e) {
        if (e && e.target.closest("a[target]")) return;
        open(w.getAttribute("data-demo"), w.getAttribute("data-title"));
      };
      w.addEventListener("click", go);
      w.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } });
    });
    var m = location.hash.match(/^#demo-(\w+)/);
    if (m) { var tgt = document.querySelector('[data-demo-id="' + m[1] + '"]'); if (tgt) open(tgt.getAttribute("data-demo"), tgt.getAttribute("data-title")); }
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
