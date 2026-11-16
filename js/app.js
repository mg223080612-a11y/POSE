// app.js — 화면 전환 · 인원 선택 · 세션 진행 · 설정 · 화면 꺼짐 방지
import { pickSession, recentIds, saveRecent, clearRecent } from './picker.js';
import { startCamera, hasCamera, countdown, captureFrame } from './camera.js';
import { composeSheet, sheetToBlobUrl } from './compose.js';
import { printSheet, clearPrintArea } from './print.js';

const CUTS = 4;
const PRINT_SECONDS = 41; // SELPHY CP1500 엽서 1장
const $ = (id) => document.getElementById(id);

// ---------- 설정 ----------
const SETTINGS_KEY = 'nextpose.settings';
const settings = { guide: true, seconds: 5, wake: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')); } catch { /* 기본값 */ }
const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* 무시 */ } };

// ---------- 이번 세션 (브라우저 메모리에만) ----------
let poses = [];
let session = null; // { people, picks, frames, sheetUrl, abort }

// ---------- 화면 전환 ----------
function show(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('is-active', s.id === `screen-${name}`));
}

// ---------- F7 화면 꺼짐 방지 ----------
let wakeLock = null;
async function requestWake() {
  if (!settings.wake || !('wakeLock' in navigator)) return updateWakeStatus();
  try {
    if (!wakeLock || wakeLock.released) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', updateWakeStatus);
    }
  } catch (e) {
    console.warn('화면 꺼짐 방지 실패:', e);
  }
  updateWakeStatus();
}
function releaseWake() { wakeLock?.release().catch(() => {}); wakeLock = null; updateWakeStatus(); }
function updateWakeStatus() {
  const el = $('wake-status');
  if (!('wakeLock' in navigator)) el.textContent = '이 브라우저는 지원하지 않아요 (크롬 84·사파리 16.4 이상)';
  else if (wakeLock && !wakeLock.released) el.textContent = '켜짐 · 화면이 꺼지지 않아요';
  else el.textContent = '삼각대에 세운 휴대폰 화면을 켜 둬요';
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') requestWake(); });

// ---------- ② 촬영 ----------
const sleep = (ms, signal) => new Promise((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('취소', 'AbortError')); }, { once: true });
});

function renderDots(current, frames) {
  const ol = $('cut-dots');
  ol.innerHTML = '';
  for (let i = 0; i < CUTS; i++) {
    const li = document.createElement('li');
    if (i === current) li.className = 'now';
    if (frames[i]) {
      const img = document.createElement('img');
      img.src = frames[i].toDataURL('image/jpeg', 0.6);
      img.alt = '';
      li.appendChild(img);
    }
    ol.appendChild(li);
  }
  $('cut-label').textContent = `${Math.min(current + 1, CUTS)} / ${CUTS}`;
}

function renderPose(i) {
  const card = $('pose-card');
  card.classList.remove('swap');
  void card.offsetWidth;
  card.classList.add('swap');
  if (!settings.guide) {
    card.classList.add('free');
    $('pose-name').textContent = '자유 포즈';
    $('pose-tip').textContent = '원하는 포즈로 찍어요';
    return;
  }
  card.classList.remove('free');
  const p = session.picks[i];
  $('pose-img').src = p.img;
  $('pose-img').alt = `${p.name} 포즈 그림`;
  $('pose-name').textContent = p.name;
  $('pose-tip').textContent = p.tip;
}

function setCount(text, { small = false } = {}) {
  const el = $('count');
  el.textContent = text;
  el.classList.toggle('small', small);
  el.classList.remove('tick');
  void el.offsetWidth;
  if (text !== '') el.classList.add('tick');
}

