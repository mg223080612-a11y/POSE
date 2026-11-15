// 포즈 실루엣(SVG)과 data/poses.json을 한 번에 만든다.
// 실행: node tools/make-poses.mjs
// 포즈를 손으로 그린 PNG로 바꾸고 싶으면 img/poses/에 파일을 넣고 poses.json의 img만 고치면 된다.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#47433e';
const ACCENT = '#ff5a5f';
const BG = '#ffffff';
const H = 270;

// ---- 몸 비율 (발 중심 = (0, 250)) ----
const UA = 36, FA = 34;          // 윗팔·아랫팔 길이
const SHOULDER = { x: 17, y: 110 };
const HEAD = { x: 0, y: 68, r: 23 };
const SHIFT = { stand: 0, wide: 0, crouch: 40, tiptoe: -10, jump: -24 };
const LEGS = {
  stand: [[[10, 170], [13, 246]]],
  wide: [[[11, 170], [30, 244]]],
  crouch: [[[10, 212], [30, 220], [16, 247]]],
  tiptoe: [[[10, 160], [11, 244]]],
  jump: [[[10, 146], [24, 180], [14, 206]]],
};

// 자주 쓰는 손 위치 (x는 바깥쪽이 +)
const A = {
  down: { h: [24, 176], b: 'out' },
  hip: { h: [22, 160], b: 'out' },
  up: { h: [30, 38], b: 'out' },
  upWide: { h: [62, 50], b: 'down' },
  cheek: { h: [14, 80], b: 'out' },
  chin: { h: [5, 98], b: 'out' },
  vFace: { h: [32, 70], b: 'down' },
  wave: { h: [56, 58], b: 'down' },
  out: { h: [86, 104], b: 'down' },
  cross: { h: [-14, 132], b: 'out' },
  fistUp: { h: [34, 46], b: 'out' },
  heartChest: { h: [-4, 128], b: 'down' },
  headTop: { h: [-2, 36], b: 'out' },
};

