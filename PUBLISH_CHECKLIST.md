# 🚀 Chrome Web Store 发布准备清单

## 当前状态

根据你的项目，以下是需要准备的内容：

## ✅ 已完成

- [x] 扩展功能已开发完成
- [x] Firebase 后端已配置
- [x] 构建脚本已准备 (`npm run build`)
- [x] 打包脚本已准备 (`npm run package`)

## 📋 待准备素材

### 1. 扩展图标（Icons）⚠️ 必需

需要创建以下尺寸的图标：

- [ ] **icon-16.png** (16x16px) - 在扩展栏显示
- [ ] **icon-48.png** (48x48px) - 在扩展管理页面显示
- [ ] **icon-128.png** (128x128px) - Chrome Web Store 和安装时显示

**建议设计：**
- 使用 Horizon 的 Logo 或品牌标识
- 简洁、辨识度高
- 使用渐变或纯色背景
- 可以是 "H" 字母图标 + 日出/地平线元素

**创建方法：**
1. 使用 Figma / Canva / Photoshop 设计 512x512px 的主图标
2. 导出为 128x128、48x48、16x16 三个尺寸
3. 保存到 `public/icons/` 目录

**在线图标生成工具：**
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/
- https://www.figma.com/ (专业设计工具)

### 2. 商店截图（Screenshots）⚠️ 必需

需要至少 1 张，建议 3-5 张，尺寸 **1280x800px** 或 **640x400px**

**建议截图内容：**

- [ ] **主界面截图**
  - 展示：时钟、天气、美丽的壁纸
  - 标注：Clean, beautiful new tab page

- [ ] **设置面板截图**
  - 展示：天气设置、位置搜索
  - 标注：Customizable weather settings

- [ ] **收藏功能截图**
  - 展示：收藏的壁纸网格
  - 标注：Save your favorite wallpapers

- [ ] **Todo 功能截图**（如果有）
  - 展示：Todo 列表界面
  - 标注：Stay organized with cloud-synced todos

- [ ] **深色模式截图**（如果支持）
  - 展示：不同时段的界面

**如何截图：**
```bash
# 方法 1: 在浏览器中
1. 打开新标签页
2. F12 打开开发者工具
3. 点击设备模拟图标（Toggle device toolbar）
4. 设置自定义尺寸：1280 x 800
5. 截图（Chrome: Cmd/Ctrl + Shift + P → "Capture screenshot"）

# 方法 2: 使用截图工具
1. 调整浏览器窗口为 1280x800
2. 使用系统截图工具
3. 在图片编辑软件中裁剪到正确尺寸
```

### 3. 宣传图片（Promotional Images）

#### Small Promo Tile - **440x280px** ⚠️ 必需

用于 Chrome Web Store 的缩略图展示。

**建议内容：**
- 应用图标
- 应用名称："Horizon"
- 标语："Beautiful New Tab"
- 简洁的背景（可以是壁纸的模糊版本）

#### Marquee Promo - **1400x560px** （推荐）

用于 Chrome Web Store 的特色展示。

**建议内容：**
- 应用截图预览（2-3 张小图）
- 主要功能介绍（图标 + 文字）
- 视觉吸引力强的设计
- CTA："Install Now" 或 "Get Started"

**创建工具：**
- Canva (免费模板): https://www.canva.com/
- Figma (专业设计): https://www.figma.com/
- Photoshop / Illustrator

### 4. 隐私政策页面 ⚠️ 必需

- [ ] 创建隐私政策 HTML 页面
- [ ] 托管到 GitHub Pages 或其他服务
- [ ] 获取公开访问的 URL

**快速方法 - 使用 GitHub Pages：**

1. 在项目根目录创建 `docs` 文件夹：
   ```bash
   mkdir docs
   ```

2. 复制隐私政策模板到 `docs/privacy-policy.html`
   （模板见 CHROME_WEB_STORE_GUIDE.md）

3. 提交到 GitHub：
   ```bash
   git add docs/privacy-policy.html
   git commit -m "Add privacy policy"
   git push
   ```

4. 在 GitHub 项目设置中启用 GitHub Pages：
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main → /docs → Save

