/* global __dirname */
// assets/images/app-icon.png から、ホームのヒーロー背景用のアイコンを焼き込んで生成する。
// 2 つの加工をアルファに合成する:
//   1. 白背景の透過（白キーイング + アンマルチプライ）… 白い部分ほど透明にし、
//      半透明になった輪郭から白混じりを取り除く。白地へ再合成すると元画像に一致するため、
//      ライトモード（白背景）では見た目が変わらず、ダークモードでは白い四角や白フチが出ない。
//   2. 斜めフェード（左上が濃く、右下へ向けて透明化）… ヒーロー背景としての見せ方。
// 以前ホーム背景に使っていた神戸市章の斜めフェードを app-icon で再現するためのもの。
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

const clamp255 = (v) => {
  const r = Math.round(v);
  if (r < 0) return 0;
  if (r > 255) return 255;
  return r;
};

const png = PNG.sync.read(fs.readFileSync(src));
const { width: W, height: H, data } = png;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (W * y + x) << 2;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a0 = data[idx + 3];

    // 白背景のキーイング: 画素の「白さ」からアルファを決める。
    // 白(255,255,255)=完全透明、彩度や暗さがあるほど不透明。min チャンネルを使うことで、
    // 明るくても色のある部分（赤・青など）は不透明として残る。
    const key = (255 - Math.min(r, g, b)) / 255; // 0(白) .. 1(濃い色/暗い)

    // アンマルチプライ: 観測色 = 真の色*key + 白*(1-key) を逆算し、白混じりを取り除く。
    // これで輪郭の半透明部に白フチが残らず、白地へ再合成すれば元画像に一致する。
    if (key > 0) {
      data[idx] = clamp255((r - 255 * (1 - key)) / key);
      data[idx + 1] = clamp255((g - 255 * (1 - key)) / key);
      data[idx + 2] = clamp255((b - 255 * (1 - key)) / key);
    }

    // 斜めフェード係数 f（左上0 → 右下1）。
    const t = (x / (W - 1) + y / (H - 1)) / 2;
    let f = 1 - (t - START) / (END - START);
    if (f > 1) f = 1;
    if (f < 0) f = 0;

    // 最終アルファ = 既存α × 白キー × フェード。
    data[idx + 3] = Math.round(a0 * key * f);
  }
}

fs.writeFileSync(dst, PNG.sync.write(png));
console.log(`wrote ${dst} (${W}x${H})`);