const POSES = [
  // ---------- 2인 ----------
  {
    id: 'p2-01', people: 2, name: '반쪽 하트', mood: 'cute',
    tip: '안쪽 손으로 반쪽 하트를 만들어 가슴 앞에서 붙이기',
    figs: [
      { x: 105, R: { h: [47, 122], b: 'down' } },
      { x: 215, L: { h: [47, 122], b: 'down' } },
    ],
    fx: [{ t: 'heart', x: 160, y: 108, s: 22 }],
  },
  {
    id: 'p2-02', people: 2, name: '머리 위 큰 하트', mood: 'cute',
    tip: '안쪽 팔을 머리 위로 둥글게 올려 둘이서 큰 하트 만들기',
    figs: [
      { x: 110, R: { h: [48, 36], b: 'up' }, L: A.hip },
      { x: 210, L: { h: [48, 36], b: 'up' }, R: A.hip },
    ],
    fx: [{ t: 'heart', x: 160, y: 18, s: 20 }],
  },
  {
    id: 'p2-03', people: 2, name: '볼 찌르기', mood: 'cute',
    tip: '한 명이 옆 사람 볼을 콕 찌르고, 찔린 사람은 놀란 표정',
    figs: [
      { x: 108, R: { h: [100, 80], b: 'down' } },
      { x: 212, lean: -6, R: A.cheek, L: A.down },
    ],
    fx: [{ t: 'spark', x: 196, y: 64, r: 26, dir: -135 }],
  },
  {
    id: 'p2-04', people: 2, name: '등 맞대고 팔짱', mood: 'cool',
    tip: '서로 등을 대고 서서 팔짱 끼고 시크하게 정면 보기',
    figs: [
      { x: 126, lean: 3, L: A.cross, R: A.cross },
      { x: 194, lean: -3, L: A.cross, R: A.cross },
    ],
    fx: [],
  },
  {
    id: 'p2-05', people: 2, name: '얼굴 옆 브이', mood: 'cute',
    tip: '바깥쪽 손으로 얼굴 옆에 브이, 고개는 서로 쪽으로 살짝',
    figs: [
      { x: 108, lean: 4, L: A.vFace },
      { x: 212, lean: -4, R: A.vFace },
    ],
    fx: [{ t: 'v', at: [0, 'L'] }, { t: 'v', at: [1, 'R'] }],
  },
  {
    id: 'p2-06', people: 2, name: '깜짝 놀람', mood: 'funny',
    tip: '두 손으로 볼을 감싸고 입을 크게 벌려 놀란 표정',
    figs: [
      { x: 105, L: A.cheek, R: A.cheek },
      { x: 215, L: A.cheek, R: A.cheek },
    ],
    fx: [{ t: 'spark', x: 105, y: 52, r: 34, dir: -90 }, { t: 'spark', x: 215, y: 52, r: 34, dir: -90 }],
  },
  {
    id: 'p2-07', people: 2, name: '어깨동무', mood: 'cute',
    tip: '안쪽 팔로 어깨동무하고 바깥 손은 크게 흔들기',
    figs: [
      { x: 120, R: { h: [88, 102], b: 'up' }, L: A.wave },
      { x: 200, L: { h: [88, 102], b: 'up' }, R: A.wave },
    ],
    fx: [{ t: 'spark', at: [0, 'L'], r: 16, dir: -150 }, { t: 'spark', at: [1, 'R'], r: 16, dir: -30 }],
  },
  {
    id: 'p2-08', people: 2, name: '슈퍼히어로', mood: 'cool',
    tip: '다리를 벌리고 두 손을 허리에, 턱은 살짝 위로',
    figs: [
      { x: 105, legs: 'wide', L: A.hip, R: A.hip },
      { x: 215, legs: 'wide', L: A.hip, R: A.hip },
    ],
    fx: [],
  },
  {
    id: 'p2-09', people: 2, name: '손가락 총', mood: 'cool',
    tip: '바깥 손 손가락 총을 비스듬히 위로 겨누고 윙크',
    figs: [
      { x: 118, L: { h: [74, 70], b: 'down' }, R: A.hip },
      { x: 202, R: { h: [74, 70], b: 'down' }, L: A.hip },
    ],
    fx: [{ t: 'spark', at: [0, 'L'], r: 14, dir: -160 }, { t: 'spark', at: [1, 'R'], r: 14, dir: -20 }],
  },
  {
    id: 'p2-10', people: 2, name: '점프 하이파이브', mood: 'funny',
    tip: '둘이 같이 점프하면서 머리 위에서 하이파이브',
    figs: [
      { x: 122, legs: 'jump', R: { h: [38, 46], b: 'out' }, L: A.out },
      { x: 198, legs: 'jump', L: { h: [38, 46], b: 'out' }, R: A.out },
    ],
    fx: [{ t: 'spark', x: 160, y: 12, r: 24, dir: -90 }],
  },

  // ---------- 3인 ----------
  {
    id: 'p3-01', people: 3, name: '키 계단', mood: 'cute',
    tip: '왼쪽부터 앉기·서기·까치발로 키 계단 만들고 브이',
    figs: [
      { x: 95, legs: 'crouch', R: A.vFace },
      { x: 200, R: A.vFace },
      { x: 305, legs: 'tiptoe', R: A.vFace },
    ],
    fx: [{ t: 'v', at: [0, 'R'] }, { t: 'v', at: [1, 'R'] }, { t: 'v', at: [2, 'R'] }],
  },
  {
    id: 'p3-02', people: 3, name: '가운데 주목', mood: 'funny',
    tip: '양옆 두 명이 가운데 사람을 가리키고, 가운데는 꽃받침',
    figs: [
      { x: 92, lean: 6, R: { h: [100, 78], b: 'down' } },
      { x: 200, L: A.chin, R: A.chin },
      { x: 308, lean: -6, L: { h: [100, 78], b: 'down' } },
    ],
    fx: [{ t: 'spark', x: 200, y: 50, r: 36, dir: -90 }],
  },
  {
    id: 'p3-03', people: 3, name: '삼총사 만세', mood: 'funny',
    tip: '셋이 동시에 두 팔을 번쩍 들어 만세',
    figs: [
      { x: 95, L: A.upWide, R: A.upWide },
      { x: 200, legs: 'jump', L: A.upWide, R: A.upWide },
      { x: 305, L: A.upWide, R: A.upWide },
    ],
    fx: [],
  },
  {
    id: 'p3-04', people: 3, name: '센터 앞으로', mood: 'cool',
    tip: '가운데가 한 발 앞으로 나오고, 다 같이 팔짱',
    figs: [
      { x: 105, s: 0.9, lean: 3, L: A.cross, R: A.cross },
      { x: 295, s: 0.9, lean: -3, L: A.cross, R: A.cross },
      { x: 200, s: 1.08, L: A.cross, R: A.cross },
    ],
    fx: [],
  },
  {
    id: 'p3-05', people: 3, name: '꽃받침', mood: 'cute',
    tip: '두 손바닥으로 얼굴을 받쳐 꽃받침, 활짝 웃기',
    figs: [
      { x: 95, lean: 4, L: A.chin, R: A.chin },
      { x: 200, L: A.chin, R: A.chin },
      { x: 305, lean: -4, L: A.chin, R: A.chin },
    ],
    fx: [{ t: 'heart', x: 148, y: 40, s: 14 }, { t: 'heart', x: 254, y: 40, s: 14 }],
  },
  {
    id: 'p3-06', people: 3, name: '비행기 기울기', mood: 'funny',
    tip: '셋이 같은 쪽으로 몸을 기울이고 두 팔은 비행기처럼',
    figs: [
      { x: 110, lean: -14, L: A.out, R: A.out },
      { x: 210, lean: -14, L: A.out, R: A.out },
      { x: 310, lean: -14, L: A.out, R: A.out },
    ],
    fx: [],
  },
  {
    id: 'p3-07', people: 3, name: '셋이서 하트', mood: 'cute',
    tip: '가운데는 머리 위로 큰 하트, 양옆은 가슴 앞 손하트',
    figs: [
      { x: 92, L: A.heartChest, R: A.heartChest },
      { x: 200, L: A.headTop, R: A.headTop },
      { x: 308, L: A.heartChest, R: A.heartChest },
    ],
    fx: [{ t: 'heart', x: 200, y: 20, s: 18 }, { t: 'heart', x: 92, y: 116, s: 13 }, { t: 'heart', x: 308, y: 116, s: 13 }],
  },
  {
    id: 'p3-08', people: 3, name: '생각하는 사람', mood: 'cool',
    tip: '한 손은 턱에, 다른 팔은 받치고 진지하게 생각하는 척',
    figs: [
      { x: 95, lean: 3, R: { h: [-2, 96], b: 'down' }, L: { h: [-10, 138], b: 'out' } },
      { x: 200, lean: 3, R: { h: [-2, 96], b: 'down' }, L: { h: [-10, 138], b: 'out' } },
      { x: 305, lean: 3, R: { h: [-2, 96], b: 'down' }, L: { h: [-10, 138], b: 'out' } },
    ],
    fx: [],
  },

  // ---------- 4인 이상 ----------
  {
    id: 'p4-01', people: 4, name: '파도타기', mood: 'funny',
    tip: '왼쪽부터 차례로 몸을 일으키며 팔을 들어 파도 모양',
    figs: [
      { x: 85, legs: 'crouch', L: A.out, R: A.out },
      { x: 185, L: A.wave, R: A.wave },
      { x: 285, legs: 'tiptoe', L: A.upWide, R: A.upWide },
      { x: 385, legs: 'jump', L: A.up, R: A.up },
    ],
    fx: [],
  },
  {
    id: 'p4-02', people: 4, name: '가운데 하트 주목', mood: 'cute',
    tip: '가운데 둘은 반쪽 하트를 붙이고, 양끝 둘은 가운데를 가리키기',
    figs: [
      { x: 80, lean: 6, R: { h: [100, 96], b: 'down' } },
      { x: 182, R: { h: [47, 122], b: 'down' } },
      { x: 288, L: { h: [47, 122], b: 'down' } },
      { x: 390, lean: -6, L: { h: [100, 96], b: 'down' } },
    ],
    fx: [{ t: 'heart', x: 235, y: 108, s: 22 }],
  },
  {
    id: 'p4-03', people: 4, name: '다 같이 점프', mood: 'funny',
    tip: '하나 둘 셋에 맞춰 다 같이 점프, 팔은 자유롭게 위로',
    figs: [
      { x: 85, legs: 'jump', lean: -6, L: A.upWide, R: A.wave },
      { x: 185, legs: 'jump', L: A.up, R: A.up },
      { x: 285, legs: 'jump', L: A.upWide, R: A.upWide },
      { x: 385, legs: 'jump', lean: 6, L: A.wave, R: A.upWide },
    ],
    fx: [],
  },
  {
    id: 'p4-04', people: 4, name: '일렬 어깨동무', mood: 'cool',
    tip: '다 같이 어깨동무하고 양끝 두 명은 바깥 손 흔들기',
    figs: [
      { x: 95, R: { h: [84, 102], b: 'up' }, L: A.wave },
      { x: 185, L: { h: [74, 102], b: 'up' }, R: { h: [74, 102], b: 'up' } },
      { x: 275, L: { h: [74, 102], b: 'up' }, R: { h: [74, 102], b: 'up' } },
      { x: 365, L: { h: [84, 102], b: 'up' }, R: A.wave },
    ],
    fx: [],
  },
  {
    id: 'p4-05', people: 4, name: '두 쌍 큰 하트', mood: 'cute',
    tip: '둘씩 짝을 지어 머리 위로 큰 하트 두 개 만들기',
    figs: [
      { x: 88, R: { h: [48, 36], b: 'up' }, L: A.hip },
      { x: 186, L: { h: [48, 36], b: 'up' }, R: A.hip },
      { x: 284, R: { h: [48, 36], b: 'up' }, L: A.hip },
      { x: 382, L: { h: [48, 36], b: 'up' }, R: A.hip },
    ],
    fx: [{ t: 'heart', x: 137, y: 18, s: 18 }, { t: 'heart', x: 333, y: 18, s: 18 }],
  },
  {
    id: 'p4-06', people: 4, name: '주먹 파이팅', mood: 'cool',
    tip: '주먹 쥔 오른손을 위로 번쩍, 왼손은 허리에 두고 파이팅',
    figs: [
      { x: 85, R: A.fistUp, L: A.hip },
      { x: 185, R: A.fistUp, L: A.hip },
      { x: 285, R: A.fistUp, L: A.hip },
      { x: 385, R: A.fistUp, L: A.hip },
    ],
    fx: [{ t: 'spark', at: [0, 'R'], r: 14, dir: -90 }, { t: 'spark', at: [1, 'R'], r: 14, dir: -90 },
      { t: 'spark', at: [2, 'R'], r: 14, dir: -90 }, { t: 'spark', at: [3, 'R'], r: 14, dir: -90 }],
  },
];

