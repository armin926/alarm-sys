<template>
  <div class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <el-icon class="logo-icon"><TrendCharts /></el-icon>
        <span class="logo-text">前端告警系统</span>
      </div>
      
      <!-- 面包屑导航 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item 
          v-for="item in breadcrumbItems" 
          :key="item.path"
          :to="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="navbar-right">
      <!-- 系统状态指示器 -->
      <div class="status-indicators">
        <el-tooltip content="性能监控状态" placement="bottom">
          <div class="status-indicator">
            <el-icon :color="performanceStatus.color">
              <component :is="performanceStatus.icon" />
            </el-icon>
            <span class="status-text">{{ performanceStatus.text }}</span>
          </div>
        </el-tooltip>
        
        <el-tooltip content="错误追踪状态" placement="bottom">
          <div class="status-indicator">
            <el-icon :color="errorStatus.color">
              <component :is="errorStatus.icon" />
            </el-icon>
            <span class="status-text">{{ errorStatus.text }}</span>
          </div>
        </el-tooltip>
      </div>
      
      <!-- 通知铃铛 -->
      <el-badge :value="unreadNotifications" :hidden="unreadNotifications === 0">
        <el-button 
          circle 
          :icon="Bell" 
          @click="toggleNotificationPanel"
          :type="unreadNotifications > 0 ? 'warning' : 'default'"
        />
      </el-badge>
      
      <!-- 用户信息 -->
      <el-dropdown @command="handleUserCommand">
        <div class="user-info">
          <el-avatar size="small" :icon="UserFilled" />
          <span class="username">演示用户</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item command="help">
              <el-icon><QuestionFilled /></el-icon>
              帮助文档
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出系统
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  TrendCharts, 
  Bell, 
  UserFilled, 
  ArrowDown, 
  Setting, 
  QuestionFilled, 
  SwitchButton,
  CircleCheckFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { usePerformanceStore, useErrorStore, useAlertStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const performanceStore = usePerformanceStore()
const errorStore = useErrorStore()
const alertStore = useAlertStore()

// 面包屑导航
const breadcrumbItems = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

// 性能监控状态
const performanceStatus = computed(() => {
  if (!performanceStore.isMonitoring) {
    return { color: '#909399', icon: 'CircleCloseFilled', text: '未启用' }
  }
  
  const score = performanceStore.performanceScore
  if (score >= 80) {
    return { color: '#67c23a', icon: 'CircleCheckFilled', text: '良好' }
  } else if (score >= 60) {
    return { color: '#e6a23c', icon: 'WarningFilled', text: '一般' }
  } else {
    return { color: '#f56c6c', icon: 'CircleCloseFilled', text: '较差' }
  }
})

// 错误追踪状态
const errorStatus = computed(() => {
  const criticalErrors = errorStore.criticalErrors.length
  const errorRate = errorStore.errorRate
  
  if (criticalErrors > 0) {
    return { color: '#f56c6c', icon: 'CircleCloseFilled', text: `${criticalErrors}严重` }
  } else if (errorRate > 10) {
    return { color: '#e6a23c', icon: 'WarningFilled', text: '频繁' }
  } else {
    return { color: '#67c23a', icon: 'CircleCheckFilled', text: '正常' }
  }
})

// 未读通知数量
const unreadNotifications = computed(() => 
  alertStore.unacknowledgedNotifications.length
)

const toggleNotificationPanel = () => {
  // 这里可以打开通知面板
  console.log('📬 打开通知面板')
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'help':
      window.open('https://github.com/your-repo/alarm-system', '_blank')
      break
    case 'logout':
      console.log('👋 用户退出系统')
      break
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  background-color: #fff;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.logo-icon {
  font-size: 24px;
}

.breadcrumb {
  margin-left: 16px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicators {
  display: flex;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 12px;
}

.status-text {
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #333;
}
</style>