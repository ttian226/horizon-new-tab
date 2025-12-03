# 修复 Cloudflare Pages 404 错误

## 问题

访问 `https://horizon-new-tab.pages.dev` 显示 404 错误。

**原因：** Cloudflare 部署了整个 GitHub 仓库根目录，但隐私政策在 `docs/privacy-policy.html`。

## 解决方案

### 方法 1: 修改构建配置（推荐）

#### 步骤 1: 进入项目设置

1. 访问 Cloudflare Dashboard
2. 左侧菜单 → **Workers & Pages**
3. 找到并点击 **horizon-new-tab** 项目

#### 步骤 2: 修改设置

1. 点击顶部的 **"Settings"** 标签

2. 滚动找到 **"Build & deployments"** 部分

3. 找到 **"Build configuration"**

4. 点击 **"Edit configuration"** 或 **"Configure Production deployments"**

5. 修改以下设置：

   **Build output directory（构建输出目录）:**
   ```
   docs
   ```

   或者，如果没有这个选项，设置：

   **Root directory（根目录）:**
   ```
   docs
   ```

6. 保存更改

#### 步骤 3: 重新部署

1. 点击 **"Deployments"** 标签

2. 点击 **"Retry deployment"** 或 **"Create deployment"**

3. 等待部署完成（约 1 分钟）

#### 步骤 4: 测试

访问：
```
https://horizon-new-tab.pages.dev/privacy-policy.html
```

应该能看到隐私政策页面！

---

### 方法 2: 添加 index.html 重定向

如果方法 1 不行，可以在仓库根目录添加一个 `index.html` 文件：

#### 创建根目录 index.html

```bash
# 在项目根目录创建 index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/docs/privacy-policy.html">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="/docs/privacy-policy.html">Privacy Policy</a>...</p>
</body>
</html>
EOF
```

然后提交并推送：
```bash
git add index.html
git commit -m "Add redirect to privacy policy"
git push
```

Cloudflare 会自动重新部署。

---

### 方法 3: 使用 _redirects 文件

在项目根目录创建 `_redirects` 文件：

```bash
cat > _redirects << 'EOF'
/  /docs/privacy-policy.html  301
/*  /docs/:splat  200
EOF
```

提交并推送：
```bash
git add _redirects
git commit -m "Add Cloudflare redirects"
git push
```

---

## 验证部署

### 检查当前部署了什么

1. 访问：
   ```
   https://horizon-new-tab.pages.dev/docs/privacy-policy.html
   ```

   - 如果能访问 → 说明部署了整个仓库，需要修改配置
   - 如果 404 → 说明其他问题

2. 访问：
   ```
   https://horizon-new-tab.pages.dev/privacy-policy.html
   ```

   - 如果能访问 → 配置正确！
   - 如果 404 → 继续排查

### 查看部署的文件

在 Cloudflare Dashboard 中：

1. 进入项目
2. 点击 **"Deployments"** 标签
3. 点击最新的部署
4. 查看 **"Build output"** 或部署日志

应该看到部署了 `docs` 文件夹的内容。

---

## 最佳配置

### 理想的项目结构

```
horizon-new-tab/
├── docs/                    ← Cloudflare 部署这个文件夹
│   ├── privacy-policy.html
│   └── index.html          ← 可选：主页
├── src/                     ← 扩展源代码
├── dist/                    ← 扩展构建输出
└── public/
```

### 理想的 Cloudflare 配置

```
Build command: (empty)
Build output directory: docs
Root directory: (empty)
```

### 最终 URL

```
https://horizon-new-tab.pages.dev/privacy-policy.html  ✅
https://horizon-tab.app/privacy-policy.html            ✅ (添加自定义域名后)
```

---

## 下一步：添加自定义域名

配置正确后，添加你的域名：

1. 在项目页面，点击 **"Custom domains"** 标签

2. 点击 **"Set up a custom domain"**

3. 输入：`horizon-tab.app`

4. Cloudflare 自动配置 DNS

5. 等待几分钟

6. 访问：
   ```
   https://horizon-tab.app/privacy-policy.html
   ```

---

## 故障排除

### 错误 1: 仍然 404

**检查：**
1. Build output directory 是否设置为 `docs`
2. `docs/privacy-policy.html` 是否存在于 GitHub
3. 重新部署是否成功

### 错误 2: 文件未找到

**检查：**
```bash
# 确认文件在 GitHub
git ls-files | grep docs
```

应该看到：
```
docs/privacy-policy.html
```

如果没有，提交并推送：
```bash
git add docs/privacy-policy.html
git commit -m "Add privacy policy"
git push
```

### 错误 3: 构建失败

**查看构建日志：**
1. Deployments → 点击失败的部署
2. 查看错误信息
3. 根据错误修复

---

## 快速修复命令

如果要重新开始：

```bash
# 确保 docs 文件夹已提交
git add docs/privacy-policy.html
git commit -m "Update privacy policy"
git push

# 在 Cloudflare 重新部署
# Dashboard → horizon-new-tab → Deployments → Retry deployment
```
