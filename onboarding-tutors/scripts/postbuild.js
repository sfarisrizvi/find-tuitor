const fs = require('fs');
const path = require('path');

// Determine the root of the next project (the current directory when running npm run build)
const nextProjectRoot = process.cwd();

// The path to the standalone directory where Next.js placed the output
const standaloneDir = path.join(nextProjectRoot, '.next', 'standalone');

// Function to recursively copy a directory
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

// Search for the server.js file inside the standalone directory
function findServerJsDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = findServerJsDir(fullPath);
      if (result) return result;
    } else if (entry.name === 'server.js') {
      return dir;
    }
  }
  return null;
}

const targetDir = findServerJsDir(standaloneDir);

if (targetDir) {
  console.log(`Found server.js at: ${targetDir}`);
  
  // Copy public folder
  const publicSrc = path.join(nextProjectRoot, 'public');
  const publicDest = path.join(targetDir, 'public');
  if (fs.existsSync(publicSrc)) {
    console.log(`Copying public folder to ${publicDest}...`);
    copyDirSync(publicSrc, publicDest);
  }

  // Copy .next/static folder
  const staticSrc = path.join(nextProjectRoot, '.next', 'static');
  const staticDest = path.join(targetDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${staticDest}...`);
    copyDirSync(staticSrc, staticDest);
  }
  
  // Also copy .env if it exists
  const envSrc = path.join(nextProjectRoot, '.env');
  const envDest = path.join(targetDir, '.env');
  if (fs.existsSync(envSrc)) {
    console.log(`Copying .env file to ${envDest}...`);
    fs.copyFileSync(envSrc, envDest);
  }

  const envLocalSrc = path.join(nextProjectRoot, '.env.local');
  const envLocalDest = path.join(targetDir, '.env.local');
  if (fs.existsSync(envLocalSrc)) {
    console.log(`Copying .env.local file to ${envLocalDest}...`);
    fs.copyFileSync(envLocalSrc, envLocalDest);
  }

  console.log('Postbuild static asset copy completed successfully.');
} else {
  console.log('Could not find server.js inside .next/standalone. Ensure output: "standalone" is set in next.config.mjs');
}
