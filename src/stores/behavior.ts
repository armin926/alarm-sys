/**
 * 用户行为追踪 Store
 * 
 * 负责跟踪和管理用户在应用中的各种行为数据，包括：
 * - 用户事件追踪（点击、滚动、输入等）
 * - 用户会话管理
 * - 热力图数据生成
 * - 行为统计分析
 */

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
  // ======================== 状态管理 ========================
  
  /** 用户事件列表 - 存储所有用户行为事件 */
  const events = ref<UserEvent[]>([])
  
  /** 用户会话列表 - 存储所有历史会话数据 */
  const sessions = ref<UserSession[]>([])
  
  /** 当前活跃会话 - 存储当前用户的会话信息 */
  const currentSession = ref<UserSession | null>(null)
  
  /** 热力图数据点集合 - 用于生成页面交互热力图 */
  const heatmapData = ref<HeatmapPoint[]>([])
  
  /** 行为追踪配置 - 控制哪些行为需要被追踪 */
  const config = ref<BehaviorConfig>({
    trackClicks: true,      // 是否追踪点击事件
    trackScrolls: true,     // 是否追踪滚动事件
    trackInputs: true,      // 是否追踪输入事件
    trackHovers: false,     // 是否追踪悬停事件
    trackNavigation: true,  // 是否追踪页面导航
    heatmapEnabled: true,   // 是否启用热力图功能
    sessionTimeout: 30 * 60 * 1000 // 会话超时时间：30分钟
  })

  // ======================== 计算属性 ========================
  
  /**
   * 行为统计数据
   * 计算并返回用户行为的综合统计信息
   */
  const behaviorStats = computed((): BehaviorStats => {
    return {
      totalEvents: events.value.length,        // 总事件数量
      byType: getEventsByType(),               // 按事件类型分组统计
      byPage: getEventsByPage(),               // 按页面分组统计
      sessionDuration: getCurrentSessionDuration(), // 当前会话持续时间
      uniqueElements: getUniqueElements()      // 唯一交互元素数量
    }
  })

  /**
   * 热门交互元素
   * 统计点击次数最多的前10个页面元素
   */
  const popularElements = computed(() => {
    const elementCounts: Record<string, number> = {}
    
    // 筛选点击事件并统计每个元素的点击次数
    events.value
      .filter(event => event.type === 'click')
      .forEach(event => {
        elementCounts[event.element] = (elementCounts[event.element] || 0) + 1
      })
    
    // 按点击次数降序排列，取前10个
    return Object.entries(elementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([element, count]) => ({ element, count }))
  })

  /**
   * 页面浏览量统计
   * 统计各个页面的访问次数
   */
  const pageViews = computed(() => {
    const pageViewCounts: Record<string, number> = {}
    
    // 筛选导航事件并统计每个页面的访问次数
    events.value
      .filter(event => event.type === 'navigation')
      .forEach(event => {
        pageViewCounts[event.page] = (pageViewCounts[event.page] || 0) + 1
      })
    
    return pageViewCounts
  })

  // ======================== 核心方法 ========================
  
  /**
   * 追踪用户事件
   * 记录用户的各种行为事件，如点击、滚动、输入等
   * 
   * @param event - 事件数据（不包括自动生成的字段）
   */
  const trackEvent = (event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>) => {
    // 检查是否需要追踪该类型的事件
    if (!shouldTrackEvent(event.type)) return

    // 创建完整的用户事件对象
    const userEvent: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
      timestamp: Date.now(),           // 当前时间戳
      sessionId: getCurrentSessionId(), // 关联到当前会话
      ...event
    }

    // 添加事件到事件列表
    events.value.push(userEvent)
    
    // 更新当前会话信息
    updateCurrentSession(userEvent)
    
    // 如果启用热力图且事件包含坐标，更新热力图数据
    if (config.value.heatmapEnabled && event.coordinates) {
      updateHeatmapData(event.coordinates)
    }
    
    // 限制事件数量，避免内存占用过多（保留最新的1000个事件）
    if (events.value.length > 1000) {
      events.value = events.value.slice(-1000)
    }
  }

  /**
   * 追踪点击事件
   * 记录用户在页面上的点击行为
   * 
   * @param element - 被点击的元素描述
   * @param coordinates - 点击位置坐标
   * @param selector - 元素的CSS选择器（可选）
   */
  const trackClick = (element: string, coordinates: { x: number; y: number }, selector?: string) => {
    trackEvent({
      type: 'click',
      element,
      selector,
      coordinates,
      page: location.pathname // 当前页面路径
    })
  }

  /**
   * 追踪滚动事件
   * 记录用户的页面滚动行为
   * 
   * @param scrollY - 垂直滚动位置
   */
  const trackScroll = (scrollY: number) => {
    trackEvent({
      type: 'scroll',
      element: 'window',
      value: scrollY.toString(),
      page: location.pathname
    })
  }

  /**
   * 追踪输入事件
   * 记录用户在表单元素中的输入行为
   * 
   * @param element - 输入元素描述
   * @param value - 输入的值
   * @param selector - 元素的CSS选择器（可选）
   */
  const trackInput = (element: string, value: string, selector?: string) => {
    trackEvent({
      type: 'input',
      element,
      selector,
      value,
      page: location.pathname
    })
  }

  /**
   * 追踪页面导航事件
   * 记录用户的页面跳转行为
   * 
   * @param from - 来源页面
   * @param to - 目标页面
   */
  const trackNavigation = (from: string, to: string) => {
    trackEvent({
      type: 'navigation',
      element: 'page',
      value: `${from} -> ${to}`,
      page: to
    })
  }

  /**
   * 开始新的用户会话
   * 创建并初始化一个新的用户会话
   * 
   * @param userId - 用户ID（可选）
   */
  const startSession = (userId?: string) => {
    const session: UserSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一会话ID
      startTime: Date.now(),    // 会话开始时间
      pageViews: 1,            // 页面浏览次数
      interactions: 0,         // 交互次数
      events: [],             // 会话内的事件列表
      userId                  // 关联的用户ID
    }
    
    // 添加到会话列表并设为当前活跃会话
    sessions.value.push(session)
    currentSession.value = session
    
    console.log('🎯 用户会话已开始:', session.id)
  }

  /**
   * 结束当前用户会话
   * 设置会话结束时间并清空当前会话
   */
  const endSession = () => {
    if (currentSession.value) {
      currentSession.value.endTime = Date.now() // 设置会话结束时间
      console.log('🏁 用户会话已结束:', currentSession.value.id)
      currentSession.value = null // 清空当前会话
    }
  }

  /**
   * 更新行为追踪配置
   * 合并新的配置项到现有配置中
   * 
   * @param newConfig - 新的配置项（部分更新）
   */
  const updateConfig = (newConfig: Partial<BehaviorConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * 生成热力图数据
   * 基于用户点击事件生成页面交互热力图
   * 
   * @returns 热力图数据点数组
   */
  const generateHeatmap = (): HeatmapPoint[] => {
    const heatmap: Record<string, HeatmapPoint> = {}
    
    // 筛选包含坐标的点击事件
    events.value
      .filter(event => event.coordinates && event.type === 'click')
      .forEach(event => {
        const { x, y } = event.coordinates!
        
        // 将坐标归一化到50x50的网格中，减少数据点数量
        const gridX = Math.floor(x / 50) * 50
        const gridY = Math.floor(y / 50) * 50
        const key = `${gridX},${gridY}`
        
        // 如果该网格位置还没有数据点，创建新的
        if (!heatmap[key]) {
          heatmap[key] = { x: gridX, y: gridY, value: 0, count: 0 }
        }
        
        // 增加该位置的点击计数和热度值
        heatmap[key].count += 1
        heatmap[key].value = heatmap[key].count
      })
    
    return Object.values(heatmap)
  }

  /**
   * 清空所有事件数据
   * 清除事件列表和热力图数据
   */
  const clearEvents = () => {
    events.value = []
    heatmapData.value = []
  }

  /**
   * 清空所有会话数据
   * 清除会话列表和当前会话
   */
  const clearSessions = () => {
    sessions.value = []
    currentSession.value = null
  }

  // ======================== 辅助函数 ========================
  
  /**
   * 检查是否应该追踪指定类型的事件
   * 根据配置决定是否记录特定类型的用户行为
   * 
   * @param type - 事件类型
   * @returns 是否应该追踪该事件
   */
  const shouldTrackEvent = (type: UserEvent['type']): boolean => {
    switch (type) {
      case 'click': return config.value.trackClicks
      case 'scroll': return config.value.trackScrolls
      case 'input': return config.value.trackInputs
      case 'hover': return config.value.trackHovers
      case 'navigation': return config.value.trackNavigation
      default: return true // 默认追踪未知类型的事件
    }
  }

  /**
   * 获取当前会话ID
   * 如果没有活跃会话，自动创建一个新会话
   * 
   * @returns 当前会话的ID
   */
  const getCurrentSessionId = (): string => {
    if (!currentSession.value) {
      startSession() // 自动开始新会话
    }
    return currentSession.value!.id
  }

  /**
   * 更新当前会话信息
   * 将新事件添加到会话中并更新相关统计
   * 
   * @param event - 要添加的用户事件
   */
  const updateCurrentSession = (event: UserEvent) => {
    if (currentSession.value) {
      // 将事件添加到会话的事件列表中
      currentSession.value.events.push(event)
      
      // 根据事件类型更新不同的计数器
      if (event.type === 'navigation') {
        currentSession.value.pageViews += 1    // 页面浏览次数
      } else {
        currentSession.value.interactions += 1 // 交互次数
      }
    }
  }

  /**
   * 更新热力图数据
   * 添加新的坐标点或增加现有点的热度值
   * 
   * @param coordinates - 坐标位置
   */
  const updateHeatmapData = (coordinates: { x: number; y: number }) => {
    // 查找距离当前坐标20像素内的现有数据点
    const existing = heatmapData.value.find(
      point => Math.abs(point.x - coordinates.x) < 20 && Math.abs(point.y - coordinates.y) < 20
    )
    
    if (existing) {
      // 如果找到邻近点，增加其热度值和计数
      existing.value += 1
      existing.count += 1
    } else {
      // 如果没有邻近点，创建新的热力图数据点
      heatmapData.value.push({
        x: coordinates.x,
        y: coordinates.y,
        value: 1,
        count: 1
      })
    }
  }

  /**
   * 按事件类型统计事件数量
   * 
   * @returns 事件类型到数量的映射
   */
  const getEventsByType = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    events.value.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })
    return counts
  }

  /**
   * 按页面统计事件数量
   * 
   * @returns 页面路径到事件数量的映射
   */
  const getEventsByPage = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    events.value.forEach(event => {
      counts[event.page] = (counts[event.page] || 0) + 1
    })
    return counts
  }

  /**
   * 获取当前会话持续时间
   * 
   * @returns 会话持续时间（毫秒）
   */
  const getCurrentSessionDuration = (): number => {
    if (!currentSession.value) return 0
    // 如果会话已结束使用结束时间，否则使用当前时间
    const now = currentSession.value.endTime || Date.now()
    return now - currentSession.value.startTime
  }

  /**
   * 获取唯一交互元素数量
   * 
   * @returns 用户交互过的不同元素的数量
   */
  const getUniqueElements = (): number => {
    const elements = new Set(events.value.map(event => event.element))
    return elements.size
  }

  // ======================== 演示功能 ========================
  
  /**
   * 模拟用户行为
   * 生成一些模拟的用户行为数据用于演示和测试
   */
  const simulateUserBehavior = () => {
    // 模拟点击事件
    trackClick('登录按钮', { x: 100, y: 200 }, '#login-btn')
    trackClick('菜单项', { x: 50, y: 100 }, '.menu-item')
    
    // 模拟滚动事件
    trackScroll(500)
    
    // 模拟输入事件
    trackInput('用户名输入框', 'test@example.com', '#username')
    
    console.log('🎭 已模拟用户行为数据')
  }

  // ======================== 返回对象 ========================
  
  return {
    // ========== 状态（只读） ==========
    events: readonly(events),              // 用户事件列表
    sessions: readonly(sessions),          // 用户会话列表
    currentSession: readonly(currentSession), // 当前活跃会话
    heatmapData: readonly(heatmapData),    // 热力图数据
    config: readonly(config),              // 行为追踪配置
    
    // ========== 计算属性 ==========
    behaviorStats,      // 行为统计数据
    popularElements,    // 热门交互元素
    pageViews,         // 页面浏览量统计
    
    // ========== 核心方法 ==========
    trackEvent,        // 追踪用户事件
    trackClick,        // 追踪点击事件
    trackScroll,       // 追踪滚动事件
    trackInput,        // 追踪输入事件
    trackNavigation,   // 追踪页面导航
    startSession,      // 开始新会话
    endSession,        // 结束当前会话
    updateConfig,      // 更新配置
    generateHeatmap,   // 生成热力图数据
    clearEvents,       // 清空事件数据
    clearSessions,     // 清空会话数据
    
    // ========== 演示功能 ==========
    simulateUserBehavior  // 模拟用户行为
  }
})