export type LayerType = 'image' | 'text' | 'sticker' | 'shape'

export interface BaseLayer {
  id: string
  type: LayerType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
  locked: boolean
  name: string
}

export interface ImageLayer extends BaseLayer {
  type: 'image'
  src: string
  crop?: { x: number; y: number; width: number; height: number }
  filters?: ImageFilter[]
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  fill: string
  stroke: string
  strokeWidth: number
  align: 'left' | 'center' | 'right'
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number }
  opacity: number
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker'
  src: string
  colorOverlay?: string
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape'
  shapeType: 'rect' | 'circle' | 'heart' | 'star'
  fill: string
  stroke: string
  strokeWidth: number
}

export type Layer = ImageLayer | TextLayer | StickerLayer | ShapeLayer

export interface ImageFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'temperature'
  value: number
}

export interface CanvasSize {
  width: number   // mm
  height: number  // mm
  bleed: number   // mm
}

export type ToolType = 'select' | 'text' | 'sticker' | 'shape' | 'crop'

// Photocard specific
export interface PhotocardConfig {
  size: CanvasSize  // default 54x86mm, bleed 3mm
  side: 'front' | 'back'
}

export const DEFAULT_PHOTOCARD_SIZE: CanvasSize = {
  width: 54,
  height: 86,
  bleed: 1.5,
}

// DPI for export
export const EXPORT_DPI = 300
// Screen rendering scale (mm to px at 96 DPI)
export const MM_TO_PX = 96 / 25.4

// Available fonts
export interface FontOption {
  family: string
  label: string
  category: 'sans' | 'serif' | 'handwritten' | 'decorative'
}

export const FONT_OPTIONS: FontOption[] = [
  { family: 'sans-serif', label: '系统默认', category: 'sans' },
  { family: 'Noto Sans SC', label: '思源黑体', category: 'sans' },
  { family: 'Noto Serif SC', label: '思源宋体', category: 'serif' },
  { family: 'Poppins', label: 'Poppins', category: 'sans' },
  { family: 'Ma Shan Zheng', label: '马山正楷', category: 'handwritten' },
  { family: 'Long Cang', label: '龙藏手写', category: 'handwritten' },
  { family: 'Liu Jian Mao Cao', label: '建毛草书', category: 'handwritten' },
  { family: 'Zhi Mang Xing', label: '志芒行书', category: 'handwritten' },
  { family: 'ZCOOL KuaiLe', label: '站酷快乐体', category: 'decorative' },
  { family: 'ZCOOL XiaoWei', label: '站酷小薇体', category: 'decorative' },
  { family: 'ZCOOL QingKe HuangYou', label: '站酷庆科黄油体', category: 'decorative' },
  { family: 'Dancing Script', label: 'Dancing Script', category: 'handwritten' },
  { family: 'Pacifico', label: 'Pacifico', category: 'decorative' },
  { family: 'Permanent Marker', label: 'Permanent Marker', category: 'decorative' },
  { family: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
]

export const FONT_WEIGHTS = [
  { value: 300, label: '细体' },
  { value: 400, label: '常规' },
  { value: 500, label: '中等' },
  { value: 600, label: '半粗' },
  { value: 700, label: '粗体' },
  { value: 900, label: '特粗' },
] as const

// Background color presets
export const BG_COLORS = [
  'transparent', '#ffffff', '#f8f5ff', '#fef3c7', '#fce7f3',
  '#e0e7ff', '#d1fae5', '#fee2e2', '#f3f4f6',
  '#1f2937', '#7c3aed', '#db2777', '#0891b2',
]
