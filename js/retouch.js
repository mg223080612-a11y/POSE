// retouch.js — AI 보정 (피부 매끈하게 · 얼굴형 갸름하게)
// 얼굴 찾기는 MediaPipe Face Landmarker가 휴대폰 브라우저 안에서 한다.
// 사진은 서버로 나가지 않는다. (모델 파일만 처음 한 번 내려받는다)

const VISION_VER = '0.10.14';
const VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VER}`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// 얼굴 윤곽·눈·눈썹·입술 (MediaPipe 468점 번호)
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
  148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const LEFT_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
// 턱선 (볼 → 턱 끝 직전), 숫자는 당기는 세기
const JAW = [
  [93, 0.4], [132, 0.7], [58, 1], [172, 1], [136, 0.9], [150, 0.6], [149, 0.4],
  [323, 0.4], [361, 0.7], [288, 1], [397, 1], [365, 0.9], [379, 0.6], [378, 0.4],
];
const NOSE_TIP = 1;

let landmarkerPromise = null;

/** 모델을 미리 받아 둔다. 실패하면 null. 여러 번 불러도 한 번만 받는다. */
export function loadRetouch() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, FaceLandmarker } = await import(/* @vite-ignore */ `${VISION_URL}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${VISION_URL}/wasm`);
      const make = (delegate) =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'IMAGE',
          numFaces: 6,
        });
      try {
        return await make('GPU');
      } catch {
        return await make('CPU');
      }
    })().catch((e) => {
      console.warn('AI 보정 모델을 불러오지 못했어요:', e);
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

/**
 * 컷 한 장을 보정한 새 canvas와 찾은 얼굴 수를 돌려준다.
 * @param {HTMLCanvasElement} src
 */
export async function retouchFrame(src, { skin = 0.85, slim = 1 } = {}) {
  const lm = await loadRetouch();
  const W = src.width, H = src.height;
  const faces = (lm.detect(src).faceLandmarks ?? []).map((pts) => pts.map((p) => ({ x: p.x * W, y: p.y * H })));

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const g = out.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  if (!faces.length) return { canvas: out, faces: 0 };

  let img = g.getImageData(0, 0, W, H);
  if (skin > 0) img = smoothSkin(img, faces, skin);
  if (slim > 0) img = slimFaces(img, faces, slim);
  g.putImageData(img, 0, 0);
  return { canvas: out, faces: faces.length };
}

// ---------- 피부: 얼굴 안쪽만, 경계(눈·코·입 윤곽)는 살리고 잡티만 흐리게 ----------
function smoothSkin(img, faces, strength) {
  const { width: W, height: H, data } = img;
  const mask = skinMask(W, H, faces);
  const faceW = Math.max(...faces.map(faceWidth));
  const r = Math.max(2, Math.round(faceW * 0.03));
  const blur = boxBlurRGB(data, W, H, r);
  const out = new ImageData(new Uint8ClampedArray(data), W, H);
  const o = out.data;
  const sigma2 = 2 * 20 * 20;
  for (let i = 0, p = 0; p < W * H; p++, i += 4) {
    const m = mask[p];
    if (m <= 0.01) continue;
    const dr = blur[p * 3] - data[i], dg = blur[p * 3 + 1] - data[i + 1], db = blur[p * 3 + 2] - data[i + 2];
    const d = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
    const w = m * strength * Math.exp(-(d * d) / sigma2);
    const lift = m * 7 * strength; // 살짝 밝고 화사하게
    o[i] = data[i] + dr * w + lift;
    o[i + 1] = data[i + 1] + dg * w + lift;
    o[i + 2] = data[i + 2] + db * w + lift * 0.8;
  }
  return out;
}

function skinMask(W, H, faces) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  const poly = (pts, idx) => {
    g.beginPath();
    idx.forEach((k, j) => (j ? g.lineTo(pts[k].x, pts[k].y) : g.moveTo(pts[k].x, pts[k].y)));
    g.closePath();
  };
  g.lineJoin = 'round';
  for (const pts of faces) {
    const fw = faceWidth(pts);
    g.fillStyle = '#fff';
    poly(pts, FACE_OVAL);
    g.fill();
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    g.lineWidth = fw * 0.05;
    for (const part of [LEFT_EYE, RIGHT_EYE, LEFT_BROW, RIGHT_BROW, LIPS]) {
      poly(pts, part);
      g.fill();
      g.stroke();
    }
  }
  const px = g.getImageData(0, 0, W, H).data;
  let a = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) a[p] = px[p * 4] / 255;
  const faceW = Math.max(...faces.map(faceWidth));
  a = boxBlur1(a, W, H, Math.max(2, Math.round(faceW * 0.05)));
  return a;
}

// ---------- 얼굴형: 턱선을 코끝 쪽으로 살짝 당겨 갸름하게 ----------
function slimFaces(img, faces, strength) {
  const { width: W, height: H, data } = img;
  const pulls = [];
  for (const pts of faces) {
    const fw = faceWidth(pts);
    const nose = pts[NOSE_TIP];
    for (const [k, wgt] of JAW) {
      const c = pts[k];
      let dx = nose.x - c.x, dy = nose.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const amt = fw * 0.036 * wgt * strength;
      pulls.push({ cx: c.x, cy: c.y, mx: dx * amt, my: dy * amt, r: fw * 0.2 });
    }
  }
  // 영향을 받는 영역만 계산
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const p of pulls) {
    x0 = Math.min(x0, p.cx - p.r); y0 = Math.min(y0, p.cy - p.r);
    x1 = Math.max(x1, p.cx + p.r); y1 = Math.max(y1, p.cy + p.r);
  }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(H - 1, Math.ceil(y1));

  const out = new ImageData(new Uint8ClampedArray(data), W, H);
  const o = out.data;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let sx = 0, sy = 0, hit = false;
      for (const p of pulls) {
        const ddx = x - p.cx, ddy = y - p.cy;
        const d2 = ddx * ddx + ddy * ddy;
        const r2 = p.r * p.r;
        if (d2 >= r2) continue;
        const m2 = p.mx * p.mx + p.my * p.my;
        const f = (r2 - d2) / (r2 - d2 + m2);
        const k = f * f * (1 - d2 / r2); // 가장자리는 부드럽게 0으로
        sx += k * p.mx;
        sy += k * p.my;
        hit = true;
      }
      if (!hit) continue;
      sample(data, W, H, x - sx, y - sy, o, (y * W + x) * 4);
    }
  }
  return out;
}

function sample(d, W, H, fx, fy, o, oi) {
  fx = Math.min(W - 1.001, Math.max(0, fx));
  fy = Math.min(H - 1.001, Math.max(0, fy));
  const x = fx | 0, y = fy | 0, ax = fx - x, ay = fy - y;
  const i00 = (y * W + x) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
  for (let c = 0; c < 3; c++) {
    const top = d[i00 + c] * (1 - ax) + d[i10 + c] * ax;
    const bot = d[i01 + c] * (1 - ax) + d[i11 + c] * ax;
    o[oi + c] = top * (1 - ay) + bot * ay;
  }
}

function faceWidth(pts) {
  return Math.hypot(pts[454].x - pts[234].x, pts[454].y - pts[234].y);
}

// ---------- 빠른 박스 블러 (3번 겹치면 가우시안에 가깝다) ----------
function boxBlurRGB(rgba, W, H, r) {
  const n = W * H;
  const out = new Float32Array(n * 3);
  const ch = new Float32Array(n);
  for (let c = 0; c < 3; c++) {
    for (let p = 0; p < n; p++) ch[p] = rgba[p * 4 + c];
    const b = boxBlur1(ch, W, H, r);
    for (let p = 0; p < n; p++) out[p * 3 + c] = b[p];
  }
  return out;
}

function boxBlur1(src, W, H, r) {
  let a = Float32Array.from(src);
  let b = new Float32Array(a.length);
  for (let pass = 0; pass < 3; pass++) {
    blurH(a, b, W, H, r);
    blurV(b, a, W, H, r);
  }
  return a;
}

function blurH(s, t, W, H, r) {
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    let acc = s[row] * (r + 1);
    for (let k = 1; k <= r; k++) acc += s[row + Math.min(k, W - 1)];
    for (let x = 0; x < W; x++) {
      t[row + x] = acc * inv;
      acc += s[row + Math.min(x + r + 1, W - 1)] - s[row + Math.max(x - r, 0)];
    }
  }
}

function blurV(s, t, W, H, r) {
  const inv = 1 / (2 * r + 1);
  for (let x = 0; x < W; x++) {
    let acc = s[x] * (r + 1);
    for (let k = 1; k <= r; k++) acc += s[Math.min(k, H - 1) * W + x];
    for (let y = 0; y < H; y++) {
      t[y * W + x] = acc * inv;
      acc += s[Math.min(y + r + 1, H - 1) * W + x] - s[Math.max(y - r, 0) * W + x];
    }
  }
}
