// 夕 (dusk) — DeepSeek Harness Web 主题皮肤（客户端源码）
//
// 构建：scripts/build.mjs 将本文件包装为 lazy-CJS factory bundle（lib/client.js）。
// 本文件运行在浏览器客户端，仅做「表现层」：
//   1. 注入一张 scoped 样式表（body[data-dsh-dusk] 钩子），覆盖 --dsw-* 主题 token；
//   2. 挂载朱砂「夕」印章；
//   3. 在「设置 → 通用」注册「背景图片」行：本地图取景（拖动选区域、缩放）、双透明度滑杆、
//      以及「背景底色」自定义颜色（留空跟随 DSH 浅色/深色/跟随系统）。
// 背景层位于 z-index:-1，永远沉在界面内容之下；默认无背景图时界面为纯净的主题配色。

const React = require('react');
const ReactDOM = require('react-dom');

const SKIN_PACKAGE = 'dsh-dusk-theme';
const SCOPE_ATTR = 'data-dsh-dusk';
const BACKDROP_CLASS = 'dusk-backdrop';
const SEAL_CLASS = 'dusk-seal';
const ROW_CLASS = 'dusk-bg-row';
const BG_STORAGE_KEY = 'dsh-dusk-theme.background';
const LEGACY_BG_STORAGE_KEY = 'dsh-xi-theme.background';
const TINT_STORAGE_KEY = 'dsh-dusk-theme.tint';
const GLASS_DEFAULT = 41;
const GLASS_MIN = 10;
const GLASS_MAX = 96;
const GLASS_UI_DEFAULT = 74;
const GLASS_UI_MIN = 10;
const GLASS_UI_MAX = 100;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const TINT_FALLBACK = '#ffffff';

// 内置默认背景：打包进仓库的图片（assets/default-background.jpg，构建时注入 dataURL）
// + 作者的默认取景与透明度设置。新用户不设置任何东西时，UI 即与作者当前状态一致。
const DEFAULT_IMAGE = '__DUSK_DEFAULT_IMAGE__';
const DEFAULT_BG = {
  url: DEFAULT_IMAGE,
  x: 65.69,
  y: 64.23,
  zoom: 1,
  glass: GLASS_DEFAULT,
  glassUi: GLASS_UI_DEFAULT
};

