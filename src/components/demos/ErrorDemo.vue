<template>
  <div class="error-demo">
    <el-card>
      <template #header>
        <h3>错误追踪演示</h3>
      </template>
      
      <el-alert
        title="错误演示功能"
        description="通过下面的按钮可以模拟各种错误类型，观察系统的错误追踪效果"
        type="warning"
        show-icon
        :closable="false"
      />
      
      <div class="demo-buttons">
        <el-button type="danger" @click="triggerJSError">
          <el-icon><WarningFilled /></el-icon>
          JavaScript 错误
        </el-button>
        
        <el-button type="warning" @click="triggerNetworkError">
          <el-icon><Connection /></el-icon>
          网络错误
        </el-button>
        
        <el-button type="info" @click="triggerResourceError">
          <el-icon><Picture /></el-icon>
          资源加载错误
        </el-button>
        
        <el-button type="primary" @click="triggerPromiseError">
          <el-icon><Clock /></el-icon>
          Promise 错误
        </el-button>
      </div>
      
      <div class="error-stats">
        <el-statistic
          title="总错误数"
          :value="totalErrors"
          suffix="个"
        />
        <el-statistic
          title="严重错误"
          :value="criticalErrors"
          suffix="个"
          value-style="color: #cf1322"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WarningFilled, Connection, Picture, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useErrorStore } from '@/stores'

const errorStore = useErrorStore()

const totalErrors = computed(() => errorStore.errors.length)
const criticalErrors = computed(() => errorStore.criticalErrors.length)

const triggerJSError = () => {
  errorStore.simulateJSError()
  ElMessage.success('JavaScript 错误已模拟')
}

const triggerNetworkError = () => {
  errorStore.simulateNetworkError()
  ElMessage.success('网络错误已模拟')
}

const triggerResourceError = () => {
  errorStore.simulateResourceError()
  ElMessage.success('资源加载错误已模拟')
}

const triggerPromiseError = () => {
  // 模拟 Promise 拒绝
  const error = {
    id: `promise_${Date.now()}`,
    type: 'promise' as const,
    message: '模拟的Promise拒绝错误',
    timestamp: Date.now(),
    url: location.href,
    userAgent: navigator.userAgent,
    severity: 'high' as const
  }
  errorStore.addError(error)
  ElMessage.success('Promise 错误已模拟')
}
</script>

<style scoped>
.error-demo {
  padding: 16px;
}

.demo-buttons {
  margin: 20px 0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.error-stats {
  display: flex;
  gap: 40px;
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>