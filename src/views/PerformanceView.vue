<template>
  <div class="performance-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <el-icon><TrendCharts /></el-icon>
          性能监控
        </h2>
        <p class="page-description">
          实时监控应用性能指标，包括Core Web Vitals和自定义性能数据
        </p>
      </div>
      <div class="header-actions">
        <el-switch
          v-model="isMonitoring"
          active-text="监控中"
          inactive-text="已暂停"
          @change="toggleMonitoring"
        />
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 性能概览卡片 -->
    <el-row :gutter="24" class="overview-cards">
      <el-col :span="6">
        <PerformanceCard
          title="性能评分"
          :value="performanceScore"
          :status="getScoreStatus(performanceScore)"
          icon="TrendCharts"
          color="#1890ff"
        />
      </el-col>
      <el-col :span="6">
        <PerformanceCard
          title="FCP"
          :value="currentMetrics?.fcp"
          unit="ms"
          :status="getMetricStatus('fcp', currentMetrics?.fcp)"
          icon="Timer"
          color="#52c41a"
        />
      </el-col>
      <el-col :span="6">
        <PerformanceCard
          title="LCP"
          :value="currentMetrics?.lcp"
          unit="ms"
          :status="getMetricStatus('lcp', currentMetrics?.lcp)"
          icon="Timer"
          color="#faad14"
        />
      </el-col>
      <el-col :span="6">
        <PerformanceCard
          title="CLS"
          :value="currentMetrics?.cls"
          :format="formatCLS"
          :status="getMetricStatus('cls', currentMetrics?.cls)"
          icon="Rank"
          color="#f5222d"
        />
      </el-col>
    </el-row>

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" class="performance-tabs">
      <el-tab-pane label="性能图表" name="charts">
        <PerformanceCharts />
      </el-tab-pane>
      <el-tab-pane label="性能指标" name="metrics">
        <PerformanceMetrics />
      </el-tab-pane>
      <el-tab-pane label="演示功能" name="demo">
        <PerformanceDemo />
      </el-tab-pane>
    </el-tabs>

    <!-- 嵌套路由视图 -->
    <!-- <router-view v-if="$route.path !== '/performance'" /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { TrendCharts, Refresh, Timer, Rank } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePerformanceStore } from '@/stores'
import { usePerformanceMonitoring } from '@/composables'
import PerformanceCard from '@/components/PerformanceCard.vue'
import PerformanceMetrics from '@/components/PerformanceMetrics.vue'
import PerformanceCharts from '@/components/PerformanceCharts.vue'
import PerformanceDemo from '@/components/demos/PerformanceDemo.vue'

const performanceStore = usePerformanceStore()
const { startPerformanceMonitoring, stopPerformanceMonitoring } = usePerformanceMonitoring()

const activeTab = ref('charts')
const isMonitoring = computed({
  get: () => performanceStore.isMonitoring,
  set: (value) => {
    if (value) {
      startPerformanceMonitoring()
    } else {
      stopPerformanceMonitoring()
    }
  }
})

const performanceScore = computed(() => performanceStore.performanceScore)
const currentMetrics = computed(() => performanceStore.currentMetrics)

const toggleMonitoring = (value: boolean) => {
  if (value) {
    ElMessage.success('性能监控已启动')
  } else {
    ElMessage.info('性能监控已暂停')
  }
}

const refreshData = () => {
  ElMessage.info('正在刷新性能数据...')
  // 触发数据刷新逻辑
}

const getScoreStatus = (score: number) => {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warning'
  return 'error'
}

const getMetricStatus = (metric: string, value?: number) => {
  if (!value) return 'normal'
  
  const thresholds = performanceStore.config.thresholds
  const threshold = thresholds[metric as keyof typeof thresholds]
  
  if (value <= threshold) return 'good'
  if (value <= threshold * 1.5) return 'warning'
  return 'error'
}

const formatCLS = (value?: number) => {
  if (!value) return '0.000'
  return value.toFixed(3)
}

onMounted(() => {
  if (!performanceStore.isMonitoring) {
    startPerformanceMonitoring()
  }
})
</script>

<style scoped>
.performance-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.page-description {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-cards {
  margin-bottom: 24px;
}

.performance-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
}

:deep(.el-tabs__content) {
  padding: 24px;
}
</style>