// ==========================================
// 1. 全局配置与反调试
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode === 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) return false;
    if (e.ctrlKey && e.keyCode === 85) return false;
};

window.tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'], arial: ['Arial', 'sans-serif'] },
            colors: {
                google: {
                    gray: '#f8f9fa',
                    text: '#202124',
                    footer: '#f2f2f2',
                    link: '#70757a'
                }
            },
            animation: { 'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both', 'blob': 'blob 10s infinite', 'spin-slow': 'spin 3s linear infinite' },
            keyframes: {
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' }
                }
            }
        }
    }
};

// ==========================================
// 2. React 应用逻辑
// ==========================================
const { useState, useMemo, useEffect, useRef, useCallback } = React;
const { motion, AnimatePresence, useMotionValue, useTransform, useSpring } = window.Motion;

// --- 核心配置 ---
const CDN_CONFIG = {
  BASE_URL: "https://cdn.jsdelivr.net/gh/moshidi244262/picture@main"
};
const WALLPAPERS = {
  LOCK: CDN_CONFIG.BASE_URL + "/pc.jpg",
  HOME: CDN_CONFIG.BASE_URL + "/senlin.jpg"
};

// --- Crypto Utils ---
const CryptoUtils = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  strToBuf: function (str) { return this.enc.encode(str); },
  hexToBuf: function (hex) {
    const view = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    return view.buffer;
  },
  base64ToBuf: function (b64) {
    const binary_string = window.atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
    return bytes.buffer;
  },
  sha256: async function (str) {
    const buf = this.strToBuf(str);
    const hash = await window.crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },
  deriveKey: async function (password, saltHex) {
    const saltBuf = this.hexToBuf(saltHex);
    const keyMaterial = await window.crypto.subtle.importKey("raw", this.strToBuf(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBuf, iterations: 200000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  },
  decrypt: async function (cipherBase64, key) {
    try {
      const combined = new Uint8Array(this.base64ToBuf(cipherBase64));
      const iv = combined.slice(0, 12);
      const cipher = combined.slice(12);
      const decryptedBuf = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipher);
      return JSON.parse(this.dec.decode(decryptedBuf));
    } catch (e) {
      console.error("Decryption failed", e);
      throw new Error("解密失败：密码错误或数据损坏");
    }
  }
};

const copyToClipboard = async text => {
  if (!text) return false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch (err) {}
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed"; textArea.style.left = "-9999px";
  document.body.appendChild(textArea); textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);
  return successful;
};

// --- 图标组件 ---
const IconBase = ({ children, size = 20, className = "", ...props }) => 
  React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "transition-all " + className, ...props }, children);

const Icons = {
  Key: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "7.5", cy: "15.5", r: "5.5" }), React.createElement("path", { d: "m21 2-9.6 9.6" }), React.createElement("path", { d: "m15.5 7.5 3 3L22 7l-3-3" })),
  Globe: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }), React.createElement("path", { d: "M2 12h20" })),
  Copy: p => React.createElement(IconBase, p, React.createElement("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }), React.createElement("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })),
  Check: p => React.createElement(IconBase, p, React.createElement("polyline", { points: "20 6 9 17 4 12" })),
  Eye: p => React.createElement(IconBase, p, React.createElement("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }), React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
  EyeOff: p => React.createElement(IconBase, p, React.createElement("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }), React.createElement("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }), React.createElement("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c2.36 0 4.48-.83 6.09-2.26" }), React.createElement("line", { x1: "2", x2: "22", y1: "2", y2: "22" })),
  Search: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "11", cy: "11", r: "8" }), React.createElement("path", { d: "m21 21-4.3-4.3" })),
  X: p => React.createElement(IconBase, p, React.createElement("path", { d: "M18 6 6 18" }), React.createElement("path", { d: "m6 6 18 12" })),
  Menu: p => React.createElement(IconBase, p, React.createElement("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), React.createElement("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), React.createElement("line", { x1: "4", x2: "20", y1: "18", y2: "18" })),
  ChevronRight: p => React.createElement(IconBase, p, React.createElement("path", { d: "m9 18 6-6-6-6" })),
  Lock: p => React.createElement(IconBase, p, React.createElement("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })),
  Unlock: p => React.createElement(IconBase, p, React.createElement("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), React.createElement("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })),
  User: p => React.createElement(IconBase, p, React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
  Box: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }), React.createElement("path", { d: "m3.3 7 8.7 5 8.7-5" }), React.createElement("path", { d: "M12 22V12" })),
  Shield: p => React.createElement(IconBase, p, React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
  Gamepad: p => React.createElement(IconBase, p, React.createElement("line", { x1: "6", x2: "10", y1: "12", y2: "12" }), React.createElement("line", { x1: "8", x2: "8", y1: "10", y2: "14" }), React.createElement("line", { x1: "15", x2: "15.01", y1: "13", y2: "13" }), React.createElement("line", { x1: "18", x2: "18.01", y1: "11", y2: "11" }), React.createElement("rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" })),
  Video: p => React.createElement(IconBase, p, React.createElement("polygon", { points: "23 7 16 12 23 17 23 7" }), React.createElement("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2", ry: "2" })),
  MessageCircle: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })),
  BookOpen: p => React.createElement(IconBase, p, React.createElement("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }), React.createElement("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" })),
  Cpu: p => React.createElement(IconBase, p, React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", ry: "2" }), React.createElement("rect", { x: "9", y: "9", width: "6", height: "6" }), React.createElement("line", { x1: "9", x2: "9", y1: "1", y2: "4" }), React.createElement("line", { x1: "15", x2: "15", y1: "1", y2: "4" }), React.createElement("line", { x1: "9", x2: "9", y1: "20", y2: "23" }), React.createElement("line", { x1: "15", x2: "15", y1: "20", y2: "23" }), React.createElement("line", { x1: "20", x2: "23", y1: "9", y2: "9" }), React.createElement("line", { x1: "20", x2: "23", y1: "15", y2: "15" }), React.createElement("line", { x1: "1", x2: "4", y1: "9", y2: "9" }), React.createElement("line", { x1: "1", x2: "4", y1: "15", y2: "15" })),
  Headphones: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), React.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" })),
  Wrench: p => React.createElement(IconBase, p, React.createElement("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })),
  LayoutGrid: p => React.createElement(IconBase, p, React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" }), React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" })),
  Folder: p => React.createElement(IconBase, p, React.createElement("path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" })),
  FolderOpen: p => React.createElement(IconBase, p, React.createElement("path", { d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" })),
  Info: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", x2: "12", y1: "16", y2: "12" }), React.createElement("line", { x1: "12", x2: "12.01", y1: "8", y2: "8" })),
  Download: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), React.createElement("polyline", { points: "7 10 12 15 17 10" }), React.createElement("line", { x1: "12", x2: "12", y1: "15", y2: "3" })),
  Newspaper: p => React.createElement(IconBase, p, React.createElement("path", { d: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" }), React.createElement("path", { d: "M18 14h-8" }), React.createElement("path", { d: "M15 18h-5" }), React.createElement("path", { d: "M10 6h8v4h-8V6Z" })),
  Sun: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "5" }), React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })),
  Moon: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })),
  Ghost: p => React.createElement(IconBase, p, React.createElement("path", { d: "M9 10h.01" }), React.createElement("path", { d: "M15 10h.01" }), React.createElement("path", { d: "M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" })),
  Play: p => React.createElement(IconBase, p, React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" })),
  FileText: p => React.createElement(IconBase, p, React.createElement("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), React.createElement("polyline", { points: "14 2 14 8 20 8" }), React.createElement("line", { x1: "16", x2: "8", y1: "13", y2: "13" }), React.createElement("line", { x1: "16", x2: "8", y1: "17", y2: "17" }), React.createElement("line", { x1: "10", x2: "8", y1: "9", y2: "9" })),
  RefreshCw: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), React.createElement("path", { d: "M3 3v5h5" })),
  RotateRight: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }), React.createElement("path", { d: "M21 3v5h-5" })),
  RotateLeft: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), React.createElement("path", { d: "M3 3v5h5" })),
  FlipHorizontal: p => React.createElement(IconBase, p, React.createElement("path", { d: "m8 21.5-5.5-9.5L8 2.5" }), React.createElement("path", { d: "m16 21.5 5.5-9.5L16 2.5" }), React.createElement("line", { x1: "12", x2: "12", y1: "2", y2: "22" })),
  FlipVertical: p => React.createElement(IconBase, p, React.createElement("path", { d: "m2.5 8 9.5-5.5L21.5 8" }), React.createElement("path", { d: "m2.5 16 9.5 5.5 9.5-5.5" }), React.createElement("line", { x1: "2", x2: "22", y1: "12", y2: "12" })),
  Crop: p => React.createElement(IconBase, p, React.createElement("path", { d: "M6 2v14a2 2 0 0 0 2 2h14" }), React.createElement("path", { d: "M18 22V8a2 2 0 0 0-2-2H2" })),
  Hand: p => React.createElement(IconBase, p, React.createElement("path", { d: "M18 11V6a2 2 0 0 0-4 0v4" }), React.createElement("path", { d: "M14 10V5a2 2 0 0 0-4 0v5" }), React.createElement("path", { d: "M10 9.5V4a2 2 0 0 0-4 0v7.5" }), React.createElement("path", { d: "M6 12v-1a2 2 0 0 0-4 0v6a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8v-7a2 2 0 0 0-4 0v4" })),
};

