<template>
  <div class="performance-charts">
    <!-- 图表控制栏 -->
    <div class="chart-controls">
      <div class="control-group">
        <label class="control-label">时间范围:</label>
        <el-select v-model="timeRange" style="width: 120px" @change="updateCharts">
          <el-option label="最近1小时" value="1h" />
          <el-option label="最近6小时" value="6h" />
          <el-option label="最近24小时" value="24h" />
          <el-option label="最近7天" value="7d" />
        </el-select>
      </div>
      
      <div class="control-group">
        <label class="control-label">刷新间隔:</label>
        <el-select v-model="refreshInterval" style="width: 120px" @change="setRefreshInterval">
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
        <div :ref="chartRefs.webVitals" class="chart-container"></div>
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
        <div :ref="chartRefs.score" class="chart-container"></div>
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
        <div :ref="chartRefs.resourceType" class="chart-container"></div>
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
        <div :ref="chartRefs.resourceTime" class="chart-container"></div>
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
        <div :ref="chartRefs.waterfall" class="chart-container"></div>
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
        <div :ref="chartRefs.comparison" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, computed, watch, nextTick } from 'vue'
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

// ============================
// 数据和状态管理
// ============================
const performanceStore = usePerformanceStore()
const { measureResourceTiming } = usePerformanceMonitoring()

// 图表容器引用统一管理
const chartRefs = {
  webVitals: ref<HTMLDivElement>(),
  score: ref<HTMLDivElement>(),
  resourceType: ref<HTMLDivElement>(),
  resourceTime: ref<HTMLDivElement>(),
  waterfall: ref<HTMLDivElement>(),
  comparison: ref<HTMLDivElement>()
}

// 图表实例统一管理
const chartInstances: Record<string, echarts.ECharts | null> = {
  webVitals: null,
  score: null,
  resourceType: null,
  resourceTime: null,
  waterfall: null,
  comparison: null
}

// 控制状态
const timeRange = ref('1h')
const refreshInterval = ref(0)
const showAllMetrics = ref(true)
const selectedMetrics = ref(['fcp', 'lcp', 'fid', 'ttfb'])
let refreshTimer: number | null = null

// 计算属性
const latestScore = computed(() => performanceStore.performanceScore)
const metricsData = computed(() => performanceStore.latestMetrics)

// ============================
// 工具函数和配置构建器
// ============================

/**
 * 等待DOM元素尺寸就绪
 * @param element - DOM元素
 * @param maxAttempts - 最大尝试次数
 * @returns Promise<boolean> - 是否成功获取尺寸
 */
const waitForElementSize = async (element: HTMLElement | null, maxAttempts = 10): Promise<boolean> => {
  if (!element) return false
  
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    const { clientWidth, clientHeight } = element
    if (clientWidth > 0 && clientHeight > 0) return true
    await new Promise(resolve => setTimeout(resolve, attempts * 50))
  }
  
  return false
}

/**
 * 创建通用网格配置
 */
const createGridConfig = () => ({
  left: '3%',
  right: '4%',
  bottom: '3%',
  containLabel: true
})

/**
 * 创建时间轴配置
 */
const createTimeAxisConfig = () => ({
  type: 'category',
  data: generateTimeLabels()
})

/**
 * 通用图表初始化函数
 * @param chartKey - 图表键名
 * @param optionBuilder - 配置构建函数
 */
const initChart = async (chartKey: string, optionBuilder: () => any) => {
  const element = chartRefs[chartKey as keyof typeof chartRefs].value
  if (!element) return

  await waitForElementSize(element)
  
  // 销毁旧实例
  if (chartInstances[chartKey]) {
    chartInstances[chartKey]?.dispose()
    chartInstances[chartKey] = null
  }

  try {
    chartInstances[chartKey] = echarts.init(element)
    chartInstances[chartKey]?.setOption(optionBuilder())
  } catch (error) {
    console.error(`Failed to initialize ${chartKey} chart:`, error)
  }
}

// ============================
// 图表配置构建器
// ============================

/**
 * 创建Web Vitals趋势图配置
 */
