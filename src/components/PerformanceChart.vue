<template>
  <div class="performance-chart">
    <div ref="chartContainer" style="width: 100%; height: 300px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { usePerformanceStore } from '@/stores'

interface Props {
  period: string
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLDivElement>()
const performanceStore = usePerformanceStore()

let chart: echarts.ECharts | null = null

onMounted(() => {
  initChart()
})

watch(() => props.period, () => {
  updateChart()
})

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: generateTimeData()
    },
    yAxis: [
      {
        type: 'value',
        name: '时间 (ms)',
        position: 'left'
      },
      {
        type: 'value',
        name: 'CLS',
        position: 'right',
        max: 1
      }
    ],
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
        name: 'CLS',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: generateMetricData('cls'),
        itemStyle: { color: '#ff4d4f' }
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
  
  chart.setOption(option)
}

const updateChart = () => {
  if (!chart) return
  
  chart.setOption({
    xAxis: {
      data: generateTimeData()
    },
    series: [
      { data: generateMetricData('fcp') },
      { data: generateMetricData('lcp') },
      { data: generateMetricData('fid') },
      { data: generateMetricData('cls') },
      { data: generateMetricData('ttfb') }
    ]
  })
}

const generateTimeData = () => {
  const now = new Date()
  const data = []
  const interval = props.period === '1h' ? 5 : props.period === '6h' ? 30 : 60
  const count = props.period === '1h' ? 12 : props.period === '6h' ? 12 : 24
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60 * 1000)
    data.push(time.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
  }
  
  return data
}

const generateMetricData = (metric: string) => {
  // 使用实际的性能数据，如果没有则生成模拟数据
  const metrics = performanceStore.latestMetrics
  
  if (metrics.length > 0) {
    // 使用真实数据
    return metrics.map(m => {
      const value = m[metric as keyof typeof m] as number
      return metric === 'cls' ? value : Math.round(value)
    })
  }
  
  // 生成模拟数据
  const baseValues = {
    fcp: 1500,
    lcp: 2500,
    fid: 50,
    cls: 0.1,
    ttfb: 800
  }
  
  const base = baseValues[metric as keyof typeof baseValues] || 100
  const data = []
  
  for (let i = 0; i < 12; i++) {
    const variance = metric === 'cls' ? 0.05 : base * 0.3
    const value = base + (Math.random() - 0.5) * variance
    data.push(metric === 'cls' ? Math.round(value * 1000) / 1000 : Math.round(value))
  }
  
  return data
}
</script>

<style scoped>
.performance-chart {
  width: 100%;
  height: 100%;
}
</style>