# FanArt Lab — 饭圈物料 DIY 工具

自由 DIY 饭圈应援物料的在线工具。上传照片、添加文字贴纸、调整图层，做出属于自己的小卡和拍立得，无需下载任何软件。

🔗 **[fan-art-lab.pages.dev](https://fan-art-lab.pages.dev)**

---

## 功能

- **小卡**：54×86mm，正反面独立编辑，多图层自由拖拽，300 DPI 高清导出
- **拍立得**：四边可调边框 + 底部白边，颜色/宽度自由调整，内置 49 套模板
- **素材库**：15 款中英文字体（hover 实时预览）、167+ 贴纸装饰素材（Emoji + 星星/爱心/猫爪/蝴蝶结/音符）
- **图层管理**：拖拽排序、显隐/锁定/删除、Delete 键快捷删除、自动命名 + 去重编号
- **其他**：背景颜色 13 色 + 自定义取色、正反面实时预览缩略图、拖拽上传图片

---

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · react-konva (Canvas 编辑引擎)

---

## 本地运行

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/3318105392-coder/fan-art-lab.git
cd fan-art-lab

# 安装依赖
npm install

# 启动开发服务器
npm run dev        # → http://localhost:5173

# 生产构建
npm run build      # → dist/
```

---

## 使用说明

1. 打开首页，点击「小卡」或「拍立得」进入编辑器，也可以直接拖拽照片到首页 Hero 区
2. **上传图片**：点击右侧「上传图片」或拖拽图片到画布
3. **编辑图层**：拖拽移动、8 锚点缩放、旋转；双击文字直接编辑
4. **添加装饰**：左侧「贴纸素材」Tab 选择分类，点击添加到画布
5. **调整样式**：左侧「文字」Tab 修改字体/粗细/斜体/颜色/对齐
6. **管理图层**：右侧面板拖拽排序、显隐、锁定、Delete 删除
7. **正反面**：顶部 Tab 切换正反面，独立编辑
8. **下载**：点击「下载 PNG」导出 300 DPI 高清图

---

## 项目结构

```
src/
├── components/
│   ├── editor/
│   │   ├── EditorCanvas.tsx      # 小卡画布（Konva Stage + Layer）
│   │   ├── PolaroidCanvas.tsx    # 拍立得画布（含四边边框渲染）
│   │   ├── LeftSidebar.tsx       # 左侧面板（效果图/模板/贴纸/文字 Tab）
│   │   └── LayerPanel.tsx        # 右图层面板（拖拽排序 + 显隐/锁定/删除）
│   └── layout/
│       └── Layout.tsx            # 全局布局（Header + Nav）
├── pages/
│   ├── Home.tsx                  # 首页
│   └── editor/
│       ├── PhotocardEditor.tsx   # 小卡编辑器
│       ├── PolaroidEditor.tsx    # 拍立得编辑器
│       ├── StickerEditor.tsx     # 贴纸（占位）
│       └── PostcardEditor.tsx    # 明信片（占位）
├── store/
│   └── editorStore.ts            # 编辑器状态（useReducer + Context）
├── types/
│   └── index.ts                  # TypeScript 类型 + 常量
└── utils/
    └── index.ts                  # 工具函数（ID/命名去重/单位转换）
```

---

## 状态

🟢 活跃开发中 — 小卡和拍立得编辑器已上线，贴纸和明信片开发中。

---

## 许可证

MIT

---

## 联系方式

- 📁 [GitHub Issues](https://github.com/3318105392-coder/fan-art-lab/issues)
