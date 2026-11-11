import './hud.css';
import { heightAt } from '../world/terrain.js';
export const el = (cls, html = '', tag = 'div') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
export function createHud() {
  const root = document.getElementById('hud');
  const tl = el('tl'), coins = el('pill glass', '<span class="ico coin"></span><b>0</b>'), stars = el('pill glass', '<span class="ico star">★</span><b>0</b>'), shards = el('shards glass', '<i></i><i></i><i></i><i></i><i></i>'); tl.append(coins, stars, shards);
  const map = el('map glass', '<span class="n">N</span><canvas width="264" height="264"></canvas>'), clock = el('clock glass', '<span>Afternoon</span>'), prompt = el('prompt glass hide'), area = el('area', '<h1></h1><hr><p></p>'), toasts = el('toasts'), dialog = el('dialog glass hide'), act = el('act glass hide', '<div class="nm"></div><div class="tm"></div><div class="sc"></div>'),
    result = el('result glass hide'), journal = el('panel glass hide'), fade = el('fade'), wps = el('wps'),
    keys = el('keys', '<span><span class="key">Tab</span>Journal</span><span><span class="key">M</span>Map</span><span><span class="key">Esc</span>Menu</span>'),
    help = el('help glass hide', '<span><span class="key">W A S D</span> move &nbsp; <span class="key">Space</span> jump, again in the air, three in a row for a flip &nbsp; <span class="key">Shift</span> sprint &nbsp; <span class="key">C</span> slide / dive<br><span class="key">Click</span> capture the mouse to look &nbsp; <span class="key">E</span> interact &nbsp; <span class="key">X</span> sit &nbsp; <span class="key">1-9</span> emotes &nbsp; <span class="key">Caps</span> stroll</span>');
  root.append(wps, tl, map, clock, area, toasts, act, prompt, dialog, result, journal, keys, help, fade);
  const MS = 264, WORLD = 760, base = document.createElement('canvas'); base.width = base.height = MS * 2;
  { const N = MS * 2, g = base.getContext('2d'), im = g.createImageData(N, N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i / N - 0.5) * WORLD, z = (j / N - 0.5) * WORLD, h = heightAt(x, z), k = (j * N + i) * 4; let c;
      if (h < -3) c = [40, 150, 235]; else if (h < 0) c = [90, 205, 240]; else if (h < 2.6) c = [250, 232, 170]; else if (h < 34) c = [110, 205, 80]; else if (h < 64) c = [86, 180, 70]; else if (h < 110) c = [150, 170, 110]; else c = [205, 190, 150];
      const sh = Math.max(-18, Math.min(18, (heightAt(x - 3, z - 3) - h) * 6)); im.data[k] = c[0] - sh; im.data[k + 1] = c[1] - sh; im.data[k + 2] = c[2] - sh; im.data[k + 3] = 255; } g.putImageData(im, 0, 0); }
  const mctx = map.querySelector('canvas').getContext('2d'); let markers = [];
  let areaT = 0, promptKey = '';
  const api = {
    root, wps, mapBase: base, WORLD, markers: () => markers,
    setCoins(n) { const b = coins.querySelector('b'); if (b.textContent !== String(n)) { b.textContent = n; coins.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 220 }); } },
    setStars(n, total) { stars.querySelector('b').textContent = `${n}/${total}`; },
    setShards(n) { [...shards.children].forEach((c, i) => c.classList.toggle('on', i < n)); },
    setClock(t) { const s = clock.firstChild; if (s.textContent !== t) s.textContent = t; },
    showHelp(ms = 12000) { help.classList.remove('hide'); setTimeout(() => help.classList.add('hide'), ms); },
    chrome(on) { for (const e of [tl, map, clock, keys]) e.classList.toggle('hide', !on); },
    toast(text, sub = '') { const t = el('toast glass', `<span>${text}${sub ? `<small>${sub}</small>` : ''}</span>`); toasts.append(t); setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = 0; setTimeout(() => t.remove(), 520); }, 3600); while (toasts.children.length > 4) toasts.firstChild.remove(); },
    area(name, sub = '') { area.querySelector('h1').textContent = name; area.querySelector('p').textContent = sub; area.classList.add('show'); clearTimeout(areaT); areaT = setTimeout(() => area.classList.remove('show'), 3400); },
    prompt(key, text) { if (!key) { prompt.classList.add('hide'); promptKey = ''; return; } const k = key + text; if (k !== promptKey) { prompt.innerHTML = `<span class="key">${key}</span><span>${text}</span>`; promptKey = k; } prompt.classList.remove('hide'); },
    dialogOpen: false,
    dialog(who, lines, done) { let i = 0; api.dialogOpen = true; const show = () => { dialog.innerHTML = `<span class="who">${who}</span><div>${lines[i]}</div><span class="more">Space / click ▸</span>`; dialog.classList.remove('hide'); }; show();
      api.advance = () => { i++; if (i >= lines.length) { dialog.classList.add('hide'); api.dialogOpen = false; api.advance = null; done?.(); } else show(); return true; }; },
    activity(name) { if (!name) { act.classList.add('hide'); return; } act.querySelector('.nm').textContent = name.toUpperCase(); act.classList.remove('hide'); },
    activityUpdate(time, score = '') { act.querySelector('.tm').textContent = time; act.querySelector('.sc').textContent = score; },
    result(title, medal, lines, ms = 4200) { result.innerHTML = `<h2>${title}</h2><div class="medal">${medal}</div>${lines.map((l) => `<p>${l}</p>`).join('')}`; result.classList.remove('hide'); setTimeout(() => result.classList.add('hide'), ms); },
    journalOpen: false,
    journal(html) { if (html == null) { journal.classList.add('hide'); api.journalOpen = false; return; } journal.innerHTML = `<div class="bar">Island Journal<span class="x">Tab / Esc to close</span></div><div class="body">${html}</div>`; journal.classList.remove('hide'); api.journalOpen = true; }, journalEl: journal,
    setMarkers(m) { markers = m; },
    flash() { fade.style.opacity = 0.85; setTimeout(() => (fade.style.opacity = 0), 260); },
    fadeTo(v, color = '#fff') { fade.style.background = color; fade.style.opacity = v; },
    update(x, z, yaw) {
      const zoom = 2.1; mctx.save(); mctx.clearRect(0, 0, MS, MS); mctx.translate(MS / 2, MS / 2); mctx.scale(zoom, zoom); mctx.translate(-(x / WORLD + 0.5) * MS, -(z / WORLD + 0.5) * MS); mctx.drawImage(base, 0, 0, MS, MS);
      for (const m of markers) { if (m.hidden) continue; const px = (m.x / WORLD + 0.5) * MS, pz = (m.z / WORLD + 0.5) * MS; mctx.beginPath(); if (m.shape === 'sq') mctx.rect(px - 3, pz - 3, 6, 6); else if (m.shape === 'tri') { mctx.moveTo(px, pz - 4.5); mctx.lineTo(px + 4, pz + 3); mctx.lineTo(px - 4, pz + 3); mctx.closePath(); } else mctx.arc(px, pz, m.r || 3.2, 0, 7); mctx.fillStyle = m.color || '#fff'; mctx.fill(); mctx.lineWidth = 1.1; mctx.strokeStyle = '#fff'; mctx.stroke(); }
      mctx.restore(); mctx.save(); mctx.translate(MS / 2, MS / 2); mctx.rotate(Math.PI - yaw); mctx.beginPath(); mctx.moveTo(0, -11); mctx.lineTo(7.5, 8); mctx.lineTo(0, 4.5); mctx.lineTo(-7.5, 8); mctx.closePath(); mctx.fillStyle = '#3fb2fb'; mctx.fill(); mctx.lineWidth = 2.5; mctx.strokeStyle = '#fff'; mctx.stroke(); mctx.restore();
    },
  };
  dialog.addEventListener('click', () => api.advance?.());
  return api;
}
