// picker.js — 포즈 뽑기 (F1 인원 필터 · F2 세션 안 중복 0 · F9 최근 2세션 후순위)
// 브라우저와 Node(자동 검사) 양쪽에서 쓰도록 DOM에 의존하지 않는다.

/** 인원에 맞는 포즈만 고른다. 4는 '4인 이상'. */
export function posesFor(poses, people) {
  return poses.filter((p) => p.people === people);
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 한 세션에 쓸 포즈 count개를 겹치지 않게 뽑는다.
 * 최근 세션에 나온 포즈(recentIds)는 남은 포즈가 모자랄 때만 뒤에서 채운다.
 */
export function pickSession(poses, people, { count = 4, recentIds = [], rng = Math.random } = {}) {
  const pool = posesFor(poses, people);
  if (pool.length < count) {
    throw new Error(`${people}인 포즈가 ${pool.length}개뿐이라 ${count}컷을 채울 수 없어요`);
  }
  const recent = new Set(recentIds);
  const fresh = shuffle(pool.filter((p) => !recent.has(p.id)), rng);
  const old = shuffle(pool.filter((p) => recent.has(p.id)), rng);
  return fresh.concat(old).slice(0, count);
}

// ---- 최근 포즈 기록 (localStorage, 사진은 저장하지 않음) ----
const RECENT_KEY = 'nextpose.recent';
const RECENT_SESSIONS = 2;

export function loadRecent(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function recentIds(storage) {
  return loadRecent(storage).flat();
}

export function saveRecent(ids, storage = globalThis.localStorage) {
  try {
    const next = [ids, ...loadRecent(storage)].slice(0, RECENT_SESSIONS);
    storage?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패해도 촬영은 계속 */
  }
}

export function clearRecent(storage = globalThis.localStorage) {
  try { storage?.removeItem(RECENT_KEY); } catch { /* 무시 */ }
}
