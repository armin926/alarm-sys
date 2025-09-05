<template>
  <div class="behavior-analytics">
    <!-- 概览统计 -->
    <el-row :gutter="24" class="overview-section">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>事件类型分布</span>
          </template>
          <div ref="eventTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>页面浏览统计</span>
          </template>
          <div ref="pageViewChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细分析 -->
    <el-row :gutter="24" class="detail-section">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户事件时间线</span>
              <el-radio-group v-model="timelineView" size="small">
                <el-radio-button label="hour">按小时</el-radio-button>
                <el-radio-button label="day">按天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="timelineChart" class="chart-container-large"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>热门交互元素</span>
          </template>
          <div class="popular-elements">
            <div 
              v-for="(element, index) in popularElements" 
              :key="element.element"
              class="element-item"
            >
              <div class="element-rank">{{ index + 1 }}</div>
              <div class="element-info">
                <div class="element-name">{{ element.element }}</div>
                <div class="element-count">{{ element.count }} 次点击</div>
              </div>
              <div class="element-progress">
                <el-progress 
                  :percentage="getElementPercentage(element.count)" 
                  :show-text="false"
                  :stroke-width="6"
                />
              </div>
            </div>
            
            <div v-if="popularElements.length === 0" class="empty-state">
              <el-empty description="暂无数据" :image-size="60" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会话分析 -->
    <el-row :gutter="24" class="session-section">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>会话统计</span>
          </template>
          <div class="session-stats">
            <div class="stat-item">
              <div class="stat-label">总会话数</div>
              <div class="stat-value">{{ sessions.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均时长</div>
              <div class="stat-value">{{ formatDuration(averageSessionDuration) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均交互</div>
              <div class="stat-value">{{ averageInteractions.toFixed(1) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">跳出率</div>
              <div class="stat-value bounce-rate">{{ bounceRate.toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最近会话列表</span>
          </template>
          <el-table 
            :data="recentSessions" 
            style="width: 100%" 
            size="small"
            max-height="300"
          >
            <el-table-column label="会话ID" width="120">
              <template #default="{ row }">
                <el-text type="primary" size="small">{{ row.id.slice(-8) }}</el-text>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" width="140">
              <template #default="{ row }">
                <el-text size="small">{{ formatTime(row.startTime) }}</el-text>
              </template>
            </el-table-column>
            <el-table-column label="时长" width="80">
              <template #default="{ row }">
                <el-text size="small">{{ formatDuration(getSessionDuration(row)) }}</el-text>
              </template>
            </el-table-column>
            <el-table-column label="页面数" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ row.pageViews }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="交互数" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ row.interactions }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="row.endTime ? 'info' : 'success'" 
                  size="small"
                >
                  {{ row.endTime ? '已结束' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 演示操作 -->
    <el-card class="demo-section">
      <template #header>
        <div class="card-header">
          <span>演示操作</span>
          <el-tag type="warning" size="small">教学功能</el-tag>
        </div>
      </template>
      <div class="demo-buttons">
        <el-button-group>
          <el-button @click="simulateUserBehavior">
            <el-icon><MagicStick /></el-icon>
            生成演示数据
          </el-button>
          <el-button @click="clearBehaviorData">
            <el-icon><Delete /></el-icon>
            清空数据
          </el-button>
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </el-button-group>
      </div>
      <el-alert
        title="功能说明"
        type="info"
        :closable="false"
        show-icon
      >
        <p>点击“生成演示数据”可以模拟用户行为，观察分析结果。数据包括点击、滚动、输入等事件。</p>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineProps } from 'vue'
import { MagicStick, Delete, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBehaviorStore } from '@/stores'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

// Props
interface Props {
  filters?: any
}

const props = defineProps<Props>()

const behaviorStore = useBehaviorStore()

// 响应式数据
const timelineView = ref('hour')
const eventTypeChart = ref<ECharts | null>(null)
const pageViewChart = ref<ECharts | null>(null)
const timelineChart = ref<ECharts | null>(null)

// 计算属性
const events = computed(() => behaviorStore.events)
const sessions = computed(() => behaviorStore.sessions)
const popularElements = computed(() => behaviorStore.popularElements)
const behaviorStats = computed(() => behaviorStore.behaviorStats)

const averageSessionDuration = computed(() => {
  if (sessions.value.length === 0) return 0
  const total = sessions.value.reduce((sum, session) => {
    const duration = (session.endTime || Date.now()) - session.startTime
    return sum + duration
  }, 0)
  return total / sessions.value.length
})

const averageInteractions = computed(() => {
  if (sessions.value.length === 0) return 0
  const total = sessions.value.reduce((sum, session) => sum + session.interactions, 0)
  return total / sessions.value.length
})

const bounceRate = computed(() => {
  if (sessions.value.length === 0) return 0
  const bounceSessions = sessions.value.filter(session => session.pageViews <= 1).length
  return (bounceSessions / sessions.value.length) * 100
})

const recentSessions = computed(() => {
  return sessions.value
    .slice()
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 10)
})

// 方法
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  return `${Math.round(ms / 3600000)}h`
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

const getSessionDuration = (session: any) => {
  return (session.endTime || Date.now()) - session.startTime
}

const getElementPercentage = (count: number) => {
  const maxCount = Math.max(...popularElements.value.map(el => el.count), 1)
  return Math.round((count / maxCount) * 100)
}

const simulateUserBehavior = () => {
  behaviorStore.simulateUserBehavior()
  ElMessage.success('演示数据已生成')
  // 更新图表
  setTimeout(() => {
    initCharts()
  }, 100)
}

const clearBehaviorData = () => {
  behaviorStore.clearEvents()
  behaviorStore.clearSessions()
  ElMessage.info('行为数据已清空')
  // 更新图表
  setTimeout(() => {
    initCharts()
  }, 100)
}

const exportData = () => {
  const data = {
    events: events.value,
    sessions: sessions.value,
    stats: behaviorStats.value,
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `behavior-data-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('行为数据已导出')
}

// 图表初始化
const initCharts = () => {
  initEventTypeChart()
  initPageViewChart()
  initTimelineChart()
}

const initEventTypeChart = () => {
  const chartDom = document.querySelector('.behavior-analytics [data-chart="eventType"]') as HTMLElement
  if (!chartDom) return
  
  if (eventTypeChart.value) {
    eventTypeChart.value.dispose()
  }
  
  eventTypeChart.value = echarts.init(chartDom)
  
  const data = Object.entries(behaviorStats.value.byType).map(([type, count]) => ({
    name: getEventTypeLabel(type),
    value: count
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '事件类型',
      type: 'pie',
      radius: '70%',
      center: ['50%', '50%'],
      data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  eventTypeChart.value.setOption(option)
}

const initPageViewChart = () => {
  const chartDom = document.querySelector('.behavior-analytics [data-chart="pageView"]') as HTMLElement
  if (!chartDom) return
  
  if (pageViewChart.value) {
    pageViewChart.value.dispose()
  }
  
  pageViewChart.value = echarts.init(chartDom)
  
  const pageViews = behaviorStore.pageViews
  const data = Object.entries(pageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(([page]) => page),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: data.map(([, count]) => count),
      type: 'bar',
      itemStyle: {
        color: '#1890ff'
      }
    }]
  }
  
  pageViewChart.value.setOption(option)
}

const initTimelineChart = () => {
  const chartDom = document.querySelector('.behavior-analytics [data-chart="timeline"]') as HTMLElement
  if (!chartDom) return
  
  if (timelineChart.value) {
    timelineChart.value.dispose()
  }
  
  timelineChart.value = echarts.init(chartDom)
  
  // 生成时间线数据
  const timeData = generateTimelineData()
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: timeData.map(item => item.time)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: timeData.map(item => item.count),
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#52c41a'
      },
      areaStyle: {
        opacity: 0.3
      }
    }]
  }
  
  timelineChart.value.setOption(option)
}

const generateTimelineData = () => {
  const now = Date.now()
  const data = []
  
  if (timelineView.value === 'hour') {
    for (let i = 23; i >= 0; i--) {
      const time = now - i * 60 * 60 * 1000
      const hour = new Date(time).getHours()
      const count = events.value.filter(event => {
        const eventHour = new Date(event.timestamp).getHours()
        return eventHour === hour
      }).length
      
      data.push({
        time: `${hour}:00`,
        count
      })
    }
  } else {
    for (let i = 6; i >= 0; i--) {
      const time = now - i * 24 * 60 * 60 * 1000
      const date = new Date(time).toLocaleDateString('zh-CN')
      const count = events.value.filter(event => {
        const eventDate = new Date(event.timestamp).toLocaleDateString('zh-CN')
        return eventDate === date
      }).length
      
      data.push({
        time: date,
        count
      })
    }
  }
  
  return data
}

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    click: '点击',
    scroll: '滚动',
    input: '输入',
    navigation: '导航',
    hover: '悬停',
    focus: '聚焦'
  }
  return labels[type] || type
}

// 生命周期
onMounted(() => {
  // 等待DOM渲染完成
  setTimeout(() => {
    // 添加数据属性用于图表初始化
    const charts = document.querySelectorAll('.chart-container, .chart-container-large')
    charts.forEach((chart, index) => {
      const types = ['eventType', 'pageView', 'timeline']
      chart.setAttribute('data-chart', types[index] || 'unknown')
    })
    
    initCharts()
  }, 100)
})

onUnmounted(() => {
  if (eventTypeChart.value) {
    eventTypeChart.value.dispose()
  }
  if (pageViewChart.value) {
    pageViewChart.value.dispose()
  }
  if (timelineChart.value) {
    timelineChart.value.dispose()
  }
})

// 监听时间线视图变化
watch(timelineView, () => {
  initTimelineChart()
})

// 监听数据变化
watch([events, sessions], () => {
  setTimeout(() => {
    initCharts()
  }, 100)
}, { deep: true })
</script>

<style scoped>
.behavior-analytics {
  padding: 0;
}

.overview-section,
.detail-section,
.session-section {
  margin-bottom: 24px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container-large {
  height: 400px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popular-elements {
  max-height: 300px;
  overflow-y: auto;
}

.element-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.element-item:last-child {
  border-bottom: none;
}

.element-rank {
  width: 24px;
  height: 24px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.element-info {
  flex: 1;
  margin-right: 12px;
}

.element-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.element-count {
  font-size: 12px;
  color: #8c8c8c;
}

.element-progress {
  width: 60px;
}

.session-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  font-size: 14px;
  color: #595959;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.stat-value.bounce-rate {
  color: #f56c6c;
}

.demo-section {
  margin-top: 24px;
}

.demo-buttons {
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #1890ff, #40a9ff);
}
</style>