import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.salesforce.com/trailblazer/dg696benb0l759ne0r';
const FILE = 'trailhead.json';

const browser = await chromium.launch();
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
});
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(8000);
const text = await page.innerText('body');
await browser.close();

const num = (label) => {
  const a = text.match(new RegExp(`([\\d,]+)\\s*\\n?\\s*${label}\\b`, 'i'));
  const b = text.match(new RegExp(`\\b${label}\\s*\\n?\\s*([\\d,]+)`, 'i'));
  const m = a || b;
  return m ? Number(m[1].replace(/,/g, '')) : null;
};

const found = {
  badges: num('Badges'),
  points: num('Points'),
  trails: num('Trails'),
};
const sb = text.match(/(\d+)\s*Superbadges/i);
if (sb) found.superbadgeCount = Number(sb[1]);

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

if (!found.badges || !found.points) {
  console.error('Could not read stats. Page text sample:\n', text.slice(0, 1500));
  process.exit(1);
}

Object.assign(data, Object.fromEntries(Object.entries(found).filter(([, v]) => v)));

if (data.rank === 'Ranger') {
  data.badgesToNext = Math.max(0, 200 - data.badges);
  data.pointsToNext = Math.max(0, 100000 - data.points);
}
data.updated = new Date().toISOString().slice(0, 10);

fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log('Updated:', found);