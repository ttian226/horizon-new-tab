# Chrome Web Store 发布完整指南

## 📋 准备工作清单

在开始发布之前，确保准备好以下内容：

### 1. 必需的素材

#### 图标（Icons）
- [x] **128x128px** - 已有（在 public/icons/icon-128.png）
- [ ] **48x48px** - 需要创建
- [ ] **16x16px** - 需要创建

#### 商店素材
- [ ] **截图（Screenshots）** - 至少 1 张，最多 5 张
  - 尺寸：1280x800px 或 640x400px
  - 展示扩展的主要功能
  - PNG 或 JPEG 格式

- [ ] **宣传图片（Promotional images）**
  - Small tile: 440x280px（必需）
  - Marquee: 1400x560px（推荐）
  - 用于在商店中展示

#### 文字内容
- [ ] **详细描述**（132 个字符以上）
- [ ] **简短描述**（最多 132 个字符）
- [ ] **隐私政策链接**（如果收集用户数据，则必需）

### 2. 开发者账号

- [ ] 注册 Chrome Web Store 开发者账号
  - 费用：$5（一次性）
  - 链接：https://chrome.google.com/webstore/devconsole/register

## 🚀 发布步骤

### 步骤 1: 注册开发者账号（如果还没有）

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/register)
2. 使用 Google 账号登录
3. 支付 $5 注册费（一次性，信用卡支付）
4. 同意开发者协议
5. 等待激活（通常几分钟到 1 小时）

### 步骤 2: 准备商店素材

#### 创建截图

建议截取以下场景：

1. **主界面** - 展示时钟、天气、壁纸
2. **设置面板** - 展示天气位置设置
3. **收藏功能** - 展示壁纸收藏
4. **Todo 功能** - 展示待办事项
5. **登录界面** - 展示 Google 登录

**截图技巧：**
```bash
# 在浏览器中按 F12，打开开发者工具
# 点击设备模拟器图标
# 设置自定义尺寸：1280x800
# 截图保存为 PNG
```

#### 创建宣传图片

可以使用 Figma、Canva 或 Photoshop 创建：

**Small Promo Tile (440x280px) 内容建议：**
- 应用图标
- 应用名称：Horizon New Tab
- 简短标语：Beautiful new tab with weather, focus tools & daily inspiration

**Marquee (1400x560px) 内容建议：**
- 应用截图预览
- 主要功能介绍
- 视觉吸引力强的设计

### 步骤 3: 准备扩展包

