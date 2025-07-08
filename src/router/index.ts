import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register', 
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/components/layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'materials',
          name: 'materials',
          component: () => import('../views/Materials.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'planning',
          name: 'planning',
          component: () => import('../views/Planning.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'daily-practice',
          name: 'daily-practice',
          component: () => import('../views/DailyPractice.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'chat',
          name: 'chat',
          component: () => import('../views/ChatPage.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'guidebook',
          name: 'guidebook',
          component: () => import('../views/Guidebook.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'navigator',
          name: 'navigator',
          component: () => import('../views/Navigator.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'correction',
          name: 'correction',
          component: () => import('../views/Correction.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()
  if (appStore.isLoggingOut) {
    next()
    return
  }
  const token = localStorage.getItem('jiyu_token')
  
  // 开发环境变量，设为true可以绕过登录验证
  const DEV_BYPASS_AUTH = true
  
  console.log('路由守卫检查:', {
    to: to.path,
    from: from.path,
    hasToken: !!token,
    devMode: DEV_BYPASS_AUTH
  })
  
  // 开发模式，绕过认证
  // if (DEV_BYPASS_AUTH) {
  //   if (to.path !== '/chat') {
  //     next('/chat')
  //     return
  //   } else {
  //     next()
  //     return
  //   }
  // }
  
  // 需要认证的路由
  if (to.meta.requiresAuth) {
    console.log(token)
    if (!token) {
      console.log('无token，跳转到登录页')
      next('/login')
      return
    }
  }
  
  // 已登录用户访问登录页面，重定向到chat
  if ((to.path === '/login' || to.path === '/register') && token) {
    if ((to.path as string) !== '/chat') {
      console.log('已登录用户，跳转到chat')
      next('/chat')
      return
    }
  }
  
  next()
})

export default router
