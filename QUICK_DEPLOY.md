# 快速部署到 Cloudflare Pages

## 当前问题

1. ✅ 域名已购买：`horizon-tab.app`
2. ❌ Cloudflare Pages 部署 404
3. ❌ 使用的是 `.pages.dev` 而不是自定义域名

## 🚀 最简单的解决方案

### 方案：删除当前项目，重新用"上传文件"方式部署

#### 步骤 1: 删除当前项目

1. 访问 Cloudflare Dashboard
2. Workers & Pages → 找到 `horizon-new-tab` 项目
3. Settings → 滚动到底部
4. 点击 **"Delete deployment"** 或 **"Delete project"**
5. 确认删除

#### 步骤 2: 重新创建项目（上传文件方式）

1. Workers & Pages → **Create application**

2. 点击 **"Pages"** 标签

3. 选择 **"Upload assets"**（直接上传）

4. **拖拽或选择 `docs` 文件夹**
   - 在 Finder 中打开你的项目
   - 找到 `docs` 文件夹
   - 拖到 Cloudflare 上传区域

5. **Project name:**
   ```
   horizon-tab
   ```

6. **点击 "Deploy"**

7. **等待部署完成**（约 30 秒）

#### 步骤 3: 测试部署

部署成功后，访问：
```
https://horizon-tab.pages.dev/privacy-policy.html
```

应该能看到隐私政策页面！

#### 步骤 4: 添加自定义域名

1. 在项目页面，点击 **"Custom domains"** 标签

2. 点击 **"Set up a custom domain"**

3. 输入域名：
   ```
   horizon-tab.app
   ```

4. Cloudflare 会显示：
   - ✅ 域名在 Cloudflare 托管
   - ✅ 自动配置 DNS
   - 添加 CNAME 记录：`horizon-tab.pages.dev`

5. 点击 **"Activate domain"** 或 **"Continue"**

6. 等待几分钟，DNS 生效

#### 步骤 5: 测试自定义域名

访问：
```
https://horizon-tab.app/privacy-policy.html
```

✅ 成功！现在你的隐私政策在自己的域名下了！

---

## 🎯 为什么这个方法更好

**Git 集成方式的问题：**
- ❌ 需要处理私有仓库权限
- ❌ 需要配置 Build output directory
- ❌ 可能有构建配置问题

**直接上传方式的优点：**
- ✅ 不需要 GitHub 权限
- ✅ 不需要配置构建
- ✅ 立即生效
- ✅ 简单直接

**缺点：**
- 更新时需要手动重新上传

但对于隐私政策这种很少更新的页面，手动上传完全够用！

---

## 📝 详细操作步骤（带截图说明）

### 在 Finder 中找到 docs 文件夹

1. 打开 Finder
2. 前往：`/Users/wangxu/Code/chrome-extension/horizon-new-tab`
3. 找到 `docs` 文件夹
4. 里面应该有 `privacy-policy.html` 文件

### Cloudflare 上传界面

1. Create application → Pages → Upload assets

2. 你会看到一个上传区域：
   ```
   ┌────────────────────────────────────┐
   │  Drag and drop your files here     │
   │         or click to browse         │
   └────────────────────────────────────┘
   ```

3. 拖拽 `docs` 文件夹到这里

4. 或者点击浏览，选择 `docs` 文件夹

### 自定义域名配置

1. Custom domains → Set up a custom domain

2. 输入：`horizon-tab.app`

3. Cloudflare 检测到域名在它的 DNS 中，会显示：
   ```
   ✓ Domain is managed by Cloudflare
   ✓ DNS records will be automatically configured
   ```

4. 点击确认

5. DNS 记录会自动添加：
   ```
   Type: CNAME
   Name: horizon-tab.app
   Target: horizon-tab.pages.dev
   ```

---

## 🔄 更新隐私政策（将来）

当需要更新隐私政策时：

### 方法 1: 重新上传

1. 修改 `docs/privacy-policy.html`
2. Workers & Pages → horizon-tab 项目
3. Deployments → Create deployment
4. 上传新的 `docs` 文件夹

### 方法 2: 使用 Wrangler CLI（高级）

```bash
npm install -g wrangler
wrangler pages deploy docs --project-name=horizon-tab
```

---

## ✅ 最终结果

完成后，你将拥有：

1. **Cloudflare Pages 项目**: `horizon-tab`

2. **两个可访问的域名**:
   - `https://horizon-tab.pages.dev/privacy-policy.html`（默认）
   - `https://horizon-tab.app/privacy-policy.html`（自定义）

3. **Chrome Web Store 使用的 URL**:
   ```
   https://horizon-tab.app/privacy-policy.html
   ```

---

## 🎨 可选：添加主页

在 `docs` 文件夹创建 `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horizon - Beautiful New Tab</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      max-width: 600px;
      padding: 40px;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 20px;
      font-weight: 300;
    }
    p {
      font-size: 1.3em;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    a {
      color: white;
      text-decoration: none;
      opacity: 0.8;
      margin: 0 15px;
    }
    a:hover {
      opacity: 1;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌅 Horizon</h1>
    <p>Beautiful New Tab Extension</p>
    <div>
      <a href="/privacy-policy.html">Privacy Policy</a>
      <a href="https://github.com/ttian226/horizon-new-tab">GitHub</a>
    </div>
  </div>
</body>
</html>
```

然后重新上传 `docs` 文件夹，访问 `https://horizon-tab.app` 就能看到主页！

---

## 💰 费用

- Cloudflare Pages: **免费**
- 域名 `horizon-tab.app`: 已支付年费
- 总计：**$0/月**

完全免费托管！
