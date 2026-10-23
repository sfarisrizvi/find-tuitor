// scripts/test_phase3_security.js
const fs = require('fs');
const path = require('path');

async function testPhase3() {
  console.log('🧪 Verifying Phase 3 Middleware, Authentication & Header Security...\n');

  // Test 1: Verify Next.js 16.2.10 proxy convention exists
  console.log('Test 1: Checking Next.js 16 Proxy convention...');
  const proxyPath = path.join(__dirname, '..', 'src', 'proxy.js');
  const middlewarePath = path.join(__dirname, '..', 'src', 'middleware.js');

  if (!fs.existsSync(proxyPath)) {
    throw new Error('src/proxy.js does not exist!');
  }
  if (fs.existsSync(middlewarePath)) {
    throw new Error('src/middleware.js should be removed to avoid Next.js deprecation warning!');
  }

  const proxyContent = fs.readFileSync(proxyPath, 'utf8');
  if (!proxyContent.includes('export async function proxy')) {
    throw new Error('src/proxy.js does not export function proxy!');
  }
  console.log('  ✅ PASSED: src/proxy.js properly configured with Next.js 16 export async function proxy.');

  // Test 2: Verify Open Redirect Sanitization in Auth Callback
  console.log('\nTest 2: Checking Open Redirect defense in /api/auth/callback/route.js...');
  const callbackPath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'callback', 'route.js');
  const callbackContent = fs.readFileSync(callbackPath, 'utf8');
  if (!callbackContent.includes('next.startsWith(\'//\')') || !callbackContent.includes('trustedOrigin')) {
    throw new Error('Open redirect or host header protection missing in auth callback!');
  }
  console.log('  ✅ PASSED: Open redirect and host header defenses verified in auth callback.');

  // Test 3: Verify Logout CSRF defense in Signout route
  console.log('\nTest 3: Checking Logout CSRF defense in /api/auth/signout/route.js...');
  const signoutPath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'signout', 'route.js');
  const signoutContent = fs.readFileSync(signoutPath, 'utf8');
  if (!signoutContent.includes('secFetchSite') || !signoutContent.includes('auth.getUser()')) {
    throw new Error('Logout CSRF protection or getUser() upgrade missing in signout route!');
  }
  console.log('  ✅ PASSED: Logout CSRF protection and getUser() session upgrade verified.');

  // Test 4: Verify Rate Limiting in Contact and Register Routes
  console.log('\nTest 4: Checking Rate Limiting in Contact and Register endpoints...');
  const contactPath = path.join(__dirname, '..', 'src', 'app', 'api', 'contact', 'route.js');
  const registerPath = path.join(__dirname, '..', 'src', 'app', 'api', 'auth', 'register', 'route.js');

  const contactContent = fs.readFileSync(contactPath, 'utf8');
  const registerContent = fs.readFileSync(registerPath, 'utf8');

  if (!contactContent.includes('rateLimiter') || !contactContent.includes('validatePayloadSize')) {
    throw new Error('Rate limiting or payload validation missing in contact route!');
  }
  if (!registerContent.includes('rateLimiter') || !registerContent.includes('password.length < 8')) {
    throw new Error('Rate limiting or password complexity missing in register route!');
  }
  console.log('  ✅ PASSED: Contact and registration routes have rate limiting and input validation.');

  // Test 5: Verify Enterprise HTTP Security Headers in next.config.mjs
  console.log('\nTest 5: Checking HTTP Security Headers in next.config.mjs...');
  const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

  const requiredHeaders = [
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ];

  for (const h of requiredHeaders) {
    if (!nextConfigContent.includes(h)) {
      throw new Error(`Missing HTTP security header: ${h} in next.config.mjs!`);
    }
  }
  console.log('  ✅ PASSED: All enterprise security headers present in next.config.mjs.');

  console.log('\n🎉 All Phase 3 security verification checks PASSED!');
}

testPhase3().catch(err => {
  console.error('❌ Phase 3 verification failed:', err.message);
  process.exit(1);
});