1. **更新版本号**（如果需要）

   编辑 `package.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **构建生产版本**
   ```bash
   npm run build
   ```

3. **创建 ZIP 包**
   ```bash
   cd dist
   zip -r ../horizon-new-tab-chrome-store.zip . -x "*.map" "*.DS_Store"
   cd ..
   ```

   或使用 npm 命令：
   ```bash
   npm run package
   ```

### 步骤 4: 上传到 Chrome Web Store

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

2. 点击 **"New Item"（新建项）** 按钮

3. **上传 ZIP 文件**
   - 选择刚才创建的 `release/horizon-new-tab-v0.1.0.zip`
   - 等待上传和验证

4. **填写商店信息**

#### Product details（产品详情）

**Store listing（商店信息）:**

- **Item name（扩展名称）**:
  ```
  Horizon - Beautiful New Tab
  ```

- **Summary（摘要，132 字符以内）**:
  ```
  Transform your new tab into a beautiful, productive workspace with weather, focus tools, and daily inspiration
  ```

- **Description（详细描述）**:
  ```
  🌅 Horizon - Beautiful New Tab

  Transform your new tab page into a beautiful, productive workspace with stunning wallpapers and essential tools.

  ✨ KEY FEATURES:

  🖼️ Beautiful Wallpapers
  • Curated high-quality images from Unsplash
  • Multiple categories: Nature, Architecture, Minimalist, Technology
  • Automatic rotation with customizable intervals
  • Save your favorite wallpapers (up to 9 for free users)

  🌤️ Real-time Weather
  • Automatic location detection
  • Manual city search
  • Temperature and weather conditions
  • Clean, minimal design

  ⏰ Elegant Clock & Greeting
  • Large, beautiful time display with Montserrat font
  • Personalized greetings (Good morning/afternoon/evening)
  • Custom nickname support
  • Weather-based inspirational quotes

  ✅ Todo List (Premium)
  • Cloud-synced across devices
  • Create multiple lists
  • Real-time updates
  • Never lose your tasks

  🔐 Privacy & Security
  • Optional Google Sign-in for cloud sync
  • All settings stored locally first
  • Secure Firebase backend
  • No tracking, no ads

  🎨 Features:
  • Glassmorphism UI design
  • Smooth animations
  • Responsive layout
  • Customizable settings
  • Local-first architecture for instant loading

  📱 Perfect for:
  • Productivity enthusiasts
  • Minimalism lovers
  • Anyone who wants a beautiful new tab experience

  🆓 Free Plan includes:
  • Unlimited wallpaper browsing
  • Weather with auto location
  • Clock and greetings
  • Up to 9 favorite wallpapers
  • 1 todo list

  💎 Premium features:
  • Unlimited favorite wallpapers
  • Unlimited todo lists
  • Priority support
  • More features coming soon!

  Made with ❤️ for productivity and beauty.
  ```

- **Category（类别）**:
  - 选择: **Productivity（效率工具）**

- **Language（语言）**:
  - 选择: **English（英语）**

#### Privacy practices（隐私惯例）

**Single purpose description（单一目的说明）**:
```
This extension replaces the default new tab page with a beautiful, productive workspace featuring weather information, a clock with personalized greetings, stunning wallpapers, and optional todo list functionality.
```

**Permission justification（权限说明）**:

- **storage**:
  ```
  Used to save user preferences, weather settings, and favorite wallpapers locally for instant loading.
  ```

- **alarms**:
  ```
  Used to schedule automatic wallpaper updates and weather data refresh in the background.
  ```

**Host permissions（主机权限说明）**:

- **api.open-meteo.com**:
  ```
  Required to fetch real-time weather data for the user's location.
  ```

- **nominatim.openstreetmap.org**:
  ```
  Required to convert GPS coordinates to city names for weather display.
  ```

- **firestore.googleapis.com, firebaseapp.com**:
  ```
  Required for cloud sync functionality when users sign in with Google account (optional feature).
  ```

**Data usage（数据使用）**:

如果使用 Firebase Authentication 和 Firestore：

- **Does your extension collect or transmit user data?**
  - 选择: **Yes（是）**

- **What data do you collect?**
  - Personal information: Email address (for authentication)
  - User content: Weather preferences, todo items (if signed in)

- **How is the data used?**
  - Authentication
  - Sync across devices
  - Personalization

- **Data handling（数据处理）**:
  - Data is encrypted in transit: **Yes**
  - Data is not sold to third parties: **Yes**
  - Data is not used for purposes unrelated to the item's core functionality: **Yes**

**Privacy policy URL（隐私政策链接，必需）**:

你需要创建一个隐私政策页面，可以托管在：
- GitHub Pages
- 你的个人网站
- 免费隐私政策生成器

示例隐私政策内容见下方。

#### Store assets（商店素材）

**Icon（图标）**:
- 上传 128x128px 图标

**Screenshots（截图）**:
- 上传 1-5 张截图（1280x800px 或 640x400px）
- 按顺序展示主要功能

**Promotional images（宣传图片）**:
- Small tile (440x280px): 必需
- Marquee (1400x560px): 推荐

#### Distribution（分发设置）

**Visibility（可见性）**:

初次发布建议：
- 选择 **"Unlisted"（不公开列出）**
- 这样只有链接的人可以看到和安装
- 可以先给测试用户测试
- 确认没问题后再改为 "Public"

或者直接：
- 选择 **"Public"（公开）**
- 所有人都可以在商店搜索到

**Regions（地区）**:
- 建议选择：所有地区
- 或者指定特定国家/地区

**Pricing（定价）**:
- 选择: **Free（免费）**

### 步骤 5: 提交审核

1. **检查所有信息**
   - 确保所有必填字段已填写
   - 检查截图、图标是否上传
   - 确认隐私政策链接有效

2. **点击 "Submit for review"（提交审核）**

3. **等待审核**
   - 首次提交：通常 1-3 个工作日（可能更长）
   - 审核期间状态：Pending review
   - Google 会审核代码、隐私政策、商店信息

4. **审核结果**
   - **通过**: 扩展会自动发布到商店
   - **拒绝**: 会收到邮件说明原因，修改后重新提交

## 📝 隐私政策示例

创建一个简单的 HTML 文件并托管在 GitHub Pages：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horizon New Tab - Privacy Policy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Privacy Policy for Horizon New Tab</h1>
  <p><strong>Last Updated: [日期]</strong></p>

  <h2>Introduction</h2>
  <p>Horizon New Tab ("we", "our", or "the extension") is committed to protecting your privacy. This policy explains how we collect, use, and protect your information.</p>

  <h2>Information We Collect</h2>
  <h3>Local Storage</h3>
  <p>The following data is stored locally on your device:</p>
  <ul>
    <li>Weather location preferences</li>
    <li>UI settings and customization</li>
    <li>Favorite wallpapers (locally cached)</li>
  </ul>

  <h3>Cloud Storage (Optional)</h3>
  <p>If you choose to sign in with your Google account, we store:</p>
  <ul>
    <li>Email address (for authentication)</li>
    <li>Display name and profile photo (from your Google account)</li>
    <li>User preferences and settings</li>
    <li>Todo list items (if you use this feature)</li>
    <li>Favorite wallpapers</li>
  </ul>

  <h2>How We Use Your Information</h2>
  <ul>
    <li>To provide and maintain the extension's functionality</li>
    <li>To sync your preferences across devices (if signed in)</li>
    <li>To personalize your experience with custom greetings</li>
  </ul>

  <h2>Third-Party Services</h2>
  <p>We use the following third-party services:</p>
  <ul>
    <li><strong>Firebase (Google)</strong>: For authentication and cloud data storage</li>
    <li><strong>Open-Meteo</strong>: For weather data (no personal data shared)</li>
    <li><strong>OpenStreetMap Nominatim</strong>: For location name lookup</li>
    <li><strong>Unsplash</strong>: For wallpaper images (no personal data shared)</li>
  </ul>

  <h2>Data Security</h2>
  <p>We implement appropriate security measures to protect your data:</p>
  <ul>
    <li>All cloud data is encrypted in transit using HTTPS</li>
    <li>Firebase security rules restrict access to your own data only</li>
    <li>We do not sell or share your personal information with third parties</li>
  </ul>

  <h2>Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Access your data stored in Firebase</li>
    <li>Delete your account and all associated data</li>
    <li>Use the extension without signing in (limited features)</li>
  </ul>

  <h2>Children's Privacy</h2>
  <p>Our extension is not directed to children under 13. We do not knowingly collect information from children under 13.</p>

  <h2>Changes to This Policy</h2>
  <p>We may update this privacy policy from time to time. We will notify you of any changes by updating the "Last Updated" date.</p>

  <h2>Contact Us</h2>
  <p>If you have questions about this privacy policy, please contact us at: [你的邮箱]</p>
</body>
</html>
```

