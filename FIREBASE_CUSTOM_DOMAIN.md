# Firebase 自定义域名配置指南

## 目标

让 Firebase Authentication 使用你的自定义域名 `horizon-tab.app` 而不是默认的 `horizon-30aa6.firebaseapp.com`。

这样用户在 Google 登录时，看到的授权页面会显示你的品牌域名。

---

## 📋 配置步骤

### 步骤 1: 在 Firebase Console 添加授权域名

1. **访问 Firebase Console**
   - https://console.firebase.google.com/project/horizon-30aa6

2. **进入 Authentication 设置**
   - 左侧菜单 → **Authentication**
   - 点击 **Settings**（设置）标签

3. **添加授权域名**
   - 滚动到 **Authorized domains**（授权域名）部分
   - 点击 **Add domain**（添加域名）
   - 输入：`horizon-tab.app`
   - 点击 **Add**（添加）

### 步骤 2: 配置 Firebase Hosting（可选但推荐）

如果你想让整个 Firebase 项目使用自定义域名：

1. **进入 Hosting 设置**
   - Firebase Console → **Hosting**
   - 点击 **Get started**（如果是第一次）
   - 或点击 **Add custom domain**

2. **添加自定义域名**
   - 输入：`horizon-tab.app`
   - 点击 **Continue**

3. **验证域名所有权**
   - Firebase 会要求添加 TXT 记录到 DNS
   - 因为你的域名在 Cloudflare，需要手动添加

4. **在 Cloudflare 添加 DNS 记录**
   - 访问 Cloudflare Dashboard
   - 选择 `horizon-tab.app` 域名
   - DNS → Add record
   - 添加 Firebase 提供的 TXT 记录

5. **等待验证**
   - 返回 Firebase Console
   - 点击 **Verify**
   - 验证成功后，Firebase 会自动配置 SSL

---

## 🎯 推荐方案（最简单）

因为你已经在 Cloudflare Pages 部署了隐私政策，我建议：

### 方案 A: 只添加授权域名（最简单）

**只做步骤 1**：在 Firebase Authentication 添加 `horizon-tab.app` 到授权域名列表。

**优点：**
- ✅ 最简单，2 分钟完成
- ✅ 允许你的域名进行 OAuth 登录
- ✅ 不影响现有配置

**缺点：**
- Firebase Auth 弹窗仍然显示 `.firebaseapp.com` 域名
- 但功能完全正常

### 方案 B: 完整自定义域名（更专业）

**使用子域名区分服务：**

```
https://horizon-tab.app              → Cloudflare Pages (隐私政策、主页)
https://auth.horizon-tab.app         → Firebase Hosting (Auth 相关)
https://api.horizon-tab.app          → Firebase Functions (如果有)
```

**配置：**

1. **Cloudflare Pages**: 使用根域名 `horizon-tab.app`
   - 已配置 ✅

2. **Firebase Hosting**: 使用子域名 `auth.horizon-tab.app`
   - 在 Firebase Console → Hosting 添加
   - 在 Cloudflare DNS 添加 CNAME 记录

3. **Firebase Authentication**: 授权域名添加两个
   - `horizon-tab.app`
   - `auth.horizon-tab.app`

---

## ⚡ 快速操作（推荐）

### 现在立即做：添加授权域名

1. **打开 Firebase Console**
   - https://console.firebase.google.com/project/horizon-30aa6/authentication/settings

2. **找到 "Authorized domains"**
   - 应该已经有：
     - `localhost`
     - `horizon-30aa6.firebaseapp.com`
     - `horizon-30aa6.web.app`

3. **点击 "Add domain"**

4. **输入你的域名**
   ```
   horizon-tab.app
   ```

5. **点击 "Add"**

6. **完成！**

---

## 🔍 验证配置

### 测试 1: 检查授权域名列表

在 Firebase Console → Authentication → Settings → Authorized domains

应该看到：
```
✓ localhost
✓ horizon-30aa6.firebaseapp.com
✓ horizon-30aa6.web.app
✓ horizon-tab.app  ← 新添加的
```

### 测试 2: 测试登录

1. 在你的扩展中点击登录
2. Google OAuth 弹窗应该正常工作
3. 登录成功

---

## ❓ 常见问题

### Q: 为什么需要添加授权域名？

**A:** Firebase Auth 的安全机制要求：
- OAuth 重定向只能发生在授权的域名
- 如果域名不在列表中，登录会失败
- 错误信息：`unauthorized-domain`

### Q: 用户看到的授权页面会显示什么域名？

**A:** 取决于你的配置：

**只添加授权域名：**
- 用户看到：`horizon-30aa6.firebaseapp.com`
- 功能正常，但不够品牌化

**配置 Firebase Hosting 自定义域名：**
- 用户看到：`horizon-tab.app`
- 更专业，更品牌化

### Q: Cloudflare Pages 和 Firebase Hosting 会冲突吗？

**A:** 不会！可以并存：

**方案 1: 使用子域名**
```
horizon-tab.app           → Cloudflare Pages
auth.horizon-tab.app      → Firebase Hosting
```

**方案 2: 只用 Cloudflare Pages**
```
horizon-tab.app           → Cloudflare Pages（所有内容）
Firebase Auth             → 使用授权域名，但显示 .firebaseapp.com
```

推荐方案 2，最简单！

---

## 🎯 当前推荐配置

### 阶段 1: 现在（最小配置）

1. **Cloudflare Pages**: `horizon-tab.app`
   - 托管隐私政策
   - 托管主页（可选）

2. **Firebase Authentication**:
   - 授权域名添加：`horizon-tab.app`
   - OAuth 显示：`horizon-30aa6.firebaseapp.com`（默认）

### 阶段 2: 将来（完整品牌化，可选）

1. **配置 Firebase Hosting**:
   - 使用 `auth.horizon-tab.app`
   - OAuth 显示：`auth.horizon-tab.app`

2. **或者迁移到完全自建 Auth**:
   - 更复杂，但完全控制

---

## 📝 立即行动

**现在就做（5 分钟）：**

1. 访问：https://console.firebase.google.com/project/horizon-30aa6/authentication/settings

2. 滚动到 "Authorized domains"

3. 点击 "Add domain"

4. 输入：`horizon-tab.app`

5. 保存

**完成后：**
- ✅ 你的扩展可以在 `horizon-tab.app` 域名下使用 Google 登录
- ✅ 隐私政策在 `https://horizon-tab.app/privacy-policy.html`
- ✅ 可以提交到 Chrome Web Store 了！

---

## 🚀 下一步

添加授权域名后，你可以：

1. **测试 Chrome 扩展登录**
   - 确保 Google 登录正常工作

2. **准备 Chrome Web Store 素材**
   - 图标、截图、描述

3. **提交到 Chrome Web Store**
   - 使用隐私政策 URL: `https://horizon-tab.app/privacy-policy.html`

4. **发布和分享！**
