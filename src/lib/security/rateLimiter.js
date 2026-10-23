// src/lib/security/rateLimiter.js

const rateCache = new Map();
const MAX_CACHE_ENTRIES = 10000;
let lastSweepTime = Date.now();

/**
 * Extracts and sanitizes client IP from request headers.
 * Safely parses multi-proxy X-Forwarded-For chains to prevent spoofing.
 */
function getClientIp(req) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      const candidate = forwarded.split(',')[0].trim();
      if (/^[0-9a-fA-F:.]+$/.test(candidate)) {
        return candidate;
      }
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp && /^[0-9a-fA-F:.]+$/.test(realIp.trim())) {
      return realIp.trim();
    }
  } catch (err) {
    // Fallback on any unexpected header format
  }
  return '127.0.0.1';
}

/**
 * Periodically prunes expired rate limit records to prevent memory leaks (OOM DoS).
 */
function pruneExpiredEntries(now) {
  // Run sweep at most once every 60 seconds
  if (now - lastSweepTime < 60000 && rateCache.size < MAX_CACHE_ENTRIES) {
    return;
  }
  lastSweepTime = now;

  for (const [key, record] of rateCache.entries()) {
    // If no activity in 10 minutes, remove from memory
    if (now - record.lastRefilled > 600000) {
      rateCache.delete(key);
    }
  }

  // Safety valve: If still over capacity (e.g. distributed bot attack), evict oldest entries
  if (rateCache.size > MAX_CACHE_ENTRIES) {
    const excess = rateCache.size - MAX_CACHE_ENTRIES;
    let evicted = 0;
    for (const key of rateCache.keys()) {
      rateCache.delete(key);
      evicted++;
      if (evicted >= excess) break;
    }
  }
}

/**
 * Token Bucket algorithm implementation (In-Memory per instance)
 */
export function rateLimiter(req, { limit = 10, windowSeconds = 60, keyPrefix = 'global' } = {}) {
  const now = Date.now();
  pruneExpiredEntries(now);

  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const windowMs = windowSeconds * 1000;

  const currentStatus = rateCache.get(key) || { tokens: limit, lastRefilled: now };

  // Refill tokens based on time elapsed
  const timePassed = now - currentStatus.lastRefilled;
  const tokensToAdd = Math.floor(timePassed / (windowMs / limit));
  
  if (tokensToAdd > 0) {
    currentStatus.tokens = Math.min(limit, currentStatus.tokens + tokensToAdd);
    currentStatus.lastRefilled = now;
  }

  // Consume a token if available
  if (currentStatus.tokens > 0) {
    currentStatus.tokens -= 1;
    rateCache.set(key, currentStatus);
    
    return {
      success: true,
      limit,
      remaining: currentStatus.tokens,
      retryAfter: 0,
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((windowMs - timePassed) / 1000);
  
  return {
    success: false,
    limit,
    remaining: 0,
    retryAfter: Math.max(1, retryAfter),
  };
}

export function buildRateLimitHeaders(rateResult) {
  return {
    'X-RateLimit-Limit': rateResult.limit.toString(),
    'X-RateLimit-Remaining': rateResult.remaining.toString(),
    'Retry-After': rateResult.retryAfter.toString(),
  };
}
