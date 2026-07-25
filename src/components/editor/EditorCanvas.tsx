import { useCallback, useRef, useState, useEffect } from 'react'
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

export default function EditorCanvas() {
  const { state, dispatch } = useEditor()
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { canvasSize, zoom, showBleed, showGrid, layers, selectedLayerId, backgroundColor } = state

  // --- Inline text editing state ---
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const editingIdRef = useRef<string | null>(null)

  // Keep ref in sync for immediate mousedown handler
  useEffect(() => { editingIdRef.current = editingTextId }, [editingTextId])

  const totalW = canvasSize.width + canvasSize.bleed * 2
  const totalH = canvasSize.height + canvasSize.bleed * 2
  const canvasPxW = mmToPx(totalW) * zoom
  const canvasPxH = mmToPx(totalH) * zoom
  const bleedPx = mmToPx(canvasSize.bleed) * zoom

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

  // Immediate close on click outside (using capture + ref for zero delay)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!editingIdRef.current) return
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA') return
      setEditingTextId(null)
      setEditingText('')
    }
    window.addEventListener('mousedown', handler, true)
    return () => window.removeEventListener('mousedown', handler, true)
  }, [])

  // Real-time sync to layer
  const handleTextChange = useCallback((text: string) => {
    setEditingText(text)
    if (editingTextId) {
      dispatch({ type: 'UPDATE_LAYER', id: editingTextId, changes: { text } })
    }
  }, [editingTextId, dispatch])

  const finishTextEdit = useCallback(() => {
    setEditingTextId(null)
    setEditingText('')
  }, [])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      dispatch({ type: 'SELECT_LAYER', id: null })
    }
  }, [dispatch])

  const handleDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    dispatch({ type: 'UPDATE_LAYER', id, changes: { x: e.target.x(), y: e.target.y() } })
  }, [dispatch])

  const handleTransformEnd = useCallback((id: string, node: Konva.Group) => {
    const scaleX = node.scaleX(); const scaleY = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    dispatch({ type: 'UPDATE_LAYER', id, changes: {
      x: node.x(), y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    } })
  }, [dispatch])

  // Handle double-click to edit text
  const handleTextDblClick = useCallback((layer: LayerType) => {
    if (layer.type === 'text') {
      setEditingTextId(layer.id)
      setEditingText(layer.text)
      setTimeout(() => textInputRef.current?.focus(), 50)
    }
  }, [])

  // Expose stage ref for export (only on mount/unmount)
  useEffect(() => { (window as any).__editorStage = stageRef.current; return () => { (window as any).__editorStage = null } }, [])

  // Update transformer
  if (transformerRef.current) {
    const stage = stageRef.current
    if (stage && selectedLayerId) {
      const node = stage.findOne(`#layer-${selectedLayerId}`)
      if (node) { transformerRef.current.nodes([node]); transformerRef.current.getLayer()?.batchDraw() }
    } else {
      transformerRef.current.nodes([]); transformerRef.current.getLayer()?.batchDraw()
    }
  }

  // Calculate text input position (overlays exactly on Konva text)
  const editingLayer = editingTextId ? layers.find(l => l.id === editingTextId) : null
  const textInputStyle: React.CSSProperties = editingLayer && editingLayer.type === 'text' ? {
    position: 'absolute',
    left: (editingLayer.x * zoom) + 40,
    top: (editingLayer.y * zoom) + 40,
    width: editingLayer.width * zoom,
    minHeight: editingLayer.height * zoom,
    fontSize: editingLayer.fontSize * zoom,
    fontFamily: editingLayer.fontFamily,
    fontWeight: editingLayer.fontWeight,
    color: editingLayer.fill,
    textAlign: editingLayer.align === 'center' ? 'center' : editingLayer.align,
    border: 'none',
    padding: 0,
    margin: 0,
    outline: 'none',
    resize: 'none',
    background: 'transparent',
    zIndex: 20,
    lineHeight: 1.2,
    letterSpacing: 'normal',
    overflow: 'hidden',
    transform: editingLayer.rotation ? `rotate(${editingLayer.rotation}deg)` : undefined,
    transformOrigin: '0 0',
  } : { display: 'none' }

  return (
    <div ref={containerRef} className="relative inline-flex items-center justify-center bg-gray-200/50 rounded-xl overflow-hidden"
      style={{ width: canvasPxW + 80, height: canvasPxH + 80 }}
      onClick={(e) => { if (e.target === containerRef.current) dispatch({ type: 'SELECT_LAYER', id: null }) }}>
      <Stage ref={stageRef} width={canvasPxW} height={canvasPxH}
        scaleX={zoom} scaleY={zoom}
        onClick={handleStageClick}>

        {/* Layer 1 - Main content */}
        <Layer name="main">
          {/* Background color fills entire canvas (border to border) */}
          <Rect x={0} y={0} width={canvasPxW / zoom} height={canvasPxH / zoom}
            fill={backgroundColor} />
          {/* Grid */}
          {showGrid && <GridLines width={canvasPxW / zoom} height={canvasPxH / zoom}
            bleed={bleedPx / zoom} step={mmToPx(5)} />}
          {/* Layers */}
          {layers.filter(l => l.visible).map(layer => (
            <CanvasLayerItem key={layer.id} layer={layer}
              isSelected={selectedLayerId === layer.id}
              isEditing={editingTextId === layer.id}
              onDragEnd={(e) => handleDragEnd(layer.id, e)}
              onTransformEnd={(node) => handleTransformEnd(layer.id, node)}
              onSelect={() => dispatch({ type: 'SELECT_LAYER', id: layer.id })}
              onDblClick={() => handleTextDblClick(layer)}
            />
          ))}
          <Transformer ref={transformerRef} rotateEnabled={true}
            enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
            boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />
        </Layer>

        {/* Layer 2 - Bleed guide on top (red dashed line only, excluded from export) */}
        {showBleed && (
          <Layer name="bleed">
            <Rect x={bleedPx / zoom} y={bleedPx / zoom}
              width={mmToPx(canvasSize.width)} height={mmToPx(canvasSize.height)}
              fill="transparent" stroke="#ef4444" strokeWidth={1.5} dash={[4, 4]}
              listening={false} />
          </Layer>
        )}
      </Stage>

      {/* Inline transparent text editing textarea */}
      {editingTextId && editingLayer && (
        <textarea
          ref={textInputRef}
          style={textInputStyle}
          value={editingText}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={finishTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishTextEdit() }
            if (e.key === 'Escape') { setEditingText(''); finishTextEdit() }
          }}
        />
      )}
    </div>
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
    width={layer.width} shadowColor={layer.shadow?.color} shadowBlur={layer.shadow?.blur}
    shadowOffsetX={layer.shadow?.offsetX} shadowOffsetY={layer.shadow?.offsetY}
    opacity={isEditing ? 0 : layer.opacity} />
}

