import { useReducer, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { EditorContext, editorReducer, createInitialState } from '../../store/editorStore'
import { DEFAULT_PHOTOCARD_SIZE } from '../../types'
import { generateId, mmToPx, dedupName } from '../../utils'
import EditorCanvas from '../../components/editor/EditorCanvas'
import LayerPanel from '../../components/editor/LayerPanel'
import LeftSidebar from '../../components/editor/LeftSidebar'

type Side = 'front' | 'back'

export default function PhotocardEditor() {
  const location = useLocation()
  const [side, setSide] = useState<Side>('front')
  const [frontState, frontDispatch] = useReducer(editorReducer, DEFAULT_PHOTOCARD_SIZE, createInitialState)
  const [backState, backDispatch] = useReducer(editorReducer, DEFAULT_PHOTOCARD_SIZE, createInitialState)
  const loadedRef = useRef(false)

  const state = side === 'front' ? frontState : backState
  const dispatch = side === 'front' ? frontDispatch : backDispatch

  // Capture preview thumbnail when switching sides
  const capturePreview = (which: 'front' | 'back') => {
    const stage = (window as any).__editorStage
    if (!stage) return
    try {
      const dataUrl = stage.toDataURL({ pixelRatio: 0.8, mimeType: 'image/png' })
      ;(window as any).__previews = { ...(window as any).__previews || {}, [which]: dataUrl }
    } catch {}
  }
  const handleSideSwitch = (s: Side) => {
    capturePreview(side)
    setSide(s)
  }

  useEffect(() => {
    const imageSrc = (location.state as any)?.imageSrc
    if (imageSrc && !loadedRef.current) {
      loadedRef.current = true
      const img = new window.Image()
      img.onload = () => {
        const safeW = mmToPx(DEFAULT_PHOTOCARD_SIZE.width * 0.8)
        const scale = Math.min(safeW / img.width, 200 / img.height)
        frontDispatch({ type: 'ADD_LAYER', layer: {
          id: generateId(), type: 'image', src: imageSrc,
          x: mmToPx(DEFAULT_PHOTOCARD_SIZE.width / 2 + DEFAULT_PHOTOCARD_SIZE.bleed) - (img.width * scale) / 2,
          y: mmToPx(DEFAULT_PHOTOCARD_SIZE.height / 3 + DEFAULT_PHOTOCARD_SIZE.bleed) - (img.height * scale) / 2,
          width: img.width * scale, height: img.height * scale,
          rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
          name: dedupName('导入的照片', frontState.layers.map(l => l.name)),
        }})
        window.history.replaceState({}, '')
      }
      img.src = imageSrc
    }
  }, [])

  const handleAddImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const safeW = mmToPx(DEFAULT_PHOTOCARD_SIZE.width * 0.8)
        const scale = Math.min(safeW / img.width, 200 / img.height)
        dispatch({ type: 'ADD_LAYER', layer: {
          id: generateId(), type: 'image', src,
          x: mmToPx(DEFAULT_PHOTOCARD_SIZE.width / 2 + DEFAULT_PHOTOCARD_SIZE.bleed) - (img.width * scale) / 2,
          y: mmToPx(DEFAULT_PHOTOCARD_SIZE.height / 3 + DEFAULT_PHOTOCARD_SIZE.bleed) - (img.height * scale) / 2,
          width: img.width * scale, height: img.height * scale,
          rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
          name: dedupName(file.name || '图片', state.layers.map(l => l.name)),
        }})
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [dispatch, state.layers])

  const handleAddText = useCallback(() => {
    dispatch({ type: 'ADD_LAYER', layer: {
      id: generateId(), type: 'text', text: '双击编辑文字',
      x: mmToPx(DEFAULT_PHOTOCARD_SIZE.width / 2 + DEFAULT_PHOTOCARD_SIZE.bleed) - 60,
      y: mmToPx(DEFAULT_PHOTOCARD_SIZE.height * 0.7 + DEFAULT_PHOTOCARD_SIZE.bleed),
      width: 120, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
      name: dedupName('文字', state.layers.map(l => l.name)),
      fontSize: 18, fontFamily: 'Noto Sans SC', fontWeight: 400,
      fill: '#1e1b4b', stroke: '', strokeWidth: 0, align: 'center', shadow: undefined, opacity: 1,
    }})
  }, [dispatch, state.layers])

  const handleExport = useCallback(() => {
    const stage = (window as any).__editorStage as any
    if (!stage) return
    // Hide transformer and bleed layer before export
    const transformer = stage.findOne('Transformer')
    const bleedLayer = stage.getLayers?.()?.find((l: any) => l.name() === 'bleed')
    if (transformer) transformer.visible(false)
    if (bleedLayer) bleedLayer.visible(false)
    const dataUrl = stage.toDataURL({ pixelRatio: 3, mimeType: 'image/png' })
    if (transformer) transformer.visible(true)
    if (bleedLayer) bleedLayer.visible(true)
    const link = document.createElement('a')
    link.download = `小卡_${side === 'front' ? '正面' : '背面'}_${Date.now()}.png`
    link.href = dataUrl; document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }, [side])

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Front/Back Tabs */}
        <div className="flex items-center justify-center gap-1 py-2 bg-white border-b border-gray-100">
          {(['front', 'back'] as Side[]).map(s => (
            <button key={s} onClick={() => handleSideSwitch(s)}
              className={`px-6 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${side === s ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            >{s === 'front' ? '正面' : '背面'}</button>
          ))}
        </div>

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
              <label className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600
                text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                上传图片
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddImage(f) }} />
              </label>
              <button onClick={handleAddText}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                添加文字</button>
              <button onClick={handleExport}
                className="w-full px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200">
                下载 PNG</button>
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
