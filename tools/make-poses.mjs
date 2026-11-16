// 포즈 실루엣(SVG)과 data/poses.json을 한 번에 만든다.
// 실행: node tools/make-poses.mjs
// 인생네컷·포토이즘 같은 부스 사진처럼 '상반신 클로즈업 + 손·표정' 위주로 그린다.
// 손으로 그린 PNG로 바꾸고 싶으면 img/poses/에 넣고 poses.json의 img만 고치면 된다.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#3c4129';
const ACCENT = '#c0674a';
const BG = '#f2f1ea';
const H = 272; // 아래는 잘린 상반신

// ---- 몸 (사람 하나, 가운데 x=0) ----
const HEAD_Y = 96, HEAD_R = 40, NECK = 138;
const SHOULDER = { x: 46, y: 182 };
const UA = 54, FA = 54;
const BODY = 'M-72 420 L-72 214 Q-70 160 -26 152 L26 152 Q70 160 72 214 L72 420 Z';

// ---- 자주 쓰는 손 (head: 머리 중심 기준, x는 바깥쪽이 +) ----
const vFace = { head: [54, 2], g: 'v', fo: -80 };
const chinCup = { head: [22, 48], g: 'palm', fo: -60 };
const paw = { head: [40, 36], g: 'paw', fo: -90 };
const cheekPress = { head: [40, 16], g: 'palm', fo: -95 };
const hairHold = { head: [36, -42], g: 'fist', b: 'out' };
const fingerHeart = { head: [52, 30], g: 'heart', fo: -90 };
const vEye = { head: [36, 2], g: 'v', fo: 180 };

