// camera.js — 전면 카메라 · 카운트다운 · 촬영 (F3)

export const CELL_W = 540;
export const CELL_H = 378; // 10:7, compose.js의 컷 칸과 같은 비율

let stream = null;

/** 전면 카메라를 켠다. 실패하면 false (카메라 없이 테스트 모드로 진행). */
export async function startCamera(video) {
  if (stream) {
    video.srcObject = stream;
    await video.play().catch(() => {});
    return true;
  }
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play().catch(() => {});
    return true;
  } catch (err) {
    console.warn('카메라를 켤 수 없어요:', err);
    return false;
  }
}

export function hasCamera() {
  return !!stream;
}

/** 카운트다운. 매초 onTick(남은 초)를 부르고, 0이 되면 끝난다. */
export function countdown(seconds, onTick, signal) {
  return new Promise((resolve, reject) => {
    let left = seconds;
    onTick(left);
    const id = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(id);
        reject(new DOMException('취소', 'AbortError'));
        return;
      }
      left -= 1;
      onTick(left);
      if (left <= 0) {
        clearInterval(id);
        resolve();
      }
    }, 1000);
  });
}

/** 지금 화면을 컷 크기(가운데 맞춰 자르기)로 찍는다. 미리보기처럼 좌우 반전. */
export function captureFrame(video, cutIndex) {
  const c = document.createElement('canvas');
  c.width = CELL_W;
  c.height = CELL_H;
  const g = c.getContext('2d');
  const vw = video.videoWidth, vh = video.videoHeight;
  if (stream && vw && vh) {
    const target = CELL_W / CELL_H;
    let sw = vw, sh = vh;
    if (vw / vh > target) sw = vh * target; else sh = vw / target;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    g.translate(CELL_W, 0);
    g.scale(-1, 1);
    g.drawImage(video, sx, sy, sw, sh, 0, 0, CELL_W, CELL_H);
  } else {
    drawPlaceholder(g, cutIndex);
  }
  return c;
}

// 카메라가 없을 때(노트북 테스트 등) 대신 쓰는 그림
function drawPlaceholder(g, i) {
  const hues = [352, 205, 145, 40];
  const grad = g.createLinearGradient(0, 0, CELL_W, CELL_H);
  grad.addColorStop(0, `hsl(${hues[i % 4]} 70% 82%)`);
  grad.addColorStop(1, `hsl(${(hues[i % 4] + 40) % 360} 70% 70%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, CELL_W, CELL_H);
  g.fillStyle = 'rgba(0,0,0,.55)';
  g.font = '700 64px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(`컷 ${i + 1}`, CELL_W / 2, CELL_H / 2 - 20);
  g.font = '500 26px system-ui, sans-serif';
  g.fillText('카메라 없이 테스트 중', CELL_W / 2, CELL_H / 2 + 40);
}
