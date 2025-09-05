<template>
  <div class="error-analysis">
    <!-- 分析选项卡 -->
    <el-tabs v-model="activeTab" class="analysis-tabs">
      <el-tab-pane label="趋势分析" name="trend">
        <TrendAnalysis />
      </el-tab-pane>
      <el-tab-pane label="类型分布" name="distribution">
        <DistributionAnalysis />
      </el-tab-pane>
      <el-tab-pane label="影响分析" name="impact">
        <ImpactAnalysis />
      </el-tab-pane>
      <el-tab-pane label="根因分析" name="root-cause">
        <RootCauseAnalysis />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent } from 'vue'

const activeTab = ref('trend')

// 趋势分析组件
const TrendAnalysis = defineComponent({
  setup() {
    return () => (
      <div class="trend-analysis">
        <el-row gutter={24}>
          <el-col span={12}>
            <el-card>
              <template v-slots:header>
                <span>错误趋势图</span>
              </template>
              <div ref="trendChart" style="height: 300px"></div>
            </el-card>
          </el-col>
          <el-col span={12}>
            <el-card>
              <template v-slots:header>
                <span>错误率变化</span>
              </template>
              <div ref="rateChart" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    )
  }
})

// 分布分析组件  
const DistributionAnalysis = defineComponent({
  setup() {
    return () => (
      <div class="distribution-analysis">
        <el-row gutter={24}>
          <el-col span={8}>
            <el-card>
              <template v-slots:header>
                <span>错误类型分布</span>
              </template>
              <div ref="typeChart" style="height: 300px"></div>
            </el-card>
          </el-col>
          <el-col span={8}>
            <el-card>
              <template v-slots:header>
                <span>严重程度分布</span>
              </template>
              <div ref="severityChart" style="height: 300px"></div>
            </el-card>
          </el-col>
          <el-col span={8}>
            <el-card>
              <template v-slots:header>
                <span>页面分布</span>
              </template>
              <div ref="pageChart" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    )
  }
})

// 影响分析组件
const ImpactAnalysis = defineComponent({
  setup() {
    return () => (
      <div class="impact-analysis">
        <el-alert
          title="影响分析"
          type="info"
          description="分析错误对用户体验和系统性能的影响"
          show-icon
          closable={false}
        />
        <el-row gutter={24} style="margin-top: 20px"}>
          <el-col span={12}>
            <el-card>
              <template v-slots:header>
                <span>用户影响度</span>
              </template>
              <div class="impact-metrics">
                <el-statistic title="受影响用户" value={125} suffix="人" />
                <el-statistic title="影响会话" value={89} suffix="次" />
                <el-statistic title="影响时长" value={"2.5"} suffix="小时" />
              </div>
            </el-card>
          </el-col>
          <el-col span={12}>
            <el-card>
              <template v-slots:header>
                <span>业务影响</span>
              </template>
              <div class="business-impact">
                <div class="impact-item">
                  <span class="label">转化率下降：</span>
                  <span class="value error">-5.2%</span>
                </div>
                <div class="impact-item">
                  <span class="label">用户流失：</span>
                  <span class="value error">+12%</span>
                </div>
                <div class="impact-item">
                  <span class="label">页面加载失败：</span>
                  <span class="value error">8.3%</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    )
  }
})

// 根因分析组件
const RootCauseAnalysis = defineComponent({
  setup() {
    return () => (
      <div class="root-cause-analysis">
        <el-alert
          title="根因分析"
          type="warning"
          description="识别错误的根本原因和解决建议"
          show-icon
          closable={false}
        />
        <div style="margin-top: 20px"}>
          <el-card>
            <template v-slots:header>
              <span>常见错误模式</span>
            </template>
            <el-table
              data={[
                { pattern: 'Cannot read property of undefined', count: 45, cause: '变量未初始化', solution: '添加空值检查' },
                { pattern: 'Network request failed', count: 32, cause: '接口异常', solution: '添加重试机制' },
                { pattern: 'Resource loading failed', count: 28, cause: '资源路径错误', solution: '检查资源路径' }
              ]}
              style="width: 100%"
            >
              <el-table-column prop="pattern" label="错误模式" width="300" />
              <el-table-column prop="count" label="出现次数" width="120" align="center" />
              <el-table-column prop="cause" label="可能原因" width="150" />
              <el-table-column prop="solution" label="解决建议" />
            </el-table>
          </el-card>
        </div>
      </div>
    )
  }
})
</script>

<style scoped>
.error-analysis {
  padding: 0;
}

.analysis-tabs {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.impact-metrics {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.business-impact {
  padding: 20px;
}

.impact-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.label {
  font-weight: 500;
  color: #595959;
}

.value.error {
  color: #f56c6c;
  font-weight: 600;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

:deep(.el-card) {
  margin-bottom: 16px;
}
</style>