const createWebVitalsOption = () => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['FCP', 'LCP', 'FID', 'TTFB'] },
  grid: createGridConfig(),
  xAxis: createTimeAxisConfig(),
  yAxis: { type: 'value', name: '时间 (ms)' },
  series: [
    { name: 'FCP', color: '#1890ff' },
    { name: 'LCP', color: '#52c41a' },
    { name: 'FID', color: '#faad14' },
    { name: 'TTFB', color: '#722ed1' }
  ].map(metric => ({
    name: metric.name,
    type: 'line',
    smooth: true,
    data: generateMetricData(metric.name.toLowerCase()),
    itemStyle: { color: metric.color }
  }))
})

/**
 * 创建性能得分图配置
 */
const createScoreOption = () => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const score = params[0].value
      const level = getScoreLevel(score)
      return `时间: ${params[0].axisValue}<br/>得分: ${score}<br/>等级: ${level}`
    }
  },
  grid: createGridConfig(),
  xAxis: createTimeAxisConfig(),
  yAxis: { type: 'value', min: 0, max: 100, name: '性能得分' },
  series: [{
    name: '性能得分',
    type: 'line',
    smooth: true,
    data: generateScoreData(),
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
  }]
})

/**
 * 创建资源类型分布图配置
 */
const createResourceTypeOption = () => {
  const resourceData = [
    { value: 35, name: '脚本', color: '#1890ff' },
    { value: 25, name: '样式', color: '#52c41a' },
    { value: 20, name: '图片', color: '#faad14' },
    { value: 10, name: '字体', color: '#f5222d' },
    { value: 10, name: '其他', color: '#722ed1' }
  ]
  
  return {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { bottom: 0, data: resourceData.map(item => item.name) },
    series: [{
      name: '资源类型',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '40%'],
      data: resourceData.map(item => ({ value: item.value, name: item.name, itemStyle: { color: item.color } })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }
}

/**
 * 创建资源加载时间图配置
 */
const createResourceTimeOption = () => {
  const loadTimeData = [
    { name: '脚本', value: 120, color: '#1890ff' },
    { name: '样式', value: 80, color: '#52c41a' },
    { name: '图片', value: 200, color: '#faad14' },
    { name: '字体', value: 150, color: '#f5222d' },
    { name: 'XHR', value: 300, color: '#722ed1' }
  ]
  
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: createGridConfig(),
    xAxis: { type: 'category', data: loadTimeData.map(item => item.name) },
    yAxis: { type: 'value', name: '平均加载时间 (ms)' },
    series: [{
      name: '加载时间',
      type: 'bar',
      data: loadTimeData.map(item => ({ value: item.value, itemStyle: { color: item.color } })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }
}

/**
 * 创建瀑布图配置
 */
const createWaterfallOption = () => {
  const waterfallData = [
    { name: 'DNS查询', value: 20 },
    { name: 'TCP连接', value: 30 },
    { name: '请求', value: 50 },
    { name: '响应', value: 100 },
    { name: 'DOM解析', value: 80 }
  ]
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
  
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: createGridConfig(),
    xAxis: { type: 'value', name: '时间 (ms)' },
    yAxis: { type: 'category', data: waterfallData.map(item => item.name) },
    series: [{
      name: '加载阶段',
      type: 'bar',
      data: waterfallData.map(item => item.value),
      itemStyle: {
        color: (params: any) => colors[params.dataIndex]
      }
    }]
  }
}

/**
 * 创建对比图配置
 */
const createComparisonOption = () => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: selectedMetrics.value.map(metric => metric.toUpperCase()) },
  grid: createGridConfig(),
  xAxis: createTimeAxisConfig(),
  yAxis: { type: 'value', name: '时间 (ms)' },
  series: selectedMetrics.value.map((metric, index) => ({
    name: metric.toUpperCase(),
    type: 'line',
    smooth: true,
    data: generateMetricData(metric),
    itemStyle: { color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'][index] }
  }))
})

/**
 * 批量初始化所有图表
 */
const initCharts = async () => {
  console.log('Starting charts initialization...')
  
  // 定义图表配置映射
  const chartConfigs = {
    webVitals: createWebVitalsOption,
    score: createScoreOption,
    resourceType: createResourceTypeOption,
    resourceTime: createResourceTimeOption,
    waterfall: createWaterfallOption,
    comparison: createComparisonOption
  }
  
  // 并发初始化所有图表
  await Promise.all(
    Object.entries(chartConfigs).map(([key, optionBuilder]) => 
      initChart(key, optionBuilder)
    )
  )
  
  console.log('All charts initialization completed')
}

// ============================
// 业务逻辑函数
// ============================

/**
 * 更新对比图表
 */
const updateComparisonChart = () => {
  if (chartInstances.comparison) {
    chartInstances.comparison.setOption(createComparisonOption())
  }
}

/**
 * 重新调整所有图表大小
 */
const resizeAllCharts = () => {
  Object.values(chartInstances).forEach(instance => instance?.resize())
}

/**
 * 更新图表
 */
const updateCharts = () => {
  initChart('webVitals', createWebVitalsOption)
  initChart('score', createScoreOption)
  updateComparisonChart()
}

/**
 * 刷新图表数据
 */
const refreshCharts = () => {
  ElMessage.info('正在刷新图表数据...')
  updateCharts()
}

/**
 * 导出数据功能
 */
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

/**
 * 设置刷新间隔
 * @param interval - 间隔时间（毫秒）
 */
const setRefreshInterval = (interval: number) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (interval > 0) {
    refreshTimer = window.setInterval(updateCharts, interval)
    ElMessage.success(`已设置${interval / 1000}秒自动刷新`)
  }
}

