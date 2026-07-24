import { Link } from 'react-router-dom'

export default function StickerEditor() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="text-6xl mb-6">⭐</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-3">贴纸编辑器</h1>
      <p className="text-gray-500 mb-8">
        AI 智能抠图 · 形状裁剪 · 描边效果 · 透明 PNG
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-sm text-amber-700">
        🚧 此功能正在开发中，将在 Phase 3 上线。敬请期待！
      </div>
      <Link to="/" className="text-primary hover:underline">← 返回首页</Link>
    </div>
  )
}
