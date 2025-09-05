<template>
  <div class="error-stat-card">
    <div class="card-header">
      <div class="card-icon" :style="{ backgroundColor: color + '20', color: color }">
        <el-icon size="20">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <div class="card-info">
        <div class="card-title">{{ title }}</div>
        <div class="card-value" :class="`status-${status}`">
          {{ displayValue }}
        </div>
        <div v-if="status !== 'normal'" class="card-status">
          <el-icon size="12">
            <component :is="getStatusIcon()" />
          </el-icon>
          {{ getStatusText() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  CheckCircleFilled, 
  WarningFilled, 
  XCircleFilled,
  WarningFilled as WarningFilledIcon,
  CircleCloseFilled,
  DataLine,
  Document
} from '@element-plus/icons-vue'

interface Props {
  title: string
  value?: number | string
  unit?: string
  status: 'good' | 'warning' | 'error' | 'normal'
  icon: string
  color: string
}

const props = defineProps<Props>()

// 图标映射
const iconMap: Record<string, any> = {
  'WarningFilled': WarningFilledIcon,
  'CircleCloseFilled': CircleCloseFilled,
  'DataLine': DataLine,
  'Document': Document,
  'CheckCircleFilled': CheckCircleFilled,
  'XCircleFilled': XCircleFilled
}

const iconComponent = computed(() => {
  return iconMap[props.icon] || WarningFilledIcon
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    const formatted = props.value >= 1000 
      ? (props.value / 1000).toFixed(1) + 'k'
      : props.value.toString()
    return props.unit ? `${formatted}${props.unit}` : formatted
  }
  
  return props.value || '--'
})

const getStatusIcon = () => {
  switch (props.status) {
    case 'good':
      return CheckCircleFilled
    case 'warning':
      return WarningFilled
    case 'error':
      return XCircleFilled
    default:
      return CheckCircleFilled
  }
}

const getStatusText = () => {
  switch (props.status) {
    case 'good':
      return '正常'
    case 'warning':
      return '警告'
    case 'error':
      return '异常'
    default:
      return '正常'
  }
}
</script>

<style scoped>
.error-stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 120px;
}

.error-stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  height: 100%;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.card-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 400;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px;
}

.status-good {
  color: #52c41a;
}

.status-warning {
  color: #faad14;
}

.status-error {
  color: #ff4d4f;
}

.status-normal {
  color: #262626;
}

.card-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.card-status.status-good {
  color: #52c41a;
}

.card-status.status-warning {
  color: #faad14;
}

.card-status.status-error {
  color: #ff4d4f;
}
</style>