const CATEGORY_CONFIG = [
  { id: 'all', label: '全部', icon: Icons.LayoutGrid },
  { id: 'news', label: '新闻', icon: Icons.Newspaper },
  { id: 'game', label: '游戏', icon: Icons.Gamepad },
  { id: 'video', label: '视频', icon: Icons.Video },
  { id: 'social', label: '社交', icon: Icons.MessageCircle },
  { id: 'read', label: '阅读', icon: Icons.BookOpen },
  { id: 'ai', label: 'AI', icon: Icons.Cpu },
  { id: 'audio', label: '音频', icon: Icons.Headphones },
  { id: 'tools', label: '工具', icon: Icons.Wrench }
];

// --- 预设的实用工具配置 ---
const TOOLS_CONFIG = [
    { id: 'img-crop', title: '图片裁剪工具', desc: '自由裁剪图片至特定比例并导出高画质结果。', details: '图片裁剪工具允许您上传本地图片，并根据预设或自定义比例进行裁剪。支持旋转、缩放操作，最后可导出为 PNG 或 JPEG 格式的高清图片。', icon: Icons.LayoutGrid, color: 'from-emerald-500 to-teal-500' },
    { id: 'img-remove-bg', title: '智能抠图', desc: '利用AI算法快速识别主体并去除图片背景，生成透明PNG。', details: '一键智能抠图工具，采用先进的边缘检测和图像分割算法。只需上传需要处理的图片，几秒钟内即可自动剥离背景，为您生成带有透明通道的 PNG 素材。', icon: Icons.Sun, color: 'from-blue-500 to-cyan-500' },
    { id: 'json-format', title: 'JSON 格式化', desc: '解析、格式化和校验 JSON 数据结构。', details: '开发人员必备的 JSON 助手。提供语法高亮、自动缩进、错误定位以及折叠/展开等视图操作，让复杂的 JSON 结构一目了然。', icon: Icons.FileText, color: 'from-amber-500 to-orange-500' },
    { id: 'hash-calc', title: 'Hash 计算器', desc: '计算文本或文件的 MD5, SHA-1, SHA-256 等哈希值。', details: '安全且在本地运行的哈希计算工具。支持文本输入和文件拖拽上传，快速生成并比对文件的各种哈希指纹，确保文件完整性。', icon: Icons.Shield, color: 'from-purple-500 to-pink-500' },
    { id: 'adv-calc', title: '高级计算器', desc: '集成科学计算、工程换算与专业公式的复合型计算器。', details: '专为复杂计算设计：支持表达式实时解析、工程单位换算、物理常数库及历史记录。特别针对化工/机械工程及程序开发需求进行了模式优化。', icon: Icons.Cpu, color: 'from-blue-600 to-indigo-600' },
    { id: 'aes-tool', title: '全能 AES 加密', desc: '支持文本与任意文件的 AES-256 本地加密。', details: '采用军事级 AES-256-GCM 算法。完全在浏览器本地运行，数据绝不上传，支持拖拽文件直接加密为专属后缀。',icon: Icons.Shield, color: 'from-teal-500 to-emerald-500' }
];

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !text) return React.createElement(React.Fragment, null, text);
  const textStr = String(text);
  const parts = textStr.split(new RegExp(`(${highlight})`, 'gi'));
  return React.createElement(React.Fragment, null, parts.map((part, index) => part.toLowerCase() === highlight.toLowerCase() ? React.createElement("span", { key: index, className: "bg-yellow-300 dark:bg-yellow-600/50 text-slate-900 dark:text-yellow-50 rounded-sm px-0.5 font-bold shadow-sm" }, part) : part));
};

const BackgroundManager = ({ isLogin }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  useEffect(() => {
    const preloadImage = (src) => new Promise((resolve) => {
      const img = new Image(); img.src = src; img.onload = () => resolve(true); img.onerror = () => resolve(false);
    });
    Promise.all([preloadImage(WALLPAPERS.LOCK), preloadImage(WALLPAPERS.HOME)]).then(() => setImagesLoaded(true));
  }, []);

  return React.createElement("div", { className: "fixed inset-0 z-[-50] bg-manager-layer pointer-events-none bg-slate-800" },
    React.createElement("div", { className: `absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out`, style: { backgroundImage: `url(${WALLPAPERS.HOME})`, opacity: imagesLoaded ? 1 : 0, transitionDelay: '0.3s' } }),
    React.createElement("div", { className: "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out", style: { backgroundImage: `url(${WALLPAPERS.LOCK})`, opacity: isLogin ? 0 : (imagesLoaded ? 1 : 0) } }),
    React.createElement("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-none transition-opacity duration-1000 ease-in-out", style: { opacity: isLogin ? 0 : 1 } }),
    React.createElement("div", { className: "absolute inset-0 bg-slate-100/30 dark:bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-1000 ease-in-out", style: { opacity: isLogin ? 1 : 0 } })
  );
};

const TiltCard = ({ children, className = "", onClick, noBorder = false }) => {
  const ref = useRef(null);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const x = useMotionValue(0); const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
  const handleMouseMove = e => { if (!ref.current || isTouchDevice) return; const rect = ref.current.getBoundingClientRect(); x.set((e.clientX - rect.left) / rect.width - 0.5); y.set((e.clientY - rect.top) / rect.height - 0.5); };
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  
  const cardClass = noBorder ? `bg-white/80 dark:bg-slate-900 shadow-lg backdrop-blur-md rounded-2xl cursor-pointer transform-gpu will-change-transform ${className}` : `glass-card rounded-2xl cursor-pointer transform-gpu will-change-transform ${className}`;
  
  return React.createElement(motion.div, { ref: ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, style: { rotateX: isTouchDevice ? 0 : rotateX, rotateY: isTouchDevice ? 0 : rotateY, transformStyle: "preserve-3d", perspective: 1000 }, whileHover: !isTouchDevice ? { scale: 1.02, zIndex: 10 } : { scale: 0.98 }, whileTap: { scale: 0.95 }, initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" }, className: cardClass, onClick: onClick }, children);
};

const DraggableScrollContainer = ({ children, className = "" }) => {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => { setIsDragging(false); };
    const handleMouseUp = () => { setIsDragging(false); };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; 
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
                e.preventDefault(); 
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    return React.createElement("div", {
        ref: scrollRef,
        className: `overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing ${className}`,
        onMouseDown: handleMouseDown,
        onMouseLeave: handleMouseLeave,
        onMouseUp: handleMouseUp,
        onMouseMove: handleMouseMove,
        style: { userSelect: 'none' } 
    }, children);
};

const ScrollProgressBar = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;
        const target = document.getElementById('root');
        if (!target) return;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = target.scrollTop;
                    const scrollHeight = target.scrollHeight - target.clientHeight;
                    setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) : 0);
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        target.addEventListener('scroll', handleScroll, { passive: true });
        return () => target.removeEventListener('scroll', handleScroll);
    }, []);

    return React.createElement("div", { 
        className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-pink-500 origin-left will-change-transform pointer-events-none", 
        style: { transform: `scaleX(${progress})`, transition: 'none' } 
    });
};

