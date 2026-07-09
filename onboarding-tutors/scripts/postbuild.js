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
  
  // First check if server.js is in the current directory (shallow check)
  if (fs.existsSync(path.join(dir, 'server.js'))) {
    return dir;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      const fullPath = path.join(dir, entry.name);
      const result = findServerJsDir(fullPath);
      if (result) return result;
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

  // Copy .next/static folder to .next/static (for Next.js standalone server)
  const staticSrc = path.join(nextProjectRoot, '.next', 'static');
  const staticDest = path.join(targetDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${staticDest}...`);
    copyDirSync(staticSrc, staticDest);
  }
  
  // Also copy .next/static to _next/static (for Litespeed/Apache interception at root)
  const underscoreNextDest = path.join(targetDir, '_next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${underscoreNextDest} for static server compatibility...`);
    copyDirSync(staticSrc, underscoreNextDest);
  }

  // Also copy .next/static to public/_next/static (for Hostinger Litespeed where Document Root is public/)
  const publicUnderscoreNextDest = path.join(publicDest, '_next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log(`Copying .next/static folder to ${publicUnderscoreNextDest} for Hostinger Document Root compatibility...`);
    copyDirSync(staticSrc, publicUnderscoreNextDest);
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
