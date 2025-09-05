<template>
  <div class="settings-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <el-icon><Setting /></el-icon>
          告警配置
        </h2>
        <p class="page-description">
          配置系统的告警规则、通知方式和阈值设置，确保及时发现和处理问题
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="saveAllSettings">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button @click="resetSettings">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 告警规则 -->
      <el-tab-pane label="告警规则" name="rules">
        <div class="rules-section">
          <div class="section-header">
            <h3>告警规则管理</h3>
            <el-button type="primary" @click="showAddRuleDialog">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
          </div>
          
          <el-table :data="alertRules" style="width: 100%">
            <el-table-column label="规则名称" prop="name" min-width="150" />
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getRuleTypeTag(row.type)">{{ getRuleTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="条件" prop="condition" min-width="200" />
            <el-table-column label="阈值" prop="threshold" width="100" align="center" />
            <el-table-column label="严重程度" width="120">
              <template #default="{ row }">
                <el-tag :type="getSeverityTag(row.severity)">{{ getSeverityLabel(row.severity) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.enabled" 
                  @change="updateRuleStatus(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="editRule(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteRule(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 通知设置 -->
      <el-tab-pane label="通知设置" name="notifications">
        <div class="notifications-section">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>通知方式</span>
                </template>
                <el-form label-width="120px">
                  <el-form-item label="启用通知">
                    <el-switch v-model="notificationConfig.enableNotifications" />
                  </el-form-item>
                  <el-form-item label="通知方式">
                    <el-checkbox-group v-model="notificationConfig.notificationMethods">
                      <el-checkbox label="browser">浏览器通知</el-checkbox>
                      <el-checkbox label="console">控制台输出</el-checkbox>
                      <el-checkbox label="webhook">Webhook</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                  <el-form-item label="Webhook URL" v-if="notificationConfig.notificationMethods.includes('webhook')">
                    <el-input v-model="notificationConfig.webhookUrl" placeholder="请输入Webhook URL" />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>静默时间</span>
                </template>
                <el-form label-width="120px">
                  <el-form-item label="开始时间">
                    <el-time-select
                      v-model="notificationConfig.silentHours.start"
                      start="00:00"
                      step="01:00"
                      end="23:00"
                      placeholder="选择开始时间"
                    />
                  </el-form-item>
                  <el-form-item label="结束时间">
                    <el-time-select
                      v-model="notificationConfig.silentHours.end"
                      start="01:00"
                      step="01:00"
                      end="23:59"
                      placeholder="选择结束时间"
                    />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 性能阈值 -->
      <el-tab-pane label="性能阈值" name="performance">
        <div class="performance-section">
          <el-card>
            <template #header>
              <span>性能指标阈值设置</span>
            </template>
            <el-form :model="performanceThresholds" label-width="200px">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="FCP (首次内容绘制)">
                    <el-input-number v-model="performanceThresholds.fcp" :min="500" :max="10000" :step="100" />
                    <span class="unit">ms</span>
                  </el-form-item>
                  <el-form-item label="LCP (最大内容绘制)">
                    <el-input-number v-model="performanceThresholds.lcp" :min="1000" :max="15000" :step="100" />
                    <span class="unit">ms</span>
                  </el-form-item>
                  <el-form-item label="FID (首次输入延迟)">
                    <el-input-number v-model="performanceThresholds.fid" :min="50" :max="1000" :step="10" />
                    <span class="unit">ms</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="CLS (累计布局偏移)">
                    <el-input-number v-model="performanceThresholds.cls" :min="0.1" :max="1" :step="0.1" :precision="1" />
                  </el-form-item>
                  <el-form-item label="TTFB (首字节时间)">
                    <el-input-number v-model="performanceThresholds.ttfb" :min="200" :max="5000" :step="100" />
                    <span class="unit">ms</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 错误设置 -->
      <el-tab-pane label="错误设置" name="error">
        <div class="error-section">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>错误追踪配置</span>
                </template>
                <el-form label-width="150px">
                  <el-form-item label="JavaScript错误">
                    <el-switch v-model="errorConfig.enableJSError" />
                  </el-form-item>
                  <el-form-item label="Promise错误">
                    <el-switch v-model="errorConfig.enablePromiseError" />
                  </el-form-item>
                  <el-form-item label="资源加载错误">
                    <el-switch v-model="errorConfig.enableResourceError" />
                  </el-form-item>
                  <el-form-item label="网络请求错误">
                    <el-switch v-model="errorConfig.enableNetworkError" />
                  </el-form-item>
                  <el-form-item label="自动上报">
                    <el-switch v-model="errorConfig.autoReport" />
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>错误限制设置</span>
                </template>
                <el-form label-width="150px">
                  <el-form-item label="最大错误数">
                    <el-input-number v-model="errorConfig.maxErrors" :min="50" :max="1000" :step="50" />
                  </el-form-item>
                  <el-form-item label="错误率阈值">
                    <el-input-number v-model="errorRateThreshold" :min="1" :max="100" />
                    <span class="unit">个/小时</span>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="editingRule ? '编辑规则' : '新增规则'" width="600px">
      <el-form ref="ruleFormRef" :model="ruleForm" label-width="120px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="ruleForm.type" placeholder="选择规则类型">
            <el-option label="性能监控" value="performance" />
            <el-option label="错误追踪" value="error" />
            <el-option label="用户行为" value="behavior" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件" prop="condition">
          <el-input v-model="ruleForm.condition" placeholder="如: fcp > 3000" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number v-model="ruleForm.threshold" :min="0" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="ruleForm.severity" placeholder="选择严重程度">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="严重" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Setting, Check, RefreshLeft, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAlertStore, usePerformanceStore, useErrorStore } from '@/stores'
import type { AlertRule } from '@/types'

const alertStore = useAlertStore()
const performanceStore = usePerformanceStore()
const errorStore = useErrorStore()

// 响应式数据
const activeTab = ref('rules')
const ruleDialogVisible = ref(false)
const editingRule = ref<AlertRule | null>(null)
const ruleFormRef = ref()

// 表单数据
const ruleForm = ref({
  name: '',
  type: 'performance' as 'performance' | 'error' | 'behavior',
  condition: '',
  threshold: 0,
  severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  enabled: true
})

// 配置数据
const notificationConfig = ref({
  enableNotifications: alertStore.config.enableNotifications,
  notificationMethods: [...alertStore.config.notificationMethods] as ('browser' | 'console' | 'webhook')[],
  webhookUrl: alertStore.config.webhookUrl || '',
  silentHours: {
    start: alertStore.config.silentHours?.start || '22:00',
    end: alertStore.config.silentHours?.end || '08:00'
  }
})
const performanceThresholds = ref({ fcp: 3000, lcp: 4000, fid: 100, cls: 0.1, ttfb: 800 })
const errorConfig = ref({ ...errorStore.config })
const errorRateThreshold = ref(10)

// 计算属性
const alertRules = computed(() => alertStore.rules)

// 方法
const getRuleTypeTag = (type: string) => {
  const tagMap: Record<string, string> = { performance: 'success', error: 'danger', behavior: 'warning' }
  return tagMap[type] || 'info'
}

const getRuleTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = { performance: '性能监控', error: '错误追踪', behavior: '用户行为' }
  return labelMap[type] || type
}

const getSeverityTag = (severity: string) => {
  const tagMap: Record<string, string> = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
  return tagMap[severity] || 'info'
}

const getSeverityLabel = (severity: string) => {
  const labelMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return labelMap[severity] || severity
}

const showAddRuleDialog = () => {
  editingRule.value = null
  ruleForm.value = { name: '', type: 'performance', condition: '', threshold: 0, severity: 'medium', enabled: true }
  ruleDialogVisible.value = true
}

const editRule = (rule: AlertRule) => {
  editingRule.value = rule
  ruleForm.value = { name: rule.name, type: rule.type, condition: rule.condition, threshold: rule.threshold, severity: rule.severity, enabled: rule.enabled }
  ruleDialogVisible.value = true
}

const saveRule = () => {
  if (editingRule.value) {
    alertStore.updateRule(editingRule.value.id, ruleForm.value)
    ElMessage.success('规则已更新')
  } else {
    alertStore.addRule(ruleForm.value)
    ElMessage.success('规则已添加')
  }
  ruleDialogVisible.value = false
}

const deleteRule = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条规则吗？', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    alertStore.deleteRule(id)
    ElMessage.success('规则已删除')
  } catch {}
}

const updateRuleStatus = (rule: AlertRule) => {
  alertStore.updateRule(rule.id, { enabled: rule.enabled })
  ElMessage.info(`规则已${rule.enabled ? '启用' : '禁用'}`)
}

const saveAllSettings = () => {
  alertStore.updateConfig(notificationConfig.value)
  performanceStore.updateConfig({ thresholds: performanceThresholds.value })
  errorStore.updateConfig(errorConfig.value)
  ElMessage.success('设置已保存')
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有设置吗？', '重置确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    location.reload()
  } catch {}
}

onMounted(() => {
  alertStore.initializeDefaultRules()
})
</script>

<style scoped>
.settings-view { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.header-content { flex: 1; }
.page-title { display: flex; align-items: center; gap: 8px; margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #262626; }
.page-description { margin: 0; color: #8c8c8c; font-size: 14px; line-height: 1.5; }
.header-actions { display: flex; align-items: center; gap: 16px; }
.settings-tabs { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #262626; }
.unit { margin-left: 8px; color: #8c8c8c; font-size: 12px; }
:deep(.el-tabs__content) { padding: 20px; }
</style>