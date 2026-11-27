// dev-han portfolio — Aquarium
// 화면 전체가 수조: 물고기(8종) · 새우 · 해파리 · 해마 · 가오리 · 수초 · 산호 · 기포
// F 키 / 먹이 버튼으로 먹이 주기, 빈 곳 클릭 시 물고기가 놀라 흩어짐
// 메뉴, 등장 효과, 프로젝트 필터, 라이브 데모 모달
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TAU = Math.PI * 2;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var pick = function (a) { return a[(Math.random() * a.length) | 0]; };

  var softDot = function (g, x, y, r, rgb, a) {
    if (!(r > 0)) return;
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(" + rgb + "," + a + ")"); gr.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  // 폭이 변하는 띠(수초, 해마 몸통)
  var ribbon = function (g, pts, wf) {
    var n = pts.length, L = [], R = [], i;
    for (i = 0; i < n; i++) {
      var a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, w = wf(i / (n - 1)) / 2;
      L.push(pts[i].x - dy / d * w, pts[i].y + dx / d * w); R.push(pts[i].x + dy / d * w, pts[i].y - dx / d * w);
    }
    g.beginPath(); g.moveTo(L[0], L[1]);
    for (i = 2; i < L.length; i += 2) g.lineTo(L[i], L[i + 1]);
    for (i = R.length - 2; i >= 0; i -= 2) g.lineTo(R[i], R[i + 1]);
    g.closePath();
  };

  /* ======================================================
     물고기 종류
     len: 몸길이(px) · h: 몸 높이 비율 · tail/tailH: 꼬리 길이/높이 비율
     ====================================================== */
  var SPECIES = {
    tetra: { len: [12, 16], h: .3, tail: .3, tailH: .2, fork: 1, body: ["#33558f", "#8fb2d6"], belly: "#e2ebf3", pattern: "neon", fin: "rgba(210,230,255,.35)", speed: [42, 64] },
    clown: { len: [22, 30], h: .48, tail: .26, tailH: .3, body: ["#ff6410", "#ff8a2a"], belly: "#ffa543", pattern: "bands", fin: "#ff7a1a", finEdge: "#1a1110", speed: [24, 36] },
    tang: { len: [34, 46], h: .62, tail: .3, tailH: .42, fork: 1, body: ["#1636b2", "#2a62ea"], belly: "#3d7bff", pattern: "tang", fin: "#1b3aa6", finEdge: "#0a1640", tailColor: "#ffc81f", speed: [26, 38] },
    yellow: { len: [28, 36], h: .82, tail: .24, tailH: .36, snout: 1, body: ["#ffc710", "#ffde46"], belly: "#fff07a", pattern: "spine", fin: "#ffd21f", speed: [22, 32] },
    angel: { len: [34, 48], h: .9, tail: .3, tailH: .5, tall: 1, body: ["#b6bcc6", "#e8ebf0"], belly: "#f6f7f9", pattern: "angel", fin: "rgba(225,228,234,.72)", speed: [14, 24] },
    discus: { len: [36, 46], h: .95, tail: .2, tailH: .34, body: ["#b2321e", "#de6833"], belly: "#f2a04d", pattern: "discus", fin: "#c84a2c", speed: [14, 22] },
    goldfish: { len: [32, 46], h: .58, tail: .62, tailH: .5, flowing: 1, body: ["#ff5a10", "#ff8c2e"], belly: "#ffd3a1", pattern: "koi", fin: "rgba(255,130,50,.6)", tailColor: "rgba(255,140,60,.55)", speed: [16, 26] },
    trevally: { len: [80, 120], h: .42, tail: .3, tailH: .34, fork: 1, body: ["#46606f", "#a6bac4"], belly: "#e6edf0", pattern: "lateral", fin: "rgba(150,170,185,.7)", tailColor: "rgba(200,185,120,.8)", speed: [30, 44] }
  };

  var makeFish = function (type, z, x, y) {
    var S = SPECIES[type], len = rnd(S.len[0], S.len[1]);
    return { kind: "fish", type: type, sp: S, len: len, base: len, z: z, scale: [.55, 1, 1.35][z], x: x, y: y,
             vx: rnd(-1, 1) * S.speed[0], vy: 0, face: Math.random() < .5 ? -1 : 1, pitch: 0, phase: rnd(0, TAU),
             tx: x, ty: y, retarget: 0, speed: rnd(S.speed[0], S.speed[1]), gulp: 0, flee: 0, seed: Math.random() * 1000 };
  };

  var fishBody = function (g, L, H, snout) {
    var nx = snout ? L * .6 : L * .5;
    g.beginPath(); g.moveTo(nx, snout ? H * .06 : 0);
    g.bezierCurveTo(L * (snout ? .42 : .46), -H * .42, L * .15, -H * .52, -L * .05, -H * .5);
    g.bezierCurveTo(-L * .22, -H * .46, -L * .32, -H * .18, -L * .38, -H * .1);
    g.lineTo(-L * .38, H * .1);
    g.bezierCurveTo(-L * .32, H * .18, -L * .22, H * .46, -L * .05, H * .5);
    g.bezierCurveTo(L * .15, H * .52, L * (snout ? .42 : .46), H * .42, nx, snout ? H * .1 : 0);
    g.closePath();
  };

  var drawFish = function (g, f) {
    var S = f.sp, L = f.len * f.scale, H = L * S.h, tl = L * S.tail, th = L * S.tailH, sw = Math.sin(f.phase), i;
    var fs = f.face >= 0 ? Math.max(.12, f.face) : Math.min(-.12, f.face);
    g.save(); g.translate(f.x, f.y); g.rotate(f.pitch * (fs < 0 ? -1 : 1)); g.scale(fs, 1);
    // 꼬리
    g.save(); g.translate(-L * .36, 0); g.rotate(sw * (S.flowing ? .28 : .42));
    g.fillStyle = S.tailColor || S.fin; g.beginPath();
    if (S.flowing) {
      var w1 = Math.sin(f.phase * .7) * th * .25;
      g.moveTo(0, -th * .2); g.bezierCurveTo(-tl * .3, -th * 1.2, -tl * .9, -th * 1.3 + w1, -tl, -th * .55 + w1);
      g.bezierCurveTo(-tl * .7, -th * .15, -tl * .7, th * .15, -tl, th * .55 - w1);
      g.bezierCurveTo(-tl * .9, th * 1.3 - w1, -tl * .3, th * 1.2, 0, th * .2);
    } else if (S.fork) {
      g.moveTo(0, -th * .22); g.quadraticCurveTo(-tl * .5, -th * .5, -tl, -th); g.quadraticCurveTo(-tl * .66, -th * .1, -tl * .6, 0);
      g.quadraticCurveTo(-tl * .66, th * .1, -tl, th); g.quadraticCurveTo(-tl * .5, th * .5, 0, th * .22);
    } else {
      g.moveTo(0, -th * .24); g.bezierCurveTo(-tl * .5, -th, -tl * 1.05, -th * .9, -tl, 0); g.bezierCurveTo(-tl * 1.05, th * .9, -tl * .5, th, 0, th * .24);
    }
    g.closePath(); g.fill();
    if (S.finEdge) { g.strokeStyle = S.finEdge; g.lineWidth = Math.max(.6, L * .022); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = Math.max(.4, L * .008);
    for (i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-tl * .1, i * th * .08); g.lineTo(-tl * .85, i * th * .32); g.stroke(); }
    g.restore();
    // 등/뒷지느러미
    g.fillStyle = S.fin;
    if (S.tall) {
      g.beginPath(); g.moveTo(L * .12, -H * .42); g.quadraticCurveTo(-L * .05, -H * 1.25, -L * .45, -H * 1.12 + sw * H * .06); g.quadraticCurveTo(-L * .22, -H * .5, -L * .3, -H * .2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(L * .12, H * .42); g.quadraticCurveTo(-L * .05, H * 1.25, -L * .45, H * 1.12 - sw * H * .06); g.quadraticCurveTo(-L * .22, H * .5, -L * .3, H * .2); g.closePath(); g.fill();
    } else {
      var fh = L * .12;
      g.beginPath(); g.moveTo(L * .18, -H * .46); g.quadraticCurveTo(-L * .02, -H * .5 - fh * 1.4, -L * .3, -H * .22); g.lineTo(-L * .32, -H * .14); g.closePath(); g.fill();
      if (S.finEdge) { g.strokeStyle = S.finEdge; g.lineWidth = Math.max(.5, L * .02); g.stroke(); }
      g.beginPath(); g.moveTo(-L * .02, H * .46); g.quadraticCurveTo(-L * .18, H * .5 + fh, -L * .32, H * .2); g.lineTo(-L * .3, H * .14); g.closePath(); g.fill();
      if (S.finEdge) g.stroke();
    }
    // 몸통
    var bg = g.createLinearGradient(0, -H * .5, 0, H * .5);
    bg.addColorStop(0, S.body[0]); bg.addColorStop(.55, S.body[1]); bg.addColorStop(1, S.belly);
    fishBody(g, L, H, S.snout); g.fillStyle = bg; g.fill();
    g.save(); fishBody(g, L, H, S.snout); g.clip();
    switch (S.pattern) {
      case "neon":
        g.shadowColor = "#5ef0ff"; g.shadowBlur = Math.max(3, L * .35);
        g.fillStyle = "rgba(90,235,255,.95)"; g.fillRect(-L * .32, -H * .2, L * .78, H * .17);
        g.shadowBlur = 0; g.fillStyle = "#ff3d55"; g.fillRect(-L * .42, 0, L * .4, H * .42);
        break;
      case "bands":
        [[L * .24, L * .1], [-L * .02, L * .13], [-L * .3, L * .07]].forEach(function (b) {
          g.fillStyle = "#151010"; g.beginPath(); g.ellipse(b[0], 0, b[1] * .5 + L * .02, H * .62, 0, 0, TAU); g.fill();
          g.fillStyle = "#fffaf2"; g.beginPath(); g.ellipse(b[0], 0, b[1] * .5, H * .6, 0, 0, TAU); g.fill();
        });
        break;
      case "tang":
        g.strokeStyle = "#0a1640"; g.lineWidth = H * .16; g.lineCap = "round";
        g.beginPath(); g.moveTo(L * .3, -H * .2); g.bezierCurveTo(L * .05, -H * .45, -L * .28, -H * .12, -L * .04, H * .04); g.bezierCurveTo(L * .1, H * .14, -L * .2, H * .22, -L * .38, -H * .04); g.stroke();
        break;
      case "angel":
        g.fillStyle = "rgba(30,30,36,.72)";
        [L * .26, L * .03, -L * .22].forEach(function (x) { g.fillRect(x, -H, L * .05, H * 2); });
        break;
      case "discus":
        g.strokeStyle = "rgba(79,209,197,.85)"; g.lineWidth = Math.max(.6, L * .025);
        for (i = -3; i <= 3; i++) {
          g.beginPath();
          for (var k = 0; k <= 18; k++) { var x = -L * .4 + k * L * .05, yy = i * H * .12 + Math.sin(x * 12 / L + i) * H * .03; if (k) g.lineTo(x, yy); else g.moveTo(x, yy); }
          g.stroke();
        }
        break;
      case "koi":
        g.fillStyle = "rgba(255,246,232,.95)";
        for (i = 0; i < 3; i++) { var sx = Math.sin(f.seed + i * 2.1), sy = Math.cos(f.seed * 1.7 + i); g.beginPath(); g.ellipse(sx * L * .25, sy * H * .25, L * (.1 + .05 * Math.abs(sy)), H * .2, sx, 0, TAU); g.fill(); }
        break;
      case "lateral":
        g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = Math.max(.5, L * .01);
        g.beginPath(); g.moveTo(L * .3, -H * .1); g.quadraticCurveTo(0, -H * .14, -L * .38, 0); g.stroke();
        break;
      case "spine":
        g.fillStyle = "#fffbe8"; g.beginPath(); g.ellipse(-L * .33, 0, L * .03, H * .06, 0, 0, TAU); g.fill();
        break;
    }
    softDot(g, L * .08, -H * .28, L * .32, "255,255,255", .16);   // 비늘 광택
    g.restore();
    fishBody(g, L, H, S.snout); g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = Math.max(.4, L * .014); g.stroke();
    // 가슴지느러미
    g.save(); g.translate(L * .12, H * .1); g.rotate(.5 + Math.sin(f.phase * 1.4) * .4);
    g.fillStyle = S.fin; g.globalAlpha = .8; g.beginPath(); g.ellipse(-L * .07, 0, L * .1, L * .035, 0, 0, TAU); g.fill();
    g.restore(); g.globalAlpha = 1;
    // 아가미 · 눈 · 입
    g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = Math.max(.4, L * .012);
    g.beginPath(); g.arc(L * .14, 0, H * .3, -.9, .9); g.stroke();
    var ex = L * (S.snout ? .3 : .33), ey = -H * (S.h > .7 ? .16 : .1), er = Math.max(1, L * .055);
    g.fillStyle = "#f4efd9"; g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill();
    g.fillStyle = "#0b0b0b"; g.beginPath(); g.arc(ex + er * .12, ey, er * .64, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(ex - er * .15, ey - er * .25, er * .22, 0, TAU); g.fill();
    if (f.gulp > 0) { g.fillStyle = "#2a0d08"; g.beginPath(); g.arc(L * (S.snout ? .58 : .48), H * .04, Math.max(.8, L * .035), 0, TAU); g.fill(); }
    g.restore();
  };

  /* ---------------- 해파리 ---------------- */
  var JELLY_COLORS = ["255,150,210", "160,175,255", "120,225,255", "255,196,130", "200,160,255"];
  var makeJelly = function (z, x, y) {
    return { kind: "jelly", z: z, scale: [.55, 1, 1.3][z], x: x, y: y, r: rnd(14, 34), c: pick(JELLY_COLORS), ph: rnd(0, TAU), vx: rnd(-5, 5), tent: 10 + ((Math.random() * 6) | 0) };
  };
  var drawJelly = function (g, j, t) {
    var R = j.r * j.scale, p = .5 + .5 * Math.sin(j.ph), bw = R * (1.08 - .16 * p), bh = R * (.7 + .14 * p), k, s;
    g.save(); g.translate(j.x, j.y); g.globalCompositeOperation = "lighter";
    g.strokeStyle = "rgba(" + j.c + ",.32)"; g.lineWidth = Math.max(.5, .8 * j.scale);
    for (k = 0; k < j.tent; k++) {   // 촉수
      var x0 = -bw * .9 + k * (1.8 * bw / (j.tent - 1)), len = R * (2.2 + (k % 3) * .5);
      g.beginPath(); g.moveTo(x0, 0);
      for (s = 1; s <= 12; s++) g.lineTo(x0 + Math.sin(t * 1.6 + s * .55 + k) * R * .2 * s / 12, s / 12 * len);
      g.stroke();
    }
    g.lineWidth = Math.max(1.5, 3.2 * j.scale); g.strokeStyle = "rgba(" + j.c + ",.2)";
    for (k = 0; k < 4; k++) {   // 구완
      var ox = (k - 1.5) * bw * .22;
      g.beginPath(); g.moveTo(ox, 0);
      for (s = 1; s <= 10; s++) g.lineTo(ox + Math.sin(t * 1.2 + s * .7 + k * 1.3) * R * .14, s / 10 * R * 1.7);
      g.stroke();
    }
    var bg = g.createRadialGradient(0, -bh * .55, R * .05, 0, -bh * .3, bw);
    bg.addColorStop(0, "rgba(255,255,255,.5)"); bg.addColorStop(.45, "rgba(" + j.c + ",.32)"); bg.addColorStop(1, "rgba(" + j.c + ",.06)");
    g.fillStyle = bg; g.beginPath(); g.moveTo(-bw, 0); g.bezierCurveTo(-bw, -bh * 1.35, bw, -bh * 1.35, bw, 0);
    for (k = 0; k < 8; k++) g.quadraticCurveTo(bw - (k + .5) * bw / 4, bh * .16, bw - (k + 1) * bw / 4, 0);
    g.closePath(); g.fill();
    g.strokeStyle = "rgba(" + j.c + ",.55)"; g.lineWidth = Math.max(.5, .8 * j.scale); g.stroke();
    for (k = 0; k < 4; k++) softDot(g, (k - 1.5) * bw * .28, -bh * .35, R * .18, j.c, .35);
    g.restore();
  };

  /* ---------------- 새우 ---------------- */
  var SHRIMP = {
    cherry: { body: "rgba(226,46,40,.92)", seg: "rgba(150,20,16,.6)", leg: "rgba(226,70,60,.9)" },
    cleaner: { body: "rgba(250,236,226,.75)", seg: "rgba(220,40,40,.85)", leg: "rgba(250,220,210,.8)", stripe: 1 },
    ghost: { body: "rgba(215,235,240,.32)", seg: "rgba(255,160,80,.75)", leg: "rgba(215,235,240,.45)", dots: 1 }
  };
  var makeShrimp = function (x, y) {
    return { kind: "shrimp", x: x, y: y, gy: 0, vyh: 0, len: rnd(16, 26), face: pick([-1, 1]), vx: 0, state: "idle", timer: rnd(1, 4), ph: rnd(0, TAU), col: SHRIMP[pick(["cherry", "cherry", "cleaner", "ghost"])], gulp: 0 };
  };
  var drawShrimp = function (g, s, t) {
    var L = s.len, C = s.col, k;
    g.save(); g.translate(s.x, s.y - L * .18 + s.gy); g.scale(s.face, 1);
    g.strokeStyle = C.leg; g.lineWidth = Math.max(.5, L * .025); g.lineCap = "round";
    for (k = 0; k < 5; k++) {   // 다리
      var lx = L * (.28 - k * .07), sw = Math.sin(t * (s.vx ? 14 : 3) + k * 1.3) * L * .05;
      g.beginPath(); g.moveTo(lx, L * .05); g.lineTo(lx + sw, L * .2); g.stroke();
    }
    for (k = 0; k < 4; k++) { var px = -L * (.06 + k * .09); g.beginPath(); g.moveTo(px, L * .1); g.lineTo(px + Math.sin(t * 10 + k) * L * .03, L * .18); g.stroke(); }
    g.lineWidth = Math.max(.4, L * .014);   // 더듬이
    [[-.25, 1.6], [-.55, 1.25]].forEach(function (a, i) {
      var ang = a[0] + Math.sin(t * 1.3 + i + s.ph) * .12, x = L * .4, y = -L * .06;
      g.beginPath(); g.moveTo(x, y);
      for (var q = 1; q <= 10; q++) { ang += .07; x += Math.cos(ang) * L * a[1] / 10; y += Math.sin(ang) * L * a[1] / 10; g.lineTo(x, y); }
      g.stroke();
    });
    g.fillStyle = C.body;   // 꼬리 부채
    g.beginPath(); g.moveTo(-L * .44, L * .06); g.lineTo(-L * .62, -L * .04); g.lineTo(-L * .6, L * .14); g.lineTo(-L * .52, L * .2); g.closePath(); g.fill();
    for (k = 5; k >= 0; k--) {   // 배마디
      var cx = -L * (.04 + k * .075), cy = L * (.02 + k * k * .006), rr = L * (.12 - k * .01);
      g.fillStyle = C.body; g.beginPath(); g.ellipse(cx, cy, rr * .75, rr, -.2 - k * .08, 0, TAU); g.fill();
      g.strokeStyle = C.seg; g.lineWidth = Math.max(.4, L * .02); g.beginPath(); g.ellipse(cx, cy, rr * .75, rr, -.2 - k * .08, -1.2, 1.2); g.stroke();
    }
    g.fillStyle = C.body; g.beginPath(); g.ellipse(L * .18, -L * .01, L * .24, L * .12, -.08, 0, TAU); g.fill();   // 머리가슴
    if (C.stripe) { g.fillStyle = C.seg; g.fillRect(-L * .45, -L * .1, L * .85, L * .04); g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(-L * .45, -L * .06, L * .85, L * .02); }
    if (C.dots) { g.fillStyle = C.seg; for (k = 0; k < 4; k++) { g.beginPath(); g.arc(-L * .3 + k * L * .18, L * .02, L * .025, 0, TAU); g.fill(); } }
    g.strokeStyle = C.seg; g.lineWidth = Math.max(.5, L * .025); g.beginPath(); g.moveTo(L * .36, -L * .05); g.lineTo(L * .56, -L * .11); g.stroke();   // 이마뿔
    g.fillStyle = "#111"; g.beginPath(); g.arc(L * .34, -L * .07, Math.max(.8, L * .035), 0, TAU); g.fill();
    g.restore();
  };

  /* ---------------- 해마 ---------------- */
  var drawSeahorse = function (g, h, t) {
    var H = h.size, by = Math.sin(t * .9 + h.ph) * 4, k;
    g.save(); g.translate(h.x, h.y + by); g.scale(h.face, 1);
    g.fillStyle = "rgba(255,214,120,.45)";   // 등지느러미
    g.beginPath(); g.ellipse(-H * .12, -H * .02, H * .05 + Math.sin(t * 14) * H * .015, H * .1, -.2, 0, TAU); g.fill();
    var pts = [], P = [[.06, -.38], [0, -.26], [.06, -.04], [.02, .16], [-.02, .3], [.04, .4], [.12, .4], [.12, .32], [.06, .32]];
    for (k = 0; k < P.length; k++) pts.push({ x: P[k][0] * H, y: P[k][1] * H });
    ribbon(g, pts, function (u) { return H * (u < .12 ? .2 : u < .25 ? .13 : u < .42 ? .22 : .18 * (1 - u) + .015); });
    g.fillStyle = h.col; g.fill(); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = .7; g.stroke();
    g.strokeStyle = "rgba(0,0,0,.18)";
    for (k = 1; k < 6; k++) { var p = pts[k]; g.beginPath(); g.moveTo(p.x - H * .08, p.y + H * .02); g.lineTo(p.x + H * .08, p.y - H * .02); g.stroke(); }
    g.fillStyle = h.col; g.beginPath(); g.moveTo(H * .12, -H * .42); g.lineTo(H * .34, -H * .38); g.lineTo(H * .34, -H * .33); g.lineTo(H * .1, -H * .32); g.closePath(); g.fill();   // 주둥이
    g.beginPath(); g.moveTo(H * .02, -H * .48); g.lineTo(H * .05, -H * .56); g.lineTo(H * .1, -H * .47); g.fill();   // 관
    g.fillStyle = "#111"; g.beginPath(); g.arc(H * .1, -H * .4, Math.max(.8, H * .03), 0, TAU); g.fill();
    g.restore();
  };

  /* ---------------- 가오리(먼 배경) ---------------- */
  var drawManta = function (g, m, t) {
    var S = m.span, f = Math.sin(t * 1.1 + m.ph) * S * .12;
    g.save(); g.translate(m.x, m.y); g.scale(m.dir, 1); g.fillStyle = "rgba(14,52,74,.55)";
    g.beginPath(); g.moveTo(S * .2, -S * .03); g.lineTo(S * .26, -S * .07); g.lineTo(S * .24, 0); g.lineTo(S * .26, S * .07); g.lineTo(S * .2, S * .03);
    g.quadraticCurveTo(S * .1, S * .2, -S * .05, S * .5 + f); g.quadraticCurveTo(-S * .02, S * .2, -S * .14, S * .05);
    g.lineTo(-S * .5, 0); g.lineTo(-S * .14, -S * .05);
    g.quadraticCurveTo(-S * .02, -S * .2, -S * .05, -S * .5 + f); g.quadraticCurveTo(S * .1, -S * .2, S * .2, -S * .03);
    g.closePath(); g.fill(); g.restore();
  };

  /* ======================================================
     수조 (화면 전체 배경)
     ====================================================== */
  var tank = document.getElementById("tank");
  if (tank) (function () {
    var g = tank.getContext("2d"), DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, floorY = 0, bgC = document.createElement("canvas"), floorC = document.createElement("canvas");
    var fish = [], jellies = [], shrimps = [], horses = [], schools = [], plantsBack = [], plantsFront = [], grass = [], rays = [];
    var pellets = [], bubbles = [], snow = [], surf = [], manta = null, nextManta = 8, bubbleT = 0, lastT = 0, eaten = 0;
    var mouse = { x: null, y: null }, running = false, keepAlive = 0;

    var build = function () {
      bgC.width = tank.width; bgC.height = tank.height;
      var b = bgC.getContext("2d"); b.setTransform(DPR, 0, 0, DPR, 0, 0);
      var gr = b.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#0f7290"); gr.addColorStop(.22, "#0a5070"); gr.addColorStop(.6, "#06334b"); gr.addColorStop(1, "#031a2b");
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      var vg = b.createRadialGradient(W / 2, H * .4, Math.min(W, H) * .3, W / 2, H * .5, Math.max(W, H) * .8);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,8,16,.55)");
      b.fillStyle = vg; b.fillRect(0, 0, W, H);
      // 바닥
      var fh = H - floorY + 40, i, q;
      floorC.width = Math.round(W * DPR); floorC.height = Math.round(fh * DPR);
      var f = floorC.getContext("2d"); f.setTransform(DPR, 0, 0, DPR, 0, 0);
      var dune = function (x) { return 34 + Math.sin(x * .009) * 7 + Math.sin(x * .027 + 1) * 3; };
      var sg = f.createLinearGradient(0, 20, 0, fh);
      sg.addColorStop(0, "#c9b38a"); sg.addColorStop(1, "#7e6a4a");
      f.fillStyle = sg; f.beginPath(); f.moveTo(0, fh);
      for (var x = 0; x <= W; x += 8) f.lineTo(x, dune(x));
      f.lineTo(W, fh); f.closePath(); f.fill();
      for (i = 0; i < W / 3; i++) {   // 자갈
        var px = Math.random() * W, py = dune(px) + 4 + Math.random() * (fh - 40), pr = rnd(.8, 3.2);
        f.fillStyle = pick(["#d8c7a2", "#9b8763", "#b7a27c", "#6f6250", "#e6dcc4"]);
        f.beginPath(); f.ellipse(px, py, pr * 1.3, pr, Math.random() * 3, 0, TAU); f.fill();
      }
      var rocks = Math.max(2, Math.round(W / 420));
      for (i = 0; i < rocks; i++) {   // 바위
        var rx = (i + .5) * W / rocks + rnd(-80, 80), rw = rnd(50, 110), rh = rw * rnd(.45, .7), ry = dune(rx) + 10;
        var rg = f.createLinearGradient(rx, ry - rh, rx, ry + 10);
        rg.addColorStop(0, "#5b6a70"); rg.addColorStop(1, "#262f34");
        f.fillStyle = rg; f.beginPath(); f.moveTo(rx - rw / 2, ry + 8);
        f.bezierCurveTo(rx - rw * .5, ry - rh * .8, rx - rw * .1, ry - rh * 1.1, rx + rw * .15, ry - rh); f.bezierCurveTo(rx + rw * .45, ry - rh * .9, rx + rw * .55, ry - rh * .2, rx + rw / 2, ry + 8);
        f.closePath(); f.fill();
        softDot(f, rx - rw * .1, ry - rh * .75, rw * .3, "190,230,240", .12);
      }
      var coral = function (x0, y0, ang, len, w, col, d) {   // 가지 산호
        var x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
        f.strokeStyle = col; f.lineWidth = w; f.lineCap = "round"; f.beginPath(); f.moveTo(x0, y0); f.lineTo(x1, y1); f.stroke();
        if (d > 0) { coral(x1, y1, ang - rnd(.25, .6), len * .75, w * .72, col, d - 1); coral(x1, y1, ang + rnd(.25, .6), len * .75, w * .72, col, d - 1); }
        else { f.fillStyle = col; f.beginPath(); f.arc(x1, y1, w * .9, 0, TAU); f.fill(); }
      };
      var corals = Math.max(2, Math.round(W / 380));
      for (i = 0; i < corals; i++) {
        var cx = rnd(.05, .95) * W;
        coral(cx, dune(cx) + 8, -Math.PI / 2 + rnd(-.2, .2), rnd(14, 22), rnd(4, 6), pick(["#ff7aa2", "#ff9a52", "#c86bff", "#ffd166"]), 3);
      }
      for (i = 0; i < Math.max(1, Math.round(W / 700)); i++) {   // 뇌산호
        var bx = rnd(.1, .9) * W, by = dune(bx) + 12, br = rnd(16, 26);
        f.fillStyle = "#b9c56a"; f.beginPath(); f.ellipse(bx, by, br, br * .7, 0, Math.PI, TAU); f.fill();
        f.strokeStyle = "rgba(90,100,40,.6)"; f.lineWidth = 1.2;
        for (q = 0; q < 6; q++) { f.beginPath(); f.arc(bx + rnd(-br * .6, br * .6), by - br * .25, br * rnd(.15, .35), Math.PI, TAU); f.stroke(); }
      }
      for (i = 0; i < Math.max(1, Math.round(W / 600)); i++) {   // 불가사리
        var sx = rnd(.05, .95) * W, sy = dune(sx) + rnd(18, 30), sr = rnd(7, 11);
        f.fillStyle = "#ff8a4c"; f.beginPath();
        for (q = 0; q < 10; q++) { var a = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? sr * .42 : sr; if (q) f.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * .7); else f.moveTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * .7); }
        f.closePath(); f.fill();
      }
      f.globalCompositeOperation = "source-atop"; f.fillStyle = "rgba(8,60,90,.32)"; f.fillRect(0, 0, W, fh);   // 물속 색감
    };

    var populate = function () {
      var area = clamp(W * H / (1440 * 900), .35, 1.4), n = function (k) { return Math.max(1, Math.round(k * area)); };
      var top = 60, bot = floorY - 30, Y = function () { return rnd(top, bot); }, X = function () { return rnd(0, W); }, k;
      fish = []; schools = [];
      var add = function (type, cnt, zs) { for (var i = 0; i < n(cnt); i++) fish.push(makeFish(type, pick(zs), X(), Y())); };
      add("trevally", 3, [0]); add("tetra", 5, [0]); add("tang", 1, [0]); add("yellow", 1, [0]);
      add("clown", 3, [1, 2]); add("tang", 2, [1, 2]); add("yellow", 2, [1]); add("angel", 2, [1, 2]);
      add("discus", 2, [1]); add("goldfish", 2, [1, 2]); add("trevally", 1, [1]);
      for (var s = 0; s < n(2); s++) {   // 네온테트라 무리
        var c = { x: X(), y: rnd(top, bot * .8), vx: 0, vy: 0, tx: X(), ty: Y(), retarget: 0, speed: rnd(34, 46) }, z = s % 2 ? 1 : 2;
        schools.push(c);
        for (var m = 0; m < n(14); m++) { var tt = makeFish("tetra", z, c.x + rnd(-40, 40), c.y + rnd(-20, 20)); tt.school = c; tt.ox = rnd(-46, 46); tt.oy = rnd(-24, 24); fish.push(tt); }
      }
      jellies = []; for (k = 0; k < n(5); k++) jellies.push(makeJelly(pick([0, 1, 1, 2]), X(), Y()));
      shrimps = []; for (k = 0; k < n(6); k++) shrimps.push(makeShrimp(X(), floorY + rnd(14, 26)));
      horses = []; for (k = 0; k < n(2); k++) horses.push({ x: X(), y: floorY - rnd(50, 110), size: rnd(34, 46), face: pick([-1, 1]), ph: rnd(0, TAU), col: pick(["#f2b23a", "#ff8f5a", "#e9d36b"]) });
      plantsBack = []; plantsFront = []; grass = [];
      for (k = 0; k < Math.round(W / 70); k++) plantsBack.push({ x: rnd(0, W), h: H * rnd(.12, .42), w: rnd(8, 16), ph: rnd(0, TAU), sway: rnd(.6, 1.4), col: pick(["#1f6b4a", "#2a7a3e", "#3a6b2a", "#1d5c5a"]) });
      [[.02, .34], [.07, .22], [.93, .3], [.98, .2]].forEach(function (p) { plantsFront.push({ x: p[0] * W, h: H * p[1], w: rnd(12, 20), ph: rnd(0, TAU), sway: rnd(.8, 1.4), col: pick(["#2f9a55", "#3fae4a", "#2c8f6a"]) }); });
      for (k = 0; k < W / 9; k++) grass.push({ x: rnd(0, W), h: rnd(10, 30), ph: rnd(0, TAU), col: pick(["#3d8f45", "#4fa04a", "#2f7a3c"]) });
      rays = []; for (k = 0; k < 6; k++) rays.push({ x: (k + .5) / 6, w: rnd(60, 150), ph: rnd(0, TAU), a: rnd(.05, .1) });
      snow = []; for (k = 0; k < W / 22; k++) snow.push({ x: X(), y: rnd(0, H), r: rnd(.5, 1.6), vy: rnd(3, 9), ph: rnd(0, TAU) });
    };

    var resize = function () {
      var nw = window.innerWidth, nh = window.innerHeight;
      if (nw === W && Math.abs(nh - H) < 140 && fish.length) return;
      W = nw; H = nh; floorY = H - clamp(H * .1, 54, 110);
      tank.width = Math.round(W * DPR); tank.height = Math.round(H * DPR);
      build(); populate();
      frame(performance.now());
    };

    var nearest = function (x, y, maxD, onlyFloor) {
      var best = null, bd = maxD * maxD;
      for (var i = 0; i < pellets.length; i++) {
        var p = pellets[i]; if (onlyFloor && !p.floor) continue;
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    };
    var eat = function (p, who) {
      var i = pellets.indexOf(p); if (i < 0) return;
      pellets.splice(i, 1); eaten++; who.gulp = .25;
      if (who.base) who.len = Math.min(who.base * 1.2, who.len + who.base * .012);
      for (var k = 0; k < 2; k++) bubbles.push({ x: p.x, y: p.y, r: rnd(1, 2.2), vy: rnd(20, 34), ph: rnd(0, TAU) });
      updateBadge();
    };

    var steer = function (f, dt, t) {
      var sc = f.scale, top = f.z === 0 ? 70 : 50, bot = floorY - (f.z === 0 ? 70 : 24) - f.len * sc * .3;
      var food = f.z > 0 && pellets.length ? nearest(f.x, f.y, 700) : null, tx, ty, spd = f.speed * (f.z === 0 ? .7 : 1);
      if (f.flee > 0) { f.flee -= dt; tx = f.fx; ty = f.fy; spd *= 2.6; }
      else if (food) { tx = food.x; ty = food.y; spd *= 1.9; }
      else if (f.school) { tx = f.school.x + f.ox + Math.sin(t * .8 + f.seed) * 10; ty = f.school.y + f.oy + Math.cos(t * .6 + f.seed) * 6; spd = f.school.speed * 1.25; }
      else {
        f.retarget -= dt;
        if (f.retarget <= 0 || Math.abs(f.tx - f.x) + Math.abs(f.ty - f.y) < 30) { f.tx = rnd(-80, W + 80); f.ty = rnd(top, bot); f.retarget = rnd(4, 10); }
        tx = f.tx; ty = f.ty;
      }
      var dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * (food || f.flee > 0 ? 2.6 : 1.1));
      if (f.school && !food && f.flee <= 0) spd *= clamp(d / 60, .4, 1.6);
      f.vx += (dx / d * spd - f.vx) * k; f.vy += (dy / d * spd * .6 - f.vy) * k;
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.y = clamp(f.y, top, bot);
      if (f.x < -160) f.x = W + 150; else if (f.x > W + 160) f.x = -150;
      if (Math.abs(f.vx) > 3) f.face += ((f.vx >= 0 ? 1 : -1) - f.face) * Math.min(1, dt * 3.2);
      f.pitch = clamp(Math.atan2(f.vy, Math.abs(f.vx) + 8) * .7, -.45, .45);
      f.phase += dt * (5 + Math.hypot(f.vx, f.vy) / (f.len * sc) * 6);
      if (f.gulp > 0) f.gulp -= dt;
      if (food) {
        var mx = f.x + (f.face >= 0 ? 1 : -1) * f.len * sc * .5;
        if (Math.hypot(food.x - mx, food.y - f.y) < 6 + f.len * sc * .18) eat(food, f);
      }
    };
    var moveSchool = function (c, dt) {
      c.retarget -= dt;
      if (c.retarget <= 0 || Math.abs(c.tx - c.x) + Math.abs(c.ty - c.y) < 40) { c.tx = rnd(40, W - 40); c.ty = rnd(70, floorY - 80); c.retarget = rnd(5, 11); }
      var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * .8);
      c.vx += (dx / d * c.speed - c.vx) * k; c.vy += (dy / d * c.speed * .5 - c.vy) * k;
      c.x += c.vx * dt; c.y += c.vy * dt;
    };
    var moveJelly = function (j, dt) {
      j.ph += dt * 1.7;
      var thrust = Math.max(0, Math.sin(j.ph)); thrust *= thrust;
      j.y += (7 - (16 + j.r * .5) * thrust) * dt * j.scale; j.x += (j.vx + Math.sin(j.ph * .2) * 3) * dt;
      if (j.y < -j.r * 4) { j.y = floorY + j.r; j.x = rnd(0, W); }
      if (j.y > floorY - j.r) j.y = floorY - j.r;
      if (j.x < -80) j.x = W + 60; else if (j.x > W + 80) j.x = -60;
    };
    var moveShrimp = function (s, dt) {
      var food = pellets.length ? nearest(s.x, s.y, 280, true) : null;
      if (food) {
        s.state = "walk"; s.face = food.x > s.x ? 1 : -1; s.vx = s.face * 24;
        if (Math.abs(food.x - s.x) < s.len * .5) { eat(food, s); s.vx = 0; s.state = "idle"; s.timer = 1.2; }
      } else {
        s.timer -= dt;
        if (s.timer <= 0) {
          if (s.state === "idle") { s.state = "walk"; s.face = Math.random() < .5 ? -1 : 1; s.vx = s.face * rnd(8, 16); s.timer = rnd(1.5, 4); }
          else { s.state = "idle"; s.vx = 0; s.timer = rnd(1, 4); if (Math.random() < .25) s.vyh = -rnd(50, 80); }
        }
      }
      s.x += s.vx * dt; if (s.x < 10 || s.x > W - 10) { s.face *= -1; s.vx = -s.vx; s.x = clamp(s.x, 10, W - 10); }
      if (s.vyh || s.gy < 0) { s.vyh += 160 * dt; s.gy += s.vyh * dt; if (s.gy >= 0) { s.gy = 0; s.vyh = 0; } }
    };

    var drawPlant = function (p, t, dark) {
      var pts = [], n = 12;
      for (var i = 0; i <= n; i++) pts.push({ x: p.x + Math.sin(t * .7 + p.ph + i * .32) * i * p.sway * (p.h / 160), y: floorY + 30 - i / n * p.h });
      ribbon(g, pts, function (u) { return p.w * (1 - u * .75) * (.75 + .25 * Math.sin(u * 9 + p.ph)); });
      var gr = g.createLinearGradient(0, floorY, 0, floorY - p.h);
      gr.addColorStop(0, dark ? "rgba(10,40,30,.9)" : p.col); gr.addColorStop(1, p.col);
      g.globalAlpha = dark ? .75 : 1; g.fillStyle = gr; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1; g.stroke();
    };
    var drawPellet = function (p) {
      g.fillStyle = "#b8682a"; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.strokeStyle = "rgba(70,30,10,.6)"; g.lineWidth = .6; g.stroke();
      g.fillStyle = "rgba(255,220,170,.6)"; g.beginPath(); g.arc(p.x - p.r * .3, p.y - p.r * .3, p.r * .35, 0, TAU); g.fill();
    };

    var frame = function (ms) {
      var t = ms / 1000, dt = clamp(t - lastT || .016, 0, .05), i, k, x;
      lastT = t;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      g.drawImage(bgC, 0, 0);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      // 빛줄기
      g.globalCompositeOperation = "lighter";
      for (i = 0; i < rays.length; i++) {
        var r = rays[i], x0 = r.x * W + Math.sin(t * .12 + r.ph) * 50, a = r.a * (.7 + .3 * Math.sin(t * .4 + r.ph));
        var rg = g.createLinearGradient(0, 0, 0, H * .85);
        rg.addColorStop(0, "rgba(170,240,255," + a + ")"); rg.addColorStop(1, "rgba(170,240,255,0)");
        g.fillStyle = rg; g.beginPath(); g.moveTo(x0 - r.w * .3, 0); g.lineTo(x0 + r.w * .3, 0); g.lineTo(x0 - H * .3 + r.w, H * .85); g.lineTo(x0 - H * .3 - r.w, H * .85); g.closePath(); g.fill();
      }
      g.globalCompositeOperation = "source-over";
      // 가오리 (먼 배경)
      if (!reduce && !manta && t > nextManta) { var dir = Math.random() < .5 ? 1 : -1; manta = { dir: dir, x: dir > 0 ? -200 : W + 200, y: rnd(H * .15, H * .45), span: rnd(150, 240), ph: rnd(0, TAU) }; }
      if (manta) { manta.x += manta.dir * 26 * dt; drawManta(g, manta, t); if (manta.x < -300 || manta.x > W + 300) { manta = null; nextManta = t + rnd(30, 50); } }
      for (i = 0; i < schools.length; i++) moveSchool(schools[i], dt);
      for (i = 0; i < fish.length; i++) steer(fish[i], dt, t);
      for (i = 0; i < jellies.length; i++) moveJelly(jellies[i], dt);
      for (i = 0; i < shrimps.length; i++) moveShrimp(shrimps[i], dt);
      var layer = function (z) {
        for (var q = 0; q < jellies.length; q++) if (jellies[q].z === z) drawJelly(g, jellies[q], t);
        for (q = 0; q < fish.length; q++) if (fish[q].z === z) drawFish(g, fish[q]);
      };
      layer(0);
      g.fillStyle = "rgba(4,36,56,.32)"; g.fillRect(0, 0, W, H);   // 먼 물 안개
      for (i = 0; i < plantsBack.length; i++) drawPlant(plantsBack[i], t, true);
      for (i = 0; i < horses.length; i++) drawSeahorse(g, horses[i], t);
      layer(1);
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(floorC, 0, Math.round((floorY - 40) * DPR)); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.lineCap = "round";
      for (i = 0; i < grass.length; i++) {
        var gs = grass[i], sw = Math.sin(t * 1.1 + gs.ph) * 4;
        g.strokeStyle = gs.col; g.lineWidth = 2; g.beginPath(); g.moveTo(gs.x, floorY + 32); g.quadraticCurveTo(gs.x + sw * .5, floorY + 32 - gs.h * .5, gs.x + sw, floorY + 32 - gs.h); g.stroke();
      }
      for (i = 0; i < pellets.length; i++) if (pellets[i].floor) drawPellet(pellets[i]);
      for (i = 0; i < shrimps.length; i++) drawShrimp(g, shrimps[i], t);
      layer(2);
      for (i = 0; i < plantsFront.length; i++) drawPlant(plantsFront[i], t, false);
      // 먹이
      for (i = pellets.length - 1; i >= 0; i--) {
        var p = pellets[i];
        if (!p.floor) {
          p.y += p.vy * dt; p.x += Math.sin(t * 2 + p.ph) * 10 * dt;
          if (p.y >= floorY + 26) { p.floor = true; p.y = floorY + rnd(24, 34); }
          drawPellet(p);
        } else { p.life -= dt; if (p.life <= 0) pellets.splice(i, 1); }
      }
      // 기포
      bubbleT -= dt;
      if (bubbleT <= 0 && !reduce) { bubbles.push({ x: W * .12 + rnd(-4, 4), y: floorY + 20, r: rnd(1.5, 4.5), vy: rnd(40, 70), ph: rnd(0, TAU) }); bubbleT = rnd(.06, .2); }
      if (Math.random() < .02 && fish.length) { var ff = pick(fish); if (ff.z > 0) bubbles.push({ x: ff.x + (ff.face >= 0 ? 1 : -1) * ff.len * ff.scale * .5, y: ff.y, r: rnd(1, 2), vy: rnd(18, 30), ph: rnd(0, TAU) }); }
      for (i = bubbles.length - 1; i >= 0; i--) {
        var bb = bubbles[i]; bb.y -= bb.vy * dt; bb.x += Math.sin(t * 3 + bb.ph) * 12 * dt;
        if (bb.y < -10) { bubbles.splice(i, 1); continue; }
        g.strokeStyle = "rgba(220,250,255,.55)"; g.lineWidth = .8; g.beginPath(); g.arc(bb.x, bb.y, bb.r, 0, TAU); g.stroke();
        g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(bb.x - bb.r * .35, bb.y - bb.r * .35, bb.r * .3, 0, TAU); g.fill();
      }
      g.fillStyle = "rgba(220,245,255,.35)";   // 부유물
      for (i = 0; i < snow.length; i++) {
        var sn = snow[i]; sn.y += sn.vy * dt; sn.x += Math.sin(t * .5 + sn.ph) * 4 * dt;
        if (sn.y > floorY + 20) { sn.y = -4; sn.x = rnd(0, W); }
        g.fillRect(sn.x, sn.y, sn.r, sn.r);
      }
      // 수면 일렁임 + 먹이 파문
      g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(200,250,255,.12)"; g.lineWidth = 1.2;
      for (k = 0; k < 3; k++) { g.beginPath(); for (x = 0; x <= W; x += 12) { var yy = 4 + k * 5 + Math.sin(x * .02 + t * (1 + k * .3) + k) * 2.5; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
      for (i = surf.length - 1; i >= 0; i--) {
        var sf = surf[i], age = Math.max(0, t - sf.t); if (age > 1.4) { surf.splice(i, 1); continue; }
        g.strokeStyle = "rgba(220,250,255," + (.4 * (1 - age / 1.4)) + ")";
        g.beginPath(); g.ellipse(sf.x, 6, 6 + age * 60, 2 + age * 6, 0, 0, TAU); g.stroke();
      }
      g.globalCompositeOperation = "source-over";
    };

    var loop = function (ms) {
      frame(ms);
      if (!reduce || pellets.length || performance.now() < keepAlive) requestAnimationFrame(loop);
      else running = false;
    };
    var run = function () { if (!running) { running = true; lastT = performance.now() / 1000; requestAnimationFrame(loop); } };

    /* ---------------- 먹이 주기 ---------------- */
    var btn = document.createElement("button"), toast = document.createElement("div");
    btn.type = "button"; btn.className = "feed-btn"; btn.setAttribute("aria-label", "물고기에게 먹이 주기 (단축키 F)");
    btn.innerHTML = '<span class="feed-dot" aria-hidden="true"></span><span>먹이 주기</span><kbd>F</kbd><b class="feed-count" aria-hidden="true"></b>';
    toast.className = "toast"; toast.setAttribute("role", "status");
    document.body.appendChild(btn); document.body.appendChild(toast);
    var toastT;
    var say = function (msg) { toast.textContent = msg; toast.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("on"); }, 1800); };
    var updateBadge = function () { btn.querySelector(".feed-count").textContent = eaten ? eaten : ""; };
    var lastFeed = 0, feeds = 0;
    var feed = function (x) {
      var now = performance.now(); if (now - lastFeed < 250) return; lastFeed = now;
      if (x == null) x = mouse.x != null ? mouse.x : rnd(W * .25, W * .75);
      x = clamp(x, 30, W - 30);
      for (var i = 0; i < 12; i++) pellets.push({ x: x + rnd(-55, 55), y: rnd(-30, -4), vy: rnd(18, 32), ph: rnd(0, TAU), floor: false, life: 10, r: rnd(2.2, 3.4) });
      if (pellets.length > 150) pellets.splice(0, pellets.length - 150);
      surf.push({ x: x, t: now / 1000 });
      feeds++;
      say(feeds === 1 ? "먹이를 뿌렸어요. 물고기들이 몰려와요" : "먹이를 더 줬어요");
      keepAlive = now + 12000; run();
    };
    btn.addEventListener("click", function () { feed(rnd(W * .2, W * .8)); });
    window.addEventListener("keydown", function (e) {
      if (e.code !== "KeyF" || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (document.body.classList.contains("lock")) return;
      e.preventDefault(); feed();
    });
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button,input,textarea,select,summary,iframe,.world,.item,.principle,.essay,.spec,.demo-modal")) return;
      var x = e.clientX, y = e.clientY, i;
      for (i = 0; i < fish.length; i++) {
        var f = fish[i], dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy);
        if (d < 220 && f.z > 0) { f.flee = .8; f.fx = f.x + dx / (d || 1) * 320; f.fy = f.y + dy / (d || 1) * 200; }
      }
      for (i = 0; i < 6; i++) bubbles.push({ x: x + rnd(-8, 8), y: y + rnd(-6, 6), r: rnd(1.5, 3.5), vy: rnd(40, 80), ph: rnd(0, TAU) });
      keepAlive = performance.now() + 3000; run();
    });

    var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(resize, 150); });
    resize();
    if (!reduce) run();
  })();

  /* ======================================================
     카드 속 작은 수조 (프로젝트별로 다른 생물)
     ====================================================== */
  document.querySelectorAll(".art[data-species]").forEach(function (el) {
    var type = el.getAttribute("data-species"), c = document.createElement("canvas"), g = c.getContext("2d");
    el.insertBefore(c, el.firstChild);
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), list = [], bubbles = [], visible = false, lastT = 0;
    var draw = function (ms) {
      var t = ms / 1000, dt = clamp(t - lastT || .016, 0, .05), i, x; lastT = t;
      if (!W) return;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0f6f8c"); gr.addColorStop(1, "#05293d");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      for (i = 0; i < 3; i++) {
        var x0 = W * (.2 + i * .3) + Math.sin(t * .2 + i) * 20, rg = g.createLinearGradient(0, 0, 0, H);
        rg.addColorStop(0, "rgba(170,240,255,.1)"); rg.addColorStop(1, "rgba(170,240,255,0)");
        g.fillStyle = rg; g.beginPath(); g.moveTo(x0 - 20, 0); g.lineTo(x0 + 20, 0); g.lineTo(x0 - 40, H); g.lineTo(x0 - 100, H); g.closePath(); g.fill();
      }
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "#8f7b58"; g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 10) g.lineTo(x, H - 16 - Math.sin(x * .03) * 4); g.lineTo(W, H); g.closePath(); g.fill();
      for (i = 0; i < list.length; i++) {
        var o = list[i];
        if (o.kind === "jelly") {
          o.ph += dt * 1.7; var th = Math.max(0, Math.sin(o.ph)); o.y += (6 - 22 * th * th) * dt; if (o.y < -40) o.y = H + 20; drawJelly(g, o, t);
        } else {
          o.x += o.vx * dt; o.y += Math.sin(t * .8 + o.seed) * 6 * dt;
          if (o.x > W + 60) o.x = -60; if (o.x < -60) o.x = W + 60;
          o.phase += dt * 7; drawFish(g, o);
        }
      }
      if (Math.random() < .06) bubbles.push({ x: rnd(10, W - 10), y: H - 14, r: rnd(1, 2.6), vy: rnd(20, 40) });
      g.strokeStyle = "rgba(220,250,255,.55)"; g.lineWidth = .8;
      for (i = bubbles.length - 1; i >= 0; i--) { var b = bubbles[i]; b.y -= b.vy * dt; if (b.y < -5) { bubbles.splice(i, 1); continue; } g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke(); }
    };
    var size = function () {
      W = el.clientWidth; H = el.clientHeight; if (!W) return;
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      list = [];
      var i;
      if (type === "jelly") { for (i = 0; i < 3; i++) { var j = makeJelly(1, rnd(W * .2, W * .8), rnd(H * .3, H * .7)); j.r = rnd(16, 26); j.scale = 1.2; list.push(j); } }
      else {
        var S = SPECIES[type], cnt = type === "tetra" ? 9 : 2;
        for (i = 0; i < cnt; i++) { var f = makeFish(type, 1, rnd(0, W), rnd(H * .3, H * .65)); f.scale = 70 / ((S.len[0] + S.len[1]) / 2) * (i ? .8 : 1); f.vx = (i % 2 ? -1 : 1) * rnd(14, 22); f.face = f.vx > 0 ? 1 : -1; list.push(f); }
      }
      draw(performance.now());
    };
    var loop = function (ms) { if (!visible || reduce) return; draw(ms); requestAnimationFrame(loop); };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { var was = visible; visible = en[0].isIntersecting; if (visible && !was) { lastT = performance.now() / 1000; requestAnimationFrame(loop); } }).observe(el);
    var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(size, 150); });
    size();
  });

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
    targets.forEach(function (el, i) { el.style.setProperty("--d", ((i % 3) * 0.1) + "s"); io.observe(el); });
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
