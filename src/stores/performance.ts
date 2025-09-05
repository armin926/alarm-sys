import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceConfig,
  PerformanceThresholds 
} from '@/types'

export const usePerformanceStore = defineStore('performance', () => {
  // State
  const metrics = ref<PerformanceMetrics[]>([])
  const currentMetrics = ref<PerformanceMetrics | null>(null)
  const alerts = ref<PerformanceAlert[]>([])
  const isMonitoring = ref(false)
  const config = ref<PerformanceConfig>({
    autoStart: true,
    interval: 5000,
    enableAlerts: true,
    thresholds: {
      fcp: 2000,    // 2s
      lcp: 2500,    // 2.5s  
      fid: 100,     // 100ms
      cls: 0.1,     // 0.1
      ttfb: 800     // 800ms
    }
  })

  // Getters
  const latestMetrics = computed(() => 
    metrics.value.slice(-20) // 最近20条数据
  )

  const averageMetrics = computed(() => {
    if (metrics.value.length === 0) return null
    
    const sum = metrics.value.reduce((acc, curr) => ({
      fcp: acc.fcp + curr.fcp,
      lcp: acc.lcp + curr.lcp,
      fid: acc.fid + curr.fid,
      cls: acc.cls + curr.cls,
      ttfb: acc.ttfb + curr.ttfb,
      timestamp: 0,
      page: ''
    }), { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0, timestamp: 0, page: '' })

    const count = metrics.value.length
    return {
      fcp: Math.round(sum.fcp / count),
      lcp: Math.round(sum.lcp / count),
      fid: Math.round(sum.fid / count),
      cls: Math.round((sum.cls / count) * 100) / 100,
      ttfb: Math.round(sum.ttfb / count)
    }
  })

  const performanceScore = computed(() => {
    if (!currentMetrics.value) return 0
    
    const thresholds = config.value.thresholds
    const current = currentMetrics.value
    
    let score = 100
    
    // FCP 评分
    if (current.fcp > thresholds.fcp * 1.5) score -= 20
    else if (current.fcp > thresholds.fcp) score -= 10
    
    // LCP 评分  
    if (current.lcp > thresholds.lcp * 1.5) score -= 20
    else if (current.lcp > thresholds.lcp) score -= 10
    
    // FID 评分
    if (current.fid > thresholds.fid * 2) score -= 15
    else if (current.fid > thresholds.fid) score -= 8
    
    // CLS 评分
    if (current.cls > thresholds.cls * 2) score -= 15
    else if (current.cls > thresholds.cls) score -= 8
    
    // TTFB 评分
    if (current.ttfb > thresholds.ttfb * 1.5) score -= 10
    else if (current.ttfb > thresholds.ttfb) score -= 5
    
    return Math.max(0, score)
  })

  // Actions
  const startMonitoring = () => {
    isMonitoring.value = true
    console.log('🚀 性能监控已启动')
  }

  const stopMonitoring = () => {
    isMonitoring.value = false
    console.log('⏹️ 性能监控已停止')
  }

  const addMetrics = (newMetrics: PerformanceMetrics) => {
    metrics.value.push(newMetrics)
    currentMetrics.value = newMetrics
    
    // 保持最近100条记录
    if (metrics.value.length > 100) {
      metrics.value = metrics.value.slice(-100)
    }
    
    // 检查告警
    if (config.value.enableAlerts) {
      checkPerformanceAlerts(newMetrics)
    }
  }

  const checkPerformanceAlerts = (metrics: PerformanceMetrics) => {
    const thresholds = config.value.thresholds
    const newAlerts: PerformanceAlert[] = []
    
    // 检查各项指标
    Object.entries(thresholds).forEach(([key, threshold]) => {
      const value = metrics[key as keyof PerformanceMetrics] as number
      if (value > threshold) {
        const severity = value > threshold * 1.5 ? 'high' : 'medium'
        newAlerts.push({
          id: `alert_${Date.now()}_${key}`,
          metric: key as keyof PerformanceMetrics,
          value,
          threshold,
          timestamp: Date.now(),
          page: metrics.page,
          severity
        })
      }
    })
    
    alerts.value.unshift(...newAlerts)
    
    // 保持最近50条告警
    if (alerts.value.length > 50) {
      alerts.value = alerts.value.slice(0, 50)
    }
  }

  const clearMetrics = () => {
    metrics.value = []
    currentMetrics.value = null
  }

  const clearAlerts = () => {
    alerts.value = []
  }

  const updateConfig = (newConfig: Partial<PerformanceConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const updateThresholds = (newThresholds: Partial<PerformanceThresholds>) => {
    config.value.thresholds = { ...config.value.thresholds, ...newThresholds }
  }

  return {
    // State (readonly)
    metrics: readonly(metrics),
    currentMetrics: readonly(currentMetrics),
    alerts: readonly(alerts),
    isMonitoring: readonly(isMonitoring),
    config: readonly(config),
    
    // Getters
    latestMetrics,
    averageMetrics,
    performanceScore,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    addMetrics,
    clearMetrics,
    clearAlerts,
    updateConfig,
    updateThresholds
  }
})