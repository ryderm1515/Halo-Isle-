import './hud.css';
import { heightAt } from '../world/terrain.js';
const el = (cls, html = '', tag = 'div') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
export function createHud() {
  const root = document.getElementById('hud');
  const tl = el('tl'), coins = el('pill glass', '<span class="ico coin"></span><b>0</b>'), stars = el('pill glass', '<span class="ico star">★</span><b>0</b>'), shards = el('shards glass', '<i></i><i></i><i></i><i></i><i></i>'); tl.append(coins, stars, shards);
  const map = el('map glass', '<span class="n">N</span><canvas width="264" height="264"></canvas>'), prompt = el('prompt glass hide'), area = el('area', '<h1></h1><hr><p></p>'), toasts = el('toasts'), dialog = el('dialog glass hide'), act = el('act glass hide', '<div class="nm"></div><div class="tm"></div><div class="sc"></div>'),
    result = el('result glass hide'), journal = el('journal glass hide'), help = el('help glass', '<span><b>WASD</b> move · <b>Space</b> jump (again in the air to hop higher) · <b>Shift</b> stroll · <b>Drag</b> look · <b>E</b> interact · <b>1-9</b> emotes · <b>Tab</b> journal · <b>M</b> sound</span>'), fade = el('fade');
  root.append(tl, map, area, toasts, act, prompt, dialog, result, journal, help, fade);
  setTimeout(() => help.classList.add('hide'), 14000);
  // --- minimap: a painted top-down of the island, drawn once
  const MS = 264, WORLD = 760, base = document.createElement('canvas'); base.width = base.height = MS;
  { const g = base.getContext('2d'), im = g.createImageData(MS, MS); for (let j = 0; j < MS; j++) for (let i = 0; i < MS; i++) { const x = (i / MS - 0.5) * WORLD, z = (j / MS - 0.5) * WORLD, h = heightAt(x, z), k = (j * MS + i) * 4; let c;
      if (h < -3) c = [40, 150, 235]; else if (h < 0) c = [90, 205, 240]; else if (h < 2.6) c = [250, 232, 170]; else if (h < 34) c = [110, 205, 80]; else if (h < 64) c = [86, 180, 70]; else if (h < 110) c = [150, 170, 110]; else c = [205, 190, 150];
      const sh = Math.max(-18, Math.min(18, (heightAt(x - 3, z - 3) - h) * 6)); im.data[k] = c[0] - sh; im.data[k + 1] = c[1] - sh; im.data[k + 2] = c[2] - sh; im.data[k + 3] = 255; } g.putImageData(im, 0, 0); }
  const mctx = map.querySelector('canvas').getContext('2d'); let markers = [];
  let areaT = 0, promptKey = '';
  const api = {
    root,
    setCoins(n) { const b = coins.querySelector('b'); if (b.textContent !== String(n)) { b.textContent = n; coins.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 220 }); } },
    setStars(n, total) { stars.querySelector('b').textContent = `${n}/${total}`; },
    setShards(n) { [...shards.children].forEach((c, i) => c.classList.toggle('on', i < n)); },
    toast(text, sub = '') { const t = el('toast glass', `<span style="position:relative">${text}${sub ? `<small>${sub}</small>` : ''}</span>`); toasts.append(t); setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = 0; setTimeout(() => t.remove(), 520); }, 3600); while (toasts.children.length > 4) toasts.firstChild.remove(); },
    area(name, sub = '') { area.querySelector('h1').textContent = name; area.querySelector('p').textContent = sub; area.classList.add('show'); clearTimeout(areaT); areaT = setTimeout(() => area.classList.remove('show'), 3400); },
    prompt(key, text) { if (!key) { prompt.classList.add('hide'); promptKey = ''; return; } const k = key + text; if (k !== promptKey) { prompt.innerHTML = `<span class="key">${key}</span><span style="position:relative">${text}</span>`; promptKey = k; } prompt.classList.remove('hide'); },
    dialogOpen: false,
    dialog(who, lines, done) { let i = 0; api.dialogOpen = true; const show = () => { dialog.innerHTML = `<span class="who">${who}</span><div style="position:relative">${lines[i]}</div><span class="more">Space ▸</span>`; dialog.classList.remove('hide'); }; show();
      api.advance = () => { i++; if (i >= lines.length) { dialog.classList.add('hide'); api.dialogOpen = false; api.advance = null; done?.(); } else show(); return true; }; },
    activity(name) { if (!name) { act.classList.add('hide'); return; } act.querySelector('.nm').textContent = name.toUpperCase(); act.classList.remove('hide'); },
    activityUpdate(time, score = '') { act.querySelector('.tm').textContent = time; act.querySelector('.sc').textContent = score; },
    result(title, medal, lines, ms = 4200) { result.innerHTML = `<h2>${title}</h2><div class="medal">${medal}</div>${lines.map((l) => `<p>${l}</p>`).join('')}`; result.classList.remove('hide'); setTimeout(() => result.classList.add('hide'), ms); },
    journalOpen: false,
    journal(html) { if (html == null) { journal.classList.add('hide'); api.journalOpen = false; return; } journal.innerHTML = html; journal.classList.remove('hide'); api.journalOpen = true; }, journalEl: journal,
    setMarkers(m) { markers = m; },
    flash() { fade.style.opacity = 0.85; setTimeout(() => (fade.style.opacity = 0), 260); },
    update(x, z, yaw) {
      const s = MS / WORLD, zoom = 2.1; mctx.save(); mctx.clearRect(0, 0, MS, MS); mctx.translate(MS / 2, MS / 2); mctx.scale(zoom, zoom); mctx.translate(-(x / WORLD + 0.5) * MS, -(z / WORLD + 0.5) * MS); mctx.drawImage(base, 0, 0);
      for (const m of markers) { if (m.hidden) continue; const px = (m.x / WORLD + 0.5) * MS, pz = (m.z / WORLD + 0.5) * MS; mctx.beginPath(); mctx.arc(px, pz, 3.4, 0, 7); mctx.fillStyle = m.color || '#fff'; mctx.fill(); mctx.lineWidth = 1.2; mctx.strokeStyle = '#fff'; mctx.stroke(); }
      mctx.restore(); mctx.save(); mctx.translate(MS / 2, MS / 2); mctx.rotate(Math.PI - yaw); mctx.beginPath(); mctx.moveTo(0, -11); mctx.lineTo(7.5, 8); mctx.lineTo(0, 4.5); mctx.lineTo(-7.5, 8); mctx.closePath(); mctx.fillStyle = '#3fb2fb'; mctx.fill(); mctx.lineWidth = 2.5; mctx.strokeStyle = '#fff'; mctx.stroke(); mctx.restore();
    },
  };
  return api;
}
