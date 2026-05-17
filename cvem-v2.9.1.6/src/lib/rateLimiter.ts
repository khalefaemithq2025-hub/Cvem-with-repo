const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60_000;
const LOCKOUT_MS = 5 * 60_000;

interface RateLimitData {
  attempts: number[];
  lockedUntil: number | null;
}

function getData(key: string): RateLimitData {
  try {
    return JSON.parse(localStorage.getItem(key) || '{"attempts":[],"lockedUntil":null}');
  } catch {
    return { attempts: [], lockedUntil: null };
  }
}

export function checkRateLimit(key: string): { blocked: boolean; remainingSeconds?: number } {
  const data = getData(key);
  const now = Date.now();
  if (data.lockedUntil && now < data.lockedUntil) {
    return { blocked: true, remainingSeconds: Math.ceil((data.lockedUntil - now) / 1000) };
  }
  return { blocked: false };
}

export function recordFailedAttempt(key: string): { blocked: boolean; remainingSeconds?: number } {
  const data = getData(key);
  const now = Date.now();
  if (data.lockedUntil && now >= data.lockedUntil) {
    data.lockedUntil = null;
    data.attempts = [];
  }
  data.attempts = (data.attempts || []).filter((t: number) => now - t < WINDOW_MS);
  data.attempts.push(now);
  if (data.attempts.length >= MAX_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_MS;
    data.attempts = [];
    localStorage.setItem(key, JSON.stringify(data));
    return { blocked: true, remainingSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }
  localStorage.setItem(key, JSON.stringify(data));
  return { blocked: false };
}

export function clearRateLimit(key: string): void {
  localStorage.removeItem(key);
}
