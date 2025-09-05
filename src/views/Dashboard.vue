<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><House /></el-icon>
        控制台总览
      </h2>
      <p class="page-description">
        前端告警系统实时监控面板 - 用于演示性能监控、错误追踪和用户行为分析
      </p>
    </div>
    
    <!-- 系统状态卡片 -->
    <el-row :gutter="24" class="status-cards">
      <el-col :span="6">
        <StatusCard
          title="性能评分"
          :value="performanceScore"
          :status="getPerformanceStatus(performanceScore)"
          icon="TrendCharts"
          :trend="performanceTrend"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="错误数量"
          :value="totalErrors"
          :status="getErrorStatus(totalErrors)"
          icon="WarningFilled"
          :trend="errorTrend"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="活跃用户"
          :value="activeUsers"
          status="normal"
          icon="User"
          :trend="userTrend"
        />
      </el-col>
      <el-col :span="6">
        <StatusCard
          title="告警规则"
          :value="activeRules"
          status="normal"
          icon="Bell"
          :trend="0"
        />
      </el-col>
    </el-row>
    
    <!-- 实时监控图表 -->
    <el-row :gutter="24" class="charts-section">
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                性能指标趋势
              </span>
              <el-button-group size="small">
                <el-button 
                  v-for="period in timePeriods" 
                  :key="period.value"
                  :type="selectedPeriod === period.value ? 'primary' : 'default'"
                  @click="selectedPeriod = period.value"
                >
                  {{ period.label }}
                </el-button>
              </el-button-group>
            </div>
          </template>
          <PerformanceChart :period="selectedPeriod" />
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><WarningFilled /></el-icon>
                错误统计
              </span>
              <el-switch
                v-model="showOnlyErrors"
                active-text="仅显示错误"
                inactive-text="显示全部"
                size="small"
              />
            </div>
          </template>
          <ErrorChart :show-only-errors="showOnlyErrors" />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 详细信息面板 -->
    <el-row :gutter="24" class="info-section">
      <el-col :span="8">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><List /></el-icon>
                最新错误
              </span>
              <router-link to="/errors/logs">
                <el-button type="primary" link size="small">查看全部</el-button>
              </router-link>
            </div>
          </template>
          <RecentErrors :limit="5" />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataAnalysis /></el-icon>
                用户行为
              </span>
              <router-link to="/behavior/analytics">
                <el-button type="primary" link size="small">详细分析</el-button>
              </router-link>
            </div>
          </template>
          <BehaviorSummary />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Bell /></el-icon>
                告警活动
              </span>
              <router-link to="/settings">
                <el-button type="primary" link size="small">配置规则</el-button>
              </router-link>
            </div>
          </template>
          <AlertActivity />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快速操作区域 -->
    <el-card class="quick-actions" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><MagicStick /></el-icon>
            快速演示
          </span>
          <el-tag type="info" size="small">教学功能</el-tag>
        </div>
      </template>
      
      <div class="action-buttons">
        <el-button-group>
          <el-button type="primary" @click="triggerPerformanceDemo">
            <el-icon><TrendCharts /></el-icon>
            性能演示
          </el-button>
          <el-button type="warning" @click="triggerErrorDemo">
            <el-icon><WarningFilled /></el-icon>
            错误演示
          </el-button>
          <el-button type="info" @click="triggerBehaviorDemo">
            <el-icon><User /></el-icon>
            行为演示
          </el-button>
        </el-button-group>
        
        <el-divider direction="vertical" />
        
        <el-button-group>
          <el-button @click="clearAllData" :loading="clearing">
            <el-icon><Delete /></el-icon>
            清空数据
          </el-button>
          <el-button @click="generateReport">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
        </el-button-group>
      </div>
      
      <el-alert
        class="demo-notice"
        title="演示说明"
        type="info"
        :closable="false"
        show-icon
      >
        <p>这是一个用于内部培训的前端告警系统演示。您可以通过上方按钮触发各种演示功能：</p>
        <ul>
          <li><strong>性能演示</strong>：模拟慢任务、网络延迟等性能问题</li>
          <li><strong>错误演示</strong>：模拟JavaScript错误、网络错误等</li>
          <li><strong>行为演示</strong>：模拟用户点击、滚动等行为数据</li>
        </ul>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  House, 
  TrendCharts, 
  WarningFilled, 
  User, 
  Bell,
  List,
  DataAnalysis,
  MagicStick,
  Delete,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  usePerformanceStore, 
  useErrorStore, 
  useBehaviorStore, 
  useAlertStore 
} from '@/stores'
import { usePerformanceMonitoring } from '@/composables'

