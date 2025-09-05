import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  UserEvent, 
  HeatmapPoint, 
  BehaviorStats, 
  UserSession, 
  BehaviorConfig 
} from '@/types'

export const useBehaviorStore = defineStore('behavior', () => {
  // State
  const events = ref<UserEvent[]>([])
  const sessions = ref<UserSession[]>([])
  const currentSession = ref<UserSession | null>(null)
  const heatmapData = ref<HeatmapPoint[]>([])
  const config = ref<BehaviorConfig>({
    trackClicks: true,
    trackScrolls: true,
    trackInputs: true,
    trackHovers: false,
    trackNavigation: true,
    heatmapEnabled: true,
    sessionTimeout: 30 * 60 * 1000 // 30分钟
  })

  // Getters
  const behaviorStats = computed((): BehaviorStats => {
    return {
      totalEvents: events.value.length,
      byType: getEventsByType(),
      byPage: getEventsByPage(),
      sessionDuration: getCurrentSessionDuration(),
      uniqueElements: getUniqueElements()
    }
  })

  const popularElements = computed(() => {
    const elementCounts: Record<string, number> = {}
    
    events.value
      .filter(event => event.type === 'click')
      .forEach(event => {
        elementCounts[event.element] = (elementCounts[event.element] || 0) + 1
      })
    
    return Object.entries(elementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([element, count]) => ({ element, count }))
  })

  const pageViews = computed(() => {
    const pageViewCounts: Record<string, number> = {}
    
    events.value
      .filter(event => event.type === 'navigation')
      .forEach(event => {
        pageViewCounts[event.page] = (pageViewCounts[event.page] || 0) + 1
      })
    
    return pageViewCounts
  })

  // Actions
  const trackEvent = (event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>) => {
    if (!shouldTrackEvent(event.type)) return

    const userEvent: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: getCurrentSessionId(),
      ...event
    }

    events.value.push(userEvent)
    
    // 更新当前会话
    updateCurrentSession(userEvent)
    
    // 更新热力图数据
    if (config.value.heatmapEnabled && event.coordinates) {
      updateHeatmapData(event.coordinates)
    }
    
    // 保持事件数量限制
    if (events.value.length > 1000) {
      events.value = events.value.slice(-1000)
    }
  }

  const trackClick = (element: string, coordinates: { x: number; y: number }, selector?: string) => {
    trackEvent({
      type: 'click',
      element,
      selector,
      coordinates,
      page: location.pathname
    })
  }

  const trackScroll = (scrollY: number) => {
    trackEvent({
      type: 'scroll',
      element: 'window',
      value: scrollY.toString(),
      page: location.pathname
    })
  }

  const trackInput = (element: string, value: string, selector?: string) => {
    trackEvent({
      type: 'input',
      element,
      selector,
      value,
      page: location.pathname
    })
  }

  const trackNavigation = (from: string, to: string) => {
    trackEvent({
      type: 'navigation',
      element: 'page',
      value: `${from} -> ${to}`,
      page: to
    })
  }

  const startSession = (userId?: string) => {
    const session: UserSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      pageViews: 1,
      interactions: 0,
      events: [],
      userId
    }
    
    sessions.value.push(session)
    currentSession.value = session
    
    console.log('🎯 用户会话已开始:', session.id)
  }

  const endSession = () => {
    if (currentSession.value) {
      currentSession.value.endTime = Date.now()
      console.log('🏁 用户会话已结束:', currentSession.value.id)
      currentSession.value = null
    }
  }

  const updateConfig = (newConfig: Partial<BehaviorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const generateHeatmap = (): HeatmapPoint[] => {
    const heatmap: Record<string, HeatmapPoint> = {}
    
    events.value
      .filter(event => event.coordinates && event.type === 'click')
      .forEach(event => {
        const { x, y } = event.coordinates!
        // 将坐标归一化到网格
        const gridX = Math.floor(x / 50) * 50
        const gridY = Math.floor(y / 50) * 50
        const key = `${gridX},${gridY}`
        
        if (!heatmap[key]) {
          heatmap[key] = { x: gridX, y: gridY, value: 0, count: 0 }
        }
        
        heatmap[key].count += 1
        heatmap[key].value = heatmap[key].count
      })
    
    return Object.values(heatmap)
  }

  const clearEvents = () => {
    events.value = []
    heatmapData.value = []
  }

  const clearSessions = () => {
    sessions.value = []
    currentSession.value = null
  }

  // Helper functions
  const shouldTrackEvent = (type: UserEvent['type']): boolean => {
    switch (type) {
      case 'click': return config.value.trackClicks
      case 'scroll': return config.value.trackScrolls
      case 'input': return config.value.trackInputs
      case 'hover': return config.value.trackHovers
      case 'navigation': return config.value.trackNavigation
      default: return true
    }
  }

  const getCurrentSessionId = (): string => {
    if (!currentSession.value) {
      startSession()
    }
    return currentSession.value!.id
  }

  const updateCurrentSession = (event: UserEvent) => {
    if (currentSession.value) {
      currentSession.value.events.push(event)
      if (event.type === 'navigation') {
        currentSession.value.pageViews += 1
      } else {
        currentSession.value.interactions += 1
      }
    }
  }

  const updateHeatmapData = (coordinates: { x: number; y: number }) => {
    const existing = heatmapData.value.find(
      point => Math.abs(point.x - coordinates.x) < 20 && Math.abs(point.y - coordinates.y) < 20
    )
    
    if (existing) {
      existing.value += 1
      existing.count += 1
    } else {
      heatmapData.value.push({
        x: coordinates.x,
        y: coordinates.y,
        value: 1,
        count: 1
      })
    }
  }

  const getEventsByType = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    events.value.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })
    return counts
  }

  const getEventsByPage = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    events.value.forEach(event => {
      counts[event.page] = (counts[event.page] || 0) + 1
    })
    return counts
  }

  const getCurrentSessionDuration = (): number => {
    if (!currentSession.value) return 0
    const now = currentSession.value.endTime || Date.now()
    return now - currentSession.value.startTime
  }

  const getUniqueElements = (): number => {
    const elements = new Set(events.value.map(event => event.element))
    return elements.size
  }

  // Demo functions
  const simulateUserBehavior = () => {
    // 模拟点击事件
    trackClick('登录按钮', { x: 100, y: 200 }, '#login-btn')
    trackClick('菜单项', { x: 50, y: 100 }, '.menu-item')
    
    // 模拟滚动
    trackScroll(500)
    
    // 模拟输入
    trackInput('用户名输入框', 'test@example.com', '#username')
    
    console.log('🎭 已模拟用户行为数据')
  }

  return {
    // State (readonly)
    events: readonly(events),
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    heatmapData: readonly(heatmapData),
    config: readonly(config),
    
    // Getters
    behaviorStats,
    popularElements,
    pageViews,
    
    // Actions
    trackEvent,
    trackClick,
    trackScroll,
    trackInput,
    trackNavigation,
    startSession,
    endSession,
    updateConfig,
    generateHeatmap,
    clearEvents,
    clearSessions,
    
    // Demo
    simulateUserBehavior
  }
})