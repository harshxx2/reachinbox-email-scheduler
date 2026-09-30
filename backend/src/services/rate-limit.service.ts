import { redis } from '../config/redis';

const MIN_SEND_KEY = 'throttle:global:last-send';
const MIN_SEND_LOCK_KEY = 'throttle:global:slot-lock';

const reserveHourlySlotScript = `
local current = redis.call('GET', KEYS[1])
local limit = tonumber(ARGV[1])
if current and tonumber(current) >= limit then
  return 0
end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
return 1
`;

export async function reserveHourlySlot(senderId: string, hourlyLimit: number, now = new Date()) {
  const hourKey = now.toISOString().slice(0, 13).replace('T', '');
  const key = `rate:sender:${senderId}:${hourKey}`;
  const reserved = await redis.eval(reserveHourlySlotScript, 1, key, hourlyLimit, 3700);
  return Number(reserved) === 1;
}

export async function waitForGlobalSpacing(minimumDelayMs: number) {
  const key = MIN_SEND_KEY;
  const lockKey = MIN_SEND_LOCK_KEY;

  while (true) {
    const now = Date.now();
    const last = Number(await redis.get(key) ?? '0');
    const nextAllowed = last + minimumDelayMs;

    if (nextAllowed <= now) {
      const acquired = await redis.set(lockKey, String(now), 'PX', Math.max(minimumDelayMs, 1000), 'NX');
      if (acquired) {
        const confirmLast = Number(await redis.get(key) ?? '0');
        const confirmNow = Date.now();
        if (confirmLast + minimumDelayMs <= confirmNow) {
          await redis.set(key, String(confirmNow));
          await redis.del(lockKey);
          return;
        }
        await redis.del(lockKey);
      }
    }

    const waitMs = Math.max(100, nextAllowed - now);
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 1000)));
  }
}

export function nextUtcHourTimestamp(now = new Date()) {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next.getTime();
}
