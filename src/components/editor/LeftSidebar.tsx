import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useEditor } from '../../store/editorStore'
import { FONT_OPTIONS, FONT_WEIGHTS, BG_COLORS } from '../../types'
import type { TextLayer } from '../../types'
import { generateId, mmToPx, dedupName } from '../../utils'

type Tab = 'preview' | 'template' | 'sticker' | 'text' | 'shape'

export default function LeftSidebar() {
  const location = useLocation()
  const isPolaroid = location.pathname.includes('polaroid')
  const isSticker = location.pathname.includes('sticker')
  const [activeTab, setActiveTab] = useState<Tab>(isSticker ? 'shape' : isPolaroid ? 'template' : 'preview')

  const tabs: { key: Tab; label: string }[] = isSticker
    ? [{ key: 'shape' as Tab, label: '形状' }, { key: 'sticker' as Tab, label: '贴纸素材' }, { key: 'text' as Tab, label: '文字' }]
    : [{ key: 'preview' as Tab, label: '效果图' }, { key: 'template' as Tab, label: '模版' }, { key: 'sticker' as Tab, label: '贴纸素材' }, { key: 'text' as Tab, label: '文字' }]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex border-b border-gray-100">
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs font-medium transition-colors
              ${activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                : 'text-gray-400 hover:text-gray-600'}`}
          >{tab.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'preview' && <PreviewTab />}
        {activeTab === 'template' && <TemplateTab />}
        {activeTab === 'shape' && <ShapeTab />}
        {activeTab === 'sticker' && <StickerTab />}
        {activeTab === 'text' && <TextTab />}
      </div>
    </div>
  )
}

/* ====== Preview Thumbnails ====== */
function PreviewThumbnails() {
  const [previews, setPreviews] = useState<{ front?: string; back?: string }>({})

  // Poll for preview updates
  useEffect(() => {
    const check = () => {
      const p = (window as any).__previews
      if (p) setPreviews({ ...p })
    }
    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">正反面预览</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center">
          <div className="aspect-[54/86] rounded-lg border-2 border-indigo-200 overflow-hidden bg-gray-100">
            {previews.front
              ? <img src={previews.front} alt="正面预览" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 leading-tight">切换正反面后生成</div>}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">正面</span>
        </div>
        <div className="text-center">
          <div className="aspect-[54/86] rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100">
            {previews.back
              ? <img src={previews.back} alt="背面预览" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 leading-tight">切换正反面后生成</div>}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">背面</span>
        </div>
      </div>
    </div>
  )
}

/* ====== 效果图 Tab ====== */
function PreviewTab() {
  const { state, dispatch } = useEditor()
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">画布尺寸</h4>
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="flex justify-between"><span>宽度</span><span className="font-medium">{state.canvasSize.width}mm</span></div>
          <div className="flex justify-between mt-1"><span>高度</span><span className="font-medium">{state.canvasSize.height}mm</span></div>
          <div className="flex justify-between mt-1"><span>出血</span><span className="font-medium">{state.canvasSize.bleed}mm</span></div>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">背景颜色</h4>
        <div className="grid grid-cols-6 gap-2">
          {BG_COLORS.map(color => (
            <button key={color} onClick={() => dispatch({ type: 'SET_BACKGROUND_COLOR', color })}
              className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 relative overflow-hidden
                ${state.backgroundColor === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
              style={color === 'transparent' ? { background: 'white' } : { backgroundColor: color }}
              title={color === 'transparent' ? '无颜色' : color}>
              {color === 'transparent' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-full h-0.5 bg-red-400 rotate-45 absolute" />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="color" value={state.backgroundColor}
            onChange={e => dispatch({ type: 'SET_BACKGROUND_COLOR', color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          <span className="text-xs text-gray-400">自定义颜色</span>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">视图</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.showBleed}
              onChange={() => dispatch({ type: 'TOGGLE_BLEED' })}
              className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-400" />显示出血线</label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.showGrid}
              onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
              className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-400" />显示网格</label>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">缩放</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.max(0.25, state.zoom - 0.25) })}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">−</button>
          <span className="flex-1 text-center text-sm font-medium">{Math.round(state.zoom * 100)}%</span>
          <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.min(3, state.zoom + 0.25) })}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">+</button>
        </div>
        <button onClick={() => dispatch({ type: 'SET_ZOOM', zoom: 1 })}
          className="w-full mt-2 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">重置 100%</button>
      </div>

      {/* Preview thumbnails */}
      <PreviewThumbnails />
    </div>
  )
}

/* ====== 模版 Tab ====== */
function TemplateTab() {
  const { state, dispatch } = useEditor()

  const templateFiles = Array.from({ length: 49 }, (_, i) => {
    const group = String(Math.floor(i / 4) + 1).padStart(2, '0')
    const idx = String((i % 4) + 1).padStart(2, '0')
    return `/templates/polaroid/${group}${idx}.png`
  })

  useEffect(() => {
    templateFiles.forEach(src => { const img = new window.Image(); img.src = src })
  }, [])

  const applyTemplate = (src: string) => {
    // Remove existing template layer(s)
    state.layers.filter(l => l.name === '模版').forEach(l => {
      dispatch({ type: 'REMOVE_LAYER', id: l.id })
    })
    // Add template as a full-canvas image layer
    const { canvasSize } = state
    const totalW = mmToPx(canvasSize.width + canvasSize.bleed * 2)
    const totalH = mmToPx(canvasSize.height + canvasSize.bleed * 2)
    dispatch({ type: 'ADD_LAYER', layer: {
      id: generateId(), type: 'image', src,
      x: 0, y: 0, width: totalW, height: totalH,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: true,
      name: dedupName('模版', state.layers.map(l => l.name)),
    }})
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">点击模版立即应用</p>
      <div className="grid grid-cols-2 gap-2">
        {templateFiles.map((path, i) => (
          <button key={i} onClick={() => applyTemplate(path)}
            className="aspect-[54/86] rounded-lg border border-gray-200 overflow-hidden
              hover:border-indigo-400 hover:shadow-md transition-all bg-gray-50"
          >
            <img src={path} alt={`模版${i + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ====== 形状 Tab ====== */
const SHAPES = [
  { key: 'none', label: '无', icon: '⊘' },
  { key: 'square', label: '方形', icon: '□' },
  { key: 'rounded', label: '圆角', icon: '▢' },
  { key: 'circle', label: '圆形', icon: '○' },
  { key: 'heart', label: '爱心', icon: '♡' },
  { key: 'star', label: '星形', icon: '☆' },
  { key: 'diamond', label: '菱形', icon: '◇' },
  { key: 'triangle', label: '三角', icon: '△' },
] as const

function getStickerCfg() {
  return (window as any).__stickerConfig || { shape: 'none', shapeColor: '#ffffff', strokeWidth: 0, strokeColor: 'transparent', shapeParam: 1 }
}

function updateStickerCfg(part: any) {
  const cfg = { ...getStickerCfg(), ...part }
  ;(window as any).__stickerConfig = cfg
}

function ShapeTab() {
  const { dispatch } = useEditor()
  const [cfg, setCfg] = useState(getStickerCfg())
  const update = (part: any) => { const c = { ...cfg, ...part }; setCfg(c); updateStickerCfg(part); dispatch({ type: 'SET_BACKGROUND_COLOR', color: 'transparent' }) }

  useEffect(() => {
    const i = setInterval(() => setCfg(getStickerCfg()), 300)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">选择形状</h4>
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map(s => (
            <button key={s.key} onClick={() => update({ shape: s.key })} className={`py-2 rounded-lg text-xs border transition-all flex flex-col items-center gap-1
              ${cfg.shape === s.key ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <span className="text-lg">{s.icon}</span>{s.label}</button>
          ))}
        </div>
      </div>

      {cfg.shape !== 'none' && (
        <>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {cfg.shape === 'circle' ? '椭圆度' : cfg.shape === 'diamond' ? '长宽比' : cfg.shape === 'heart' ? '饱满度' : cfg.shape === 'star' ? '尖锐度' : cfg.shape === 'triangle' ? '高度' : '圆角'}
            </h4>
            <input type="range" min={0.5} max={2} step={0.1} value={cfg.shapeParam}
              onChange={e => update({ shapeParam: Number(e.target.value) })} className="w-full accent-indigo-500" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">背景颜色</h4>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {BG_COLORS.map(color => (
                <button key={color} onClick={() => update({ shapeColor: color })} className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 relative overflow-hidden
                  ${cfg.shapeColor === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                  style={color === 'transparent' ? { background: 'white' } : { backgroundColor: color }}>
                  {color === 'transparent' && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-0.5 bg-red-400 rotate-45 absolute" /></span>}
                </button>
              ))}
            </div>
            <input type="color" value={cfg.shapeColor} onChange={e => update({ shapeColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          </div>
        </>
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">描边: {cfg.strokeWidth}px</h4>
        <div className="flex items-center gap-1">
          <button onClick={() => update({ strokeWidth: Math.max(0, cfg.strokeWidth - 1) })} className="w-6 h-6 rounded bg-gray-100 text-xs">−</button>
          <input type="range" min={0} max={20} value={cfg.strokeWidth}
            onChange={e => update({ strokeWidth: Number(e.target.value) })} className="flex-1 accent-indigo-500" />
          <button onClick={() => update({ strokeWidth: Math.min(20, cfg.strokeWidth + 1) })} className="w-6 h-6 rounded bg-gray-100 text-xs">+</button>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">描边颜色</h4>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['transparent','#000','#fff','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#f472b6','#6366f1','#0ea5e9','#84cc16','#6b7280'].map(color => (
            <button key={color} onClick={() => update({ strokeColor: color })} className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 overflow-hidden
              ${cfg.strokeColor === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
              style={color === 'transparent' ? { background: 'white' } : { backgroundColor: color }} />
          ))}
        </div>
        <input type="color" value={cfg.strokeColor} onChange={e => update({ strokeColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
      </div>
    </div>
  )
}

/* ====== 贴纸素材 Tab ====== */
type StickerCategory = { key: string; label: string; type: 'emoji' | 'image'; stickers: string[]; folder?: string }

const STICKER_CATEGORIES: StickerCategory[] = [
  { key: 'emoji', label: 'Emoji', type: 'emoji', stickers: [
    '⭐', '🌟', '💫', '✨', '❤️', '💖', '💗', '💝', '💜', '💙',
    '🌸', '🌺', '🌷', '💐', '🎀', '🎵', '🎶', '♪', '🦋', '☁️',
    '🔥', '💎', '👑', '🎯', '💿', '📀', '🎤', '🎧', '📷',
    '🍀', '🌈', '❄️', '🫧', '🪐', '🌙', '⚡', '🎪', '🃏', '🎭',
  ]},
  // Image-based sticker folders
  { key: 'stars', label: '星星', type: 'image', stickers: [], folder: '星星' },
  { key: 'hearts', label: '爱心', type: 'image', stickers: [], folder: '爱心' },
  { key: 'paws', label: '猫爪', type: 'image', stickers: [], folder: '猫爪' },
  { key: 'bows', label: '蝴蝶结', type: 'image', stickers: [], folder: '蝴蝶结' },
  { key: 'notes', label: '音符', type: 'image', stickers: [], folder: '音符' },
]

function StickerTab() {
  const { dispatch, state } = useEditor()
  const [activeCat, setActiveCat] = useState('emoji')

  const currentCat = STICKER_CATEGORIES.find(c => c.key === activeCat)

  // Exact sticker file lists (avoids generating 404 URLs that lag)
  const STICKER_FILES: Record<string, string[]> = {
    '星星': ['5945','5946','5947','5948','5949','5950','5954','5955','5956','5957','5958','5959','5960','5961','5962','5963','5964','5965','5966','5967','5968','5969','5970','5971','5972','5973','5974','5975','5976'],
    '爱心': ['7748','7749','7750','7751','7752','7753','7754','7755','7756','7757','7758','7759','7760','7761','7762','7763','7764','7765','7766','7796','8583','8584','8585','8586','8587','8588','8589','8590','8591','8592','8593','8594','8595','8596','8597','8598','8599','8600','8601'],
    '猫爪': ['7817','7818','7819','7820','7821','7822','7823','7824','7825','7826','7827','7828','7829','7830','7831','7832','7833','7834','7835','7836'],
    '蝴蝶结': ['7797','7798','7799','7800','7801','7802','7803','7804','7805','7806','7807','7808','7809','7810','7811','7812','7813','7814','7815','7816'],
    '音符': ['7728','7729','7730','7731','7732','7733','7734','7735','7736','7737','7738','7739','7741','7742','7743','7744','7745','7746','7747'],
  }
  const getImageStickers = (folder: string): string[] =>
    (STICKER_FILES[folder] || []).map(n => `/stickers/${folder}/IMG_${n}.png`)

  const addEmojiSticker = (emoji: string) => {
    const { canvasSize, layers } = state
    const name = dedupName('Emoji', layers.map(l => l.name))
    dispatch({ type: 'ADD_LAYER', layer: {
      id: generateId(), type: 'text',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - 20,
      y: mmToPx(canvasSize.height / 2 + canvasSize.bleed) - 20,
      width: 40, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name,
      text: emoji, fontSize: 36, fontFamily: 'sans-serif', fontWeight: 400, fontStyle: 'normal',
      fill: '#000000', stroke: '', strokeWidth: 0,
      align: 'center', opacity: 1,
    }})
  }

  const addImageSticker = (src: string, catName: string) => {
    const { canvasSize, layers } = state
    const size = mmToPx(15)
    const name = dedupName(catName, layers.map(l => l.name))
    dispatch({ type: 'ADD_LAYER', layer: {
      id: generateId(), type: 'sticker',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - size / 2,
      y: mmToPx(canvasSize.height / 2 + canvasSize.bleed) - size / 2,
      width: size, height: size,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name,
      src,
    }})
  }

  const stickers = currentCat?.type === 'image' && currentCat?.folder
    ? getImageStickers(currentCat.folder)
    : (currentCat?.stickers || [])

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">点击贴纸添加到画布</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {STICKER_CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCat(cat.key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors
              ${activeCat === cat.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >{cat.label}</button>
        ))}
      </div>
      {currentCat && (
        <div className={currentCat.type === 'image' ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-5 gap-2'}>
          {stickers.map((s, i) => (
            currentCat.type === 'image' ? (
              <button key={i} onClick={() => addImageSticker(s, currentCat.label)}
                className="aspect-square rounded-xl bg-gray-50 hover:bg-indigo-50 hover:scale-105
                  flex items-center justify-center transition-all border border-gray-100 overflow-hidden p-1">
                <img src={s} alt="" className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </button>
            ) : (
              <button key={s} onClick={() => addEmojiSticker(s)}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:scale-110
                  flex items-center justify-center text-lg transition-all border border-gray-100"
                title={s}>{s}</button>
            )
          ))}
        </div>
      )}
    </div>
  )
}

/* ====== 文字 Tab ====== */
function TextTab() {
  const { state, dispatch } = useEditor()
  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId)
  const isTextSelected = selectedLayer?.type === 'text'
  const textLayer = isTextSelected ? selectedLayer as TextLayer : null

  const origFontRef = useRef<string | null>(null)

  const updateText = (changes: Partial<TextLayer>) => {
    if (state.selectedLayerId) dispatch({ type: 'UPDATE_LAYER', id: state.selectedLayerId, changes })
  }

  const previewFont = (family: string) => {
    if (!origFontRef.current) origFontRef.current = textLayer!.fontFamily
    updateText({ fontFamily: family })
  }

  const restoreFont = () => {
    if (origFontRef.current) { updateText({ fontFamily: origFontRef.current }); origFontRef.current = null }
  }

  const lockFont = (family: string) => {
    origFontRef.current = null
    updateText({ fontFamily: family })
  }

  const handleAddText = () => {
    const { canvasSize, layers } = state
    const name = dedupName('文字', layers.map(l => l.name))
    dispatch({ type: 'ADD_LAYER', layer: {
      id: generateId(), type: 'text', text: '双击编辑文字',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - 100,
      y: mmToPx(canvasSize.height * 0.65 + canvasSize.bleed),
      width: 200, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name,
      fontSize: 18, fontFamily: 'Noto Sans SC', fontWeight: 400, fontStyle: 'normal',
      fill: '#1e1b4b', stroke: '', strokeWidth: 0,
      align: 'center', shadow: undefined, opacity: 1,
    }})
  }

  if (!isTextSelected) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-gray-400">选择画布上的文字即可编辑样式</p>
        <p className="text-xs text-gray-300">或双击文字直接在画布上编辑</p>
        <button onClick={handleAddText}
          className="mt-4 px-5 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium
            hover:bg-indigo-600 transition-colors shadow-sm">添加新文字</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">字体</h4>
        <div className="px-3 py-1.5 mb-1 rounded-lg bg-indigo-50 text-xs text-indigo-600 font-medium">
          当前：{FONT_OPTIONS.find(f => f.family === textLayer!.fontFamily)?.label || textLayer!.fontFamily}
        </div>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-50">
          {FONT_OPTIONS.map(f => (
            <button key={f.family}
              onClick={() => lockFont(f.family)}
              onMouseEnter={() => previewFont(f.family)}
              onMouseLeave={restoreFont}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-indigo-50
                ${textLayer!.fontFamily === f.family ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-600'}`}
              style={{ fontFamily: f.family }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">粗细 & 斜体</h4>
        <div className="flex gap-2">
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {FONT_WEIGHTS.map(fw => (
              <button key={fw.value} onClick={() => updateText({ fontWeight: fw.value })}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-all
                  ${textLayer!.fontWeight === fw.value ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-150 bg-white text-gray-500 hover:border-gray-300'}`}
                style={{ fontWeight: fw.value }}>{fw.label}</button>
            ))}
          </div>
          <button onClick={() => updateText({ fontStyle: textLayer!.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all
              ${textLayer!.fontStyle === 'italic' ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-150 bg-white text-gray-500 hover:border-gray-300'}`}
            style={{ fontStyle: 'italic' }}>斜体</button>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          字号 <span className="font-normal text-gray-400">{textLayer!.fontSize}px</span></h4>
        <input type="range" min={8} max={120} value={textLayer!.fontSize}
          onChange={e => updateText({ fontSize: Number(e.target.value) })}
          className="w-full accent-indigo-500" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">文字颜色</h4>
        <div className="flex items-center gap-2">
          <input type="color" value={textLayer!.fill}
            onChange={e => updateText({ fill: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
          <span className="text-xs text-gray-400">{textLayer!.fill}</span>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">对齐</h4>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map(align => (
            <button key={align} onClick={() => updateText({ align })}
              className={`flex-1 py-1.5 rounded-lg text-xs border transition-all
                ${textLayer!.align === align ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >{align === 'left' ? '左' : align === 'center' ? '中' : '右'}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          透明度 <span className="font-normal text-gray-400">{Math.round(textLayer!.opacity * 100)}%</span></h4>
        <input type="range" min={0.1} max={1} step={0.1} value={textLayer!.opacity}
          onChange={e => updateText({ opacity: Number(e.target.value) })}
          className="w-full accent-indigo-500" />
      </div>
    </div>
  )
}
