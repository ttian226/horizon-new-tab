# Cloudflare Pages 部署指南

## 🎯 目标

使用你的域名 `horizon-tab.app` 托管隐私政策页面，用于 Chrome Web Store 发布。

部署后，隐私政策将在以下地址可访问：
```
https://horizon-tab.app/privacy-policy.html
```

## 📋 准备工作

已完成：
- [x] 在 Cloudflare 注册域名 `horizon-tab.app`
- [x] 创建隐私政策 HTML 文件

## 🚀 部署步骤

### 方法 1: 通过 Git 连接（推荐）

#### 步骤 1: 提交代码到 GitHub

```bash
# 添加隐私政策文件
git add docs/privacy-policy.html

# 提交
git commit -m "Add privacy policy page for Chrome Web Store"

# 推送到 GitHub
git push origin main
```

#### 步骤 2: 在 Cloudflare Pages 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. 点击左侧菜单 **"Workers & Pages"**

3. 点击 **"Create application"**

4. 选择 **"Pages"** 标签

5. 点击 **"Connect to Git"**

6. 授权 Cloudflare 访问你的 GitHub

7. 选择仓库：`ttian226/horizon-new-tab`

8. 配置构建设置：

   **Project name（项目名称）:**
   ```
   horizon-new-tab
   ```

   **Production branch（生产分支）:**
   ```
   main
   ```

   **Build settings（构建设置）:**
   - Framework preset: **None**
   - Build command: (留空)
   - Build output directory: **docs**

9. 点击 **"Save and Deploy"**

10. 等待部署完成（约 1-2 分钟）

#### 步骤 3: 配置自定义域名

部署完成后：

1. 在项目页面，点击 **"Custom domains"** 标签

2. 点击 **"Set up a custom domain"**

3. 输入你的域名：
   ```
   horizon-tab.app
   ```
   或子域名（推荐）：
   ```
   www.horizon-tab.app
   ```

4. 点击 **"Continue"**

5. Cloudflare 会自动配置 DNS：
   - 如果域名在 Cloudflare，自动添加 CNAME 记录
   - 如果域名不在 Cloudflare，会提示你添加 DNS 记录

6. 等待 DNS 生效（几分钟）

7. 访问测试：
   ```
   https://horizon-tab.app/privacy-policy.html
   ```

### 方法 2: 直接上传文件（快速方法）

如果你想更快速地部署：

#### 步骤 1: 创建 Cloudflare Pages 项目

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com/)

2. Workers & Pages → **Create application** → **Pages**

3. 选择 **"Upload assets"**

4. 拖拽 `docs` 文件夹（或选择文件）

5. Project name: `horizon-new-tab`

6. 点击 **"Deploy site"**

#### 步骤 2: 配置自定义域名

同上方法 1 的步骤 3。

## 🔧 高级配置

### 添加其他页面

你可以在 `docs` 文件夹中添加更多页面：

```bash
docs/
├── privacy-policy.html
├── index.html          # 主页（可选）
├── terms.html          # 服务条款（可选）
└── support.html        # 支持页面（可选）
```

### 自定义域名选项

你有几个选择：

1. **根域名** - `horizon-tab.app`
   - 直接用根域名托管
   - URL: `https://horizon-tab.app/privacy-policy.html`

2. **www 子域名** - `www.horizon-tab.app`
   - 使用 www 子域名
   - URL: `https://www.horizon-tab.app/privacy-policy.html`

3. **专用子域名** - `privacy.horizon-tab.app` 或 `docs.horizon-tab.app`
   - 使用专门的子域名
   - URL: `https://privacy.horizon-tab.app/privacy-policy.html`

**推荐：使用根域名** `horizon-tab.app`，最简洁。

### 设置重定向（可选）

在 `docs` 文件夹创建 `_redirects` 文件：

```
# 重定向根路径到隐私政策
/  /privacy-policy.html  200

# 短链接
/privacy  /privacy-policy.html  301
```

### 添加主页（可选）

创建 `docs/index.html` 作为首页：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horizon - Beautiful New Tab</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 40px;
    }
    h1 {
      font-size: 3em;
      font-weight: 300;
      margin-bottom: 20px;
    }
    p {
      font-size: 1.3em;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    .btn {
      display: inline-block;
      padding: 15px 40px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 30px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .links {
      margin-top: 40px;
      font-size: 0.9em;
    }
    .links a {
      color: white;
      text-decoration: none;
      margin: 0 15px;
      opacity: 0.8;
    }
    .links a:hover {
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌅 Horizon</h1>
    <p>Transform your new tab into a beautiful, productive workspace</p>
    <a href="#" class="btn">Add to Chrome</a>
    <div class="links">
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="https://github.com/ttian226/horizon-new-tab">GitHub</a>
    </div>
  </div>
</body>
</html>
```

## ✅ 验证部署

部署完成后，检查：

1. **隐私政策可访问：**
   ```
   https://horizon-tab.app/privacy-policy.html
   ```

2. **HTTPS 正常工作**（Cloudflare 自动提供 SSL）

3. **页面正确显示**（打开链接查看）

4. **响应式设计**（在手机上测试）

## 📝 在 Chrome Web Store 使用

部署成功后，在 Chrome Web Store 的隐私政策字段填写：

```
https://horizon-tab.app/privacy-policy.html
```

## 🔄 更新隐私政策

当需要更新隐私政策时：

### 如果使用 Git 连接：

1. 编辑 `docs/privacy-policy.html`
2. 更新 "Last Updated" 日期
3. 提交并推送：
   ```bash
   git add docs/privacy-policy.html
   git commit -m "Update privacy policy"
   git push
   ```
4. Cloudflare Pages 自动部署（约 1 分钟）

### 如果使用直接上传：

1. 在 Cloudflare Pages 项目中上传新文件
2. 创建新部署

## 💡 其他用途

既然有了域名和托管，你还可以：

1. **创建落地页**（Landing Page）
   - 展示扩展功能
   - 吸引用户安装
   - 提供下载链接

2. **添加使用文档**
   - 帮助用户了解功能
   - 常见问题解答
   - 使用教程

3. **创建博客**（可选）
   - 分享更新日志
   - 产品开发故事
   - 用户案例

4. **设置分析**（可选）
   - 添加 Google Analytics
   - 监控页面访问

## 🎯 下一步

完成部署后：

1. [ ] 确认隐私政策页面可访问
2. [ ] 在 Chrome Web Store 提交中填写隐私政策 URL
3. [ ] 考虑添加主页和其他页面
4. [ ] 分享你的扩展！

## 💰 费用

- Cloudflare Pages: **免费**
  - 无限带宽
  - 500 次构建/月
  - 自动 HTTPS
  - 全球 CDN

- 域名费用：`horizon-tab.app`
  - 年费约 $10-15（已支付）

完全足够个人项目使用！