5. 获取 URL（几分钟后可用）：
   ```
   https://[你的用户名].github.io/horizon-new-tab/privacy-policy.html
   ```

### 5. 商店文字内容

#### 扩展名称（最多 45 个字符）
```
Horizon - Beautiful New Tab
```

#### 简短描述（最多 132 个字符）
```
Transform your new tab into a beautiful workspace with weather, focus tools, and daily inspiration
```

#### 详细描述

已在 CHROME_WEB_STORE_GUIDE.md 中提供完整模板。

#### 权限说明

需要为每个权限提供说明（见 CHROME_WEB_STORE_GUIDE.md）。

## 🎨 图标和素材创建任务

### 优先级 1（必需）
1. [ ] 创建 128x128px 图标
2. [ ] 创建 1 张主界面截图（1280x800px）
3. [ ] 创建 Small Promo Tile (440x280px)
4. [ ] 发布隐私政策页面

### 优先级 2（强烈推荐）
5. [ ] 创建 48x48px 和 16x16px 图标
6. [ ] 创建 3-5 张功能截图
7. [ ] 创建 Marquee Promo (1400x560px)

### 优先级 3（可选）
8. [ ] 创建宣传视频
9. [ ] 准备多语言描述

## 📦 更新 manifest.json

创建图标后，需要更新 `public/manifest.json`：

```json
{
  "manifest_version": 3,
  "name": "Horizon - Beautiful New Tab",
  "version": "1.0.0",
  "description": "Beautiful new tab page with focus tools, weather, and daily inspiration",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "permissions": [
    "storage",
    "alarms"
  ],
  "host_permissions": [
    "https://api.open-meteo.com/*",
    "https://nominatim.openstreetmap.org/*",
    "https://firestore.googleapis.com/*",
    "https://*.firebaseapp.com/*",
    "https://*.googleapis.com/*",
    "https://*.cloudfunctions.net/*"
  ],
  "chrome_url_overrides": {
    "newtab": "index.html"
  }
}
```

## 🎯 准备发布

完成上述素材后：

### 1. 更新版本号为 1.0.0

`package.json`:
```json
{
  "version": "1.0.0"
}
```

### 2. 构建生产版本
```bash
npm run build
```

### 3. 创建发布包
```bash
npm run package
```

### 4. 验证打包内容

检查 `release/horizon-new-tab-v1.0.0.zip` 包含：
- [ ] index.html
- [ ] manifest.json (包含 icons 字段)
- [ ] icons/ 目录（包含所有图标）
- [ ] assets/ 目录（CSS 和 JS）

### 5. 注册开发者账号

访问：https://chrome.google.com/webstore/devconsole/register
- 支付 $5 注册费
- 等待激活

### 6. 上传和提交

访问：https://chrome.google.com/webstore/devconsole
- 点击 "New Item"
- 上传 ZIP
- 填写所有商店信息
- 上传截图和宣传图
- 提交审核

## 📞 需要帮助？

### 设计资源（免费）

**图标：**
- Heroicons: https://heroicons.com/
- Lucide Icons: https://lucide.dev/
- Iconify: https://icon-sets.iconify.design/

**设计工具：**
- Canva: https://www.canva.com/ (模板丰富)
- Figma: https://www.figma.com/ (专业设计)
- GIMP: https://www.gimp.org/ (免费 PS 替代)

**在线图片编辑：**
- Photopea: https://www.photopea.com/ (在线 PS)
- Remove.bg: https://www.remove.bg/ (去背景)
- TinyPNG: https://tinypng.com/ (压缩图片)

### 外包设计（如果需要）

如果不想自己设计，可以在以下平台找设计师：

- Fiverr: $5-50 可以找到图标和宣传图设计
- Upwork: 专业设计师
- 99designs: 设计竞赛

## 🎬 下一步

1. **现在就开始：** 先创建最基本的图标和截图
2. **注册开发者账号：** 尽早注册，激活需要时间
3. **发布隐私政策：** 使用 GitHub Pages，很简单
4. **Unlisted 发布：** 先私有发布测试，确认无误后再公开

你已经完成了最难的部分（开发），剩下的只是准备素材和填表了！

需要我帮你创建图标或者生成隐私政策页面吗？