const css = `
/* ============================================================
   1. 主题配色（纯白日间 / 黛青夜墨）
   ============================================================ */
body[${SCOPE_ATTR}]{
  --dusk-bg-0:#ffffff; --dusk-bg-1:#f6f6f4; --dusk-bg-2:#ececea; --dusk-bg-3:#e3e3e0; --dusk-bg-4:#d9d9d5;
  --dusk-panel:rgba(252,252,250,.86); --dusk-panel-solid:#f1f1ee;
  --dusk-sidebar:rgba(246,246,243,.94);
  --dusk-text-1:#223a3f; --dusk-text-2:#3d5256; --dusk-text-3:#5b6d70; --dusk-text-4:#7e8f90;
  --dusk-accent:#2e6f7e; --dusk-accent-hi:#3b8a9c; --dusk-accent-2:#3f8a6a;
  --dusk-seal:#b23b2e; --dusk-seal-hi:#c94f3f;
  --dusk-border-dim:#00000010; --dusk-border:#00000022; --dusk-border-light:#0000003a;
  --dusk-success:#2f8f6f; --dusk-warning:#b87a1e; --dusk-error:#b23b2e;
  --dusk-glow:rgba(46,111,126,.16);
  color-scheme:light;
}
body[${SCOPE_ATTR}][data-ds-dark-theme]{
  --dusk-bg-0:#141f23; --dusk-bg-1:#19262b; --dusk-bg-2:#1e2d33; --dusk-bg-3:#24363d; --dusk-bg-4:#2a3e45;
  --dusk-panel:rgba(30,45,51,.84); --dusk-panel-solid:#1e2d33;
  --dusk-sidebar:rgba(20,31,35,.94);
  --dusk-text-1:#e6ece5; --dusk-text-2:#b7c4c2; --dusk-text-3:#8a9997; --dusk-text-4:#5f6f6d;
  --dusk-accent:#5bb6c2; --dusk-accent-hi:#6fd0dc; --dusk-accent-2:#57c39a;
  --dusk-seal:#cf5f4a; --dusk-seal-hi:#e07a63;
  --dusk-border-dim:#ffffff12; --dusk-border:#ffffff22; --dusk-border-light:#ffffff3a;
  --dusk-success:#57c39a; --dusk-warning:#d9a13f; --dusk-error:#e06a55;
  --dusk-glow:rgba(91,182,194,.14);
  color-scheme:dark;
}
/* 用户自定义背景底色（--dusk-tint 由 JS 以内联样式设置；data-dusk-tinted 为开关）。
   派生表面层级：明一层 / 逐层加深，留空则完全跟随上方浅色/深色/跟随系统。 */
body[${SCOPE_ATTR}][data-dusk-tinted]{
  --dusk-bg-0:var(--dusk-tint);
  --dusk-bg-1:color-mix(in srgb,var(--dusk-tint) 90%,#fff);
  --dusk-bg-2:color-mix(in srgb,var(--dusk-tint) 86%,#000);
  --dusk-bg-3:color-mix(in srgb,var(--dusk-tint) 78%,#000);
  --dusk-bg-4:color-mix(in srgb,var(--dusk-tint) 70%,#000);
  --dusk-panel:color-mix(in srgb,var(--dusk-tint) 94%,#fff);
  --dusk-panel-solid:color-mix(in srgb,var(--dusk-tint) 94%,#fff);
  --dusk-sidebar:color-mix(in srgb,var(--dusk-tint) 94%,#fff);
}

/* ============================================================
   2. --dsw-* token 覆盖（映射到上面的 --dusk-* 变量）
   ============================================================ */
body[${SCOPE_ATTR}]{
  --dsw-alias-bg-base:var(--dusk-bg-0);
  --dsw-alias-bg-layer-1:var(--dusk-bg-1);
  --dsw-alias-bg-layer-2:var(--dusk-panel);
  --dsw-alias-bg-layer-3:var(--dusk-bg-3);
  --dsw-alias-bg-overlay:var(--dusk-bg-4);
  --dsw-alias-bg-module-platform:var(--dusk-panel-solid);
  --dsw-alias-bg-multi-select:var(--dusk-bg-2);
  --dsw-alias-border-l1:var(--dusk-border-dim);
  --dsw-alias-border-l2:var(--dusk-border);
  --dsw-alias-border-l2-darkmode-thin:var(--dusk-border);
  --dsw-alias-border-l3:var(--dusk-border);
  --dsw-alias-border-l4:var(--dusk-border-light);
  --dsw-alias-border-inverted:var(--dusk-border-dim);
  --dsw-alias-brand-primary:var(--dusk-accent);
  --dsw-alias-brand-text:var(--dusk-text-1);
  --dsw-alias-brand-primary-invert:var(--dusk-bg-1);
  --dsw-alias-button-primary-fill:var(--dusk-accent);
  --dsw-alias-button-primary-hover:var(--dusk-accent-hi);
  --dsw-alias-button-info-fill:var(--dusk-accent-2);
  --dsw-alias-button-info-hover:var(--dusk-accent);
  --dsw-alias-button-elevated-fill:var(--dusk-bg-1);
  --dsw-alias-button-floating-fill:var(--dusk-bg-4);
  --dsw-alias-button-floating-hover:var(--dusk-bg-3);
  --dsw-alias-button-ghost-active-fill:var(--dusk-bg-2);
  --dsw-alias-button-ghost-active-hover:var(--dusk-bg-3);
  --dsw-alias-interactive-bg-hover:color-mix(in srgb,var(--dusk-accent) 10%,transparent);
  --dsw-alias-interactive-bg-active:color-mix(in srgb,var(--dusk-accent) 18%,transparent);
  --dsw-alias-interactive-bg-hover-solid:var(--dusk-bg-2);
  --dsw-alias-label-primary:var(--dusk-text-1);
  --dsw-alias-label-secondary:var(--dusk-text-2);
  --dsw-alias-label-tertiary:var(--dusk-text-3);
  --dsw-alias-label-caption:var(--dusk-text-4);
  --dsw-alias-label-dimmed:var(--dusk-text-4);
  --dsw-alias-label-primary-inverted:var(--dusk-bg-1);
  --dsw-alias-label-primary-foreground:var(--dusk-bg-0);
  --dsw-alias-link:var(--dusk-accent-hi);
  --dsw-alias-state-business-primary:var(--dusk-accent);
  --dsw-alias-state-business-tertiary:var(--dusk-bg-3);
  --dsw-alias-state-error-primary:var(--dusk-error);
  --dsw-alias-state-error-secondary:var(--dusk-error);
  --dsw-alias-state-success-primary:var(--dusk-success);
  --dsw-alias-state-success-secondary:var(--dusk-success);
  --dsw-alias-state-warn-primary:var(--dusk-warning);
  --dsw-alias-state-warn-secondary:var(--dusk-warning);
  --dsw-alias-markdown-code-block:var(--dusk-bg-2);
  --dsw-alias-markdown-code-block-banner:var(--dusk-bg-1);
  --dsw-alias-markdown-inline-code:var(--dusk-bg-2);
  --dsw-alias-markdown-tag:var(--dusk-bg-2);
  --dsw-alias-scrollbar-bg-l1:var(--dusk-border-light);
  --dsw-alias-scrollbar-bg-l2:var(--dusk-border-light);
  --dsw-alias-scrollbar-hover-l1:var(--dusk-text-3);
  --dsw-alias-scrollbar-hover-l2:var(--dusk-text-3);
  --dsw-specific-bubble:var(--dusk-panel);
  --dsw-specific-bubble-highlight:var(--dusk-bg-3);
  --dsw-specific-input-major:var(--dusk-panel-solid);
  --dsw-specific-menu:var(--dusk-panel-solid);
  --dsw-specific-selector:var(--dusk-bg-2);
  --dsw-specific-tip:var(--dusk-panel-solid);
  --dsw-specific-sidebar-fill:var(--dusk-sidebar);
  --dsw-specific-sidebar-nav-item-active:var(--dusk-bg-2);
  --dsw-specific-sidebar-nav-item-active-accent:var(--dusk-accent);
  --dsw-specific-sidebar-nav-item-hover:var(--dusk-bg-1);
}

/* ============================================================
   3. 基础表面
   body 背景透明，让 z-index:-1 的背景层透出；
   界面自身的表面由上方 token 决定（默认不透明，配色纯净）。
   ============================================================ */
body[${SCOPE_ATTR}]{ background-color:transparent; color:var(--dusk-text-1); }

/* ============================================================
   4. 背景层：z-index:-1 永远沉底，绝不遮挡界面内容
   ============================================================ */
body[${SCOPE_ATTR}] .${BACKDROP_CLASS}{
  position:fixed; inset:0; z-index:-1; pointer-events:none; overflow:hidden;
  background-color:var(--dusk-bg-0);
  background-repeat:no-repeat;
}
/* 用户本地图：JS 以内联样式设置 background-image/size/position + transform 缩放 */
body[${SCOPE_ATTR}].dusk-has-image .${BACKDROP_CLASS}::after{
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(16,22,26,.30), rgba(16,22,26,.14) 50%, rgba(16,22,26,.36));
}
/* 设置本地图后，表面按透明度半透明让图片透出：
   --dusk-glass 控制主屏（对话区 / 输入区 / 气泡），默认 80%；
   --dusk-glass-ui 控制其余界面（侧栏 / 面板 / 弹窗 / 菜单等），默认 96%。 */
body[${SCOPE_ATTR}].dusk-has-image{
  --dsw-alias-bg-base:color-mix(in srgb,var(--dusk-bg-0) calc(var(--dusk-glass,${GLASS_DEFAULT})*1%),transparent);
  --dsw-specific-input-major:color-mix(in srgb,var(--dusk-panel-solid) calc((var(--dusk-glass,${GLASS_DEFAULT}) + 12)*1%),transparent);
  --dsw-specific-bubble:color-mix(in srgb,var(--dusk-panel-solid) calc((var(--dusk-glass,${GLASS_DEFAULT}) + 8)*1%),transparent);
  --dsw-specific-bubble-highlight:color-mix(in srgb,var(--dusk-bg-3) calc((var(--dusk-glass,${GLASS_DEFAULT}) + 6)*1%),transparent);
  --dsw-alias-bg-layer-1:color-mix(in srgb,var(--dusk-bg-1) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-alias-bg-layer-2:color-mix(in srgb,var(--dusk-panel-solid) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-alias-bg-layer-3:color-mix(in srgb,var(--dusk-bg-3) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-alias-bg-overlay:color-mix(in srgb,var(--dusk-bg-4) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-alias-bg-module-platform:color-mix(in srgb,var(--dusk-panel-solid) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-alias-bg-multi-select:color-mix(in srgb,var(--dusk-bg-2) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-specific-sidebar-fill:color-mix(in srgb,var(--dusk-sidebar) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-specific-menu:color-mix(in srgb,var(--dusk-panel-solid) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-specific-selector:color-mix(in srgb,var(--dusk-bg-2) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
  --dsw-specific-tip:color-mix(in srgb,var(--dusk-panel-solid) calc(var(--dusk-glass-ui,${GLASS_UI_DEFAULT})*1%),transparent);
}

/* ============================================================
   5. 朱砂「夕」印章
   ============================================================ */
body[${SCOPE_ATTR}] .${SEAL_CLASS}{
  position:fixed; right:26px; bottom:24px; z-index:1; pointer-events:none;
  width:58px; height:58px; display:flex; align-items:center; justify-content:center;
  background:var(--dusk-seal); color:#f8f4e8;
  font-family:'Kaiti SC','KaiTi','STKaiti',serif; font-size:34px; font-weight:700; line-height:1;
  border-radius:8px;
  box-shadow:inset 0 0 0 3px rgba(255,250,235,.75), 0 4px 14px rgba(0,0,0,.18);
  opacity:.9; user-select:none;
  animation:dusk-seal-glow 5s ease-in-out infinite;
}
@keyframes dusk-seal-glow{
  0%,100%{ box-shadow:inset 0 0 0 3px rgba(255,250,235,.75), 0 4px 14px rgba(0,0,0,.18), 0 0 0 0 var(--dusk-glow); }
  50%{ box-shadow:inset 0 0 0 3px rgba(255,250,235,.75), 0 4px 14px rgba(0,0,0,.18), 0 0 22px 2px var(--dusk-glow); }
}

/* ============================================================
   6. 「设置 → 通用」背景图片行
   ============================================================ */
body[${SCOPE_ATTR}] .${ROW_CLASS}{
  border-bottom:.5px solid var(--dsw-alias-border-l2);
  align-items:center; gap:8px; padding:16px 0; display:flex;
}
body[${SCOPE_ATTR}] .dusk-bg-rowText{
  flex-direction:column; flex:1; gap:4px; min-width:0; padding-right:48px; display:flex;
}
body[${SCOPE_ATTR}] .dusk-bg-title{ color:var(--dsw-alias-label-primary); font-size:14px; line-height:22px; }
body[${SCOPE_ATTR}] .dusk-bg-desc{ color:var(--dsw-alias-label-tertiary); font-size:12px; line-height:18px; }
body[${SCOPE_ATTR}] .dusk-bg-control{ align-items:center; gap:8px; display:inline-flex; flex:none; }
body[${SCOPE_ATTR}] .dusk-bg-thumb{
  width:34px; height:34px; border-radius:6px; flex:none;
  border:.5px solid var(--dsw-alias-border-l2);
  background-size:cover; background-position:center;
}
body[${SCOPE_ATTR}] .dusk-bg-btn{
  background:var(--dsw-alias-bg-module-platform);
  border:0; border-radius:18px; height:34px; padding:0 14px;
  color:var(--dsw-alias-label-primary); font-size:13px; line-height:1; cursor:pointer;
}
body[${SCOPE_ATTR}] .dusk-bg-btn:hover{ background:var(--dsw-alias-interactive-bg-hover); }
body[${SCOPE_ATTR}] .dusk-bg-btn-danger{ color:var(--dsw-alias-state-error-primary); }
body[${SCOPE_ATTR}] .dusk-bg-btn-primary{ background:var(--dusk-accent); color:#f6f3ea; }
body[${SCOPE_ATTR}] .dusk-bg-btn-primary:hover{ background:var(--dusk-accent-hi); }
body[${SCOPE_ATTR}] .dusk-bg-glassRow{ display:flex; align-items:center; gap:10px; margin-top:2px; }
body[${SCOPE_ATTR}] .dusk-bg-glassRow input[type=range]{ width:140px; accent-color:var(--dusk-accent); }
body[${SCOPE_ATTR}] .dusk-bg-glassLabel{ font-size:12px; color:var(--dusk-text-3); white-space:nowrap; }
body[${SCOPE_ATTR}] .dusk-bg-tintRow{ display:flex; align-items:center; gap:10px; margin-top:2px; }
body[${SCOPE_ATTR}] .dusk-bg-tintRow input[type=color]{
  width:30px; height:26px; padding:0; border:1px solid var(--dusk-border-light);
  border-radius:6px; background:none; cursor:pointer;
}
body[${SCOPE_ATTR}] .dusk-bg-tintText{
  width:180px; height:26px; padding:0 8px; font-size:12px;
  color:var(--dusk-text-1); background:var(--dusk-bg-1);
  border:1px solid var(--dusk-border-light); border-radius:6px;
}

/* ============================================================
   7. 取景弹窗（选择图片的哪一部分作为背景）
   ============================================================ */
body[${SCOPE_ATTR}] .dusk-crop-modal{
  position:fixed; inset:0; z-index:99990;
  background:rgba(8,12,14,.66);
  display:flex; align-items:center; justify-content:center; padding:24px;
}
body[${SCOPE_ATTR}] .dusk-crop-panel{
  background:var(--dusk-panel-solid); color:var(--dusk-text-1);
  border-radius:14px; padding:20px; max-width:min(92vw,680px);
  display:flex; flex-direction:column; gap:12px;
  box-shadow:0 18px 60px rgba(0,0,0,.45);
}
body[${SCOPE_ATTR}] .dusk-crop-title{ font-size:15px; font-weight:600; line-height:22px; }
body[${SCOPE_ATTR}] .dusk-crop-hint{ font-size:12px; color:var(--dusk-text-3); line-height:18px; }
body[${SCOPE_ATTR}] .dusk-crop-box{
  width:min(80vw,600px); aspect-ratio:16/10; position:relative; overflow:hidden;
  border-radius:10px; background:#000; cursor:move;
  touch-action:none; user-select:none; border:1px solid var(--dusk-border-light);
}
body[${SCOPE_ATTR}] .dusk-crop-img{ position:absolute; inset:0; }
body[${SCOPE_ATTR}] .dusk-crop-zoomRow{ display:flex; align-items:center; gap:10px; }
body[${SCOPE_ATTR}] .dusk-crop-zoomRow input[type=range]{ flex:1; accent-color:var(--dusk-accent); }
body[${SCOPE_ATTR}] .dusk-crop-label{ font-size:12px; color:var(--dusk-text-2); white-space:nowrap; }
body[${SCOPE_ATTR}] .dusk-crop-actions{ display:flex; justify-content:flex-end; gap:10px; }

/* ============================================================
   8. 动效尊重系统偏好
   ============================================================ */
@media (prefers-reduced-motion: reduce){
  body[${SCOPE_ATTR}] .${SEAL_CLASS}{ animation:none; }
}
`;

