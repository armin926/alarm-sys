// 告警系统核心类型定义
export interface AlertRule {
  id: string
  name: string
  type: 'performance' | 'error' | 'behavior'
  condition: string
  threshold: number
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  createdAt: number
  updatedAt: number
}

export interface AlertNotification {
  id: string
  ruleId: string
  title: string
  message: string
  type: 'performance' | 'error' | 'behavior'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  acknowledged: boolean
  data?: any
}

export interface AlertConfig {
  enableNotifications: boolean
  notificationMethods: ('browser' | 'console' | 'webhook')[]
  webhookUrl?: string
  silentHours?: {
    start: string
    end: string
  }
}

// 系统统计信息
export interface SystemStats {
  performance: {
    avgFcp: number
    avgLcp: number
    avgFid: number
    avgCls: number
    avgTtfb: number
  }
  errors: {
    total: number
    rate: number
    critical: number
  }
  behavior: {
    totalEvents: number
    activeUsers: number
    avgSessionDuration: number
  }
}