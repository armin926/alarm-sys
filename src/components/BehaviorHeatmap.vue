<template>
  <div class="behavior-heatmap">
    <!-- 控制面板 -->
    <el-card class="control-panel">
      <template #header>
        <div class="panel-header">
          <span>热力图控制面板</span>
          <el-tag type="info" size="small">可视化分析</el-tag>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="control-item">
            <label>显示模式</label>
            <el-radio-group v-model="displayMode" size="small">
              <el-radio-button label="click">点击热力图</el-radio-button>
              <el-radio-button label="scroll">滚动热力图</el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="control-item">
            <label>热度范围</label>
            <el-slider
              v-model="intensityRange"
              range
              :min="1"
              :max="100"
              size="small"
            />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="control-item">
            <label>透明度</label>
            <el-slider
              v-model="opacity"
              :min="10"
              :max="100"
              size="small"
            />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="control-item">
            <el-button-group size="small">
              <el-button @click="generateHeatmap">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button @click="exportHeatmap">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </el-button-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 热力图显示区域 -->
    <el-card class="heatmap-container">
      <template #header>
        <div class="heatmap-header">
          <span>{{ getDisplayTitle() }}</span>
          <div class="legend">
            <span class="legend-label">热度:</span>
            <div class="legend-gradient">
              <span class="legend-text">低</span>
              <div class="gradient-bar"></div>
              <span class="legend-text">高</span>
            </div>
          </div>
        </div>
      </template>
      
      <div class="heatmap-wrapper" ref="heatmapWrapper">
        <!-- 模拟页面内容 -->
        <div class="demo-page" ref="demoPage">
          <div class="page-header-demo">
            <h1>示例页面标题</h1>
            <p>这是一个用于展示热力图效果的示例页面</p>
          </div>
          
          <div class="page-content">
            <div class="content-section">
              <h2>主要内容区域</h2>
              <p>用户通常会在这个区域进行大量的交互操作，如点击链接、阅读内容等。</p>
              <button class="demo-button" @click="recordClick">主要操作按钮</button>
            </div>
            
            <div class="sidebar-demo">
              <h3>侧边栏</h3>
              <ul class="menu-list">
                <li @click="recordClick">菜单项 1</li>
                <li @click="recordClick">菜单项 2</li>
                <li @click="recordClick">菜单项 3</li>
                <li @click="recordClick">菜单项 4</li>
              </ul>
            </div>
            
            <div class="footer-demo">
              <p>页面底部信息</p>
              <button class="demo-button secondary" @click="recordClick">次要按钮</button>
            </div>
          </div>
        </div>
        
        <!-- 热力图画布 -->
        <canvas 
          ref="heatmapCanvas" 
          class="heatmap-canvas"
          :style="{ opacity: opacity / 100 }"
        ></canvas>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="24" class="stats-section">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>点击统计</span>
          </template>
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">总点击数:</span>
              <span class="stat-value">{{ totalClicks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">热点区域:</span>
              <span class="stat-value">{{ hotspots.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最热区域:</span>
              <span class="stat-value">{{ getHottestArea() }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>热点排行</span>
          </template>
          <div class="hotspot-list">
            <div 
              v-for="(hotspot, index) in topHotspots" 
              :key="index"
              class="hotspot-item"
            >
              <div class="hotspot-rank">{{ index + 1 }}</div>
              <div class="hotspot-info">
                <div class="hotspot-position">{{ formatPosition(hotspot) }}</div>
                <div class="hotspot-intensity">强度: {{ hotspot.value }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>操作建议</span>
          </template>
          <div class="suggestions">
            <el-alert
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :title="suggestion.title"
              :type="suggestion.type"
              :description="suggestion.description"
              show-icon
              :closable="false"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 演示功能 -->
    <el-card class="demo-section">
      <template #header>
        <div class="demo-header">
          <span>演示功能</span>
          <el-tag type="warning" size="small">教学工具</el-tag>
        </div>
      </template>
      <div class="demo-controls">
        <el-button-group>
          <el-button @click="simulateClicks">
            <el-icon><MagicStick /></el-icon>
            模拟点击
          </el-button>
          <el-button @click="clearHeatmap">
            <el-icon><Delete /></el-icon>
            清空数据
          </el-button>
          <el-button @click="autoDemo">
            <el-icon><VideoPlay /></el-icon>
            自动演示
          </el-button>
        </el-button-group>
      </div>
      <el-alert
        title="使用说明"
        type="info"
        :closable="false"
        show-icon
      >
        <p>• 点击页面上的任意位置可以记录热点数据</p>
        <p>• 使用"模拟点击"可以快速生成演示数据</p>
        <p>• 调整透明度和热度范围可以更好地观察热力图效果</p>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { 
  Refresh, 
  Download, 
  MagicStick, 
  Delete, 
  VideoPlay 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBehaviorStore } from '@/stores'
import type { HeatmapPoint } from '@/types'

const behaviorStore = useBehaviorStore()

// 响应式数据
const displayMode = ref('click')
const intensityRange = ref([1, 100])
const opacity = ref(70)
const heatmapWrapper = ref<HTMLElement>()
const demoPage = ref<HTMLElement>()
const heatmapCanvas = ref<HTMLCanvasElement>()
const heatmapData = ref<HeatmapPoint[]>([])
const demoInterval = ref<number | null>(null)

// 计算属性
const totalClicks = computed(() => {
  return heatmapData.value.reduce((sum, point) => sum + point.count, 0)
})

const hotspots = computed(() => {
  return heatmapData.value.filter(point => point.value >= intensityRange.value[0])
})

const topHotspots = computed(() => {
  return heatmapData.value
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
})

const suggestions = computed(() => {
  const suggestions = []
  
  if (totalClicks.value === 0) {
    suggestions.push({
      title: '数据收集',
      type: 'info',
      description: '开始收集用户点击数据以生成热力图'
    })
  }
  
  if (hotspots.value.length > 5) {
    suggestions.push({
      title: '热点优化',
      type: 'warning',
      description: '发现多个热点区域，建议优化页面布局'
    })
  }
  
  if (topHotspots.value.length > 0) {
    suggestions.push({
      title: '重点关注',
      type: 'success',
      description: '用户最关注的区域已识别，可以针对性优化'
    })
  }
  
  return suggestions
})

// 方法
const getDisplayTitle = () => {
  return displayMode.value === 'click' ? '点击热力图分析' : '滚动热力图分析'
}

const getHottestArea = () => {
  if (topHotspots.value.length === 0) return '暂无数据'
  const hottest = topHotspots.value[0]
  return `(${hottest.x}, ${hottest.y})`
}

const formatPosition = (point: HeatmapPoint) => {
  return `(${point.x}, ${point.y})`
}

const recordClick = (event: MouseEvent) => {
  if (!heatmapWrapper.value) return
  
  const rect = heatmapWrapper.value.getBoundingClientRect()
  const x = Math.round(event.clientX - rect.left)
  const y = Math.round(event.clientY - rect.top)
  
  addHeatPoint(x, y)
  
  // 同时记录到行为存储
  behaviorStore.trackClick('热力图演示区域', { x, y })
}

const addHeatPoint = (x: number, y: number) => {
  const existingPoint = heatmapData.value.find(
    point => Math.abs(point.x - x) < 20 && Math.abs(point.y - y) < 20
  )
  
  if (existingPoint) {
    existingPoint.value += 1
    existingPoint.count += 1
  } else {
    heatmapData.value.push({
      x,
      y,
      value: 1,
      count: 1
    })
  }
  
  drawHeatmap()
}

const generateHeatmap = () => {
  // 从行为存储获取数据
  const storeHeatmapData = behaviorStore.generateHeatmap()
  heatmapData.value = [...storeHeatmapData]
  drawHeatmap()
  ElMessage.info('热力图已刷新')
}

const drawHeatmap = () => {
  if (!heatmapCanvas.value || !heatmapWrapper.value) return
  
  const canvas = heatmapCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 设置画布尺寸
  const rect = heatmapWrapper.value.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制热点
  heatmapData.value.forEach(point => {
    if (point.value >= intensityRange.value[0] && point.value <= intensityRange.value[1]) {
      drawHeatPoint(ctx, point)
    }
  })
}

const drawHeatPoint = (ctx: CanvasRenderingContext2D, point: HeatmapPoint) => {
  const radius = Math.min(50, point.value * 5)
  const intensity = Math.min(1, point.value / 10)
  
  // 创建径向渐变
  const gradient = ctx.createRadialGradient(
    point.x, point.y, 0,
    point.x, point.y, radius
  )
  
  // 根据强度设置颜色
  if (intensity > 0.7) {
    gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`)
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
  } else if (intensity > 0.4) {
    gradient.addColorStop(0, `rgba(255, 165, 0, ${intensity})`)
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)')
  } else {
    gradient.addColorStop(0, `rgba(0, 255, 0, ${intensity})`)
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
  }
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

const simulateClicks = () => {
  const count = 20 + Math.floor(Math.random() * 30)
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (heatmapWrapper.value) {
        const rect = heatmapWrapper.value.getBoundingClientRect()
        const x = Math.random() * rect.width
        const y = Math.random() * rect.height
        addHeatPoint(x, y)
      }
    }, i * 50)
  }
  
  ElMessage.success(`已模拟 ${count} 个点击事件`)
}

const clearHeatmap = () => {
  heatmapData.value = []
  drawHeatmap()
  ElMessage.info('热力图数据已清空')
}

const autoDemo = () => {
  if (demoInterval.value) {
    clearInterval(demoInterval.value)
    demoInterval.value = null
    ElMessage.info('自动演示已停止')
    return
  }
  
  ElMessage.success('自动演示已开始')
  demoInterval.value = setInterval(() => {
    if (heatmapWrapper.value) {
      const rect = heatmapWrapper.value.getBoundingClientRect()
      const x = Math.random() * rect.width
      const y = Math.random() * rect.height
      addHeatPoint(x, y)
    }
  }, 500)
}

const exportHeatmap = () => {
  const data = {
    heatmapData: heatmapData.value,
    settings: {
      displayMode: displayMode.value,
      intensityRange: intensityRange.value,
      opacity: opacity.value
    },
    stats: {
      totalClicks: totalClicks.value,
      hotspots: hotspots.value.length
    },
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('热力图数据已导出')
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    drawHeatmap()
    
    // 添加点击事件监听
    if (heatmapWrapper.value) {
      heatmapWrapper.value.addEventListener('click', recordClick)
    }
    
    // 窗口大小变化时重绘
    window.addEventListener('resize', drawHeatmap)
  })
})

onUnmounted(() => {
  if (demoInterval.value) {
    clearInterval(demoInterval.value)
  }
  
  if (heatmapWrapper.value) {
    heatmapWrapper.value.removeEventListener('click', recordClick)
  }
  
  window.removeEventListener('resize', drawHeatmap)
})

// 监听设置变化
watch([intensityRange, opacity], () => {
  drawHeatmap()
})
</script>

<style scoped>
.behavior-heatmap {
  padding: 0;
}

.control-panel {
  margin-bottom: 24px;
}

.panel-header,
.heatmap-header,
.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-item {
  margin-bottom: 8px;
}

.control-item label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.heatmap-container {
  margin-bottom: 24px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-label {
  font-size: 12px;
  color: #666;
}

.legend-gradient {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gradient-bar {
  width: 100px;
  height: 12px;
  background: linear-gradient(90deg, #00ff00, #ffff00, #ff8000, #ff0000);
  border-radius: 6px;
  border: 1px solid #ddd;
}

.legend-text {
  font-size: 11px;
  color: #999;
}

.heatmap-wrapper {
  position: relative;
  min-height: 500px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.demo-page {
  padding: 20px;
  min-height: 500px;
  background: #fff;
  cursor: crosshair;
}

.page-header-demo {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.page-header-demo h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.page-header-demo p {
  margin: 0;
  color: #666;
}

.page-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.content-section {
  padding: 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.content-section h2 {
  margin: 0 0 15px 0;
  color: #333;
}

.sidebar-demo {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.sidebar-demo h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-list li {
  padding: 10px;
  margin-bottom: 5px;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-list li:hover {
  background: #e6f7ff;
}

.footer-demo {
  grid-column: 1 / -1;
  padding: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  text-align: center;
}

.demo-button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.demo-button:hover {
  background: #40a9ff;
}

.demo-button.secondary {
  background: #6c757d;
}

.demo-button.secondary:hover {
  background: #5a6268;
}

.heatmap-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-list {
  padding: 8px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #1890ff;
  font-weight: 600;
}

.hotspot-list {
  max-height: 200px;
  overflow-y: auto;
}

.hotspot-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hotspot-item:last-child {
  border-bottom: none;
}

.hotspot-rank {
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

.hotspot-info {
  flex: 1;
}

.hotspot-position {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.hotspot-intensity {
  font-size: 12px;
  color: #666;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-section {
  margin-top: 24px;
}

.demo-controls {
  margin-bottom: 16px;
}

:deep(.el-slider) {
  margin: 0 8px;
}

:deep(.el-radio-group) {
  width: 100%;
}

:deep(.el-radio-button__inner) {
  padding: 6px 12px;
  font-size: 12px;
}

:deep(.el-alert) {
  margin-bottom: 8px;
}

:deep(.el-alert:last-child) {
  margin-bottom: 0;
}
</style>