const GenericLockScreen = ({ onUnlock, cipher, salt, title, icon: Icon, colorClass, type, verifyWithServer }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [decrypting, setDecrypting] = useState(false);
  
    const handleSubmit = e => {
      e.preventDefault();
      setDecrypting(true);
      setTimeout(async () => {
        try {
          await verifyWithServer(password, type); 
          const key = await CryptoUtils.deriveKey(password, salt);
          const data = await CryptoUtils.decrypt(cipher, key);
          onUnlock(data);
        } catch (e) {
          console.error(e);
          setError(true); setPassword(''); setTimeout(() => setError(false), 500);
        } finally {
          setDecrypting(false);
        }
      }, 50);
    };
  
    return React.createElement("div", { className: "flex flex-col items-center justify-center min-h-[50vh] w-full" },
      React.createElement(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "glass-panel p-8 rounded-3xl shadow-xl w-full max-w-sm relative flex flex-col items-center text-center" },
        React.createElement("div", { className: `w-16 h-16 rounded-2xl ${colorClass} bg-opacity-20 text-opacity-100 flex items-center justify-center mb-4` }, React.createElement(Icon, { size: 32 })),
        React.createElement("h3", { className: "text-xl font-bold mb-2 dark:text-white" }, title),
        React.createElement("form", { onSubmit: handleSubmit, className: "w-full space-y-4" },
          React.createElement("div", { className: `relative transition-all duration-300 ${error ? 'animate-shake' : ''}` },
            React.createElement("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), className: `w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border outline-none text-center font-mono dark:text-white ${error ? 'border-red-400 focus:ring-2 focus:ring-red-100 text-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-100'}`, autoFocus: true, placeholder: "Enter Password" })
          ),
          React.createElement("button", { type: "submit", disabled: decrypting, className: `w-full py-3 rounded-xl font-bold transition-all shadow-lg text-white ${decrypting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}` }, decrypting ? '云端验证中...' : '解锁进入')
        )
      )
    );
  };

const LoginScreen = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsChecking(true);
    setErrorMsg('');
    try {
      const timestamp = Date.now();
      const transmissionPassword = await CryptoUtils.sha256(password);
      
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: transmissionPassword, timestamp, type: 'login' })
      });
      
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 429) { setLockedUntil(result.unlockTime); throw new Error(result.message || "系统已锁定"); }
        else { throw new Error(result.message || "密码错误"); }
      }
      
      const { salt, token, mainCipher, vaultCipher, abyssCipher } = result;
      const key = await CryptoUtils.deriveKey(password, salt);
      const mainData = await CryptoUtils.decrypt(mainCipher, key);
      sessionStorage.setItem('authToken', token);
      onLoginSuccess(mainData, vaultCipher, abyssCipher, salt);
    } catch (err) { setErrorMsg(err.message); } finally { setIsChecking(false); }
  };

  return React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent overflow-hidden transition-colors" },
    React.createElement("div", { className: "absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-400/30 dark:bg-purple-900/40 mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob" }),
    React.createElement("div", { className: "absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/30 dark:bg-indigo-900/40 mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-2000" }),
    React.createElement(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "glass-panel p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 relative z-10 !bg-white/85 dark:!bg-slate-900/80" },
      React.createElement("div", { className: "flex flex-col items-center mb-8" },
        React.createElement("div", { className: "w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30" }, React.createElement(Icons.Shield, { size: 40 })),
        React.createElement("h2", { className: "text-2xl font-bold dark:text-white" }, "安全登录"),
        React.createElement("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1" }, "保护中")
      ),
      React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" },
        React.createElement("div", { className: `relative transition-all duration-300 ${errorMsg ? 'animate-shake' : ''}` },
          React.createElement(Icons.Key, { className: `absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errorMsg ? 'text-red-400' : 'text-slate-400'}`, size: 20 }),
          lockedUntil > Date.now() ? React.createElement("div", { className: "w-full px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center text-sm font-bold flex items-center justify-center" }, "系统锁定中...") : 
          React.createElement("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "Have a nice day !", className: `w-full px-12 py-3.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border transition-all outline-none text-center tracking-widest text-lg font-mono placeholder:font-sans placeholder:text-sm placeholder:tracking-normal dark:text-white ${errorMsg ? 'border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/50 text-red-500' : 'border-white dark:border-slate-700 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/50'}`, autoFocus: true })
        ),
        errorMsg && React.createElement("p", { className: "text-xs text-center text-red-500 font-bold" }, errorMsg),
        React.createElement("button", { type: "submit", disabled: !password || isChecking || lockedUntil > Date.now(), className: `w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform flex items-center justify-center gap-2 ${!password || isChecking || lockedUntil > Date.now() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'}` }, isChecking ? "服务端验证中..." : lockedUntil > Date.now() ? "已锁定" : "安全验证")
      )
    )
  );
};

const ExportVerifyModal = ({ onClose, onVerifySuccess, exportCipher, salt, verifyWithServer }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    
    const handleSubmit = e => {
      e.preventDefault();
      setIsChecking(true);
      setTimeout(async () => {
        try {
          await verifyWithServer(password, 'export');
          const key = await CryptoUtils.deriveKey(password, salt);
          const decryptedData = await CryptoUtils.decrypt(exportCipher, key);
          onVerifySuccess(JSON.stringify(decryptedData));
        } catch (err) {
          console.error(err);
          setError(true); setPassword(''); setTimeout(() => setError(false), 500);
        } finally { setIsChecking(false); }
      }, 50);
    };
    return React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" },
      React.createElement(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "glass-panel p-6 rounded-2xl shadow-2xl w-full max-w-sm relative" },
        React.createElement("button", { onClick: onClose, className: "absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" }, React.createElement(Icons.X, { size: 20 })),
        React.createElement("h3", { className: "text-xl font-bold mb-4 text-center dark:text-white flex items-center justify-center gap-2" }, React.createElement(Icons.Lock, { size: 20, className: "text-rose-500" }), "安全导出验证"),
        React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" },
          React.createElement("div", { className: `relative transition-all duration-300 ${error ? 'animate-shake' : ''}` },
            React.createElement("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), className: `w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border outline-none text-center font-mono dark:text-white ${error ? 'border-red-400 focus:ring-2 focus:ring-red-100 text-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-100'}`, autoFocus: true, placeholder: "Export Password" })
          ),
          React.createElement("button", { type: "submit", disabled: isChecking, className: `w-full py-3 rounded-xl text-white font-bold transition-all ${isChecking ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}` }, isChecking ? '云端校验中...' : '解密并导出')
        )
      )
    );
};

