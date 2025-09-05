// 错误追踪相关类型定义
export interface ErrorEvent {
  id: string
  type: 'javascript' | 'promise' | 'resource' | 'network'
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
  url: string
  userAgent: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorStats {
  total: number
  byType: Record<string, number>
  byPage: Record<string, number>
  byTime: Record<string, number>
  recentErrors: ErrorEvent[]
}

export interface ErrorFilter {
  type?: ErrorEvent['type']
  severity?: ErrorEvent['severity']
  startTime?: number
  endTime?: number
  page?: string
}

// 错误追踪配置
export interface ErrorConfig {
  enableJSError: boolean
  enablePromiseError: boolean
  enableResourceError: boolean
  enableNetworkError: boolean
  maxErrors: number
  autoReport: boolean
}