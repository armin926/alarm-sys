import { ref, onMounted, onUnmounted } from 'vue'
import { useErrorStore } from '@/stores'
import type { ErrorEvent } from '@/types'

// 扩展XMLHttpRequest类型
declare global {
  interface XMLHttpRequest {
    _method?: string
    _url?: string
    _startTime?: number
  }
}

export function useErrorTracking() {
  const errorStore = useErrorStore()
  const isActive = ref(false)
  const errorHandlers = ref<Array<() => void>>([])

  const startErrorTracking = () => {
    if (isActive.value) return
    
    console.log('🔍 启动错误追踪系统')
    isActive.value = true
    
    // JavaScript 错误监听
    if (errorStore.config.enableJSError) {
      const jsErrorHandler = (event: globalThis.ErrorEvent) => {
        handleJavaScriptError(event)
      }
      window.addEventListener('error', jsErrorHandler)
      errorHandlers.value.push(() => window.removeEventListener('error', jsErrorHandler))
    }

    // Promise 拒绝监听
    if (errorStore.config.enablePromiseError) {
      const promiseErrorHandler = (event: PromiseRejectionEvent) => {
        handlePromiseRejection(event)
      }
      window.addEventListener('unhandledrejection', promiseErrorHandler)
      errorHandlers.value.push(() => window.removeEventListener('unhandledrejection', promiseErrorHandler))
    }

    // 资源加载错误监听
    if (errorStore.config.enableResourceError) {
      const resourceErrorHandler = (event: Event) => {
        handleResourceError(event)
      }
      window.addEventListener('error', resourceErrorHandler, true)
      errorHandlers.value.push(() => window.removeEventListener('error', resourceErrorHandler, true))
    }

    // 网络请求错误监听
    if (errorStore.config.enableNetworkError) {
      interceptFetch()
      interceptXHR()
    }
  }

  const stopErrorTracking = () => {
    if (!isActive.value) return
    
    console.log('🛑 停止错误追踪系统')
    isActive.value = false
    
    // 清理所有事件监听器
    errorHandlers.value.forEach(cleanup => cleanup())
    errorHandlers.value = []
  }

  const handleJavaScriptError = (event: globalThis.ErrorEvent) => {
    const error: ErrorEvent = {
      id: `js_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'javascript',
      message: event.message || '未知JavaScript错误',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: determineSeverity(event.message)
    }
    
    errorStore.addError(error)
  }

  const handlePromiseRejection = (event: PromiseRejectionEvent) => {
    const error: ErrorEvent = {
      id: `promise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'promise',
      message: `未处理的Promise拒绝: ${event.reason}`,
      stack: event.reason?.stack || '',
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'high'
    }
    
    errorStore.addError(error)
  }

  const handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement & { src?: string; href?: string }
    if (!target || target === (window as any)) return
    
    const error: ErrorEvent = {
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'resource',
      message: `资源加载失败: ${getResourceName(target)}`,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'medium'
    }
    
    errorStore.addError(error)
  }

  const interceptFetch = () => {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const start = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start
        
        // 记录慢请求
        if (duration > 5000) {
          const error: ErrorEvent = {
            id: `fetch_slow_${Date.now()}`,
            type: 'network',
            message: `慢网络请求: ${args[0]} (${duration.toFixed(0)}ms)`,
            timestamp: Date.now(),
            url: location.href,
            userAgent: navigator.userAgent,
            severity: 'low'
          }
          errorStore.addError(error)
        }
        
        // 检查HTTP错误状态
        if (!response.ok) {
          const error: ErrorEvent = {
            id: `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'network',
            message: `网络请求失败: ${response.status} ${response.statusText} - ${args[0]}`,
            timestamp: Date.now(),
            url: location.href,
            userAgent: navigator.userAgent,
            severity: response.status >= 500 ? 'high' : 'medium'
          }
          errorStore.addError(error)
        }
        
        return response
      } catch (error) {
        const networkError: ErrorEvent = {
          id: `fetch_error_${Date.now()}`,
          type: 'network',
          message: `网络请求异常: ${error} - ${args[0]}`,
          timestamp: Date.now(),
          url: location.href,
          userAgent: navigator.userAgent,
          severity: 'high'
        }
        errorStore.addError(networkError)
        throw error
      }
    }
  }

  const interceptXHR = () => {
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send
    
    XMLHttpRequest.prototype.open = function(method: string, url: string, async: boolean = true, ...args: any[]) {
      this._method = method
      this._url = url
      this._startTime = performance.now()
      return originalOpen.apply(this, [method, url, async, ...args])
    }
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('loadend', () => {
        const duration = performance.now() - (this._startTime || 0)
        
        if (this.status === 0 || this.status >= 400) {
          const error: ErrorEvent = {
            id: `xhr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'network',
            message: `XHR请求失败: ${this.status} ${this.statusText} - ${this._method} ${this._url}`,
            timestamp: Date.now(),
            url: location.href,
            userAgent: navigator.userAgent,
            severity: this.status >= 500 ? 'high' : 'medium'
          }
          errorStore.addError(error)
        } else if (duration > 5000) {
          const error: ErrorEvent = {
            id: `xhr_slow_${Date.now()}`,
            type: 'network',
            message: `慢XHR请求: ${this._method} ${this._url} (${duration.toFixed(0)}ms)`,
            timestamp: Date.now(),
            url: location.href,
            userAgent: navigator.userAgent,
            severity: 'low'
          }
          errorStore.addError(error)
        }
      })
      
      return originalSend.call(this, body)
    }
  }

  const determineSeverity = (message: string): ErrorEvent['severity'] => {
    const criticalKeywords = ['cannot read', 'undefined is not', 'null is not', 'reference error']
    const highKeywords = ['syntax error', 'type error', 'range error']
    
    const lowerMessage = message.toLowerCase()
    
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical'
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high'
    }
    return 'medium'
  }

  const getResourceName = (element: HTMLElement): string => {
    if (element instanceof HTMLImageElement) return element.src
    if (element instanceof HTMLScriptElement) return element.src
    if (element instanceof HTMLLinkElement) return element.href
    return element.tagName.toLowerCase()
  }

  // 手动报告错误
  const reportError = (message: string, stack?: string, severity: ErrorEvent['severity'] = 'medium') => {
    const error: ErrorEvent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'javascript',
      message,
      stack,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity
    }
    
    errorStore.addError(error)
  }

  // 错误边界处理（Vue错误）
  const handleVueError = (error: Error) => {
    const errorEvent: ErrorEvent = {
      id: `vue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'javascript',
      message: `Vue错误: ${error.message}`,
      stack: error.stack,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      severity: 'high'
    }
    
    errorStore.addError(errorEvent)
  }

  onMounted(() => {
    startErrorTracking()
  })

  onUnmounted(() => {
    stopErrorTracking()
  })

  return {
    isActive,
    startErrorTracking,
    stopErrorTracking,
    reportError,
    handleVueError
  }
}