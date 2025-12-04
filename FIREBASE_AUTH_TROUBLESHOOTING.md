# Firebase Authentication 登录错误修复

## 🔴 当前错误

```
FirebaseError: Firebase: Error (auth/internal-error)
```

以及 Google API CSP（内容安全策略）错误。

---

## 🎯 解决方案（按顺序执行）

### 步骤 1: 确认 OAuth 同意屏幕已配置

1. **访问 Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials/consent?project=horizon-30aa6
   ```

2. **检查配置状态**
   - 应用名称：已填写 ✓
   - 用户支持邮箱：已填写 ✓
   - 测试用户：**至少添加你自己的 Gmail** ⚠️

3. **如果测试用户为空**
   - 点击 "Test users" → "Add users"
   - 添加你的 Gmail 地址（例如：`ttian226@gmail.com`）
   - 保存

### 步骤 2: 确认 Firebase Authentication 已启用

1. **访问 Firebase Console**
   ```
   https://console.firebase.google.com/project/horizon-30aa6/authentication/providers
   ```

2. **检查 Google 提供商**
   - 状态应该显示：**已启用** ✓
   - 如果未启用，点击 Google → 开启

3. **添加授权域名**
   - Settings → Authorized domains
   - 确保包含：`localhost`
   - 添加（如果还没有）：`horizon-tab.app`

### 步骤 3: 修复 Chrome Extension CSP 问题

当前 `manifest.json` 可能缺少 CSP 配置。

#### 更新 manifest.json

需要在 manifest.json 中添加 `content_security_policy` 配置，允许 Google APIs 的脚本加载。

---

## 🔍 详细排查步骤

### 检查 1: OAuth 同意屏幕

**问题：** OAuth 同意屏幕未配置或缺少测试用户

**检查方法：**
1. 访问：https://console.cloud.google.com/apis/credentials/consent?project=horizon-30aa6
2. 查看是否有以下信息：
   - 应用名称
   - 用户支持电子邮件
   - 开发者联系信息

**如果状态是 "Testing"（测试中）：**
- 必须添加测试用户
- 只有测试用户列表中的账号可以登录
- 如果你的 Gmail 不在列表中，登录会失败

**解决方法：**
1. 滚动到 "Test users" 部分
2. 点击 "ADD USERS"
3. 输入你的 Gmail 地址
4. 点击 "SAVE"

### 检查 2: Firebase Authentication Google 提供商

**问题：** Google 登录提供商未启用

**检查方法：**
1. 访问：https://console.firebase.google.com/project/horizon-30aa6/authentication/providers
2. 找到 "Google" 提供商
3. 检查状态是否为 "Enabled"（已启用）

**如果未启用：**
1. 点击 Google
2. 切换开关到"开启"
3. 填写以下信息：
   - **项目支持电子邮件**：选择你的 Gmail
   - **项目公开名称**：`Horizon New Tab`
4. 保存

### 检查 3: 授权域名

**问题：** 登录重定向的域名不在授权列表中

**检查方法：**
1. Firebase Console → Authentication → Settings
2. 滚动到 "Authorized domains"
3. 检查是否包含：
   - `localhost` ✓
   - `horizon-30aa6.firebaseapp.com` ✓
   - `horizon-30aa6.web.app` ✓

**添加你的域名：**
1. 点击 "Add domain"
2. 输入：`horizon-tab.app`
3. 保存

### 检查 4: Chrome Extension CSP 配置

**问题：** Content Security Policy 阻止 Google APIs 脚本加载

**当前错误：**
```
Refused to load the script 'https://apis.google.com/js/api.js'
because it violates the following Content Security Policy directive
```

**解决方法：**

检查 `public/manifest.json` 是否有正确的 CSP 配置。

对于 Manifest V3，CSP 配置方式已改变。Firebase Auth 使用的 popup 方式应该不需要额外的 CSP 配置，但如果仍有问题，可以尝试添加：

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

---

## ⚡ 快速修复（最可能的原因）

### 最常见原因：OAuth 测试用户未添加

**快速修复步骤：**

1. **打开 Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials/consent?project=horizon-30aa6
   ```

2. **滚动到 "Test users" 部分**

3. **点击 "ADD USERS"**

4. **输入你的 Gmail 地址**
   ```
   your-email@gmail.com
   ```

5. **点击 "SAVE"**

6. **重新尝试登录**

如果 OAuth 同意屏幕处于 "Testing" 状态，这是 99% 导致 `auth/internal-error` 的原因！

---

## 🧪 测试验证

### 测试 1: 控制台日志

1. 打开 Chrome DevTools
2. 切换到 Console 标签
3. 点击登录按钮
4. 查看完整的错误信息

**正常的登录流程应该：**
1. 打开 Google 登录弹窗
2. 显示 OAuth 同意屏幕
3. 选择账号
4. 返回扩展并登录成功

