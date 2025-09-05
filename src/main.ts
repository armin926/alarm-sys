import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import '@/styles/global.css'

import App from './App.vue'
import router from './router'

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局错误处理
app.config.errorHandler = (err, _, info) => {
  console.error('Vue Error:', err, info)
  // 添加错误记录逻辑
}

// 全局警告处理
app.config.warnHandler = (msg, _, trace) => {
  console.warn('Vue Warning:', msg, trace)
}

// 挂载应用
app.mount('#app')

console.log('🚀 前端告警系统启动成功！')