import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { AlertRule, AlertNotification, AlertConfig, SystemStats } from '@/types'
import { usePerformanceStore } from './performance'
import { useErrorStore } from './error'
import { useBehaviorStore } from './behavior'

export const useAlertStore = defineStore('alert', () => {
  // State
  const rules = ref<AlertRule[]>([])
  const notifications = ref<AlertNotification[]>([])
  const config = ref<AlertConfig>({
    enableNotifications: true,
    notificationMethods: ['browser', 'console'],
    silentHours: {
      start: '22:00',
      end: '08:00'
    }
  })

  // Getters
  const activeRules = computed(() => 
    rules.value.filter(rule => rule.enabled)
  )

  const unacknowledgedNotifications = computed(() => 
    notifications.value.filter(notification => !notification.acknowledged)
  )

  const systemStats = computed((): SystemStats => {
    const performanceStore = usePerformanceStore()
    const errorStore = useErrorStore()
    const behaviorStore = useBehaviorStore()
    
    const avgMetrics = performanceStore.averageMetrics
    
    return {
      performance: {
        avgFcp: avgMetrics?.fcp || 0,
        avgLcp: avgMetrics?.lcp || 0,
        avgFid: avgMetrics?.fid || 0,
        avgCls: avgMetrics?.cls || 0,
        avgTtfb: avgMetrics?.ttfb || 0
      },
      errors: {
        total: errorStore.errors.length,
        rate: errorStore.errorRate,
        critical: errorStore.criticalErrors.length
      },
      behavior: {
        totalEvents: behaviorStore.events.length,
        activeUsers: behaviorStore.sessions.length,
        avgSessionDuration: Math.round(
          behaviorStore.sessions.reduce((sum, session) => {
            const duration = (session.endTime || Date.now()) - session.startTime
            return sum + duration
          }, 0) / Math.max(behaviorStore.sessions.length, 1) / 1000
        )
      }
    }
  })

  // Actions
  const addRule = (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRule: AlertRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...rule
    }
    
    rules.value.push(newRule)
    console.log('📋 新增告警规则:', newRule.name)
  }

  const updateRule = (id: string, updates: Partial<AlertRule>) => {
    const index = rules.value.findIndex(rule => rule.id === id)
    if (index !== -1) {
      rules.value[index] = {
        ...rules.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const deleteRule = (id: string) => {
    const index = rules.value.findIndex(rule => rule.id === id)
    if (index !== -1) {
      rules.value.splice(index, 1)
    }
  }

  const triggerNotification = (notification: Omit<AlertNotification, 'id' | 'acknowledged'>) => {
    if (!config.value.enableNotifications) return
    if (isInSilentHours()) return
    
    const newNotification: AlertNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      acknowledged: false,
      ...notification
    }
    
    notifications.value.unshift(newNotification)
    
    // 保持最近100条通知
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
    
    // 发送通知
    sendNotification(newNotification)
  }

  const acknowledgeNotification = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.acknowledged = true
    }
  }

  const acknowledgeAllNotifications = () => {
    notifications.value.forEach(notification => {
      notification.acknowledged = true
    })
  }

  const clearNotifications = () => {
    notifications.value = []
  }

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

  const sendBrowserNotification = (notification: AlertNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      })
    }
  }

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

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  const isInSilentHours = (): boolean => {
    if (!config.value.silentHours) return false
    
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const { start, end } = config.value.silentHours
    
    if (start < end) {
      return currentTime >= start && currentTime <= end
    } else {
      return currentTime >= start || currentTime <= end
    }
  }

  const updateConfig = (newConfig: Partial<AlertConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // 初始化默认规则
  const initializeDefaultRules = () => {
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
    
    defaultRules.forEach(rule => addRule(rule))
  }

  return {
    // State (readonly)
    rules: readonly(rules),
    notifications: readonly(notifications),
    config: readonly(config),
    
    // Getters
    activeRules,
    unacknowledgedNotifications,
    systemStats,
    
    // Actions
    addRule,
    updateRule,
    deleteRule,
    triggerNotification,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    clearNotifications,
    requestNotificationPermission,
    updateConfig,
    initializeDefaultRules
  }
})