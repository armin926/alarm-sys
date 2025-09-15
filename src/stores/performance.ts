/**
 * 性能监控 Store
 * 
 * 负责管理和监控Web应用的核心性能指标，包括：
 * - 性能指标收集和存储（FCP、LCP、FID、CLS、TTFB）
 * - 性能告警监控和管理
 * - 性能数据分析和评分
 * - 监控配置管理
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceConfig,
  PerformanceThresholds 
} from '@/types'

export const usePerformanceStore = defineStore('performance', () => {
  // ======================== 状态管理 ========================
  
  /** 性能指标历史记录 - 存储所有收集到的性能指标数据 */
  const metrics = ref<PerformanceMetrics[]>([])
  
  /** 当前性能指标 - 最新收集到的性能指标数据 */
  const currentMetrics = ref<PerformanceMetrics | null>(null)
  
  /** 性能告警列表 - 存储所有性能告警记录 */
  const alerts = ref<PerformanceAlert[]>([])
  
  /** 监控状态 - 指示性能监控是否正在运行 */
  const isMonitoring = ref(false)
  
  /** 性能监控配置 - 包含监控设置和性能阈值 */
  const config = ref<PerformanceConfig>({
    autoStart: true,     // 是否自动启动监控
    interval: 5000,      // 监控间隔时间（毫秒）
    enableAlerts: true,  // 是否启用告警功能
    thresholds: {
      fcp: 2000,    // First Contentful Paint - 首次内容绘制阈值（2秒）
      lcp: 2500,    // Largest Contentful Paint - 最大内容绘制阈值（2.5秒）
      fid: 100,     // First Input Delay - 首次输入延迟阈值（100毫秒）
      cls: 0.1,     // Cumulative Layout Shift - 累积布局偏移阈值（0.1）
      ttfb: 800     // Time to First Byte - 首字节时间阈值（800毫秒）
    }
  })

  // ======================== 计算属性 ========================
  
  /**
   * 最新性能指标
   * 获取最近20条性能数据记录
   */
  const latestMetrics = computed(() => 
    metrics.value.slice(-20) // 最近20条数据
  )

  /**
   * 平均性能指标
   * 计算所有历史数据的平均值，用于性能趋势分析
   */
  const averageMetrics = computed(() => {
    if (metrics.value.length === 0) return null
    
    // 累加所有指标值
    const sum = metrics.value.reduce((acc, curr) => ({
      fcp: acc.fcp + curr.fcp,
      lcp: acc.lcp + curr.lcp,
      fid: acc.fid + curr.fid,
      cls: acc.cls + curr.cls,
      ttfb: acc.ttfb + curr.ttfb,
      timestamp: 0,
      page: ''
    }), { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0, timestamp: 0, page: '' })

    // 计算平均值并格式化
    const count = metrics.value.length
    return {
      fcp: Math.round(sum.fcp / count),
      lcp: Math.round(sum.lcp / count),
      fid: Math.round(sum.fid / count),
      cls: Math.round((sum.cls / count) * 100) / 100, // CLS保留两位小数
      ttfb: Math.round(sum.ttfb / count)
    }
  })

  /**
   * 性能评分
   * 基于当前性能指标与阈值对比，计算综合性能得分（0-100）
   * 评分规则：
   * - 基础分100分
   * - 超过阈值1倍扣相应分数
   * - 超过阈值1.5倍扣更多分数
   */
  const performanceScore = computed(() => {
    if (!currentMetrics.value) return 0
    
    const thresholds = config.value.thresholds
    const current = currentMetrics.value
    
    let score = 100
    
    // FCP（首次内容绘制）评分 - 影响20分
    if (current.fcp > thresholds.fcp * 1.5) score -= 20
    else if (current.fcp > thresholds.fcp) score -= 10
    
    // LCP（最大内容绘制）评分 - 影响20分
    if (current.lcp > thresholds.lcp * 1.5) score -= 20
    else if (current.lcp > thresholds.lcp) score -= 10
    
    // FID（首次输入延迟）评分 - 影响15分
    if (current.fid > thresholds.fid * 2) score -= 15
    else if (current.fid > thresholds.fid) score -= 8
    
    // CLS（累积布局偏移）评分 - 影响15分
    if (current.cls > thresholds.cls * 2) score -= 15
    else if (current.cls > thresholds.cls) score -= 8
    
    // TTFB（首字节时间）评分 - 影响10分
    if (current.ttfb > thresholds.ttfb * 1.5) score -= 10
    else if (current.ttfb > thresholds.ttfb) score -= 5
    
    return Math.max(0, score) // 确保分数不低于0
  })

  // ======================== 核心方法 ========================
  
  /**
   * 启动性能监控
   * 开始收集和监控性能指标数据
   */
  const startMonitoring = () => {
    isMonitoring.value = true
    console.log('🚀 性能监控已启动')
  }

  /**
   * 停止性能监控
   * 停止收集性能指标数据
   */
  const stopMonitoring = () => {
    isMonitoring.value = false
    console.log('⏹️ 性能监控已停止')
  }

  /**
   * 添加性能指标数据
   * 将新的性能指标数据添加到存储中，并触发告警检查
   * 
   * @param newMetrics - 新的性能指标数据
   */
  const addMetrics = (newMetrics: PerformanceMetrics) => {
    // 添加到指标列表并更新当前指标
    metrics.value.push(newMetrics)
    currentMetrics.value = newMetrics
    
    // 保持最近100条记录，避免内存占用过多
    if (metrics.value.length > 100) {
      metrics.value = metrics.value.slice(-100)
    }
    
    // 如果启用了告警功能，检查是否触发告警
    if (config.value.enableAlerts) {
      checkPerformanceAlerts(newMetrics)
    }
  }

  /**
   * 检查性能告警
   * 根据配置的阈值检查性能指标，生成告警信息
   * 
   * @param metrics - 要检查的性能指标数据
   */
  const checkPerformanceAlerts = (metrics: PerformanceMetrics) => {
    const thresholds = config.value.thresholds
    const newAlerts: PerformanceAlert[] = []
    
    // 逐个检查性能指标是否超过阈值
    Object.entries(thresholds).forEach(([key, threshold]) => {
      const value = metrics[key as keyof PerformanceMetrics] as number
      if (value > threshold) {
        // 根据超出程度确定告警级别
        const severity = value > threshold * 1.5 ? 'high' : 'medium'
        newAlerts.push({
          id: `alert_${Date.now()}_${key}`,              // 唯一告警ID
          metric: key as keyof PerformanceMetrics,       // 告警指标
          value,                                          // 实际值
          threshold,                                      // 阈值
          timestamp: Date.now(),                          // 告警时间
          page: metrics.page,                             // 发生页面
          severity                                        // 告警级别
        })
      }
    })
    
    // 将新告警添加到列表头部（最新的在前）
    alerts.value.unshift(...newAlerts)
    
    // 保持最近50条告警记录
    if (alerts.value.length > 50) {
      alerts.value = alerts.value.slice(0, 50)
    }
  }

  /**
   * 清空性能指标数据
   * 清除所有历史性能数据和当前指标
   */
  const clearMetrics = () => {
    metrics.value = []
    currentMetrics.value = null
  }

  /**
   * 清空告警记录
   * 清除所有性能告警信息
   */
  const clearAlerts = () => {
    alerts.value = []
  }

  /**
   * 更新性能监控配置
   * 合并新的配置项到现有配置中
   * 
   * @param newConfig - 新的配置项（部分更新）
   */
  const updateConfig = (newConfig: Partial<PerformanceConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * 更新性能阈值配置
   * 更新性能指标的告警阈值设置
   * 
   * @param newThresholds - 新的阈值配置（部分更新）
   */
  const updateThresholds = (newThresholds: Partial<PerformanceThresholds>) => {
    config.value.thresholds = { ...config.value.thresholds, ...newThresholds }
  }

  // ======================== 返回对象 ========================
  
  return {
    // ========== 状态（只读） ==========
    metrics: readonly(metrics),                // 性能指标历史记录
    currentMetrics: readonly(currentMetrics),  // 当前性能指标
    alerts: readonly(alerts),                  // 性能告警列表
    isMonitoring: readonly(isMonitoring),      // 监控状态
    config: readonly(config),                  // 性能监控配置
    
    // ========== 计算属性 ==========
    latestMetrics,      // 最新性能指标（最近20条）
    averageMetrics,     // 平均性能指标
    performanceScore,   // 性能综合评分
    
    // ========== 核心方法 ==========
    startMonitoring,    // 启动性能监控
    stopMonitoring,     // 停止性能监控
    addMetrics,         // 添加性能数据
    clearMetrics,       // 清空性能数据
    clearAlerts,        // 清空告警记录
    updateConfig,       // 更新监控配置
    updateThresholds    // 更新阈值配置
  }
})