// scripts/verify_security_remediation.js
const { execSync } = require('child_process');
const path = require('path');

console.log('============================================================');
console.log('🛡️  TUTORONLINE.PK MASTER SECURITY REGRESSION VERIFICATION');
console.log('============================================================\n');

const testSuites = [
  { name: 'Phase 1: API & Rate Limiting Defense', script: 'test_phase1_security.js' },
  { name: 'Phase 2: Database RLS & PII Scoping', script: 'test_phase2_security.js' },
  { name: 'Phase 3: Middleware, Auth & Headers', script: 'test_phase3_security.js' },
];

let allPassed = true;

for (const suite of testSuites) {
  console.log(`▶ Running ${suite.name}...`);
  try {
    const scriptPath = path.join(__dirname, suite.script);
    const output = execSync(`node "${scriptPath}"`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    console.log(output.trim());
    console.log(`------------------------------------------------------------\n`);
  } catch (err) {
    console.error(`❌ Suite failed: ${suite.name}`);
    console.error(err.stdout || err.message);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('============================================================');
  console.log('🎉 ALL SECURITY TEST SUITES PASSED WITH ZERO FAILURES!');
  console.log('============================================================');
} else {
  console.error('⚠️  SOME SECURITY TESTS FAILED. PLEASE REVIEW LOGS.');
  process.exit(1);
}
