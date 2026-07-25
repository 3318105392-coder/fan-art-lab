import { useReducer, useCallback, useState, useEffect, useRef } from 'react'
import { EditorContext, editorReducer, createInitialState } from '../../store/editorStore'
import { generateId, mmToPx, dedupName } from '../../utils'
import EditorCanvas from '../../components/editor/EditorCanvas'
import PolaroidCanvas from '../../components/editor/PolaroidCanvas'
import LayerPanel from '../../components/editor/LayerPanel'
import LeftSidebar from '../../components/editor/LeftSidebar'

const POLAROID_SIZE = { width: 54, height: 86, bleed: 1.5 }
type Side = 'front' | 'back'

export default function PolaroidEditor() {
  const [side, setSide] = useState<Side>('front')
  const [frontState, frontDispatch] = useReducer(editorReducer, POLAROID_SIZE, createInitialState)
  const [backState, backDispatch] = useReducer(editorReducer, POLAROID_SIZE, createInitialState)
  const frameAddedRef = useRef(false)

  const state = side === 'front' ? frontState : backState
  const dispatch = side === 'front' ? frontDispatch : backDispatch

  // Add polaroid frame layer on front init (once)
  useEffect(() => {
    if (!frameAddedRef.current && frontState.layers.length === 0) {
      frameAddedRef.current = true
      frontDispatch({ type: 'ADD_LAYER', layer: {
        id: generateId(), type: 'shape', shapeType: 'rect',
        x: 0, y: 0, width: 0, height: 0,
        rotation: 0, scaleX: 1, scaleY: 1,
        visible: true, locked: false, name: '边框',
        fill: 'transparent', stroke: '', strokeWidth: 0,
      }})
    }
  }, [])

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

  const handleAddImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const safeW = mmToPx(POLAROID_SIZE.width * 0.75)
        const scale = Math.min(safeW / img.width, 150 / img.height)
        dispatch({ type: 'ADD_LAYER', layer: {
          id: generateId(), type: 'image', src,
          x: mmToPx(POLAROID_SIZE.width / 2 + POLAROID_SIZE.bleed) - (img.width * scale) / 2,
          y: mmToPx(POLAROID_SIZE.height * 0.15 + POLAROID_SIZE.bleed),
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
      id: generateId(), type: 'text', text: '双击编辑',
      x: mmToPx(POLAROID_SIZE.width / 2 + POLAROID_SIZE.bleed) - 100,
      y: mmToPx(POLAROID_SIZE.height * 0.78 + POLAROID_SIZE.bleed),
      width: 200, height: 40,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
      name: dedupName('文字', state.layers.map(l => l.name)),
      fontSize: 14, fontFamily: 'Noto Sans SC', fontWeight: 400, fontStyle: 'normal',
      fill: '#374151', stroke: '', strokeWidth: 0, align: 'center', shadow: undefined, opacity: 1,
    }})
  }, [dispatch, state.layers])

  const handleExport = useCallback(() => {
    const stage = (window as any).__editorStage as any
    if (!stage) return
    const transformer = stage.findOne('Transformer')
    const bleedLayer = stage.getLayers?.()?.find((l: any) => l.name() === 'bleed')
    if (transformer) transformer.visible(false)
    if (bleedLayer) bleedLayer.visible(false)
    const dataUrl = stage.toDataURL({ pixelRatio: 3, mimeType: 'image/png' })
    if (transformer) transformer.visible(true)
    if (bleedLayer) bleedLayer.visible(true)
    const link = document.createElement('a')
    link.download = `拍立得_${side === 'front' ? '正面' : '背面'}_${Date.now()}.png`
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
          <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-6 bg-gray-50"
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleAddImage(f) }}
            onDragOver={e => e.preventDefault()}>
            {side === 'front' ? <PolaroidCanvas /> : <EditorCanvas />}
          </div>
          <div className="flex flex-col">
            <LayerPanel />
            <div className="w-56 p-3 border-t border-gray-200 bg-white space-y-2">
              <label className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600
                text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                上传照片
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