保存为 `privacy-policy.html` 并上传到 GitHub Pages 或其他托管服务。

## ✅ 发布后的工作

### 获取固定的 Extension ID

发布后，你的扩展会获得一个永久的 Extension ID，例如：
```
abcdefghijklmnopqrstuvwxyzabcd
```

### 更新 OAuth 配置（可选，如果将来切换回 chrome.identity）

如果将来想使用 chrome.identity 而不是 popup：

1. 进入 Google Cloud Console
2. APIs & Services → Credentials
3. 找到你的 OAuth 客户端 ID
4. 添加授权的重定向 URI：
   ```
   https://[你的Extension ID].chromiumapp.org/
   ```

### 监控和维护

在 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)：

- 查看安装数量和评分
- 回复用户评论
- 监控崩溃报告
- 发布更新版本

### 发布更新

当有新功能或 bug 修复时：

1. 更新 `package.json` 版本号
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. 构建和打包
   ```bash
   npm run package
   ```

3. 在 Developer Dashboard 上传新的 ZIP
4. 提交审核（更新通常审核更快，几小时到 1 天）

## 📊 预计时间线

- 注册开发者账号：几分钟到 1 小时
- 准备素材：2-4 小时
- 填写商店信息：30 分钟
- 审核等待：1-3 天（首次），几小时到 1 天（更新）

## 💡 最佳实践

1. **先发布为 Unlisted**
   - 给内部测试用户使用
   - 收集反馈
   - 修复问题
   - 再切换为 Public

2. **准备好回应审核反馈**
   - Google 可能会要求说明某些功能
   - 可能要求修改隐私政策
   - 可能要求解释某些权限

3. **保持更新**
   - 定期修复 bug
   - 添加用户请求的功能
   - 保持与 Chrome 新版本兼容

## 🎯 发布检查清单

发布前最后检查：

- [ ] 版本号已更新
- [ ] 所有功能正常工作
- [ ] 没有 console 错误
- [ ] 图标和截图准备好
- [ ] 隐私政策已发布
- [ ] 商店描述准备好
- [ ] 开发者账号已激活
- [ ] ZIP 包已创建
- [ ] 所有权限都有说明

准备好了就提交吧！🚀