// ---------- 기하 ----------
const PREF = { out: [1, 0], in: [-1, 0], up: [0, -1], down: [0, 1] };

function solveArm(spec) {
  const s = SHOULDER;
  const t = { x: spec.h[0], y: spec.h[1] };
  let dx = t.x - s.x, dy = t.y - s.y;
  let d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const max = UA + FA - 0.5;
  if (d >= max) {
    return { e: { x: s.x + ux * UA, y: s.y + uy * UA }, h: { x: s.x + ux * max, y: s.y + uy * max } };
  }
  d = Math.max(d, Math.abs(UA - FA) + 2);
  const a = Math.acos((UA * UA + d * d - FA * FA) / (2 * UA * d));
  const pref = PREF[spec.b || 'out'];
  let best = null, bestScore = -Infinity;
  for (const ang of [a, -a]) {
    const c = Math.cos(ang), sn = Math.sin(ang);
    const rx = ux * c - uy * sn, ry = ux * sn + uy * c;
    const score = rx * pref[0] + ry * pref[1];
    if (score > bestScore) { bestScore = score; best = { x: s.x + rx * UA, y: s.y + ry * UA }; }
  }
  return { e: best, h: { x: s.x + ux * d, y: s.y + uy * d } };
}

function makeTransform(f) {
  const sc = f.s ?? 1;
  const rad = ((f.lean ?? 0) * Math.PI) / 180;
  const c = Math.cos(rad), sn = Math.sin(rad);
  return (p) => {
    const x = p.x * sc, y = 250 + (p.y - 250) * sc;
    const ry = y - 250;
    return { x: f.x + x * c - ry * sn, y: 250 + x * sn + ry * c };
  };
}

