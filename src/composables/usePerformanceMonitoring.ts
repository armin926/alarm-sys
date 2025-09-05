import { ref, onMounted, onUnmounted } from 'vue'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
import { usePerformanceStore } from '@/stores'
import type { PerformanceMetrics } from '@/types'

export function usePerformanceMonitoring() {
  const performanceStore = usePerformanceStore()
  const isSupported = ref(true)
  const observer = ref<PerformanceObserver | null>(null)
  
  const metricsCollected = ref({
    fcp: false,
    lcp: false,
    fid: false,
    cls: false,
    ttfb: false
  })

  const initWebVitals = () => {
    if (!('PerformanceObserver' in window)) {
      isSupported.value = false
      console.warn('⚠️ 浏览器不支持 PerformanceObserver')
      return
    }

    console.log('🚀 初始化 Web Vitals 监控...')
    
    // First Contentful Paint
    getFCP((metric) => {
      console.log('📊 FCP:', `${metric.value}ms`)
      recordMetric('fcp', metric.value)
      metricsCollected.value.fcp = true
    })

    // Largest Contentful Paint
    getLCP((metric) => {
      console.log('📊 LCP:', `${metric.value}ms`)
      recordMetric('lcp', metric.value)
      metricsCollected.value.lcp = true
    })

    // First Input Delay
    getFID((metric) => {
      console.log('📊 FID:', `${metric.value}ms`)
      recordMetric('fid', metric.value)
      metricsCollected.value.fid = true
    })

    // Cumulative Layout Shift
    getCLS((metric) => {
      console.log('📊 CLS:', metric.value.toFixed(4))
      recordMetric('cls', metric.value)
      metricsCollected.value.cls = true
    })

    // Time to First Byte
    getTTFB((metric) => {
      console.log('📊 TTFB:', `${metric.value}ms`)
      recordMetric('ttfb', metric.value)
      metricsCollected.value.ttfb = true
    })
  }

  const recordMetric = (name: keyof PerformanceMetrics, value: number) => {
    const currentMetrics = performanceStore.currentMetrics || {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      timestamp: Date.now(),
      page: location.pathname
    }

    const updatedMetrics: PerformanceMetrics = {
      ...currentMetrics,
      [name]: value,
      timestamp: Date.now(),
      page: location.pathname
    }

    performanceStore.addMetrics(updatedMetrics)
  }

  const measureCustomMetric = (name: string, startTime: number, endTime?: number) => {
    const duration = (endTime || performance.now()) - startTime
    console.log(`📊 自定义指标 ${name}:`, `${duration.toFixed(2)}ms`)
    return duration
  }

  const measureResourceTiming = () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const resourceMetrics = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType
    }))
    
    console.log('📦 资源加载时间:', resourceMetrics)
    return resourceMetrics
  }

  const measureNavigationTiming = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (!navigation) return null
    
    const timing = {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      domComplete: navigation.domComplete - navigation.domContentLoadedEventStart
    }
    
    console.log('🧭 导航时间分解:', timing)
    return timing
  }

  const startPerformanceMonitoring = () => {
    performanceStore.startMonitoring()
    initWebVitals()
    
    // 启动自定义性能观测器
    if (window.PerformanceObserver) {
      observer.value = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`📏 性能测量 ${entry.name}:`, `${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      try {
        observer.value.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
      } catch (error) {
        console.warn('⚠️ PerformanceObserver 启动失败:', error)
      }
    }
  }

  const stopPerformanceMonitoring = () => {
    performanceStore.stopMonitoring()
    
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  // 模拟性能问题（用于演示）
  const simulateSlowTask = async (duration: number = 1000) => {
    console.log(`🐌 模拟慢任务 ${duration}ms`)
    const start = performance.now()
    
    // 模拟CPU密集任务
    const end = start + duration
    while (performance.now() < end) {
      // 空循环消耗CPU
    }
    
    const actualDuration = performance.now() - start
    console.log(`✅ 慢任务完成，实际耗时: ${actualDuration.toFixed(2)}ms`)
    
    // 记录为FID指标（模拟）
    recordMetric('fid', actualDuration)
  }

  const simulateNetworkDelay = () => {
    console.log('🌐 模拟网络延迟')
    const start = performance.now()
    
    // 创建一个带延迟的图片加载
    const img = new Image()
    img.onload = () => {
      const loadTime = performance.now() - start
      console.log(`🖼️ 图片加载完成，耗时: ${loadTime.toFixed(2)}ms`)
      recordMetric('ttfb', loadTime)
    }
    img.src = `data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=?t=${Date.now()}`
  }

  const simulateLayoutShift = () => {
    console.log('📐 模拟布局偏移')
    
    // 创建一个临时元素来触发布局偏移
    const element = document.createElement('div')
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 200px;
      height: 100px;
      background: red;
      z-index: 9999;
    `
    document.body.appendChild(element)
    
    // 延迟移动元素
    setTimeout(() => {
      element.style.top = '100px'
      setTimeout(() => {
        document.body.removeChild(element)
      }, 100)
    }, 100)
    
    // 模拟CLS值
    recordMetric('cls', 0.25)
  }

  onMounted(() => {
    if (performanceStore.config.autoStart) {
      startPerformanceMonitoring()
    }
  })

  onUnmounted(() => {
    stopPerformanceMonitoring()
  })

  return {
    isSupported,
    metricsCollected,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    measureCustomMetric,
    measureResourceTiming,
    measureNavigationTiming,
    simulateSlowTask,
    simulateNetworkDelay,
    simulateLayoutShift
  }
}