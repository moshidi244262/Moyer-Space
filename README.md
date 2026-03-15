# Moyer Space (Public Edition) 🛡️

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-green.svg)]()
[![Build](https://img.shields.io/badge/Build-Vercel-black.svg)]()

**Moyer Space** 是一款专为个人效率与隐私保护设计的轻量化 Web 工作台。它集成了高度安全的本地加密存储系统与一系列开发者常用工具箱，旨在打造一个属于用户个人的“数字瑞士军刀”。

> **注意**：此版本为公开演示版，已剔除所有个人敏感配置与私有数据接口。

---

## ✨ 项目亮点

### 🔐 核心：安全数据堡垒
* **本地化存储**：不经过服务器后端，所有敏感信息（密码、书签）均持久化于浏览器本地环境。
* **AES-256 高级加密**：集成 AES 加密算法，确保用户数据在存储状态下不可读，仅通过用户私钥解密。
* **隐私隔离**：通过无隐私公开版本展示架构设计，完美平衡了“作品展示”与“个人隐私”。

### 🛠️ Toolbar 生产力工具箱
项目内置了一套自研的工具集，涵盖了前端开发与日常办公的高频需求：
* **安全类**：AES 加密/解密工具、HASH 计算器（MD5, SHA-256）。
* **开发类**：JSON 格式化/校验、科学计算器。
* **图像类**：在线图片裁剪、背景移除（利用 Canvas/API 处理）。

### 📱 跨平台适配
* **响应式设计**：完美适配 PC 与移动端浏览器。
* **移动端集成**：通过 Webview 技术成功封装为 Android App，支持随时随地的工具调用。

---

## 🛠️ 技术栈

| 领域 | 技术方案 |
| :--- | :--- |
| **前端框架** | HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+) |
| **加密库** | Crypto-JS (实现 AES, SHA-256) |
| **静态资源** | 七牛云 (Qiniu Cloud) 对象存储 |
| **部署托管** | Vercel (CI/CD 自动部署) |
| **移动端封装** | Android Webview / Capacitor (根据你实际封装方式选一) |

---

## 📦 核心功能展示

### 1. 个人工具栏 (Toolbar)
项目采用模块化设计，每个工具均为独立组件，易于扩展。


### 2. 加密逻辑流
数据在存入 `localStorage` 前，会经过 AES 算法进行流式加密。


---

## 🔨 如何运行

1. **克隆项目**
   ```bash
   git clone [https://github.com/你的用户名/moyer-space-public.git](https://github.com/你的用户名/moyer-space-public.git)
