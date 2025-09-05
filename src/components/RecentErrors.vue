<template>
  <div class="recent-errors">
    <el-empty 
      v-if="recentErrors.length === 0" 
      description="暂无错误记录"
      :image-size="60"
    />
    
    <div v-else class="error-list">
      <div 
        v-for="error in recentErrors" 
        :key="error.id"
        class="error-item"
        @click="showErrorDetail(error)"
      >
        <div class="error-header">
          <div class="error-type">
            <el-tag 
              :type="getSeverityType(error.severity)" 
              size="small"
            >
              {{ getTypeLabel(error.type) }}
            </el-tag>
          </div>
          <div class="error-time">
            {{ formatTime(error.timestamp) }}
          </div>
        </div>
        
        <div class="error-message">
          {{ truncateMessage(error.message) }}
        </div>
        
        <div v-if="error.filename" class="error-location">
          <el-icon size="12"><Document /></el-icon>
          {{ getFileName(error.filename) }}
          <span v-if="error.lineno">:{{ error.lineno }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore" class="load-more">
      <el-button type="primary" link @click="loadMore">
        查看更多错误
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { useErrorStore } from '@/stores'
import type { ErrorEvent } from '@/types'

interface Props {
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10
})

const errorStore = useErrorStore()

const recentErrors = computed(() => 
  errorStore.errors.slice(0, props.limit)
)

const hasMore = computed(() => 
  errorStore.errors.length > props.limit
)

const getSeverityType = (severity: string) => {
  const typeMap: Record<string, string> = {
    critical: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[severity] || 'info'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    javascript: 'JS',
    network: '网络',
    resource: '资源',
    promise: 'Promise'
  }
  return labels[type] || type.toUpperCase()
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return new Date(timestamp).toLocaleString('zh-CN')
  }
}

const truncateMessage = (message: string, maxLength = 80) => {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

const getFileName = (filepath?: string) => {
  if (!filepath) return ''
  return filepath.split('/').pop() || filepath
}

const showErrorDetail = (error: ErrorEvent) => {
  // 这里可以打开错误详情弹窗
  console.log('显示错误详情:', error)
}

const loadMore = () => {
  // 跳转到错误日志页面
  console.log('跳转到错误日志页面')
}
</script>

<style scoped>
.recent-errors {
  height: 100%;
  overflow-y: auto;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-item:hover {
  border-color: #d9d9d9;
  background-color: #fafafa;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.error-time {
  font-size: 12px;
  color: #8c8c8c;
}

.error-message {
  font-size: 13px;
  color: #262626;
  line-height: 1.4;
  margin-bottom: 6px;
  word-break: break-word;
}

.error-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8c8c8c;
}

.load-more {
  text-align: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>