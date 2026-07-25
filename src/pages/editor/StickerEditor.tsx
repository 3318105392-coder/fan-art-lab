import { useReducer, useCallback, useState, useEffect } from 'react'
import { EditorContext, editorReducer, createInitialState } from '../../store/editorStore'
import { generateId, mmToPx, dedupName } from '../../utils'
import EditorCanvas from '../../components/editor/EditorCanvas'
import LayerPanel from '../../components/editor/LayerPanel'
import LeftSidebar from '../../components/editor/LeftSidebar'

const STICKER_SIZE = { width: 100, height: 100, bleed: 0.75 }

export default function StickerEditor() {
  const [state, dispatch] = useReducer(editorReducer, STICKER_SIZE, createInitialState)

  // Init sticker config in window
  useEffect(() => {
    if (!(window as any).__stickerConfig) {
      (window as any).__stickerConfig = { shape: 'none', shapeColor: '#ffffff', strokeWidth: 0, strokeColor: 'transparent', shapeParam: 1 }
    }
    dispatch({ type: 'SET_BACKGROUND_COLOR', color: 'transparent' })
  }, [dispatch])

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

  const handleRemoveBackground = useCallback(async (file: File) => {
    setIsRemoving(true); setRemoveProgress('0%')
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
        setIsRemoving(false); setRemoveProgress('')
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
          <LeftSidebar />
          <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-50"
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleAddImage(f) }}
            onDragOver={e => e.preventDefault()}>
            <EditorCanvas />
          </div>
          <div className="flex flex-col">
            <LayerPanel />
            <div className="w-56 p-3 border-t border-gray-200 bg-white space-y-2">
              <label className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                上传图片
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddImage(f) }} />
              </label>
              <label className="block w-full text-center px-4 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium cursor-pointer hover:bg-rose-100 transition-colors">
                上传照片自动抠图
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRemoveBackground(f) }} />
              </label>
              {isRemoving && (
                <div className="text-center py-2">
                  <div className="text-xs text-indigo-500 animate-pulse">{removeProgress}</div>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
              <button onClick={handleExport} className="w-full px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200">
                下载 PNG</button>
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
