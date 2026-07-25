import { useState, useRef } from 'react'
import { useEditor } from '../../store/editorStore'
import type { Layer } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  image: '图片', text: '文字', sticker: '贴纸', shape: '图形',
}

export default function LayerPanel() {
  const { state, dispatch } = useEditor()
  const { layers, selectedLayerId } = state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const dropIdxRef = useRef<number | null>(null)

  const displayToArray = (dispIdx: number) => layers.length - 1 - dispIdx
  const reversedLayers = [...layers].reverse()

  const handleDragStart = (layer: Layer) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', layer.id)
    setDragId(layer.id)
  }

  const handleDragOver = (dispIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    // Determine if drop is above or below this layer
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const below = e.clientY > midY
    const val = below ? dispIdx + 1 : dispIdx
    setDropIdx(val)
    dropIdxRef.current = val
  }

  const handleDrop = (_dispIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    // Actual drop handled by handleFinalDrop on the container
  }

  const handleFinalDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const id = dragId || e.dataTransfer.getData('text/plain')
    const idx = dropIdxRef.current
    setDragId(null)
    setDropIdx(null)
    dropIdxRef.current = null
    if (!id || idx === null) return
    const targetIdx = displayToArray(idx)
    const clamped = Math.max(0, Math.min(layers.length - 1, targetIdx))
    dispatch({ type: 'MOVE_LAYER_TO', id, index: clamped })
  }

  return (
    <div className="w-56 bg-white border-l border-gray-200 flex flex-col h-full"
      onDragOver={(e) => { e.preventDefault() }}
      onDrop={handleFinalDrop}>
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">图层</h3>
        <p className="text-xs text-gray-400 mt-0.5">{layers.length} 个图层</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            暂无图层<br />添加图片或文字开始创作
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {reversedLayers.map((layer, dispIdx) => (
              <div key={layer.id}>
                {/* Drop indicator line above this layer */}
                {dropIdx === dispIdx && dragId && dragId !== layer.id && (
                  <div className="h-0.5 bg-red-500 rounded-full mx-1 mb-0.5" />
                )}
                <LayerItem
                  layer={layer}
                  isSelected={layer.id === selectedLayerId}
                  isDragging={dragId === layer.id}
                  onSelect={() => dispatch({ type: 'SELECT_LAYER', id: layer.id })}
                  onToggleVisible={() => dispatch({ type: 'TOGGLE_LAYER_VISIBLE', id: layer.id })}
                  onToggleLocked={() => dispatch({ type: 'TOGGLE_LAYER_LOCKED', id: layer.id })}
                  onDelete={() => dispatch({ type: 'REMOVE_LAYER', id: layer.id })}
                  onMoveUp={() => dispatch({ type: 'MOVE_LAYER_UP', id: layer.id })}
                  onMoveDown={() => dispatch({ type: 'MOVE_LAYER_DOWN', id: layer.id })}
                  isFirst={layers.indexOf(layer) === layers.length - 1}
                  isLast={layers.indexOf(layer) === 0}
                  onDragStart={handleDragStart(layer)}
                  onDragOver={handleDragOver(dispIdx)}
                  onDrop={handleDrop(dispIdx)}
                />
                {/* Drop indicator below last layer */}
                {dropIdx === reversedLayers.length && dispIdx === reversedLayers.length - 1 && dragId && (
                  <div className="h-0.5 bg-red-500 rounded-full mx-1 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function LayerItem({ layer, isSelected, isDragging, onSelect, onToggleVisible, onToggleLocked,
  onDelete, onMoveUp, onMoveDown, isFirst, isLast, onDragStart, onDragOver, onDrop }: {
  layer: Layer; isSelected: boolean; isDragging: boolean
  onSelect: () => void; onToggleVisible: () => void; onToggleLocked: () => void
  onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void
  isFirst: boolean; isLast: boolean
  onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
}) {
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group p-2 rounded-lg cursor-pointer border transition-colors
        ${isDragging ? 'opacity-40 border-dashed border-indigo-400' : ''}
        ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
    >
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onToggleVisible() }}
          className={`text-xs w-5 h-5 rounded flex items-center justify-center
            ${layer.visible ? 'text-gray-500' : 'text-gray-300'}`}
          title={layer.visible ? '隐藏' : '显示'}>
          {layer.visible ? '👁' : '—'}
        </button>

        <span className="text-xs text-gray-700 truncate flex-1 font-medium">
          {layer.name || TYPE_LABELS[layer.type] || layer.type}
        </span>

        <button onClick={(e) => { e.stopPropagation(); onToggleLocked() }}
          className={`text-xs w-5 h-5 rounded flex items-center justify-center
            ${layer.locked ? 'text-indigo-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
          title={layer.locked ? '解锁' : '锁定'}>
          {layer.locked ? '🔒' : '🔓'}
        </button>
      </div>

      {isSelected && (
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-indigo-200/50">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={isFirst}
            className="text-xs px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 disabled:opacity-30">↑上移</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={isLast}
            className="text-xs px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 disabled:opacity-30">↓下移</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 ml-auto">删除</button>
        </div>
      )}
    </div>
  )
}
