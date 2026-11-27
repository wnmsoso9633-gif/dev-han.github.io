// dev-han portfolio — Deep Sea
// 화면 전체가 심해: 아귀 · 랜턴피시 · 손도끼고기 · 독사고기 · 흑룡어 · 해파리 · 빗해파리 · 심해새우 · 고래
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
  /* ======================================================
     물고기 종류
     len: 몸길이(px) · h: 몸 높이 비율 · tail/tailH: 꼬리 길이/높이 비율
     ====================================================== */
  // 심해 어종: 어두운 몸 + 발광기(glow)
  var SPECIES = {
    lantern: { len: [14, 20], h: .3, tail: .3, tailH: .24, fork: 1, body: ["#0c1520", "#26364a"], belly: "#34465a", pattern: "none", fin: "rgba(110,150,190,.25)", glow: "90,232,255", photo: 7, speed: [40, 60] },
    hatchet: { len: [20, 28], h: .95, tail: .22, tailH: .3, body: ["#4a5866", "#a9b8c6"], belly: "#d3dee8", pattern: "lateral", fin: "rgba(170,195,220,.3)", glow: "120,210,255", photo: 6, bigEye: 1, speed: [16, 26] },
    viper: { len: [50, 70], h: .2, tail: .2, tailH: .22, fork: 1, body: ["#070b12", "#18222f"], belly: "#232e3c", pattern: "none", fin: "rgba(80,110,140,.3)", glow: "88,200,255", photo: 10, fangs: 1, speed: [22, 34] },
    dragon: { len: [40, 56], h: .18, tail: .18, tailH: .2, body: ["#05070a", "#11161d"], belly: "#161c24", pattern: "none", fin: "rgba(70,90,110,.3)", glow: "255,90,140", photo: 8, barbel: 1, speed: [18, 28] },
    grenadier: { len: [80, 120], h: .3, tail: .3, tailH: .26, fork: 1, body: ["#141a22", "#323e4c"], belly: "#45515f", pattern: "lateral", fin: "rgba(70,90,110,.45)", speed: [24, 36] },
    angler: { len: [44, 64], custom: "angler", speed: [10, 16] }
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

  // 아귀: 둥근 몸, 큰 입과 이빨, 머리 위 발광 미끼
  var drawAngler = function (g, f) {
    var L = f.len * f.scale, sw = Math.sin(f.phase), t = f.phase;
    var fs = f.face >= 0 ? Math.max(.15, f.face) : Math.min(-.15, f.face), i;
    g.save(); g.translate(f.x, f.y); g.rotate(f.pitch * .5 * (fs < 0 ? -1 : 1)); g.scale(fs, 1);
    g.fillStyle = "#1a1412";   // 꼬리 · 지느러미
    g.save(); g.translate(-L * .4, 0); g.rotate(sw * .35);
    g.beginPath(); g.moveTo(0, -L * .08); g.quadraticCurveTo(-L * .2, -L * .2, -L * .26, -L * .02); g.quadraticCurveTo(-L * .2, L * .18, 0, L * .08); g.fill(); g.restore();
    g.beginPath(); g.moveTo(-L * .05, L * .3); g.quadraticCurveTo(-L * .2, L * .48, -L * .3, L * .3); g.fill();
    var bg = g.createRadialGradient(-L * .05, -L * .12, L * .05, 0, 0, L * .5);
    bg.addColorStop(0, "#3a2c26"); bg.addColorStop(1, "#120d0b");
    g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0, L * .44, L * .34, 0, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.05)";
    for (i = 0; i < 9; i++) { g.beginPath(); g.arc(Math.sin(f.seed + i * 3) * L * .3, Math.cos(f.seed * 2 + i) * L * .22, L * .025, 0, TAU); g.fill(); }
    var open = .5 + .5 * Math.sin(t * .25);
    g.fillStyle = "#050303"; g.beginPath(); g.moveTo(L * .18, -L * .02); g.lineTo(L * .5, -L * .12); g.lineTo(L * .5, L * (.12 + open * .1)); g.lineTo(L * .14, L * .14); g.closePath(); g.fill();   // 입
    g.fillStyle = "#1c1513"; g.beginPath(); g.moveTo(L * .1, L * .12); g.quadraticCurveTo(L * .4, L * .3, L * .56, L * (.12 + open * .1)); g.quadraticCurveTo(L * .4, L * .2, L * .14, L * .06); g.fill();   // 아래턱
    g.fillStyle = "rgba(235,232,220,.9)";   // 이빨
    for (i = 0; i < 6; i++) { var tx = L * (.24 + i * .05); g.beginPath(); g.moveTo(tx, -L * .04 - i * L * .015); g.lineTo(tx + L * .012, L * .05); g.lineTo(tx + L * .025, -L * .04 - i * L * .015); g.fill(); }
    for (i = 0; i < 5; i++) { var bx = L * (.26 + i * .055); g.beginPath(); g.moveTo(bx, L * (.13 + open * .08)); g.lineTo(bx + L * .012, L * .03); g.lineTo(bx + L * .025, L * (.13 + open * .08)); g.fill(); }
    g.fillStyle = "#c9d6dc"; g.beginPath(); g.arc(L * .12, -L * .14, L * .035, 0, TAU); g.fill();
    g.fillStyle = "#000"; g.beginPath(); g.arc(L * .125, -L * .14, L * .02, 0, TAU); g.fill();
    var lx = L * .52 + Math.sin(t * .6) * L * .04, ly = -L * .5 + Math.cos(t * .5) * L * .03;   // 미끼
    g.strokeStyle = "#2a201c"; g.lineWidth = Math.max(1, L * .025); g.beginPath(); g.moveTo(L * .02, -L * .3); g.quadraticCurveTo(L * .2, -L * .62, lx, ly); g.stroke();
    g.globalCompositeOperation = "lighter";
    var pl = .75 + .25 * Math.sin(t * 1.3);
    softDot(g, lx, ly, L * .5 * pl, "110,255,215", .22);
    softDot(g, lx, ly, L * .14, "190,255,235", .9);
    g.restore();
  };

  var drawFish = function (g, f) {
    if (f.sp.custom === "angler") { drawAngler(g, f); return; }
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
    if (S.fangs) {   // 독사고기 송곳니
      g.strokeStyle = "rgba(220,230,240,.85)"; g.lineWidth = Math.max(.5, L * .012);
      g.beginPath(); g.moveTo(L * .44, -H * .1); g.lineTo(L * .47, H * .9); g.moveTo(L * .38, H * .15); g.lineTo(L * .42, -H * .8); g.stroke();
    }
    if (S.glow) {   // 발광기
      g.save(); g.globalCompositeOperation = "lighter";
      var pul = .7 + .3 * Math.sin(f.phase * .3 + f.seed);
      for (i = 0; i < S.photo; i++) {
        var gx = L * (.32 - i * .7 / S.photo), gy = H * (S.h > .7 ? .36 : .3);
        softDot(g, gx, gy, Math.max(2.5, L * .06), S.glow, .55 * pul);
        g.fillStyle = "rgba(" + S.glow + ",.95)"; g.beginPath(); g.arc(gx, gy, Math.max(.6, L * .014), 0, TAU); g.fill();
      }
      softDot(g, L * .3, -H * .05, Math.max(3, L * .1), S.glow, .45 * pul);   // 눈 밑 발광
      if (S.barbel) {
        g.strokeStyle = "rgba(" + S.glow + ",.5)"; g.lineWidth = Math.max(.5, L * .01);
        var bx = L * .3, by = H * .5 + L * .25 + Math.sin(f.phase * .5) * L * .04;
        g.beginPath(); g.moveTo(L * .3, H * .45); g.quadraticCurveTo(L * .4, H * .5 + L * .12, bx, by); g.stroke();
        softDot(g, bx, by, Math.max(3, L * .09), S.glow, .8 * pul);
      }
      g.restore();
    }
    // 가슴지느러미
    g.save(); g.translate(L * .12, H * .1); g.rotate(.5 + Math.sin(f.phase * 1.4) * .4);
    g.fillStyle = S.fin; g.globalAlpha = .8; g.beginPath(); g.ellipse(-L * .07, 0, L * .1, L * .035, 0, 0, TAU); g.fill();
    g.restore(); g.globalAlpha = 1;
    // 아가미 · 눈 · 입
    g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = Math.max(.4, L * .012);
    g.beginPath(); g.arc(L * .14, 0, H * .3, -.9, .9); g.stroke();
    var ex = L * (S.snout ? .3 : .33), ey = -H * (S.h > .7 ? .16 : .1), er = Math.max(1, L * (S.bigEye ? .1 : .055));
    g.fillStyle = "#f4efd9"; g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill();
    g.fillStyle = "#0b0b0b"; g.beginPath(); g.arc(ex + er * .12, ey, er * .64, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(ex - er * .15, ey - er * .25, er * .22, 0, TAU); g.fill();
    if (f.gulp > 0) { g.fillStyle = "#2a0d08"; g.beginPath(); g.arc(L * (S.snout ? .58 : .48), H * .04, Math.max(.8, L * .035), 0, TAU); g.fill(); }
    g.restore();
  };

  /* ---------------- 해파리 ---------------- */
  var JELLY_COLORS = ["90,180,255", "120,235,255", "170,130,255", "255,90,150", "80,255,200"];
  var makeJelly = function (z, x, y, comb) {
    return { kind: "jelly", comb: !!comb, z: z, scale: [.55, 1, 1.3][z], x: x, y: y, r: comb ? rnd(10, 18) : rnd(14, 34), c: pick(JELLY_COLORS), ph: rnd(0, TAU), vx: rnd(-5, 5), tent: 10 + ((Math.random() * 6) | 0) };
  };
  // 빗해파리: 투명한 타원 몸에 무지갯빛 섬모 줄
  var drawComb = function (g, j, t) {
    var R = j.r * j.scale, k, s;
    g.save(); g.translate(j.x, j.y); g.rotate(Math.sin(t * .3 + j.ph) * .25); g.globalCompositeOperation = "lighter";
    var bg = g.createRadialGradient(0, -R * .2, R * .1, 0, 0, R * 1.2);
    bg.addColorStop(0, "rgba(200,230,255,.22)"); bg.addColorStop(1, "rgba(120,170,255,.03)");
    g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0, R * .7, R * 1.1, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(170,210,255,.35)"; g.lineWidth = .8; g.stroke();
    for (k = 0; k < 8; k++) {
      var ang = -Math.PI / 2 + (k - 3.5) * .38;
      for (s = 0; s < 9; s++) {
        var u = s / 8 - .5, px = Math.sin(ang + Math.PI / 2) * R * .66 * Math.cos(u * Math.PI) * (k < 4 ? -1 : 1) * (Math.abs(k - 3.5) / 3.5), py = u * R * 2;
        g.fillStyle = "hsla(" + ((t * 120 + s * 40 + k * 30) % 360) + ",100%,65%,.75)";
        g.fillRect(px - 1.2, py, 2.4, 1.4);
      }
    }
    g.restore();
  };
  var drawJelly = function (g, j, t) {
    if (j.comb) { drawComb(g, j, t); return; }
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
    crimson: { body: "rgba(178,24,30,.95)", seg: "rgba(90,8,10,.7)", leg: "rgba(190,40,44,.9)" },
    deepred: { body: "rgba(140,18,40,.9)", seg: "rgba(255,120,150,.6)", leg: "rgba(160,30,50,.85)", stripe: 1 },
    ghost: { body: "rgba(190,220,240,.22)", seg: "rgba(90,232,255,.9)", leg: "rgba(190,220,240,.35)", dots: 1 }
  };
  var makeShrimp = function (x, y) {
    return { kind: "shrimp", x: x, y: y, gy: 0, vyh: 0, len: rnd(16, 26), face: pick([-1, 1]), vx: 0, state: "idle", timer: rnd(1, 4), ph: rnd(0, TAU), col: SHRIMP[pick(["crimson", "crimson", "deepred", "ghost"])], gulp: 0 };
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

  /* ---------------- 고래(먼 배경 실루엣) ---------------- */
  var drawWhale = function (g, m, t) {
    var S = m.span, f = Math.sin(t * .8 + m.ph) * S * .05;
    g.save(); g.translate(m.x, m.y); g.scale(m.dir, 1); g.fillStyle = "rgba(12,30,46,.8)";
    g.beginPath(); g.moveTo(S * .5, -S * .02);
    g.bezierCurveTo(S * .5, -S * .12, S * .2, -S * .13, -S * .1, -S * .08);
    g.bezierCurveTo(-S * .3, -S * .05, -S * .4, -S * .02, -S * .44, f * .3);
    g.lineTo(-S * .56, -S * .08 + f); g.lineTo(-S * .52, f * .4); g.lineTo(-S * .56, S * .08 + f); g.lineTo(-S * .44, S * .02 + f * .3);
    g.bezierCurveTo(-S * .3, S * .06, S * .1, S * .1, S * .42, S * .06);
    g.quadraticCurveTo(S * .52, S * .04, S * .5, -S * .02); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(S * .18, S * .07); g.quadraticCurveTo(S * .1, S * .2 + f, S * .02, S * .18 + f); g.quadraticCurveTo(S * .1, S * .1, S * .1, S * .07); g.fill();
    g.restore();
  };

  /* ======================================================
     심해 수조 (화면 전체 배경)
     ====================================================== */
  var tank = document.getElementById("tank");
  if (tank) (function () {
    var g = tank.getContext("2d"), DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, floorY = 0, bgC = document.createElement("canvas"), floorC = document.createElement("canvas");
    var fish = [], jellies = [], shrimps = [], schools = [], whips = [], vents = [];
    var pellets = [], bubbles = [], snow = [], sparks = [], smoke = [], surf = [], whale = null, nextWhale = 10, lastT = 0, eaten = 0;
    var mouse = { x: null, y: null }, running = false, keepAlive = 0;

    var build = function () {
      bgC.width = tank.width; bgC.height = tank.height;
      var b = bgC.getContext("2d"); b.setTransform(DPR, 0, 0, DPR, 0, 0);
      var gr = b.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#06192a"); gr.addColorStop(.35, "#030f1b"); gr.addColorStop(1, "#01050a");
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      softDot(b, W * .5, -H * .2, H * .8, "40,90,130", .18);   // 아주 먼 위쪽의 희미한 빛
      var vg = b.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .25, W / 2, H * .5, Math.max(W, H) * .75);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.6)");
      b.fillStyle = vg; b.fillRect(0, 0, W, H);
      // 바닥: 어두운 침전물 · 바위 · 열수구 · 관벌레 · 유리해면
      var fh = H - floorY + 40, i, q;
      floorC.width = Math.round(W * DPR); floorC.height = Math.round(fh * DPR);
      var f = floorC.getContext("2d"); f.setTransform(DPR, 0, 0, DPR, 0, 0);
      var dune = function (x) { return 34 + Math.sin(x * .008) * 8 + Math.sin(x * .025 + 1) * 3; };
      var sg = f.createLinearGradient(0, 20, 0, fh);
      sg.addColorStop(0, "#1c232b"); sg.addColorStop(1, "#080b0e");
      f.fillStyle = sg; f.beginPath(); f.moveTo(0, fh);
      for (var x = 0; x <= W; x += 8) f.lineTo(x, dune(x));
      f.lineTo(W, fh); f.closePath(); f.fill();
      for (i = 0; i < W / 3; i++) {
        var px = Math.random() * W, py = dune(px) + 4 + Math.random() * (fh - 40), pr = rnd(.6, 2.6);
        f.fillStyle = pick(["#2a313a", "#1a1f26", "#39414b", "#12161b"]);
        f.beginPath(); f.ellipse(px, py, pr * 1.3, pr, Math.random() * 3, 0, TAU); f.fill();
      }
      var rock = function (rx, rw, rh) {
        var ry = dune(rx) + 10, rg = f.createLinearGradient(rx, ry - rh, rx, ry + 10);
        rg.addColorStop(0, "#2b333c"); rg.addColorStop(1, "#0b0e12");
        f.fillStyle = rg; f.beginPath(); f.moveTo(rx - rw / 2, ry + 8);
        f.bezierCurveTo(rx - rw * .5, ry - rh * .8, rx - rw * .1, ry - rh * 1.1, rx + rw * .15, ry - rh); f.bezierCurveTo(rx + rw * .45, ry - rh * .9, rx + rw * .55, ry - rh * .2, rx + rw / 2, ry + 8);
        f.closePath(); f.fill();
        f.strokeStyle = "rgba(120,170,210,.12)"; f.lineWidth = 1; f.stroke();
      };
      var rocks = Math.max(2, Math.round(W / 420));
      for (i = 0; i < rocks; i++) rock((i + .5) * W / rocks + rnd(-80, 80), rnd(50, 110), rnd(25, 60));
      vents = [];
      var ventXs = W > 900 ? [W * .13, W * .88] : [W * .82];
      ventXs.forEach(function (vx) {   // 열수구 굴뚝
        var vy = dune(vx) + 12, vh = rnd(70, 110), vw = rnd(26, 36);
        var cg = f.createLinearGradient(vx - vw, 0, vx + vw, 0);
        cg.addColorStop(0, "#0d1014"); cg.addColorStop(.5, "#2a2f35"); cg.addColorStop(1, "#0b0d10");
        f.fillStyle = cg; f.beginPath(); f.moveTo(vx - vw, vy);
        f.bezierCurveTo(vx - vw * .7, vy - vh * .4, vx - vw * .45, vy - vh * .8, vx - vw * .25, vy - vh);
        f.lineTo(vx + vw * .25, vy - vh); f.bezierCurveTo(vx + vw * .45, vy - vh * .8, vx + vw * .7, vy - vh * .4, vx + vw, vy); f.closePath(); f.fill();
        softDot(f, vx, vy - vh, vw * .5, "255,120,60", .25);
        vents.push({ x: vx, y: floorY - 40 + vy - vh });
        for (q = 0; q < 14; q++) {   // 관벌레
          var tx = vx + rnd(-vw * 2.4, vw * 2.4); if (Math.abs(tx - vx) < vw) continue;
          var ty = dune(tx) + 14, th = rnd(14, 34), sw = rnd(-4, 4);
          f.strokeStyle = "#d9d3c4"; f.lineWidth = 3; f.lineCap = "round"; f.beginPath(); f.moveTo(tx, ty); f.quadraticCurveTo(tx + sw, ty - th * .5, tx + sw * .6, ty - th); f.stroke();
          f.fillStyle = "#c21f2c"; f.beginPath(); f.ellipse(tx + sw * .6, ty - th - 2, 3.4, 4.2, 0, 0, TAU); f.fill();
        }
      });
      for (i = 0; i < Math.max(2, Math.round(W / 500)); i++) {   // 유리해면
        var sx = rnd(.05, .95) * W, sy = dune(sx) + 12, sh = rnd(26, 50), swd = sh * .32;
        f.strokeStyle = "rgba(200,225,240,.35)"; f.fillStyle = "rgba(170,205,225,.12)"; f.lineWidth = 1;
        f.beginPath(); f.moveTo(sx - swd * .4, sy); f.quadraticCurveTo(sx - swd * 1.1, sy - sh * .6, sx - swd * .7, sy - sh); f.lineTo(sx + swd * .7, sy - sh); f.quadraticCurveTo(sx + swd * 1.1, sy - sh * .6, sx + swd * .4, sy); f.closePath(); f.fill(); f.stroke();
        for (q = 1; q < 5; q++) { f.beginPath(); f.moveTo(sx - swd * (.5 + q * .05), sy - sh * q / 5); f.lineTo(sx + swd * (.5 + q * .05), sy - sh * q / 5); f.stroke(); }
      }
      f.globalCompositeOperation = "source-atop"; f.fillStyle = "rgba(2,10,20,.3)"; f.fillRect(0, 0, W, fh);
    };

    var populate = function () {
      var area = clamp(W * H / (1440 * 900), .35, 1.4), n = function (k) { return Math.max(1, Math.round(k * area)); };
      var top = 60, bot = floorY - 30, Y = function () { return rnd(top, bot); }, X = function () { return rnd(0, W); }, k;
      fish = []; schools = [];
      var add = function (type, cnt, zs) { for (var i = 0; i < n(cnt); i++) fish.push(makeFish(type, pick(zs), X(), Y())); };
      add("grenadier", 2, [0]); add("lantern", 6, [0]); add("hatchet", 2, [0]); add("viper", 1, [0]);
      add("hatchet", 3, [1, 2]); add("viper", 2, [1, 2]); add("dragon", 2, [1, 2]); add("grenadier", 1, [1]);
      fish.push(makeFish("angler", 1, X(), rnd(bot * .6, bot)));
      if (W > 700) fish.push(makeFish("angler", 2, X(), rnd(bot * .5, bot)));
      for (var s = 0; s < n(2); s++) {   // 랜턴피시 무리
        var c = { x: X(), y: rnd(top, bot * .8), vx: 0, vy: 0, tx: X(), ty: Y(), retarget: 0, speed: rnd(32, 44) }, z = s % 2 ? 1 : 2;
        schools.push(c);
        for (var m = 0; m < n(14); m++) { var tt = makeFish("lantern", z, c.x + rnd(-40, 40), c.y + rnd(-20, 20)); tt.school = c; tt.ox = rnd(-50, 50); tt.oy = rnd(-26, 26); fish.push(tt); }
      }
      jellies = [];
      for (k = 0; k < n(4); k++) jellies.push(makeJelly(pick([0, 1, 1, 2]), X(), Y()));
      for (k = 0; k < n(3); k++) jellies.push(makeJelly(pick([0, 1, 2]), X(), Y(), true));
      shrimps = []; for (k = 0; k < n(6); k++) shrimps.push(makeShrimp(X(), floorY + rnd(14, 26)));
      whips = []; for (k = 0; k < Math.round(W / 110); k++) whips.push({ x: rnd(0, W), h: rnd(40, 130), ph: rnd(0, TAU), c: pick(["90,232,255", "170,130,255", "80,255,200"]) });
      snow = []; for (k = 0; k < W / 10; k++) snow.push({ x: X(), y: rnd(0, H), r: rnd(.4, 1.4), vy: rnd(4, 12), ph: rnd(0, TAU), a: rnd(.15, .45) });
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
      sparks.push({ x: p.x, y: p.y, t: lastT, c: "255,200,120", r: 18 });
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
      j.ph += dt * (j.comb ? .9 : 1.7);
      var thrust = Math.max(0, Math.sin(j.ph)); thrust *= thrust;
      j.y += (j.comb ? -4 + Math.sin(j.ph) * 6 : 7 - (16 + j.r * .5) * thrust) * dt * j.scale; j.x += (j.vx + Math.sin(j.ph * .2) * 3) * dt;
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

    // 바다채찍(산호): 가는 줄기 끝에서 천천히 빛남
    var drawWhip = function (p, t) {
      var sw = Math.sin(t * .6 + p.ph) * p.h * .08, bx = p.x, by = floorY + 30, tx = p.x + sw, ty = by - p.h;
      g.strokeStyle = "rgba(110,150,180,.28)"; g.lineWidth = 1.4; g.lineCap = "round";
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + sw * .3, by - p.h * .5, tx, ty); g.stroke();
      for (var k = 1; k < 7; k++) { var u = k / 7, x = bx + sw * u * u, y = by - p.h * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y - 5); g.moveTo(x, y); g.lineTo(x + 4, y - 5); g.stroke(); }
      g.globalCompositeOperation = "lighter";
      softDot(g, tx, ty, 10, p.c, .35 + .25 * Math.sin(t * 1.4 + p.ph));
      g.globalCompositeOperation = "source-over";
    };
    var drawPellet = function (p) {
      g.globalCompositeOperation = "lighter";
      softDot(g, p.x, p.y, p.r * 4, "255,180,90", .35);
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "#ffcf8a"; g.beginPath(); g.arc(p.x, p.y, p.r * .8, 0, TAU); g.fill();
    };

    var frame = function (ms) {
      var t = ms / 1000, dt = clamp(t - lastT || .016, 0, .05), i;
      lastT = t;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      g.drawImage(bgC, 0, 0);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      // 고래 (먼 배경)
      if (!reduce && !whale && t > nextWhale) { var dir = Math.random() < .5 ? 1 : -1; whale = { dir: dir, x: dir > 0 ? -320 : W + 320, y: rnd(H * .15, H * .4), span: rnd(260, 420), ph: rnd(0, TAU) }; }
      if (whale) { whale.x += whale.dir * 18 * dt; drawWhale(g, whale, t); if (whale.x < -460 || whale.x > W + 460) { whale = null; nextWhale = t + rnd(35, 60); } }
      for (i = 0; i < schools.length; i++) moveSchool(schools[i], dt);
      for (i = 0; i < fish.length; i++) steer(fish[i], dt, t);
      for (i = 0; i < jellies.length; i++) moveJelly(jellies[i], dt);
      for (i = 0; i < shrimps.length; i++) moveShrimp(shrimps[i], dt);
      var layer = function (z) {
        for (var q = 0; q < jellies.length; q++) if (jellies[q].z === z) drawJelly(g, jellies[q], t);
        for (q = 0; q < fish.length; q++) if (fish[q].z === z) drawFish(g, fish[q]);
      };
      layer(0);
      g.fillStyle = "rgba(1,6,12,.45)"; g.fillRect(0, 0, W, H);   // 먼 어둠
      for (i = 0; i < whips.length; i++) drawWhip(whips[i], t);
      layer(1);
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(floorC, 0, Math.round((floorY - 40) * DPR)); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      for (i = 0; i < pellets.length; i++) if (pellets[i].floor) drawPellet(pellets[i]);
      for (i = 0; i < shrimps.length; i++) drawShrimp(g, shrimps[i], t);
      layer(2);
      // 먹이 (빛나는 플랑크톤 알갱이)
      for (i = pellets.length - 1; i >= 0; i--) {
        var p = pellets[i];
        if (!p.floor) {
          p.y += p.vy * dt; p.x += Math.sin(t * 2 + p.ph) * 10 * dt;
          if (p.y >= floorY + 26) { p.floor = true; p.y = floorY + rnd(24, 34); }
          drawPellet(p);
        } else { p.life -= dt; if (p.life <= 0) pellets.splice(i, 1); }
      }
      // 열수구 연기
      if (!reduce) for (i = 0; i < vents.length; i++) if (Math.random() < .5) smoke.push({ x: vents[i].x + rnd(-4, 4), y: vents[i].y, r: rnd(4, 8), vy: rnd(18, 30), vx: rnd(-4, 4), life: 1 });
      for (i = smoke.length - 1; i >= 0; i--) {
        var sm = smoke[i]; sm.y -= sm.vy * dt; sm.x += sm.vx * dt; sm.r += 8 * dt; sm.life -= .25 * dt;
        if (sm.life <= 0) { smoke.splice(i, 1); continue; }
        softDot(g, sm.x, sm.y, sm.r, "70,80,92", .12 * sm.life);
      }
      for (i = bubbles.length - 1; i >= 0; i--) {
        var bb = bubbles[i]; bb.y -= bb.vy * dt; bb.x += Math.sin(t * 3 + bb.ph) * 12 * dt;
        if (bb.y < -10) { bubbles.splice(i, 1); continue; }
        g.strokeStyle = "rgba(160,205,235,.35)"; g.lineWidth = .8; g.beginPath(); g.arc(bb.x, bb.y, bb.r, 0, TAU); g.stroke();
      }
      for (i = 0; i < snow.length; i++) {   // 해양설
        var sn = snow[i]; sn.y += sn.vy * dt; sn.x += Math.sin(t * .5 + sn.ph) * 4 * dt;
        if (sn.y > floorY + 20) { sn.y = -4; sn.x = rnd(0, W); }
        g.fillStyle = "rgba(200,225,240," + sn.a + ")"; g.fillRect(sn.x, sn.y, sn.r, sn.r);
      }
      // 생물발광 반짝임 · 커서 손전등 · 먹이 투하 빛
      g.globalCompositeOperation = "lighter";
      if (!reduce && Math.random() < .05) sparks.push({ x: rnd(0, W), y: rnd(60, floorY), t: t, c: pick(["90,232,255", "120,180,255", "80,255,200"]), r: rnd(6, 14) });
      for (i = sparks.length - 1; i >= 0; i--) {
        var sp = sparks[i], age = Math.max(0, t - sp.t); if (age > 1.2) { sparks.splice(i, 1); continue; }
        softDot(g, sp.x, sp.y, sp.r * (1 + age), sp.c, .7 * (1 - age / 1.2));
      }
      if (mouse.x != null) softDot(g, mouse.x, mouse.y, 180, "60,130,180", .07);
      for (i = surf.length - 1; i >= 0; i--) {
        var sf = surf[i], ag = Math.max(0, t - sf.t); if (ag > 1.4) { surf.splice(i, 1); continue; }
        softDot(g, sf.x, 0, 40 + ag * 120, "255,190,110", .25 * (1 - ag / 1.4));
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
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#071b2c"); gr.addColorStop(1, "#01060c");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      for (i = 0; i < 4; i++) softDot(g, (Math.sin(t * .1 + i * 2.3) * .5 + .5) * W, (Math.cos(t * .13 + i) * .4 + .45) * H, 3, "90,232,255", .5 + .5 * Math.sin(t * 2 + i));
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "#151b22"; g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 10) g.lineTo(x, H - 16 - Math.sin(x * .03) * 4); g.lineTo(W, H); g.closePath(); g.fill();
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
        var S = SPECIES[type], cnt = type === "lantern" ? 9 : type === "angler" ? 1 : 2;
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
