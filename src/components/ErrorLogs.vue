<template>
  <div class="error-logs">
    <!-- 头部操作栏 -->
    <div class="logs-header">
      <div class="header-left">
        <el-statistic
          title="总计错误"
          :value="filteredErrors.length"
          suffix="条"
        />
        <el-statistic
          title="严重错误"
          :value="criticalErrorsCount"
          suffix="条"
          value-style="color: #f56c6c"
        />
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button 
            :type="viewMode === 'table' ? 'primary' : 'default'"
            :icon="List"
            @click="viewMode = 'table'"
          >
            表格视图
          </el-button>
          <el-button 
            :type="viewMode === 'card' ? 'primary' : 'default'"
            :icon="Grid"
            @click="viewMode = 'card'"
          >
            卡片视图
          </el-button>
        </el-button-group>
        
        <el-button @click="exportLogs" :icon="Download">
          导出日志
        </el-button>
        
        <el-button 
          type="danger" 
          @click="clearSelectedErrors"
          :disabled="selectedErrors.length === 0"
          :icon="Delete"
        >
          删除选中
        </el-button>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-view">
      <el-table
        :data="paginatedErrors"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        size="small"
        height="600"
        stripe
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="严重程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSeverityType(row.severity)"
              :effect="row.severity === 'critical' ? 'dark' : 'plain'"
              size="small"
            >
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="错误类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :color="getTypeColor(row.type)"
              effect="light"
              size="small"
            >
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="错误信息" min-width="250">
          <template #default="{ row }">
            <div class="error-message">
              <div class="message-text">{{ truncateText(row.message, 80) }}</div>
              <div class="message-details" v-if="row.filename">
                <el-text type="info" size="small">
                  {{ getFileName(row.filename) }}:{{ row.lineno }}:{{ row.colno }}
                </el-text>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="发生时间" width="160" align="center">
          <template #default="{ row }">
            <div class="time-info">
              <div>{{ formatDate(row.timestamp) }}</div>
              <el-text type="info" size="small">{{ formatTime(row.timestamp) }}</el-text>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="页面" width="150">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ getPageName(row.url) }}</el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button 
                type="primary" 
                :icon="View"
                @click.stop="viewErrorDetail(row)"
                link
              >
                详情
              </el-button>
              <el-button 
                type="danger" 
                :icon="Delete"
                @click.stop="deleteError(row.id)"
                link
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 卡片视图 -->
    <div v-else class="card-view">
      <div class="error-cards" v-loading="loading">
        <el-card
          v-for="error in paginatedErrors"
          :key="error.id"
          class="error-card"
          shadow="hover"
          @click="viewErrorDetail(error)"
        >
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-checkbox 
                  :model-value="selectedErrors.includes(error.id)"
                  @change="toggleErrorSelection(error.id)"
                  @click.stop
                />
                <el-tag 
                  :type="getSeverityType(error.severity)"
                  :effect="error.severity === 'critical' ? 'dark' : 'plain'"
                  size="small"
                >
                  {{ getSeverityLabel(error.severity) }}
                </el-tag>
                <el-tag 
                  :color="getTypeColor(error.type)"
                  effect="light"
                  size="small"
                >
                  {{ getTypeLabel(error.type) }}
                </el-tag>
              </div>
              <div class="header-right">
                <el-text type="info" size="small">{{ formatTime(error.timestamp) }}</el-text>
              </div>
            </div>
          </template>
          
          <div class="card-content">
            <div class="error-message">{{ error.message }}</div>
            <div class="error-location" v-if="error.filename">
              <el-icon><Document /></el-icon>
              <span>{{ getFileName(error.filename) }}:{{ error.lineno }}:{{ error.colno }}</span>
            </div>
            <div class="error-url">
              <el-icon><Link /></el-icon>
              <span>{{ getPageName(error.url) }}</span>
            </div>
          </div>
          
          <template #footer>
            <div class="card-actions">
              <el-button size="small" @click.stop="viewErrorDetail(error)">
                查看详情
              </el-button>
              <el-button size="small" type="danger" @click.stop="deleteError(error.id)">
                删除
              </el-button>
            </div>
          </template>
        </el-card>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredErrors.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>

    <!-- 错误详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="错误详情"
      size="50%"
      direction="rtl"
    >
      <div v-if="selectedError" class="error-detail">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="错误ID">{{ selectedError.id }}</el-descriptions-item>
          <el-descriptions-item label="错误类型">
            <el-tag :color="getTypeColor(selectedError.type)" effect="light">
              {{ getTypeLabel(selectedError.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityType(selectedError.severity)">
              {{ getSeverityLabel(selectedError.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ formatDateTime(selectedError.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="页面URL" :span="2">{{ selectedError.url }}</el-descriptions-item>
          <el-descriptions-item label="用户代理" :span="2">{{ selectedError.userAgent }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <div class="error-message-section">
          <h4>错误信息</h4>
          <el-card class="message-card">
            <div class="error-text">{{ selectedError.message }}</div>
          </el-card>
        </div>
        
        <div v-if="selectedError.stack" class="stack-trace-section">
          <h4>堆栈跟踪</h4>
          <el-card class="stack-card">
            <pre class="stack-trace">{{ selectedError.stack }}</pre>
          </el-card>
        </div>
        
        <div v-if="selectedError.filename" class="location-section">
          <h4>错误位置</h4>
          <el-card class="location-card">
            <div class="location-info">
              <div><strong>文件：</strong>{{ selectedError.filename }}</div>
              <div><strong>行号：</strong>{{ selectedError.lineno }}</div>
              <div><strong>列号：</strong>{{ selectedError.colno }}</div>
            </div>
          </el-card>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, watch } from 'vue'
import {
  List,
  Grid,
  Download,
  Delete,
  View,
  Document,
  Link
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useErrorStore } from '@/stores'
import type { ErrorEvent, ErrorFilter } from '@/types'

// Props
interface Props {
  filters?: ErrorFilter
}

const props = defineProps<Props>()

// Store
const errorStore = useErrorStore()

// 响应式数据
const loading = ref(false)
const viewMode = ref<'table' | 'card'>('table')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedErrors = ref<string[]>([])
const detailDrawerVisible = ref(false)
const selectedError = ref<ErrorEvent | null>(null)

// 计算属性
const filteredErrors = computed(() => {
  if (!props.filters) {
    return errorStore.errors
  }
  return errorStore.getFilteredErrors()
})

const criticalErrorsCount = computed(() => {
  return filteredErrors.value.filter(error => error.severity === 'critical').length
})

const paginatedErrors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredErrors.value.slice(start, end)
})

// 方法
const getSeverityType = (severity: string) => {
  const typeMap: Record<string, string> = {
    critical: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[severity] || 'info'
}

const getSeverityLabel = (severity: string) => {
  const labelMap: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labelMap[severity] || severity
}

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    javascript: '#f56c6c',
    promise: '#e6a23c',
    resource: '#409eff',
    network: '#67c23a'
  }
  return colorMap[type] || '#909399'
}

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    javascript: 'JS错误',
    promise: 'Promise',
    resource: '资源',
    network: '网络'
  }
  return labelMap[type] || type
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getFileName = (path: string) => {
  return path.split('/').pop() || path
}

const getPageName = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleSelectionChange = (selection: ErrorEvent[]) => {
  selectedErrors.value = selection.map(error => error.id)
}

const toggleErrorSelection = (errorId: string) => {
  const index = selectedErrors.value.indexOf(errorId)
  if (index > -1) {
    selectedErrors.value.splice(index, 1)
  } else {
    selectedErrors.value.push(errorId)
  }
}

const handleRowClick = (row: ErrorEvent) => {
  viewErrorDetail(row)
}

const viewErrorDetail = (error: ErrorEvent) => {
  selectedError.value = error
  detailDrawerVisible.value = true
}

const deleteError = async (errorId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条错误记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    errorStore.removeError(errorId)
    ElMessage.success('错误记录已删除')
  } catch {
    // 用户取消
  }
}

const clearSelectedErrors = async () => {
  if (selectedErrors.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedErrors.value.length} 条错误记录吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    selectedErrors.value.forEach(errorId => {
      errorStore.removeError(errorId)
    })
    
    selectedErrors.value = []
    ElMessage.success('批量删除成功')
  } catch {
    // 用户取消
  }
}

const exportLogs = () => {
  const csvContent = generateCSV([...filteredErrors.value])
  downloadCSV(csvContent, 'error-logs.csv')
  ElMessage.success('错误日志导出成功')
}

const generateCSV = (errors: ErrorEvent[]): string => {
  const headers = ['ID', '类型', '严重程度', '错误信息', '文件名', '行号', '列号', '时间', '页面URL']
  const rows = errors.map(error => [
    error.id,
    getTypeLabel(error.type),
    getSeverityLabel(error.severity),
    error.message.replace(/"/g, '""'),
    error.filename || '',
    error.lineno || '',
    error.colno || '',
    formatDateTime(error.timestamp),
    error.url
  ])
  
  const csvRows = [headers, ...rows]
  return csvRows.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 监听过滤器变化
watch(
  () => props.filters,
  () => {
    currentPage.value = 1
  },
  { deep: true }
)
</script>

<style scoped>
.error-logs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-view {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.error-message {
  line-height: 1.4;
}

.message-text {
  font-weight: 500;
  color: #262626;
}

.message-details {
  margin-top: 4px;
}

.time-info {
  text-align: center;
}

.card-view {
  flex: 1;
  overflow-y: auto;
}

.error-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  padding: 16px;
}

.error-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
}

.card-content {
  margin: 12px 0;
}

.error-message {
  font-weight: 500;
  margin-bottom: 8px;
  color: #262626;
  word-break: break-word;
}

.error-location,
.error-url {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

.error-detail {
  padding: 16px;
}

.error-message-section,
.stack-trace-section,
.location-section {
  margin-bottom: 24px;
}

.error-message-section h4,
.stack-trace-section h4,
.location-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.message-card,
.stack-card,
.location-card {
  background: #fafafa;
}

.error-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #d32f2f;
  word-break: break-word;
}

.stack-trace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #595959;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  overflow-x: auto;
}

.location-info {
  font-size: 14px;
  line-height: 1.6;
}

.location-info > div {
  margin-bottom: 8px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-drawer__body) {
  padding: 0;
}
</style>