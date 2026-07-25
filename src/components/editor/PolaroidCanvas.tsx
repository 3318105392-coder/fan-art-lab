import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditor } from '../../store/editorStore'
import { mmToPx } from '../../utils'
import type { Layer as LayerType } from '../../types'

function useKonvaImage(src: string): [HTMLImageElement | undefined, 'loading' | 'loaded' | 'failed'] {
  const [image, setImage] = useState<HTMLImageElement>()
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const prevSrc = useRef(src)
  if (prevSrc.current !== src) { setImage(undefined); setStatus('loading'); prevSrc.current = src }
  if (status === 'loading' && !image) {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { setImage(img); setStatus('loaded') }
    img.onerror = () => setStatus('failed')
    img.src = src
  }
  return [image, status]
}

interface PolaroidFrameConfig {
  frameColor: string
  borderWidth: number    // top/left/right border in mm
  bottomRatio: number    // bottom strip height ratio
}

const DEFAULT_FRAME: PolaroidFrameConfig = {
  frameColor: '#f0f0f0',
  borderWidth: 3,        // 3mm border on top/left/right
  bottomRatio: 0.22,     // bottom strip = 22% of height
}

export default function PolaroidCanvas() {
  const { state, dispatch } = useEditor()
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasSize, zoom, showBleed, layers, selectedLayerId, backgroundColor } = state

  const [frame, setFrame] = useState<PolaroidFrameConfig>(DEFAULT_FRAME)
  const hasTemplate = layers.some(l => l.name === '模版')

  // Find frame layer position
  const frameIdx = layers.findIndex(l => l.name === '边框')

  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const textInputRef = useRef<HTMLTextAreaElement>(null)

  const totalW = canvasSize.width + canvasSize.bleed * 2
  const totalH = canvasSize.height + canvasSize.bleed * 2
  const canvasPxW = mmToPx(totalW) * zoom
  const canvasPxH = mmToPx(totalH) * zoom
  const bleedPx = mmToPx(canvasSize.bleed) * zoom
  const safeW = mmToPx(canvasSize.width)
  const safeH = mmToPx(canvasSize.height)

  // Polaroid layout: borders on all 4 sides + bottom writing strip
  const borderPx = mmToPx(frame.borderWidth)
  const bottomH = hasTemplate ? 0 : safeH * frame.bottomRatio
  const photoX = bleedPx / zoom + borderPx
  const photoY = bleedPx / zoom + borderPx
  const photoW = safeW - borderPx * 2
  const photoH = safeH - borderPx - bottomH
  const bottomY = photoY + photoH

  // Immediate close on click outside text editing
  // Delete key to remove selected layer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const el = e.target as HTMLElement
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return
        if (selectedLayerId) dispatch({ type: 'REMOVE_LAYER', id: selectedLayerId })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedLayerId, dispatch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
      setEditingTextId(null); setEditingText('')
    }
    window.addEventListener('mousedown', handler, true)
    return () => window.removeEventListener('mousedown', handler, true)
  }, [])

  const handleTextChange = useCallback((text: string) => {
    setEditingText(text)
    if (editingTextId) dispatch({ type: 'UPDATE_LAYER', id: editingTextId, changes: { text } })
  }, [editingTextId, dispatch])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) dispatch({ type: 'SELECT_LAYER', id: null })
  }, [dispatch])

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    dispatch({ type: 'UPDATE_LAYER', id, changes: { x: e.target.x(), y: e.target.y() } })
  }, [dispatch])

  const handleTransformEnd = useCallback((id: string, node: Konva.Group) => {
    const sx = node.scaleX(); const sy = node.scaleY(); node.scaleX(1); node.scaleY(1)
    dispatch({ type: 'UPDATE_LAYER', id, changes: {
      x: node.x(), y: node.y(),
      width: Math.max(5, node.width() * sx),
      height: Math.max(5, node.height() * sy),
      rotation: node.rotation(),
    }})
  }, [dispatch])

  if (transformerRef.current) {
    const stage = stageRef.current
    if (stage && selectedLayerId) {
      const node = stage.findOne(`#layer-${selectedLayerId}`)
      if (node) { transformerRef.current.nodes([node]); transformerRef.current.getLayer()?.batchDraw() }
    } else { transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw() }
  }

  // Expose stage ref for export (only on mount/unmount)
  useEffect(() => { (window as any).__editorStage = stageRef.current; return () => { (window as any).__editorStage = null } }, [])

  const editingLayer = editingTextId ? layers.find(l => l.id === editingTextId) : null
  const textInputStyle: React.CSSProperties = editingLayer && editingLayer.type === 'text' ? {
    position: 'absolute',
    left: (editingLayer.x * zoom) + 40, top: (editingLayer.y * zoom) + 40,
    width: editingLayer.width * zoom, minHeight: editingLayer.height * zoom,
    fontSize: editingLayer.fontSize * zoom, fontFamily: editingLayer.fontFamily,
    fontWeight: editingLayer.fontWeight, color: editingLayer.fill,
    border: 'none', padding: 0, margin: 0, outline: 'none', resize: 'none',
    background: 'transparent', zIndex: 20, lineHeight: 1.2, overflow: 'hidden',
    transform: editingLayer.rotation ? `rotate(${editingLayer.rotation}deg)` : undefined,
    transformOrigin: '0 0',
  } : { display: 'none' }

  return (
    <div className="space-y-4">
      {/* Frame controls - hidden when template is active */}
      {!hasTemplate && (
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200">
            <span className="text-xs text-gray-500">颜色:</span>
            <input type="color" value={frame.frameColor}
              onChange={e => setFrame(f => ({ ...f, frameColor: e.target.value }))}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200">
            <span className="text-xs text-gray-500">边框:</span>
            <input type="range" min={1} max={6} step={0.5} value={frame.borderWidth}
              onChange={e => setFrame(f => ({ ...f, borderWidth: Number(e.target.value) }))}
              className="w-16 accent-indigo-500" />
            <span className="text-xs text-gray-400 w-8">{frame.borderWidth}mm</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200">
            <span className="text-xs text-gray-500">底部:</span>
            <input type="range" min={10} max={40} value={Math.round(frame.bottomRatio * 100)}
              onChange={e => setFrame(f => ({ ...f, bottomRatio: Number(e.target.value) / 100 }))}
              className="w-16 accent-indigo-500" />
            <span className="text-xs text-gray-400 w-8">{Math.round(frame.bottomRatio * 100)}%</span>
          </div>
        </div>
      )}

      {hasTemplate && (
        <div className="text-center">
          <button onClick={() => {
            state.layers.filter(l => l.name === '模版').forEach(l => {
              dispatch({ type: 'REMOVE_LAYER', id: l.id })
            })
          }}
            className="text-xs text-gray-400 hover:text-red-400 underline">移除模版</button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="relative inline-flex items-center justify-center bg-gray-200/50 rounded-xl overflow-hidden mx-auto"
        style={{ width: canvasPxW + 80, height: canvasPxH + 80 }}
        onClick={(e) => { if (e.target === containerRef.current) dispatch({ type: 'SELECT_LAYER', id: null }) }}>
        <Stage ref={stageRef} width={canvasPxW} height={canvasPxH}
          scaleX={zoom} scaleY={zoom}
          onClick={handleStageClick}>

          {/* Layer 1 - Main content */}
          <Layer name="main">
            {/* Render layers + frame in order */}
            {(() => {
              const userLayers = layers.filter(l => l.visible && l.name !== '边框')
              const items: React.ReactNode[] = []
              let userIdx = 0
              const totalUserLayers = userLayers.length
              const framePos = frameIdx >= 0 ? frameIdx : 0

              for (let pos = 0; pos < Math.max(framePos + 1, totalUserLayers); pos++) {
                if (pos === framePos && frameIdx >= 0) {
                  items.push(
                    <PolaroidFrameRender key="frame" frame={frame} hasTemplate={hasTemplate}
                      canvasW={canvasPxW / zoom}
                      photoX={photoX} photoY={photoY} photoW={photoW} photoH={photoH}
                      bottomY={bottomY} bottomH={bottomH}
                      backgroundColor={backgroundColor} />
                  )
                }
                if (userIdx < totalUserLayers) {
                  const layer = userLayers[userIdx]
                  items.push(
                    <PolaroidLayerItem key={layer.id} layer={layer}
                      isSelected={selectedLayerId === layer.id}
                      isEditing={editingTextId === layer.id}
                      onDragEnd={(e) => handleDragEnd(layer.id, e)}
                      onTransformEnd={(node) => handleTransformEnd(layer.id, node)}
                      onSelect={() => dispatch({ type: 'SELECT_LAYER', id: layer.id })}
                      onDblClick={() => { if (layer.type === 'text') { setEditingTextId(layer.id); setEditingText(layer.text); setTimeout(() => textInputRef.current?.focus(), 50); } }}
                    />
                  )
                  userIdx++
                }
              }
              return items
            })()}

            <Transformer ref={transformerRef} rotateEnabled={true}
              enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />
          </Layer>

          {/* Layer 2 - Bleed guide on top (red dashed line only, excluded from export) */}
          {showBleed && (
            <Layer name="bleed">
              <Rect x={bleedPx / zoom} y={bleedPx / zoom} width={safeW} height={safeH}
                fill="transparent" stroke="#ef4444" strokeWidth={1.5} dash={[4, 4]}
                listening={false} />
            </Layer>
          )}
        </Stage>

        {editingTextId && editingLayer && (
          <textarea ref={textInputRef} style={textInputStyle}
            value={editingText} onChange={(e) => handleTextChange(e.target.value)}
            onBlur={() => { setEditingTextId(null); setEditingText('') }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingTextId(null); setEditingText('') }
              if (e.key === 'Escape') { setEditingText(''); setEditingTextId(null) }
            }} />
        )}
      </div>
    </div>
  )
}

