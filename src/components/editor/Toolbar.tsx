import { useEditor } from '../../store/editorStore'
import type { ToolType } from '../../types'

const TOOLS: { type: ToolType; label: string; icon: string; shortcut?: string }[] = [
  { type: 'select', label: '选择', icon: '↖', shortcut: 'V' },
  { type: 'text', label: '文字', icon: 'T', shortcut: 'T' },
  { type: 'sticker', label: '贴纸', icon: '⭐' },
  { type: 'shape', label: '图形', icon: '□' },
]

export default function Toolbar() {
  const { state, dispatch } = useEditor()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1">
      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-3 mr-2">
        {TOOLS.map(tool => (
          <button
            key={tool.type}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: tool.type })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${state.tool === tool.type
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            <span className="mr-1">{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {/* View options */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={state.showBleed}
            onChange={() => dispatch({ type: 'TOGGLE_BLEED' })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          出血线
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={state.showGrid}
            onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          网格
        </label>
      </div>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-500">
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.max(0.25, state.zoom - 0.25) })}
          className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center"
        >−</button>
        <span className="w-14 text-center tabular-nums">{Math.round(state.zoom * 100)}%</span>
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: Math.min(3, state.zoom + 0.25) })}
          className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center"
        >+</button>
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: 1 })}
          className="ml-1.5 px-2 py-0.5 text-xs rounded border border-gray-200 hover:bg-gray-50"
        >重置</button>
      </div>
    </div>
  )
}