const POSES = [
  // ---------- 2인 ----------
  {
    id: 'p2-01', people: 2, name: '반쪽 하트', mood: 'cute',
    tip: '얼굴을 서로 기울이고, 안쪽 손으로 반쪽 하트를 만들어 붙이기',
    ps: [
      { x: 108, tilt: 10, face: 'smile', R: { abs: [160, 168], g: 'fist' } },
      { x: 212, tilt: -10, face: 'happy', L: { abs: [160, 168], g: 'fist' } },
    ],
    fx: [{ t: 'heart', x: 160, y: 140, s: 26 }],
  },
  {
    id: 'p2-02', people: 2, name: '하트 속 한쪽 눈', mood: 'cute',
    tip: '두 손으로 하트를 만들어 한쪽 눈만 하트 안에 쏙 넣기',
    ps: [
      { x: 105, tilt: 6, face: 'smile', L: { head: [-4, 26], g: 'fist', b: 'out' }, R: { head: [34, 24], g: 'fist' } },
      { x: 215, tilt: -6, face: 'smile', R: { head: [-4, 26], g: 'fist', b: 'out' }, L: { head: [34, 24], g: 'fist' } },
    ],
    fx: [{ t: 'heartLine', on: [0, 15, 2], s: 34 }, { t: 'heartLine', on: [1, -15, 2], s: 34 }],
  },
  {
    id: 'p2-03', people: 2, name: '볼 콕 찌르기', mood: 'funny',
    tip: '한 명이 옆 사람 볼을 콕 찌르고, 찔린 사람은 입술 쭉',
    ps: [
      { x: 105, tilt: 4, face: 'wink', R: { on: [1, -34, 16], g: 'point', fo: 0 } },
      { x: 218, tilt: -8, face: 'pout' },
    ],
    fx: [{ t: 'spark', on: [1, -40, 6], r: 16, dir: -140 }],
  },
  {
    id: 'p2-04', people: 2, name: '백허그', mood: 'cute',
    tip: '뒤에 선 사람이 앞사람 어깨를 감싸 안고 고개를 기대기',
    ps: [
      { x: 196, y: -14, s: 0.95, tilt: -14, face: 'happy',
        L: { body: [1, -10, 214], g: 'fist', front: true }, R: { body: [1, 34, 206], g: 'fist', front: true } },
      { x: 126, y: 10, tilt: 6, face: 'smile' },
    ],
    fx: [],
  },
  {
    id: 'p2-05', people: 2, name: '어깨 뒤 빼꼼', mood: 'funny',
    tip: '앞사람은 시크하게, 뒷사람은 어깨 뒤에서 빼꼼 얼굴 내밀기',
    ps: [
      { x: 98, y: 34, s: 0.9, tilt: -20, face: 'open' },
      { x: 192, s: 1.08, tilt: 3, face: 'cool' },
    ],
    fx: [{ t: 'spark', on: [0, -10, -46], r: 14, dir: -110 }],
  },
  {
    id: 'p2-06', people: 2, name: '고양이 손', mood: 'cute',
    tip: '두 손을 동그랗게 말아 얼굴 옆에 고양이 손, 냐옹',
    ps: [
      { x: 105, tilt: 8, face: 'happy', ears: true, L: paw, R: paw },
      { x: 215, tilt: -8, face: 'smile', ears: true, L: paw, R: paw },
    ],
    fx: [],
  },
  {
    id: 'p2-07', people: 2, name: '꽃받침', mood: 'cute',
    tip: '두 손바닥으로 턱을 받쳐 꽃받침, 고개는 서로 쪽으로',
    ps: [
      { x: 105, tilt: 10, face: 'happy', L: chinCup, R: chinCup },
      { x: 215, tilt: -10, face: 'happy', L: chinCup, R: chinCup },
    ],
    fx: [{ t: 'heart', x: 160, y: 50, s: 16 }],
  },
  {
    id: 'p2-08', people: 2, name: '볼 꼬집기', mood: 'funny',
    tip: '한 명이 옆 사람 볼을 손으로 꾹 누르고, 눌린 사람은 놀란 표정',
    ps: [
      { x: 104, tilt: 6, face: 'tongue', R: { on: [1, -36, 18], g: 'palm', fo: -10 } },
      { x: 214, tilt: -10, face: 'open' },
    ],
    fx: [{ t: 'spark', on: [1, 40, -6], r: 14, dir: -30 }],
  },
  {
    id: 'p2-09', people: 2, name: '윙크 브이', mood: 'cute',
    tip: '바깥 손으로 얼굴 옆에 브이, 한쪽 눈 찡긋',
    ps: [
      { x: 105, tilt: 8, face: 'wink', L: vFace },
      { x: 215, tilt: -8, face: 'wink', R: vFace },
    ],
    fx: [],
  },
  {
    id: 'p2-10', people: 2, name: '어깨에 기대기', mood: 'cool',
    tip: '한 명이 옆 사람 어깨에 머리를 기대고, 둘 다 무표정하게 정면',
    ps: [
      { x: 214, face: 'cool' },
      { x: 128, y: 24, lean: 9, tilt: 18, s: 0.96, face: 'cool' },
    ],
    fx: [],
  },

  // ---------- 3인 ----------
  {
    id: 'p3-01', people: 3, name: '다 같이 브이', mood: 'cute',
    tip: '키를 조금씩 다르게 하고 다 같이 얼굴 옆 브이',
    ps: [
      { x: 100, y: 14, tilt: 8, face: 'smile', L: vFace },
      { x: 210, y: -12, face: 'wink', R: vFace },
      { x: 320, y: 8, tilt: -8, face: 'happy', R: vFace },
    ],
    fx: [],
  },
  {
    id: 'p3-02', people: 3, name: '가운데 주목', mood: 'funny',
    tip: '양옆 두 명이 가운데 사람 얼굴을 가리키고, 가운데는 꽃받침',
    ps: [
      { x: 96, lean: 5, tilt: 6, face: 'open', R: { on: [1, -48, 4], g: 'point', fo: 0 } },
      { x: 324, lean: -5, tilt: -6, face: 'open', L: { on: [1, 48, 4], g: 'point', fo: 0 } },
      { x: 210, face: 'happy', L: chinCup, R: chinCup },
    ],
    fx: [{ t: 'spark', on: [2, 0, -46], r: 14, dir: -90 }],
  },
  {
    id: 'p3-03', people: 3, name: '고양이 삼총사', mood: 'cute',
    tip: '셋 다 두 손을 말아 고양이 손, 고개는 각자 다른 쪽으로',
    ps: [
      { x: 100, tilt: 10, face: 'happy', ears: true, L: paw, R: paw },
      { x: 210, tilt: -6, face: 'pout', ears: true, L: paw, R: paw },
      { x: 320, tilt: 6, face: 'smile', ears: true, L: paw, R: paw },
    ],
    fx: [],
  },
  {
    id: 'p3-04', people: 3, name: '머리 쥐어뜯기', mood: 'funny',
    tip: '두 손으로 머리를 쥐고 망한 척, 표정은 최대한 과장',
    ps: [
      { x: 100, tilt: -8, face: 'open', L: hairHold, R: hairHold },
      { x: 210, tilt: 6, face: 'tongue', L: hairHold, R: hairHold },
      { x: 320, tilt: -4, face: 'open', L: hairHold, R: hairHold },
    ],
    fx: [],
  },
  {
    id: 'p3-05', people: 3, name: '얼굴 탑 쌓기', mood: 'funny',
    tip: '한 줄로 서서 위아래로 얼굴만 빼꼼, 얼굴 탑 만들기',
    ps: [
      { x: 232, y: -66, s: 0.9, tilt: -12, face: 'wink' },
      { x: 186, y: -4, s: 0.95, tilt: 12, face: 'open' },
      { x: 226, y: 62, tilt: -6, face: 'smile' },
    ],
    fx: [],
  },
  {
    id: 'p3-06', people: 3, name: '볼 누르기 기차', mood: 'funny',
    tip: '왼쪽부터 차례로 오른쪽 사람 볼을 꾹, 마지막 사람은 입술 쭉',
    ps: [
      { x: 102, tilt: 4, face: 'happy', R: { on: [1, -36, 18], g: 'palm', fo: -10 } },
      { x: 212, tilt: -2, face: 'open', R: { on: [2, -36, 18], g: 'palm', fo: -10 } },
      { x: 322, tilt: -10, face: 'pout' },
    ],
    fx: [],
  },
  {
    id: 'p3-07', people: 3, name: '손가락 하트', mood: 'cute',
    tip: '셋 다 볼 옆에서 손가락 하트, 가운데는 양손으로',
    ps: [
      { x: 100, tilt: 8, face: 'smile', L: fingerHeart },
      { x: 210, face: 'wink', L: fingerHeart, R: fingerHeart },
      { x: 320, tilt: -8, face: 'smile', R: fingerHeart },
    ],
    fx: [],
  },
  {
    id: 'p3-08', people: 3, name: '눈가 브이', mood: 'cool',
    tip: '브이를 옆으로 눕혀 눈가에 대고, 무표정하게 렌즈 응시',
    ps: [
      { x: 100, tilt: 4, face: 'cool', R: vEye },
      { x: 210, face: 'cool', L: vEye },
      { x: 320, tilt: -4, face: 'cool', R: vEye },
    ],
    fx: [],
  },

  // ---------- 4인 이상 ----------
  {
    id: 'p4-01', people: 4, name: '다 같이 윙크 브이', mood: 'cute',
    tip: '키를 지그재그로 맞추고 다 같이 브이와 윙크',
    ps: [
      { x: 85, y: 12, tilt: 8, face: 'wink', L: vFace },
      { x: 195, y: -14, face: 'smile', R: vFace },
      { x: 305, y: 12, face: 'wink', R: vFace },
      { x: 415, y: -10, tilt: -8, face: 'happy', R: vFace },
    ],
    fx: [],
  },
  {
    id: 'p4-02', people: 4, name: '앞뒤 두 줄', mood: 'cool',
    tip: '앞줄 둘은 살짝 앉고, 뒷줄 둘은 그 사이로 얼굴 내밀기',
    ps: [
      { x: 145, y: -48, s: 0.9, tilt: 6, face: 'cool' },
      { x: 355, y: -48, s: 0.9, tilt: -6, face: 'cool' },
      { x: 250, y: -44, s: 0.9, face: 'cool' },
      { x: 190, y: 46, tilt: -4, face: 'smile' },
      { x: 310, y: 46, tilt: 4, face: 'smile' },
    ],
    fx: [],
  },
  {
    id: 'p4-03', people: 4, name: '고양이 손 넷', mood: 'cute',
    tip: '넷 다 고양이 손, 가운데 둘은 서로 얼굴을 붙이기',
    ps: [
      { x: 85, tilt: 8, face: 'smile', ears: true, L: paw, R: paw },
      { x: 198, tilt: 12, face: 'happy', ears: true, L: paw, R: paw },
      { x: 302, tilt: -12, face: 'happy', ears: true, L: paw, R: paw },
      { x: 415, tilt: -8, face: 'pout', ears: true, L: paw, R: paw },
    ],
    fx: [],
  },
  {
    id: 'p4-04', people: 4, name: '가운데로 얼굴 모으기', mood: 'cute',
    tip: '다 같이 가운데로 고개를 기울이고, 양끝은 손가락 하트',
    ps: [
      { x: 92, lean: 8, tilt: 16, face: 'happy', L: fingerHeart },
      { x: 200, lean: 4, tilt: 10, face: 'smile' },
      { x: 300, lean: -4, tilt: -10, face: 'smile' },
      { x: 408, lean: -8, tilt: -16, face: 'happy', R: fingerHeart },
    ],
    fx: [{ t: 'heart', x: 250, y: 30, s: 18 }],
  },
  {
    id: 'p4-05', people: 4, name: '깜짝 놀람', mood: 'funny',
    tip: '두 손으로 볼을 감싸고 입을 크게 벌려 다 같이 깜짝',
    ps: [
      { x: 85, tilt: -6, face: 'open', L: cheekPress, R: cheekPress },
      { x: 195, tilt: 6, face: 'open', L: cheekPress, R: cheekPress },
      { x: 305, tilt: -6, face: 'open', L: cheekPress, R: cheekPress },
      { x: 415, tilt: 6, face: 'open', L: cheekPress, R: cheekPress },
    ],
    fx: [{ t: 'spark', x: 140, y: 20, r: 10, dir: -90 }, { t: 'spark', x: 360, y: 20, r: 10, dir: -90 }],
  },
  {
    id: 'p4-06', people: 4, name: '어깨 손 기차', mood: 'funny',
    tip: '옆 사람 어깨에 손을 올려 기차처럼, 맨 끝 사람은 브이',
    ps: [
      { x: 85, lean: 4, tilt: 6, face: 'tongue', R: { body: [1, -44, 180], g: 'palm', fo: 90, b: 'down', front: true } },
      { x: 195, lean: 4, tilt: -4, face: 'happy', R: { body: [2, -44, 180], g: 'palm', fo: 90, b: 'down', front: true } },
      { x: 305, lean: 4, tilt: 6, face: 'smile', R: { body: [3, -44, 180], g: 'palm', fo: 90, b: 'down', front: true } },
      { x: 415, tilt: -6, face: 'wink', R: vFace },
    ],
    fx: [],
  },
];

