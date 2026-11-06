const fs = require('node:fs');
const path = require('node:path');

const targets = ['dist', 'server.js'];

for (const target of targets) {
  const targetPath = path.join(__dirname, '..', target);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`✓ Cleaned ${target}`);
  }
}