// —— 工具函数 ——
function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function clampNum(value, lo, hi, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
}

/** 把用户输入的 #rrggbb / #rgb / rgb(r,g,b) / rgba(...) 规范化为 #rrggbb，非法返回 null。 */
function normalizeColor(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  const rgba = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]*)?\)$/);
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    if (r <= 255 && g <= 255 && b <= 255) {
      return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
    }
    return null;
  }
  if (/^#?[0-9a-f]{3}$/.test(s)) {
    const h = s.replace('#', '');
    return '#' + h.split('').map((c) => c + c).join('');
  }
  if (/^#?[0-9a-f]{6}$/.test(s)) return '#' + s.replace('#', '');
  return null;
}

// —— 背景状态与操作（模块级，供设置行与皮肤共享）——
let backdropElement = null;

function loadSavedBg() {
  try {
    let raw = localStorage.getItem(BG_STORAGE_KEY);
    if (!raw) {
      // 从旧键迁移（dsh-xi-theme → dsh-dusk-theme）
      const legacy = localStorage.getItem(LEGACY_BG_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(BG_STORAGE_KEY, legacy);
        raw = legacy;
      }
    }
    if (!raw) return { ...DEFAULT_BG };
    if (raw.charAt(0) === '{') {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url === null) return null; // 用户已「清除」
      if (parsed && typeof parsed.url === 'string') {
        return {
          url: parsed.url,
          x: clampNum(parsed.x, 0, 100, 50),
          y: clampNum(parsed.y, 0, 100, 50),
          zoom: clampNum(parsed.zoom, ZOOM_MIN, ZOOM_MAX, 1),
          glass: clampNum(parsed.glass, GLASS_MIN, GLASS_MAX, GLASS_DEFAULT),
          glassUi: clampNum(parsed.glassUi, GLASS_UI_MIN, GLASS_UI_MAX, GLASS_UI_DEFAULT)
        };
      }
    }
    // 旧格式：纯 dataURL 字符串
    return { url: raw, x: 50, y: 50, zoom: 1, glass: GLASS_DEFAULT, glassUi: GLASS_UI_DEFAULT };
  } catch {
    return { ...DEFAULT_BG };
  }
}

