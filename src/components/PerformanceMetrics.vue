<template>
  <div class="performance-metrics">
    <!-- 实时性能指标 -->
    <div class="metrics-section">
      <h3 class="section-title">
        <el-icon><TrendCharts /></el-icon>
        实时性能指标
      </h3>
      
      <el-row :gutter="16" class="metrics-grid">
        <el-col :span="8" v-for="metric in webVitalsMetrics" :key="metric.key">
          <div class="metric-item">
            <div class="metric-header">
              <div class="metric-icon" :style="{ backgroundColor: metric.color + '20', color: metric.color }">
                <el-icon><component :is="metric.icon" /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-name">{{ metric.name }}</div>
                <div class="metric-description">{{ metric.description }}</div>
              </div>
            </div>
            <div class="metric-value">
              <span class="value" :class="getValueClass(metric.key, metric.value)">
                {{ formatMetricValue(metric.key, metric.value) }}
              </span>
              <span class="unit">{{ metric.unit }}</span>
            </div>
            <div class="metric-threshold">
              <span class="threshold-label">建议阈值:</span>
              <span class="threshold-value">{{ formatThreshold(metric.key) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 资源加载性能 -->
    <div class="metrics-section">
      <h3 class="section-title">
        <el-icon><Document /></el-icon>
        资源加载性能
      </h3>
      
      <el-table :data="resourceMetrics" class="resource-table">
        <el-table-column prop="name" label="资源名称" width="300">
          <template #default="{ row }">
            <div class="resource-name">
              <el-icon class="resource-icon">
                <component :is="getResourceIcon(row.type)" />
              </el-icon>
              {{ getResourceName(row.name) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="加载时间" width="120">
          <template #default="{ row }">
            <span :class="getLoadTimeClass(row.duration)">
              {{ row.duration.toFixed(0) }}ms
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.duration)" size="small">
              {{ getStatusText(row.duration) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 导航时间分解 -->
    <div class="metrics-section">
      <h3 class="section-title">
        <el-icon><Clock /></el-icon>
        导航时间分解
      </h3>
      
      <div class="navigation-timeline">
        <div v-for="phase in navigationPhases" :key="phase.name" class="timeline-item">
          <div class="timeline-label">{{ phase.name }}</div>
          <div class="timeline-bar">
            <div 
              class="timeline-progress" 
              :style="{ 
                width: getTimelineWidth(phase.duration),
                backgroundColor: phase.color 
              }"
            ></div>
            <span class="timeline-value">{{ phase.duration.toFixed(0) }}ms</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能优化建议 -->
    <div class="metrics-section">
      <h3 class="section-title">
        <el-icon><InfoFilled /></el-icon>
        性能优化建议
      </h3>
      
      <div class="suggestions-list">
        <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
          <div class="suggestion-header">
            <el-icon :color="getSuggestionColor(suggestion.priority)">
              <component :is="getSuggestionIcon(suggestion.priority)" />
            </el-icon>
            <span class="suggestion-title">{{ suggestion.title }}</span>
            <el-tag :type="getSuggestionTagType(suggestion.priority)" size="small">
              {{ suggestion.priority }}
            </el-tag>
          </div>
          <div class="suggestion-description">{{ suggestion.description }}</div>
          <div v-if="suggestion.actions.length > 0" class="suggestion-actions">
            <el-button 
              v-for="action in suggestion.actions" 
              :key="action"
              size="small" 
              type="primary" 
              link
            >
              {{ action }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { 
  TrendCharts, 
  Document, 
  Clock, 
  InfoFilled, 
  Timer,
  DataLine,
  Picture,
  DocumentCopy,
  VideoPlay,
  WarningFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { usePerformanceStore } from '@/stores'
import { usePerformanceMonitoring } from '@/composables'

const performanceStore = usePerformanceStore()
const { measureResourceTiming, measureNavigationTiming } = usePerformanceMonitoring()

const resourceMetrics = ref<any[]>([])
const navigationTiming = ref<any>(null)

const webVitalsMetrics = computed(() => {
  const current = performanceStore.currentMetrics
  return [
    {
      key: 'fcp',
      name: 'FCP',
      description: 'First Contentful Paint',
      value: current?.fcp || 0,
      unit: 'ms',
      icon: 'Timer',
      color: '#1890ff'
    },
    {
      key: 'lcp',
      name: 'LCP',
      description: 'Largest Contentful Paint',
      value: current?.lcp || 0,
      unit: 'ms',
      icon: 'DataLine',
      color: '#52c41a'
    },
    {
      key: 'fid',
      name: 'FID',
      description: 'First Input Delay',
      value: current?.fid || 0,
      unit: 'ms',
      icon: 'Timer',
      color: '#faad14'
    },
    {
      key: 'cls',
      name: 'CLS',
      description: 'Cumulative Layout Shift',
      value: current?.cls || 0,
      unit: '',
      icon: 'DataLine',
      color: '#f5222d'
    },
    {
      key: 'ttfb',
      name: 'TTFB',
      description: 'Time to First Byte',
      value: current?.ttfb || 0,
      unit: 'ms',
      icon: 'Timer',
      color: '#722ed1'
    }
  ]
})

const navigationPhases = computed(() => {
  if (!navigationTiming.value) return []
  
  return [
    { name: 'DNS查询', duration: navigationTiming.value.dnsLookup, color: '#1890ff' },
    { name: 'TCP连接', duration: navigationTiming.value.tcpConnect, color: '#52c41a' },
    { name: '请求响应', duration: navigationTiming.value.request, color: '#faad14' },
    { name: '响应下载', duration: navigationTiming.value.response, color: '#f5222d' },
    { name: 'DOM处理', duration: navigationTiming.value.domProcessing, color: '#722ed1' }
  ]
})

const suggestions = computed(() => {
  const current = performanceStore.currentMetrics
  const suggestions = []
  
  if (current?.fcp && current.fcp > 2000) {
    suggestions.push({
      id: 'fcp-slow',
      title: 'FCP过慢优化',
      description: '首次内容绘制时间超过2秒，建议优化关键资源加载',
      priority: '高',
      actions: ['压缩CSS/JS', '使用CDN', '启用Gzip']
    })
  }
  
  if (current?.lcp && current.lcp > 2500) {
    suggestions.push({
      id: 'lcp-slow',
      title: 'LCP过慢优化',
      description: '最大内容绘制时间超过2.5秒，建议优化图片和关键资源',
      priority: '高',
      actions: ['图片优化', '预加载关键资源', '服务端渲染']
    })
  }
  
  if (current?.cls && current.cls > 0.1) {
    suggestions.push({
      id: 'cls-high',
      title: 'CLS过高优化',
      description: '累积布局偏移过高，影响用户体验',
      priority: '中',
      actions: ['为图片设置尺寸', '避免动态插入内容', '使用CSS转换']
    })
  }
  
  return suggestions
})

const formatMetricValue = (key: string, value: number) => {
  if (key === 'cls') {
    return value.toFixed(3)
  }
  return Math.round(value).toString()
}

const formatThreshold = (key: string) => {
  const thresholds = performanceStore.config.thresholds
  const threshold = thresholds[key as keyof typeof thresholds]
  return key === 'cls' ? threshold.toFixed(3) : `${threshold}ms`
}

const getValueClass = (key: string, value: number) => {
  const thresholds = performanceStore.config.thresholds
  const threshold = thresholds[key as keyof typeof thresholds]
  
  if (value <= threshold) return 'value-good'
  if (value <= threshold * 1.5) return 'value-warning'
  return 'value-error'
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'img': return 'Picture'
    case 'script': return 'DocumentCopy'
    case 'stylesheet': return 'Document'
    case 'video': return 'VideoPlay'
    default: return 'Document'
  }
}

const getResourceName = (name: string) => {
  return name.split('/').pop() || name
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

const getLoadTimeClass = (duration: number) => {
  if (duration < 100) return 'load-time-good'
  if (duration < 300) return 'load-time-warning'
  return 'load-time-error'
}

const getStatusTagType = (duration: number) => {
  if (duration < 100) return 'success'
  if (duration < 300) return 'warning'
  return 'danger'
}

const getStatusText = (duration: number) => {
  if (duration < 100) return '快速'
  if (duration < 300) return '一般'
  return '较慢'
}

const getTimelineWidth = (duration: number) => {
  const maxDuration = Math.max(...navigationPhases.value.map(p => p.duration))
  return `${(duration / maxDuration) * 100}%`
}

const getSuggestionColor = (priority: string) => {
  switch (priority) {
    case '高': return '#f5222d'
    case '中': return '#faad14'
    case '低': return '#52c41a'
    default: return '#1890ff'
  }
}

const getSuggestionIcon = (priority: string) => {
  switch (priority) {
    case '高': return 'WarningFilled'
    case '中': return 'InfoFilled'
    case '低': return 'CircleCheckFilled'
    default: return 'InfoFilled'
  }
}

const getSuggestionTagType = (priority: string) => {
  switch (priority) {
    case '高': return 'danger'
    case '中': return 'warning'
    case '低': return 'success'
    default: return 'info'
  }
}

onMounted(() => {
  // 获取资源性能数据
  const resources = measureResourceTiming()
  if (resources) {
    resourceMetrics.value = resources.slice(0, 10) // 显示前10个资源
  }
  
  // 获取导航时间数据
  const timing = measureNavigationTiming()
  if (timing) {
    navigationTiming.value = timing
  }
})
</script>

<style scoped>
.performance-metrics {
  padding: 0;
}

.metrics-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.metrics-grid {
  margin-bottom: 0;
}

.metric-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-name {
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
}

.metric-description {
  font-size: 12px;
  color: #8c8c8c;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 8px 0;
}

.value {
  font-size: 24px;
  font-weight: 600;
}

.value-good { color: #52c41a; }
.value-warning { color: #faad14; }
.value-error { color: #f5222d; }

.unit {
  font-size: 14px;
  color: #8c8c8c;
}

.metric-threshold {
  font-size: 12px;
  color: #8c8c8c;
}

.threshold-label {
  margin-right: 4px;
}

.threshold-value {
  font-weight: 500;
  color: #595959;
}

.resource-table {
  width: 100%;
}

.resource-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-icon {
  color: #1890ff;
}

.load-time-good { color: #52c41a; }
.load-time-warning { color: #faad14; }
.load-time-error { color: #f5222d; }

.navigation-timeline {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.timeline-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-label {
  width: 100px;
  font-size: 14px;
  color: #595959;
  flex-shrink: 0;
}

.timeline-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  position: relative;
  margin: 0 16px;
}

.timeline-progress {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.timeline-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.suggestion-title {
  font-weight: 500;
  color: #262626;
  flex: 1;
}

.suggestion-description {
  color: #595959;
  line-height: 1.5;
  margin-bottom: 12px;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>