const GameDetailsModal = ({ item, onClose, onLaunch, onOpenFolder }) => {
    return React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" },
        React.createElement(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative" },
            React.createElement("div", { className: "h-48 sm:h-64 w-full relative shrink-0" },
                React.createElement("img", { src: item.cover, className: "w-full h-full object-cover" }),
                React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" }),
                React.createElement("button", { onClick: onClose, className: "absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors" }, React.createElement(Icons.X, { size: 20 })),
                React.createElement("div", { className: "absolute bottom-4 left-6" },
                   React.createElement("h2", { className: "text-3xl font-bold text-white shadow-sm" }, item.title),
                   React.createElement("div", { className: "flex gap-2 mt-2" },
                      React.createElement("span", { className: "px-2 py-0.5 rounded text-xs font-bold bg-indigo-500 text-white" }, item.type),
                      React.createElement("span", { className: "px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white backdrop-blur-md" }, item.version)
                   )
                )
            ),
            React.createElement("div", { className: "p-6 overflow-y-auto flex-1 custom-scrollbar" },
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" },
                    React.createElement("button", { onClick: () => onLaunch(item), className: "flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all" }, React.createElement(Icons.Play, { size: 20, fill: "currentColor" }), "启动游戏"),
                    React.createElement("button", { onClick: () => onOpenFolder(item), className: "flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all" }, React.createElement(Icons.FolderOpen, { size: 20 }), "打开文件夹")
                ),
                React.createElement("h3", { className: "text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2" }, React.createElement(Icons.FileText, { size: 18 }), "游戏详情"),
                React.createElement("div", { className: "prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap break-words leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700" }, item.details || item.desc)
            )
        )
    );
};

// --- 工具详情模态框 ---
const ToolDetailsModal = ({ item, onClose, onLaunch }) => {
    return React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" },
        React.createElement(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative" },
            React.createElement("div", { className: `h-32 w-full relative shrink-0 bg-gradient-to-br ${item.color || 'from-slate-700 to-slate-800'} flex items-center justify-center` },
                React.createElement(item.icon || Icons.Wrench, { size: 64, className: "text-white/30" }),
                React.createElement("button", { onClick: onClose, className: "absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors" }, React.createElement(Icons.X, { size: 20 }))
            ),
            React.createElement("div", { className: "p-6 overflow-y-auto flex-1 custom-scrollbar relative -mt-10" },
                React.createElement("div", { className: `w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color || 'from-emerald-500 to-teal-500'} flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-4 border-4 border-white dark:border-slate-900` },
                    React.createElement(item.icon || Icons.Wrench, { size: 36 })
                ),
                React.createElement("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white mb-2" }, item.title),
                React.createElement("div", { className: "flex gap-2 mb-6" },
                    React.createElement("span", { className: "px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" }, "实用工具"),
                    React.createElement("span", { className: "px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" }, "Beta模块")
                ),
                React.createElement("div", { className: "prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap break-words leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6" }, 
                    item.details || item.desc || "暂无详细介绍。"
                ),
                React.createElement("button", { onClick: () => { onClose(); onLaunch(item); }, className: "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold shadow-lg transition-all" }, 
                    React.createElement(Icons.Play, { size: 20, fill: "currentColor" }), "启动工具"
                )
            )
        )
    );
};

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return React.createElement(motion.div, { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, className: "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[110] w-max max-w-[90%]" },
    React.createElement("div", { className: "px-6 py-3 rounded-full shadow-2xl glass-panel flex items-center gap-3" },
      React.createElement("div", { className: `rounded-full p-0.5 ${type === 'info' ? 'bg-blue-500' : type === 'error' ? 'bg-red-500' : 'bg-green-500'}` }, type === 'info' ? React.createElement(Icons.Info, { size: 14, className: "text-white", strokeWidth: 3 }) : type === 'error' ? React.createElement(Icons.X, { size: 14, className: "text-white", strokeWidth: 3 }) : React.createElement(Icons.Check, { size: 14, className: "text-white", strokeWidth: 3 })),
      React.createElement("span", { className: "text-sm font-medium dark:text-slate-200" }, message)
    )
  );
};

// --- 工具卡片组件 ---
const ToolCard = ({ item, onClick, onShowDetails, searchQuery }) => {
    const colorClass = item.color || "from-emerald-500 to-teal-500";
    return React.createElement(TiltCard, { className: "flex flex-col h-full group p-5 relative overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700", onClick: () => onClick(item) },
        React.createElement("div", { className: `absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-10 dark:opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-500 pointer-events-none` }),
        React.createElement("div", { className: "flex justify-between items-start mb-4 relative z-10" },
            React.createElement("div", { className: `w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300` },
                React.createElement(item.icon, { size: 24 })
            ),
            React.createElement("button", { onClick: (e) => { e.stopPropagation(); onShowDetails(item); }, className: "p-2 text-slate-400 hover:text-emerald-500 bg-slate-50 dark:bg-slate-900/50 rounded-full transition-colors backdrop-blur-sm", title: "详情" },
                React.createElement(Icons.Info, { size: 18 })
            )
        ),
        React.createElement("h3", { className: "font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 relative z-10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" }, React.createElement(HighlightText, { text: item.title, highlight: searchQuery })),
        React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 line-clamp-2 relative z-10 flex-1" }, React.createElement(HighlightText, { text: item.desc, highlight: searchQuery }))
    );
};

const AbyssGameCard = ({ item, onLaunch, onOpenFolder, onShowDetails }) => {
    return React.createElement(TiltCard, { noBorder: true, className: "flex flex-col group overflow-hidden bg-slate-900 !p-0" },
        React.createElement("div", { className: "aspect-video w-full relative overflow-hidden bg-slate-900", onClick: () => onLaunch(item) },
            React.createElement("img", { 
                src: item.cover, 
                alt: item.title, 
                className: "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                loading: "lazy"
            }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-90" }),
            React.createElement("div", { className: "absolute top-2 left-2 flex gap-1" },
                React.createElement("span", { className: "px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded shadow-sm uppercase" }, item.type),
                React.createElement("span", { className: "px-1.5 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded shadow-sm backdrop-blur-md" }, item.version)
            ),
            React.createElement("div", { className: "absolute bottom-0 left-0 w-full p-3" },
                React.createElement("h3", { className: "text-white font-bold text-lg truncate leading-tight shadow-black/50 drop-shadow-md" }, item.title)
            )
        ),
        React.createElement("div", { className: "p-2 flex items-center justify-between bg-slate-800 border-t border-slate-700 relative z-10 -mt-px" },
             React.createElement("div", { className: "flex gap-1" },
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); onOpenFolder(item); }, className: "p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors", title: "文件夹" }, React.createElement(Icons.Folder, { size: 16 })),
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); onLaunch(item); }, className: "p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors", title: "启动" }, React.createElement(Icons.Play, { size: 16, fill: "currentColor" }))
             ),
             React.createElement("button", { onClick: (e) => { e.stopPropagation(); onShowDetails(item); }, className: "p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors", title: "详情" }, React.createElement(Icons.Info, { size: 16 }))
        )
    );
};

const GameCard = ({ item, onLaunch, onOpenFolder, searchQuery }) => {
    const isSteam = item.platform === 'steam';
    
    const getCoverUrl = (cover) => {
        if (!cover) return null;
        if (cover.startsWith('http') || cover.startsWith('data:')) return cover;
        if (cover.startsWith('./')) return `${CDN_CONFIG.BASE_URL}${cover.substring(1)}`;
        return cover;
    };
    const coverUrl = getCoverUrl(item.cover);

    return React.createElement(TiltCard, { noBorder: true, className: "flex flex-col group overflow-visible", onClick: () => onLaunch(item) },
      React.createElement("div", { className: "aspect-[16/9] relative bg-slate-900 game-card-mask" }, 
        coverUrl ? React.createElement("img", { src: coverUrl, alt: item.title, className: "w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity transform-gpu" }) : React.createElement("div", { className: `w-full h-full bg-gradient-to-br ${item.color || 'from-indigo-600 to-purple-600'} flex items-center justify-center` }, React.createElement(Icons.Gamepad, { size: 40, className: "text-white/30" })),
        React.createElement("div", { className: "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md" }, isSteam ? 'STEAM' : 'LOCAL')
      ),
      React.createElement("div", { className: "p-4 flex items-start justify-between gap-2" },
        React.createElement("div", { className: "flex-1 min-w-0" }, React.createElement("h3", { className: "font-bold text-slate-800 dark:text-slate-100 truncate mb-1" }, React.createElement(HighlightText, { text: item.title, highlight: searchQuery })), React.createElement("p", { className: "text-xs text-slate-500 line-clamp-1 flex items-center gap-1.5" }, isSteam ? React.createElement(Icons.Cpu, { size: 12 }) : React.createElement(Icons.Folder, { size: 12 }), React.createElement(HighlightText, { text: item.desc, highlight: searchQuery }))),
        React.createElement("button", { onClick: e => { e.stopPropagation(); onOpenFolder(item); }, className: "p-2 -mr-2 -mt-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all" }, React.createElement(Icons.FolderOpen, { size: 18 }))
      )
    );
};

