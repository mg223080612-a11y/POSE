// compose.js — 4컷을 1200×1800(4×6인치, 300dpi) 한 장으로 합성 (F4)
// 같은 2×6 스트립을 왼쪽·오른쪽에 두 줄 그려서, 가운데를 자르면 두 장이 된다.
import { CELL_W, CELL_H } from './camera.js';

export const SHEET_W = 1200;
export const SHEET_H = 1800;
const STRIP_W = 600;
const PAD = 30;
const GAP = 16;
const KHAKI = '#545a3c';
const CREAM = '#f2f1ea';
const LATIN = '"Outfit", "Pretendard Variable", "Pretendard", system-ui, sans-serif';

export function composeSheet(frames, { date = new Date() } = {}) {
  const c = document.createElement('canvas');
  c.width = SHEET_W;
  c.height = SHEET_H;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, SHEET_W, SHEET_H);

  for (let s = 0; s < 2; s++) drawStrip(g, s * STRIP_W, frames, date);

  // 가운데 자르는 선 (아주 옅게)
  g.strokeStyle = 'rgba(242,241,234,.3)';
  g.lineWidth = 2;
  g.setLineDash([12, 12]);
  g.beginPath();
  g.moveTo(STRIP_W, 0);
  g.lineTo(STRIP_W, SHEET_H);
  g.stroke();
  g.setLineDash([]);
  return c;
}

function drawStrip(g, ox, frames, date) {
  g.fillStyle = KHAKI;
  g.fillRect(ox, 0, STRIP_W, SHEET_H);
  frames.forEach((f, i) => {
    const y = PAD + i * (CELL_H + GAP);
    g.drawImage(f, ox + PAD, y, CELL_W, CELL_H);
  });
  const footTop = PAD + 4 * CELL_H + 3 * GAP;
  const cx = ox + STRIP_W / 2;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = CREAM;
  g.font = `500 58px ${LATIN}`;
  drawSpaced(g, 'MOMENT', cx, footTop + 92, 14);
  g.fillStyle = 'rgba(242,241,234,.35)';
  g.fillRect(cx - 28, footTop + 138, 56, 2);
  g.fillStyle = 'rgba(242,241,234,.75)';
  g.font = `300 26px ${LATIN}`;
  const d = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  drawSpaced(g, d, cx, footTop + 176, 4);
}

// 글자 사이 간격을 넓혀 가운데 정렬로 쓴다 (canvas letterSpacing을 못 쓰는 브라우저용)
function drawSpaced(g, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  const align = g.textAlign;
  g.textAlign = 'left';
  chars.forEach((ch, i) => {
    g.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  g.textAlign = align;
}

/** 인화지에 쓸 글꼴을 미리 불러 둔다 (없으면 기본 글꼴로 그린다). */
export function loadSheetFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load(`500 58px ${LATIN}`),
    document.fonts.load(`300 26px ${LATIN}`),
  ]).catch(() => {});
}

export function sheetToBlobUrl(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/jpeg', 0.95);
  });
}
