<div align="center">

🌌 Moyer Space (Public Edition)

一个主打“零信任安全”与“极致响应”的个人数字堡垒与工具工作台

特性 • 技术亮点 • 架构设计 • 模块一览 • 如何运行

</div>

⚠️ 声明：当前仓库为 公共演示版本 (Public Edition)。为了保护个人隐私，源码中移除了所有真实的私有加密数据（替换为演示用的 Hash 与密文），并去除了个人的云存储 API Key。

💡 项目初衷

在日常开发与生活中，我们常面临密码碎片化、临时工具满天飞（如 JSON 格式化、抠图、进制转换）以及数据隐私泄露的痛点。
Moyer Space 旨在打造一个完全由自己掌控的 All-in-One 工作台。它不仅是一个前端工具箱，更是一个基于“前端解密、零信任”原则构建的安全数据保险箱。

✨ 核心特性

🔐 零信任数据安全：所有核心数据（密码本、私密备忘录）均在云端以 AES-256-GCM 密文存储，仅在浏览器端通过用户口令实时派生密钥并解密。

⚡ 无构建的极致轻量：抛弃了沉重的 Webpack/Vite 链条，采用原生 ESM 和动态 Script 注入实现纯前端的代码分割 (Code Splitting)。

🛡️ 防爆破与访问控制：结合 Vercel Serverless 与 Upstash Redis (KV)，实现严格的 API 速率限制（Rate Limiting）与 IP 熔断机制。

🎨 拟物与毛玻璃美学：基于 TailwindCSS 和 Framer Motion，实现丝滑的 3D 悬浮卡片 (Tilt Card) 与全局暗黑模式。

🕶️ 隐蔽模式 (Boss Key)：全局监听 Escape 键，一秒无缝伪装成 Google 搜索页面，保护屏幕隐私。

📱 PWA 渐进式支持：支持安装到桌面或手机屏幕，离线秒开（集成 Service Worker）。

🛠 工程与技术亮点 (针对面试官)

作为前端开发，本项目重点解决并沉淀了以下工程化问题：

1. 原生 DOM 驱动的动态模块加载器

为了解决单页面应用（SPA）首屏加载过慢的问题，项目中手写了 DynamicModuleLoader 组件。在不依赖现代打包工具的情况下，通过动态创建 <script> 标签按需加载 img-crop.js、json-format.js 等庞大的工具模块，并将组件挂载到全局 window.AppModules，极大优化了 FCP（首次内容绘制）指标。

2. Web Crypto API 性能优化

放弃了体积庞大的 crypto-js 解密库，直接调用浏览器原生的 window.crypto.subtle API。利用硬件加速进行 PBKDF2 密钥派生和 AES-GCM 解密，在移动端解析 100KB 以上的加密数据包时，耗时从 300ms 锐减至 20ms 以内。

3. Serverless 安全网关

在 /api/data 接口中，实现了完整的鉴权与限流逻辑：

密码学验证：采用 Salt + Pepper + SHA256 验证机制，防止彩虹表攻击。

滑动窗口限流：单 IP 连续错误 5 次，直接通过 Redis (Vercel KV) 锁定该 IP 10 分钟，有效防御撞库与字典攻击。

严格的 CSP 策略：在 index.html 中配置 Content-Security-Policy，严防 XSS 攻击窃取内存中的明文数据。

📂 目录结构

📦 moyer-space
 ┣ 📂 lib/                  # 静态依赖库 (React, Tailwind, Framer-motion, Cropper)
 ┣ 📂 models/               # 数据模型/类型定义
 ┣ 📜 app.js                # 核心逻辑：路由、状态管理、加密解密、UI渲染
 ┣ 📜 data.js               # Serverless API (Vercel Function): 鉴权、限流、下发密文
 ┣ 📜 index.html            # 统一入口 (CSP配置、PWA引入)
 ┣ 📜 shanhaige.js          # 动态模块：山海阁 (阅读/文档)
 ┣ 📜 aes-tool.js           # 动态模块：文件/文本加密工具
 ┣ 📜 adv-calc.js           # 动态模块：高级科学计算器
 ┣ 📜 hash-calc.js          # 动态模块：哈希指纹计算
 ┣ 📜 img-crop.js           # 动态模块：纯前端图片裁剪
 ┣ 📜 img-remove-bg.js      # 动态模块：AI 智能抠图
 ┣ 📜 json-format.js        # 动态模块：JSON 解析与格式化
 ┣ 📜 manifest.json         # PWA 配置
 ┗ 📜 sw.js                 # Service Worker (缓存策略)


🧰 内置工具模块

本项目采用“主控台 + 按需工具”的架构，内置了针对开发者的多款实用工具（支持新标签页独立运行 ?tool=xxx）：

模块名称

功能描述

核心技术

智能抠图

浏览器端识别主体，生成透明 PNG

Canvas API / 图像分割算法

图片裁剪

自由比例裁剪，支持高画质导出

Cropper.js 深度定制

JSON 格式化

语法高亮、自动缩进、错误定位

递归解析、DOM 动态生成

Hash 计算器

计算文件的 MD5/SHA 哈希指纹

FileReader API、分片读取

高级计算器

表达式实时解析、工程单位换算

词法分析、AST 抽象语法树

AES 加密箱

本地文件/文本拖拽极速加密

Web Crypto API、Blob 下载

🚀 本地运行

克隆项目

git clone [https://github.com/你的用户名/moyer-space-public.git](https://github.com/你的用户名/moyer-space-public.git)
cd moyer-space-public


前端环境配置
本项目无需 npm run build，直接通过任意 Http Server 运行即可（如 VS Code 的 Live Server 插件）：

npx serve .


后端环境配置 (可选)
如果您想测试安全的密码登录与限流逻辑，请安装 Vercel CLI 并配置环境变量：

npm install
# 在 .env 中配置 KV_REST_API_URL, KV_REST_API_TOKEN, APP_SALT 等
vercel dev


默认演示密码：请查看源码 data.js 中的测试 Hash 或直接在前端屏蔽登录逻辑进行组件预览。

🤝 致谢与联系

感谢浏览我的项目！
如果你是一位正在寻找优秀前端工程师的校招面试官，欢迎通过简历上的联系方式与我交流探讨。我非常乐意分享这个项目在开发过程中遇到的坑以及解决思路（例如移动端点击穿透、Service Worker 缓存更新策略等）。