function CanvasLayerItem({ layer, isEditing, onDragEnd, onTransformEnd, onSelect, onDblClick }: {
  layer: LayerType; isSelected: boolean; isEditing: boolean
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (node: Konva.Group) => void
  onSelect: () => void; onDblClick: () => void
}) {
  const [image] = useKonvaImage(layer.type === 'image' || layer.type === 'sticker' ? layer.src : '')
  const groupProps = {
    id: `layer-${layer.id}`, x: layer.x, y: layer.y,
    width: layer.width, height: layer.height,
    rotation: layer.rotation, draggable: !layer.locked,
    onClick: onSelect, onTap: onSelect, onDblClick,
    onDragEnd,
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(e.target as Konva.Group),
  }

  switch (layer.type) {
    case 'image':
      return <Group {...groupProps}><KonvaImage image={image} width={layer.width} height={layer.height} cornerRadius={2} /></Group>
    case 'text':
      return <Group {...groupProps}><LiveText layer={layer} isEditing={isEditing} /></Group>
    case 'sticker':
      return <Group {...groupProps}><KonvaImage image={image} width={layer.width} height={layer.height} /></Group>
    case 'shape':
      return <Group {...groupProps}>{layer.shapeType === 'circle'
        ? <Rect width={layer.width} height={layer.height} fill={layer.fill} stroke={layer.stroke}
          strokeWidth={layer.strokeWidth} cornerRadius={Math.min(layer.width, layer.height) / 2} />
        : <Rect width={layer.width} height={layer.height} fill={layer.fill} stroke={layer.stroke}
          strokeWidth={layer.strokeWidth} />}</Group>
    default: return null
  }
}

function GridLines({ width, height, bleed, step }: { width: number; height: number; bleed: number; step: number }) {
  const lines = []
  for (let x = bleed; x <= width - bleed; x += step)
    lines.push(<Rect key={`gv${x}`} x={x} y={bleed} width={0.5} height={height - bleed * 2} fill="#d4d4d8" opacity={0.4} listening={false} />)
  for (let y = bleed; y <= height - bleed; y += step)
    lines.push(<Rect key={`gh${y}`} x={bleed} y={y} width={width - bleed * 2} height={0.5} fill="#d4d4d8" opacity={0.4} listening={false} />)
  return <>{lines}</>
}
