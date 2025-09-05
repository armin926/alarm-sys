<template>
  <div class="behavior-demo">
    <el-card>
      <template #header>
        <h3>用户行为演示</h3>
      </template>
      
      <el-alert
        title="用户行为追踪演示"
        description="通过下面的功能可以模拟各种用户行为，观察系统的行为追踪效果"
        type="info"
        show-icon
        :closable="false"
      />
      
      <div class="demo-buttons">
        <el-button type="primary" @click="simulateClick">
          <el-icon><Mouse /></el-icon>
          模拟点击事件
        </el-button>
        
        <el-button type="success" @click="simulateScroll">
          <el-icon><ArrowDown /></el-icon>
          模拟滚动事件
        </el-button>
        
        <el-button type="warning" @click="simulateInput">
          <el-icon><Edit /></el-icon>
          模拟输入事件
        </el-button>
        
        <el-button type="info" @click="simulateNavigation">
          <el-icon><Switch /></el-icon>
          模拟导航事件
        </el-button>
        
        <el-button @click="startSession">
          <el-icon><User /></el-icon>
          开始新会话
        </el-button>
        
        <el-button @click="endSession">
          <el-icon><SwitchButton /></el-icon>
          结束会话
        </el-button>
      </div>
      
      <div class="demo-stats">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-statistic
              title="当前会话事件数"
              :value="currentSessionEvents"
              suffix="个"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="总事件数"
              :value="totalEvents"
              suffix="个"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="活跃会话数"
              :value="activeSessions"
              suffix="个"
              value-style="color: #1890ff"
            />
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <!-- 事件记录 -->
    <el-card style="margin-top: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>最近事件记录</span>
          <el-button size="small" @click="clearEvents">清空记录</el-button>
        </div>
      </template>
      
      <el-table :data="recentEvents" style="width: 100%" size="small" max-height="300">
        <el-table-column label="事件类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getEventTypeTag(row.type)" size="small">
              {{ getEventTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="元素" prop="element" width="150" />
        <el-table-column label="值" prop="value" width="150" />
        <el-table-column label="坐标" width="100">
          <template #default="{ row }">
            <span v-if="row.coordinates">
              ({{ row.coordinates.x }}, {{ row.coordinates.y }})
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="页面" prop="page" width="120" />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Mouse,
  ArrowDown,
  Edit,
  Switch,
  User,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBehaviorStore } from '@/stores'

const behaviorStore = useBehaviorStore()

// 计算属性
const totalEvents = computed(() => behaviorStore.events.length)
const activeSessions = computed(() => behaviorStore.sessions.length)
const currentSessionEvents = computed(() => {
  if (!behaviorStore.currentSession) return 0
  return behaviorStore.currentSession.events.length
})

const recentEvents = computed(() => {
  return behaviorStore.events
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
})

// 方法
const simulateClick = () => {
  const elements = ['按钮', '链接', '菜单项', '图片', '表单字段']
  const element = elements[Math.floor(Math.random() * elements.length)]
  const coordinates = {
    x: Math.floor(Math.random() * 800) + 100,
    y: Math.floor(Math.random() * 600) + 100
  }
  
  behaviorStore.trackClick(element, coordinates, `#${element.toLowerCase()}`)
  ElMessage.success(`模拟点击: ${element}`)
}

const simulateScroll = () => {
  const scrollY = Math.floor(Math.random() * 2000)
  behaviorStore.trackScroll(scrollY)
  ElMessage.success(`模拟滚动: ${scrollY}px`)
}

const simulateInput = () => {
  const inputs = ['用户名', '密码', '邮箱', '搜索框', '评论框']
  const input = inputs[Math.floor(Math.random() * inputs.length)]
  const value = `模拟输入内容_${Date.now().toString().slice(-4)}`
  
  behaviorStore.trackInput(input, value, `#${input}`)
  ElMessage.success(`模拟输入: ${input}`)
}

const simulateNavigation = () => {
  const pages = ['/dashboard', '/performance', '/errors', '/behavior', '/settings']
  const fromPage = location.pathname
  const toPage = pages[Math.floor(Math.random() * pages.length)]
  
  behaviorStore.trackNavigation(fromPage, toPage)
  ElMessage.success(`模拟导航: ${fromPage} → ${toPage}`)
}

const startSession = () => {
  behaviorStore.startSession(`user_${Date.now()}`)
  ElMessage.success('新会话已开始')
}

const endSession = () => {
  behaviorStore.endSession()
  ElMessage.info('当前会话已结束')
}

const clearEvents = () => {
  behaviorStore.clearEvents()
  ElMessage.info('事件记录已清空')
}

const getEventTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    click: 'primary',
    scroll: 'success',
    input: 'warning',
    navigation: 'info',
    hover: 'default',
    focus: 'default'
  }
  return tagMap[type] || 'default'
}

const getEventTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    click: '点击',
    scroll: '滚动',
    input: '输入',
    navigation: '导航',
    hover: '悬停',
    focus: '聚焦'
  }
  return labelMap[type] || type
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}
</script>

<style scoped>
.behavior-demo {
  padding: 0;
}

.demo-buttons {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.demo-stats {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

:deep(.el-table) {
  font-size: 13px;
}
</style>