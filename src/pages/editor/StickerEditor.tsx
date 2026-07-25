import { useReducer, useCallback, useState, useEffect } from 'react'
import { EditorContext, editorReducer, createInitialState } from '../../store/editorStore'
import { BG_COLORS } from '../../types'
import { generateId, mmToPx, dedupName } from '../../utils'
import EditorCanvas from '../../components/editor/EditorCanvas'
import LayerPanel from '../../components/editor/LayerPanel'

const STICKER_SIZE = { width: 100, height: 100, bleed: 0.75 }
type ShapeType = 'none' | 'square' | 'circle' | 'heart' | 'star' | 'diamond' | 'triangle' | 'rounded'

const SHAPES: { key: ShapeType; label: string; icon: string }[] = [
  { key: 'none', label: '无', icon: '⊘' },
  { key: 'square', label: '方形', icon: '□' },
  { key: 'rounded', label: '圆角', icon: '▢' },
  { key: 'circle', label: '圆形', icon: '○' },
  { key: 'heart', label: '爱心', icon: '♡' },
  { key: 'star', label: '星形', icon: '☆' },
  { key: 'diamond', label: '菱形', icon: '◇' },
  { key: 'triangle', label: '三角', icon: '△' },
]

export default function StickerEditor() {
  const [state, dispatch] = useReducer(editorReducer, STICKER_SIZE, createInitialState)
  const [shape, setShape] = useState<ShapeType>('none')
  const [shapeColor, setShapeColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [strokeColor, setStrokeColor] = useState('transparent')

  // Shape-specific adjust params
  const [shapeParam, setShapeParam] = useState(1) // multiplier (aspect, curve, sharpness etc)

  // Reset param when shape changes
  const handleShapeChange = (s: ShapeType) => {
    setShape(s)
    setShapeParam(1)
  }

  // Set transparent background on mount
  useEffect(() => {
    dispatch({ type: 'SET_BACKGROUND_COLOR', color: 'transparent' })
  }, [dispatch])

  // Expose sticker config for canvas rendering
  useEffect(() => {
    (window as any).__stickerConfig = { shape, shapeColor, strokeWidth, strokeColor, shapeParam }
  }, [shape, shapeColor, strokeWidth, strokeColor, shapeParam])

  // AI background removal state
  const [isRemoving, setIsRemoving] = useState(false)
  const [removeProgress, setRemoveProgress] = useState('')

  const handleAddImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const maxW = mmToPx(STICKER_SIZE.width * 0.8)
        const scale = Math.min(maxW / img.width, 300 / img.height)
        dispatch({ type: 'ADD_LAYER', layer: {
          id: generateId(), type: 'image', src,
          x: mmToPx(STICKER_SIZE.width / 2 + STICKER_SIZE.bleed) - (img.width * scale) / 2,
          y: mmToPx(STICKER_SIZE.height / 2 + STICKER_SIZE.bleed) - (img.height * scale) / 2,
          width: img.width * scale, height: img.height * scale,
          rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
          name: dedupName(file.name || '图片', state.layers.map(l => l.name)),
        }})
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [dispatch, state.layers])

  // AI Background Removal
  const handleRemoveBackground = useCallback(async (file: File) => {
    setIsRemoving(true)
    setRemoveProgress('0%')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          setRemoveProgress(`${Math.round((current / total) * 100)}%`)
        },
      })
      const url = URL.createObjectURL(blob)
      const img = new window.Image()
      img.onload = () => {
        const maxW = mmToPx(STICKER_SIZE.width * 0.8)
        const scale = Math.min(maxW / img.width, 300 / img.height)
        dispatch({ type: 'ADD_LAYER', layer: {
          id: generateId(), type: 'image', src: url,
          x: mmToPx(STICKER_SIZE.width / 2 + STICKER_SIZE.bleed) - (img.width * scale) / 2,
          y: mmToPx(STICKER_SIZE.height / 2 + STICKER_SIZE.bleed) - (img.height * scale) / 2,
          width: img.width * scale, height: img.height * scale,
          rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
          name: dedupName('抠图', state.layers.map(l => l.name)),
        }})
        setIsRemoving(false)
        setRemoveProgress('')
      }
      img.src = url
    } catch (err) {
      console.error('Remove BG failed:', err)
      setRemoveProgress('失败')
      setTimeout(() => { setIsRemoving(false); setRemoveProgress('') }, 2000)
    }
  }, [dispatch, state.layers])

  const handleExport = useCallback(() => {
    const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement
    if (!stageEl) return
    const dataUrl = stageEl.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `贴纸_${Date.now()}.png`
    link.href = dataUrl; document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }, [])

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Sticker Controls */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto p-4 space-y-5">
            {/* Shape */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">形状</h4>
              <div className="grid grid-cols-4 gap-2">
                {SHAPES.map(s => (
                  <button key={s.key} onClick={() => handleShapeChange(s.key)}
                    className={`py-2 rounded-lg text-xs border transition-all flex flex-col items-center gap-1
                      ${shape === s.key ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  ><span className="text-lg">{s.icon}</span>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Shape adjust param (circle/diamond/triangle/square/rounded only) */}
            {shape !== 'none' && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {shape === 'circle' ? '椭圆度' : shape === 'diamond' ? '长宽比' : shape === 'heart' ? '饱满度' : shape === 'star' ? '尖锐度' : shape === 'triangle' ? '高度' : '圆角'}
                  : <span className="font-medium text-indigo-600">{shapeParam.toFixed(1)}</span>
                </h4>
                <input type="range" min={shape === 'star' ? 0.2 : shape === 'heart' ? 0.3 : 0.5} max={shape === 'diamond' || shape === 'heart' ? 2 : 1.5} step={0.1}
                  value={shapeParam} onChange={e => setShapeParam(Number(e.target.value))}
                  className="w-full accent-indigo-500" />
              </div>
            )}

            {/* Shape Color */}
            {shape !== 'none' && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">背景颜色</h4>
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {BG_COLORS.map(color => (
                    <button key={color} onClick={() => setShapeColor(color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 relative overflow-hidden
                        ${shapeColor === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                      style={color === 'transparent' ? { background: 'white' } : { backgroundColor: color }}>
                      {color === 'transparent' && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-0.5 bg-red-400 rotate-45 absolute" /></span>}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={shapeColor} onChange={e => setShapeColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <span className="text-xs text-gray-400">自定义</span>
                </div>
              </div>
            )}

            {/* Stroke */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                描边宽度: <span className="font-medium text-indigo-600">{strokeWidth}px</span>
              </h4>
              <div className="flex items-center gap-2">
                <button onClick={() => setStrokeWidth(Math.max(0, strokeWidth - 1))}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">−</button>
                <input type="range" min={0} max={20} value={strokeWidth}
                  onChange={e => setStrokeWidth(Number(e.target.value))}
                  className="flex-1 accent-indigo-500" />
                <button onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">+</button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">描边颜色</h4>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {['transparent', '#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f472b6', '#6366f1', '#0ea5e9', '#84cc16', '#6b7280'].map(color => (
                  <button key={color} onClick={() => setStrokeColor(color)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 relative overflow-hidden
                      ${strokeColor === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                    style={color === 'transparent' ? { background: 'white' } : { backgroundColor: color }}>
                    {color === 'transparent' && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-0.5 bg-red-400 rotate-45 absolute" /></span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <span className="text-xs text-gray-400">{strokeColor}</span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-50"
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleAddImage(f) }}
            onDragOver={e => e.preventDefault()}>
            <EditorCanvas />
          </div>

          {/* Right Panel */}
          <div className="flex flex-col">
            <LayerPanel />
            <div className="w-56 p-3 border-t border-gray-200 bg-white space-y-2">
              {/* Upload + Remove BG */}
              <label className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600
                text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                上传图片
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddImage(f) }} />
              </label>

              <label className="block w-full text-center px-4 py-2 rounded-lg bg-rose-50 text-rose-600
                text-sm font-medium cursor-pointer hover:bg-rose-100 transition-colors">
                ✂ 上传照片自动抠图
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRemoveBackground(f) }} />
              </label>

              {/* Remove BG progress */}
              {isRemoving && (
                <div className="text-center py-2">
                  <div className="text-xs text-indigo-500 animate-pulse">{removeProgress}</div>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              <button onClick={handleExport}
                className="w-full px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium
                  hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200">
                下载 PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
