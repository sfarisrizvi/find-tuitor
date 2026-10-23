// scripts/test_phase1_security.js
const { rateLimiter } = require('../src/lib/security/rateLimiter');

async function testRateLimiter() {
  console.log('🧪 Testing Rate Limiter IP parsing & limits...');
  
  // Test 1: Spoofed comma-separated X-Forwarded-For header
  const fakeReq1 = {
    headers: new Map([
      ['x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178']
    ])
  };
  fakeReq1.headers.get = (h) => fakeReq1.headers.get(h.toLowerCase());

  // Test 2: Standard call
  const fakeReq2 = {
    headers: {
      get: (h) => (h === 'x-forwarded-for' ? '198.51.100.1, 10.0.0.1' : null)
    }
  };

  // Consume tokens for IP 198.51.100.1
  const limit = 3;
  let blocked = false;
  for (let i = 0; i < 5; i++) {
    const res = rateLimiter(fakeReq2, { limit, windowSeconds: 60, keyPrefix: 'test_unit' });
    if (!res.success) {
      blocked = true;
      console.log(`  - Call ${i + 1}: Rate limited as expected (Retry-After: ${res.retryAfter}s)`);
    } else {
      console.log(`  - Call ${i + 1}: Token consumed (Remaining: ${res.remaining})`);
    }
  }

  if (!blocked) {
    throw new Error('Rate limiter failed to block excessive requests!');
  }
  console.log('✅ Rate Limiter test passed!');
}

async function main() {
  try {
    await testRateLimiter();
    console.log('\n🎉 Phase 1 unit verification complete!');
  } catch (err) {
    console.error('❌ Phase 1 test failed:', err);
    process.exit(1);
  }
}

main();