// ---------- 기하 ----------
const rad = (d) => (d * Math.PI) / 180;
const rot = (p, deg, c) => {
  const a = rad(deg), cs = Math.cos(a), sn = Math.sin(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs };
};
const fmt = (n) => Math.round(n * 10) / 10;

function personXf(p) {
  const s = p.s ?? 1, lean = p.lean ?? 0, tilt = p.tilt ?? 0, ox = p.x, oy = p.y ?? 0;
  const body = (q) => {
    let r = { x: q.x * s, y: 272 + (q.y - 272) * s };
    r = rot(r, lean, { x: 0, y: 272 });
    return { x: r.x + ox, y: r.y + oy };
  };
  const head = (q) => body(rot({ x: q.x, y: q.y + HEAD_Y }, tilt, { x: 0, y: NECK }));
  const svgBody = `translate(${fmt(ox)} ${fmt(oy)}) rotate(${lean} 0 272) translate(0 272) scale(${s}) translate(0 -272)`;
  const svgHead = `${svgBody} rotate(${tilt} 0 ${NECK}) translate(0 ${HEAD_Y})`;
  return { s, body, head, svgBody, svgHead };
}

function solveArm(sh, t, len1, len2, pref) {
  const dx = t.x - sh.x, dy = t.y - sh.y;
  let d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const max = len1 + len2 - 0.5;
  if (d >= max) return { e: { x: sh.x + ux * len1, y: sh.y + uy * len1 }, h: { x: sh.x + ux * max, y: sh.y + uy * max } };
  d = Math.max(d, Math.abs(len1 - len2) + 2);
  const a = Math.acos((len1 * len1 + d * d - len2 * len2) / (2 * len1 * d));
  let best = null, bestScore = -Infinity;
  for (const ang of [a, -a]) {
    const c = Math.cos(ang), sn = Math.sin(ang);
    const rx = ux * c - uy * sn, ry = ux * sn + uy * c;
    const score = rx * pref[0] + ry * pref[1];
    if (score > bestScore) { bestScore = score; best = { x: sh.x + rx * len1, y: sh.y + ry * len1 }; }
  }
  return { e: best, h: { x: t.x, y: t.y } };
}

