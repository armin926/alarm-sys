/**
 * 错误追踪 Store
 * 
 * 负责管理和追踪应用中的各种错误信息，包括：
 * - JavaScript运行时错误捕获和处理
 * - 网络请求错误监控
 * - 资源加载错误追踪
 * - 错误统计分析和过滤
 * - 错误上报和告警管理
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { ErrorEvent, ErrorStats, ErrorConfig, ErrorFilter } from '@/types'

export const useErrorStore = defineStore('error', () => {
  // ======================== 状态管理 ========================
  
  /** 错误事件列表 - 存储所有捕获到的错误信息 */
  const errors = ref<ErrorEvent[]>([])
  
  /** 错误追踪配置 - 控制错误监控的行为和规则 */
  const config = ref<ErrorConfig>({
    enableJSError: true,      // 是否启用JavaScript错误监控
    enablePromiseError: true, // 是否启用Promise异常监控
    enableResourceError: true,// 是否启用资源加载错误监控
    enableNetworkError: true, // 是否启用网络请求错误监控
    maxErrors: 200,          // 最大错误记录数量
    autoReport: true         // 是否自动上报错误
  })
  
  /** 错误过滤器 - 用于筛选和查询特定条件的错误 */
  const filter = ref<ErrorFilter>({})

  // ======================== 计算属性 ========================
  
  /**
   * 错误统计数据
   * 基于过滤条件计算错误的各种统计信息
   */
  const errorStats = computed((): ErrorStats => {
    const filteredErrors = getFilteredErrors()
    
    const stats: ErrorStats = {
      total: filteredErrors.length,           // 错误总数
      byType: {},                            // 按错误类型分组统计
      byPage: {},                            // 按页面分组统计
      byTime: {},                            // 按时间分组统计
      recentErrors: filteredErrors.slice(0, 10) // 最近10个错误
    }

    filteredErrors.forEach(error => {
      // 按错误类型统计
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      
      // 按页面统计（从URL中提取页面路径）
      const page = getPageFromUrl(error.url)
      stats.byPage[page] = (stats.byPage[page] || 0) + 1
      
      // 按时间统计（按小时分组）
      const hour = new Date(error.timestamp).getHours()
      const timeKey = `${hour}:00`
      stats.byTime[timeKey] = (stats.byTime[timeKey] || 0) + 1
    })

    return stats
  })

  /**
   * 严重错误列表
   * 筛选出所有严重级别为'critical'的错误
   */
  const criticalErrors = computed(() => 
    errors.value.filter(error => error.severity === 'critical')
  )

  /**
   * 错误发生率
   * 计算最近一小时内的错误数量，用于监控系统稳定性
   */
  const errorRate = computed(() => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000 // 一小时前的时间戳
    const recentErrors = errors.value.filter(
      error => error.timestamp >= oneHourAgo
    )
    return recentErrors.length
  })

  // ======================== 核心方法 ========================
  
  /**
   * 添加错误记录
   * 将新的错误事件添加到错误列表中，并执行相关处理逻辑
   * 
   * @param error - 错误事件对象
   */
  const addError = (error: ErrorEvent) => {
    // 为错误添加唯一ID（如果没有的话）
    if (!error.id) {
      error.id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // 将新错误添加到列表头部（最新的在前）
    errors.value.unshift(error)
    
    // 保持错误数量在配置的最大限制内
    if (errors.value.length > config.value.maxErrors) {
      errors.value = errors.value.slice(0, config.value.maxErrors)
    }
    
    // 如果启用了自动上报，则上报错误
    if (config.value.autoReport) {
      reportError(error)
    }
    
    // 在控制台输出错误信息供开发者查看
    console.error('🚨 检测到新错误:', error)
  }

  /**
   * 上报错误到远程服务
   * 将错误信息发送到错误监控服务进行集中处理
   * 
   * @param error - 要上报的错误事件
   */
  const reportError = async (error: ErrorEvent) => {
    try {
      // 这里可以集成真实的错误上报服务，如Sentry、Bugsnag等
      console.log('📤 上报错误:', error)
    } catch (e) {
      console.error('错误上报失败:', e)
    }
  }

  /**
   * 清空所有错误记录
   * 一次性删除所有错误数据
   */
  const clearErrors = () => {
    errors.value = []
  }

  /**
   * 删除指定错误记录
   * 根据错误 ID 删除单个错误记录
   * 
   * @param id - 要删除的错误 ID
   */
  const removeError = (id: string) => {
    const index = errors.value.findIndex(error => error.id === id)
    if (index !== -1) {
      errors.value.splice(index, 1)
    }
  }

  /**
   * 更新错误追踪配置
   * 合并新的配置项到现有配置中
   * 
   * @param newConfig - 新的配置项（部分更新）
   */
  const updateConfig = (newConfig: Partial<ErrorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * 设置错误过滤条件
   * 更新错误过滤器的筛选条件
   * 
   * @param newFilter - 新的过滤条件（部分更新）
   */
  const setFilter = (newFilter: Partial<ErrorFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  /**
   * 清空过滤条件
   * 重置所有过滤条件，显示所有错误
   */
  const clearFilter = () => {
    filter.value = {}
  }

  // ======================== 辅助函数 ========================
  
  /**
   * 获取过滤后的错误列表
   * 根据当前过滤条件筛选错误数据
   * 
   * @returns 符合过滤条件的错误列表
   */
  const getFilteredErrors = () => {
    let filtered = errors.value

    // 按错误类型过滤
    if (filter.value.type) {
      filtered = filtered.filter(error => error.type === filter.value.type)
    }

    // 按严重程度过滤
    if (filter.value.severity) {
      filtered = filtered.filter(error => error.severity === filter.value.severity)
    }

    // 按页面过滤（模糊匹配）
    if (filter.value.page) {
      filtered = filtered.filter(error => 
        getPageFromUrl(error.url).includes(filter.value.page!)
      )
    }

    // 按时间范围过滤
    if (filter.value.startTime && filter.value.endTime) {
      filtered = filtered.filter(error => 
        error.timestamp >= filter.value.startTime! && 
        error.timestamp <= filter.value.endTime!
      )
    }

    return filtered
  }

  /**
   * 从URL中提取页面路径
   * 解析URL并返回页面路径部分，用于错误分组统计
   * 
   * @param url - 要解析的URL字符串
   * @returns 页面路径，如果解析失败则返回原始URL
   */
  const getPageFromUrl = (url: string): string => {
    try {
      return new URL(url).pathname
    } catch {
      return url // 如果URL格式不正确，返回原始字符串
    }
  }

  // ======================== 演示功能 ========================
  
  /**
   * 模拟JavaScript错误
   * 生成一个模拟JavaScript运行时错误，用于演示和测试
   */
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

  /**
   * 模拟网络请求错误
   * 生成一个模拟网络请求失败错误，用于演示和测试
   */
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

  /**
   * 模拟资源加载错误
   * 生成一个模拟资源加载失败错误，用于演示和测试
   */
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

  // ======================== 返回对象 ========================
  
  return {
    // ========== 状态（只读） ==========
    errors: readonly(errors),          // 错误事件列表
    config: readonly(config),          // 错误追踪配置
    filter: readonly(filter),          // 错误过滤条件
    
    // ========== 计算属性 ==========
    errorStats,        // 错误统计数据
    criticalErrors,    // 严重错误列表
    errorRate,         // 错误发生率
    
    // ========== 核心方法 ==========
    addError,          // 添加错误记录
    clearErrors,       // 清空所有错误
    removeError,       // 删除指定错误
    updateConfig,      // 更新配置
    setFilter,         // 设置过滤条件
    clearFilter,       // 清空过滤条件
    getFilteredErrors, // 获取过滤后的错误
    
    // ========== 演示功能 ==========
    simulateJSError,       // 模拟JS错误
    simulateNetworkError,  // 模拟网络错误
    simulateResourceError  // 模拟资源错误
  }
})