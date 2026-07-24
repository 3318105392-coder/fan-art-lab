# FanArt Lab — 饭圈物料 DIY 工具

在线制作饭圈应援物料的免费工具。拖拽上传照片，一键生成偶像小卡、拍立得、贴纸和明信片，无需下载任何软件。

## 功能

- **小卡**：54×86mm 标准尺寸，正反面自由设计，多图层编辑，300 DPI 高清下载
- **拍立得**：经典四边边框 + 底部白边，边框宽度和颜色可调，内置 49 套模板
- **贴纸**：AI 智能抠图（浏览器端运行，隐私安全），自由裁剪，描边效果
- **明信片**：100×148mm，精美模板，正反面设计（开发中）
- **其他**：15 款中英文字体、Emoji/甜酷/多巴胺/装饰线框 40+ 贴纸素材

## 技术栈

React 18 + TypeScript + Vite + Tailwind CSS + react-konva (Canvas 编辑引擎)

## 本地运行

```bash
npm install
npm run dev        # 开发服务器 → http://localhost:5173
npm run build      # 生产构建 → dist/
```

## 项目结构

```
src/
├── components/
│   ├── editor/          # 编辑器核心组件
│   │   ├── EditorCanvas.tsx      # 小卡画布
│   │   ├── PolaroidCanvas.tsx    # 拍立得画布
│   │   ├── LeftSidebar.tsx       # 左侧面板（效果图/模板/贴纸/文字）
│   │   └── LayerPanel.tsx        # 右图层面板
│   └── layout/          # 页面布局
├── pages/
│   ├── Home.tsx                 # 首页
│   └── editor/                  # 各编辑器页面
├── store/               # 状态管理（useReducer + Context）
├── types/               # TypeScript 类型定义
└── utils/               # 工具函数
```

## 部署

已部署于 Vercel，每次 `git push` 自动更新。

## 作者

饭圈物料 DIY 工具 — 为爱发电 ❤️
