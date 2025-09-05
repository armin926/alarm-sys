<template>
  <div class="performance-charts">
    <!-- 图表控制栏 -->
    <div class="chart-controls">
      <div class="control-group">
        <label class="control-label">时间范围:</label>
        <el-select v-model="timeRange" @change="updateCharts">
          <el-option label="最近1小时" value="1h" />
          <el-option label="最近6小时" value="6h" />
          <el-option label="最近24小时" value="24h" />
          <el-option label="最近7天" value="7d" />
        </el-select>
      </div>
      
      <div class="control-group">
        <label class="control-label">刷新间隔:</label>
        <el-select v-model="refreshInterval" @change="setRefreshInterval">
          <el-option label="手动" :value="0" />
          <el-option label="5秒" :value="5000" />
          <el-option label="10秒" :value="10000" />
          <el-option label="30秒" :value="30000" />
        </el-select>
      </div>
      
      <div class="control-actions">
        <el-button @click="refreshCharts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 性能趋势图表 -->
    <el-row :gutter="24" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><TrendCharts /></el-icon>
                Core Web Vitals 趋势
              </span>
              <el-switch
                v-model="showAllMetrics"
                active-text="显示全部"
                inactive-text="仅显示异常"
              />
            </div>
          </template>
          <div ref="webVitalsChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><DataLine /></el-icon>
                性能得分变化
              </span>
              <el-tag :type="getScoreTagType(latestScore)" size="small">
                当前得分: {{ latestScore }}
              </el-tag>
            </div>
          </template>
          <div ref="scoreChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源加载分析 -->
    <el-row :gutter="24" class="charts-row">
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><PieChart /></el-icon>
                资源类型分布
              </span>
            </div>
          </template>
          <div ref="resourceTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><DataBoard /></el-icon>
                资源加载时间
              </span>
            </div>
          </template>
          <div ref="resourceTimeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><Monitor /></el-icon>
                页面加载瀑布图
              </span>
            </div>
          </template>
          <div ref="waterfallChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能对比分析 -->
    <el-row :gutter="24" class="charts-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="chart-title">
                <el-icon><Histogram /></el-icon>
                性能指标对比分析
              </span>
              <div class="comparison-controls">
                <el-checkbox-group v-model="selectedMetrics" @change="updateComparisonChart">
                  <el-checkbox label="fcp">FCP</el-checkbox>
                  <el-checkbox label="lcp">LCP</el-checkbox>
                  <el-checkbox label="fid">FID</el-checkbox>
                  <el-checkbox label="ttfb">TTFB</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </template>
          <div ref="comparisonChart" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { 
  TrendCharts, 
  DataLine, 
  PieChart, 
  DataBoard, 
  Monitor, 
  Histogram,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePerformanceStore } from '@/stores'
import { usePerformanceMonitoring } from '@/composables'

const performanceStore = usePerformanceStore()
const { measureResourceTiming } = usePerformanceMonitoring()

// 图表容器引用
const webVitalsChart = ref<HTMLDivElement>()
const scoreChart = ref<HTMLDivElement>()
const resourceTypeChart = ref<HTMLDivElement>()
const resourceTimeChart = ref<HTMLDivElement>()
const waterfallChart = ref<HTMLDivElement>()
const comparisonChart = ref<HTMLDivElement>()

// 图表实例
let webVitalsChartInstance: echarts.ECharts | null = null
let scoreChartInstance: echarts.ECharts | null = null
let resourceTypeChartInstance: echarts.ECharts | null = null
let resourceTimeChartInstance: echarts.ECharts | null = null
let waterfallChartInstance: echarts.ECharts | null = null
let comparisonChartInstance: echarts.ECharts | null = null

// 控制状态
const timeRange = ref('1h')
const refreshInterval = ref(0)
const showAllMetrics = ref(true)
const selectedMetrics = ref(['fcp', 'lcp', 'fid', 'ttfb'])
let refreshTimer: number | null = null

// 计算属性
const latestScore = computed(() => performanceStore.performanceScore)
const metricsData = computed(() => performanceStore.latestMetrics)

