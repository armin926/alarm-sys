<template>
  <div class="performance-demo">
    <el-card>
      <template #header>
        <h3>性能监控演示</h3>
      </template>
      
      <el-alert
        title="性能演示功能"
        description="通过下面的按钮可以模拟各种性能问题，观察系统的监控效果"
        type="info"
        show-icon
        :closable="false"
      />
      
      <div class="demo-buttons">
        <el-button type="primary" @click="simulateSlowScript">
          <el-icon><Loading /></el-icon>
          模拟慢脚本 (FID)
        </el-button>
        
        <el-button type="warning" @click="simulateNetworkDelay">
          <el-icon><Connection /></el-icon>
          模拟网络延迟 (TTFB)
        </el-button>
        
        <el-button type="danger" @click="simulateLayoutShift">
          <el-icon><Rank /></el-icon>
          模拟布局偏移 (CLS)
        </el-button>
      </div>
      
      <div v-if="demoResults.length > 0" class="demo-results">
        <h4>演示结果：</h4>
        <ul>
          <li v-for="result in demoResults" :key="result.id">
            {{ result.message }} - {{ result.timestamp }}
          </li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loading, Connection, Rank } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePerformanceMonitoring } from '@/composables'

const { simulateSlowTask, simulateNetworkDelay: simNetDelay, simulateLayoutShift: simLayoutShift } = usePerformanceMonitoring()

const demoResults = ref<Array<{ id: string; message: string; timestamp: string }>>([])

const addResult = (message: string) => {
  demoResults.value.unshift({
    id: Date.now().toString(),
    message,
    timestamp: new Date().toLocaleTimeString()
  })
}

const simulateSlowScript = async () => {
  ElMessage.info('开始模拟慢脚本执行...')
  await simulateSlowTask(1500)
  addResult('模拟慢脚本完成，FID 增加')
  ElMessage.success('慢脚本模拟完成')
}

const simulateNetworkDelay = () => {
  ElMessage.info('开始模拟网络延迟...')
  simNetDelay()
  addResult('模拟网络延迟完成，TTFB 增加')
  ElMessage.success('网络延迟模拟完成')
}

const simulateLayoutShift = () => {
  ElMessage.info('开始模拟布局偏移...')
  simLayoutShift()
  addResult('模拟布局偏移完成，CLS 增加')
  ElMessage.success('布局偏移模拟完成')
}
</script>

<style scoped>
.performance-demo {
  padding: 16px;
}

.demo-buttons {
  margin: 20px 0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-results {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.demo-results h4 {
  margin: 0 0 12px 0;
}

.demo-results ul {
  margin: 0;
  padding-left: 20px;
}

.demo-results li {
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 13px;
}
</style>