const fmt = (n) => Math.round(n * 10) / 10;
const poly = (pts) => 'M' + pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join(' L');

function buildFigure(f) {
  const legs = f.legs ?? 'stand';
  const shift = SHIFT[legs];
  const sc = f.s ?? 1;
  const T = makeTransform(f);
  const up = (p) => T({ x: p.x, y: p.y + shift });
  const body = [];
  if (legs === 'jump') {
    body.push(`<ellipse cx="${fmt(f.x)}" cy="252" rx="${fmt(34 * sc)}" ry="5" fill="#d9d4cc"/>`);
  }
  for (const side of [-1, 1]) {
    for (const leg of LEGS[legs]) {
      const pts = leg.map(([x, y]) => T({ x: x * side, y }));
      body.push(`<path d="${poly(pts)}" stroke-width="${fmt(18 * sc)}"/>`);
    }
  }
  body.push(`<path d="${poly([up({ x: 0, y: 112 }), up({ x: 0, y: 166 })])}" stroke-width="${fmt(42 * sc)}"/>`);
  const hc = up(HEAD);
  body.push(`<circle cx="${fmt(hc.x)}" cy="${fmt(hc.y)}" r="${fmt(HEAD.r * sc)}" fill="${INK}" stroke="none"/>`);

  const arms = [];
  const hands = {};
  for (const [key, side] of [['L', -1], ['R', 1]]) {
    const spec = f[key] ?? A.down;
    const { e, h } = solveArm(spec);
    const m = (p) => up({ x: p.x * side, y: p.y });
    const pts = [m(SHOULDER), m(e), m(h)];
    hands[key] = pts[2];
    const d = poly(pts);
    arms.push(`<path d="${d}" stroke="${BG}" stroke-width="${fmt(21 * sc)}"/>`);
    arms.push(`<path d="${d}" stroke-width="${fmt(14 * sc)}"/>`);
  }
  return { body, arms, hands };
}

