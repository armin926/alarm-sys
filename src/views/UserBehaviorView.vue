<template>
  <div class="user-behavior-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <el-icon><User /></el-icon>
          用户行为分析
        </h2>
        <p class="page-description">
          深度分析用户在应用中的行为模式，包括点击热力图、用户路径和交互分析
        </p>
      </div>
      <div class="header-actions">
        <el-switch
          v-model="isTracking"
          active-text="追踪中"
          inactive-text="已暂停"
          @change="toggleTracking"
        />
        <el-button @click="generateReport">
          <el-icon><Document /></el-icon>
          生成报告
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-cards">
      <el-col :span="6">
        <StatusCard
          title="总事件数"
          :value="behaviorStats.totalEvents"
          :status="getEventsStatus(behaviorStats.totalEvents)"
          icon="DataAnalysis"
          color="#1890ff"
          :trend="0"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="活跃用户"
          :value="activeSessions"
          status="good"
          icon="User"
          color="#52c41a"
          :trend="0"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="平均会话时长"
          :value="formatDuration(behaviorStats.sessionDuration)"
          :status="getSessionStatus(behaviorStats.sessionDuration)"
          icon="Clock"
          color="#faad14"
          :trend="0"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="交互元素"
          :value="behaviorStats.uniqueElements"
          status="good"
          icon="Grid"
          color="#722ed1"
          :trend="0"
        />
      </el-col>
    </el-row>

    <!-- 过滤器 -->
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Filter /></el-icon>
            数据过滤
          </span>
        </div>
      </template>
      <el-row :gutter="16" class="filter-row">
        <el-col :span="6">
          <el-select v-model="filterEventType" placeholder="事件类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="点击" value="click" />
            <el-option label="滚动" value="scroll" />
            <el-option label="输入" value="input" />
            <el-option label="导航" value="navigation" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterPage" placeholder="页面" clearable>
            <el-option label="全部" value="" />
            <el-option 
              v-for="(count, page) in pageViews" 
              :key="page"
              :label="page"
              :value="page"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="filterTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="applyFilters">
            <el-icon><Search /></el-icon>
            应用过滤
          </el-button>
          <el-button @click="clearFilters">
            清空
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" class="behavior-tabs">
      <el-tab-pane label="行为分析" name="analytics">
        <BehaviorAnalytics :filters="currentFilters" />
      </el-tab-pane>
      <el-tab-pane label="热力图" name="heatmap">
        <BehaviorHeatmap />
      </el-tab-pane>
      <el-tab-pane label="用户路径" name="path">
        <UserPath />
      </el-tab-pane>
      <el-tab-pane label="演示功能" name="demo">
        <BehaviorDemo />
      </el-tab-pane>
    </el-tabs>

    <!-- 嵌套路由视图 -->
    <!-- <router-view v-if="$route.path !== '/behavior'" /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import {
  User,
  Document,
  DataAnalysis,
  Clock,
  Grid,
  Filter,
  Search
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBehaviorStore } from '@/stores'
import { useBehaviorTracking } from '@/composables'
import StatusCard from '@/components/StatusCard.vue'
import BehaviorAnalytics from '@/components/BehaviorAnalytics.vue'
import BehaviorHeatmap from '@/components/BehaviorHeatmap.vue'
import BehaviorDemo from '@/components/demos/BehaviorDemo.vue'

// 用户路径组件
const UserPath = defineComponent({
  name: 'UserPath',
  setup() {
    return () => h('div', { class: 'user-path' }, [
      h('el-alert', {
        title: '用户路径分析',
        type: 'info',
        description: '分析用户在应用中的导航路径和页面流转情况',
        'show-icon': true,
        closable: false
      }),
      h('div', {
        style: {
          marginTop: '20px',
          padding: '40px',
          textAlign: 'center',
          color: '#8c8c8c'
        }
      }, '用户路径分析功能开发中...')
    ])
  }
})

const behaviorStore = useBehaviorStore()
const { startBehaviorTracking, stopBehaviorTracking } = useBehaviorTracking()

// 响应式数据
const isTracking = ref(true)
const activeTab = ref('analytics')
const filterEventType = ref('')
const filterPage = ref('')
const filterTimeRange = ref<[Date, Date] | null>(null)

// 计算属性
const behaviorStats = computed(() => behaviorStore.behaviorStats)
const pageViews = computed(() => behaviorStore.pageViews)
const activeSessions = computed(() => behaviorStore.sessions.length)

const currentFilters = computed(() => {
  const filters: any = {}
  
  if (filterEventType.value) {
    filters.eventType = filterEventType.value
  }
  
  if (filterPage.value) {
    filters.page = filterPage.value
  }
  
  if (filterTimeRange.value && filterTimeRange.value.length === 2) {
    filters.startTime = filterTimeRange.value[0].getTime()
    filters.endTime = filterTimeRange.value[1].getTime()
  }
  
  return filters
})

// 方法
const toggleTracking = (value: boolean) => {
  if (value) {
    startBehaviorTracking()
    ElMessage.success('用户行为追踪已启动')
  } else {
    stopBehaviorTracking()
    ElMessage.info('用户行为追踪已暂停')
  }
}

const generateReport = () => {
  const reportData = {
    stats: behaviorStats.value,
    pageViews: pageViews.value,
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `behavior-report-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('行为分析报告已生成')
}

const getEventsStatus = (count: number) => {
  if (count > 1000) return 'good'
  if (count > 100) return 'warning'
  return 'error'
}

const getSessionStatus = (duration: number) => {
  if (duration > 300000) return 'good' // 5分钟以上
  if (duration > 60000) return 'warning' // 1分钟以上
  return 'error'
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  return `${Math.round(ms / 3600000)}h`
}

const applyFilters = () => {
  // 应用过滤器逻辑
  ElMessage.info('过滤器已应用')
}

const clearFilters = () => {
  filterEventType.value = ''
  filterPage.value = ''
  filterTimeRange.value = null
  ElMessage.info('过滤器已清空')
}

onMounted(() => {
  if (!isTracking.value) {
    startBehaviorTracking()
  }
})
</script>

<style scoped>
.user-behavior-view {
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

.stats-cards {
  margin-bottom: 24px;
}

.filter-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #262626;
}

.filter-row {
  margin: 0;
}

.behavior-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style>