// ---------- 그리기 ----------
function face(kind) {
  const w = `stroke="${BG}" stroke-width="4" fill="none"`;
  const dot = (x) => `<circle cx="${x}" cy="-2" r="4.2" fill="${BG}"/>`;
  const arc = (x) => `<path d="M${x - 6} 1 Q${x} -7 ${x + 6} 1" ${w}/>`;
  const smile = `<path d="M-10 15 Q0 24 10 15" ${w}/>`;
  const blush = `<circle cx="-25" cy="13" r="6" fill="${ACCENT}" opacity=".45"/><circle cx="25" cy="13" r="6" fill="${ACCENT}" opacity=".45"/>`;
  switch (kind) {
    case 'happy': return arc(-14) + arc(14) + smile + blush;
    case 'wink': return dot(-14) + arc(14) + smile + blush;
    case 'pout': return dot(-14) + dot(14) + `<circle cx="0" cy="19" r="4.5" fill="${BG}"/>` + blush;
    case 'open': return dot(-14) + dot(14) + `<ellipse cx="0" cy="20" rx="7" ry="9" fill="${BG}"/>`;
    case 'cool': return `<path d="M-21 -2 L-8 -2 M8 -2 L21 -2" ${w}/><path d="M-7 18 L7 18" ${w}/>`;
    case 'tongue': return dot(-14) + arc(14) + `<path d="M-11 14 Q0 20 11 14" ${w}/><ellipse cx="3" cy="21" rx="5" ry="6" fill="${ACCENT}"/>`;
    default: return dot(-14) + dot(14) + smile + blush;
  }
}

