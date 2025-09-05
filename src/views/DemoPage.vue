<template>
  <div class="demo-page">
    <el-card>
      <template #header>
        <h3>演示页面</h3>
      </template>
      <el-alert
        title="这是一个用于测试各种功能的演示页面"
        type="info"
        show-icon
        :closable="false"
      />
      
      <div class="demo-actions">
        <el-button @click="triggerError">触发JS错误</el-button>
        <el-button @click="simulateSlowLoad">模拟慢加载</el-button>
        <el-button @click="trackBehavior">记录用户行为</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useErrorStore, useBehaviorStore } from '@/stores'
import { usePerformanceMonitoring } from '@/composables'

const errorStore = useErrorStore()
const behaviorStore = useBehaviorStore()
const { simulateSlowTask } = usePerformanceMonitoring()

const triggerError = () => {
  errorStore.simulateJSError()
}

const simulateSlowLoad = () => {
  simulateSlowTask(2000)
}

const trackBehavior = () => {
  behaviorStore.simulateUserBehavior()
}
</script>

<style scoped>
.demo-page {
  padding: 24px;
}

.demo-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}
</style>