function saveBg(bg) {
  try {
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(bg));
  } catch {
    /* 图片过大时仅本次会话生效 */
  }
}

function applyBgToBackdrop(bg) {
  if (!backdropElement || !bg) return;
  document.body.classList.add('dusk-has-image');
  document.body.style.setProperty('--dusk-glass', String(bg.glass));
  document.body.style.setProperty('--dusk-glass-ui', String(bg.glassUi));
  const bd = backdropElement;
  bd.style.backgroundImage = 'url("' + bg.url + '")';
  bd.style.backgroundSize = 'cover';
  bd.style.backgroundPosition = bg.x + '% ' + bg.y + '%';
  bd.style.transform = 'scale(' + bg.zoom + ')';
  bd.style.transformOrigin = bg.x + '% ' + bg.y + '%';
}

function clearBackgroundImage() {
  try {
    // 写入「已清除」标记：下次加载不回到内置默认图，而是无背景的纯净状态
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify({ url: null }));
  } catch {
    /* ignore */
  }
  document.body.classList.remove('dusk-has-image');
  document.body.style.removeProperty('--dusk-glass');
  document.body.style.removeProperty('--dusk-glass-ui');
  if (backdropElement) {
    const bd = backdropElement;
    bd.style.backgroundImage = '';
    bd.style.backgroundSize = '';
    bd.style.backgroundPosition = '';
    bd.style.transform = '';
    bd.style.transformOrigin = '';
  }
}

