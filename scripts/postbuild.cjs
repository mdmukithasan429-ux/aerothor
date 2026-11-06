const fs = require('node:fs');
const path = require('node:path');

const src = path.join(__dirname, '..', 'dist', 'index.html');
const dest = path.join(__dirname, '..', 'data', 'index-template.html');

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('✓ Successfully copied dist/index.html -> data/index-template.html');
} else {
  console.warn('⚠ dist/index.html not found to copy');
}
