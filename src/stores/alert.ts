/**
 * 告警系统 Store
 * 
 * 负责管理整个系统的告警规则、通知和监控功能，包括：
 * - 告警规则的创建、更新和管理
 * - 系统通知的发送和管理
 * - 性能、错误、行为数据的综合监控
 * - 多种通知方式的支持（浏览器、控制台、Webhook）
 * - 免打扰时间段的配置和控制
 * - 系统统计数据的实时计算
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { AlertRule, AlertNotification, AlertConfig, SystemStats } from '@/types'
import { usePerformanceStore } from './performance'
import { useErrorStore } from './error'
import { useBehaviorStore } from './behavior'

export const useAlertStore = defineStore('alert', () => {
  // ======================== 状态管理 ========================
  
  /** 告警规则列表 - 存储所有配置的告警规则 */
  const rules = ref<AlertRule[]>([])
  
  /** 通知消息列表 - 存储所有系统通知和告警消息 */
  const notifications = ref<AlertNotification[]>([])
  
  /** 告警系统配置 - 控制通知行为和系统设置 */
  const config = ref<AlertConfig>({
    enableNotifications: true,              // 是否启用通知功能
    notificationMethods: ['browser', 'console'], // 通知方式数组
    silentHours: {                         // 免打扰时间段
      start: '22:00',                      // 开始时间
      end: '08:00'                         // 结束时间
    }
  })

  // ======================== 计算属性 ========================
  
  /**
   * 活跃的告警规则
   * 筛选出所有已启用的告警规则
   */
  const activeRules = computed(() => 
    rules.value.filter(rule => rule.enabled)
  )

  /**
   * 未确认的通知
   * 筛选出所有尚未被用户确认的通知消息
   */
  const unacknowledgedNotifications = computed(() => 
    notifications.value.filter(notification => !notification.acknowledged)
  )

  /**
   * 系统统计数据
   * 整合性能、错误、行为三个模块的关键指标数据
   * 为告警系统提供实时的系统健康状况信息
   */
  const systemStats = computed((): SystemStats => {
    // 获取各个Store的实例
    const performanceStore = usePerformanceStore()
    const errorStore = useErrorStore()
    const behaviorStore = useBehaviorStore()
    
    // 获取平均性能指标
    const avgMetrics = performanceStore.averageMetrics
    
    return {
      // 性能指标统计
      performance: {
        avgFcp: avgMetrics?.fcp || 0,    // 平均首次内容绘制时间
        avgLcp: avgMetrics?.lcp || 0,    // 平均最大内容绘制时间
        avgFid: avgMetrics?.fid || 0,    // 平均首次输入延迟
        avgCls: avgMetrics?.cls || 0,    // 平均累积布局偏移
        avgTtfb: avgMetrics?.ttfb || 0   // 平均首字节时间
      },
      // 错误统计
      errors: {
        total: errorStore.errors.length,           // 错误总数
        rate: errorStore.errorRate,                // 错误发生率
        critical: errorStore.criticalErrors.length // 严重错误数量
      },
      // 用户行为统计
      behavior: {
        totalEvents: behaviorStore.events.length,  // 总事件数
        activeUsers: behaviorStore.sessions.length, // 活跃用户数
        avgSessionDuration: Math.round(             // 平均会话时长（秒）
          behaviorStore.sessions.reduce((sum, session) => {
            const duration = (session.endTime || Date.now()) - session.startTime
            return sum + duration
          }, 0) / Math.max(behaviorStore.sessions.length, 1) / 1000
        )
      }
    }
  })

  // ======================== 核心方法 ========================
  
  /**
   * 添加告警规则
   * 创建一个新的告警规则并添加到规则列表中
   * 
   * @param rule - 告警规则数据（不包括ID和时间戳）
   */
  const addRule = (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 创建完整的告警规则对象
    const newRule: AlertRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
      createdAt: Date.now(),   // 创建时间
      updatedAt: Date.now(),   // 更新时间
      ...rule                  // 合并传入的规则数据
    }
    
    rules.value.push(newRule)
    console.log('📋 新增告警规则:', newRule.name)
  }

  /**
   * 更新告警规则
   * 修改指定告警规则的属性
   * 
   * @param id - 要更新的规则ID
   * @param updates - 要更新的属性（部分更新）
   */
  const updateRule = (id: string, updates: Partial<AlertRule>) => {
    const index = rules.value.findIndex(rule => rule.id === id)
    if (index !== -1) {
      rules.value[index] = {
        ...rules.value[index],
        ...updates,
        updatedAt: Date.now() // 更新修改时间
      }
    }
  }

  /**
   * 删除告警规则
   * 从规则列表中移除指定的告警规则
   * 
   * @param id - 要删除的规则ID
   */
  const deleteRule = (id: string) => {
    const index = rules.value.findIndex(rule => rule.id === id)
    if (index !== -1) {
      rules.value.splice(index, 1)
    }
  }

  /**
   * 触发通知
   * 创建并发送一个新的告警通知
   * 会检查通知是否在免打扰时间内，并按配置的方式发送
   * 
   * @param notification - 通知数据（不包括ID和确认状态）
   */
  const triggerNotification = (notification: Omit<AlertNotification, 'id' | 'acknowledged'>) => {
    // 检查通知是否已启用
    if (!config.value.enableNotifications) return
    // 检查是否在免打扰时间内
    if (isInSilentHours()) return
    
    // 创建完整的通知对象
    const newNotification: AlertNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
      acknowledged: false, // 初始状态为未确认
      ...notification
    }
    
    // 添加到通知列表头部（最新的在前）
    notifications.value.unshift(newNotification)
    
    // 保持最近100条通知，避免内存占用过多
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
    
    // 按配置的方式发送通知
    sendNotification(newNotification)
  }

  /**
   * 确认单个通知
   * 将指定通知标记为已确认状态
   * 
   * @param id - 要确认的通知ID
   */
  const acknowledgeNotification = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.acknowledged = true
    }
  }

  /**
   * 确认所有通知
   * 将所有通知批量标记为已确认状态
   */
  const acknowledgeAllNotifications = () => {
    notifications.value.forEach(notification => {
      notification.acknowledged = true
    })
  }

  /**
   * 清空所有通知
   * 一次性删除所有通知记录
   */
  const clearNotifications = () => {
    notifications.value = []
  }

  // ======================== 通知发送系统 ========================
  
  /**
   * 发送通知
   * 根据配置的通知方式，将通知发送给用户
   * 支持多种通知渠道：浏览器通知、控制台输出、Webhook
   * 
   * @param notification - 要发送的通知对象
   */
  const sendNotification = (notification: AlertNotification) => {
    config.value.notificationMethods.forEach(method => {
      switch (method) {
        case 'browser':
          sendBrowserNotification(notification)
          break
        case 'console':
          console.warn('🚨 告警通知:', notification.title, '-', notification.message)
          break
        case 'webhook':
          sendWebhookNotification(notification)
          break
      }
    })
  }

  /**
   * 发送浏览器通知
   * 使用浏览器原生Notification API发送桌面通知
   * 需要用户授权才能正常工作
   * 
   * @param notification - 要发送的通知对象
   */
  const sendBrowserNotification = (notification: AlertNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'  // 使用网站图标
      })
    }
  }

  /**
   * 发送Webhook通知
   * 将通知数据通过HTTP POST请求发送到配置的Webhook URL
   * 支持集成第三方通知服务（如铉钉、企业微信等）
   * 
   * @param notification - 要发送的通知对象
   */
  const sendWebhookNotification = async (notification: AlertNotification) => {
    if (!config.value.webhookUrl) return
    
    try {
      await fetch(config.value.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })
    } catch (error) {
      console.error('Webhook通知发送失败:', error)
    }
  }

  // ======================== 辅助函数 ========================
  
  /**
   * 请求浏览器通知权限
   * 向用户请求桌面通知权限，用于发送浏览器通知
   * 
   * @returns Promise<boolean> - 返回是否获得授权
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false // 浏览器不支持通知API
  }

  /**
   * 检查是否在免打扰时间内
   * 根据配置的免打扰时间段判断当前时间是否应该静音
   * 支持跨天的时间段（如晚上22:00到早上8:00）
   * 
   * @returns boolean - 返回是否在免打扰时间内
   */
  const isInSilentHours = (): boolean => {
    if (!config.value.silentHours) return false
    
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const { start, end } = config.value.silentHours
    
    // 处理跨天情况（如晚上22:00到早上8:00）
    if (start < end) {
      // 普通情况：在同一天内
      return currentTime >= start && currentTime <= end
    } else {
      // 跨天情况：晚上到第二天早上
      return currentTime >= start || currentTime <= end
    }
  }

  /**
   * 更新告警系统配置
   * 合并新的配置项到现有配置中
   * 
   * @param newConfig - 新的配置项（部分更新）
   */
  const updateConfig = (newConfig: Partial<AlertConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // ======================== 初始化功能 ========================
  
  /**
   * 初始化默认告警规则
   * 为系统创建一组开箱即用的默认告警规则
   * 包括性能、错误、行为等各个方面的基础监控规则
   */
  const initializeDefaultRules = () => {
    // 默认告警规则配置
    const defaultRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'FCP性能告警',
        type: 'performance',
        condition: 'fcp > 3000',
        threshold: 3000,
        enabled: true,
        severity: 'medium',
        description: 'First Contentful Paint 超过3秒'
      },
      {
        name: 'LCP性能告警',
        type: 'performance',
        condition: 'lcp > 4000',
        threshold: 4000,
        enabled: true,
        severity: 'high',
        description: 'Largest Contentful Paint 超过4秒'
      },
      {
        name: 'JavaScript错误告警',
        type: 'error',
        condition: 'type === "javascript" && severity === "critical"',
        threshold: 1,
        enabled: true,
        severity: 'critical',
        description: '严重JavaScript错误'
      },
      {
        name: '用户行为异常告警',
        type: 'behavior',
        condition: 'sessionDuration < 10000',
        threshold: 10000,
        enabled: false,
        severity: 'low',
        description: '用户会话时间过短'
      }
    ]
    
    // 批量添加默认规则
    defaultRules.forEach(rule => addRule(rule))
  }

  // ======================== 返回对象 ========================
  
  return {
    // ========== 状态（只读） ==========
    rules: readonly(rules),                        // 告警规则列表
    notifications: readonly(notifications),        // 通知消息列表
    config: readonly(config),                      // 告警系统配置
    
    // ========== 计算属性 ==========
    activeRules,                    // 活跃的告警规则
    unacknowledgedNotifications,    // 未确认的通知
    systemStats,                    // 系统统计数据
    
    // ========== 核心方法 ==========
    addRule,                        // 添加告警规则
    updateRule,                     // 更新告警规则
    deleteRule,                     // 删除告警规则
    triggerNotification,            // 触发通知
    acknowledgeNotification,        // 确认单个通知
    acknowledgeAllNotifications,    // 确认所有通知
    clearNotifications,             // 清空通知
    requestNotificationPermission,  // 请求通知权限
    updateConfig,                   // 更新系统配置
    initializeDefaultRules          // 初始化默认规则
  }
})