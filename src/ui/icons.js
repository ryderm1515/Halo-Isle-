// One hand-drawn icon set for the whole game: map markers, the legend, the inventory, shop lists. 24x24 glyphs on a gel disc.
const W = 'fill="#fff"', L = 'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const G = {
  activity: `<path d="M7.5 5v14.5" ${L}/><path d="M8.5 5.5h9l-2.2 3 2.2 3h-9z" ${W}/>`,
  islander: `<circle cx="12" cy="14" r="5.6" ${W}/><path d="M12 8.6c-.2-3 2.6-4.4 5-3.8-.4 2.7-2.4 4-5 3.8z" ${W}/><ellipse cx="10" cy="13.6" rx=".9" ry="1.7" fill="#1c5fb5"/><ellipse cx="14" cy="13.6" rx=".9" ry="1.7" fill="#1c5fb5"/>`,
  lift: `<path d="M7.5 17l4.5-4.5 4.5 4.5M7.5 11.5L12 7l4.5 4.5" ${L}/>`,
  portal: `<path d="M5.5 19.5V11.5a6.5 6.5 0 0113 0v8h-3.2v-8a3.3 3.3 0 00-6.6 0v8z" ${W}/>`,
  bubble: `<circle cx="12" cy="12" r="6.5" ${L}/><path d="M9 10.5a3.4 3.4 0 012.6-2" ${L}/>`,
  cart: `<path d="M5 8.5h13M6.5 8.5v5M16.5 8.5v5" ${L}/><path d="M4.5 13h15l-.8 3.5h-13.4z" ${W}/><circle cx="8" cy="17.5" r="1.9" ${W}/><circle cx="16" cy="17.5" r="1.9" ${W}/>`,
  ski: `<path d="M5 11.5l10.5-1.8 3-3.2-9.5 1.4z" ${W}/><path d="M4 16c2 1.8 4 1.8 5.5 0s3.5-1.8 5 0 3.5 1.8 5.5 0" ${L}/>`,
  glider: `<path d="M2.8 13.2L12 5.5l9.2 7.7L12 10.6z" ${W}/><path d="M12 10.6V17M9.5 18.6h5" ${L}/>`,
  door: `<path d="M4.8 12.2L12 5.6l7.2 6.6V19h-4.7v-4.4h-5V19H4.8z" ${W}/>`,
  cat: `<path d="M6 6.5l3 3.2h6l3-3.2V14a6 6 0 01-12 0z" ${W}/><circle cx="9.8" cy="13" r="1" fill="#1c5fb5"/><circle cx="14.2" cy="13" r="1" fill="#1c5fb5"/>`,
  golf: `<path d="M9 4.5v13" ${L}/><path d="M9.6 5l7.4 2.6-7.4 2.6z" ${W}/><ellipse cx="11.5" cy="18.3" rx="6" ry="1.7" ${W}/>`,
  shop: `<path d="M4.8 9.2l1.7-4.4h11l1.7 4.4a2.3 2.3 0 01-4.7 0 2.3 2.3 0 01-4.6 0 2.3 2.3 0 01-5.1 0zM6.4 12.6h11.2V19H6.4z" ${W}/>`,
  star: `<path d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.2 5.8L12 16.5 6.8 19.4 8 13.6 3.7 9.6l5.8-.7z" ${W}/>`,
  shard: `<path d="M12 3l5.2 9L12 21l-5.2-9z" ${W}/><path d="M12 3v18M6.8 12h10.4" stroke="#7fd8ff" stroke-width="1"/>`,
  rod: `<path d="M5 19.5L17.5 5" ${L}/><path d="M17.5 5v6.5a2 2 0 01-4 0" ${L}/>`,
  bench: `<path d="M5 10h14M5 13.5h14M7 13.5V18M17 13.5V18" ${L}/>`,
  mango: `<path d="M7 14.5c0-4 3-7 6.5-6.5s4.5 4 3 7-5 4.5-7.3 3.3S7 16 7 14.5z" ${W}/><path d="M13 8c.4-2 2-3 3.8-2.8" ${L}/>`,
  coconut: `<circle cx="12" cy="12.5" r="6.5" ${W}/><circle cx="10" cy="11" r="1" fill="#1c5fb5"/><circle cx="14" cy="11" r="1" fill="#1c5fb5"/><circle cx="12" cy="14.2" r="1" fill="#1c5fb5"/>`,
  shell: `<path d="M12 19c-4.5 0-7.5-3.6-7.5-7.6 2.2-3.6 5-5.4 7.5-5.4s5.300 1.800 7.500 5.400c0 4-3 7.600-7.500 7.600z" ${W}/><path d="M12 19V7M12 19L7.300 9M12 19l4.700-10" stroke="#ff8fb5" stroke-width="1.200"/>`,
  starfish: `<path d="M12 3.6l2.500 5.300 5.800.700-4.300 4 1.200 5.800L12 16.500 6.800 19.400 8 13.600 3.700 9.600l5.800-.700z" ${W}/><circle cx="12" cy="12" r="1.200" fill="#ff9a45"/>`,
  fish: `<path d="M4 12c2.500-4 8-5 11.500-2.200L20 7v10l-4.500-2.800C12 17 6.500 16 4 12z" ${W}/><circle cx="8" cy="11.200" r="1" fill="#1c5fb5"/>`,
  flower: `<circle cx="12" cy="7" r="3" ${W}/><circle cx="16.800" cy="10.500" r="3" ${W}/><circle cx="15" cy="16" r="3" ${W}/><circle cx="9" cy="16" r="3" ${W}/><circle cx="7.200" cy="10.500" r="3" ${W}/><circle cx="12" cy="12" r="2.200" fill="#ffd23f"/>`,
  seeds: `<ellipse cx="8.500" cy="14" rx="2.200" ry="3.200" transform="rotate(-25 8.500 14)" ${W}/><ellipse cx="14" cy="9.500" rx="2.200" ry="3.200" transform="rotate(20 14 9.500)" ${W}/><ellipse cx="15.500" cy="16" rx="2" ry="2.800" transform="rotate(50 15.500 16)" ${W}/>`,
  lantern: `<path d="M9 5h6M8 8h8l-1 9H9z" ${W}/><path d="M9.500 5a2.500 2.500 0 015 0" ${L}/><path d="M8.500 19h7" ${L}/>`,
  pearl: `<circle cx="12" cy="12" r="6" ${W}/><path d="M9 10.500a3.400 3.400 0 012.600-2" stroke="#ff8fb5" stroke-width="1.600" fill="none" stroke-linecap="round"/>`,
  coin: `<circle cx="12" cy="12" r="7" ${W}/><path d="M9 14.500c0-3 1.200-5 3-5s3 2 3 5z" fill="#ffb21f"/>`,
  club: `<path d="M16 4L9 17.500" ${L}/><path d="M9 17.500c-1.500 1-4 1.300-4.500.300s1.500-2.300 4-2z" ${W}/>`,
  you: `<path d="M12 3.500l6 16-6-3.500-6 3.500z" ${W}/>`,
};
export const COLORS = { activity: '#ffb21f', islander: '#59b8f7', lift: '#59d7f5', portal: '#4fd6c8', bubble: '#ff8fb5', cart: '#8fa3b8', ski: '#2fb4e8', glider: '#ff9a45', door: '#9a7be0', cat: '#f6a85c', golf: '#63c94a', shop: '#ff7f6a', star: '#ffc21f', shard: '#3fb2fb', rod: '#4f8fd0', bench: '#c98a4b',
  mango: '#ff9a45', coconut: '#a8743f', shell: '#ff8fb5', starfish: '#ff9a45', fish: '#4fb4f2', flower: '#ff8fb5', seeds: '#8cc94a', lantern: '#ffb21f', pearl: '#c9a7ff', coin: '#ffc21f', club: '#63c94a', you: '#3fb2fb' };
export const icon = (name, size = 24, color = COLORS[name] || '#59b8f7') => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-2 -2 28 28"><defs><linearGradient id="ig${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><circle cx="12" cy="12" r="12.800" fill="#fff"/><circle cx="12" cy="12" r="11.400" fill="${color}"/><ellipse cx="12" cy="6.500" rx="8.500" ry="5" fill="url(#ig${name})"/><g transform="translate(2.900 2.900) scale(.76)">${G[name] || G.activity}</g></svg>`;
const imgs = {};
export function iconImage(name, color) { const k = name + (color || ''); if (!imgs[k]) { const im = new Image(); im.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(icon(name, 64, color)); imgs[k] = im; } return imgs[k]; }
// which icon a map marker gets
export const markerIcon = (m) => { const n = (m.name || '').toLowerCase(); if (m.icon) return m.icon; if (n.includes('bubble')) return 'bubble'; if (n.includes('golf range') || n.includes('driving range')) return 'golf'; if (n.includes('fishing')) return 'rod'; if (m.kind === 'portal') return 'portal'; return G[m.kind] ? m.kind : 'activity'; };
