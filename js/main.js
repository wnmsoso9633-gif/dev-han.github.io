// dev-han portfolio — DRAGON CRAFT
// 픽셀 렌더링: 불씨/재 · 블록 지형 · 하늘을 나는 붉은 용 · 히어로 용(클릭 시 불 뿜기)
// 블록 텍스처 생성, 메뉴, 등장 효과, 프로젝트 필터, 라이브 데모 모달
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* ======================================================
     시드 난수 + 블록 텍스처 (16x16 → pixelated 확대)
     ====================================================== */
  var seeded = function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  var PALETTES = {
    netherrack: { base: ["#6e1b17", "#7f231c", "#5a1411", "#8e2d22", "#4a0f0d"] },
    magma: { base: ["#3b0d09", "#4d120c", "#2c0906"], crack: ["#ff7a18", "#ffb43d", "#d9480f"] },
    obsidian: { base: ["#120a1c", "#1b0f2b", "#0b0612", "#241338"], speck: ["#5a2c8c", "#3d1d63"] },
    gold: { base: ["#6b6464", "#7a7272", "#595252", "#8a8282"], speck: ["#f5c542", "#fff08a", "#c48f1d"] },
    lava: { base: ["#d9480f", "#ff7a18", "#ff9a2a", "#e85d10"], speck: ["#ffd75e", "#fff2a0"] },
    emerald: { base: ["#6b6464", "#7a7272", "#595252", "#8a8282"], speck: ["#3ed46b", "#9bf0b4", "#1d8a40"] },
    diamond: { base: ["#6b6464", "#7a7272", "#595252", "#8a8282"], speck: ["#5ee6e6", "#c9fffb", "#1f9f9f"] },
    copper: { base: ["#b8643c", "#c97448", "#a3542f", "#d98a5c"], speck: ["#5fb59a", "#3f8f78"] },
    lapis: { base: ["#6b6464", "#7a7272", "#595252", "#8a8282"], speck: ["#2c56d6", "#7da2ff", "#173a9c"] },
    stone: { base: ["#6b6464", "#7a7272", "#595252", "#8a8282"] }
  };
  var texCache = {};
  var blockTexture = function (type, seed) {
    var key = type + ":" + (seed || 1);
    if (texCache[key]) return texCache[key];
    var p = PALETTES[type] || PALETTES.netherrack;
    var c = document.createElement("canvas"); c.width = c.height = 16;
    var g = c.getContext("2d"), r = seeded((seed || 7) * 9301 + type.length * 49297);
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      g.fillStyle = p.base[(r() * p.base.length) | 0]; g.fillRect(x, y, 1, 1);
    }
    if (p.crack) {                                     // 마그마 균열
      for (var k = 0; k < 7; k++) {
        var cx = (r() * 16) | 0, cy = (r() * 16) | 0, len = 2 + ((r() * 5) | 0), dx = r() < .5 ? 1 : 0;
        for (var i = 0; i < len; i++) { g.fillStyle = p.crack[(r() * p.crack.length) | 0]; g.fillRect((cx + i * dx) % 16, (cy + i * (1 - dx)) % 16, 1, 1); }
      }
    }
    if (p.speck) {                                     // 광석/반점
      var n = type === "obsidian" || type === "lava" ? 12 : 5;
      for (var s = 0; s < n; s++) {
        var sx = 1 + ((r() * 13) | 0), sy = 1 + ((r() * 13) | 0);
        g.fillStyle = p.speck[0]; g.fillRect(sx, sy, 2, 1);
        if (type !== "obsidian") { g.fillStyle = p.speck[1]; g.fillRect(sx, sy, 1, 1); g.fillStyle = p.speck[p.speck.length - 1]; g.fillRect(sx + 1, sy + 1, 1, 1); }
      }
    }
    return (texCache[key] = c.toDataURL());
  };
  document.querySelectorAll("[data-block]").forEach(function (el, i) {
    el.style.backgroundImage = "url(" + blockTexture(el.getAttribute("data-block"), +(el.getAttribute("data-seed") || i + 3)) + ")";
  });

  /* ======================================================
     붉은 용 스프라이트 (저해상도 벡터 → 픽셀)
     ====================================================== */
  var SPR_W = 112, SPR_H = 72;
  var MOUTH = { x: 104, y: 29 };
  var COLORS = {
    normal: { body: "#c8261c", shade: "#7d140f", light: "#ee4a2a", belly: "#f2a03a", horn: "#f3d27a", eye: "#ffef5a", wing: "#9a1d16", wingFar: "#561009", bone: "#ee4a2a", spike: "#5c0f0b", outline: "#0a0202" },
    far: { body: "#3a0b08", shade: "#2a0705", light: "#4d100b", belly: "#4a1a0c", horn: "#5a3a22", eye: "#ff5a1e", wing: "#300806", wingFar: "#220504", bone: "#4d100b", spike: "#250504", outline: "#120303" }
  };
  var sprite = document.createElement("canvas"); sprite.width = SPR_W; sprite.height = SPR_H;
  var sprG = sprite.getContext("2d");
  var flat = document.createElement("canvas"); flat.width = SPR_W; flat.height = SPR_H;
  var flatG = flat.getContext("2d");
  var mask = document.createElement("canvas"); mask.width = SPR_W; mask.height = SPR_H;
  var maskG = mask.getContext("2d");

  var poly = function (g, pts, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  var ell = function (g, x, y, rx, ry, fill) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.283); g.fill(); };
  var qpt = function (a, b, c, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; };
  var tube = function (g, p0, p1, p2, r0, r1, fill, steps) {
    g.fillStyle = fill;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      g.beginPath(); g.arc(qpt(p0[0], p1[0], p2[0], t), qpt(p0[1], p1[1], p2[1], t), r0 + (r1 - r0) * t, 0, 6.283); g.fill();
    }
  };
  var wing = function (g, rx, ry, e, fill, bone) {
    var ex = rx + 3, ey = ry - 13 * e - 3, tx = rx - 18, ty = ry - 29 * e;
    poly(g, [rx, ry, ex, ey, tx, ty, rx - 22, ry - 13 * e + 5, rx - 15, ry - 8 * e + 3, rx - 13, ry - 3 * e + 8, rx - 7, ry - 1 * e + 4, rx - 3, ry + 4], fill);
    g.strokeStyle = bone; g.lineWidth = 1.4; g.beginPath(); g.moveTo(rx, ry); g.lineTo(ex, ey); g.lineTo(tx, ty); g.stroke();
    g.lineWidth = .8; g.beginPath(); g.moveTo(ex, ey); g.lineTo(rx - 15, ry - 8 * e + 3); g.moveTo(ex, ey); g.lineTo(rx - 7, ry - 1 * e + 4); g.stroke();
  };

  // t: 초, o: { flap(0~), mouth(0~1), blink, pal }
  var renderDragon = function (t, o) {
    var C = COLORS[o.pal || "normal"], g = flatG;
    g.clearRect(0, 0, SPR_W, SPR_H);
    var f = Math.sin(o.flap), e = 0.3 + 0.75 * f, bob = -f * 1.6;
    g.save(); g.translate(0, bob);
    wing(g, 58, 37, e * 0.85, C.wingFar, C.shade);                         // 먼 날개
    var tipY = 38 + Math.sin(t * 2.2) * 5;                                  // 꼬리
    tube(g, [42, 48], [20, 62], [6, tipY], 6, 1.4, C.body, 26);
    tube(g, [42, 51], [22, 64], [8, tipY + 1], 3, .6, C.shade, 18);
    poly(g, [6, tipY - 5, 1, tipY + 1, 6, tipY + 6, 9, tipY], C.shade);
    ell(g, 44, 52, 6, 5, C.shade); g.fillStyle = C.shade; g.fillRect(41, 54, 5, 8); g.fillRect(39, 60, 9, 3);   // 뒷다리
    ell(g, 54, 46, 17, 9, C.body);                                          // 몸통
    ell(g, 56, 51, 13, 4.5, C.belly);
    g.fillStyle = C.light; g.fillRect(44, 38, 18, 2);
    g.fillStyle = C.body; g.fillRect(61, 52, 5, 9); g.fillStyle = C.shade; g.fillRect(60, 60, 9, 3);              // 앞다리
    var hb = Math.sin(t * 3.1) * 1.2;
    tube(g, [64, 43], [80, 42], [85, 28 + hb], 6.5, 4.6, C.body, 20);        // 목
    tube(g, [66, 47], [80, 45], [86, 32 + hb], 3, 2.4, C.belly, 16);
    g.save(); g.translate(0, hb);
    poly(g, [84, 21, 70, 12, 74, 14, 86, 18], C.horn);                      // 뿔
    poly(g, [86, 20, 77, 7, 80, 9, 88, 18], C.horn);
    ell(g, 88, 25, 7.5, 5.8, C.body);                                       // 두개골
    poly(g, [89, 20, 102, 23, 104, 27, 92, 30], C.body);                    // 주둥이
    var m = o.mouth || 0;
    poly(g, [88, 29, 102, 29 + m * 5, 101, 32 + m * 5, 88, 32], C.shade);   // 아래턱
    if (m > .15) { g.fillStyle = "#fff4dc"; g.fillRect(96, 29, 1, 1); g.fillRect(99, 29, 1, 1); g.fillRect(97, 30 + m * 4, 1, 1); g.fillStyle = "#2a0402"; g.fillRect(92, 29.5, 9, m * 3); }
    g.fillStyle = C.shade; g.fillRect(100, 24, 2, 1); g.fillRect(87, 21, 6, 1);   // 콧구멍·눈썹
    g.fillStyle = C.eye; g.fillRect(89, 22, 3, o.blink ? .6 : 2);
    poly(g, [80, 27, 76, 30, 81, 30], C.horn);                              // 볏
    g.restore();
    g.fillStyle = C.spike;                                                  // 등 가시
    for (var s = 0; s < 6; s++) { var sx = 38 + s * 6, sy = 38 + Math.abs(s - 2.5) * .9; poly(g, [sx, sy, sx + 3, sy - 4, sx + 5, sy], C.spike); }
    for (var n = 0; n < 3; n++) { var nx = 68 + n * 5, ny = 37 - n * 3.6 + hb * (n / 3); poly(g, [nx, ny, nx + 2, ny - 4, nx + 4, ny - 1], C.spike); }
    wing(g, 52, 38, e, C.wing, C.bone);                                     // 가까운 날개
    g.restore();

    // 1px 외곽선
    maskG.clearRect(0, 0, SPR_W, SPR_H);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { maskG.drawImage(flat, d[0], d[1]); });
    maskG.globalCompositeOperation = "source-in"; maskG.fillStyle = C.outline; maskG.fillRect(0, 0, SPR_W, SPR_H); maskG.globalCompositeOperation = "source-over";
    sprG.clearRect(0, 0, SPR_W, SPR_H); sprG.drawImage(mask, 0, 0); sprG.drawImage(flat, 0, 0);
    return { canvas: sprite, mouth: { x: MOUTH.x, y: MOUTH.y + bob + hb + m * 2 } };
  };

  var fireColor = function (l) { return l > .78 ? "#fff6b0" : l > .58 ? "#ffc83d" : l > .38 ? "#ff7a18" : l > .2 ? "#c8261c" : "#3a2a2a"; };
  var stepFire = function (g, list) {
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      p.x += p.vx; p.y += p.vy; p.vy -= .015; p.vx *= .985; p.life -= p.decay;
      if (p.life <= 0) { list.splice(i, 1); continue; }
      g.fillStyle = fireColor(p.life);
      var s = p.life > .5 ? p.s : Math.max(1, p.s - 1);
      g.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
  };
  var breathe = function (list, x, y, dir, power) {
    for (var i = 0; i < power; i++) list.push({ x: x, y: y + rnd(-1, 1), vx: dir * rnd(1.1, 2.4), vy: rnd(-.45, .55), life: 1, decay: rnd(.018, .035), s: Math.random() < .4 ? 2 : 1 });
  };

  /* ======================================================
     히어로 용 (150x100 캔버스, CSS pixelated 확대)
     ====================================================== */
  var hero = document.getElementById("dragon");
  if (hero) {
    var hg = hero.getContext("2d"), HW = 150, HH = 100;
    hero.width = HW; hero.height = HH;
    var hFire = [], hEmbers = [], breatheUntil = 0, nextAuto = 2.5, blinkAt = 3;
    var lavaTex = new Image(); lavaTex.src = blockTexture("magma", 5);
    var netherTex = new Image(); netherTex.src = blockTexture("netherrack", 9);
    var obsTex = new Image(); obsTex.src = blockTexture("obsidian", 4);
    var roar = function () { breatheUntil = performance.now() / 1000 + 1.3; };
    hero.addEventListener("click", roar);
    hero.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); roar(); } });

    var heroFrame = function (ms) {
      var t = ms / 1000;
      hg.clearRect(0, 0, HW, HH);
      // 받침: 흑요석 기둥 + 네더랙/마그마 블록
      for (var bx = 0; bx < HW; bx += 10) {
        var hgt = (bx / 10) % 5 === 2 ? 2 : (bx / 10) % 3 === 0 ? 1 : 0;
        for (var by = 0; by <= hgt; by++) {
          var img = by === 0 ? ((bx / 10) % 4 === 1 ? lavaTex : netherTex) : obsTex;
          if (img.complete) hg.drawImage(img, 0, 0, 16, 16, bx, HH - 10 - by * 10, 10, 10);
        }
      }
      if (Math.random() < .5) hEmbers.push({ x: rnd(0, HW), y: HH - 8, vy: rnd(.15, .5), ph: rnd(0, 6), life: 1 });
      for (var i = hEmbers.length - 1; i >= 0; i--) {
        var em = hEmbers[i]; em.y -= em.vy; em.life -= .006;
        if (em.life <= 0) { hEmbers.splice(i, 1); continue; }
        hg.fillStyle = em.life > .6 ? "#ffc83d" : "#ff7a18"; hg.globalAlpha = em.life;
        hg.fillRect(Math.round(em.x + Math.sin(t * 2 + em.ph) * 2), Math.round(em.y), 1, 1);
      }
      hg.globalAlpha = 1;
      if (!reduce && t > nextAuto) { roar(); nextAuto = t + rnd(6, 9); }
      var breathing = t < breatheUntil;
      if (t > blinkAt + .15) blinkAt = t + rnd(2.5, 5);
      var spr = renderDragon(t, { flap: t * (breathing ? 4.2 : 5.6), mouth: breathing ? 1 : 0, blink: t > blinkAt && t < blinkAt + .15 });
      var ox = 14, oy = 10 + Math.sin(t * 1.4) * 3;
      hg.drawImage(spr.canvas, Math.round(ox), Math.round(oy));
      if (breathing) breathe(hFire, ox + spr.mouth.x, oy + spr.mouth.y, 1, 8);
      stepFire(hg, hFire);
      if (!reduce) requestAnimationFrame(heroFrame);
    };
    requestAnimationFrame(heroFrame);
  }

  /* ======================================================
     배경 (1/3 해상도 → pixelated)
     ====================================================== */
  var canvas = document.getElementById("realm");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var S = 3, W = 0, H = 0;
    var embers = [], ash = [], bits = [], bgFire = [], ridgeA = [], ridgeB = [];
    var flyer = null, nextFlyer = 3.5;
    var mouse = { x: -1, y: -1 };

    var ridge = function (cols, min, max, seedv) {
      var r = seeded(seedv), out = [], h = (min + max) / 2;
      for (var i = 0; i < cols; i++) { h += (r() - .5) * 2.2; h = Math.max(min, Math.min(max, h)); out.push(Math.round(h)); }
      return out;
    };
    var resize = function () {
      W = Math.ceil(window.innerWidth / S); H = Math.ceil(window.innerHeight / S);
      canvas.width = W; canvas.height = H;
      ridgeA = ridge(Math.ceil(W / 8) + 2, 2, 7, 11);
      ridgeB = ridge(Math.ceil(W / 6) + 2, 1, 4, 23);
      embers = []; for (var i = 0; i < W / 5; i++) embers.push(newEmber(true));
      ash = []; for (var j = 0; j < W / 18; j++) ash.push({ x: rnd(0, W), y: rnd(0, H), vy: rnd(.05, .18), ph: rnd(0, 6) });
    };
    var newEmber = function (anywhere) {
      return { x: rnd(0, W), y: anywhere ? rnd(0, H) : H + 2, vy: rnd(.12, .5), sw: rnd(.4, 1.3), ph: rnd(0, 6), life: rnd(.5, 1), s: Math.random() < .2 ? 2 : 1 };
    };
    var burst = function (x, y) {
      var cols = ["#7f231c", "#5a1411", "#ff7a18", "#ffc83d", "#8e2d22"];
      for (var i = 0; i < 18; i++) bits.push({ x: x, y: y, vx: rnd(-1.6, 1.6), vy: rnd(-2.4, -.4), life: 1, c: cols[(Math.random() * cols.length) | 0], s: Math.random() < .5 ? 2 : 1 });
    };

    var bgFrame = function (ms) {
      var t = ms / 1000;
      ctx.clearRect(0, 0, W, H);

      // 재 (위에서 아래로)
      ctx.fillStyle = "#5a4a46";
      for (var a = 0; a < ash.length; a++) {
        var as = ash[a]; as.y += as.vy; if (as.y > H) { as.y = -2; as.x = rnd(0, W); }
        ctx.globalAlpha = .45; ctx.fillRect(Math.round(as.x + Math.sin(t * .6 + as.ph) * 3), Math.round(as.y), 1, 1);
      }
      ctx.globalAlpha = 1;

      // 하늘을 가로지르는 용
      if (!reduce && !flyer && t > nextFlyer) {
        var dir = Math.random() < .5 ? 1 : -1;
        flyer = { dir: dir, x: dir > 0 ? -SPR_W : W + SPR_W, y: rnd(H * .08, H * .4), sp: rnd(.55, .9), fireAt: rnd(.35, .6), fired: 0 };
      }
      if (flyer) {
        flyer.x += flyer.dir * flyer.sp;
        var prog = flyer.dir > 0 ? flyer.x / W : 1 - flyer.x / W;
        var breathing = prog > flyer.fireAt && prog < flyer.fireAt + .12;
        var spr = renderDragon(t, { flap: t * 4.4, mouth: breathing ? 1 : 0, pal: "far" });
        var fy = flyer.y + Math.sin(t * 1.2) * 4;
        ctx.save();
        if (flyer.dir < 0) { ctx.translate(Math.round(flyer.x), Math.round(fy)); ctx.scale(-1, 1); ctx.drawImage(spr.canvas, 0, 0); }
        else ctx.drawImage(spr.canvas, Math.round(flyer.x), Math.round(fy));
        ctx.restore();
        if (breathing) {
          var mx = flyer.dir > 0 ? flyer.x + spr.mouth.x : flyer.x - spr.mouth.x;
          breathe(bgFire, mx, fy + spr.mouth.y, flyer.dir, 3);
        }
        if (flyer.x < -SPR_W * 1.5 || flyer.x > W + SPR_W * 1.5) { flyer = null; nextFlyer = t + rnd(16, 28); }
      }
      ctx.globalAlpha = .85; stepFire(ctx, bgFire); ctx.globalAlpha = 1;

      // 블록 지형 (2겹)
      ctx.fillStyle = "#240807";
      for (var c = 0; c < ridgeA.length; c++) ctx.fillRect(c * 8, H - ridgeA[c] * 8, 8, ridgeA[c] * 8);
      ctx.fillStyle = "#120404";
      for (var d = 0; d < ridgeB.length; d++) ctx.fillRect(d * 6, H - ridgeB[d] * 6, 6, ridgeB[d] * 6);
      // 용암 줄기
      ctx.fillStyle = "#ff7a18";
      for (var l = 0; l < ridgeB.length; l += 7) { ctx.globalAlpha = .55 + .35 * Math.sin(t * 2 + l); ctx.fillRect(l * 6, H - 2, 12, 2); }
      ctx.globalAlpha = 1;

      // 불씨 (아래에서 위로)
      for (var k = 0; k < embers.length; k++) {
        var em = embers[k];
        em.y -= em.vy; em.x += Math.sin(t * em.sw + em.ph) * .25;
        if (em.y < -4) embers[k] = newEmber(false);
        var fade = Math.min(1, em.y / (H * .6));
        ctx.globalAlpha = em.life * fade * (.6 + .4 * Math.sin(t * 3 + em.ph));
        ctx.fillStyle = em.ph > 3 ? "#ffc83d" : "#ff7a18";
        ctx.fillRect(Math.round(em.x), Math.round(em.y), em.s, em.s);
      }
      ctx.globalAlpha = 1;

      // 블록 파편 (클릭)
      for (var b = bits.length - 1; b >= 0; b--) {
        var bt = bits[b];
        bt.x += bt.vx; bt.y += bt.vy; bt.vy += .12; bt.life -= .02;
        if (bt.life <= 0) { bits.splice(b, 1); continue; }
        ctx.fillStyle = bt.c; ctx.fillRect(Math.round(bt.x), Math.round(bt.y), bt.s, bt.s);
      }

      // 마우스 불씨 꼬리
      if (finePointer && mouse.x >= 0 && Math.random() < .25) embers.push({ x: mouse.x, y: mouse.y, vy: rnd(.2, .5), sw: 1, ph: rnd(0, 6), life: .9, s: 1, tmp: 1 });
      if (embers.length > W / 5 + 40) embers.splice(Math.floor(W / 5), 1);

      if (!reduce) requestAnimationFrame(bgFrame);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX / S; mouse.y = e.clientY / S; }, { passive: true });
    window.addEventListener("mouseout", function () { mouse.x = mouse.y = -1; });
    window.addEventListener("click", function (e) { if (!reduce) burst(e.clientX / S, e.clientY / S); });
    resize();
    requestAnimationFrame(bgFrame);
  }

  /* ---------------- 스플래시 문구 ---------------- */
  var splash = document.querySelector(".splash");
  if (splash) {
    var SPL = ["불을 뿜는 데이터!", "원본은 건드리지 마!", "SQL도 블록처럼!", "정적 + 동적 = 2배!", "트랜잭션 격리 완료!", "용은 롤백하지 않는다!", "Chart.js 장착!", "탄소를 길들이다!"];
    splash.textContent = SPL[(Math.random() * SPL.length) | 0];
  }

  /* ---------------- 커서 글로우 ---------------- */
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
    var frame = modal.querySelector("iframe"), ttl = modal.querySelector(".ttl"), ext = modal.querySelector(".ext"), lastFocus = null;
    var open = function (src, title) {
      lastFocus = document.activeElement;
      frame.src = src; ttl.textContent = title; ext.href = src;
      modal.classList.add("open"); document.body.classList.add("lock");
      modal.querySelector(".close").focus();
    };
    var close = function () {
      modal.classList.remove("open"); document.body.classList.remove("lock"); frame.src = "about:blank";
      if (history.replaceState && location.hash.indexOf("#demo-") === 0) history.replaceState(null, "", location.pathname);
      if (lastFocus) lastFocus.focus();
    };
    modal.querySelector(".close").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
    document.querySelectorAll("[data-demo]").forEach(function (w) {
      var go = function (e) {
        if (e && e.target.closest("a[target]")) return;           // "새 탭" 링크는 그대로
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