// 初始化图表
const initCharts = () => {
  initWebVitalsChart()
  initScoreChart()
  initResourceTypeChart()
  initResourceTimeChart()
  initWaterfallChart()
  initComparisonChart()
}

// Web Vitals 趋势图表
const initWebVitalsChart = () => {
  if (!webVitalsChart.value) return
  
  webVitalsChartInstance = echarts.init(webVitalsChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['FCP', 'LCP', 'FID', 'TTFB']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: generateTimeLabels()
    },
    yAxis: {
      type: 'value',
      name: '时间 (ms)'
    },
    series: [
      {
        name: 'FCP',
        type: 'line',
        smooth: true,
        data: generateMetricData('fcp'),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: 'LCP',
        type: 'line',
        smooth: true,
        data: generateMetricData('lcp'),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: 'FID',
        type: 'line',
        smooth: true,
        data: generateMetricData('fid'),
        itemStyle: { color: '#faad14' }
      },
      {
        name: 'TTFB',
        type: 'line',
        smooth: true,
        data: generateMetricData('ttfb'),
        itemStyle: { color: '#722ed1' }
      }
    ]
  }
  
  webVitalsChartInstance.setOption(option)
}

// 性能得分图表
const initScoreChart = () => {
  if (!scoreChart.value) return
  
  scoreChartInstance = echarts.init(scoreChart.value)
  
  const scoreData = generateScoreData()
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const score = params[0].value
        const level = getScoreLevel(score)
        return `时间: ${params[0].axisValue}<br/>得分: ${score}<br/>等级: ${level}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: generateTimeLabels()
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '性能得分'
    },
    series: [
      {
        name: '性能得分',
        type: 'line',
        smooth: true,
        data: scoreData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
          ])
        },
        itemStyle: { color: '#1890ff' },
        markLine: {
          data: [
            { yAxis: 80, name: '优秀线', lineStyle: { color: '#52c41a' } },
            { yAxis: 60, name: '及格线', lineStyle: { color: '#faad14' } }
          ]
        }
      }
    ]
  }
  
  scoreChartInstance.setOption(option)
}

// 资源类型分布图
const initResourceTypeChart = () => {
  if (!resourceTypeChart.value) return
  
  resourceTypeChartInstance = echarts.init(resourceTypeChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      data: ['脚本', '样式', '图片', '字体', '其他']
    },
    series: [
      {
        name: '资源类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '40%'],
        data: [
          { value: 35, name: '脚本', itemStyle: { color: '#1890ff' } },
          { value: 25, name: '样式', itemStyle: { color: '#52c41a' } },
          { value: 20, name: '图片', itemStyle: { color: '#faad14' } },
          { value: 10, name: '字体', itemStyle: { color: '#f5222d' } },
          { value: 10, name: '其他', itemStyle: { color: '#722ed1' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  resourceTypeChartInstance.setOption(option)
}

// 资源加载时间图表
const initResourceTimeChart = () => {
  if (!resourceTimeChart.value) return
  
  resourceTimeChartInstance = echarts.init(resourceTimeChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['脚本', '样式', '图片', '字体', 'XHR']
    },
    yAxis: {
      type: 'value',
      name: '平均加载时间 (ms)'
    },
    series: [
      {
        name: '加载时间',
        type: 'bar',
        data: [
          { value: 120, itemStyle: { color: '#1890ff' } },
          { value: 80, itemStyle: { color: '#52c41a' } },
          { value: 200, itemStyle: { color: '#faad14' } },
          { value: 150, itemStyle: { color: '#f5222d' } },
          { value: 300, itemStyle: { color: '#722ed1' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  resourceTimeChartInstance.setOption(option)
}

// 瀑布图
const initWaterfallChart = () => {
  if (!waterfallChart.value) return
  
  waterfallChartInstance = echarts.init(waterfallChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间 (ms)'
    },
    yAxis: {
      type: 'category',
      data: ['DNS查询', 'TCP连接', '请求', '响应', 'DOM解析']
    },
    series: [
      {
        name: '加载阶段',
        type: 'bar',
        data: [20, 30, 50, 100, 80],
        itemStyle: {
          color: (params: any) => {
            const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
            return colors[params.dataIndex]
          }
        }
      }
    ]
  }
  
  waterfallChartInstance.setOption(option)
}

// 性能对比图表
const initComparisonChart = () => {
  if (!comparisonChart.value) return
  
  comparisonChartInstance = echarts.init(comparisonChart.value)
  updateComparisonChart()
}

// 更新对比图表
const updateComparisonChart = () => {
  if (!comparisonChartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: selectedMetrics.value.map(metric => metric.toUpperCase())
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: generateTimeLabels()
    },
    yAxis: {
      type: 'value',
      name: '时间 (ms)'
    },
    series: selectedMetrics.value.map((metric, index) => ({
      name: metric.toUpperCase(),
      type: 'line',
      smooth: true,
      data: generateMetricData(metric),
      itemStyle: { 
        color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][index] 
      }
    }))
  }
  
  comparisonChartInstance.setOption(option)
}

// 生成时间标签
const generateTimeLabels = () => {
  const labels = []
  const now = new Date()
  const count = timeRange.value === '1h' ? 12 : timeRange.value === '6h' ? 12 : 24
  const interval = timeRange.value === '1h' ? 5 : timeRange.value === '6h' ? 30 : 60
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60 * 1000)
    labels.push(time.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
  }
  
  return labels
}

// 生成指标数据
const generateMetricData = (metric: string) => {
  // 使用实际数据或生成模拟数据
  if (metricsData.value.length > 0) {
    return metricsData.value.map(m => {
      const value = m[metric as keyof typeof m] as number
      return Math.round(value)
    })
  }
  
  // 生成模拟数据
  const baseValues: Record<string, number> = {
    fcp: 1500,
    lcp: 2500,
    fid: 50,
    cls: 0.1,
    ttfb: 800
  }
  
  const base = baseValues[metric] || 100
  const data = []
  
  for (let i = 0; i < 12; i++) {
    const variance = base * 0.3
    const value = base + (Math.random() - 0.5) * variance
    data.push(Math.round(Math.max(0, value)))
  }
  
  return data
}

// 生成得分数据
const generateScoreData = () => {
  const data = []
  for (let i = 0; i < 12; i++) {
    const score = 70 + Math.random() * 30
    data.push(Math.round(score))
  }
  return data
}

// 获取得分等级
const getScoreLevel = (score: number) => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '需优化'
}

// 获取得分标签类型
const getScoreTagType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 更新图表
const updateCharts = () => {
  initWebVitalsChart()
  initScoreChart()
  updateComparisonChart()
}

// 刷新图表
const refreshCharts = () => {
  ElMessage.info('正在刷新图表数据...')
  updateCharts()
}

// 导出数据
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

// 设置刷新间隔
const setRefreshInterval = (interval: number) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (interval > 0) {
    refreshTimer = window.setInterval(() => {
      updateCharts()
    }, interval)
    ElMessage.success(`已设置${interval / 1000}秒自动刷新`)
  }
}

// 监听数据变化
watch(metricsData, () => {
  updateCharts()
}, { deep: true })

// 组件挂载
onMounted(() => {
  initCharts()
  if (refreshInterval.value > 0) {
    setRefreshInterval(refreshInterval.value)
  }
})

// 组件卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  // 销毁图表实例
  webVitalsChartInstance?.dispose()
  scoreChartInstance?.dispose()
  resourceTypeChartInstance?.dispose()
  resourceTimeChartInstance?.dispose()
  waterfallChartInstance?.dispose()
  comparisonChartInstance?.dispose()
})
</script>

<style scoped>
.performance-charts {
  padding: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 14px;
  color: #595959;
  white-space: nowrap;
}

.control-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.charts-row {
  margin-bottom: 24px;
}

.charts-row:last-child {
  margin-bottom: 0;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #262626;
}

.comparison-controls {
  display: flex;
  gap: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
  padding: 20px;
}
</style>