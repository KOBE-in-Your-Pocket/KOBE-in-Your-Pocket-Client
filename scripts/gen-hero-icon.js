/* global __dirname */
// assets/images/app-icon.png から、ホームのヒーロー背景用に
// 「左上が濃く、右下へ斜めにフェード（透明化）」したアイコンを焼き込んで生成する。
// 以前の神戸市章（kobe-emblem.png）が持っていた斜めフェードを app-icon で再現するためのもの。
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'images', 'app-icon.png');
const dst = path.join(root, 'assets', 'images', 'app-icon-hero.png');

// フェード開始 / 終了位置（主対角線上の正規化距離 t: 左上=0, 右下=1）。
// t<START は不透明のまま、t>END は完全透明。間を線形に落とす。
// 値を小さくするほど早く・広く透明化し、フェードが濃く（強く）なる。
const START = 0.1;
const END = 0.52;

const png = PNG.sync.read(fs.readFileSync(src));
const { width: W, height: H, data } = png;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (W * y + x) << 2;
    const t = (x / (W - 1) + y / (H - 1)) / 2; // 左上0 → 右下1
    let f = 1 - (t - START) / (END - START);
    if (f > 1) f = 1;
    if (f < 0) f = 0;
    data[idx + 3] = Math.round(data[idx + 3] * f);
  }
}

fs.writeFileSync(dst, PNG.sync.write(png));
console.log(`wrote ${dst} (${W}x${H})`);
