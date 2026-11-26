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
     카드 수묵화 (산 · 매화 · 대나무 · 소나무 · 달)
     ====================================================== */
  var INK = "#18130e", INK_RGB = "24,19,14";
  var SCENES = {
    mountain: function (g, w, h, r) {
      softDot(g, w * .2, h * .24, 30, "168,48,42", .0);
      g.fillStyle = "rgba(168,48,42,.78)"; g.beginPath(); g.arc(w * .2, h * .24, 17, 0, TAU); g.fill();   // 붉은 해
      for (var L = 0; L < 4; L++) {
        var tone = .16 + L * .19, base = h * (.5 + L * .14), peaks = [];
        var np = 2 + ((r() * 3) | 0);
        for (var k = 0; k < np; k++) peaks.push({ c: r() * w, hgt: h * (.18 + r() * .3) * (1 - L * .16), wd: w * (.05 + r() * .09) });
        var ridge = function (x) { var y = base; for (var j = 0; j < peaks.length; j++) { var q = (x - peaks[j].c) / peaks[j].wd; y -= peaks[j].hgt * Math.exp(-q * q); } return y + Math.sin(x * .05 + L) * 2 + Math.sin(x * .13) * 1.2; };
        var top = h, x;
        for (x = 0; x <= w; x += 6) top = Math.min(top, ridge(x));
        var gr = g.createLinearGradient(0, top, 0, base + h * .12);
        gr.addColorStop(0, "rgba(" + INK_RGB + "," + tone + ")"); gr.addColorStop(1, "rgba(" + INK_RGB + ",0)");
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, h);
        for (x = 0; x <= w; x += 4) g.lineTo(x, ridge(x));
        g.lineTo(w, h); g.closePath(); g.fill();
        var line = []; for (x = 0; x <= w; x += 8) line.push({ x: x, y: ridge(x) });
        brush(g, line, 2.4, INK, tone + .1, function (t) { return .4 + .6 * Math.abs(Math.sin(t * 9 + L)); });
        g.strokeStyle = "rgba(" + INK_RGB + "," + tone * .5 + ")"; g.lineWidth = 1;
        for (x = 0; x < w; x += 7) if (r() < .45) { var yy = ridge(x) + 2; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + r() * 3 - 1.5, yy + 6 + r() * 22 * (1 - L * .15)); g.stroke(); }
        if (L === 3) for (x = 20; x < w; x += 26 + r() * 40) {   // 능선 위 작은 소나무
          var ty = ridge(x);
          g.fillStyle = INK; g.globalAlpha = .85; g.fillRect(x, ty - 12, 1.4, 12);
          for (var b = 0; b < 3; b++) { g.beginPath(); g.ellipse(x + .7, ty - 12 + b * 4, 5 - b, 1.8, 0, 0, TAU); g.fill(); }
          g.globalAlpha = 1;
        }
      }
      for (var bi = 0; bi < 4; bi++) {   // 먼 새
        var bx = w * (.55 + r() * .3), by = h * (.14 + r() * .14), s = 4 + r() * 3;
        g.strokeStyle = "rgba(" + INK_RGB + ",.7)"; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(bx - s, by - s * .4); g.quadraticCurveTo(bx - s * .4, by - s * .5, bx, by); g.quadraticCurveTo(bx + s * .4, by - s * .5, bx + s, by - s * .4); g.stroke();
      }
    },
    plum: function (g, w, h, r) {
      var tips = [];
      var branch = function (x, y, ang, len, wd, depth) {
        var seg = 4 + ((r() * 3) | 0), pts = [{ x: x, y: y }], cx = x, cy = y, a = ang;
        for (var i = 0; i < seg; i++) {
          a += (r() - .5) * .8; var sl = len / seg;
          cx += Math.cos(a) * sl; cy += Math.sin(a) * sl; pts.push({ x: cx, y: cy });
          if (depth > 0 && i > 0 && r() < .7) branch(cx, cy, a + (r() < .5 ? -1 : 1) * (.5 + r() * .5), len * (.35 + r() * .25), wd * .5, depth - 1);
          if (r() < .45) tips.push({ x: cx + (r() - .5) * wd * 2, y: cy + (r() - .5) * wd * 2 });
        }
        tips.push({ x: cx, y: cy });
        var prof = function (t) { return 1 - t * .75; };
        brush(g, pts, wd, INK, .88, prof);
        for (var k = 0; k < 2; k++) {   // 비백(마른 붓 자국)
          var off = pts.map(function (p) { return { x: p.x + (r() - .5) * wd * .5, y: p.y + (r() - .5) * wd * .5 }; });
          brush(g, off, wd * .35, "#4a3e30", .35, prof);
        }
        for (var kn = 1; kn < pts.length - 1; kn++) if (r() < .5) { g.fillStyle = INK; g.beginPath(); g.ellipse(pts[kn].x, pts[kn].y, wd * .5, wd * .3, r() * 3, 0, TAU); g.fill(); }
      };
      branch(-20, h * .92, -.55, w * .7, 17, 2);
      branch(w + 10, h * .1, 2.7, w * .32, 8, 1);
      tips.forEach(function (p, i) {
        if (i % 3 === 2) { g.fillStyle = "rgba(140,34,30,.85)"; g.beginPath(); g.arc(p.x, p.y, 2.5 + r() * 2, 0, TAU); g.fill(); return; }
        var s = 7 + r() * 5, rot = r() * TAU;
        for (var k = 0; k < 5; k++) {
          var a = rot + k * TAU / 5;
          g.fillStyle = "rgba(" + (176 + ((r() * 20) | 0)) + ",52,46," + (.55 + r() * .25) + ")";
          g.beginPath(); g.arc(p.x + Math.cos(a) * s * .55, p.y + Math.sin(a) * s * .55, s * .52, 0, TAU); g.fill();
        }
        g.strokeStyle = "rgba(60,20,14,.8)"; g.lineWidth = .7;
        for (var st = 0; st < 7; st++) { var sa = r() * TAU, sl = s * (.6 + r() * .3); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(sa) * sl, p.y + Math.sin(sa) * sl); g.stroke(); g.fillStyle = "rgba(40,16,10,.9)"; g.fillRect(p.x + Math.cos(sa) * sl - .8, p.y + Math.sin(sa) * sl - .8, 1.6, 1.6); }
        g.fillStyle = "rgba(90,30,10,.9)"; g.beginPath(); g.arc(p.x, p.y, 1.8, 0, TAU); g.fill();
      });
    },
    bamboo: function (g, w, h, r) {
      var leaf = function (x, y, ang, len, wd, a) {
        var pts = walk(x, y, ang, len / 10, 10, (r() - .5) * .05);
        brush(g, pts, wd, INK, a, function (t) { return t < .22 ? .35 + t / .22 * .65 : Math.pow((1 - t) / .78, 1.1); });
      };
      var stalks = [{ x: w * .28, wd: 15, a: .62, lean: .04 }, { x: w * .5, wd: 10, a: .3, lean: -.03 }, { x: w * .74, wd: 13, a: .5, lean: .06 }];
      stalks.forEach(function (s, si) {
        var y = h + 10, x = s.x, segs = [];
        while (y > -40) {
          var sl = 60 + r() * 34, ny = y - sl, nx = x + s.lean * sl;
          segs.push([x, y, nx, ny]);
          brush(g, [{ x: x, y: y - 3 }, { x: (x + nx) / 2, y: (y + ny) / 2 }, { x: nx, y: ny + 3 }], s.wd, "#3a3127", s.a, function (t) { return 1 - Math.abs(t - .5) * .15; });
          g.strokeStyle = "rgba(" + INK_RGB + "," + (s.a + .25) + ")"; g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(nx - s.wd * .55, ny + 2); g.quadraticCurveTo(nx, ny - 2, nx + s.wd * .55, ny + 2); g.stroke();
          x = nx; y = ny;
        }
        segs.forEach(function (sg, k) {
          if (k < 1 || r() < .4) return;
          var dir = (k + si) % 2 ? 1 : -1, tx = sg[2], ty = sg[3];
          var twig = walk(tx, ty, -Math.PI / 2 + dir * (.6 + r() * .3), 9, 6, dir * .05);
          brush(g, twig, 2, INK, s.a + .2, function (t) { return 1 - t * .6; });
          var end = twig[twig.length - 1], base = dir > 0 ? .3 : Math.PI - .3, nl = 3 + ((r() * 3) | 0);
          for (var l = 0; l < nl; l++) leaf(end.x, end.y, base + (l - nl / 2) * .38 + (r() - .5) * .2 + .5, 52 + r() * 36, 10 + r() * 4, (s.a + .3) * (.75 + r() * .25));
        });
      });
    },
    pine: function (g, w, h, r) {
      var trunk = bez([w * .9, h + 20], [w * .78, h * .6], [w * .62, h * .42], [w * .42, h * .2], 30);
      brush(g, trunk, 40, "#4a3d30", .82, function (t) { return 1 - t * .55; });
      var edgeL = [], edgeR = [];
      trunk.forEach(function (p, i) { var wd = 20 * (1 - (i / 30) * .55); edgeL.push({ x: p.x - wd * .7, y: p.y - wd * .7 }); edgeR.push({ x: p.x + wd * .7, y: p.y + wd * .7 }); });
      brush(g, edgeL, 2.6, INK, .85, function (t) { return .5 + .5 * Math.abs(Math.sin(t * 13)); });
      brush(g, edgeR, 2.2, INK, .75, function (t) { return .5 + .5 * Math.abs(Math.cos(t * 11)); });
      g.strokeStyle = "rgba(" + INK_RGB + ",.55)"; g.lineWidth = 1.2;
      for (var b = 0; b < 46; b++) { var p = trunk[(r() * 28) | 0]; g.beginPath(); g.ellipse(p.x + (r() - .5) * 14, p.y + (r() - .5) * 14, 3 + r() * 4, 2 + r() * 2, r() * 3, 0, TAU); g.stroke(); }
      var clusters = [];
      [[.35, -2.9, .5], [.6, -3.0, .38], [.85, -2.6, .3], [.5, -.4, .22]].forEach(function (bd) {
        var s = trunk[(bd[0] * 30) | 0], br = walk(s.x, s.y, bd[1], w * bd[2] / 8, 8, 0, function () { return (r() - .5) * .5; });
        brush(g, br, 9, INK, .85, function (t) { return 1 - t * .7; });
        br.forEach(function (q, i) { if (i > 2 && i % 2 === 0) clusters.push(q); });
        clusters.push(br[br.length - 1]);
      });
      clusters.forEach(function (c) {
        var R = 32 + r() * 20;
        softDot(g, c.x, c.y - R * .25, R * 1.25, "38,40,32", .16);
        g.strokeStyle = "rgba(16,18,13,.8)"; g.lineWidth = 1.1;
        for (var k = 0; k < 60; k++) {
          var a = Math.PI + .15 + r() * (Math.PI - .3), l = R * (.6 + r() * .4);
          g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(a) * l, c.y + Math.sin(a) * l * .55); g.stroke();
        }
      });
    },
    moon: function (g, w, h, r) {
      var wash = document.createElement("canvas"); wash.width = w; wash.height = h;
      var wg = wash.getContext("2d"), mx = w * .66, my = h * .36, mr = h * .21;
      var lg = wg.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, "rgba(40,33,26,.55)"); lg.addColorStop(1, "rgba(40,33,26,.2)");
      wg.fillStyle = lg; wg.fillRect(0, 0, w, h);
      wg.globalCompositeOperation = "destination-out";
      var mg = wg.createRadialGradient(mx, my, mr * .9, mx, my, mr * 1.25); mg.addColorStop(0, "rgba(0,0,0,1)"); mg.addColorStop(1, "rgba(0,0,0,0)");
      wg.fillStyle = mg; wg.beginPath(); wg.arc(mx, my, mr * 1.3, 0, TAU); wg.fill();
      g.drawImage(wash, 0, 0);
      g.save(); g.translate(mx, my + mr * .25); g.scale(1, .12); softDot(g, 0, 0, mr * 1.8, "40,33,26", .35); g.restore();   // 달을 가르는 구름
      for (var gi = 0; gi < 3; gi++) {   // 기러기
        var gx = mx - mr * .9 + gi * 30, gy = my - mr * .3 + gi * 12, s = 9 - gi;
        brush(g, bez([gx - s, gy - s * .7], [gx - s * .5, gy - s * .6], [gx - s * .2, gy - s * .1], [gx, gy], 6), 2.2, INK, .85);
        brush(g, bez([gx, gy], [gx + s * .2, gy - s * .1], [gx + s * .5, gy - s * .6], [gx + s, gy - s * .5], 6).reverse(), 2.2, INK, .85);
      }
      for (var k = 0; k < 16; k++) {   // 갈대
        var bx = w * .02 + r() * w * .42, top = h * (.38 + r() * .35), lean = .25 + r() * .3;
        var stalk = bez([bx, h + 6], [bx + 4, lerp(h, top, .5)], [bx + (h - top) * lean * .6, top + 20], [bx + (h - top) * lean, top], 14);
        brush(g, stalk, 2.2, INK, .75, function (t) { return 1 - t * .5; });
        var tip = stalk[stalk.length - 1];
        g.strokeStyle = "rgba(" + INK_RGB + ",.42)"; g.lineWidth = .8;
        for (var p = 0; p < 16; p++) { var a = .6 + r() * 1.4, l = 8 + r() * 14; g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo(tip.x + Math.cos(a) * l * .5, tip.y + Math.sin(a) * l * .3, tip.x + Math.cos(a) * l, tip.y + Math.sin(a) * l); g.stroke(); }
        if (r() < .7) { var mid = stalk[(4 + r() * 5) | 0]; var bl = walk(mid.x, mid.y, -.6 - r() * .8 + (r() < .5 ? 0 : Math.PI * .7), 7, 9, .08); brush(g, bl, 4, INK, .6); }
      }
    }
  };
  var cardPaper = null;
  document.querySelectorAll("[data-ink]").forEach(function (el) {
    var type = el.getAttribute("data-ink"), paint = SCENES[type];
    if (!paint) return;
    var w = 760, h = 460, c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d");
    if (!cardPaper) cardPaper = makePaper(w, h, 77);
    g.drawImage(cardPaper, 0, 0);
    g.lineCap = "round"; g.lineJoin = "round";
    paint(g, w, h, seeded(+(el.getAttribute("data-seed") || 1) * 7919));
    g.globalCompositeOperation = "multiply"; g.globalAlpha = .35; g.fillStyle = g.createPattern(grainTile, "repeat"); g.fillRect(0, 0, w, h);
    el.style.backgroundImage = "url(" + c.toDataURL("image/jpeg", .86) + ")";
  });

  /* ======================================================
     운룡도 (히어로) — 논리 좌표 400 x 500
     ====================================================== */
  var hero = document.getElementById("dragon");
  if (hero) (function () {
    var LW = 400, LH = 500, N = 150;
    var g = hero.getContext("2d"), paper = null, wash = document.createElement("canvas"), wg = wash.getContext("2d");
    var K = 1, CH = 1, grainPat = null;
    // 머리 → 꼬리 순 제어점: 달 앞을 지나 S자로 휘감아 내려와 여의주를 노려본다
    var CTRL = [[140, 388], [198, 410], [268, 414], [326, 352], [290, 290], [176, 282], [112, 228], [148, 166], [226, 100], [300, 48]];
    var MOON = { x: 112, y: 122, r: 60 }, HU = 19;
    var BANKS = [
      { x: 10, y: 66, n: 9, len: 190, r0: 18, r1: 32, sp: 1.3 },
      { x: 226, y: 200, n: 8, len: 170, r0: 16, r1: 28, sp: -1 },
      { x: -40, y: 322, n: 7, len: 150, r0: 18, r1: 28, sp: .8 },
      { x: 120, y: 488, n: 11, len: 300, r0: 20, r1: 34, sp: -.7 },
      { x: 296, y: 254, n: 5, len: 110, r0: 13, r1: 22, sp: 1.1 }
    ];
    var FRONT = [{ x: 190, y: 304, n: 7, len: 130, r0: 14, r1: 22, sp: .9 }, { x: 268, y: 70, n: 6, len: 100, r0: 12, r1: 20, sp: -1.2 }];
    var attn = { x: 0, y: 0 }, attnT = { x: 0, y: 0 }, roarAt = -10, nextRoar = 3.2, puffs = [], visible = true, lastT = 0;

    var resize = function () {
      var w = hero.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!w) return;
      hero.width = Math.round(w * dpr); hero.height = Math.round(w * dpr * LH / LW);
      K = hero.width / LW;
      wash.width = hero.width; wash.height = hero.height;
      paper = makePaper(hero.width, hero.height, 23);
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
      var n = P.length;
      for (var i = 0; i < n; i++) {
        var a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
        var tx = a.x - b.x, ty = a.y - b.y, d = Math.hypot(tx, ty) || 1;
        P[i].tx = tx / d; P[i].ty = ty / d;              // 머리 방향
        P[i].bx = -CH * P[i].ty; P[i].by = CH * P[i].tx; // 배 방향
      }
    };
    var radius = function (s) {
      if (s < .05) return 15 + s / .05 * 2;
      if (s < .26) return 17 + (s - .05) / .21 * 3;
      return 20 - 17.6 * Math.pow((s - .26) / .74, 1.2);
    };

    var spine = function (t) {
      var C = CTRL.map(function (p, i) {
        var w = i === 0 ? 1 : i === 1 ? .55 : i === 2 ? .2 : 0;
        return [p[0] + Math.sin(t * .5 + i * 1.3) * 4 + attn.x * w + (i < 2 ? Math.sin(t * .9) * 3 : 0),
                p[1] + Math.cos(t * .4 + i) * 4 + attn.y * w + (i < 2 ? Math.cos(t * .7) * 3 : 0)];
      });
      var P = resample(catmull(C), N), total = P.total;
      CH = 1; frames(P);
      for (var i = 0; i < N; i++) {                      // 몸을 따라 흐르는 물결
        var s = i / (N - 1), A = 5.5 * clamp(s / .12, 0, 1);
        var off = A * Math.sin(s * total / 170 * TAU - t * 1.25);
        P[i].x += -P[i].ty * off; P[i].y += P[i].tx * off;
      }
      CH = 1; frames(P);
      if (P[0].by < 0) { CH = -1; frames(P); }           // 머리가 똑바로 서도록 배 방향을 아래로
      for (i = 0; i < N; i++) P[i].r = radius(i / (N - 1));
      return P;
    };

    var bankLobes = function (b, t) {
      var out = [], drift = Math.sin(t * .06 * b.sp + b.x) * 18;
      for (var k = 0; k < b.n; k++) {
        var f = b.n > 1 ? k / (b.n - 1) : 0, h = Math.sin(k * 12.9898 + b.x) * 43758.5453; h -= Math.floor(h);
        out.push({ x: b.x + f * b.len + drift, y: b.y - Math.sin(f * Math.PI) * 12 + Math.sin(t * .3 + k) * 1.5,
                   r: (b.r0 + (b.r1 - b.r0) * h) * (1 + .04 * Math.sin(t * .6 + k * 1.7)) });
      }
      return out;
    };

    var drawWash = function (t) {
      wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = "source-over";
      wg.clearRect(0, 0, wash.width, wash.height);
      wg.setTransform(K, 0, 0, K, 0, 0);
      var lgr = wg.createLinearGradient(0, 0, 0, LH);
      lgr.addColorStop(0, "rgba(46,38,29,.5)"); lgr.addColorStop(.6, "rgba(46,38,29,.3)"); lgr.addColorStop(1, "rgba(46,38,29,.42)");
      wg.fillStyle = lgr; wg.fillRect(0, 0, LW, LH);
      wg.globalCompositeOperation = "destination-out";
      var mg = wg.createRadialGradient(MOON.x, MOON.y, MOON.r * .92, MOON.x, MOON.y, MOON.r * 1.22);
      mg.addColorStop(0, "rgba(0,0,0,1)"); mg.addColorStop(1, "rgba(0,0,0,0)");
      wg.fillStyle = mg; wg.beginPath(); wg.arc(MOON.x, MOON.y, MOON.r * 1.25, 0, TAU); wg.fill();
      BANKS.forEach(function (b) { bankLobes(b, t).forEach(function (l) { wg.save(); wg.translate(l.x, l.y); wg.scale(1, .66); softDot(wg, 0, 0, l.r * 1.3, "0,0,0", .95); wg.restore(); }); });
      g.drawImage(wash, 0, 0, LW, LH);
      g.strokeStyle = "rgba(70,56,40,.3)"; g.lineWidth = .9;   // 운문(구름 윤곽선)
      BANKS.forEach(function (b) {
        var ls = bankLobes(b, t);
        ls.forEach(function (l, k) {
          g.beginPath(); g.ellipse(l.x, l.y + l.r * .1, l.r * .82, l.r * .56, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
          if (k === ls.length - 1) { g.beginPath(); g.arc(l.x + l.r * .2, l.y - l.r * .05, l.r * .35, Math.PI * .9, Math.PI * 2.4); g.stroke(); }
        });
      });
    };

    var leg = function (P, idx, front, near, t, ph) {
      var q = P[idx], T = { x: q.tx, y: q.ty }, B = { x: q.bx, y: q.by }, ds = front ? 1 : -1;
      var sw = Math.sin(t * 1.5 + ph) * .35;
      var rot = function (v, a) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; };
      var nrm = function (v) { var d = Math.hypot(v.x, v.y) || 1; return { x: v.x / d, y: v.y / d }; };
      var u1 = rot(nrm({ x: B.x * .85 + T.x * ds * .55, y: B.y * .85 + T.y * ds * .55 }), sw * .5 * CH);
      var u2 = rot(nrm({ x: B.x * .2 + T.x * ds, y: B.y * .2 + T.y * ds }), sw * CH);
      var base = { x: q.x + B.x * q.r * .4, y: q.y + B.y * q.r * .4 };
      var elbow = { x: base.x + u1.x * q.r * 1.9, y: base.y + u1.y * q.r * 1.9 };
      var wrist = { x: elbow.x + u2.x * q.r * 1.55, y: elbow.y + u2.y * q.r * 1.55 };
      var limb = bez([base.x, base.y], [elbow.x - u1.x * q.r * .3, elbow.y - u1.y * q.r * .3], [elbow.x + u2.x * q.r * .2, elbow.y + u2.y * q.r * .2], [wrist.x, wrist.y], 12);
      var w0 = q.r * .95, w1 = q.r * .4, a = near ? 1 : .55;
      var lw = function (t2) { return lerp(w0, w1, Math.pow(t2, .8)) * (1 + .18 * Math.sin(t2 * Math.PI)); };
      brush(g, limb, 1, INK, .92 * a, function (t2) { return lw(t2) + 2.6; });
      brush(g, limb, 1, near ? "#77674f" : "#988870", a, lw);
      g.strokeStyle = "rgba(22,16,11," + .6 * a + ")"; g.lineWidth = .8;
      for (var sc = 2; sc < 11; sc += 2) { var lp = limb[sc]; g.beginPath(); g.arc(lp.x, lp.y, lw(sc / 12) * .32, Math.atan2(-u2.y, -u2.x) - 1.1, Math.atan2(-u2.y, -u2.x) + 1.1); g.stroke(); }
      for (var h = 0; h < 3; h++) {   // 팔꿈치 갈기
        var ang = Math.atan2(-T.y * ds + B.y * .25, -T.x * ds + B.x * .25) + (h - 1) * .35 * CH;
        brush(g, walk(elbow.x, elbow.y, ang, q.r * .16, 7, .1 * CH, function (k) { return Math.sin(t * 2 + k + h) * .05; }), q.r * .32, INK, .85 * a);
      }
      g.fillStyle = INK; g.globalAlpha = a; g.beginPath(); g.arc(wrist.x, wrist.y, w1 * .6, 0, TAU); g.fill(); g.globalAlpha = 1;
      [-.75, -.25, .25, .7].forEach(function (s) {   // 발톱
        var d = rot(u2, s), cl = q.r * .95;
        var claw = bez([wrist.x, wrist.y], [wrist.x + d.x * cl * .7, wrist.y + d.y * cl * .7], [wrist.x + d.x * cl * 1.05 + B.x * cl * .2, wrist.y + d.y * cl * 1.05 + B.y * cl * .2], [wrist.x + d.x * cl * .8 + B.x * cl * .6, wrist.y + d.y * cl * .8 + B.y * cl * .6], 8);
        brush(g, claw, 4.2, INK, .95 * a, function (t2) { return 1 - t2 * .9; });
      });
    };

    var drawHead = function (P, t, open) {
      var q = P[0], u = HU;
      g.save(); g.translate(q.x, q.y); g.transform(q.tx, q.ty, q.bx, q.by, 0, 0);
      var i, k;
      // 먼 뿔
      var hornF = bez([.6 * u, -1.05 * u], [-.1 * u, -2.1 * u], [-1.2 * u, -2.6 * u], [-2.6 * u, -2.7 * u], 16);
      brush(g, hornF, 1, "#3a3026", .6, function (t2) { return lerp(.45 * u, .07 * u, t2); });
      // 갈기 (뒤로 흩날림)
      var SRC = [[.3, -1.05, 3.75], [-.1, -.7, 3.5], [-.35, -.2, 3.2], [-.3, .35, 2.9], [0, .85, 2.5], [.6, .95, 2.15], [1.15, .9, 2.0]];
      SRC.forEach(function (s, idx) {
        for (var rep = 0; rep < 2; rep++) {
          var len = (2.6 + (idx % 3) * .5 + rep * .6) * u;
          var pts = walk(s[0] * u, s[1] * u, s[2] + rep * .12, len / 10, 10, (idx < 3 ? .03 : -.04), function (j) { return Math.sin(t * 1.8 + idx * .9 + j * .45) * .07; });
          brush(g, pts, (.42 - rep * .14) * u, INK, rep ? .5 : .85);
        }
      });
      // 아래턱
      var jawA = open * .45, hx = 1.2 * u, hy = .15 * u;
      var jtX = hx + Math.cos(jawA) * 2.4 * u - Math.sin(jawA) * .05 * u, jtY = hy + Math.sin(jawA) * 2.4 * u + Math.cos(jawA) * .05 * u;
      g.fillStyle = "rgba(34,12,9,.92)"; g.beginPath(); g.moveTo(hx - .2 * u, hy); g.lineTo(3.7 * u, -.06 * u); g.lineTo(jtX, jtY); g.closePath(); g.fill();
      if (open > .2) { brush(g, bez([hx, hy + .1 * u], [2 * u, .2 * u + open * .3 * u], [2.8 * u, .1 * u + open * .5 * u], [3.3 * u, .25 * u + open * .5 * u], 8), .32 * u, "#7d2b22", .9, function (t2) { return 1 - t2 * .6; }); }
      g.save(); g.translate(hx, hy); g.rotate(jawA);
      g.beginPath(); g.moveTo(-.45 * u, .05 * u); g.lineTo(2.3 * u, 0); g.bezierCurveTo(2.55 * u, .05 * u, 2.6 * u, .3 * u, 2.4 * u, .4 * u);
      g.bezierCurveTo(1.8 * u, .6 * u, .9 * u, .8 * u, .05 * u, .78 * u); g.closePath();
      var jg = g.createLinearGradient(0, 0, 0, .8 * u); jg.addColorStop(0, "#3a3026"); jg.addColorStop(1, "#6e5e48");
      g.fillStyle = jg; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = "#efe6d2";
      [[.9, .22], [1.4, .2], [2.0, .3]].forEach(function (tt) { g.beginPath(); g.moveTo(tt[0] * u, 0); g.lineTo((tt[0] + .1) * u, -tt[1] * u); g.lineTo((tt[0] + .2) * u, 0); g.fill(); });
      for (i = 0; i < 4; i++) { g.strokeStyle = "rgba(24,19,14,.55)"; g.lineWidth = .8; g.beginPath(); g.arc((.4 + i * .45) * u, .55 * u, .22 * u, Math.PI * .1, Math.PI * .9); g.stroke(); }
      g.restore();
      // 위턱 · 두개골
      var skull = function () {
        g.beginPath();
        g.moveTo(-.25 * u, -1.0 * u);
        g.bezierCurveTo(.4 * u, -1.5 * u, 1.2 * u, -1.55 * u, 1.75 * u, -1.3 * u);
        g.bezierCurveTo(2.3 * u, -1.1 * u, 3.0 * u, -1.0 * u, 3.7 * u, -.95 * u);
        g.bezierCurveTo(4.2 * u, -1.0 * u, 4.6 * u, -.72 * u, 4.48 * u, -.36 * u);
        g.bezierCurveTo(4.32 * u, -.1 * u, 3.9 * u, -.05 * u, 3.6 * u, -.08 * u);
        g.lineTo(1.5 * u, .05 * u);
        g.bezierCurveTo(1.0 * u, .2 * u, .6 * u, .6 * u, .1 * u, .95 * u);
        g.lineTo(-.35 * u, .9 * u); g.closePath();
      };
      var hg2 = g.createLinearGradient(0, -1.5 * u, 0, .9 * u);
      hg2.addColorStop(0, "#8a785e"); hg2.addColorStop(.45, "#5e4f3d"); hg2.addColorStop(1, "#2c241b");
      skull(); g.save(); g.shadowColor = "rgba(30,22,14,.45)"; g.shadowBlur = 8 * K; g.fillStyle = hg2; g.fill(); g.restore();
      g.save(); skull(); g.clip();
      softDot(g, .6 * u, .2 * u, 1.3 * u, "18,13,9", .45);
      softDot(g, 3.0 * u, -.75 * u, 1.1 * u, "236,224,198", .18);
      g.restore();
      skull(); g.strokeStyle = INK; g.lineWidth = 1.7; g.stroke();
      brush(g, bez([.3 * u, -.25 * u], [.9 * u, -.5 * u], [1.5 * u, -.3 * u], [1.75 * u, -.1 * u], 10), .16 * u, INK, .7, function (t2) { return Math.sin(t2 * Math.PI); });   // 광대뼈
      brush(g, bez([3.55 * u, -.12 * u], [3.3 * u, .05 * u], [3.05 * u, .02 * u], [2.85 * u, -.12 * u], 6), .1 * u, INK, .8);   // 입꼬리 주름
      brush(g, bez([1.9 * u, -1.15 * u], [2.6 * u, -1.0 * u], [3.3 * u, -.9 * u], [4.1 * u, -.85 * u], 10), .3 * u, "#cdbf9f", .35, function (t2) { return Math.sin(t2 * Math.PI); });
      g.fillStyle = "#efe6d2";   // 윗니 · 송곳니
      [[2.2, .16], [2.6, .18], [3.0, .2], [3.38, .42]].forEach(function (tt) { g.beginPath(); g.moveTo(tt[0] * u, -.02 * u); g.lineTo((tt[0] + .09) * u, tt[1] * u); g.lineTo((tt[0] + .19) * u, -.02 * u); g.fill(); });
      g.strokeStyle = "rgba(24,19,14,.7)"; g.lineWidth = .9;   // 주름 · 뺨 비늘
      for (i = 0; i < 3; i++) { g.beginPath(); g.arc((2.7 + i * .32) * u, -.72 * u, .2 * u, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      for (i = 0; i < 5; i++) { g.beginPath(); g.arc((.25 + (i % 3) * .4) * u, (.05 + Math.floor(i / 3) * .35) * u, .2 * u, -.4, Math.PI * .6); g.stroke(); }
      g.lineWidth = 1.2; g.beginPath(); g.arc(4.12 * u, -.6 * u, .14 * u, -.5, Math.PI * 1.6); g.stroke();   // 콧구멍
      // 눈
      g.fillStyle = "rgba(20,15,10,.92)"; g.beginPath(); g.ellipse(1.95 * u, -.76 * u, .56 * u, .38 * u, -.08, 0, TAU); g.fill();
      var eg = g.createRadialGradient(1.9 * u, -.8 * u, 0, 1.95 * u, -.76 * u, .42 * u);
      eg.addColorStop(0, "#f6d378"); eg.addColorStop(1, "#a8731f");
      g.fillStyle = eg; g.beginPath(); g.ellipse(1.95 * u, -.76 * u, .4 * u, .27 * u, -.08, 0, TAU); g.fill();
      g.fillStyle = "#0e0a06"; g.beginPath(); g.ellipse(2.0 * u, -.76 * u, .075 * u, .23 * u, 0, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,250,235,.9)"; g.beginPath(); g.arc(1.84 * u, -.86 * u, .055 * u, 0, TAU); g.fill();
      if (open > .5) softDot(g, 1.95 * u, -.76 * u, .9 * u, "246,200,90", .25 * open);
      // 눈썹 · 불꽃 털
      brush(g, bez([1.25 * u, -1.22 * u], [1.7 * u, -1.42 * u], [2.2 * u, -1.32 * u], [2.6 * u, -1.12 * u], 10), .34 * u, INK, .95, function (t2) { return .5 + .5 * Math.sin(t2 * Math.PI); });
      for (k = 0; k < 5; k++) brush(g, walk((1.0 + k * .32) * u, (-1.3 - (k % 2) * .08) * u, 3.55 + k * .1, (.28 + (k % 2) * .08) * u, 9, -.07, function (j) { return Math.sin(t * 2.2 + j * .6 + k) * .05; }), (.22 + (k % 2) * .06) * u, INK, .9);
      // 뿔
      var horn = bez([.95 * u, -1.25 * u], [.2 * u, -2.35 * u], [-1.0 * u, -2.95 * u], [-2.7 * u, -3.15 * u], 18);
      brush(g, horn, 1, "#2a221a", .95, function (t2) { return lerp(.52 * u, .08 * u, t2); });
      brush(g, horn, 1, "#cbbb98", .3, function (t2) { return lerp(.18 * u, .02 * u, t2); });
      var tineBase = horn[7];
      brush(g, bez([tineBase.x, tineBase.y], [tineBase.x - .2 * u, tineBase.y - .5 * u], [tineBase.x + .1 * u, tineBase.y - .9 * u], [tineBase.x + .35 * u, tineBase.y - 1.2 * u], 8), .3 * u, "#2a221a", .95, function (t2) { return 1 - t2 * .8; });
      g.strokeStyle = "rgba(220,205,175,.35)"; g.lineWidth = .7;
      for (i = 2; i < 14; i += 2) { var h0 = horn[i], h1 = horn[i + 1], dx = h1.x - h0.x, dy = h1.y - h0.y, d = Math.hypot(dx, dy) || 1, ww = lerp(.5, .1, i / 18) * u * .45; g.beginPath(); g.moveTo(h0.x - dy / d * ww, h0.y + dx / d * ww); g.lineTo(h0.x + dy / d * ww, h0.y - dx / d * ww); g.stroke(); }
      // 수염
      [[4.15, -.32, -.55, -.012, 0], [3.85, .02, .22, .022, 1.7]].forEach(function (wh) {
        var pts = walk(wh[0] * u, wh[1] * u, wh[2], .42 * u, 20, wh[3], function (j) { return Math.sin(t * 1.4 + j * .42 + wh[4]) * .11; });
        brush(g, pts, .18 * u, INK, .9, function (t2) { return 1 - t2 * .85; });
      });
      for (k = 0; k < 4; k++) brush(g, walk((1.5 + k * .28) * u, .8 * u, 2.0 + k * .08, .3 * u, 8, .04, function (j) { return Math.sin(t * 1.6 + j * .5 + k) * .06; }), .2 * u, INK, .8);   // 턱수염
      g.restore();
      return { x: q.x + q.tx * 3.9 * u + q.bx * .2 * u, y: q.y + q.ty * 3.9 * u + q.by * .2 * u, u: u };
    };

    var drawPearl = function (P, t, flash) {
      var q = P[0], u = HU;
      var px = q.x + q.tx * 6 * u - q.bx * 1.8 * u + Math.sin(t * .8) * 4, py = q.y + q.ty * 6 * u - q.by * 1.8 * u + Math.cos(t * 1.1) * 4;
      px = clamp(px, 26, LW - 26); py = clamp(py, 26, LH - 26);
      softDot(g, px, py, 36 + flash * 30, "250,226,160", .42 + flash * .4);
      for (var k = 0; k < 5; k++) {   // 화염보주: 위로 피어오르는 불꽃 기운
        var a0 = -Math.PI / 2 + (k - 2) * .55, sway = Math.sin(t * 1.6 + k * 1.3) * .12;
        var pts = walk(px + Math.cos(a0) * 11, py + Math.sin(a0) * 11, a0 + sway, 3 + (k % 2), 10, (k - 2) * -.06 + sway * .2, function (j) { return Math.sin(t * 2.4 + k + j * .6) * .05; });
        brush(g, pts, 6 - Math.abs(k - 2), "#b4432f", .28 + flash * .25, function (t2) { return Math.sin(Math.min(1, t2 * 3) * Math.PI / 2) * (1 - t2); });
      }
      var pg = g.createRadialGradient(px - 4, py - 4, 1, px, py, 13);
      pg.addColorStop(0, "#fffaf0"); pg.addColorStop(.6, "#efe2c2"); pg.addColorStop(1, "#c8b78f");
      g.fillStyle = pg; g.beginPath(); g.arc(px, py, 12.5, 0, TAU); g.fill();
      g.strokeStyle = "rgba(40,30,20,.6)"; g.lineWidth = 1; g.stroke();
    };

    var frame = function (ms) {
      var t = ms / 1000, i, q;
      if (!paper) return;
      var dt = clamp(t - lastT || .016, 0, .05); lastT = t;
      attn.x += (attnT.x - attn.x) * .05; attn.y += (attnT.y - attn.y) * .05;
      if (!reduce && t > nextRoar) { roarAt = t; nextRoar = t + rnd(9, 13); }
      var rx = (t - roarAt) / 1.8, open = .12 + Math.sin(t * 1.3) * .05, flash = 0;
      if (rx >= 0 && rx < 1) { open = Math.max(open, rx < .15 ? rx / .15 : rx < .7 ? 1 : 1 - (rx - .7) / .3); flash = rx < .5 ? Math.sin(rx / .5 * Math.PI) : 0; }

      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      g.drawImage(paper, 0, 0);
      g.setTransform(K, 0, 0, K, 0, 0); g.lineCap = "round"; g.lineJoin = "round";
      softDot(g, MOON.x, MOON.y, MOON.r * 1.1, "252,247,234", .4);
      drawWash(t);

      var P = spine(t), ds = P.total / (N - 1);
      var back = function (q2, f) { return { x: q2.x - q2.bx * q2.r * f, y: q2.y - q2.by * q2.r * f }; };
      var bel = function (q2, f) { return { x: q2.x + q2.bx * q2.r * f, y: q2.y + q2.by * q2.r * f }; };

      // 등지느러미 (불꽃 모양)
      for (i = 4, k = 0; i < N * .9; i += 3, k++) {
        q = P[i]; var q2 = P[Math.min(i + 3, N - 1)], hh = (q.r * .7 + 4) * (k % 2 ? .55 : 1);
        var b0 = back(q, .8), b1 = back(q2, .8), mx = (b0.x + b1.x) / 2, my = (b0.y + b1.y) / 2;
        var tip = { x: mx - q.bx * hh - q.tx * hh * 1.05, y: my - q.by * hh - q.ty * hh * 1.05 };
        g.fillStyle = "rgba(24,18,12,.9)"; g.beginPath(); g.moveTo(b0.x, b0.y);
        g.bezierCurveTo(b0.x - q.bx * hh * .7, b0.y - q.by * hh * .7, tip.x + q.tx * hh * .5, tip.y + q.ty * hh * .5, tip.x, tip.y);
        g.quadraticCurveTo(mx - q.bx * hh * .2 - q.tx * hh * .25, my - q.by * hh * .2 - q.ty * hh * .25, b1.x, b1.y); g.closePath(); g.fill();
        g.strokeStyle = "rgba(220,205,175,.22)"; g.lineWidth = .6;
        g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo(mx - q.bx * hh * .5, my - q.by * hh * .5, tip.x * .85 + mx * .15, tip.y * .85 + my * .15); g.stroke();
      }
      var k;
      leg(P, 22, true, false, t, 1.4);
      leg(P, 84, false, false, t, 3.6);

      // 몸통
      var BK = [], BL = [];
      for (i = 0; i < N; i++) { BK.push(back(P[i], 1)); BL.push(bel(P[i], 1)); }
      g.beginPath(); g.moveTo(BK[0].x, BK[0].y);
      for (i = 1; i < N; i++) g.lineTo(BK[i].x, BK[i].y);
      for (i = N - 1; i >= 0; i--) g.lineTo(BL[i].x, BL[i].y);
      g.closePath();
      g.save(); g.shadowColor = "rgba(34,24,14,.5)"; g.shadowBlur = 12 * K; g.fillStyle = "rgba(112,98,78,.88)"; g.fill(); g.restore();
      [[1, .6, .4], [.6, .15, .18]].forEach(function (band) {   // 등 쪽 짙은 먹
        g.beginPath(); var a0 = back(P[0], band[0]); g.moveTo(a0.x, a0.y);
        for (i = 1; i < N; i++) { var p1 = back(P[i], band[0]); g.lineTo(p1.x, p1.y); }
        for (i = N - 1; i >= 0; i--) { var p2 = back(P[i], band[1]); g.lineTo(p2.x, p2.y); }
        g.closePath(); g.fillStyle = "rgba(20,15,10," + band[2] + ")"; g.fill();
      });
      // 배 (밝은 비늘판)
      g.beginPath(); var c0 = bel(P[0], .5); g.moveTo(c0.x, c0.y);
      for (i = 1; i < N; i++) { var c1 = bel(P[i], .5); g.lineTo(c1.x, c1.y); }
      for (i = N - 1; i >= 0; i--) { var c2 = bel(P[i], .96); g.lineTo(c2.x, c2.y); }
      g.closePath(); g.fillStyle = "rgba(188,172,142,.8)"; g.fill();
      g.strokeStyle = "rgba(44,34,24,.32)"; g.lineWidth = .7;
      for (i = 3; i < N - 2; i += 2) {
        var s0 = bel(P[i], .52), s1 = bel(P[i], .94), mid = bel(P[i], .73);
        g.beginPath(); g.moveTo(s0.x, s0.y); g.quadraticCurveTo(mid.x - P[i].tx * 1.6, mid.y - P[i].ty * 1.6, s1.x, s1.y); g.stroke();
      }
      // 비늘 (겹쳐진 초승달 모양)
      [-.78, -.44, -.1, .24].forEach(function (f, ri) {
        var idx = 3 + (ri % 2) * Math.max(1, (P[3].r * .62) / ds) * .5;
        while (idx < N - 3) {
          q = P[Math.round(idx)];
          var sz = q.r * .36, cx = q.x + q.bx * f * q.r + q.tx * sz * .3, cy = q.y + q.by * f * q.r + q.ty * sz * .3;
          var ang = Math.atan2(-q.ty, -q.tx), ix = cx + q.tx * sz * .35, iy = cy + q.ty * sz * .35;
          g.fillStyle = "rgba(22,16,11," + (.62 - ri * .06) + ")";
          g.beginPath(); g.arc(cx, cy, sz, ang - 1.35, ang + 1.35); g.arc(ix, iy, sz * .78, ang + 1.2, ang - 1.2, true); g.closePath(); g.fill();
          g.strokeStyle = "rgba(232,220,194,.22)"; g.lineWidth = .6;
          g.beginPath(); g.arc(ix, iy, sz * .72, ang - .8, ang + .8); g.stroke();
          idx += Math.max(1, (q.r * .62) / ds);
        }
      });
      // 먹의 농담: 몸통 안쪽에 번진 얼룩과 종이 결
      g.save(); g.beginPath(); g.moveTo(BK[0].x, BK[0].y);
      for (i = 1; i < N; i++) g.lineTo(BK[i].x, BK[i].y);
      for (i = N - 1; i >= 0; i--) g.lineTo(BL[i].x, BL[i].y);
      g.closePath(); g.clip();
      for (i = 6; i < N; i += 11) softDot(g, P[i].x - P[i].bx * P[i].r * .3, P[i].y - P[i].by * P[i].r * .3, P[i].r * (1.4 + (i % 3) * .4), "18,13,9", .22 + (i % 4) * .05);
      g.restore();
      // 외곽선 (붓 자국)
      brush(g, BK, 1, INK, .92, function (tt, j) { return 1 + 1.8 * P[j].r / 20 + Math.sin(j * .7) * .4; });
      brush(g, BL, 1, INK, .75, function (tt, j) { return .7 + .7 * P[j].r / 19.5; });
      // 꼬리 털
      q = P[N - 1];
      for (k = 0; k < 8; k++) {
        var ta = Math.atan2(-q.ty, -q.tx) + (k - 3.5) * .17;
        brush(g, walk(q.x, q.y, ta, 3.6 + (k % 3), 9, (k - 3.5) * .02, function (j) { return Math.sin(t * 2.2 + j * .5 + k) * .08; }), 3.4, INK, .88);
      }
      leg(P, 17, true, true, t, 0);
      leg(P, 79, false, true, t, 2.2);
      var mouth = drawHead(P, t, open);
      drawPearl(P, t, flash);

      // 포효: 입김이 먹처럼 번진다
      if (rx > .1 && rx < .6 && !reduce) for (k = 0; k < 2; k++) puffs.push({ x: mouth.x, y: mouth.y, vx: P[0].tx * rnd(.8, 1.6) + rnd(-.3, .3), vy: P[0].ty * rnd(.8, 1.6) + rnd(-.3, .3), r: rnd(3, 6), life: 1 });
      for (i = puffs.length - 1; i >= 0; i--) {
        var pf = puffs[i]; pf.x += pf.vx * dt * 60; pf.y += pf.vy * dt * 60; pf.vx *= .97; pf.vy *= .97; pf.r += .45 * dt * 60; pf.life -= .011 * dt * 60;
        if (pf.life <= 0) { puffs.splice(i, 1); continue; }
        softDot(g, pf.x, pf.y, pf.r, "52,42,32", .2 * pf.life);
      }

      FRONT.forEach(function (b) { bankLobes(b, t).forEach(function (l) { g.save(); g.translate(l.x, l.y); g.scale(1, .5); softDot(g, 0, 0, l.r * 1.6, "221,210,188", .78); g.restore(); }); });
      g.strokeStyle = "rgba(70,56,40,.28)"; g.lineWidth = .9;
      FRONT.forEach(function (b) { bankLobes(b, t).forEach(function (l) { g.beginPath(); g.ellipse(l.x, l.y + l.r * .1, l.r * .8, l.r * .54, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); });

      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "multiply"; g.globalAlpha = .4; g.fillStyle = grainPat; g.fillRect(0, 0, hero.width, hero.height);
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
