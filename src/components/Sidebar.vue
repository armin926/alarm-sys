<template>
  <div class="sidebar">
    <!-- 系统标题 -->
    <div class="sidebar-header">
      <h3 class="title">告警监控</h3>
    </div>

    <!-- 导航菜单 -->
    <el-menu
      :default-active="$route.path"
      :router="true"
      :collapse="false"
      background-color="#001529"
      text-color="#fff"
      active-text-color="#1890ff"
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><House /></el-icon>
        <span>控制台总览</span>
      </el-menu-item>
      <el-menu-item index="/performance">
        <el-icon><TrendCharts /></el-icon>
        <span>性能监控</span>
      </el-menu-item>
      <el-menu-item index="/errors">
        <el-icon><WarningFilled /></el-icon>
        <span>错误追踪</span>
      </el-menu-item>
      <el-menu-item index="/behavior">
        <el-icon><User /></el-icon>
        <span>用户行为</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>告警配置</span>
      </el-menu-item>

      <el-divider style="margin: 16px 0; border-color: #333" />

      <el-menu-item index="/demo">
        <el-icon><Management /></el-icon>
        <span>演示页面</span>
      </el-menu-item>
    </el-menu>

    <!-- 底部信息 -->
    <div class="sidebar-footer">
      <div class="system-info">
        <div class="info-item">
          <span class="label">监控状态：</span>
          <el-tag :type="isMonitoring ? 'success' : 'danger'" size="small">
            {{ isMonitoring ? "运行中" : "已停止" }}
          </el-tag>
        </div>

        <div class="info-item">
          <span class="label">活跃会话：</span>
          <span class="value">{{ activeSessions }}</span>
        </div>

        <div class="info-item">
          <span class="label">错误数量：</span>
          <span class="value error-count">{{ totalErrors }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  House,
  TrendCharts,
  WarningFilled,
  User,
  Setting,
  Management,
} from "@element-plus/icons-vue"
import { usePerformanceStore, useErrorStore, useBehaviorStore } from "@/stores"

const performanceStore = usePerformanceStore()
const errorStore = useErrorStore()
const behaviorStore = useBehaviorStore()

// 监控状态
const isMonitoring = computed(() => performanceStore.isMonitoring)

// 活跃会话数
const activeSessions = computed(() => behaviorStore.sessions.length)

// 总错误数
const totalErrors = computed(() => errorStore.errors.length)
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #333;
}

.title {
  color: #fff;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.sidebar-menu {
  flex: 1;
  border: none;
  overflow-y: auto;
}

.sidebar-menu .el-menu-item {
  border-radius: 0;
  margin: 0;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #333;
  background-color: rgba(0, 0, 0, 0.2);
}

.system-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: rgba(255, 255, 255, 0.6);
}

.value {
  color: #fff;
  font-weight: 500;
}

.error-count {
  color: #ff4d4f;
}

/* 滚动条样式 */
.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background-color: transparent;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