const PasswordCard = ({ item, onCopy, globalReveal, searchQuery }) => {
    const [pwdVisible, setPwdVisible] = useState(false); const [accVisible, setAccVisible] = useState(false); const [copied, setCopied] = useState(null);
    useEffect(() => { setPwdVisible(globalReveal); setAccVisible(globalReveal); }, [globalReveal]);
    const handleCopy = async (text, type) => { const success = await copyToClipboard(text); if (success) { onCopy(type === 'account' ? '账号已复制' : '密码已复制'); setCopied(type); if (type === 'account') setAccVisible(false); if (type === 'password') setPwdVisible(false); setTimeout(() => setCopied(null), 1500); } };
    return React.createElement(TiltCard, { className: "flex flex-col h-full border-l-4 border-l-indigo-500 p-5" },
      React.createElement("div", { className: "flex justify-between items-start mb-4" }, React.createElement("div", { className: "flex items-center gap-2" }, React.createElement("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400" }, React.createElement(Icons.Lock, { size: 18 })), React.createElement("h3", { className: "font-bold text-slate-700 dark:text-slate-200" }, React.createElement(HighlightText, { text: item.title, highlight: searchQuery }))), item.note && React.createElement("div", { className: "text-slate-300 dark:text-slate-600 hover:text-indigo-400", title: item.note }, React.createElement(Icons.Box, { size: 16 }))),
      React.createElement("div", { className: "space-y-3 mt-auto" }, 
        React.createElement("div", { className: "group/field relative bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700" }, React.createElement("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1" }, "Account"), React.createElement("div", { className: "flex items-center justify-between" }, React.createElement("span", { className: "font-mono text-sm text-slate-700 dark:text-slate-300 truncate select-all" }, accVisible ? React.createElement(HighlightText, { text: item.account, highlight: searchQuery }) : '••••••••'), React.createElement("div", { className: "flex items-center gap-1 opacity-80 group-hover/field:opacity-100" }, React.createElement("button", { onClick: () => setAccVisible(!accVisible), className: "p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white" }, React.createElement(Icons.Eye, { size: 14 })), React.createElement("button", { onClick: () => handleCopy(item.account, 'account'), className: "p-1.5 text-slate-400 hover:text-indigo-600" }, copied === 'account' ? React.createElement(Icons.Check, { size: 14 }) : React.createElement(Icons.Copy, { size: 14 }))))),
        React.createElement("div", { className: "group/field relative bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700" }, React.createElement("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1" }, "Password"), React.createElement("div", { className: "flex items-center justify-between" }, React.createElement("span", { className: "font-mono text-sm text-slate-700 dark:text-slate-300 truncate" }, pwdVisible ? item.password : '••••••••••••'), React.createElement("div", { className: "flex items-center gap-1 opacity-80 group-hover/field:opacity-100" }, React.createElement("button", { onClick: () => setPwdVisible(!pwdVisible), className: "p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white" }, React.createElement(Icons.Eye, { size: 14 })), React.createElement("button", { onClick: () => handleCopy(item.password, 'password'), className: "p-1.5 text-slate-400 hover:text-indigo-600" }, copied === 'password' ? React.createElement(Icons.Check, { size: 14 }) : React.createElement(Icons.Copy, { size: 14 })))))
      )
    );
};

const WebsiteCard = ({ item, onCopy, searchQuery }) => {
    const CategoryIcon = CATEGORY_CONFIG.find(c => c.id === item.category)?.icon || Icons.Globe;
    return React.createElement(TiltCard, { className: "h-full flex flex-col relative p-5 group", onClick: () => window.open(item.url.startsWith('http') ? item.url : `http://${item.url}`, '_blank') },
      React.createElement("div", { className: "flex items-start justify-between mb-3" }, React.createElement("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" }, React.createElement(CategoryIcon, { size: 20 })), React.createElement("button", { onClick: e => { e.stopPropagation(); copyToClipboard(item.url); onCopy(`已复制: ${item.name}`); }, className: "p-2 text-slate-400 hover:text-blue-500" }, React.createElement(Icons.Copy, { size: 16 }))),
      React.createElement("h3", { className: "font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 transition-colors" }, React.createElement(HighlightText, { text: item.name, highlight: searchQuery })),
      React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1" }, React.createElement(HighlightText, { text: item.desc, highlight: searchQuery })),
      React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between" }, React.createElement("div", { className: "text-[10px] text-slate-400 font-mono truncate max-w-[70%]" }, item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')), React.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase font-bold" }, item.category || 'WEB'))
    );
};

