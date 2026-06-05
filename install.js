#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'skills');
const dest = path.join(process.cwd(), 'skills');

if (!fs.existsSync(src)) {
  console.error('Error: skills directory not found.');
  process.exit(1);
}

function copyDir(from, to) {
  if (path.resolve(from) === path.resolve(to)) {
    return;
  }

  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      if (path.resolve(s) !== path.resolve(d)) {
        fs.copyFileSync(s, d);
      }
    }
  }
}

console.log('XuguDB Dev Skills Installer');
console.log('===========================');
console.log('');
console.log('Copying skills to: ' + dest);
copyDir(src, dest);

console.log('');
console.log('Done! 25 top-level skills installed.');
console.log('The xugudb-ecosystem skill includes 37 adapter subskills.');
console.log('Try: /xugudb in Claude Code to verify.');
