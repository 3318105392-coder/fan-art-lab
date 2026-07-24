import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const productTypes = [
  {
    path: '/editor/photocard',
    title: '小卡',
    icon: '🃏',
    tags: ['54×86mm', '正反面DIY', '高清导出'],
    color: 'indigo',
  },
  {
    path: '/editor/polaroid',
    title: '拍立得',
    icon: '📸',
    tags: ['四边边框', '可调宽度', '底部白边'],
    color: 'violet',
  },
  {
    path: '/editor/sticker',
    title: '贴纸',
    icon: '⭐',
    tags: ['AI抠图', '自由裁剪', '透明PNG'],
    color: 'amber',
  },
  {
    path: '/editor/postcard',
    title: '明信片',
    icon: '💌',
    tags: ['100×148mm', '精美模板', '正反面'],
    color: 'sky',
  },
]

const colorMap: Record<string, { bg: string; tag: string; hover: string; shadow: string; gradient: string }> = {
  indigo: { bg: 'bg-indigo-50', tag: 'bg-indigo-100 text-indigo-600', hover: 'hover:border-indigo-300 hover:shadow-indigo-100', shadow: 'shadow-indigo-100', gradient: 'from-indigo-500 to-violet-500' },
  violet: { bg: 'bg-violet-50', tag: 'bg-violet-100 text-violet-600', hover: 'hover:border-violet-300 hover:shadow-violet-100', shadow: 'shadow-violet-100', gradient: 'from-violet-500 to-purple-500' },
  amber: { bg: 'bg-amber-50', tag: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-300 hover:shadow-amber-100', shadow: 'shadow-amber-100', gradient: 'from-amber-400 to-orange-400' },
  sky: { bg: 'bg-sky-50', tag: 'bg-sky-100 text-sky-600', hover: 'hover:border-sky-300 hover:shadow-sky-100', shadow: 'shadow-sky-100', gradient: 'from-sky-400 to-cyan-400' },
}

export default function Home() {
  const navigate = useNavigate()

  // Handle photo drop on hero preview
  const handleHeroDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        navigate('/editor/photocard', { state: { imageSrc: reader.result as string } })
      }
      reader.readAsDataURL(file)
    }
  }, [navigate])

  const handleHeroDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  return (
    <div>
      {/* ===== Hero Section ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="flex items-center gap-16">
          {/* Left: Text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-500 text-sm font-medium mb-6">
              ✨ 为爱发电的物料小工具
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
              做出属于你的
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                专属应援物料
              </span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-md">
              简单拖拽就能做出偶像小卡、拍立得、贴纸和明信片~
              <br />
              不用学 PS，打开浏览器就能开始创作！
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/editor/photocard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full
                  bg-indigo-500 text-white font-semibold text-base
                  hover:bg-indigo-600 shadow-lg shadow-indigo-200
                  transition-all no-underline active:scale-95"
              >
                开始制作 ✨
              </Link>
              <span className="text-sm text-gray-400">
                免费 · 无需登录 · 高清下载
              </span>
            </div>
          </div>

          {/* Right: Preview placeholder with drag-drop */}
          <div className="flex-1 hidden lg:block">
            <div className="relative"
              onDrop={handleHeroDrop}
              onDragOver={handleHeroDragOver}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-violet-50 to-purple-100 rounded-3xl rotate-3" />

              <div className="relative bg-white rounded-2xl shadow-xl shadow-indigo-100 p-6 rotate-[-1deg]">
                <div className="aspect-[54/86] bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl
                  flex flex-col items-center justify-center border-2 border-dashed border-indigo-200
                  max-w-[200px] mx-auto transition-all hover:border-indigo-400 hover:bg-indigo-50/50
                  cursor-pointer"
                  onDrop={handleHeroDrop}
                  onDragOver={handleHeroDragOver}
                >
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm text-indigo-400 font-medium text-center leading-relaxed">
                    拖入你的照片
                    <br />
                    开始创作吧~
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-400">
                    54 × 86mm · 300 DPI
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-4 w-14 h-14 bg-amber-100 rounded-2xl rotate-12 flex items-center justify-center text-2xl shadow-md">⭐</div>
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-lg shadow-md">💜</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Product Entry Cards ===== */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">想做什么？选一个开始吧~</h2>
          <p className="text-gray-400 text-sm">四种饭圈常用物料，全都支持高清下载</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {productTypes.map(product => {
            const c = colorMap[product.color]
            return (
              <Link
                key={product.path}
                to={product.path}
                className={`group block bg-white rounded-2xl border-2 border-gray-100 p-6
                  ${c.hover} shadow-sm hover:shadow-lg transition-all duration-300 no-underline`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center text-2xl mb-4
                  group-hover:scale-110 transition-transform`}>
                  {product.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2.5">
                  {product.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map(tag => (
                    <span key={tag} className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${c.tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-8 text-center border-t border-gray-100 pt-14">
          {[
            { icon: '🎨', title: '自由 DIY', desc: '拖拽编辑、多图层、贴纸素材，随心搭配~' },
            { icon: '🤖', title: 'AI 智能抠图', desc: '浏览器端运行，不上传服务器，隐私安全！' },
            { icon: '📦', title: '高清下载', desc: '300 DPI 印刷级导出，PNG/JPG 任你选' },
          ].map(f => (
            <div key={f.title} className="group">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl
                group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
