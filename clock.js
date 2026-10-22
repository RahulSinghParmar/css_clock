import { validZone, zonedParts, angles, readPreferences } from './time.js';

const $ = (id) => document.getElementById(id);
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const defaults = {
  zone: local,
  theme: 'light',
  format: true,
  smooth: false,
  pins: ['Europe/London', 'Asia/Kolkata', 'America/New_York'],
};
const saved = readPreferences(storage, defaults);
const state = {
  zone: validZone(saved.zone) ? saved.zone : local,
  theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'light',
  format: typeof saved.format === 'boolean' ? saved.format : true,
  smooth: saved.smooth === true,
  pins: Array.isArray(saved.pins)
    ? [...new Set(saved.pins.filter(validZone))].slice(0, 4)
    : defaults.pins,
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');
let frame,
  timer,
  last = -1,
  renderedSecond = -1;
const names = (zone) => zone.split('/').at(-1).replaceAll('_', ' ');
const zones = [
  ...new Set([
    local,
    'UTC',
    ...(Intl.supportedValuesOf
      ? Intl.supportedValuesOf('timeZone')
      : ['Europe/London', 'Asia/Kolkata', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney']),
    state.zone,
  ]),
].sort();
for (const zone of zones) {
  const option = document.createElement('option');
  option.value = zone;
  option.textContent = zone === local ? `${names(zone)} · local` : zone.replaceAll('_', ' ');
  $('timezone').append(option);
}
$('timezone').value = state.zone;
$('theme').value = state.theme;
$('format').checked = state.format;
$('smooth').checked = state.smooth;
for (let i = 0; i < 60; i++) {
  const tick = document.createElement('span');
  tick.className = `tick${i % 5 ? '' : ' major'}`;
  tick.style.transform = `rotate(${i * 6}deg)`;
  $('ticks').append(tick);
}
for (let i = 1; i <= 12; i++) {
  const number = document.createElement('span');
  number.className = 'number';
  number.textContent = i;
  number.style.left = `${50 + 37 * Math.sin((i * Math.PI) / 6)}%`;
  number.style.top = `${50 - 37 * Math.cos((i * Math.PI) / 6)}%`;
  $('numbers').append(number);
}
new ResizeObserver((entries) => {
  const size = entries[0].contentRect.width;
  document.querySelector('.dial').style.setProperty('--dial-size', `${size}px`);
}).observe(document.querySelector('.dial'));
function persist() {
  try {
    storage?.setItem('tempo-v1', JSON.stringify(state));
  } catch {
    $('notice').textContent = 'Preferences could not be saved. Your current session still works.';
  }
}
function theme() {
  document.documentElement.dataset.theme =
    state.theme === 'system' ? (dark.matches ? 'dark' : 'light') : state.theme;
}
function cards() {
  $('world-clocks').replaceChildren();
  if (!state.pins.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Pin a timezone above to start your world clock.';
    $('world-clocks').append(empty);
  }
  for (const zone of state.pins) {
    const card = document.createElement('article');
    card.className = 'city-card';
    card.dataset.zone = zone;
    const heading = document.createElement('h3');
    heading.textContent = names(zone);
    const time = document.createElement('div');
    time.className = 'city-time';
    const meta = document.createElement('p');
    meta.className = 'city-meta';
    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${names(zone)} clock`);
    remove.onclick = () => {
      state.pins = state.pins.filter((p) => p !== zone);
      persist();
      cards();
      render(true);
      $('add-zone').focus();
      $('notice').textContent = `${names(zone)} removed.`;
    };
    card.append(heading, time, meta, remove);
    $('world-clocks').append(card);
  }
}
function formatTime(date, zone, seconds = true) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    ...(state.format ? { hourCycle: 'h23' } : { hour12: true }),
  }).format(date);
}
function render(force = false) {
  const now = new Date();
  const parts = zonedParts(now, state.zone);
  const sweep = state.smooth && !reduced.matches;
  const degrees = angles(parts, sweep ? now.getMilliseconds() : 0);
  for (const name of ['hour', 'minute', 'second'])
    $(`${name}-hand`).style.transform = `rotate(${degrees[name]}deg)`;
  if (!force && renderedSecond === Math.floor(now.getTime() / 1000)) return;
  renderedSecond = Math.floor(now.getTime() / 1000);
  const full = formatTime(now, state.zone);
  $('time').textContent = full.replace(/\s*[ap]m$/i, '');
  $('time').dateTime = now.toISOString();
  $('period').textContent = full.match(/[ap]m$/i)?.[0].toUpperCase() || '';
  $('date').textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: state.zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  $('zone-short').textContent = names(state.zone).toUpperCase();
  for (const card of document.querySelectorAll('.city-card')) {
    const zone = card.dataset.zone;
    card.querySelector('.city-time').textContent = formatTime(now, zone, false);
    card.querySelector('.city-meta').textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZoneName: 'short',
    }).format(now);
  }
  $('motion-note').textContent = reduced.matches
    ? 'Reduced motion is on. The clock updates once a second.'
    : sweep
      ? 'A continuous sweep. Always in the present.'
      : 'A quiet tick, once a second.';
}
function loop(timestamp) {
  if (timestamp - last >= 32) {
    render();
    last = timestamp;
  }
  frame = requestAnimationFrame(loop);
}
function schedule() {
  cancelAnimationFrame(frame);
  clearTimeout(timer);
  if (document.hidden) return;
  render(true);
  if (state.smooth && !reduced.matches) frame = requestAnimationFrame(loop);
  else timer = setTimeout(schedule, 1000 - (Date.now() % 1000));
}
for (const id of ['timezone', 'theme', 'format', 'smooth'])
  $(id).addEventListener('change', () => {
    state.zone = $('timezone').value;
    state.theme = $('theme').value;
    state.format = $('format').checked;
    state.smooth = $('smooth').checked;
    persist();
    theme();
    schedule();
  });
$('add-zone').onclick = () => {
  if (state.pins.includes(state.zone)) {
    $('notice').textContent = 'That timezone is already pinned.';
    return;
  }
  if (state.pins.length >= 4) {
    $('notice').textContent = 'You can pin four timezones. Remove one first.';
    return;
  }
  state.pins.push(state.zone);
  persist();
  cards();
  render(true);
  $('notice').textContent = `${names(state.zone)} pinned.`;
};
dark.addEventListener('change', theme);
reduced.addEventListener('change', schedule);
document.addEventListener('visibilitychange', schedule);
theme();
cards();
schedule();