async function runSession(people) {
  const abort = new AbortController();
  const picks = settings.guide
    ? pickSession(poses, people, { count: CUTS, recentIds: recentIds() })
    : [];
  session = { people, picks, frames: [], sheetUrl: null, abort };
  const { signal } = abort;

  show('shoot');
  renderDots(0, []);
  renderPose(0);
  setCount('');

  const camOk = await startCamera($('video'));
  $('cam-empty').hidden = camOk;

  try {
    setCount('준비!', { small: true });
    await sleep(1500, signal);
    for (let i = 0; i < CUTS; i++) {
      if (i > 0) renderPose(i);
      renderDots(i, session.frames);
      await countdown(settings.seconds, (n) => setCount(n > 0 ? String(n) : ''), signal);
      $('flash').classList.remove('on');
      void $('flash').offsetWidth;
      $('flash').classList.add('on');
      const frame = captureFrame($('video'), i);
      session.frames.push(frame);
      const pv = $('snap-preview');
      pv.src = frame.toDataURL('image/jpeg', 0.8);
      pv.classList.add('on');
      renderDots(i + 1, session.frames);
      await sleep(1100, signal);
      pv.classList.remove('on');
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
    throw e;
  }

  if (settings.guide) saveRecent(picks.map((p) => p.id));
  const sheet = composeSheet(session.frames);
  session.sheetUrl = await sheetToBlobUrl(sheet);
  $('sheet-img').src = session.sheetUrl;
  $('print-more').hidden = people < 3;
  show('result');
}

// ---------- ③④ 인쇄 ----------
let printTimer = null;
async function doPrint() {
  if (!session?.sheetUrl) return;
  await printSheet(session.sheetUrl);
  show('printing');
  startPrintProgress();
}
function startPrintProgress() {
  clearInterval(printTimer);
  const bar = $('print-bar');
  const start = Date.now();
  const tick = () => {
    const t = (Date.now() - start) / 1000;
    const r = Math.min(1, t / PRINT_SECONDS);
    bar.style.width = `${r * 100}%`;
    const left = Math.max(0, Math.ceil(PRINT_SECONDS - t));
    $('print-left').textContent = left > 0 ? `약 ${left}초` : '다 나왔어요! 잘라서 나눠 가져요';
    if (r >= 1) clearInterval(printTimer);
  };
  tick();
  printTimer = setInterval(tick, 250);
}

function goHome() {
  // 사진은 여기서 지운다
  session?.abort.abort();
  if (session?.sheetUrl) URL.revokeObjectURL(session.sheetUrl);
  session = null;
  clearInterval(printTimer);
  clearPrintArea();
  $('sheet-img').removeAttribute('src');
  $('snap-preview').removeAttribute('src');
  $('snap-preview').classList.remove('on');
  setCount('');
  show('start');
}

// ---------- 설정 화면 ----------
function syncSettingsUI() {
  $('opt-guide').checked = settings.guide;
  $('opt-seconds').value = String(settings.seconds);
  $('opt-wake').checked = settings.wake;
  $('guide-off-badge').hidden = settings.guide;
}
function renderGallery() {
  $('pose-count').textContent = poses.length;
  const label = { 2: '2인', 3: '3인', 4: '4인 이상' };
  $('gallery').innerHTML = poses.map((p) => `
    <figure><img src="${p.img}" alt="" loading="lazy"><figcaption>${p.name}<small>${label[p.people]} · ${p.id}</small></figcaption></figure>`).join('');
}

// ---------- 이벤트 ----------
document.querySelectorAll('.people-btn').forEach((b) =>
  b.addEventListener('click', () => {
    requestWake();
    runSession(Number(b.dataset.people)).catch((e) => { alert(e.message); goHome(); });
  })
);
$('cancel-shoot').addEventListener('click', goHome);
$('retake').addEventListener('click', goHome);
$('print-btn').addEventListener('click', doPrint);
$('print-more').addEventListener('click', doPrint);
$('print-again').addEventListener('click', doPrint);
$('go-home').addEventListener('click', goHome);

$('open-settings').addEventListener('click', () => { syncSettingsUI(); updateWakeStatus(); $('settings').showModal(); });
$('opt-guide').addEventListener('change', (e) => { settings.guide = e.target.checked; saveSettings(); syncSettingsUI(); });
$('opt-seconds').addEventListener('change', (e) => { settings.seconds = Number(e.target.value); saveSettings(); });
$('opt-wake').addEventListener('change', (e) => { settings.wake = e.target.checked; saveSettings(); settings.wake ? requestWake() : releaseWake(); });
$('clear-recent').addEventListener('click', (e) => { clearRecent(); e.target.textContent = '지웠어요'; setTimeout(() => (e.target.textContent = '지우기'), 1500); });

// ---------- 시작 ----------
(async function init() {
  syncSettingsUI();
  try {
    const res = await fetch('data/poses.json', { cache: 'no-cache' });
    poses = await res.json();
    // 실루엣 미리 받아 두기
    poses.forEach((p) => { const i = new Image(); i.src = p.img; });
  } catch (e) {
    alert('포즈 목록을 불러오지 못했어요. 로컬 서버(node tools/serve.mjs)로 열었는지 확인해 주세요.');
    console.error(e);
  }
  renderGallery();
  requestWake();
})();

// 디버그용 (콘솔에서 확인)
window.__nextpose = { get session() { return session; }, get poses() { return poses; }, hasCamera };
