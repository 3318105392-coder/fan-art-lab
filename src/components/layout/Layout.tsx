import { Link, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/editor/photocard', label: '小卡' },
  { path: '/editor/polaroid', label: '拍立得' },
  { path: '/editor/sticker', label: '贴纸' },
  { path: '/editor/postcard', label: '明信片' },
]

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-indigo-500 no-underline tracking-tight">
            FanArt Lab
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline border
                  ${location.pathname.startsWith(item.path)
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'text-gray-500 border-gray-300 hover:text-indigo-500 hover:border-indigo-300'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <Link
            to="/editor/photocard"
            className="px-5 py-2 rounded-full bg-indigo-500 text-white text-sm font-semibold
              hover:bg-indigo-600 shadow-sm shadow-indigo-200 transition-all no-underline
              active:scale-95"
          >
            开始制作 ✨
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      {isHome && (
        <footer className="bg-white border-t border-indigo-50 py-8 text-center text-sm text-gray-400">
          <p className="font-medium text-gray-500">FanArt Lab — 为爱发电的物料小工具</p>
          <p className="mt-1">免费 · 无需登录 · 高清下载 · 隐私安全</p>
        </footer>
      )}
    </div>
  )
}
