const fs = require('fs');
const files = [
  'c:/Users/easy/Documents/my codings/idagha/idagha-frontend/pages/_app.tsx',
  'c:/Users/easy/Documents/my codings/idagha/idagha-frontend/components/WelcomePopup.tsx',
  'c:/Users/easy/Documents/my codings/idagha/idagha-frontend/pages/home.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/rgba\(6,182,212/g, 'rgba(34,197,94');
  content = content.replace(/rgba\(\s*6\s*,\s*182\s*,\s*212/g, 'rgba(34,197,94');
  content = content.replace(/#06b6d4/g, '#22c55e');
  content = content.replace(/#22d3ee/g, '#4ade80');
  content = content.replace(/#0e7490/g, '#15803d');
  fs.writeFileSync(file, content);
});