**如果看到：**
- `auth/popup-closed-by-user` → 用户关闭了弹窗（正常）
- `auth/popup-blocked` → 浏览器阻止了弹窗
- `auth/internal-error` → OAuth 配置问题
- `auth/unauthorized-domain` → 域名未授权

### 测试 2: 检查 Firebase 配置

确认 `src/config/firebase.ts` 中的配置正确：

```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyAPA95DcThrXBxA9VXtooGpYGwp8hDUfQA',
  authDomain: 'horizon-30aa6.firebaseapp.com',
  projectId: 'horizon-30aa6',
  storageBucket: 'horizon-30aa6.firebasestorage.app',
  messagingSenderId: '950116773959',
  appId: '1:950116773959:web:ee39ab43b02e8aafe20c48',
}
```

检查：
- `authDomain` 应该是 `horizon-30aa6.firebaseapp.com`
- 如果你想使用自定义域名，需要额外配置

---

## 📝 完整检查清单

在提交问题前，确认以下所有步骤：

- [ ] **OAuth 同意屏幕已配置**
  - [ ] 应用名称已填写
  - [ ] 用户支持邮箱已填写
  - [ ] **测试用户已添加（包含你的 Gmail）**

- [ ] **Firebase Authentication 已启用**
  - [ ] Google 提供商状态：已启用
  - [ ] 授权域名包含 `localhost`
  - [ ] 授权域名包含 `horizon-tab.app`（可选）

- [ ] **Chrome Extension 配置正确**
  - [ ] manifest.json 包含必要的 host_permissions
  - [ ] 使用 `signInWithPopup` 方法（不是 chrome.identity）

- [ ] **扩展已重新加载**
  - [ ] 修改配置后，在 chrome://extensions 重新加载扩展
  - [ ] 清除浏览器缓存（可选）

---

## 🔧 高级故障排除

### 问题：弹窗被浏览器阻止

**错误：** `auth/popup-blocked`

**解决：**
1. 检查浏览器地址栏右侧是否有弹窗阻止图标
2. 点击并允许弹窗
3. 或者在浏览器设置中允许 `chrome-extension://[your-extension-id]` 的弹窗

### 问题：OAuth 客户端 ID 不匹配

**错误：** `auth/invalid-api-key` 或 `auth/app-not-authorized`

**解决：**
1. 确认 Firebase 项目 ID 正确
2. 确认 `firebase.ts` 中的 `apiKey` 和 `authDomain` 正确
3. 重新下载 Firebase 配置文件

### 问题：域名未授权

**错误：** `auth/unauthorized-domain`

**解决：**
1. Firebase Console → Authentication → Settings → Authorized domains
2. 添加出现在错误中的域名
3. 对于 Chrome Extension，通常需要添加 `chrome-extension://[extension-id]`
   - 但使用 `signInWithPopup` 时，这个应该不需要

---

## 🚀 成功后的下一步

登录成功后：

1. **测试功能**
   - 天气设置同步
   - 壁纸偏好保存
   - 登出/登录

2. **添加自定义域名到 Firebase**
   - 如果希望 OAuth 同意屏幕显示你的域名
   - 参考 `FIREBASE_CUSTOM_DOMAIN.md`

3. **准备发布**
   - Chrome Web Store 提交
   - 参考 `CHROME_WEB_STORE_GUIDE.md`

---

## 💡 常见问题

### Q: 为什么本地开发时需要添加测试用户？

**A:** 因为 OAuth 同意屏幕处于 "Testing" 状态：
- 未发布的应用只能由测试用户访问
- 需要手动添加每个测试用户
- 发布后（发布到 Chrome Web Store），所有用户都可以登录

### Q: 何时可以移除测试用户限制？

**A:** 当你的应用：
1. 提交到 Google OAuth 审核
2. 通过审核并发布
3. 或者只用于内部测试（保持 Testing 状态，限制测试用户）

### Q: CSP 错误是否影响登录？

**A:**
- 使用 `signInWithPopup` 时，CSP 错误通常不影响功能
- Google 登录在新窗口中进行，有自己的安全上下文
- 如果登录成功但看到 CSP 警告，可以忽略
- 如果登录失败且有 CSP 错误，需要检查 manifest.json

---

## 📞 需要进一步帮助？

如果以上步骤都完成了但仍然无法登录：

1. **截图以下内容：**
   - OAuth 同意屏幕配置页面
   - Firebase Authentication 提供商页面
   - Chrome DevTools 中的完整错误日志

2. **提供以下信息：**
   - 使用的 Chrome 版本
   - 扩展是否重新加载
   - 是否添加了测试用户

3. **检查 Firebase 配额：**
   - 访问：https://console.firebase.google.com/project/horizon-30aa6/usage
   - 确认没有超出免费配额
