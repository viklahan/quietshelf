// Transform every static/*.jsx through the same preset the browser's
// babel-standalone uses. Prints FAILED on any error. Requires:
//   npm install @babel/core @babel/preset-react   (one-time, in project root)
const fs = require('fs');
const path = require('path');
let babel;
try { babel = require('@babel/core'); }
catch (e) { console.log('[SKIP] @babel/core not installed — run: npm install @babel/core @babel/preset-react'); process.exit(0); }
const dir = path.join(__dirname, '..', 'static');
let failed = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.jsx'))) {
  const full = path.join(dir, f);
  try {
    babel.transformSync(fs.readFileSync(full, 'utf8'), { presets: ['@babel/preset-react'], filename: full });
    console.log('  [OK]   ' + f + ' transforms');
  } catch (e) {
    failed++;
    console.log('  [FAIL] ' + f + ' FAILED: ' + e.message.split('\n')[0]);
  }
}
process.exit(failed ? 1 : 0);