// —— 背景底色（自定义默认背景色；null = 跟随系统浅色/深色）——
function loadTint() {
  try {
    return localStorage.getItem(TINT_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function applyTint(color) {
  if (color) {
    document.body.setAttribute('data-dusk-tinted', '');
    document.body.style.setProperty('--dusk-tint', color);
  } else {
    document.body.removeAttribute('data-dusk-tinted');
    document.body.style.removeProperty('--dusk-tint');
  }
}

function setTint(color) {
  try {
    if (color) localStorage.setItem(TINT_STORAGE_KEY, color);
    else localStorage.removeItem(TINT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  applyTint(color);
}

// —— 取景弹窗：拖动选择图片区域，滚轮/滑杆缩放 ——
function CropModal(props) {
  const [x, setX] = React.useState(props.x);
  const [y, setY] = React.useState(props.y);
  const [zoom, setZoom] = React.useState(props.zoom);
  const boxRef = React.useRef(null);
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      setZoom((z) => clamp(z - event.deltaY * 0.0012, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (event) => {
    event.preventDefault();
    const rect = boxRef.current.getBoundingClientRect();
    dragRef.current = { sx: event.clientX, sy: event.clientY, x, y };
    if (boxRef.current.setPointerCapture) {
      try {
        boxRef.current.setPointerCapture(event.pointerId);
      } catch {
        /* 合成事件可能没有活动指针 */
      }
    }
  };
  const onMove = (event) => {
    const d = dragRef.current;
    if (!d || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    setX(clamp(d.x + ((event.clientX - d.sx) / rect.width) * 100 / zoom, 0, 100));
    setY(clamp(d.y + ((event.clientY - d.sy) / rect.height) * 100 / zoom, 0, 100));
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const imgStyle = {
    backgroundImage: 'url("' + props.url + '")',
    backgroundSize: 'cover',
    backgroundPosition: x + '% ' + y + '%',
    transform: 'scale(' + zoom + ')',
    transformOrigin: x + '% ' + y + '%'
  };

  return ReactDOM.createPortal(
    React.createElement(
      'div',
      {
        className: 'dusk-crop-modal',
        onClick: (event) => {
          if (event.target === event.currentTarget) props.onCancel();
        }
      },
      React.createElement(
        'div',
        { className: 'dusk-crop-panel' },
        React.createElement('div', { className: 'dusk-crop-title' }, '选择背景区域'),
        React.createElement('div', { className: 'dusk-crop-hint' }, '在预览框内拖动移动取景位置，滚轮或滑杆调整缩放'),
        React.createElement(
          'div',
          {
            ref: boxRef,
            className: 'dusk-crop-box',
            onPointerDown: onDown,
            onPointerMove: onMove,
            onPointerUp: onUp,
            onPointerCancel: onUp
          },
          React.createElement('div', { className: 'dusk-crop-img', style: imgStyle })
        ),
        React.createElement(
          'div',
          { className: 'dusk-crop-zoomRow' },
          React.createElement('span', { className: 'dusk-crop-label' }, '缩放'),
          React.createElement('input', {
            type: 'range',
            min: ZOOM_MIN,
            max: ZOOM_MAX,
            step: 0.01,
            value: zoom,
            onChange: (event) => setZoom(parseFloat(event.target.value) || 1)
          }),
          React.createElement('span', { className: 'dusk-crop-label' }, zoom.toFixed(2) + '×'),
          React.createElement(
            'button',
            { type: 'button', className: 'dusk-bg-btn', onClick: () => { setX(50); setY(50); setZoom(1); } },
            '重置'
          )
        ),
        React.createElement(
          'div',
          { className: 'dusk-crop-actions' },
          React.createElement('button', { type: 'button', className: 'dusk-bg-btn', onClick: props.onCancel }, '取消'),
          React.createElement(
            'button',
            { type: 'button', className: 'dusk-bg-btn dusk-bg-btn-primary', onClick: () => props.onConfirm({ x, y, zoom }) },
            '确定'
          )
        )
      )
    ),
    document.body
  );
}

// —— 「设置 → 通用」中的背景图片行组件 ——
function BackgroundRow() {
  const [bg, setBg] = React.useState(loadSavedBg());
  const [pending, setPending] = React.useState(null);
  const [tint, setTintState] = React.useState(loadTint());
  const [tintText, setTintText] = React.useState(loadTint() || '');
  const fileRef = React.useRef(null);

  const pick = () => {
    if (fileRef.current) fileRef.current.click();
  };
  const onFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setPending({
        url: reader.result,
        x: 50,
        y: 50,
        zoom: 1,
        glass: bg ? bg.glass : GLASS_DEFAULT,
        glassUi: bg ? bg.glassUi : GLASS_UI_DEFAULT
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  const onConfirm = (crop) => {
    if (!pending) return;
    const next = {
      url: pending.url,
      x: clamp(crop.x, 0, 100),
      y: clamp(crop.y, 0, 100),
      zoom: clamp(crop.zoom, ZOOM_MIN, ZOOM_MAX),
      glass: pending.glass,
      glassUi: pending.glassUi
    };
    saveBg(next);
    applyBgToBackdrop(next);
    setBg(next);
    setPending(null);
  };
  const onAdjust = () => {
    if (bg) setPending(bg);
  };
  const onGlass = (value) => {
    if (!bg) return;
    const next = { ...bg, glass: clamp(Number(value), GLASS_MIN, GLASS_MAX) };
    saveBg(next);
    applyBgToBackdrop(next);
    setBg(next);
  };
  const onGlassUi = (value) => {
    if (!bg) return;
    const next = { ...bg, glassUi: clamp(Number(value), GLASS_UI_MIN, GLASS_UI_MAX) };
    saveBg(next);
    applyBgToBackdrop(next);
    setBg(next);
  };
  const clear = () => {
    clearBackgroundImage();
    setBg(null);
    setPending(null);
  };
  const onTintPick = (value) => {
    const color = normalizeColor(value);
    if (color) {
      setTint(color);
      setTintState(color);
      setTintText(color);
    }
  };
  const onTintText = (value) => {
    setTintText(value);
    const color = normalizeColor(value);
    if (color) {
      setTint(color);
      setTintState(color);
    }
  };
  const onTintReset = () => {
    setTint(null);
    setTintState(null);
    setTintText('');
  };

  const rowChildren = [
    React.createElement(
      'div',
      { key: 'text', className: 'dusk-bg-rowText' },
      React.createElement('div', { className: 'dusk-bg-title' }, '背景图片'),
      React.createElement(
        'div',
        { className: 'dusk-bg-desc' },
        bg
          ? '已设置本地背景：拖动取景 + 缩放选择图片区域，下方滑杆分别调节主屏与其他界面的透明度'
          : '选择本地图片作为界面背景；「背景底色」可自定义默认背景色，留空则跟随 DSH 浅色/深色/跟随系统'
      ),
      bg
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              'div',
              { className: 'dusk-bg-glassRow' },
              React.createElement('span', { className: 'dusk-bg-glassLabel' }, '界面透明度'),
              React.createElement('input', {
                type: 'range',
                min: GLASS_MIN,
                max: GLASS_MAX,
                step: 1,
                value: bg.glass,
                onChange: (event) => onGlass(event.target.value)
              }),
              React.createElement('span', { className: 'dusk-bg-glassLabel' }, bg.glass + '%')
            ),
            React.createElement(
              'div',
              { className: 'dusk-bg-glassRow' },
              React.createElement('span', { className: 'dusk-bg-glassLabel' }, '其他界面透明度'),
              React.createElement('input', {
                type: 'range',
                min: GLASS_UI_MIN,
                max: GLASS_UI_MAX,
                step: 1,
                value: bg.glassUi,
                onChange: (event) => onGlassUi(event.target.value)
              }),
              React.createElement('span', { className: 'dusk-bg-glassLabel' }, bg.glassUi + '%')
            )
          )
        : null,
      React.createElement(
        'div',
        { className: 'dusk-bg-tintRow' },
        React.createElement('span', { className: 'dusk-bg-glassLabel' }, '背景底色'),
        React.createElement('input', {
          type: 'color',
          value: tint || TINT_FALLBACK,
          onChange: (event) => onTintPick(event.target.value)
        }),
        React.createElement('input', {
          type: 'text',
          className: 'dusk-bg-tintText',
          value: tintText,
          placeholder: '#ffffff 或 rgb(255,255,255)',
          onChange: (event) => onTintText(event.target.value),
          onBlur: () => setTintText(tint || '')
        }),
        tint
          ? React.createElement('button', { type: 'button', className: 'dusk-bg-btn', onClick: onTintReset }, '恢复默认')
          : null
      )
    ),
    React.createElement(
      'div',
      { key: 'control', className: 'dusk-bg-control' },
      bg
        ? React.createElement('span', {
            className: 'dusk-bg-thumb',
            style: { backgroundImage: 'url("' + bg.url + '")' }
          })
        : null,
      bg
        ? React.createElement('button', { type: 'button', className: 'dusk-bg-btn', onClick: onAdjust }, '调整区域')
        : null,
      React.createElement('button', { type: 'button', className: 'dusk-bg-btn', onClick: pick }, bg ? '更换图片' : '选择图片'),
      bg
        ? React.createElement('button', { type: 'button', className: 'dusk-bg-btn dusk-bg-btn-danger', onClick: clear }, '清除')
        : null,
      React.createElement('input', {
        ref: fileRef,
        type: 'file',
        accept: 'image/*',
        style: { display: 'none' },
        onChange: onFile
      })
    )
  ];

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', { className: ROW_CLASS }, rowChildren),
    pending
      ? React.createElement(CropModal, {
          url: pending.url,
          x: pending.x,
          y: pending.y,
          zoom: pending.zoom,
          onCancel: () => setPending(null),
          onConfirm
        })
      : null
  );
}

// —— 皮肤入口 ——
function apply(ctx) {
  const setup = () => {
    // 1. 注入样式（按 tag id 幂等）
    const tagId = SKIN_PACKAGE + '/skin.css';
    let styleTag = document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']');
    if (styleTag === null) {
      styleTag = document.createElement('style');
      styleTag.dataset.plugin = SKIN_PACKAGE;
      styleTag.dataset.pluginCss = tagId;
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
    }

    // 2. 作用域属性（CSS 选择器钩子）
    document.body.setAttribute(SCOPE_ATTR, '');

    // 3. 背景层（z-index:-1，沉底；作为 body 第一个子节点）
    const backdrop = document.createElement('div');
    backdrop.className = BACKDROP_CLASS;
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(backdrop, document.body.firstChild);
    backdropElement = backdrop;

    // 4. 朱砂印章
    const seal = document.createElement('div');
    seal.className = SEAL_CLASS;
    seal.setAttribute('aria-hidden', 'true');
    seal.textContent = '夕';
    document.body.appendChild(seal);

    // 5. 恢复已保存的本地图与背景底色
    const saved = loadSavedBg();
    if (saved) applyBgToBackdrop(saved);
    applyTint(loadTint());

    return () => {
      document.body.removeAttribute(SCOPE_ATTR);
      document.body.classList.remove('dusk-has-image');
      document.body.removeAttribute('data-dusk-tinted');
      document.body.style.removeProperty('--dusk-glass');
      document.body.style.removeProperty('--dusk-glass-ui');
      document.body.style.removeProperty('--dusk-tint');
      styleTag.remove();
      backdrop.remove();
      seal.remove();
      backdropElement = null;
    };
  };

  ctx.effect(setup, 'dsh-dusk-theme: 夕主题皮肤');
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'dusk-background',
    order: 20
  }, BackgroundRow));
}

exports.name = 'dusk-theme';
exports.inject = ['slots'];
exports.apply = apply;
