// 用户行为分析相关类型定义
export interface UserEvent {
  id: string
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'hover' | 'focus'
  element: string
  selector?: string
  timestamp: number
  coordinates?: { x: number; y: number }
  value?: string
  page: string
  sessionId: string
  userId?: string
}

export interface HeatmapPoint {
  x: number
  y: number
  value: number
  count: number
}

export interface BehaviorStats {
  totalEvents: number
  byType: Record<string, number>
  byPage: Record<string, number>
  sessionDuration: number
  uniqueElements: number
}

export interface UserSession {
  id: string
  startTime: number
  endTime?: number
  pageViews: number
  interactions: number
  events: UserEvent[]
  userId?: string
}

// 用户行为分析配置
export interface BehaviorConfig {
  trackClicks: boolean
  trackScrolls: boolean
  trackInputs: boolean
  trackHovers: boolean
  trackNavigation: boolean
  heatmapEnabled: boolean
  sessionTimeout: number
}