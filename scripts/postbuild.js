const fs = require('fs');
const path = require('path');

const nextProjectRoot = process.cwd();
const standaloneDir = path.join(nextProjectRoot, '.next', 'standalone');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(standaloneDir)) {
  console.log('Preparing Hostinger standalone assets for main website...');
  
  // Copy public folder
  const publicSrc = path.join(nextProjectRoot, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    console.log(`Copying public folder to ${publicDest}...`);
    copyDirSync(publicSrc, publicDest);
  }
  
  // Copy .next/static folder to .next/static
  const staticSrc = path.join(nextProjectRoot, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${staticDest}...`);
    copyDirSync(staticSrc, staticDest);
  }
  
  // Copy .next/static to _next/static for static server compatibility
  const underscoreNextDest = path.join(standaloneDir, '_next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${underscoreNextDest}...`);
    copyDirSync(staticSrc, underscoreNextDest);
  }
  
  // Copy .next/static to public/_next/static for Hostinger Document Root compatibility
  const publicUnderscoreNextDest = path.join(publicDest, '_next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${publicUnderscoreNextDest}...`);
    copyDirSync(staticSrc, publicUnderscoreNextDest);
  }
  
  // Copy env files if they exist
  const envSrc = path.join(nextProjectRoot, '.env');
  const envDest = path.join(standaloneDir, '.env');
  if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, envDest);
  }
  
  const envLocalSrc = path.join(nextProjectRoot, '.env.local');
  const envLocalDest = path.join(standaloneDir, '.env.local');
  if (fs.existsSync(envLocalSrc)) {
    fs.copyFileSync(envLocalSrc, envLocalDest);
  }
  
  console.log('Main website postbuild static asset copy completed successfully.');
} else {
  console.log('Could not find server.js inside .next/standalone. Ensure output: "standalone" is set in next.config.mjs');
}
