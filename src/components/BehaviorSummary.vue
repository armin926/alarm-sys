<template>
  <div class="behavior-summary">
    <div class="summary-stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalEvents }}</div>
        <div class="stat-label">总事件数</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ stats.uniqueElements }}</div>
        <div class="stat-label">交互元素</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ formatDuration(stats.sessionDuration) }}</div>
        <div class="stat-label">会话时长</div>
      </div>
    </div>
    
    <el-divider />
    
    <div class="event-types">
      <h5 class="section-title">事件类型分布</h5>
      <div class="type-list">
        <div 
          v-for="(count, type) in stats.byType" 
          :key="type"
          class="type-item"
        >
          <div class="type-info">
            <span class="type-name">{{ getEventTypeLabel(type) }}</span>
            <span class="type-count">{{ count }}</span>
          </div>
          <div class="type-progress">
            <div 
              class="progress-bar"
              :style="{ width: getPercentage(count, stats.totalEvents) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <el-divider />
    
    <div class="popular-elements">
      <h5 class="section-title">热门交互元素</h5>
      <div class="element-list">
        <div 
          v-for="(element, index) in popularElements.slice(0, 5)" 
          :key="element.element"
          class="element-item"
        >
          <div class="element-rank">{{ index + 1 }}</div>
          <div class="element-info">
            <div class="element-name">{{ element.element }}</div>
            <div class="element-count">{{ element.count }} 次点击</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="stats.totalEvents === 0" class="empty-state">
      <el-empty 
        description="暂无用户行为数据" 
        :image-size="80"
      >
        <el-button type="primary" @click="simulateData">
          生成演示数据
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBehaviorStore } from '@/stores'

const behaviorStore = useBehaviorStore()

const stats = computed(() => behaviorStore.behaviorStats)
const popularElements = computed(() => behaviorStore.popularElements)

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    click: '点击',
    scroll: '滚动',
    input: '输入',
    navigation: '导航',
    hover: '悬停',
    focus: '聚焦'
  }
  return labels[type] || type
}

const getPercentage = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  return `${Math.round(ms / 3600000)}h`
}

const simulateData = () => {
  behaviorStore.simulateUserBehavior()
}
</script>

<style scoped>
.behavior-summary {
  height: 100%;
  overflow-y: auto;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-name {
  font-size: 13px;
  color: #262626;
}

.type-count {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.type-progress {
  height: 4px;
  background-color: #f5f5f5;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s ease;
}

.element-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.element-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
}

.element-rank {
  width: 20px;
  height: 20px;
  background-color: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.element-info {
  flex: 1;
}

.element-name {
  font-size: 13px;
  color: #262626;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.element-count {
  font-size: 11px;
  color: #8c8c8c;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>