function PolaroidFrameRender({ frame, hasTemplate, canvasW, photoX, photoY, photoW, photoH, bottomY, bottomH, backgroundColor }: any) {
  if (hasTemplate) return null
  // Slight overlap (1px) to eliminate sub-pixel gaps between border strips
  const overlap = 1
  return (
    <>
      {/* Top border - extends slightly into left/right/bottom zone */}
      <Rect x={0} y={0} width={canvasW} height={photoY + overlap}
        fill={frame.frameColor} listening={false} />
      {/* Left border - overlaps with top and bottom */}
      <Rect x={0} y={photoY - overlap} width={photoX + overlap} height={photoH + overlap * 2}
        fill={frame.frameColor} listening={false} />
      {/* Right border */}
      <Rect x={photoX + photoW - overlap} y={photoY - overlap}
        width={canvasW - photoX - photoW + overlap} height={photoH + overlap * 2}
        fill={frame.frameColor} listening={false} />
      {/* Bottom strip - overlaps with left/right */}
      <Rect x={0} y={bottomY - overlap} width={canvasW} height={bottomH + overlap}
        fill={frame.frameColor} listening={false} />
      {/* Photo area - rendered on top to cover overlap into photo zone */}
      <Rect x={photoX} y={photoY} width={photoW} height={photoH}
        fill={backgroundColor || '#f9fafb'}
        stroke="#d4d4d8" strokeWidth={0.5} listening={false} />
    </>
  )
}

