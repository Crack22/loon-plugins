// 从四个 BoxJs 订阅（boxjs.json、boxjs-leguan.json、boxjs-checkins.json、boxjs-weibo-daka.json）收集全部图标，生成图标订阅 icons-boxjs.json。
// 订阅图标 + 每个 App 的图标都会收进来，按图片地址去重；BoxJs 里没有、但想收进图标库的图标，
// 加到下面的 EXTRA_ICONS 里（例如步道乐跑：只有 Loon 插件，没有 BoxJs 应用）。
// 以后 BoxJs 里加了新图标，每天自动更新的工作流会重新跑这个脚本，图标库自动跟上。
// 用法：node icons/merge-boxjs-icons.mjs（在仓库根目录运行）

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_FILE = join(ROOT, 'icons', 'icons-boxjs.json');

const EXTRA_ICONS = [
  { name: '步道乐跑', url: 'https://raw.githubusercontent.com/Crack22/loon-plugins/main/icons/budaolepao.jpg' },
];

const seen = new Set();
const icons = [];
function add(name, url) {
  if (!name || !url || seen.has(url)) return;
  seen.add(url);
  icons.push({ name, url });
}

for (const file of ['boxjs.json', 'boxjs-leguan.json', 'boxjs-checkins.json', 'boxjs-weibo-daka.json']) {
  const sub = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
  if (sub.icon) add(sub.name, sub.icon);
  for (const app of sub.apps || []) {
    for (const url of app.icons || []) add(app.name, url);
  }
}
for (const item of EXTRA_ICONS) add(item.name, item.url);

icons.sort((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 :
  a.url < b.url ? -1 : a.url > b.url ? 1 : 0);

const lib = {
  name: '許諾 BoxJs 图标',
  description: `BoxJs 订阅里的全部图标，共 ${icons.length} 个，每天自动同步 BoxJs 订阅的新图标。`,
  icons,
};
const text = JSON.stringify(lib, null, 2) + '\n';

if (existsSync(OUTPUT_FILE)) {
  const old = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));
  if (JSON.stringify(old.icons) === JSON.stringify(icons)) {
    console.log(`无变化：共 ${icons.length} 个图标`);
    process.exit(0);
  }
  console.log(`变化：${old.icons?.length ?? 0} -> ${icons.length} 个图标`);
} else {
  console.log(`新建：共 ${icons.length} 个图标`);
}

writeFileSync(OUTPUT_FILE, text);
console.log('已写入 icons/icons-boxjs.json');