// 导入组件
import StatusCard from '@/components/StatusCard.vue'
import PerformanceChart from '@/components/PerformanceChart.vue'
import ErrorChart from '@/components/ErrorChart.vue'
import RecentErrors from '@/components/RecentErrors.vue'
import BehaviorSummary from '@/components/BehaviorSummary.vue'
import AlertActivity from '@/components/AlertActivity.vue'

const performanceStore = usePerformanceStore()
const errorStore = useErrorStore()
const behaviorStore = useBehaviorStore()
const alertStore = useAlertStore()
const { simulateSlowTask, simulateNetworkDelay, simulateLayoutShift } = usePerformanceMonitoring()

// 响应式数据
const selectedPeriod = ref('1h')
const showOnlyErrors = ref(false)
const clearing = ref(false)

// 时间周期选项
const timePeriods = [
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '24小时', value: '24h' },
  { label: '7天', value: '7d' }
]

// 计算属性
const performanceScore = computed(() => performanceStore.performanceScore)
const totalErrors = computed(() => errorStore.errors.length)
const activeUsers = computed(() => behaviorStore.sessions.length)
const activeRules = computed(() => alertStore.activeRules.length)

// 趋势数据（模拟）
const performanceTrend = computed(() => {
  const score = performanceScore.value
  if (score >= 80) return 5
  if (score >= 60) return 0
  return -8
})

const errorTrend = computed(() => {
  const errors = totalErrors.value
  if (errors === 0) return 0
  if (errors < 5) return 2
  return 15
})

const userTrend = computed(() => {
  return Math.floor(Math.random() * 10) - 5
})

// 状态判断函数
const getPerformanceStatus = (score: number) => {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warning'
  return 'error'
}

const getErrorStatus = (errors: number) => {
  if (errors === 0) return 'good'
  if (errors < 5) return 'warning'
  return 'error'
}

// 演示功能
const triggerPerformanceDemo = async () => {
  ElMessage.info('🎭 开始性能演示...')
  
  try {
    // 模拟慢任务
    await simulateSlowTask(800)
    
    // 模拟网络延迟
    simulateNetworkDelay()
    
    // 模拟布局偏移
    setTimeout(() => {
      simulateLayoutShift()
    }, 1000)
    
    ElMessage.success('✅ 性能演示完成！查看性能监控页面查看详情')
  } catch (error) {
    ElMessage.error('❌ 性能演示失败')
  }
}

const triggerErrorDemo = () => {
  ElMessage.info('🎭 开始错误演示...')
  
  // 模拟不同类型的错误
  errorStore.simulateJSError()
  
  setTimeout(() => {
    errorStore.simulateNetworkError()
  }, 500)
  
  setTimeout(() => {
    errorStore.simulateResourceError()
  }, 1000)
  
  ElMessage.success('✅ 错误演示完成！查看错误追踪页面查看详情')
}

const triggerBehaviorDemo = () => {
  ElMessage.info('🎭 开始行为演示...')
  
  behaviorStore.simulateUserBehavior()
  
  ElMessage.success('✅ 行为演示完成！查看用户行为页面查看详情')
}

const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有监控数据吗？此操作不可恢复。',
      '清空数据',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    clearing.value = true
    
    // 清空各种数据
    performanceStore.clearMetrics()
    errorStore.clearErrors()
    behaviorStore.clearEvents()
    alertStore.clearNotifications()
    
    setTimeout(() => {
      clearing.value = false
      ElMessage.success('✅ 数据已清空')
    }, 1000)
    
  } catch {
    // 用户取消
  }
}

const generateReport = () => {
  ElMessage.info('📊 报告生成功能待开发...')
  // 这里可以实现报告生成功能
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
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

.status-cards {
  margin-bottom: 24px;
}

.charts-section {
  margin-bottom: 24px;
}

.info-section {
  margin-bottom: 24px;
}

.chart-card,
.info-card {
  height: 400px;
}

.chart-card .el-card__body,
.info-card .el-card__body {
  height: calc(100% - 60px);
  padding: 20px;
}

.quick-actions {
  margin-bottom: 0;
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
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.demo-notice {
  margin: 0;
}

.demo-notice ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.demo-notice li {
  margin-bottom: 4px;
  line-height: 1.5;
}
</style>