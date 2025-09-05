<template>
  <div class="error-chart">
    <div ref="chartContainer" style="width: 100%; height: 300px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useErrorStore } from '@/stores'

interface Props {
  showOnlyErrors: boolean
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLDivElement>()
const errorStore = useErrorStore()

let chart: echarts.ECharts | null = null

onMounted(() => {
  initChart()
})

watch(() => props.showOnlyErrors, () => {
  updateChart()
})

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const stats = errorStore.errorStats
  
  if (props.showOnlyErrors) {
    // 显示错误类型分布
    const data = Object.entries(stats.byType).map(([type, count]) => ({
      name: getTypeLabel(type),
      value: count
    }))
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        data: data.map(item => item.name)
      },
      series: [
        {
          name: '错误类型',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '40%'],
          data: data,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {c}'
          }
        }
      ]
    }
    
    chart.setOption(option, true)
  } else {
    // 显示错误趋势
    const timeData = generateTimeData()
    const errorData = generateErrorTrendData()
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        bottom: 0,
        data: ['JavaScript错误', '网络错误', '资源错误', 'Promise错误']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timeData
      },
      yAxis: {
        type: 'value',
        name: '错误数量'
      },
      series: [
        {
          name: 'JavaScript错误',
          type: 'line',
          stack: 'errors',
          areaStyle: {},
          data: errorData.javascript,
          itemStyle: { color: '#ff4d4f' }
        },
        {
          name: '网络错误',
          type: 'line',
          stack: 'errors',
          areaStyle: {},
          data: errorData.network,
          itemStyle: { color: '#faad14' }
        },
        {
          name: '资源错误',
          type: 'line',
          stack: 'errors',
          areaStyle: {},
          data: errorData.resource,
          itemStyle: { color: '#1890ff' }
        },
        {
          name: 'Promise错误',
          type: 'line',
          stack: 'errors',
          areaStyle: {},
          data: errorData.promise,
          itemStyle: { color: '#722ed1' }
        }
      ]
    }
    
    chart.setOption(option, true)
  }
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    javascript: 'JavaScript错误',
    network: '网络错误',
    resource: '资源错误',
    promise: 'Promise错误'
  }
  return labels[type] || type
}

const generateTimeData = () => {
  const now = new Date()
  const data = []
  
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push(time.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
  }
  
  return data
}

const generateErrorTrendData = () => {
  const errors = errorStore.errors
  
  // 如果有实际数据，按时间分组
  if (errors.length > 0) {
    const hourlyData = {
      javascript: new Array(12).fill(0),
      network: new Array(12).fill(0),
      resource: new Array(12).fill(0),
      promise: new Array(12).fill(0)
    }
    
    errors.forEach(error => {
      const hourIndex = Math.floor(Math.random() * 12) // 简化处理
      if (hourlyData[error.type]) {
        hourlyData[error.type][hourIndex]++
      }
    })
    
    return hourlyData
  }
  
  // 生成模拟数据
  return {
    javascript: Array.from({ length: 12 }, () => Math.floor(Math.random() * 5)),
    network: Array.from({ length: 12 }, () => Math.floor(Math.random() * 3)),
    resource: Array.from({ length: 12 }, () => Math.floor(Math.random() * 2)),
    promise: Array.from({ length: 12 }, () => Math.floor(Math.random() * 2))
  }
}
</script>

<style scoped>
.error-chart {
  width: 100%;
  height: 100%;
}
</style>