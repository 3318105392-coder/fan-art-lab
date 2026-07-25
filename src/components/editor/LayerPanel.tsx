import { useEditor } from '../../store/editorStore'
import type { Layer } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  image: '图片',
  text: '文字',
  sticker: '贴纸',
  shape: '图形',
}

export default function LayerPanel() {
  const { state, dispatch } = useEditor()
  const { layers, selectedLayerId } = state
  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  return (
    <div className="w-56 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">图层</h3>
        <p className="text-xs text-gray-400 mt-0.5">{layers.length} 个图层</p>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            暂无图层<br />添加图片或文字开始创作
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {[...layers].reverse().map(layer => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isSelected={layer.id === selectedLayerId}
                onSelect={() => dispatch({ type: 'SELECT_LAYER', id: layer.id })}
                onToggleVisible={() => dispatch({ type: 'TOGGLE_LAYER_VISIBLE', id: layer.id })}
                onToggleLocked={() => dispatch({ type: 'TOGGLE_LAYER_LOCKED', id: layer.id })}
                onDelete={() => dispatch({ type: 'REMOVE_LAYER', id: layer.id })}
                onMoveUp={() => dispatch({ type: 'MOVE_LAYER_UP', id: layer.id })}
                onMoveDown={() => dispatch({ type: 'MOVE_LAYER_DOWN', id: layer.id })}
                isFirst={layers.indexOf(layer) === layers.length - 1}
                isLast={layers.indexOf(layer) === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text layer inline editor */}
      {selectedLayer?.type === 'text' && (
        <div className="border-t border-gray-200 p-3 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">文字内容</h4>
          <textarea
            value={selectedLayer.text}
            onChange={e => dispatch({
              type: 'UPDATE_LAYER',
              id: selectedLayer.id,
              changes: { text: e.target.value }
            })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none
              focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
            rows={2}
            placeholder="输入文字..."
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>字号 {selectedLayer.fontSize}px</span>
            <span>{selectedLayer.fontFamily.split(',')[0]}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function LayerItem({ layer, isSelected, onSelect, onToggleVisible, onToggleLocked,
  onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  layer: Layer
  isSelected: boolean
  onSelect: () => void
  onToggleVisible: () => void
  onToggleLocked: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`group p-2 rounded-lg cursor-pointer border transition-colors
        ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisible() }}
          className={`text-xs w-5 h-5 rounded flex items-center justify-center
            ${layer.visible ? 'text-gray-500' : 'text-gray-300'}`}
          title={layer.visible ? '隐藏' : '显示'}
        >
          {layer.visible ? '👁' : '—'}
        </button>

        <span className="text-xs text-gray-700 truncate flex-1 font-medium">
          {layer.type === 'text' && layer.text
            ? layer.text.slice(0, 12) + (layer.text.length > 12 ? '…' : '')
            : (TYPE_LABELS[layer.type] || layer.type)
          }
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleLocked() }}
          className={`text-xs w-5 h-5 rounded flex items-center justify-center
            ${layer.locked ? 'text-indigo-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
          title={layer.locked ? '解锁' : '锁定'}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>
      </div>

      {isSelected && (
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-indigo-200/50">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            disabled={isFirst}
            className="text-xs px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 disabled:opacity-30"
          >↑上移</button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            disabled={isLast}
            className="text-xs px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 disabled:opacity-30"
          >↓下移</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 ml-auto"
          >删除</button>
        </div>
      )}
    </div>
  )
}
