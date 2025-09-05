import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useBehaviorStore } from '@/stores'
import type { UserEvent } from '@/types'

export function useBehaviorTracking() {
  const behaviorStore = useBehaviorStore()
  const isActive = ref(false)
  const eventListeners = ref<Array<() => void>>([])
  const scrollTimer = ref<number | null>(null)
  const mouseMoveTimer = ref<number | null>(null)

  const startBehaviorTracking = () => {
    if (isActive.value) return
    
    console.log('👤 启动用户行为追踪')
    isActive.value = true
    
    // 开始会话
    behaviorStore.startSession()
    
    // 设置各种事件监听器
    setupClickTracking()
    setupScrollTracking()
    setupInputTracking()
    setupNavigationTracking()
    
    if (behaviorStore.config.trackHovers) {
      setupHoverTracking()
    }
  }

  const stopBehaviorTracking = () => {
    if (!isActive.value) return
    
    console.log('🛑 停止用户行为追踪')
    isActive.value = false
    
    // 结束会话
    behaviorStore.endSession()
    
    // 清理所有事件监听器
    eventListeners.value.forEach(cleanup => cleanup())
    eventListeners.value = []
    
    // 清理定时器
    if (scrollTimer.value) {
      clearTimeout(scrollTimer.value)
      scrollTimer.value = null
    }
    if (mouseMoveTimer.value) {
      clearTimeout(mouseMoveTimer.value)
      mouseMoveTimer.value = null
    }
  }

  const setupClickTracking = () => {
    if (!behaviorStore.config.trackClicks) return
    
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target) return
      
      const elementInfo = getElementInfo(target)
      const coordinates = { x: event.clientX, y: event.clientY }
      
      behaviorStore.trackClick(
        elementInfo.text || elementInfo.tagName,
        coordinates,
        elementInfo.selector
      )
    }
    
    document.addEventListener('click', clickHandler)
    eventListeners.value.push(() => document.removeEventListener('click', clickHandler))
  }

  const setupScrollTracking = () => {
    if (!behaviorStore.config.trackScrolls) return
    
    let lastScrollY = window.scrollY
    let scrollDirection = ''
    
    const scrollHandler = () => {
      const currentScrollY = window.scrollY
      scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up'
      lastScrollY = currentScrollY
      
      // 防抖处理，避免频繁记录
      if (scrollTimer.value) {
        clearTimeout(scrollTimer.value)
      }
      
      scrollTimer.value = window.setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        )
        
        behaviorStore.trackEvent({
          type: 'scroll',
          element: 'window',
          value: JSON.stringify({
            scrollY: currentScrollY,
            direction: scrollDirection,
            percent: scrollPercent
          }),
          page: location.pathname
        })
      }, 200)
    }
    
    window.addEventListener('scroll', scrollHandler)
    eventListeners.value.push(() => window.removeEventListener('scroll', scrollHandler))
  }

  const setupInputTracking = () => {
    if (!behaviorStore.config.trackInputs) return
    
    const inputHandler = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      
      const elementInfo = getElementInfo(target)
      
      // 对敏感信息脱敏
      const value = sanitizeInputValue(target)
      
      behaviorStore.trackInput(
        elementInfo.text || elementInfo.tagName,
        value,
        elementInfo.selector
      )
    }
    
    // 使用input事件而不是keydown，减少频率
    const debouncedInputHandler = debounce(inputHandler, 500)
    
    document.addEventListener('input', debouncedInputHandler)
    eventListeners.value.push(() => document.removeEventListener('input', debouncedInputHandler))
  }

  const setupNavigationTracking = () => {
    if (!behaviorStore.config.trackNavigation) return
    
    let previousPath = location.pathname
    
    // 监听路由变化（适用于SPA）
    const navigationHandler = () => {
      const currentPath = location.pathname
      if (currentPath !== previousPath) {
        behaviorStore.trackNavigation(previousPath, currentPath)
        previousPath = currentPath
      }
    }
    
    // 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', navigationHandler)
    eventListeners.value.push(() => window.removeEventListener('popstate', navigationHandler))
    
    // 监听 pushState 和 replaceState（需要重写原生方法）
    interceptHistoryAPI(navigationHandler)
  }

  const setupHoverTracking = () => {
    const hoverHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target) return
      
      // 防抖处理，避免频繁记录
      if (mouseMoveTimer.value) {
        clearTimeout(mouseMoveTimer.value)
      }
      
      mouseMoveTimer.value = window.setTimeout(() => {
        const elementInfo = getElementInfo(target)
        const coordinates = { x: event.clientX, y: event.clientY }
        
        behaviorStore.trackEvent({
          type: 'hover',
          element: elementInfo.text || elementInfo.tagName,
          selector: elementInfo.selector,
          coordinates,
          page: location.pathname
        })
      }, 1000) // 悬停1秒后记录
    }
    
    document.addEventListener('mouseover', hoverHandler)
    eventListeners.value.push(() => document.removeEventListener('mouseover', hoverHandler))
  }

  const getElementInfo = (element: HTMLElement) => {
    const tagName = element.tagName.toLowerCase()
    const id = element.id
    const className = element.className
    const text = element.textContent?.trim().substring(0, 50) || ''
    
    // 生成CSS选择器
    let selector = tagName
    if (id) selector += `#${id}`
    if (className) selector += `.${className.split(' ').join('.')}`
    
    return {
      tagName,
      id,
      className,
      text,
      selector
    }
  }

  const sanitizeInputValue = (input: HTMLInputElement | HTMLTextAreaElement): string => {
    const type = input.type?.toLowerCase()
    
    // 敏感字段不记录具体内容
    const sensitiveTypes = ['password', 'email', 'tel', 'credit-card']
    const sensitiveNames = ['password', 'pwd', 'email', 'phone', 'tel', 'card', 'ssn', 'id']
    
    if (sensitiveTypes.includes(type) || sensitiveNames.some(sensitiveName => input.name?.toLowerCase().includes(sensitiveName))) {
      return `[${type || 'text'}:${input.value.length}字符]`
    }
    
    // 普通输入只记录前50个字符
    return input.value.substring(0, 50)
  }

  const interceptHistoryAPI = (callback: () => void) => {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args)
      nextTick(() => callback())
      return result
    }
    
    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args)
      nextTick(() => callback())
      return result
    }
    
    // 清理函数
    eventListeners.value.push(() => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    })
  }

  // 防抖函数
  const debounce = (func: Function, delay: number) => {
    let timeoutId: number
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => func.apply(null, args), delay)
    }
  }

  // 页面可见性变化追踪
  const setupVisibilityTracking = () => {
    const visibilityHandler = () => {
      const isVisible = !document.hidden
      
      behaviorStore.trackEvent({
        type: 'focus',
        element: 'page',
        value: isVisible ? 'visible' : 'hidden',
        page: location.pathname
      })
    }
    
    document.addEventListener('visibilitychange', visibilityHandler)
    eventListeners.value.push(() => document.removeEventListener('visibilitychange', visibilityHandler))
  }

  // 页面停留时间追踪
  const trackPageDuration = () => {
    const startTime = Date.now()
    
    const beforeUnloadHandler = () => {
      const duration = Date.now() - startTime
      
      behaviorStore.trackEvent({
        type: 'navigation',
        element: 'page',
        value: `duration:${duration}ms`,
        page: location.pathname
      })
    }
    
    window.addEventListener('beforeunload', beforeUnloadHandler)
    eventListeners.value.push(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
  }

  // 手动记录用户事件
  const trackCustomEvent = (type: string, element: string, value?: string, coordinates?: { x: number; y: number }) => {
    behaviorStore.trackEvent({
      type: type as UserEvent['type'],
      element,
      value,
      coordinates,
      page: location.pathname
    })
  }

  onMounted(() => {
    if (behaviorStore.config.trackClicks || 
        behaviorStore.config.trackScrolls || 
        behaviorStore.config.trackInputs || 
        behaviorStore.config.trackNavigation) {
      startBehaviorTracking()
      setupVisibilityTracking()
      trackPageDuration()
    }
  })

  onUnmounted(() => {
    stopBehaviorTracking()
  })

  return {
    isActive,
    startBehaviorTracking,
    stopBehaviorTracking,
    trackCustomEvent
  }
}