function ears() {
  return `<path d="M-36 -18 L-32 -62 L-8 -38 Z" fill="${INK}"/><path d="M36 -18 L32 -62 L8 -38 Z" fill="${INK}"/>` +
    `<path d="M-30 -28 L-29 -50 L-17 -38 Z" fill="${ACCENT}"/><path d="M30 -28 L29 -50 L17 -38 Z" fill="${ACCENT}"/>`;
}

function heartPath(x, y, size, fill = true) {
  const k = size / 40;
  const d = 'M0 14 C-4 10 -20 0 -20 -9 C-20 -18 -7 -21 0 -12 C7 -21 20 -18 20 -9 C20 0 4 10 0 14Z';
  return fill
    ? `<path transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k * 2)})" fill="${ACCENT}" stroke="none" d="${d}"/>`
    : `<path transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k * 2)})" fill="none" stroke="${ACCENT}" stroke-width="${fmt(4 / (k * 2))}" d="${d}"/>`;
}

function spark(x, y, r, dir) {
  return [-35, 0, 35].map((off) => {
    const a = rad(dir + off);
    return `<path d="M${fmt(x + Math.cos(a) * r)} ${fmt(y + Math.sin(a) * r)} L${fmt(x + Math.cos(a) * (r + 12))} ${fmt(y + Math.sin(a) * (r + 12))}" stroke="${ACCENT}" stroke-width="5"/>`;
  }).join('');
}

