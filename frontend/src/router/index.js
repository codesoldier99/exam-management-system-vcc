import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: '用户登录',
        requiresAuth: false
      }
    },
    {
      path: '/',
      component: () => import('@/layout/MainLayout.vue'),
      redirect: '/dashboard',
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: {
            title: '数据总览',
            icon: 'DataAnalysis'
          }
        },
        {
          path: 'candidates',
          name: 'CandidatesList',
          component: () => import('@/views/candidates/List.vue'),
          meta: {
            title: '考生管理',
            icon: 'User',
            roles: ['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']
          }
        },
        {
          path: 'candidates/import',
          name: 'CandidatesImport',
          component: () => import('@/views/candidates/Import.vue'),
          meta: {
            title: '批量导入',
            roles: ['ADMIN', 'INSTITUTION_ADMIN'],
            hidden: true
          }
        },
        {
          path: 'schedules/batch-create',
          name: 'SchedulesBatchCreate',
          component: () => import('@/views/schedules/BatchCreate.vue'),
          meta: {
            title: '批量排期',
            icon: 'Calendar',
            roles: ['ADMIN', 'INSTITUTION_ADMIN']
          }
        },
        {
          path: 'schedules/calendar',
          name: 'SchedulesCalendar',
          component: () => import('@/views/schedules/Calendar.vue'),
          meta: {
            title: '日程日历',
            icon: 'Calendar',
            roles: ['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']
          }
        },
        {
          path: 'basic/exam-products',
          name: 'ExamProducts',
          component: () => import('@/views/basic/ExamProducts.vue'),
          meta: {
            title: '考试产品',
            icon: 'Setting',
            roles: ['ADMIN', 'INSTITUTION_ADMIN']
          }
        },
        {
          path: 'basic/venues',
          name: 'Venues',
          component: () => import('@/views/basic/Venues.vue'),
          meta: {
            title: '考场管理',
            icon: 'Setting',
            roles: ['ADMIN', 'INSTITUTION_ADMIN']
          }
        },
        {
          path: 'basic/institutions',
          name: 'Institutions',
          component: () => import('@/views/basic/Institutions.vue'),
          meta: {
            title: '机构管理',
            icon: 'Setting',
            roles: ['ADMIN']
          }
        },
        {
          path: 'system/users',
          name: 'Users',
          component: () => import('@/views/system/Users.vue'),
          meta: {
            title: '用户管理',
            icon: 'Tools',
            roles: ['ADMIN']
          }
        },
        {
          path: 'system/roles',
          name: 'Roles',
          component: () => import('@/views/system/Roles.vue'),
          meta: {
            title: '角色管理',
            icon: 'Tools',
            roles: ['ADMIN']
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: {
        title: '页面未找到',
        requiresAuth: false
      }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 无人机考点运营管理系统`
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning('请先登录')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // 获取用户信息（如果没有的话）
    if (!authStore.user) {
      try {
        await authStore.getCurrentUser()
      } catch (error) {
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      const hasRole = to.meta.roles.some(role => authStore.hasRole(role))
      if (!hasRole) {
        ElMessage.error('权限不足')
        next({ path: '/dashboard' })
        return
      }
    }
  }

  // 已登录用户访问登录页面，重定向到首页
  if (to.path === '/login' && authStore.isAuthenticated) {
    next({ path: '/dashboard' })
    return
  }

  next()
})

export default router