const StealthScreen = ({ onExit }) => {
    return React.createElement("div", { 
        className: "fixed inset-0 bg-white z-[9999] flex flex-col font-arial select-none",
        onDoubleClick: onExit,
        style: { fontFamily: 'arial, sans-serif' }
    },
        React.createElement("div", { className: "flex justify-end items-center p-3 gap-4 text-sm" },
            React.createElement("a", { href: "#", className: "text-[#202124] hover:underline" }, "Gmail"),
            React.createElement("a", { href: "#", className: "text-[#202124] hover:underline" }, "图片"),
            React.createElement("div", { className: "p-2 rounded-full hover:bg-gray-100 cursor-pointer text-[#5f6368]" },
                React.createElement("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", fill: "currentColor" },
                    React.createElement("path", { d: "M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z" })
                )
            ),
            React.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium cursor-pointer" }, "M")
        ),

        React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center -mt-20" },
            React.createElement("img", { 
                src: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", 
                alt: "Google", 
                width: "272", 
                height: "92",
                className: "mb-8" 
            }),
            
            React.createElement("div", { className: "flex w-full max-w-[584px] border border-gray-200 rounded-full hover:shadow-md px-4 py-3 items-center mb-7 group focus-within:shadow-md transition-shadow" },
                React.createElement("svg", { className: "w-5 h-5 text-[#9aa0a6] mr-3", fill: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement("path", { d: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" })
                ),
                React.createElement("input", { type: "text", className: "flex-1 outline-none text-[16px] text-[#202124]" }),
                
                React.createElement("svg", { className: "w-6 h-6 text-blue-500 cursor-pointer mr-3", viewBox: "0 0 24 24", fill: "currentColor" },
                    React.createElement("path", { d: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" }),
                    React.createElement("path", { d: "M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" })
                ),
                
                React.createElement("svg", { className: "w-6 h-6 text-blue-500 cursor-pointer", viewBox: "0 0 24 24", fill: "currentColor" },
                    React.createElement("path", { d: "M12,8.8c1.93,0 3.5,1.57 3.5,3.5c0,1.93 -1.57,3.5 -3.5,3.5c-1.93,0 -3.5,-1.57 -3.5,-3.5c0,-1.93 1.57,-3.5 3.5,-3.5ZM12,10.5c-0.99,0 -1.8,0.81 -1.8,1.8c0,0.99 0.81,1.8 1.8,1.8c0.99,0 1.8,-0.81 1.8,-1.8c0,-0.99 -0.81,-1.8 -1.8,-1.8Z" }),
                    React.createElement("path", { d: "M20,6h-2.5l-2.09,-2.09c-0.38,-0.38 -0.89,-0.6 -1.41,-0.6h-4c-0.52,0 -1.03,0.22 -1.41,0.6L6.5,6h-2.5c-1.1,0 -2,0.9 -2,2v10c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2v-10c0,-1.1 -0.9,-2 -2,-2ZM20,18h-16v-10h4.38l0.29,-0.29l1.71,-1.71h5.24l1.71,1.71l0.29,0.29h2.38v10Z" })
                )
            ),

            React.createElement("div", { className: "flex gap-3" },
                React.createElement("button", { className: "bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm px-4 py-2 text-sm text-[#3c4043] rounded bg-opacity-0" }, "Google 搜索"),
                React.createElement("button", { className: "bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm px-4 py-2 text-sm text-[#3c4043] rounded bg-opacity-0" }, "手气不错")
            )
        ),

        React.createElement("div", { className: "bg-[#f2f2f2] text-[#70757a] text-sm" },
            React.createElement("div", { className: "px-7 py-3 border-b border-[#dadce0]" }, "中国"),
            React.createElement("div", { className: "px-7 py-3 flex flex-wrap justify-between" },
                React.createElement("div", { className: "flex gap-7" },
                    React.createElement("a", { href: "#", className: "hover:underline" }, "关于"),
                    React.createElement("a", { href: "#", className: "hover:underline" }, "广告"),
                    React.createElement("a", { href: "#", className: "hover:underline" }, "商务"),
                    React.createElement("a", { href: "#", className: "hover:underline" }, "Google 搜索运行机制")
                ),
                React.createElement("div", { className: "flex gap-7" },
                    React.createElement("a", { href: "#", className: "hover:underline" }, "隐私权"),
                    React.createElement("a", { href: "#", className: "hover:underline" }, "条款"),
                    React.createElement("a", { href: "#", className: "hover:underline" }, "设置")
                )
            )
        )
    );
};

// ==========================================
// 动态内部模块加载器 (针对需要在主内容区渲染的侧边栏模块)
// ==========================================
const DynamicModuleLoader = ({ moduleName, fileName, propsToPass }) => {
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 初始化全局命名空间
        window.AppModules = window.AppModules || {};

        if (window.AppModules[moduleName]) {
            setComponent(() => window.AppModules[moduleName]);
            return;
        }

        const script = document.createElement('script');
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '/');
        script.src = `${basePath}${fileName}?v=${Date.now()}`; // 破除缓存

        script.onload = () => {
            if (window.AppModules[moduleName]) {
                setComponent(() => window.AppModules[moduleName]);
            } else {
                setError(`模块加载成功，但未找到入口组件: ${moduleName}。请检查文件内容。`);
            }
        };

        script.onerror = () => setError(`网络错误：无法加载模块文件 ${fileName}`);

        document.body.appendChild(script);

    }, [moduleName, fileName]);

    if (error) {
        return React.createElement("div", { className: "p-8 text-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl border border-rose-200 dark:border-rose-800" }, 
            React.createElement("h3", { className: "font-bold text-lg mb-2" }, "模块加载失败"),
            React.createElement("p", { className: "text-sm" }, error)
        );
    }
    
    if (!Component) {
        return React.createElement("div", { className: "py-32 flex flex-col items-center justify-center gap-4 text-cyan-500" }, 
            React.createElement("div", { className: "animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500" }),
            React.createElement("span", { className: "text-sm font-bold animate-pulse" }, "正在开启炼器炉...")
        );
    }

    return React.createElement(Component, propsToPass);
};


