# Firebase Backend Configuration Guide

## 必需配置步骤

### 1. 启用 Google 身份验证（必需）

#### 步骤：
1. 打开 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 进入 **Authentication（身份验证）**
4. 点击 **Sign-in method（登录方法）** 选项卡
5. 找到 **Google** 提供商
6. 点击 **启用（Enable）**
7. 填写必需信息：
   - **项目公开名称**：Horizon New Tab（或你想要的名称）
   - **项目支持电子邮件**：你的邮箱
8. 点击 **保存**

#### 验证：
- Google 提供商状态应该显示为"已启用"

### 2. 配置授权域名（重要）

为了让 Firebase Auth popup 工作，需要添加授权域名：

#### 步骤：
1. 仍在 **Authentication** → **Settings（设置）** 选项卡
2. 滚动到 **Authorized domains（授权域名）**
3. 默认已包含：
   - `localhost`
   - `YOUR-PROJECT.firebaseapp.com`
   - `YOUR-PROJECT.web.app`

#### 对于 Chrome Extension：
由于使用 `signInWithPopup`，Firebase 会在授权域名中打开弹窗。Chrome Extension 默认应该可以工作，但如果遇到问题：

1. 在 **Authorized domains** 中，你可能需要添加：
   - `chrome-extension://` (通常不需要手动添加)

**通常情况下，默认配置就足够了！**

### 3. 部署 Firestore 安全规则（必需）

#### 步骤：

1. 确保已安装 Firebase CLI：
   ```bash
   npm install -g firebase-tools
   ```

2. 登录 Firebase：
   ```bash
   firebase login
   ```

3. 初始化项目（如果还没有）：
   ```bash
   firebase init
   ```
   - 选择 **Firestore**
   - 选择你的 Firebase 项目
   - 使用默认的 `firestore.rules` 文件
   - 使用默认的 `firestore.indexes.json` 文件

4. 部署 Firestore 规则：
   ```bash
   firebase deploy --only firestore:rules
   ```

#### 验证：
在 Firebase Console → Firestore Database → Rules，应该看到你的规则已更新。

### 4. 创建 Firestore 数据库（如果还没有）

#### 步骤：
1. Firebase Console → **Firestore Database**
2. 点击 **创建数据库（Create database）**
3. 选择模式：
   - **生产模式（Production mode）** - 推荐，使用 firestore.rules
   - 测试模式（Test mode） - 不推荐，30天后过期
4. 选择地区（推荐选择离用户最近的）：
   - `asia-east1` (台湾)
   - `asia-northeast1` (东京)
   - `us-central1` (美国中部)
5. 点击 **创建**

### 5. 配置 OAuth 同意屏幕（重要）

使用 Google 登录需要配置 OAuth 同意屏幕：

#### 步骤：
1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择与 Firebase 关联的项目
3. 进入 **APIs & Services（API 和服务）** → **OAuth consent screen（OAuth 同意屏幕）**
4. 配置：
   - **用户类型**：选择"外部"（External）
   - **应用名称**：Horizon New Tab
   - **用户支持电子邮件**：你的邮箱
   - **开发者联系信息**：你的邮箱
   - **授权域**：可以留空（对于测试）
   - **应用首页**：可以留空
   - **隐私政策链接**：可以留空（测试阶段）
5. 点击 **保存并继续**
6. **作用域（Scopes）**：
   - 添加 `.../auth/userinfo.email`
   - 添加 `.../auth/userinfo.profile`
   - 添加 `openid`
7. **测试用户**：
   - 如果应用处于"测试"状态，添加测试用户的 Gmail 地址
   - 最多可添加 100 个测试用户
8. 点击 **保存并继续**

#### 发布状态：
- **测试中**：只有添加的测试用户可以登录（最多 100 个）
- **已发布**：任何人都可以登录（需要通过 Google 审核）

对于内部测试，保持"测试中"状态，并添加所有测试人员的 Gmail。

## 当前项目配置检查清单

### 必需配置（必须完成）：
- [ ] Firebase Authentication 已启用
- [ ] Google 登录提供商已启用
- [ ] Firestore 数据库已创建
- [ ] Firestore 安全规则已部署
- [ ] OAuth 同意屏幕已配置
- [ ] 测试用户已添加（如果处于测试状态）

### 可选配置：
- [ ] 配置邮件模板（用于密码重置等）
- [ ] 启用其他登录方式（GitHub, Twitter 等）
- [ ] 配置 Firebase Storage（如果需要）

## 验证配置

### 测试登录流程：
1. 打开你的扩展
2. 点击登录按钮
3. 应该弹出 Google 登录窗口
4. 选择账号登录
5. 如果看到 "app_not_verified" 错误：
   - 检查 OAuth 同意屏幕配置
   - 确保测试用户已添加（如果在测试模式）
6. 登录成功后，检查 Firestore：
   - 应该在 `users/{uid}` 看到用户文档
   - 包含 settings 字段

### 常见错误及解决：

#### "app_not_verified"
- **原因**：OAuth 同意屏幕未配置或用户不在测试列表
- **解决**：在 Google Cloud Console 添加测试用户

#### "unauthorized_client"
- **原因**：OAuth 客户端配置问题
- **解决**：检查 Firebase Authentication 的 Google 提供商是否已启用

#### "Popup blocked"
- **原因**：浏览器阻止了弹窗
- **解决**：允许扩展的弹窗

#### "network-request-failed"
- **原因**：Firebase 配置错误或网络问题
- **解决**：检查 `src/config/firebase.ts` 配置是否正确

## 部署命令快速参考

```bash
# 部署所有配置
firebase deploy

# 只部署 Firestore 规则
firebase deploy --only firestore:rules

# 只部署 Firestore 索引
firebase deploy --only firestore:indexes

# 查看当前项目
firebase projects:list

# 切换项目
firebase use <project-id>
```

## 监控和调试

### Firebase Console：
- **Authentication** → **Users**：查看已登录用户
- **Firestore** → **Data**：查看数据库内容
- **Firestore** → **Usage**：监控读写次数
- **Authentication** → **Templates**：配置邮件模板

### Chrome DevTools：
- F12 → Console：查看错误日志
- F12 → Application → IndexedDB：查看 Firebase 本地缓存
- F12 → Network：查看 Firebase API 调用

## 费用说明

Firebase 免费套餐（Spark Plan）限制：
- **Authentication**：无限用户（免费）
- **Firestore**：
  - 50K 读/天
  - 20K 写/天
  - 20K 删除/天
  - 1 GB 存储
- **Cloud Functions**：2M 调用/月（如果使用）

超出限制需要升级到 Blaze Plan（按用量付费）。

对于小规模测试（<100 用户），免费套餐完全够用！