function LiveText({ layer, isEditing }: { layer: any; isEditing: boolean }) {
  const textRef = useRef<any>(null)
  useEffect(() => {
    if (textRef.current) {
      textRef.current.cache()
      textRef.current.getLayer()?.batchDraw()
    }
  }, [layer.fontFamily, layer.fontWeight, layer.fontStyle, layer.fontSize, layer.text, layer.fill])
  const fw = layer.fontWeight
  const fs = layer.fontStyle === 'italic' ? (fw >= 600 ? 'italic bold' : 'italic') : (fw >= 600 ? 'bold' : 'normal')
  return <Text ref={textRef} text={layer.text} fontSize={layer.fontSize}
    fontFamily={layer.fontFamily} fontStyle={fs}
    fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth} align={layer.align}
    width={layer.width} opacity={isEditing ? 0 : layer.opacity} />
}

function PolaroidLayerItem({ layer, isEditing, onDragEnd, onTransformEnd, onSelect, onDblClick }: {
  layer: LayerType; isSelected: boolean; isEditing: boolean
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (node: Konva.Group) => void
  onSelect: () => void; onDblClick: () => void
}) {
  const [image] = useKonvaImage(layer.type === 'image' || layer.type === 'sticker' ? layer.src : '')
  const gp = { id: `layer-${layer.id}`, x: layer.x, y: layer.y, width: layer.width, height: layer.height, rotation: layer.rotation, draggable: !layer.locked, onClick: onSelect, onTap: onSelect, onDblClick, onDragEnd, onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(e.target as Konva.Group) }
  switch (layer.type) {
    case 'image': return <Group {...gp}><KonvaImage image={image} width={layer.width} height={layer.height} cornerRadius={2} /></Group>
    case 'text': return <Group {...gp}><LiveText layer={layer} isEditing={isEditing} /></Group>
    case 'sticker': return <Group {...gp}><KonvaImage image={image} width={layer.width} height={layer.height} /></Group>
    default: return null
  }
}
