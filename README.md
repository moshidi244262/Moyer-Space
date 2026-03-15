# 🌌 Moyer Space (魔师帝的个人空间)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg?logo=tailwind-css)
![Vercel Serverless](https://img.shields.io/badge/Vercel-Serverless-black.svg?logo=vercel)

**Moyer Space** 是一个基于 React 和 Tailwind CSS 构建的现代化、高安全性个人私密工作区。项目采用了严苛的**端到端加密（E2EE）**架构，所有敏感数据均在浏览器本地进行解密，确保云端“零信任”。除了作为高强度的密码和书签保险箱，它还内置了动态加载的多种实用工具，并专为移动端 PWA 做了深度优化。

*💡 本项目由 AI 辅助驱动开发，展现了现代 Prompt Engineering 在全栈应用落地中的潜力。*

## ✨ 核心特性 (Key Features)

### 🔒 军工级安全与隐私
* **端到端加密 (E2EE):** 采用 PBKDF2 进行密钥派生，结合 AES-256-GCM 进行数据加解密。明文密码永远不会离开浏览器，服务器仅存储加密的密文。
* **多重哈希校验:** 登录凭证采用“前端 SHA-256 + 后端混淆 Pepper + PBKDF2”的多层校验机制，彻底防御彩虹表攻击和数据库拖库风险。
* **防爆破限流:** 借助 Vercel KV (Redis) 实现严格的 IP 访问频率控制，多次试错自动触发系统级锁定。
* **🥷 隐蔽模式 (Stealth Mode):** 内置防窥机制，一键切换至高度伪装的网页界面，保护在公共场合的隐私安全。
* **自动静默锁定:** 长时间无操作后，各个加密区块（密码库等）将自动销毁内存中的解密数据并重新上锁。

### 🚀 现代化交互与 UI
* **Framer Motion 动效:** 丝滑的路由切换、组件加载和物理弹簧级别的交互反馈。
* **3D 悬浮卡片 (Tilt Card):** 借助光标追踪技术，实现极具质感的玻璃态（Glassmorphism）卡片 3D 偏转效果。
* **全自适应暗黑模式:** 原生支持 Dark Mode，并配合动态光晕背景动画。

### 🛠️ 模块化实用工具箱
通过动态脚本加载机制（Dynamic Module Loader），按需载入子功能，保证主应用极速秒开：
* **高级计算器:** 集成科学计算与工程换算。
* **AI 智能抠图 / 图片裁剪:** 前端与边缘计算结合的图像处理工具。
* **哈希 / AES 计算器:** 本地文件拖拽即刻加密或校验完整性。
* **JSON 格式化:** 提供语法高亮与代码折叠功能。

## 🏗️ 系统架构 (Architecture)

* **前端:** HTML5 + React (CDN 引入) + Tailwind CSS + Framer Motion
* **后端:** Vercel Serverless Functions (`/api/data`)
* **存储与缓存:** Vercel KV (Redis) 用于限流防刷
* **安全加密库:** Web Crypto API (原生高性能), `crypto-js`

## ⚙️ 部署与本地运行 (Setup)

本项目依赖 Vercel 的 Serverless 环境以及 KV 数据库。

**1. 克隆仓库**
```bash
git clone [https://github.com/your-username/moyer-space.git](https://github.com/your-username/moyer-space.git)
cd moyer-space
