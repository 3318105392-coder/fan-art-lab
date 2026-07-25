import { createContext, useContext } from 'react'
import type { Layer, ToolType, CanvasSize } from '../types'

export interface EditorState {
  layers: Layer[]
  selectedLayerId: string | null
  canvasSize: CanvasSize
  tool: ToolType
  zoom: number
  showBleed: boolean
  showGrid: boolean
  backgroundColor: string
}

export type EditorAction =
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'REMOVE_LAYER'; id: string }
  | { type: 'UPDATE_LAYER'; id: string; changes: Partial<Layer> }
  | { type: 'SELECT_LAYER'; id: string | null }
  | { type: 'SET_TOOL'; tool: ToolType }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'MOVE_LAYER_UP'; id: string }
  | { type: 'MOVE_LAYER_DOWN'; id: string }
  | { type: 'TOGGLE_LAYER_VISIBLE'; id: string }
  | { type: 'TOGGLE_LAYER_LOCKED'; id: string }
  | { type: 'TOGGLE_BLEED' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_CANVAS_SIZE'; size: Partial<CanvasSize> }
  | { type: 'SET_BACKGROUND_COLOR'; color: string }
  | { type: 'RESET' }

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'ADD_LAYER':
      return { ...state, layers: [...state.layers, action.layer], selectedLayerId: action.layer.id }

    case 'REMOVE_LAYER':
      return {
        ...state,
        layers: state.layers.filter(l => l.id !== action.id),
        selectedLayerId: state.selectedLayerId === action.id ? null : state.selectedLayerId,
      }

    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.id ? { ...l, ...action.changes } as Layer : l
        ),
      }

    case 'SELECT_LAYER':
      return { ...state, selectedLayerId: action.id, tool: 'select' }

    case 'SET_TOOL':
      return { ...state, tool: action.tool, selectedLayerId: action.tool !== 'select' ? null : state.selectedLayerId }

    case 'SET_ZOOM':
      return { ...state, zoom: action.zoom }

    case 'MOVE_LAYER_UP': {
      const idx = state.layers.findIndex(l => l.id === action.id)
      if (idx >= state.layers.length - 1) return state
      const newLayers = [...state.layers]
      ;[newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]]
      return { ...state, layers: newLayers }
    }

    case 'MOVE_LAYER_DOWN': {
      const idx = state.layers.findIndex(l => l.id === action.id)
      if (idx <= 0) return state
      const newLayers = [...state.layers]
      ;[newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]]
      return { ...state, layers: newLayers }
    }

    case 'TOGGLE_LAYER_VISIBLE':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.id ? { ...l, visible: !l.visible } as Layer : l
        ),
      }

    case 'TOGGLE_LAYER_LOCKED':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.id ? { ...l, locked: !l.locked } as Layer : l
        ),
      }

    case 'TOGGLE_BLEED':
      return { ...state, showBleed: !state.showBleed }

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }

    case 'SET_CANVAS_SIZE':
      return { ...state, canvasSize: { ...state.canvasSize, ...action.size } }

    case 'SET_BACKGROUND_COLOR':
      return { ...state, backgroundColor: action.color }

    case 'RESET':
      return createInitialState(state.canvasSize)

    default:
      return state
  }
}

export function createInitialState(canvasSize: CanvasSize): EditorState {
  return {
    layers: [],
    selectedLayerId: null,
    canvasSize,
    tool: 'select',
    zoom: 1,
    showBleed: true,
    showGrid: false,
    backgroundColor: '#ffffff',
  }
}

export const EditorContext = createContext<{
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
} | null>(null)

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
