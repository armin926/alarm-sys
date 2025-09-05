<template>
  <div class="alert-activity">
    <div class="activity-header">
      <div class="alert-count">
        <span class="count-number">{{ notifications.length }}</span>
        <span class="count-label">条告警</span>
      </div>
      
      <div class="unread-count" v-if="unreadCount > 0">
        <el-badge :value="unreadCount" type="danger">
          <el-icon size="16"><Bell /></el-icon>
        </el-badge>
      </div>
    </div>
    
    <el-divider />
    
    <div class="recent-alerts">
      <h5 class="section-title">最近告警</h5>
      
      <el-empty 
        v-if="notifications.length === 0" 
        description="暂无告警记录"
        :image-size="60"
      />
      
      <div v-else class="alert-list">
        <div 
          v-for="notification in recentNotifications" 
          :key="notification.id"
          :class="[
            'alert-item',
            { 'unread': !notification.acknowledged }
          ]"
        >
          <div class="alert-icon">
            <el-icon 
              :color="getSeverityColor(notification.severity)"
              size="16"
            >
              <component :is="getSeverityIcon(notification.severity)" />
            </el-icon>
          </div>
          
          <div class="alert-content">
            <div class="alert-title">{{ notification.title }}</div>
            <div class="alert-message">{{ truncateMessage(notification.message) }}</div>
            <div class="alert-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <el-divider />
    
    <div class="alert-rules">
      <h5 class="section-title">告警规则状态</h5>
      <div class="rule-stats">
        <div class="rule-item">
          <span class="rule-label">总规则数：</span>
          <span class="rule-value">{{ totalRules }}</span>
        </div>
        <div class="rule-item">
          <span class="rule-label">已启用：</span>
          <span class="rule-value active">{{ activeRules }}</span>
        </div>
        <div class="rule-item">
          <span class="rule-label">已禁用：</span>
          <span class="rule-value disabled">{{ disabledRules }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bell, WarningFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { useAlertStore } from '@/stores'
import type { AlertNotification } from '@/types'

const alertStore = useAlertStore()

const notifications = computed(() => alertStore.notifications)
const unreadCount = computed(() => alertStore.unacknowledgedNotifications.length)
const totalRules = computed(() => alertStore.rules.length)
const activeRules = computed(() => alertStore.activeRules.length)
const disabledRules = computed(() => totalRules.value - activeRules.value)

const recentNotifications = computed(() => 
  notifications.value.slice(0, 5)
)

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'CircleCloseFilled'
    case 'medium':
      return 'WarningFilled'
    case 'low':
    default:
      return 'InfoFilled'
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return '#ff4d4f'
    case 'high':
      return '#ff7875'
    case 'medium':
      return '#faad14'
    case 'low':
    default:
      return '#1890ff'
  }
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
    return new Date(timestamp).toLocaleDateString()
  }
}

const truncateMessage = (message: string, maxLength = 50) => {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.alert-activity {
  height: 100%;
  overflow-y: auto;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alert-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.count-number {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.count-label {
  font-size: 14px;
  color: #8c8c8c;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.alert-item:hover {
  background-color: #f5f5f5;
}

.alert-item.unread {
  background-color: #f6ffff;
  border-color: #1890ff;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-message {
  font-size: 12px;
  color: #595959;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.alert-time {
  font-size: 11px;
  color: #8c8c8c;
}

.rule-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-label {
  font-size: 13px;
  color: #595959;
}

.rule-value {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
}

.rule-value.active {
  color: #52c41a;
}

.rule-value.disabled {
  color: #8c8c8c;
}

:deep(.el-divider) {
  margin: 12px 0;
}
</style>