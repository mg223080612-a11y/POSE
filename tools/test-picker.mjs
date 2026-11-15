// F1·F2 자동 검사. 실행: node tools/test-picker.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickSession } from '../js/picker.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const poses = JSON.parse(readFileSync(join(ROOT, 'data', 'poses.json'), 'utf8'));
let fail = 0;

// F1: 3인을 고르고 100번 뽑아도 3인 포즈만 나온다 (모든 인원에 대해 검사)
for (const people of [2, 3, 4]) {
  let wrong = 0;
  for (let i = 0; i < 100; i++) wrong += pickSession(poses, people).filter((p) => p.people !== people).length;
  console.log(`F1 ${people}인 100회: 다른 인원 포즈 ${wrong}건 ${wrong === 0 ? 'OK' : 'FAIL'}`);
  if (wrong) fail++;
}

// F2: 1,000세션에서 한 세션 안 같은 포즈 0건 (최근 기록을 쌓아 가며)
for (const people of [2, 3, 4]) {
  let dup = 0;
  const history = [];
  for (let i = 0; i < 1000; i++) {
    const ids = pickSession(poses, people, { recentIds: history.slice(0, 2).flat() }).map((p) => p.id);
    if (new Set(ids).size !== ids.length) dup++;
    history.unshift(ids);
  }
  console.log(`F2 ${people}인 1,000세션: 세션 안 중복 ${dup}건 ${dup === 0 ? 'OK' : 'FAIL'}`);
  if (dup) fail++;
}

process.exit(fail ? 1 : 0);
