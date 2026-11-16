// print.js — 4×6 인쇄 화면 (F5). CSS @page 100mm×148mm, 여백 0.

/** 합성 이미지를 인쇄 영역에 넣고 휴대폰 인쇄 화면을 띄운다. */
export function printSheet(url, copies = 1) {
  const area = document.getElementById('print-area');
  area.innerHTML = '';
  const loads = [];
  for (let i = 0; i < copies; i++) {
    const img = new Image();
    img.src = url;
    img.alt = 'MOMENT 4컷 사진';
    area.appendChild(img);
    loads.push(img.decode().catch(() => {}));
  }
  return Promise.all(loads).then(
    () =>
      new Promise((resolve) => {
        const done = () => {
          window.removeEventListener('afterprint', done);
          resolve();
        };
        window.addEventListener('afterprint', done);
        window.print();
        // 사파리는 afterprint가 늦거나 없을 수 있어 print() 반환을 끝으로 본다
        setTimeout(done, 500);
      })
  );
}

export function clearPrintArea() {
  document.getElementById('print-area').innerHTML = '';
}
