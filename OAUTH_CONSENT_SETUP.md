# OAuth 同意屏幕配置步骤（图文指南）

## 当前情况
你已经在 Google Cloud Console → APIs & Services → Credentials 页面。

现在使用 `signInWithPopup`，不需要 Chrome Extension 客户端 ID。
需要配置的是 **OAuth 同意屏幕**（OAuth Consent Screen）。

## 详细配置步骤

### 步骤 1: 进入 OAuth 同意屏幕配置

1. 在当前页面，点击左侧导航栏的 **"OAuth consent screen"**
   - 或直接访问：https://console.cloud.google.com/apis/credentials/consent?project=horizon-30aa6

### 步骤 2: 选择用户类型（首次配置才需要）

如果是第一次配置，会看到选择用户类型的页面：

- 选择 **"External"（外部）**
- 点击 **"CREATE"（创建）** 按钮

> 注：Internal（内部）仅适用于 Google Workspace 组织

### 步骤 3: 应用信息配置

填写以下必填字段：

#### App information（应用信息）
- **App name（应用名称）**: `Horizon New Tab`
- **User support email（用户支持电子邮件）**: 选择你的邮箱
- **App logo（应用图标）**: 可选，可以跳过

#### App domain（应用域名）- 可选
- 都可以留空
- Application home page: 留空
- Application privacy policy link: 留空
- Application terms of service link: 留空

#### Authorized domains（授权域名）- 可选
- 可以留空（测试阶段不需要）

#### Developer contact information（开发者联系信息）
- **Email addresses（电子邮件地址）**: 输入你的邮箱

点击 **"SAVE AND CONTINUE"（保存并继续）**

### 步骤 4: 作用域（Scopes）

这一步通常可以跳过，Firebase 会自动处理。

- 直接点击 **"SAVE AND CONTINUE"（保存并继续）**

> Firebase Authentication 会自动请求所需的 scopes（email, profile, openid）

### 步骤 5: 测试用户（重要！）⚠️

这是**最关键**的一步：

1. 点击 **"+ ADD USERS"（添加用户）** 按钮

2. 在弹出的输入框中，逐个添加测试用户的 Gmail 地址：
   ```
   your-email@gmail.com
   tester1@gmail.com
   tester2@gmail.com
   ```
   - 每行一个邮箱
   - 必须是完整的 Gmail 地址
   - 最多可添加 100 个测试用户

3. 点击 **"ADD"（添加）**

4. 点击 **"SAVE AND CONTINUE"（保存并继续）**

**重要提示**：
- 只有添加的测试用户才能登录你的应用
- 未添加的用户会看到 "Access blocked" 错误
- 记得添加你自己的邮箱！

### 步骤 6: 摘要（Summary）

- 检查配置信息
- 点击 **"BACK TO DASHBOARD"（返回信息中心）**

### 步骤 7: 发布状态

配置完成后，你的应用处于 **"Testing"（测试）** 状态：

- **Publishing status（发布状态）**: Testing
- **User cap（用户上限）**: 100 test users

在测试状态下：
- ✅ 添加的测试用户可以登录
- ❌ 其他用户无法登录
- ✅ 无需 Google 审核
- ✅ 适合内部测试

如果将来要公开发布：
- 点击 **"PUBLISH APP"（发布应用）** 按钮
- 需要通过 Google 的审核流程
- 审核通过后，所有用户都可以登录

## 验证配置

### 检查清单：
- [ ] OAuth 同意屏幕已配置
- [ ] 应用名称设置为 "Horizon New Tab"
- [ ] 测试用户已添加（包括你自己）
- [ ] 发布状态显示 "Testing"

### 查看测试用户列表：
1. 进入 OAuth consent screen 页面
2. 滚动到 "Test users" 部分
3. 应该看到你添加的所有测试用户

## Firebase Authentication 自动配置

配置 OAuth 同意屏幕后，Firebase Authentication 会自动：

1. 使用 Google Cloud 项目的 OAuth 配置
2. 创建 Web 应用客户端 ID（如果还没有）
3. 配置授权域名
4. 处理 OAuth 令牌交换

**你不需要手动创建 Web 客户端 ID！**

## 测试登录

配置完成后：

1. 重新打包扩展：
   ```bash
   npm run package
   ```

2. 重新安装扩展（或刷新）

3. 打开新标签页

4. 点击用户图标登录

5. 选择测试用户的 Gmail 账号

6. 第一次登录会看到确认页面：
   - 应用名称：Horizon New Tab
   - 请求的权限：email, profile
   - "This app isn't verified" 警告（正常）
   - 点击 **"Advanced"** → **"Go to Horizon New Tab (unsafe)"**
   - 点击 **"Continue"**

7. 登录成功！

## 常见问题

### "Access blocked: This app's request is invalid"
- **原因**：用户不在测试用户列表中
- **解决**：添加该用户到 OAuth 同意屏幕的测试用户列表

### "This app isn't verified"
- **原因**：应用处于测试状态，未经 Google 验证
- **解决**：这是正常的，点击 "Advanced" → "Go to Horizon New Tab (unsafe)"

### "redirect_uri_mismatch"
- **原因**：授权域名配置问题
- **解决**：检查 Firebase Authentication → Settings → Authorized domains

### 看不到登录弹窗
- **原因**：浏览器阻止了弹窗
- **解决**：检查地址栏是否有弹窗被阻止的图标，点击允许

## 截图说明

你的截图显示：
1. 第一张：OAuth Overview - 这是概览页面，显示使用统计
2. 第二张：Client ID for Chrome Extension - 这是旧的客户端 ID（现在不需要了）

你需要进入的是：
- 左侧菜单 → **"OAuth consent screen"** 标签
- 那里配置应用信息和测试用户

## 下一步

1. 点击左侧的 **"OAuth consent screen"**
2. 按照上述步骤配置
3. 添加测试用户
4. 测试登录功能