function heart(x, y, s) {
  const k = s / 20;
  return `<path transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)})" fill="${ACCENT}" stroke="none" d="M0 14 C-4 10 -20 0 -20 -9 C-20 -18 -7 -21 0 -12 C7 -21 20 -18 20 -9 C20 0 4 10 0 14Z"/>`;
}
function spark(x, y, r, dir) {
  const out = [];
  for (const off of [-35, 0, 35]) {
    const a = ((dir + off) * Math.PI) / 180;
    const p1 = { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r };
    const p2 = { x: x + Math.cos(a) * (r + 12), y: y + Math.sin(a) * (r + 12) };
    out.push(`<path d="${poly([p1, p2])}" stroke="${ACCENT}" stroke-width="5"/>`);
  }
  return out.join('');
}
function vSign(p) {
  return `<path d="M${fmt(p.x - 7)} ${fmt(p.y - 20)} L${fmt(p.x)} ${fmt(p.y - 2)} L${fmt(p.x + 7)} ${fmt(p.y - 20)}" stroke="${ACCENT}" stroke-width="5" fill="none"/>`;
}

function buildSvg(pose) {
  const n = pose.figs.length;
  const W = n === 2 ? 320 : n === 3 ? 400 : 470;
  const figs = pose.figs.map(buildFigure);
  const fx = (pose.fx ?? []).map((e) => {
    const at = e.at ? figs[e.at[0]].hands[e.at[1]] : { x: e.x, y: e.y };
    if (e.t === 'heart') return heart(at.x, at.y, e.s ?? 16);
    if (e.t === 'spark') return spark(at.x, at.y, e.r ?? 20, e.dir ?? -90);
    if (e.t === 'v') return vSign(at);
    return '';
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${pose.name}">
<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
${figs.flatMap((f) => f.body).join('\n')}
${figs.flatMap((f) => f.arms).join('\n')}
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
