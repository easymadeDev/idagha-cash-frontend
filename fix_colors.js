const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk(__dirname);
let totalChanged = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace standard rgba
  if (content.includes('rgba(34,197,94')) {
    content = content.replace(/rgba\(34,197,94/g, 'rgba(6,182,212');
    changed = true;
  }
  // Replace spaced rgba
  if (content.match(/rgba\(\s*34\s*,\s*197\s*,\s*94/)) {
    content = content.replace(/rgba\(\s*34\s*,\s*197\s*,\s*94/g, 'rgba(6,182,212');
    changed = true;
  }
  // Replace hex
  if (content.includes('#22c55e')) {
    content = content.replace(/#22c55e/g, '#06b6d4');
    changed = true;
  }
  if (content.includes('#4ade80')) {
    content = content.replace(/#4ade80/g, '#22d3ee');
    changed = true;
  }
  if (content.includes('#15803d')) {
    content = content.replace(/#15803d/g, '#0e7490');
    changed = true;
  }
  
  // Also add backdrop-filter to .card and .stat-card if not present to enable glassmorphism
  if (file.endsWith('globals.css') && content.includes('.card {') && !content.includes('backdrop-filter: blur')) {
    content = content.replace(/\.card \{/g, '.card {\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);');
    content = content.replace(/\.stat-card \{/g, '.stat-card {\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);');
    content = content.replace(/\.quick-card \{/g, '.quick-card {\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated:', file);
    totalChanged++;
  }
});

console.log('Done! Updated', totalChanged, 'files.');
