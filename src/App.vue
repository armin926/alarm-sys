<template>
  <div id="app">
    <router-view />
    
    <!-- 全局通知组件 -->
    <NotificationPanel />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAlertStore } from '@/stores'
import { usePerformanceMonitoring, useErrorTracking, useBehaviorTracking } from '@/composables'
import NotificationPanel from '@/components/NotificationPanel.vue'

const alertStore = useAlertStore()

// 初始化监控系统
const { startPerformanceMonitoring } = usePerformanceMonitoring()
const { startErrorTracking } = useErrorTracking()
const { startBehaviorTracking } = useBehaviorTracking()

onMounted(async () => {
  console.log('🎯 初始化前端告警系统...')
  
  // 初始化默认告警规则
  alertStore.initializeDefaultRules()
  
  // 请求通知权限
  await alertStore.requestNotificationPermission()
  
  // 启动监控
  startPerformanceMonitoring()
  startErrorTracking()
  startBehaviorTracking()
  
  console.log('✅ 前端告警系统初始化完成')
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

* {
  box-sizing: border-box;
}
</style>