# 🛠️ Moyer Space - 开发与部署指南

本指南将引导你完成从零开始，在 **Vercel** 上部署一个属于你自己的、功能完整的 **Moyer Space** 实例。

## 📋 前置准备

在开始之前，请确保你已准备好以下环境：

1.  **一个 GitHub 账号**：用于托管你的代码仓库。
2.  **一个 Vercel 账号**：用于部署你的应用。你可以通过 GitHub 账号快速注册。
3.  **一个 Upstash (Redis) 账号**：用于提供 KV 存储（频率限制功能所需）。Vercel 内置了快速集成。（后续步骤会说）
4.  **一个现代的网页浏览器**：如 Chrome, Edge, Firefox。

## 🚀 快速开始：十步部署你的 Moyer Space

### 步骤 1：获取源代码

你有两种方式获取代码：

*   **推荐：Fork 本仓库**
    1.  点击本页面右上角的 **`Fork`** 按钮。
    2.  为你 Fork 出的仓库起一个名字（例如 `my-moyer-space`），然后点击 **`Create fork`**。
    ![Fork 仓库示意图](https://docs.github.com/assets/cb-77734/mw-1440/images/help/repository/fork-button.webp)

*   **或：下载 ZIP 包**
    1.  点击本页面顶部的绿色 **`<> Code`** 按钮。
    2.  在下拉菜单中选择 **`Download ZIP`**。
    3.  将下载的压缩包解压到本地文件夹。
    4.  在 GitHub 上创建一个新的**私有仓库**（Private Repository），然后将解压后的所有文件上传到这个新仓库中。

### 步骤 2：准备加密工具

本项目使用一个独立的 HTML 工具来生成加密数据和环境变量。

1.  从本仓库下载 [`Encryptor-v8.1.html`](https://raw.githubusercontent.com/moshidi244262/Moyer-Space/main/Encryptor-v8.1.html) 文件到你的电脑。
2.  **重要**：为了安全起见，在你下载后，请**立即从你的 GitHub 仓库中删除此文件**。因为它包含了生成密钥的逻辑，不应公开。
    ```bash
    # 如果你使用命令行，可以这样操作
    git rm Encryptor-v8.1.html
    git commit -m “移除加密工具文件”
    git push
    ```

### 步骤 3：生成你的加密数据

1.  在本地用浏览器打开 `Encryptor-v8.1.html` 文件。
2.  你会看到一个配置界面。在 **“原始数据”** 文本框中，已经预置了示例数据（网站、游戏等）。你可以根据需要修改这些 JSON 数据。
3.  在顶部的四个密码输入框中，分别为你的空间设置：
    *   **全局访问密码** (Login Password)：主登录密码。
    *   **密码库密码** (Vault Password)：查看密码时需要的二级密码。
    *   **导出数据密码** (Export Password)：导出全部备份数据时需要的密码。
    *   **心之渊密码** (Abyss Secret)：访问私密游戏库的密码。
    > **💡 提示**：请务必牢记这些密码！它们用于不同层级的解密，且服务端只存储其哈希值，**无法找回**。
4.  点击 **`生成 v8.1 修复版配置`** 按钮。
5.  工具会生成两大部分内容：
    *   **`Vercel 环境变量`** 
    *   **`data.js 数据部分`** 
    ![加密工具界面示意图](https://github.com/user-attachments/assets/9f971237-8f08-4b39-ac07-3dfc48c390e7)

### 步骤 4：更新源代码中的加密数据

1.  在你的 GitHub 仓库中，导航到 `/api` 目录下的 `data.js` 文件。
2.  点击编辑按钮（铅笔图标）。
3.  找到文件末尾类似以下的部分：
    ```javascript
    export const ENCRYPTED_DATA = {
        mainCipher: "",
        vaultCipher: "",
        abyssCipher: ""
    };
    ```
4.  **完全删除**，然后将 **步骤 3** 中生成的 **`data.js 数据部分`** 的**全部内容**复制粘贴到这里。
5.  点击 **`Commit changes`** 提交修改。

### 步骤 5：部署到 Vercel

1.  访问 [Vercel 官网](https://vercel.com) 并登录（推荐使用 GitHub 账号登录）。
2.  点击 **`Add New...`** -> **`Project`**。
3.  在 “Import Git Repository” 页面，你应该能看到你 Fork 或创建的仓库。点击它旁边的 **`Import`**。
    ![Vercel 导入项目](https://github.com/user-attachments/assets/8ba350d5-04dc-458f-b623-b528210a3a15)
4.  在配置页面，所有设置保持默认即可。直接点击 **`Deploy`**。
5.  等待约1分钟，Vercel 将完成构建和部署。部署成功后，你会看到 “Congratulations!” 页面，并显示你的网站地址（如 `https://xxx.vercel.app`）。点击该链接即可看到 Moyer Space 的登录界面。

### 步骤 6：配置 Vercel 环境变量

这是安全运行的关键一步。

1.  在 Vercel 项目的仪表板，点击顶部的 **`Settings`** 选项卡。
2.  在左侧边栏，找到并点击 **`Environment Variables`**。
3.  点击右上角的 **`Add New`** 按钮。
4.  回到本地浏览器中打开的 `Encryptor-v8.1.html` 页面，复制 **`Vercel 环境变量`** 文本框内的**全部内容**。它看起来像这样：
    ```bash
    APP_SALT=abc123...
    APP_PEPPER=MySecretPepper...
    APP_VERIFY_HASH=def456...
    ...
    ```
5.  在 Vercel 的添加环境变量界面，有一个 **“Paste from .env.local”** 的链接，点击它。将复制的内容粘贴进弹出的文本框，然后点击 **`Add`**。
    ![Vercel 粘贴环境变量](https://github.com/user-attachments/assets/a2da7756-e2b5-4b21-b541-75d3186793be)
6.  系统会自动解析并添加所有变量。确认它们都已列出。

### 步骤 7：创建数据库 (Redis) - 启用频率限制

为了启用登录保护（IP锁定）功能，需要配置 Redis 数据库。

1.  在 Vercel 项目仪表板，点击顶部 **`Storage`** 选项卡。
2.  点击 **`Create Database`** 按钮。
3.  在数据库市场中找到 **`Upstash for Redis`**，点击它。
    ![Vercel Storage 选择 Upstash](https://github.com/user-attachments/assets/d7c94d60-903d-4a8a-a3ba-f0d2fd1adf7d)
4.  按照提示，你需要授权 Vercel 访问 Upstash，并可能需要在 Upstash 创建一个免费账户（过程很简单，遵循引导即可）。
5.  创建成功后，Vercel 会自动将 Redis 连接所需的环境变量（如 `KV_REST_API_URL`, `KV_REST_API_TOKEN`）添加到你的项目 **`Environment Variables`** 中。

### 步骤 8：验证环境变量

1.  再次进入 **`Settings`** -> **`Environment Variables`**。
2.  确认你看到了以下两类变量：
    *   来自加密工具的变量：`APP_SALT`, `APP_PEPPER`, `APP_VERIFY_HASH`, `VAULT_VERIFY_HASH`, `ABYSS_VERIFY_HASH`, `EXPORT_VERIFY_HASH`, `JWT_SECRET`。
    *   来自 Upstash Redis 的变量：`KV_REST_API_URL`, `KV_REST_API_TOKEN`（或 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`）。
    ![环境变量总览](https://github.com/user-attachments/assets/963608b5-5f40-4470-ac3d-27248b309565)

### 步骤 9：重新部署

环境变量更新后，需要触发一次重新部署以使生效。

1.  在 Vercel 项目仪表板的 **`Deployments`** 选项卡下，找到最近的一次部署记录。
2.  点击右侧的 **`...`** (更多) 菜单，选择 **`Redeploy`**。
    ![Vercel 重新部署](https://via.placeholder.com/800x200/000000/ffffff?text=Vercel+Redeploy+Menu)

### 步骤 10：访问你的空间！

等待重新部署完成（约30秒）。然后，访问你的 Vercel 域名（如 `https://你的项目名.vercel.app`）。

1.  在登录界面，输入你在 **步骤 3** 中设置的 **`全局访问密码`**。
2.  如果一切配置正确，你将成功进入 Moyer Space 的主界面！🎉

## ⚠️ 故障排除

*   **登录失败，提示“密码错误”**：
    *   请确认你在 `Encryptor-v8.1.html` 中输入的密码，与登录时输入的密码完全一致。
    *   确认 `api/data.js` 文件中的 `ENCRYPTED_DATA` 已正确替换。
    *   确认 Vercel 环境变量已全部正确添加，并且项目已**重新部署**。
*   **网站打开是空白页或错误页**：
    *   检查浏览器控制台 (F12 -> Console) 是否有 JavaScript 错误。
    *   确认所有源代码文件已完整上传至仓库。
*   **频率限制 (IP锁) 不生效**：
    *   确认 Upstash Redis 数据库已成功创建，且相关环境变量已存在。
    *   在 Vercel 的 `Storage` 选项卡中，确认你的 Redis 数据库状态为 “Connected”。

## 🔒 安全提醒

1.  **保管好你的密码**：所有密码均在本地加密，服务端只存储不可逆的哈希值。一旦忘记，**无法找回**数据。
2.  **保护环境变量**：`APP_PEPPER` 和 `JWT_SECRET` 是核心机密，切勿泄露。
3.  **加密工具文件**：`Encryptor-v8.1.html` 在使用后应从公开仓库中删除，避免他人分析你的加密模式。
4.  **使用私有仓库**：强烈建议在 GitHub 上使用 **私有仓库 (Private Repository)** 来托管你的配置，以保护你的个人数据结构和设置。

---

现在，你已经拥有了一个完全由自己掌控的、高安全性的个人数字资产管理平台！开始整理你的密码、收藏夹和工具吧。

如有任何问题，欢迎在原始项目仓库中提出 [Issue](https://github.com/原作者/原仓库名/issues)。