function hand(h, u, g, s) {
  const out = { halo: [], ink: [] };
  const r = 16 * s;
  const line = (len, angOff) => {
    const a = Math.atan2(u.y, u.x) + rad(angOff);
    return `M${fmt(h.x)} ${fmt(h.y)} L${fmt(h.x + Math.cos(a) * len)} ${fmt(h.y + Math.sin(a) * len)}`;
  };
  const circ = (cx, cy, rr) => {
    out.halo.push(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(rr + 4)}" fill="${BG}" stroke="none"/>`);
    out.ink.push(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(rr)}" fill="${INK}" stroke="none"/>`);
  };
  const finger = (len, off) => {
    out.halo.push(`<path d="${line(len, off)}" stroke="${BG}" stroke-width="${fmt(14 * s)}"/>`);
    out.ink.push(`<path d="${line(len, off)}" stroke-width="${fmt(8 * s)}"/>`);
  };
  if (g === 'v') { finger(34 * s, -14); finger(34 * s, 14); circ(h.x, h.y, r); }
  else if (g === 'point') { finger(32 * s, 0); circ(h.x, h.y, r); }
  else if (g === 'palm') {
    const ang = (Math.atan2(u.y, u.x) * 180) / Math.PI - 90;
    out.halo.push(`<ellipse cx="${fmt(h.x)}" cy="${fmt(h.y)}" rx="${fmt(16 * s)}" ry="${fmt(22 * s)}" transform="rotate(${fmt(ang)} ${fmt(h.x)} ${fmt(h.y)})" fill="${BG}" stroke="none"/>`);
    out.ink.push(`<ellipse cx="${fmt(h.x)}" cy="${fmt(h.y)}" rx="${fmt(12 * s)}" ry="${fmt(18 * s)}" transform="rotate(${fmt(ang)} ${fmt(h.x)} ${fmt(h.y)})" fill="${INK}" stroke="none"/>`);
  } else if (g === 'paw') {
    circ(h.x, h.y, 15 * s);
    for (const off of [-45, 0, 45]) {
      const a = Math.atan2(u.y, u.x) + rad(off);
      circ(h.x + Math.cos(a) * 15 * s, h.y + Math.sin(a) * 15 * s, 6.5 * s);
    }
  } else if (g === 'heart') {
    circ(h.x, h.y, r);
    out.ink.push(heartPath(h.x + u.x * 30 * s, h.y + u.y * 30 * s, 22 * s));
  } else {
    circ(h.x, h.y, r);
  }
  return out;
}