// ============================
// 数据生成器
// ============================

/**
 * 生成时间标签
 */
const generateTimeLabels = () => {
  const now = new Date()
  const intervals: Record<string, [number, number]> = { '1h': [12, 5], '6h': [12, 30], '24h': [24, 60], '7d': [24, 60] }
  const [count, minutes] = intervals[timeRange.value] || [12, 5]
  
  return Array.from({ length: count }, (_, i) => {
    const time = new Date(now.getTime() - (count - 1 - i) * minutes * 60 * 1000)
    return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
}

/**
 * 生成指标数据
 * @param metric - 指标名称
 */
const generateMetricData = (metric: string) => {
  // 使用实际数据或生成模拟数据
  if (metricsData.value.length > 0) {
    return metricsData.value.map(m => Math.round(m[metric as keyof typeof m] as number))
  }
  
  // 模拟数据生成
  const baseValues: Record<string, number> = {
    fcp: 1500, lcp: 2500, fid: 50, cls: 0.1, ttfb: 800
  }
  
  const base = baseValues[metric] || 100
  return Array.from({ length: 12 }, () => {
    const variance = base * 0.3
    return Math.round(Math.max(0, base + (Math.random() - 0.5) * variance))
  })
}

/**
 * 生成得分数据
 */
const generateScoreData = () => {
  return Array.from({ length: 12 }, () => Math.round(70 + Math.random() * 30))
}

/**
 * 获取得分等级
 * @param score - 得分
 */
const getScoreLevel = (score: number) => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '需优化'
}

/**
 * 获取得分标签类型
 * @param score - 得分
 */
const getScoreTagType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

// ============================
// 生命周期管理
// ============================

/**
 * 监听数据变化
 */
watch(metricsData, updateCharts, { deep: true })

/**
 * 组件挂载
 */
onMounted(() => {
  console.log('PerformanceCharts component mounted')
  
  nextTick(async () => {
    await initCharts()
    if (refreshInterval.value > 0) {
      setRefreshInterval(refreshInterval.value)
    }
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeAllCharts)
})

/**
 * 组件激活（处理标签页切换）
 */
onActivated(() => {
  console.log('PerformanceCharts component activated')
  
  nextTick(async () => {
    // 等待更长时间确保标签页完全显示
    await new Promise(resolve => setTimeout(resolve, 300))
    await initCharts()
    resizeAllCharts()
  })
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  // 清理定时器
  if (refreshTimer) clearInterval(refreshTimer)
  
  // 移除事件监听器
  window.removeEventListener('resize', resizeAllCharts)
  
  // 销毁图表实例
  Object.values(chartInstances).forEach(instance => instance?.dispose())
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