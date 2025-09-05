<template>
  <div class="status-card">
    <div class="card-header">
      <div class="card-icon" :class="`icon-${status}`">
        <el-icon size="24">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <div class="card-info">
        <div class="card-title">{{ title }}</div>
        <div class="card-value" :class="`value-${status}`">
          {{ formattedValue }}
        </div>
        <div v-if="trend !== 0" class="card-trend">
          <span :class="getTrendClass()">
            <el-icon size="12">
              <component :is="getTrendIcon()" />
            </el-icon>
            {{ Math.abs(trend) }}%
          </span>
          <span class="trend-text">较上期</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ArrowUp, 
  ArrowDown, 
  Minus,
  DataAnalysis,
  User,
  Clock,
  Grid,
  Warning,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'

interface Props {
  title: string
  value: number | string
  status: 'good' | 'warning' | 'error' | 'normal'
  icon: string
  trend: number // 正数表示上升，负数表示下降
}

const props = defineProps<Props>()

// 图标映射
const iconMap: Record<string, any> = {
  'DataAnalysis': DataAnalysis,
  'User': User,
  'Clock': Clock,
  'Grid': Grid,
  'Warning': Warning,
  'CheckCircleFilled': CircleCheckFilled,
  'XCircleFilled': CircleCloseFilled,
  'ArrowUp': ArrowUp,
  'ArrowDown': ArrowDown,
  'Minus': Minus
}

const iconComponent = computed(() => {
  return iconMap[props.icon] || DataAnalysis
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'k'
    }
    return props.value.toString()
  }
  return props.value
})

const getTrendClass = () => {
  if (props.trend > 0) return 'trend-up'
  if (props.trend < 0) return 'trend-down'
  return 'trend-neutral'
}

const getTrendIcon = () => {
  if (props.trend > 0) return ArrowUp
  if (props.trend < 0) return ArrowDown
  return Minus
}
</script>

<style scoped>
.status-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.status-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-good {
  background-color: #f6ffed;
  color: #52c41a;
}

.icon-warning {
  background-color: #fffbe6;
  color: #faad14;
}

.icon-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.icon-normal {
  background-color: #f0f5ff;
  color: #1890ff;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 400;
}

.card-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px;
}

.value-good {
  color: #52c41a;
}

.value-warning {
  color: #faad14;
}

.value-error {
  color: #ff4d4f;
}

.value-normal {
  color: #262626;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-up {
  color: #52c41a;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-down {
  color: #ff4d4f;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-neutral {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-text {
  color: #8c8c8c;
}

/* 状态边框 */
.status-card:has(.icon-good) {
  border-left-color: #52c41a;
}

.status-card:has(.icon-warning) {
  border-left-color: #faad14;
}

.status-card:has(.icon-error) {
  border-left-color: #ff4d4f;
}

.status-card:has(.icon-normal) {
  border-left-color: #1890ff;
}
</style>