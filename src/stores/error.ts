import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ErrorEvent, ErrorStats, ErrorConfig, ErrorFilter } from '@/types'

export const useErrorStore = defineStore('error', () => {
  // State
  const errors = ref<ErrorEvent[]>([])
  const config = ref<ErrorConfig>({
    enableJSError: true,
    enablePromiseError: true,
    enableResourceError: true,
    enableNetworkError: true,
    maxErrors: 200,
    autoReport: true
  })
  const filter = ref<ErrorFilter>({})

  // Getters  
  const errorStats = computed((): ErrorStats => {
    const filteredErrors = getFilteredErrors()
    
    const stats: ErrorStats = {
      total: filteredErrors.length,
      byType: {},
      byPage: {},
      byTime: {},
      recentErrors: filteredErrors.slice(0, 10)
    }

    filteredErrors.forEach(error => {
      // 按类型统计
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      
      // 按页面统计
      const page = getPageFromUrl(error.url)
      stats.byPage[page] = (stats.byPage[page] || 0) + 1
      
      // 按时间统计（小时）
      const hour = new Date(error.timestamp).getHours()
      const timeKey = `${hour}:00`
      stats.byTime[timeKey] = (stats.byTime[timeKey] || 0) + 1
    })

    return stats
  })

  const criticalErrors = computed(() => 
    errors.value.filter(error => error.severity === 'critical')
  )

  const errorRate = computed(() => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const recentErrors = errors.value.filter(
      error => error.timestamp >= oneHourAgo
    )
    return recentErrors.length
  })

  // Actions
  const addError = (error: ErrorEvent) => {
    // 添加唯一ID
    if (!error.id) {
      error.id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    errors.value.unshift(error)
    
    // 保持错误数量限制
    if (errors.value.length > config.value.maxErrors) {
      errors.value = errors.value.slice(0, config.value.maxErrors)
    }
    
    // 自动上报
    if (config.value.autoReport) {
      reportError(error)
    }
    
    // 打印到控制台
    console.error('🚨 检测到新错误:', error)
  }

  const reportError = async (error: ErrorEvent) => {
    try {
      // 这里可以集成真实的错误上报服务
      console.log('📤 上报错误:', error)
    } catch (e) {
      console.error('错误上报失败:', e)
    }
  }

  const clearErrors = () => {
    errors.value = []
  }

  const removeError = (id: string) => {
    const index = errors.value.findIndex(error => error.id === id)
    if (index !== -1) {
      errors.value.splice(index, 1)
    }
  }

  const updateConfig = (newConfig: Partial<ErrorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const setFilter = (newFilter: Partial<ErrorFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const clearFilter = () => {
    filter.value = {}
  }

  const getFilteredErrors = () => {
    let filtered = errors.value

    if (filter.value.type) {
      filtered = filtered.filter(error => error.type === filter.value.type)
    }

    if (filter.value.severity) {
      filtered = filtered.filter(error => error.severity === filter.value.severity)
    }

    if (filter.value.page) {
      filtered = filtered.filter(error => 
        getPageFromUrl(error.url).includes(filter.value.page!)
      )
    }

    if (filter.value.startTime && filter.value.endTime) {
      filtered = filtered.filter(error => 
        error.timestamp >= filter.value.startTime! && 
        error.timestamp <= filter.value.endTime!
      )
    }

    return filtered
  }

  const getPageFromUrl = (url: string): string => {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  }

  // 模拟错误生成（用于演示）
  const simulateJSError = () => {
    const error: ErrorEvent = {
      id: `sim_js_${Date.now()}`,
      type: 'javascript',
      message: '模拟的JavaScript错误: Cannot read property of undefined',
      stack: 'Error: Cannot read property of undefined\n    at simulateError (demo.js:10:5)',
      filename: 'demo.js',
      lineno: 10,
      colno: 5,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'medium'
    }
    addError(error)
  }

  const simulateNetworkError = () => {
    const error: ErrorEvent = {
      id: `sim_net_${Date.now()}`,
      type: 'network',
      message: '网络请求失败: 404 Not Found',
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'high'
    }
    addError(error)
  }

  const simulateResourceError = () => {
    const error: ErrorEvent = {
      id: `sim_res_${Date.now()}`,
      type: 'resource',
      message: '资源加载失败: image.png',
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'low'
    }
    addError(error)
  }

  return {
    // State (readonly)
    errors: readonly(errors),
    config: readonly(config),
    filter: readonly(filter),
    
    // Getters
    errorStats,
    criticalErrors,
    errorRate,
    
    // Actions
    addError,
    clearErrors,
    removeError,
    updateConfig,
    setFilter,
    clearFilter,
    getFilteredErrors,
    
    // Demo functions
    simulateJSError,
    simulateNetworkError,
    simulateResourceError
  }
})