import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useBehaviorStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '控制台总览',
          icon: 'Dashboard',
          keepAlive: true
        }
      },
      {
        path: 'performance',
        name: 'Performance',
        component: () => import('@/views/PerformanceView.vue'),
        meta: {
          title: '性能监控',
          icon: 'TrendCharts',
          keepAlive: true
        }
      },
      {
        path: 'errors',
        name: 'ErrorTracking',
        component: () => import('@/views/ErrorTrackingView.vue'),
        meta: {
          title: '错误追踪',
          icon: 'WarningFilled',
          keepAlive: true
        }
      },
      {
        path: 'behavior',
        name: 'UserBehavior',
        component: () => import('@/views/UserBehaviorView.vue'),
        meta: {
          title: '用户行为分析',
          icon: 'User',
          keepAlive: true
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: {
          title: '告警配置',
          icon: 'Setting',
          keepAlive: false
        }
      }
    ]
  },
  {
    path: '/demo',
    name: 'DemoPage',
    component: () => import('@/views/DemoPage.vue'),
    meta: {
      title: '演示页面',
      hideInMenu: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      hideInMenu: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫：页面访问追踪
router.beforeEach((to, _, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 前端告警系统`
  }
  
  next()
})

// 路由守卫：记录导航行为
router.afterEach((to, from) => {
  // 记录页面访问
  const behaviorStore = useBehaviorStore()
  
  if (from.path !== to.path) {
    behaviorStore.trackNavigation(from.path, to.path)
  }
})

export default router