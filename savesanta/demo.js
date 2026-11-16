/* Save Santa web demo: a small playable maze. Vanilla JS + canvas, no libraries, no network, no storage.
   Steer Rudolph with arrow keys / WASD, the on-screen buttons, drag (touch or mouse), or phone tilt. */
(function () {
  'use strict';
  var root = document.getElementById('sv-game');
  if (!root) return;
  var canvas = root.querySelector('canvas');
  var stage = root.querySelector('.sv-stage');
  var ctx = canvas.getContext('2d');
  var overStart = root.querySelector('[data-over="start"]');
  var overWin = root.querySelector('[data-over="win"]');
  var winText = root.querySelector('[data-win-text]');
  var statusEl = root.querySelector('.sv-status');
  var sizeSel = root.querySelector('select');
  var tiltBtn = root.querySelector('[data-tilt]');
  var helpBtn = root.querySelector('[data-help]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SIZES = { easy: [7, 10], medium: [9, 13], hard: [12, 17] };
  var T = 0.12;       // wall thickness, in cells
  var R = 0.26;       // Rudolph's radius, in cells
  var cols, rows, cell, walls, ball, vel, goal, state, t0, elapsed, parts, freed, help;
  var keys = {}, pad = {}, drag = null, tilt = null, tiltOn = false, tiltBase = null;
  var raf = 0, last = 0, visible = true, dpr = 1, maze = null, winMs = 0;

  function say(msg) { statusEl.textContent = msg; }

  /* ---------- maze ---------- */
  function build(c, r) {
    var g = [], x, y;
    for (y = 0; y < r; y++) { g[y] = []; for (x = 0; x < c; x++) g[y][x] = { n: 1, e: 1, s: 1, w: 1, v: 0 }; }
    var st = [[0, r - 1]]; g[r - 1][0].v = 1;
    while (st.length) {
      var cur = st[st.length - 1], cx = cur[0], cy = cur[1], nb = [];
      if (cy > 0 && !g[cy - 1][cx].v) nb.push([cx, cy - 1, 'n', 's']);
      if (cy < r - 1 && !g[cy + 1][cx].v) nb.push([cx, cy + 1, 's', 'n']);
      if (cx > 0 && !g[cy][cx - 1].v) nb.push([cx - 1, cy, 'w', 'e']);
      if (cx < c - 1 && !g[cy][cx + 1].v) nb.push([cx + 1, cy, 'e', 'w']);
      if (!nb.length) { st.pop(); continue; }
      var p = nb[Math.floor(Math.random() * nb.length)];
      g[cy][cx][p[2]] = 0; g[p[1]][p[0]][p[3]] = 0; g[p[1]][p[0]].v = 1; st.push([p[0], p[1]]);
    }
    var w = [], h = T / 2;
    for (y = 0; y < r; y++) for (x = 0; x < c; x++) {
      var k = g[y][x];
      if (k.n) w.push([x - h, y - h, x + 1 + h, y + h]);
      if (k.w) w.push([x - h, y - h, x + h, y + 1 + h]);
      if (y === r - 1 && k.s) w.push([x - h, y + 1 - h, x + 1 + h, y + 1 + h]);
      if (x === c - 1 && k.e) w.push([x + 1 - h, y - h, x + 1 + h, y + 1 + h]);
    }
    return w;
  }

  function newGame() {
    var s = SIZES[sizeSel.value] || SIZES.easy;
    cols = s[0]; rows = s[1];
    walls = build(cols, rows);
    ball = { x: 0.5, y: rows - 0.5 };
    vel = { x: 0, y: 0 };
    goal = { x: cols - 0.5, y: 0.5 };
    state = 'ready'; freed = 0; parts = []; elapsed = 0; t0 = 0;
    layout();
    overWin.hidden = true;
    overStart.hidden = false;
    stage.classList.remove('is-playing');
    say('');
    wake();
  }

  /* ---------- layout / static layer ---------- */
  function layout() {
    var cssW = Math.min(canvas.parentNode.clientWidth || 360, 400);
    cell = cssW / cols;
    var cssH = cell * rows;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    maze = document.createElement('canvas');
    maze.width = canvas.width; maze.height = canvas.height;
    var m = maze.getContext('2d'), u = cell * dpr;
    var g = m.createLinearGradient(0, 0, 0, maze.height);
    g.addColorStop(0, '#173C7E'); g.addColorStop(1, '#0B1D4A');
    m.fillStyle = g; m.fillRect(0, 0, maze.width, maze.height);
    // snow flecks (static)
    m.fillStyle = 'rgba(255,255,255,.18)';
    for (var i = 0; i < cols * rows * 2; i++) { m.beginPath(); m.arc(((i * 97) % 1000) / 1000 * maze.width, ((i * 53 + 17) % 1000) / 1000 * maze.height, 1.2 * dpr, 0, 6.3); m.fill(); }
    // ice walls
    walls.forEach(function (w) {
      var x = w[0] * u, y = w[1] * u, ww = (w[2] - w[0]) * u, hh = (w[3] - w[1]) * u;
      m.fillStyle = '#D9F1FF'; m.fillRect(x, y, ww, hh);
      m.fillStyle = 'rgba(255,255,255,.7)'; m.fillRect(x, y, ww, Math.min(hh, 2 * dpr));
      m.strokeStyle = '#6FB2DC'; m.lineWidth = dpr; m.strokeRect(x + .5, y + .5, ww - 1, hh - 1);
    });
    draw(0);
  }

  /* ---------- physics ---------- */
  function collide() {
    for (var i = 0; i < walls.length; i++) {
      var w = walls[i];
      if (ball.x < w[0] - R || ball.x > w[2] + R || ball.y < w[1] - R || ball.y > w[3] + R) continue;
      var cx = Math.max(w[0], Math.min(ball.x, w[2])), cy = Math.max(w[1], Math.min(ball.y, w[3]));
      var dx = ball.x - cx, dy = ball.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) continue;
      if (d2 < 1e-9) { // centre inside a wall: push out along the shortest axis
        var l = ball.x - w[0], rr = w[2] - ball.x, tt = ball.y - w[1], bb = w[3] - ball.y, mn = Math.min(l, rr, tt, bb);
        if (mn === l) ball.x = w[0] - R; else if (mn === rr) ball.x = w[2] + R; else if (mn === tt) ball.y = w[1] - R; else ball.y = w[3] + R;
        continue;
      }
      var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      ball.x = cx + nx * R; ball.y = cy + ny * R;
      var vn = vel.x * nx + vel.y * ny;
      if (vn < 0) { vel.x -= vn * nx; vel.y -= vn * ny; }
    }
  }

  function input() {
    var ix = 0, iy = 0;
    if (keys.ArrowLeft || keys.a || pad.left) ix -= 1;
    if (keys.ArrowRight || keys.d || pad.right) ix += 1;
    if (keys.ArrowUp || keys.w || pad.up) iy -= 1;
    if (keys.ArrowDown || keys.s || pad.down) iy += 1;
    if (drag) { ix += drag.x; iy += drag.y; }
    if (tiltOn && tilt && tiltBase) {
      ix += clamp((tilt.g - tiltBase.g) / 18, -1, 1);
      iy += clamp((tilt.b - tiltBase.b) / 18, -1, 1);
    }
    var m = Math.sqrt(ix * ix + iy * iy);
    if (m > 1) { ix /= m; iy /= m; }
    return { x: ix, y: iy };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function step(dt) {
    var inp = input();
    if (state === 'ready' && (inp.x || inp.y)) { state = 'play'; t0 = performance.now(); overStart.hidden = true; }
    if (state !== 'play') { vel.x *= 0.8; vel.y *= 0.8; return; }
    var n = 3, h = dt / n;
    for (var i = 0; i < n; i++) {
      vel.x += inp.x * 24 * h; vel.y += inp.y * 24 * h;
      var damp = Math.exp(-5 * h); vel.x *= damp; vel.y *= damp;
      var sp = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      if (sp > 4.6) { vel.x *= 4.6 / sp; vel.y *= 4.6 / sp; }
      ball.x += vel.x * h; ball.y += vel.y * h;
      collide();
    }
    elapsed = (performance.now() - t0) / 1000;
    var gx = ball.x - goal.x, gy = ball.y - goal.y;
    if (gx * gx + gy * gy < 0.45 * 0.45) win();
  }

  function win() {
    state = 'won'; winMs = performance.now(); drag = null; keys = {}; pad = {};
    var secs = Math.max(1, Math.round(elapsed));
    winText.textContent = 'Rudolph broke the chains in ' + secs + (secs === 1 ? ' second.' : ' seconds.');
    say('You saved Santa! ' + winText.textContent);
    stage.classList.remove('is-playing');
    if (!reduce) for (var i = 0; i < 46; i++) {
      var a = Math.random() * 6.283, s = 1.5 + Math.random() * 3.5;
      parts.push({ x: goal.x, y: goal.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1.4 + Math.random() * .8, c: ['#F2BE4B', '#FFFFFF', '#E0483B', '#47D9B4'][i % 4] });
    }
    setTimeout(function () { overWin.hidden = false; var b = overWin.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  }

  /* ---------- drawing ---------- */
  function draw(dt) {
    var u = cell * dpr, W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(maze, 0, 0);
    // Rudolph's light: dark all around, a warm pool of light around the nose
    var bx = ball.x * u, by = ball.y * u;
    var rad = (help ? 7.5 : 3.4) * u;
    var pulse = reduce ? 1 : 1 + Math.sin(performance.now() / 380) * 0.04;
    var gr = ctx.createRadialGradient(bx, by, u * .2, bx, by, rad * pulse);
    var dark = help ? 0.28 : 0.8;
    gr.addColorStop(0, 'rgba(255,120,90,0)');
    gr.addColorStop(.35, 'rgba(255,160,120,0)');
    gr.addColorStop(1, 'rgba(4,10,34,' + dark + ')');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // glow on the walls near the nose
    var gl = ctx.createRadialGradient(bx, by, 0, bx, by, rad * .8 * pulse);
    gl.addColorStop(0, 'rgba(255,70,50,.28)'); gl.addColorStop(1, 'rgba(255,70,50,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';

    drawSanta(goal.x * u, goal.y * u, u);
    drawRudolph(bx, by, u);

    // confetti
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += 5 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.c;
      ctx.fillRect(p.x * u - 3 * dpr, p.y * u - 3 * dpr, 6 * dpr, 6 * dpr);
    }
    ctx.globalAlpha = 1;
  }

  function drawSanta(x, y, u) {
    var r = u * 0.34, broken = state === 'won';
    // chain + ball (breaks on win)
    if (!broken) {
      ctx.strokeStyle = '#9BA7B8'; ctx.lineWidth = 2 * dpr; ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.beginPath(); ctx.moveTo(x - r * .6, y + r * .5); ctx.lineTo(x - r * 1.3, y + r * .9); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x - r * 1.45, y + r * .95, r * .38, 0, 6.3); ctx.fill();
    } else {
      var k = Math.min(1, (performance.now() - winMs) / 700);
      ctx.fillStyle = 'rgba(34,34,34,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(x - r * (1.45 + k * 1.2), y + r * (.95 + k * 1.5), r * .38, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = '#C0281F'; ctx.beginPath(); ctx.arc(x, y + r * .15, r, 0, 6.3); ctx.fill();            // coat
    ctx.fillStyle = '#F6D2A8'; ctx.beginPath(); ctx.arc(x, y - r * .25, r * .5, 0, 6.3); ctx.fill();         // face
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y + r * .1, r * .52, .15, Math.PI - .15); ctx.fill(); // beard
    ctx.fillStyle = '#C0281F'; ctx.beginPath(); ctx.moveTo(x - r * .55, y - r * .45); ctx.lineTo(x + r * .55, y - r * .45); ctx.lineTo(x + r * .1, y - r * 1.25); ctx.closePath(); ctx.fill(); // hat
    ctx.fillStyle = '#fff'; ctx.fillRect(x - r * .6, y - r * .55, r * 1.2, r * .2);
    ctx.beginPath(); ctx.arc(x + r * .1, y - r * 1.3, r * .17, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(x - r * .22, y - r * .3, r * .1, r * .1); ctx.fillRect(x + r * .12, y - r * .3, r * .1, r * .1);
  }

  function drawRudolph(x, y, u) {
    var r = R * u * 1.18;
    ctx.strokeStyle = '#D9B48A'; ctx.lineWidth = 2.4 * dpr; ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) {  // antlers
      ctx.beginPath(); ctx.moveTo(x + s * r * .45, y - r * .7); ctx.lineTo(x + s * r * .8, y - r * 1.35); ctx.moveTo(x + s * r * .65, y - r * 1.05); ctx.lineTo(x + s * r * 1.15, y - r * 1.15); ctx.stroke();
    });
    ctx.fillStyle = '#8A5230'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#5E3716'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    ctx.fillStyle = '#A8693F'; ctx.beginPath(); ctx.arc(x - r * .1, y - r * .15, r * .6, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .25, r * .09, 0, 6.3); ctx.arc(x + r * .35, y - r * .25, r * .09, 0, 6.3); ctx.fill();
    var ng = ctx.createRadialGradient(x, y + r * .25, 0, x, y + r * .25, r * .9);   // glowing nose
    ng.addColorStop(0, 'rgba(255,90,60,.9)'); ng.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x, y + r * .25, r * .9, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#FF2A1E'; ctx.beginPath(); ctx.arc(x, y + r * .25, r * .28, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - r * .08, y + r * .17, r * .08, 0, 6.3); ctx.fill();
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    raf = 0;
    var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    step(dt); draw(dt);
    var busy = state === 'play' || parts.length || (state === 'won' && performance.now() - winMs < 1000) || (!reduce && state !== 'won');
    if (visible && !document.hidden && busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  /* ---------- input ---------- */
  function enterPlay() { if (state === 'won') return; stage.classList.add('is-playing'); overStart.hidden = true; if (state === 'ready') say('Steer Rudolph to Santa.'); wake(); }

  root.querySelector('[data-start]').addEventListener('click', function () { enterPlay(); canvas.focus({ preventScroll: true }); });

  var MOVE = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, a: 1, d: 1, w: 1, s: 1 };
  canvas.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'Escape') { stage.classList.remove('is-playing'); canvas.blur(); return; }
    if (!MOVE[k] || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault(); keys[k] = true; overStart.hidden = true; wake();
  });
  canvas.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; delete keys[k]; });
  canvas.addEventListener('blur', function () { keys = {}; });
  canvas.addEventListener('focus', function () { if (state === 'ready') say('Use the arrow keys to steer Rudolph to Santa. Press Escape to leave the maze.'); });

  // drag / swipe: steer relative to where the finger or mouse first touched
  canvas.addEventListener('pointerdown', function (e) {
    if (state === 'won') return;
    if (e.pointerType === 'touch' && !stage.classList.contains('is-playing')) return; // let the page scroll until play mode
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0 };
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    overStart.hidden = true; wake();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || drag.id !== e.pointerId) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, m = Math.sqrt(dx * dx + dy * dy), full = 36;
    if (m < 4) { drag.x = drag.y = 0; return; }
    var s = Math.min(1, m / full); drag.x = dx / m * s; drag.y = dy / m * s;
    // let the anchor follow the finger so reversing direction feels immediate
    if (m > full * 1.6) { drag.x0 = e.clientX - dx / m * full * 1.6; drag.y0 = e.clientY - dy / m * full * 1.6; }
  });
  function endDrag(e) { if (drag && drag.id === e.pointerId) drag = null; }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag); canvas.addEventListener('lostpointercapture', endDrag);

  // on-screen buttons (also fine with keyboard: Enter / Space nudge)
  root.querySelectorAll('.sv-pad button').forEach(function (b) {
    var d = b.getAttribute('data-dir');
    function on(e) { e.preventDefault(); pad[d] = true; b.classList.add('on'); overStart.hidden = true; wake(); }
    function off() { pad[d] = false; b.classList.remove('on'); }
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { on(e); } });
    b.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') off(); });
    b.addEventListener('blur', off);
  });

  // tilt
  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    tilt = { g: e.gamma, b: e.beta };
    if (tiltOn && !tiltBase) tiltBase = { g: tilt.g, b: tilt.b };
    if (tiltOn && state === 'ready' && (Math.abs(tilt.g - tiltBase.g) > 6 || Math.abs(tilt.b - tiltBase.b) > 6)) overStart.hidden = true;
    wake();
  }
  function setTilt(on) {
    tiltOn = on; tiltBase = null; tiltBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    tiltBtn.textContent = on ? 'Tilt is on' : 'Steer by tilting';
    say(on ? 'Tilt is on. Hold the phone level, then lean it to roll Rudolph.' : 'Tilt is off.');
    if (on) { window.addEventListener('deviceorientation', onOrient); enterPlay(); }
    else window.removeEventListener('deviceorientation', onOrient);
  }
  if (tiltBtn) {
    var touchy = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if ('DeviceOrientationEvent' in window && touchy) tiltBtn.hidden = false;
    tiltBtn.addEventListener('click', function () {
      if (tiltOn) { setTilt(false); return; }
      var D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') {          // iOS asks once, on a tap
        D.requestPermission().then(function (r) {
          if (r === 'granted') setTilt(true); else say('Tilt was not allowed. You can still drag or use the buttons.');
        }).catch(function () { say('Tilt is not available here. You can still drag or use the buttons.'); });
      } else setTilt(true);
    });
  }

  helpBtn.addEventListener('click', function () {
    help = !help; helpBtn.setAttribute('aria-pressed', help ? 'true' : 'false');
    say(help ? 'Reindeer Help is on: Rudolph’s glow reaches further.' : 'Reindeer Help is off.'); wake();
  });
  root.querySelectorAll('[data-again]').forEach(function (b) { b.addEventListener('click', function () { newGame(); canvas.focus({ preventScroll: true }); }); });
  root.querySelector('[data-new]').addEventListener('click', newGame);
  sizeSel.addEventListener('change', newGame);

  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); wake(); }, 120); });
  document.addEventListener('visibilitychange', wake);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }).observe(root);

  newGame();
  // test hook (read-only state for automated checks)
  window.__svDemo = { get: function () { return { state: state, ball: ball, goal: goal, cols: cols, rows: rows, walls: walls }; } };
})();