// ==========================================
// 3. 主应用程序控制台
// ==========================================
const App = () => {
  const [salt, setSalt] = useState(null);
  const [mainData, setMainData] = useState(null);
  const [encryptedVault, setEncryptedVault] = useState(null);
  const [vaultData, setVaultData] = useState(null);
  
  const [encryptedAbyss, setEncryptedAbyss] = useState(null);
  const [abyssData, setAbyssData] = useState(null);
  const [abyssTab, setAbyssTab] = useState('all'); 
  const [selectedAbyssGame, setSelectedAbyssGame] = useState(null);
  
  const [selectedToolDetails, setSelectedToolDetails] = useState(null);
  
  const [activeTab, setActiveTab] = useState('websites');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [globalReveal, setGlobalReveal] = useState(false);

  const [isStealthMode, setIsStealthMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isExportVerifying, setIsExportVerifying] = useState(false);

  const vaultTimer = useRef(null);
  const abyssTimer = useRef(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const verifyWithServer = async (password, type) => {
      const transmissionPassword = await CryptoUtils.sha256(password);
      
      const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              password: transmissionPassword, 
              timestamp: Date.now(), 
              type: type 
          })
      });

      const result = await response.json();

      if (!response.ok) {
          if (response.status === 429) {
              handleLogout();
              alert(`🚨 系统安全警报：${result.message}`);
              throw new Error("IP LOCKED");
          } else {
              throw new Error(result.message || "验证失败");
          }
      }
      
      return true; 
  };

  const resetVaultTimer = useCallback(() => {
    if (!vaultData) return;
    if (vaultTimer.current) clearTimeout(vaultTimer.current);
    vaultTimer.current = setTimeout(() => { setVaultData(null); showToast("密码库已自动锁定", "info"); }, 10 * 60 * 1000);
  }, [vaultData]);

  const resetAbyssTimer = useCallback(() => {
    if (!abyssData) return;
    if (abyssTimer.current) clearTimeout(abyssTimer.current);
    abyssTimer.current = setTimeout(() => { setAbyssData(null); showToast("心之渊已自动锁定", "info"); }, 5 * 60 * 1000);
  }, [abyssData]);

  const handleLogout = useCallback(() => {
      setMainData(null);
      setVaultData(null);
      setAbyssData(null);
      setSalt(null);
      sessionStorage.removeItem('authToken');
      setIsStealthMode(false); 
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            if (isStealthMode) {
                handleLogout();
            } else {
                if (mainData) setIsStealthMode(true);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStealthMode, mainData, handleLogout]);

  useEffect(() => {
    if (vaultData) { ['mousemove', 'keydown', 'click'].forEach(e => window.addEventListener(e, resetVaultTimer)); resetVaultTimer(); }
    return () => { ['mousemove', 'keydown', 'click'].forEach(e => window.removeEventListener(e, resetVaultTimer)); clearTimeout(vaultTimer.current); };
  }, [vaultData, resetVaultTimer]);

  useEffect(() => {
    if (abyssData) { ['mousemove', 'keydown', 'click'].forEach(e => window.addEventListener(e, resetAbyssTimer)); resetAbyssTimer(); }
    return () => { ['mousemove', 'keydown', 'click'].forEach(e => window.removeEventListener(e, resetAbyssTimer)); clearTimeout(abyssTimer.current); };
  }, [abyssData, resetAbyssTimer]);

  useEffect(() => {
      if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('darkMode', 'true'); } 
      else { document.documentElement.classList.remove('dark'); localStorage.setItem('darkMode', 'false'); }
  }, [isDarkMode]);

  const handleLaunch = async (item, isAbyss = false) => {
      const action = item.action.replace(/^['"]|['"]$/g, '');
      if (item.platform === 'steam' && !isAbyss) {
          window.location.href = `steam://run/${action}`;
          showToast(`正在唤起 Steam: ${item.title}`);
      } else {
          const success = await copyToClipboard(action);
          success ? showToast(`已复制启动路径 (Win+R粘贴)`, 'success') : showToast('复制失败', 'error');
      }
  };

  const handleOpenFolder = async (item) => {
      let path = item.action.replace(/^['"]|['"]$/g, '');
      if (item.folder) path = item.folder.replace(/^['"]|['"]$/g, '');
      else {
          const lastSlash = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
          if (lastSlash > 0) path = path.substring(0, lastSlash);
      }
      const success = await copyToClipboard(path);
      success ? showToast(`已复制文件夹路径`, 'success') : showToast('复制失败', 'error');
  };

  const handleOpenTool = (tool) => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const targetUrl = `?tool=${tool.id}`;

    if (isPWA && isMobile) {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.target = '_blank';
        a.rel = 'external noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        window.open(targetUrl, '_blank');
    }
  };

  const executeExport = decryptedJsonString => {
      try {
        const dataToExport = JSON.parse(decryptedJsonString);
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Moyer_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('导出成功', 'success');
      } catch (err) { showToast('导出失败', 'error'); }
  };

  const displayData = useMemo(() => {
      if (!mainData) return { websites: [], games: [], passwords: [], abyss: [], tools: [] };
      let websites = mainData.websites || [];
      let games = mainData.games || [];
      let passwords = vaultData || [];
      let abyss = (abyssData && abyssData.abyss) || [];
      let tools = mainData.tools || TOOLS_CONFIG; 

      const query = searchQuery.toLowerCase().trim();
      if (query) {
          const matches = str => String(str).toLowerCase().includes(query);
          websites = websites.filter(i => matches(i.name) || matches(i.url));
          games = games.filter(i => matches(i.title));
          passwords = passwords.filter(i => matches(i.title) || matches(i.account));
          abyss = abyss.filter(i => matches(i.title) || matches(i.desc));
          tools = tools.filter(i => matches(i.title) || matches(i.desc));
      } else {
          if (activeTab === 'websites' && activeCategory !== 'all') websites = websites.filter(i => i.category === activeCategory);
          if (activeTab === 'abyss' && abyssTab !== 'all') abyss = abyss.filter(i => i.type === abyssTab);
      }
      return { websites, games, passwords, abyss, tools };
  }, [searchQuery, activeTab, activeCategory, abyssTab, mainData, vaultData, abyssData]);

  if (isStealthMode) return React.createElement(StealthScreen, { onExit: handleLogout }); 

  return React.createElement("div", { className: isDarkMode ? 'dark h-full' : 'h-full' }, 
    React.createElement(BackgroundManager, { isLogin: !!mainData }),
    (!mainData || !salt) ? React.createElement(LoginScreen, { onLoginSuccess: (m, v, a, s) => { setSalt(s); setMainData(m); setEncryptedVault(v); setEncryptedAbyss(a); } }) : 
    React.createElement("div", { className: "min-h-full relative flex" },
        isSidebarOpen && React.createElement("div", { className: "fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden", onClick: () => setSidebarOpen(false) }),
        React.createElement("aside", { className: `fixed top-0 left-0 h-full w-72 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-r border-white/40 dark:border-slate-700/30 z-40 flex flex-col transition-transform duration-300 overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}` },
           React.createElement("div", { className: "p-8 pb-4 relative z-10" },
              React.createElement("div", { className: "flex items-center gap-3 text-slate-800 dark:text-white mb-8" },
                 React.createElement("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg" }, React.createElement(Icons.Box, { size: 20 })),
                 React.createElement("div", null, React.createElement("h1", { className: "font-bold text-xl leading-none" }, "收藏"), React.createElement("span", { className: "text-xs text-slate-500 uppercase" }, "Moyer 空间"))
              ),
              React.createElement("nav", { className: "space-y-2" }, [
                  { id: 'websites', label: '传送门', icon: Icons.Globe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/40' },
                  { id: 'games', label: '游戏库', icon: Icons.Gamepad, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/40' },
                  { id: 'tools', label: '工具栏', icon: Icons.Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/40' }, 
                  { id: 'library', label: '山海阁', icon: Icons.BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/40' }, // --- 新增：山海阁入口 ---
                  { id: 'passwords', label: '密码库', icon: Icons.Key, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/40', locked: !vaultData },
                  { id: 'abyss', label: '心之渊', icon: Icons.Ghost, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/40', locked: !abyssData }
              ].map(item => {
                  const isActive = !searchQuery && activeTab === item.id;
                  return React.createElement("button", { key: item.id, onClick: () => { setActiveTab(item.id); setSearchQuery(''); setSidebarOpen(false); 
                    const rootEl = document.getElementById('root');
                    if (rootEl) rootEl.scrollTo({ top: 0, behavior: 'instant' });
                  }, className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/80 dark:bg-slate-800/80 shadow-md text-slate-800 dark:text-white' : 'hover:bg-white/40 text-slate-600 dark:text-slate-300'}` },
                      React.createElement("div", { className: `p-2 rounded-lg ${isActive ? `${item.bg} ${item.color}` : 'bg-white/50 dark:bg-slate-800/50'}` }, React.createElement(item.icon, { size: 18 })),
                      React.createElement("span", { className: "font-medium" }, item.label),
                      item.locked && React.createElement(Icons.Lock, { size: 12, className: "ml-auto text-slate-400" })
                  );
              }))
           ),
           React.createElement("div", { className: "mt-auto p-6 space-y-4 border-t border-slate-200/30" }, 
              React.createElement("button", { onClick: () => setIsExportVerifying(true), className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-xl text-sm font-medium border border-white/50 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-200" }, React.createElement(Icons.Download, { size: 16 }), "导出数据"),
              React.createElement("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700" }, React.createElement("div", { className: "w-10 h-10 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 p-0.5" }, React.createElement("div", { className: "w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center" }, React.createElement(Icons.User, { size: 20, className: "text-orange-400" }))), React.createElement("div", null, React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, "魔师帝"), React.createElement("p", { className: "text-xs text-slate-500" }, "Admin")))
           )
        ),

        React.createElement("main", { className: "flex-1 min-w-0 lg:ml-72" },
           React.createElement("header", { className: "sticky top-0 z-20 px-6 py-4 glass-panel border-x-0 border-t-0 bg-transparent relative" },
              React.createElement("div", { className: "max-w-5xl mx-auto flex items-center gap-2 sm:gap-4" },
                 React.createElement("div", { className: "flex items-center -ml-2 shrink-0" }, 
                     React.createElement("button", { onClick: () => setSidebarOpen(true), className: "p-2 lg:hidden text-slate-500 hover:text-indigo-600 transition-colors" }, React.createElement(Icons.Menu, { size: 24 })),
                     React.createElement("button", { onClick: () => window.location.reload(), className: "p-2 text-slate-500 hover:text-indigo-600 transition-colors", title: "刷新网页" }, React.createElement(Icons.RefreshCw, { size: 20 }))
                 ),
                 React.createElement("div", { className: "relative flex-1 max-w-2xl group" }, React.createElement(Icons.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 20 }), React.createElement("input", { type: "text", placeholder: "搜索...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: "w-full pl-12 pr-10 py-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none text-slate-700 dark:text-white" })),
                 React.createElement("button", { onClick: () => setIsDarkMode(!isDarkMode), className: "p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 shrink-0" }, isDarkMode ? React.createElement(Icons.Sun, { size: 20 }) : React.createElement(Icons.Moon, { size: 20 }))
              ),
              React.createElement(ScrollProgressBar, null)
           ),

           React.createElement("div", { className: "p-6 md:p-8 max-w-7xl mx-auto pb-24 min-h-screen" },
               
               // --- 新增：山海阁动态加载区块 ---
               (activeTab === 'library') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: searchQuery ? "mb-12" : "" },
                   React.createElement(DynamicModuleLoader, {
                       moduleName: 'ShanHaiGe',
                       fileName: 'shanhaige.js',
                       propsToPass: { showToast, searchQuery, Icons, mainData, TiltCard, HighlightText } // 传入所需依赖
                   })
               ),

               (searchQuery || activeTab === 'passwords') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: searchQuery ? "mb-12" : "" },
                  (activeTab === 'passwords' && !vaultData && !searchQuery) ? 
                  React.createElement(GenericLockScreen, { title: "密码库已锁定", icon: Icons.Lock, colorClass: "bg-indigo-500 text-indigo-500", cipher: encryptedVault, salt: salt, onUnlock: (data) => setVaultData(data.passwords || []), type: "vault", verifyWithServer: verifyWithServer }) :
                  (vaultData && (displayData.passwords.length > 0 || activeTab === 'passwords')) && React.createElement(React.Fragment, null, 
                      React.createElement("div", { className: "flex items-center justify-between mb-6" }, React.createElement("h2", { className: "text-2xl font-bold flex items-center gap-3" }, React.createElement(Icons.Key, { className: "text-indigo-600" }), "密码保存站"), React.createElement("button", { onClick: () => setGlobalReveal(!globalReveal), className: "px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-sm font-medium flex gap-2" }, globalReveal ? React.createElement(Icons.EyeOff, { size: 16 }) : React.createElement(Icons.Eye, { size: 16 }), globalReveal ? '全局屏蔽' : '全局显示')),
                      React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }, displayData.passwords.map(item => React.createElement(PasswordCard, { key: item.id, item: item, onCopy: showToast, globalReveal: globalReveal, searchQuery: searchQuery })))
                  )
               ),

               (searchQuery || activeTab === 'abyss') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: searchQuery ? "mb-12" : "" },
                   (activeTab === 'abyss' && !abyssData && !searchQuery) ? 
                   React.createElement(GenericLockScreen, { title: "心之渊", icon: Icons.Ghost, colorClass: "bg-red-600 text-red-600", cipher: encryptedAbyss, salt: salt, onUnlock: setAbyssData, type: "abyss", verifyWithServer: verifyWithServer }) :
                   (abyssData && (displayData.abyss.length > 0 || activeTab === 'abyss')) && React.createElement(React.Fragment, null,
                       React.createElement("div", { className: "flex flex-col items-center gap-4 mb-8" }, 
                           React.createElement("h2", { className: "text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-red-400 self-start md:self-auto" }, React.createElement(Icons.Ghost, { className: "text-red-600" }), "心之渊"),
                           !searchQuery && React.createElement(DraggableScrollContainer, { className: "flex gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl max-w-full" },
                               [{id: 'all', label: '全部'}, {id: 'RPG', label: 'RPG'}, {id: 'ADV', label: 'ADV'}, {id: 'SLG', label: 'SLG'}, {id: 'ACT', label: 'ACT'}].map(t => React.createElement("button", { key: t.id, onClick: () => setAbyssTab(t.id), className: `px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${abyssTab === t.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}` }, t.label))
                           )
                       ),
                       React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" }, 
                           displayData.abyss.map(item => React.createElement(AbyssGameCard, { 
                               key: item.id, 
                               item: item, 
                               onLaunch: (i) => handleLaunch(i, true), 
                               onOpenFolder: handleOpenFolder,
                               onShowDetails: setSelectedAbyssGame
                           }))
                       )
                   )
               ),

               (searchQuery || activeTab === 'games') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: searchQuery ? "mb-12" : "" },
                  (displayData.games.length > 0 || activeTab === 'games') && React.createElement(React.Fragment, null,
                      React.createElement("h2", { className: "text-2xl font-bold mb-6 flex items-center gap-3" }, React.createElement(Icons.Gamepad, { className: "text-purple-600" }), "我的游戏库"),
                      React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" }, displayData.games.map(item => React.createElement(GameCard, { key: item.id, item: item, onLaunch: handleLaunch, onOpenFolder: handleOpenFolder, searchQuery: searchQuery })))
                  )
               ),

               (searchQuery || activeTab === 'tools') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: searchQuery ? "mb-12" : "" },
                  (displayData.tools.length > 0 || activeTab === 'tools') && React.createElement(React.Fragment, null,
                      React.createElement("h2", { className: "text-2xl font-bold mb-6 flex items-center gap-3" }, React.createElement(Icons.Wrench, { className: "text-emerald-600" }), "实用工具"),
                      React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" }, 
                          displayData.tools.map(item => React.createElement(ToolCard, { key: item.id, item: item, onClick: handleOpenTool, onShowDetails: setSelectedToolDetails, searchQuery: searchQuery }))
                      )
                  )
               ),

               (searchQuery || activeTab === 'websites') && React.createElement(motion.section, { initial: { opacity: 0 }, animate: { opacity: 1 } },
                  (displayData.websites.length > 0 || activeTab === 'websites') && React.createElement(React.Fragment, null,
                      React.createElement("h2", { className: "text-2xl font-bold mb-6 flex items-center gap-3" }, React.createElement(Icons.Globe, { className: "text-blue-600" }), "常用网站"),
                      !searchQuery && React.createElement(DraggableScrollContainer, { className: "flex gap-2 pb-4 mb-4" }, CATEGORY_CONFIG.map(cat => React.createElement("button", { key: cat.id, onClick: () => setActiveCategory(cat.id), className: `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-md transition-all ${activeCategory === cat.id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-lg scale-105' : 'bg-white/90 dark:bg-slate-800/80 text-slate-600 hover:bg-white'}` }, React.createElement(cat.icon, { size: 14 }), cat.label))),
                      React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" }, displayData.websites.map(item => React.createElement(WebsiteCard, { key: item.id, item: item, onCopy: showToast, searchQuery: searchQuery })))
                  )
               )
           )
        ),
        
        // Modals
        React.createElement(AnimatePresence, null, isExportVerifying && React.createElement(ExportVerifyModal, { onClose: () => setIsExportVerifying(false), onVerifySuccess: d => { setIsExportVerifying(false); executeExport(d); }, exportCipher: mainData.exportCipher, salt: salt, verifyWithServer: verifyWithServer })),
        React.createElement(AnimatePresence, null, selectedAbyssGame && React.createElement(GameDetailsModal, { item: selectedAbyssGame, onClose: () => setSelectedAbyssGame(null), onLaunch: (i) => handleLaunch(i, true), onOpenFolder: handleOpenFolder })),
        React.createElement(AnimatePresence, null, selectedToolDetails && React.createElement(ToolDetailsModal, { item: selectedToolDetails, onClose: () => setSelectedToolDetails(null), onLaunch: handleOpenTool })),
        React.createElement(AnimatePresence, null, toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }))
    )
  );
};

