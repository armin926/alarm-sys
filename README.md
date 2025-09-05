# 前端告警系统 - 内部培训平台

一个用于前端内部培训的告警系统演示项目，展示现代前端应用中的监控、错误追踪和用户行为分析技术。

## 🎯 项目目标

- **教育价值**: 通过实际项目展示前端告警的重要性和实现方法
- **实用价值**: 提供可在生产环境中使用的告警组件
- **参考价值**: 作为团队内部最佳实践的参考标准

## 🛠️ 技术栈

- **Vue 3**: Composition API + TypeScript
- **Vite**: 快速构建工具
- **Pinia**: 状态管理
- **Element Plus**: UI 组件库
- **ECharts**: 数据可视化
- **Web Vitals**: 性能指标监控

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📊 核心功能

### 1. 性能监控
- **Web Vitals 指标**: FCP, LCP, FID, CLS, TTFB
- **实时性能数据收集和展示**
- **性能阈值告警**
- **性能优化建议**

#### 演示功能
- 模拟慢任务执行（FID）
- 模拟网络延迟（TTFB）
- 模拟布局偏移（CLS）

### 2. 错误追踪
- **多类型错误监控**: JavaScript、Promise、资源加载、网络请求
- **错误统计和分析**
- **错误严重程度分类**
- **自动错误上报**

#### 演示功能
- JavaScript 错误模拟
- 网络错误模拟
- 资源加载错误模拟
- Promise 拒绝错误模拟

### 3. 用户行为分析
- **用户交互追踪**: 点击、滚动、输入、导航
- **会话管理**
- **行为数据统计**
- **热力图生成**

#### 演示功能
- 用户点击行为模拟
- 页面滚动行为模拟
- 表单输入行为模拟
- 页面导航行为模拟

### 4. 告警系统
- **灵活的告警规则配置**
- **多种通知方式**: 浏览器通知、控制台、Webhook
- **告警历史记录**
- **静默时间设置**

## 🏗️ 项目结构

```
src/
├── components/          # 可复用组件
│   ├── demos/          # 演示组件
│   ├── StatusCard.vue  # 状态卡片
│   ├── PerformanceChart.vue # 性能图表
│   └── ...
├── composables/        # 组合式函数
│   ├── usePerformanceMonitoring.ts # 性能监控
│   ├── useErrorTracking.ts # 错误追踪
│   └── useBehaviorTracking.ts # 行为追踪
├── stores/             # Pinia 状态管理
│   ├── performance.ts  # 性能数据
│   ├── error.ts       # 错误数据
│   ├── behavior.ts    # 行为数据
│   └── alert.ts       # 告警数据
├── types/              # TypeScript 类型定义
├── views/              # 页面组件
├── router/             # 路由配置
└── styles/             # 样式文件
```

## 📚 学习要点

### 性能监控最佳实践
1. **选择合适的性能指标**: 重点关注 Core Web Vitals
2. **设置合理的性能阈值**: 根据业务需求制定标准
3. **性能数据采集**: 使用标准的 Performance API
4. **性能优化策略**: 针对不同指标采取相应优化措施

### 错误追踪实施要点
1. **全面的错误捕获**: JavaScript错误、Promise拒绝、资源加载失败
2. **错误信息结构化**: 包含错误类型、严重程度、上下文信息
3. **错误去重和聚合**: 避免重复告警
4. **隐私保护**: 敏感信息脱敏处理

### 用户行为分析注意事项
1. **用户隐私保护**: 避免收集敏感个人信息
2. **数据采样**: 大流量应用需要考虑采样率
3. **性能影响**: 确保监控不影响用户体验
4. **数据存储**: 合理设置数据保留期限

## 🔧 配置说明

### 性能监控配置
```typescript
const performanceConfig = {
  autoStart: true,        // 自动启动监控
  interval: 5000,         // 数据收集间隔
  thresholds: {           // 性能阈值
    fcp: 2000,           // FCP 阈值 (ms)
    lcp: 2500,           // LCP 阈值 (ms)
    fid: 100,            // FID 阈值 (ms)
    cls: 0.1,            // CLS 阈值
    ttfb: 800            // TTFB 阈值 (ms)
  }
}
```

### 错误追踪配置
```typescript
const errorConfig = {
  enableJSError: true,      // 启用 JS 错误监控
  enablePromiseError: true, // 启用 Promise 错误监控
  enableResourceError: true, // 启用资源错误监控
  enableNetworkError: true, // 启用网络错误监控
  maxErrors: 200,          // 最大错误数量
  autoReport: true         // 自动上报错误
}
```

## 🎨 自定义开发

### 添加新的性能指标
1. 在 `types/performance.ts` 中定义新的指标类型
2. 在 `usePerformanceMonitoring.ts` 中添加数据收集逻辑
3. 在性能图表组件中显示新指标

### 扩展错误类型
1. 在 `types/error.ts` 中定义新的错误类型
2. 在 `useErrorTracking.ts` 中添加错误处理逻辑
3. 更新错误统计和显示组件

### 新增行为事件
1. 在 `types/behavior.ts` 中定义新的事件类型
2. 在 `useBehaviorTracking.ts` 中添加事件监听
3. 在行为分析组件中展示新数据

## 🚨 生产环境注意事项

1. **数据上报**: 配置真实的数据上报端点
2. **采样率设置**: 根据流量调整数据采样率
3. **隐私合规**: 确保符合相关隐私保护法规
4. **性能影响**: 监控代码不应显著影响应用性能
5. **错误处理**: 监控代码本身不应引起错误

## 📖 相关文档

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Performance API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance)
- [Vue 3 Composition API](https://cn.vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia 状态管理](https://pinia.vuejs.org/zh/)

## 🤝 贡献指南

1. Fork 本项目
2. 创建新的功能分支
3. 提交代码变更
4. 发起 Pull Request

## 📄 许可证

MIT License

---

**注意**: 这是一个教学演示项目，主要用于内部培训。在生产环境使用前，请根据实际需求进行相应的调整和优化。