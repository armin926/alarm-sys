<template>
  <div class="error-tracking-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <el-icon><WarningFilled /></el-icon>
          错误追踪
        </h2>
        <p class="page-description">
          实时监控和分析应用错误，包括JavaScript错误、网络错误和资源加载错误
        </p>
      </div>
      <div class="header-actions">
        <el-switch
          v-model="isTracking"
          active-text="追踪中"
          inactive-text="已暂停"
          @change="toggleTracking"
        />
        <el-button @click="clearAllErrors">
          <el-icon><Delete /></el-icon>
          清空错误
        </el-button>
      </div>
    </div>

    <!-- 错误统计卡片 -->
    <el-row :gutter="24" class="stats-cards">
      <el-col :span="6">
        <ErrorStatCard
          title="总错误数"
          :value="errorStats.total"
          :status="getErrorStatus(errorStats.total)"
          icon="WarningFilled"
          color="#f5222d"
        />
      </el-col>
      <el-col :span="6">
        <ErrorStatCard
          title="严重错误"
          :value="criticalErrors.length"
          status="error"
          icon="CircleCloseFilled"
          color="#ff4d4f"
        />
      </el-col>
      <el-col :span="6">
        <ErrorStatCard
          title="错误率"
          :value="errorRate"
          unit="/小时"
          :status="getRateStatus(errorRate)"
          icon="DataLine"
          color="#faad14"
        />
      </el-col>
      <el-col :span="6">
        <ErrorStatCard
          title="受影响页面"
          :value="affectedPages"
          :status="getPageStatus(affectedPages)"
          icon="Document"
          color="#1890ff"
        />
      </el-col>
    </el-row>

    <!-- 错误过滤器 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Filter /></el-icon>
            错误过滤器
          </span>
          <el-button size="small" @click="clearFilters">清空过滤</el-button>
        </div>
      </template>
      
      <el-row :gutter="16" class="filter-row">
        <el-col :span="6">
          <el-select 
            v-model="filterType" 
            placeholder="错误类型" 
            clearable
            @change="applyFilters"
          >
            <el-option label="JavaScript错误" value="javascript" />
            <el-option label="网络错误" value="network" />
            <el-option label="资源错误" value="resource" />
            <el-option label="Promise错误" value="promise" />
          </el-select>
        </el-col>
        
        <el-col :span="6">
          <el-select 
            v-model="filterSeverity" 
            placeholder="严重程度" 
            clearable
            @change="applyFilters"
          >
            <el-option label="严重" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-col>
        
        <el-col :span="6">
          <el-input
            v-model="filterKeyword"
            placeholder="关键词搜索"
            clearable
            @input="applyFilters"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        
        <el-col :span="6">
          <el-date-picker
            v-model="filterTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            @change="applyFilters"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" class="error-tabs">
      <el-tab-pane label="错误日志" name="logs">
        <ErrorLogs :filters="currentFilters" />
      </el-tab-pane>
      <el-tab-pane label="错误分析" name="analysis">
        <ErrorAnalysis />
      </el-tab-pane>
      <el-tab-pane label="演示功能" name="demo">
        <ErrorDemo />
      </el-tab-pane>
    </el-tabs>

    <!-- 嵌套路由视图 -->
    <router-view v-if="$route.path !== '/errors'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  WarningFilled, 
  Delete, 
  Filter, 
  Search,
  CircleCloseFilled,
  DataLine,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useErrorStore } from '@/stores'
import { useErrorTracking } from '@/composables'
import type { ErrorFilter } from '@/types'
import ErrorStatCard from '@/components/ErrorStatCard.vue'
import ErrorLogs from '@/components/ErrorLogs.vue'
import ErrorAnalysis from '@/components/ErrorAnalysis.vue'
import ErrorDemo from '@/components/demos/ErrorDemo.vue'

const errorStore = useErrorStore()
const { startErrorTracking, stopErrorTracking } = useErrorTracking()

const activeTab = ref('logs')
const isTracking = ref(true)

// 过滤器状态
const filterType = ref('')
const filterSeverity = ref('')
const filterKeyword = ref('')
const filterTimeRange = ref<[Date, Date] | null>(null)

// 计算属性
const errorStats = computed(() => errorStore.errorStats)
const criticalErrors = computed(() => errorStore.criticalErrors)
const errorRate = computed(() => errorStore.errorRate)

const affectedPages = computed(() => {
  return Object.keys(errorStats.value.byPage).length
})

const currentFilters = computed((): ErrorFilter => {
  const filters: ErrorFilter = {}
  
  if (filterType.value) {
    filters.type = filterType.value as any
  }
  
  if (filterSeverity.value) {
    filters.severity = filterSeverity.value as any
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
    startErrorTracking()
    ElMessage.success('错误追踪已启动')
  } else {
    stopErrorTracking()
    ElMessage.info('错误追踪已暂停')
  }
}

const clearAllErrors = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有错误记录吗？此操作不可恢复。',
      '清空错误',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    errorStore.clearErrors()
    ElMessage.success('错误记录已清空')
  } catch {
    // 用户取消
  }
}

const applyFilters = () => {
  errorStore.setFilter(currentFilters.value)
}

const clearFilters = () => {
  filterType.value = ''
  filterSeverity.value = ''
  filterKeyword.value = ''
  filterTimeRange.value = null
  errorStore.clearFilter()
}

const getErrorStatus = (total: number) => {
  if (total === 0) return 'good'
  if (total < 10) return 'warning'
  return 'error'
}

const getRateStatus = (rate: number) => {
  if (rate < 5) return 'good'
  if (rate < 20) return 'warning'
  return 'error'
}

const getPageStatus = (pages: number) => {
  if (pages === 0) return 'good'
  if (pages < 3) return 'warning'
  return 'error'
}

onMounted(() => {
  if (!isTracking.value) {
    startErrorTracking()
  }
})
</script>

<style scoped>
.error-tracking-view {
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

.error-tabs {
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