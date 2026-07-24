import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useEditor } from '../../store/editorStore'
import { FONT_OPTIONS, FONT_WEIGHTS, BG_COLORS } from '../../types'
import type { TextLayer } from '../../types'
import { generateId, mmToPx } from '../../utils'

type Tab = 'preview' | 'template' | 'sticker' | 'text'

export default function LeftSidebar() {
  const location = useLocation()
  const isPolaroid = location.pathname.includes('polaroid')
  const [activeTab, setActiveTab] = useState<Tab>(isPolaroid ? 'template' : 'preview')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'preview', label: '效果图' },
    { key: 'template', label: '模版' },
    { key: 'sticker', label: '贴纸素材' },
    { key: 'text', label: '文字' },
  ]

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
      visible: true, locked: true, name: '模版',
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

/* ====== 贴纸素材 Tab ====== */
type StickerCategory = { key: string; label: string; type: 'emoji' | 'image'; stickers: string[]; folder?: string }

const STICKER_CATEGORIES: StickerCategory[] = [
  { key: 'emoji', label: 'Emoji', type: 'emoji', stickers: [
    '⭐', '🌟', '💫', '✨', '❤️', '💖', '💗', '💝', '💜', '💙',
    '🌸', '🌺', '🌷', '💐', '🎀', '🎵', '🎶', '♪', '🦋', '☁️',
    '🔥', '💎', '👑', '🎯', '💿', '📀', '🎤', '🎧', '📷',
    '🍀', '🌈', '❄️', '🫧', '🪐', '🌙', '⚡', '🎪', '🃏', '🎭',
  ]},
  { key: 'sweetcool', label: '甜酷', type: 'emoji', stickers: [
    '🖤', '💀', '🌹', '🕷️', '🕸️', '⛓️', '🗡️', '🩸', '💋', '🦇',
    '🔮', '🥀', '⚰️', '🪦', '🧷', '🩹', '🎱', '♠️', '♦️', '🃏',
  ]},
  { key: 'dopamine', label: '多巴胺', type: 'emoji', stickers: [
    '🌈', '🦄', '🍭', '🎀', '💝', '🧸', '🎈', '🍬', '💖', '🌟',
    '🍩', '🧁', '🎪', '🎠', '💫', '🌸', '🏵️', '🎨', '🪅', '🎉',
  ]},
  { key: 'deco', label: '装饰线框', type: 'emoji', stickers: [
    '―', '═', '┄', '┅', '○', '●', '◇', '◆', '□', '■',
    '△', '▲', '▽', '▼', '♡', '♥', '♢', '♦', '◌', '◎',
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

  // Get image files for a folder
  const getImageStickers = (folder: string): string[] => {
    const ranges: Record<string, [number, number]> = {
      '星星': [5945, 5976], '爱心': [7748, 8601],
      '猫爪': [7817, 7836], '蝴蝶结': [7797, 7816], '音符': [7728, 7747],
    }
    const [start, end] = ranges[folder] || [1, 40]
    return Array.from({ length: end - start + 1 }, (_, i) =>
      `/stickers/${folder}/IMG_${start + i}.png`)
  }

  const addEmojiSticker = (emoji: string) => {
    const id = generateId()
    const { canvasSize } = state
    dispatch({ type: 'ADD_LAYER', layer: {
      id, type: 'text',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - 20,
      y: mmToPx(canvasSize.height / 2 + canvasSize.bleed) - 20,
      width: 40, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name: '贴纸',
      text: emoji, fontSize: 36, fontFamily: 'sans-serif', fontWeight: 400,
      fill: '#000000', stroke: '', strokeWidth: 0,
      align: 'center', opacity: 1,
    }})
  }

  const addImageSticker = (src: string) => {
    const id = generateId()
    const { canvasSize } = state
    const size = mmToPx(15) // ~56px
    dispatch({ type: 'ADD_LAYER', layer: {
      id, type: 'sticker',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - size / 2,
      y: mmToPx(canvasSize.height / 2 + canvasSize.bleed) - size / 2,
      width: size, height: size,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name: '贴纸',
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
              <button key={i} onClick={() => addImageSticker(s)}
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

  const updateText = (changes: Partial<TextLayer>) => {
    if (state.selectedLayerId) dispatch({ type: 'UPDATE_LAYER', id: state.selectedLayerId, changes })
  }

  const handleAddText = () => {
    const id = generateId(); const { canvasSize } = state
    dispatch({ type: 'ADD_LAYER', layer: {
      id, type: 'text', text: '双击编辑文字',
      x: mmToPx(canvasSize.width / 2 + canvasSize.bleed) - 60,
      y: mmToPx(canvasSize.height * 0.65 + canvasSize.bleed),
      width: 120, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1,
      visible: true, locked: false, name: '文字',
      fontSize: 18, fontFamily: 'Noto Sans SC', fontWeight: 400,
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
        <select value={textLayer!.fontFamily}
          onChange={e => updateText({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white
            focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none">
          {FONT_OPTIONS.map(f => (
            <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>
          ))}
        </select>
        <p className="mt-2 text-base text-gray-500 truncate" style={{ fontFamily: textLayer!.fontFamily }}>
          字体预览 ABC 中文</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">粗细</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {FONT_WEIGHTS.map(fw => (
            <button key={fw.value} onClick={() => updateText({ fontWeight: fw.value })}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-all
                ${textLayer!.fontWeight === fw.value ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-150 bg-white text-gray-500 hover:border-gray-300'}`}
              style={{ fontWeight: fw.value }}>{fw.label}</button>
          ))}
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
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">文字内容</h4>
        <textarea value={textLayer!.text} onChange={e => updateText({ text: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none
            focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" rows={2} />
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