// ==========================================
// 4. 动态工具加载与路由系统 (新标签页用)
// ==========================================
const ToolRunner = ({ toolId }) => {
    const [ToolComponent, setToolComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const toolMap = {
            'img-crop': { file: 'img-crop.js', component: 'ImgCrop' },
            'json-format': { file: 'json-format.js', component: 'JsonFormat' },
            'img-remove-bg': { file: 'img-remove-bg.js', component: 'ImgRemoveBg' },
            'hash-calc': { file: 'hash-calc.js', component: 'HashCalc' },
            'adv-calc': { file: 'adv-calc.js', component: 'AdvancedCalc' },
            'aes-tool': { file: 'aes-tool.js', component: 'AesEncryptor' }
        };

        const toolConfig = toolMap[toolId];

        if (!toolConfig) {
            setError(`未找到工具模块: ${toolId}，可能正在施工中...`);
            return;
        }

        if (window.AppTools && window.AppTools[toolConfig.component]) {
            setToolComponent(() => window.AppTools[toolConfig.component]);
            return;
        }

        const script = document.createElement('script');
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '/');
        script.src = `${basePath}${toolConfig.file}?v=${Date.now()}`; 
        
        script.onload = () => {
            if (window.AppTools && window.AppTools[toolConfig.component]) {
                setToolComponent(() => window.AppTools[toolConfig.component]);
            } else {
                setError(`文件已加载，但未找到对应组件！`);
            }
        };

        script.onerror = () => setError(`网络错误：找不到 ${toolConfig.file}`);
        
        document.body.appendChild(script);

        return () => { document.body.removeChild(script); };
    }, [toolId]);

    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => setToast({ message, type });

    if (error) return React.createElement("div", { className: "p-8 text-center text-slate-500 dark:text-slate-400 font-bold mt-20 flex flex-col items-center justify-center h-full whitespace-pre-wrap" }, 
        React.createElement(Icons.Wrench, { size: 48, className: "mb-4 opacity-50 text-rose-500" }), error
    );
    
    if (!ToolComponent) return React.createElement("div", { className: "flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900" }, 
        React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" })
    );

    return React.createElement(React.Fragment, null,
        React.createElement(ToolComponent, { showToast: showToast }),
        toast && React.createElement(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) })
    );
};

const MainRouter = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('tool');

    useEffect(() => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) document.documentElement.classList.add('dark');
    }, []);

    if (toolId) return React.createElement(ToolRunner, { toolId: toolId });
    return React.createElement(App, null);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MainRouter, null));