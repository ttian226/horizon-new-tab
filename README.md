# Horizon New Tab

A beautiful, productivity-focused new tab Chrome extension inspired by Momentum.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Blaze Plan)
  - Authentication (Google Sign-in)
  - Cloud Firestore (Database)
  - Cloud Functions (Scheduled wallpaper updates)
- **APIs**:
  - Unsplash (背景图片 - 4 categories)
  - Open-Meteo (天气 - 免费)
- **Storage**: chrome.storage.local + Firestore

## Firebase Project

- **Project ID**: `horizon-30aa6`
- **Plan**: Blaze (Pay as you go)
- **Free Credits**: $300 (expires Feb 19, 2026)

## Project Structure

```
horizon-new-tab/
├── public/
│   ├── manifest.json      # Chrome 扩展配置 (Manifest V3)
│   └── icons/             # 扩展图标
├── src/
│   ├── config/
│   │   └── firebase.ts    # Firebase 配置
│   ├── components/        # React 组件
│   ├── services/
│   │   ├── auth.ts        # Firebase Auth 服务
│   │   ├── firestore.ts   # Firestore 数据服务
│   │   ├── weather.ts     # Open-Meteo API
│   │   ├── background.ts  # 背景图片服务
│   │   └── quotes.ts      # 格言服务
│   ├── utils/
│   │   └── storage.ts     # Chrome Storage 工具
│   ├── styles/            # 样式文件
│   ├── assets/            # 静态资源
│   ├── App.tsx            # 主组件
│   └── main.tsx           # 入口文件
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Development

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 监听模式构建
npm run watch
```

## Load Extension in Chrome

1. Run `npm run build`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Planned Features

### Free Version
- [ ] 时钟显示
- [ ] 每日问候
- [ ] 背景图片 (Pexels API)
- [ ] 天气组件 (Open-Meteo API)
- [ ] 每日名言 (Quotable API)
- [ ] 待办事项 (本地存储)
- [ ] 快捷链接
- [ ] 搜索框

### Premium Version
- [ ] 自定义背景上传
- [ ] 番茄钟/专注模式
- [ ] 任务管理集成
- [ ] 环境音效
- [ ] 云端同步

## API Resources

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Pexels](https://www.pexels.com/api/) | 背景图片 | 20,000/月 |
| [Open-Meteo](https://open-meteo.com/) | 天气数据 | 无限制 |
| [Quotable](https://github.com/lukePeavey/quotable) | 名言 | 无限制 |

## License

MIT
