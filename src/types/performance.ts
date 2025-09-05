// 性能监控相关类型定义
export interface PerformanceMetrics {
  fcp: number          // First Contentful Paint
  lcp: number          // Largest Contentful Paint  
  fid: number          // First Input Delay
  cls: number          // Cumulative Layout Shift
  ttfb: number         // Time to First Byte
  timestamp: number    // 时间戳
  page: string         // 页面路径
}

export interface PerformanceThresholds {
  fcp: number
  lcp: number
  fid: number
  cls: number
  ttfb: number
}

export interface PerformanceAlert {
  id: string
  metric: keyof PerformanceMetrics
  value: number
  threshold: number
  timestamp: number
  page: string
  severity: 'low' | 'medium' | 'high'
}

// 性能监控配置
export interface PerformanceConfig {
  autoStart: boolean
  interval: number
  thresholds: PerformanceThresholds
  enableAlerts: boolean
}