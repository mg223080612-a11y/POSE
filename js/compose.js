// compose.js — 4컷을 1200×1800(4×6인치, 300dpi) 한 장으로 합성 (F4)
// 같은 2×6 스트립을 왼쪽·오른쪽에 두 줄 그려서, 가운데를 자르면 두 장이 된다.
import { CELL_W, CELL_H } from './camera.js';

export const SHEET_W = 1200;
export const SHEET_H = 1800;
const STRIP_W = 600;
const PAD = 30;
const GAP = 16;

export function composeSheet(frames, { date = new Date() } = {}) {
  const c = document.createElement('canvas');
  c.width = SHEET_W;
  c.height = SHEET_H;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, SHEET_W, SHEET_H);

  for (let s = 0; s < 2; s++) drawStrip(g, s * STRIP_W, frames, date);

  // 가운데 자르는 선 (아주 옅게)
  g.strokeStyle = '#e4e0da';
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
  g.fillStyle = '#fbf8f3';
  g.fillRect(ox, 0, STRIP_W, SHEET_H);
  frames.forEach((f, i) => {
    const y = PAD + i * (CELL_H + GAP);
    g.drawImage(f, ox + PAD, y, CELL_W, CELL_H);
  });
  const footTop = PAD + 4 * CELL_H + 3 * GAP;
  const cx = ox + STRIP_W / 2;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#2b2824';
  g.font = '800 64px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
  g.fillText('다음포즈', cx, footTop + 88);
  g.fillStyle = '#ff5a5f';
  g.beginPath();
  g.arc(cx + 150, footTop + 68, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#8a837a';
  g.font = '500 28px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
  const d = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  g.fillText(d, cx, footTop + 150);
}

export function sheetToBlobUrl(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/jpeg', 0.95);
  });
}