function buildSvg(pose) {
  const n = pose.people;
  const W = n === 2 ? 320 : n === 3 ? 420 : 500;
  const xfs = pose.ps.map(personXf);
  const sideOf = { L: -1, R: 1 };

  const target = (spec, xf, side) => {
    if (spec.abs) return { x: spec.abs[0], y: spec.abs[1] };
    if (spec.on) return xfs[spec.on[0]].head({ x: spec.on[1], y: spec.on[2] });
    if (spec.body) return xfs[spec.body[0]].body({ x: spec.body[1], y: spec.body[2] });
    if (spec.head) return xf.head({ x: spec.head[0] * side, y: spec.head[1] });
    return xf.body({ x: spec.h[0] * side, y: spec.h[1] });
  };

  const layers = pose.ps.map(() => []);
  const front = [];
  pose.ps.forEach((p, i) => {
    const xf = xfs[i];
    const L = layers[i];
    L.push(`<path transform="${xf.svgBody}" d="${BODY}" fill="${INK}" stroke="${BG}" stroke-width="5"/>`);
    L.push(`<rect transform="${xf.svgBody}" x="-15" y="118" width="30" height="44" rx="8" fill="${INK}" stroke="none"/>`);
    L.push(`<g transform="${xf.svgHead}">${p.ears ? ears() : ''}<circle r="${HEAD_R}" fill="${INK}" stroke="${BG}" stroke-width="5"/>${face(p.face)}</g>`);
    for (const key of ['L', 'R']) {
      const spec = p[key];
      if (!spec) continue;
      const side = sideOf[key];
      const sh = xf.body({ x: SHOULDER.x * side, y: SHOULDER.y });
      const t = target(spec, xf, side);
      const pref = { down: [0, 1], up: [0, -1], out: [side, 0], in: [-side, 0], outdown: [side * 0.8, 0.6] }[spec.b ?? 'outdown'];
      const { e, h } = solveArm(sh, t, UA * xf.s, FA * xf.s, pref);
      let u;
      if (spec.fo != null) u = { x: side * Math.cos(rad(spec.fo)), y: Math.sin(rad(spec.fo)) };
      else { const l = Math.hypot(h.x - e.x, h.y - e.y) || 1; u = { x: (h.x - e.x) / l, y: (h.y - e.y) / l }; }
      const d = `M${fmt(sh.x)} ${fmt(sh.y)} L${fmt(e.x)} ${fmt(e.y)} L${fmt(h.x)} ${fmt(h.y)}`;
      const hd = hand(h, u, spec.g ?? 'fist', xf.s);
      const parts = [
        `<path d="${d}" stroke="${BG}" stroke-width="${fmt(34 * xf.s)}"/>`,
        ...hd.halo,
        `<path d="${d}" stroke-width="${fmt(26 * xf.s)}"/>`,
        ...hd.ink,
      ];
      (spec.front ? front : L).push(...parts);
    }
  });

  const fx = (pose.fx ?? []).map((e) => {
    const at = e.on ? xfs[e.on[0]].head({ x: e.on[1], y: e.on[2] }) : { x: e.x, y: e.y };
    if (e.t === 'heart') return heartPath(at.x, at.y, e.s ?? 20);
    if (e.t === 'heartLine') return heartPath(at.x, at.y + 4, e.s ?? 30, false);
    if (e.t === 'spark') return spark(at.x, at.y, e.r ?? 16, e.dir ?? -90);
    return '';
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${pose.name}">
<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
${layers.flat().join('\n')}
${front.join('\n')}
${fx.join('\n')}
</g>
</svg>
`;
}

// ---------- 출력 ----------
mkdirSync(join(ROOT, 'img', 'poses'), { recursive: true });
mkdirSync(join(ROOT, 'data'), { recursive: true });
const json = [];
for (const p of POSES) {
  const img = `img/poses/${p.id}.svg`;
  writeFileSync(join(ROOT, img), buildSvg(p));
  json.push({ id: p.id, people: p.people, name: p.name, tip: p.tip, mood: p.mood, img });
}
writeFileSync(join(ROOT, 'data', 'poses.json'), JSON.stringify(json, null, 2) + '\n');
const count = (k) => json.filter((p) => p.people === k).length;
console.log(`포즈 ${json.length}개 생성 (2인 ${count(2)} · 3인 ${count(3)} · 4인 이상 ${count(4)})`);
