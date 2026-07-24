# FanArt Lab — 饭圈物料 DIY 工具

自由 DIY 饭圈应援物料的在线工具。上传照片、添加文字贴纸、调整图层，做出属于自己的小卡和拍立得。无需下载任何软件。

## 已上线功能

- **小卡**：54×86mm，正反面独立编辑，多图层自由拖拽，300 DPI 高清导出
- **拍立得**：四边可调边框 + 底部白边，颜色/宽度自由调整，内置 49 套模板
- **素材库**：15 款中英文字体、40+ Emoji/甜酷/多巴胺/装饰线框贴纸
- **其他**：背景颜色自定义、正反面实时预览、拖拽上传图片

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
