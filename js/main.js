// dev-han portfolio — 雲龍 (Ink & Night)
// 시네마틱 히어로(실사 이미지 + 안개·불씨·번개·패럴랙스) · 산수 배경(달, 학, 매화 꽃잎)
// 메뉴, 등장 효과, 프로젝트 필터, 라이브 데모 모달
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
     시네마틱 히어로: 실사 이미지 위에 안개 · 불씨 · 번개 · 패럴랙스
     ====================================================== */
  var fogC = document.getElementById("fog");
  if (fogC) (function () {
    var g = fogC.getContext("2d"), DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var media = fogC.parentNode, hero = media.parentNode, layer = media.querySelector(".hero-layer"), flash = hero.querySelector(".hero-flash");
    var W = 0, H = 0, puffs = [], embers = [], visible = true, lastT = 0, nextFlash = 5, aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    var sprite = document.createElement("canvas"); sprite.width = 320; sprite.height = 200;
    var sg = sprite.getContext("2d");
    for (var i = 0; i < 18; i++) softDot(sg, 160 + (Math.random() - .5) * 190, 100 + (Math.random() - .5) * 70, 34 + Math.random() * 46, "205,200,192", .1);

    var newEmber = function (any) {
      return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, vy: rnd(12, 34), sw: rnd(.4, 1.4), ph: rnd(0, TAU), r: rnd(.6, 1.9), life: rnd(.4, 1) };
    };
    var resize = function () {
      W = fogC.clientWidth; H = fogC.clientHeight;
      if (!W || !H) return;
      fogC.width = Math.round(W * DPR); fogC.height = Math.round(H * DPR);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      puffs = [];
      for (var k = 0; k < 10; k++) puffs.push({ x: Math.random() * W, y: H * rnd(.5, 1.05), s: rnd(2.2, 4.2), vx: rnd(5, 16) * (k % 3 ? 1 : -.6), a: rnd(.07, .17) });
      embers = []; var n = clamp(Math.round(W / 34), 14, 48);
      for (k = 0; k < n; k++) embers.push(newEmber(true));
      if (reduce) frame(0);
    };
    var strike = function () {
      if (!flash || reduce) return;
      flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on");
    };
    var frame = function (ms) {
      var t = ms / 1000, dt = clamp(t - lastT || .016, 0, .05), k;
      lastT = t;
      g.clearRect(0, 0, W, H);
      for (k = 0; k < puffs.length; k++) {   // 흐르는 안개
        var p = puffs[k], w = sprite.width * p.s, h = sprite.height * p.s * .6;
        p.x += p.vx * dt;
        if (p.x - w / 2 > W) p.x = -w / 2; if (p.x + w / 2 < 0) p.x = W + w / 2;
        g.globalAlpha = p.a * (.75 + .25 * Math.sin(t * .3 + k));
        g.drawImage(sprite, p.x - w / 2, p.y - h / 2, w, h);
      }
      g.globalAlpha = 1;
      for (k = 0; k < embers.length; k++) {   // 불씨
        var e = embers[k];
        e.y -= e.vy * dt; e.x += Math.sin(t * e.sw + e.ph) * 12 * dt;
        if (e.y < -10) { embers[k] = newEmber(false); continue; }
        var fade = Math.min(1, e.y / (H * .5)) * e.life * (.6 + .4 * Math.sin(t * 4 + e.ph));
        softDot(g, e.x, e.y, e.r * 5, "255,140,50", .22 * fade);
        g.fillStyle = "rgba(255,196,120," + (.9 * fade) + ")"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, TAU); g.fill();
      }
      if (!reduce && t > nextFlash) { strike(); nextFlash = t + rnd(11, 20); }
      cur.x += (aim.x - cur.x) * .04; cur.y += (aim.y - cur.y) * .04;   // 패럴랙스
      var zoom = 1.04 + .06 * (.5 - .5 * Math.cos(t * TAU / 90));   // 느린 켄 번스 줌
      if (layer) layer.style.transform = "translate3d(" + (cur.x * -16).toFixed(2) + "px," + (cur.y * -10).toFixed(2) + "px,0) scale(" + zoom.toFixed(4) + ")";
    };
    var loop = function (ms) { if (visible) frame(ms); if (!reduce) requestAnimationFrame(loop); };
    hero.addEventListener("pointermove", function (e) {
      var rc = hero.getBoundingClientRect();
      aim.x = (e.clientX - rc.left) / rc.width - .5; aim.y = (e.clientY - rc.top) / rc.height - .5;
    });
    hero.addEventListener("pointerleave", function () { aim.x = aim.y = 0; });
    hero.addEventListener("click", function (e) {
      if (e.target.closest("a,button")) return;
      strike();
      for (var k = 0; k < 14; k++) { var em = newEmber(false); em.x = e.clientX - hero.getBoundingClientRect().left + rnd(-30, 30); em.y = e.clientY - hero.getBoundingClientRect().top + rnd(-10, 10); em.vy = rnd(30, 70); embers.push(em); }
      if (embers.length > 90) embers.splice(0, embers.length - 90);
    });
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
