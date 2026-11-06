// 合并图标库：从 icons/sources.json 的 15 个来源拉取图标，合并成一个库。
// 规则：
// - 只去掉完全相同（同名 + 同地址）的重复条目；
// - 同名不同图的图标全部保留（不同库的同名图标是不同风格，丢了就找不回来）；
// - 按名字、地址排序，输出稳定，方便看 diff；
// - 任一来源拉取或解析失败时不写文件、直接报错退出，避免一次网络抖动把整个库的图标清空。
// 用法：node icons/merge-icons.mjs （在仓库根目录运行）
// GitHub Actions 每天自动跑一次，也可以手动触发。

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_FILE = join(ROOT, 'icons', 'sources.json');
const OUTPUT_FILE = join(ROOT, 'icons', 'icons-merged.json');

function parseJsonTolerant(text) {
  try {
    return JSON.parse(text);
  } catch {
    // 容错：去掉数组/对象末尾多余的逗号（个别库有这个问题，如 EDC）
    const fixed = text.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(fixed);
  }
}

const { sources } = JSON.parse(readFileSync(SOURCES_FILE, 'utf8'));

const seen = new Set();
const icons = [];
let failed = [];

for (const src of sources) {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'loon-plugins-icon-merge' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseJsonTolerant(await res.text());
    const list = Array.isArray(data) ? data : data.icons;
    if (!Array.isArray(list)) throw new Error('no icons array');
    let n = 0;
    for (const item of list) {
      const name = typeof item?.name === 'string' ? item.name : '';
      const url = typeof item?.url === 'string' ? item.url : '';
      if (!name || !url) continue;
      const key = name + '\0' + url;
      if (seen.has(key)) continue;
      seen.add(key);
      icons.push({ name, url });
      n++;
    }
    console.log(`${src.id}: ${list.length} 条 -> 新增 ${n} 条`);
  } catch (e) {
    console.error(`${src.id}: 拉取失败 ${src.url} (${e.message})`);
    failed.push(src.id);
  }
}

if (failed.length) {
  console.error(`失败来源: ${failed.join(', ')}，本次不写文件`);
  process.exit(1);
}

icons.sort((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 :
  a.url < b.url ? -1 : a.url > b.url ? 1 : 0);

const merged = {
  name: '許諾图标合集',
  description: `合并自 ${sources.length} 个图标库，共 ${icons.length} 个图标，每天自动同步更新，有新图标自动加入。`,
  icons,
};
const text = JSON.stringify(merged, null, 2) + '\n';

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
console.log('已写入 icons/icons-merged.json');
