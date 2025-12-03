# Cloudflare Pages 配置步骤（根据你的截图）

## 当前状态
✅ 已连接 GitHub 仓库：`ttian226/horizon-new-tab`

## 需要修改的配置

### 1. Project name（项目名称）
```
horizon-new-tab
```
或者你喜欢的任何名称，例如：
- `horizon-privacy`
- `horizon-docs`
- `horizon-website`

### 2. Production branch（生产分支）
```
main
```
（保持默认，如果你的主分支是 main）

### 3. Build command（构建命令）⚠️ 重要

**删除** `npm run build`

**留空**（不填写任何内容）

**原因：**
- 你的 `docs/` 文件夹里是纯 HTML 文件
- 不需要 npm 构建
- 直接部署 HTML 即可

### 4. Build output directory（构建输出目录）

**删除默认的任何内容**

**填写：**
```
docs
```

**说明：**
- 你的隐私政策在 `docs/privacy-policy.html`
- Cloudflare 会部署 `docs` 文件夹里的所有内容

### 5. Root directory（根目录） - 在 Advanced settings 中

**留空**（使用仓库根目录）

或者如果有选项，设置为：
```
/
```

### 6. Environment variables（环境变量）

**不需要设置**（可以跳过）

## 完整配置截图对比

### ❌ 错误配置（你当前的）
```
Project name: (空)
Build command: npm run build
Build output directory: (空或默认值)
```

### ✅ 正确配置（应该改成）
```
Project name: horizon-new-tab
Build command: (留空，删除 npm run build)
Build output directory: docs
Root directory: (留空)
```

## 配置步骤

1. **清空 Build command**
   - 点击 "Build command" 输入框
   - 删除 `npm run build`
   - 确保完全为空

2. **设置 Build output directory**
   - 在 "Build output directory" 或下一页的输出目录
   - 填写：`docs`

3. **点击 Deploy**
   - 在页面底部点击蓝色的 "Deploy" 按钮

## 部署后

部署成功后，你会看到：

1. **默认域名**（Cloudflare 自动生成）：
   ```
   https://horizon-new-tab-xxx.pages.dev
   ```

2. **测试隐私政策**：
   ```
   https://horizon-new-tab-xxx.pages.dev/privacy-policy.html
   ```

3. **添加自定义域名**：
   - 在项目页面，点击 "Custom domains"
   - 添加：`horizon-tab.app`
   - 等待 DNS 生效（几分钟）

4. **最终 URL**：
   ```
   https://horizon-tab.app/privacy-policy.html
   ```

## 如果部署失败

### 常见错误 1：找不到 docs 目录

**错误信息：**
```
Error: Could not find build output directory
```

**解决方法：**
- 确认 `docs/privacy-policy.html` 已提交到 GitHub
- 运行检查：
  ```bash
  git ls-files | grep docs
  ```
- 如果没有，提交并推送：
  ```bash
  git add docs/privacy-policy.html
  git commit -m "Add privacy policy"
  git push
  ```

### 常见错误 2：npm 构建失败

**错误信息：**
```
npm run build failed
```

**解决方法：**
- 删除 Build command（留空）
- 重新部署

### 常见错误 3：页面 404

**原因：**
- Build output directory 设置错误

**解决方法：**
- 确认设置为 `docs`（不是 `dist` 或其他）

## 验证部署

部署成功后，检查：

1. ✅ 隐私政策页面可访问
2. ✅ 页面样式正确显示
3. ✅ HTTPS 自动启用
4. ✅ 响应速度快（全球 CDN）

## 下一步

部署成功后：

1. [ ] 添加自定义域名 `horizon-tab.app`
2. [ ] 测试 `https://horizon-tab.app/privacy-policy.html`
3. [ ] 在 Chrome Web Store 使用这个 URL
4. [ ] 考虑添加主页 `docs/index.html`（可选）

## 截图参考

### 正确的配置应该是：

```
┌─────────────────────────────────────┐
│ Set up your application             │
├─────────────────────────────────────┤
│ ttian226/horizon-new-tab            │
├─────────────────────────────────────┤
│ Project name                        │
│ horizon-new-tab                     │
├─────────────────────────────────────┤
│ Build command          [Optional]   │
│ (留空)                              │
├─────────────────────────────────────┤
│ Build output directory              │
│ docs                                │
├─────────────────────────────────────┤
│ ✓ Builds for non-production         │
├─────────────────────────────────────┤
│           [Back]        [Deploy]    │
└─────────────────────────────────────┘
```

## 重要提醒

⚠️ **不要使用 npm run build**
- 你的项目不需要构建
- `docs/` 里已经是最终的 HTML 文件

✅ **只需要告诉 Cloudflare 部署 docs 文件夹**
- Build output directory: `docs`
- 就这么简单！

## 需要帮助？

如果遇到问题：
1. 截图错误信息
2. 检查 GitHub 仓库 `docs` 文件夹是否存在
3. 确认配置和上面一致
