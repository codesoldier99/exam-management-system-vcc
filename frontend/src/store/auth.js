import { defineStore } from 'pinia'
import { api } from '@/api/request'
import Cookies from 'js-cookie'

const TOKEN_KEY = 'exam_admin_token'
const USER_KEY = 'exam_admin_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: Cookies.get(TOKEN_KEY) || '',
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    permissions: [],
    roles: []
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,

    isAdmin: (state) => {
      return state.roles.some(role => role.code === 'ADMIN')
    },

    isInstitutionAdmin: (state) => {
      return state.roles.some(role => role.code === 'INSTITUTION_ADMIN')
    },

    isProctor: (state) => {
      return state.roles.some(role => role.code === 'PROCTOR')
    },

    institutionId: (state) => {
      return state.user?.institution_id || null
    },

    institutionName: (state) => {
      return state.user?.institution?.name || ''
    }
  },

  actions: {
    // 登录
    async login(credentials) {
      try {
        const response = await api.post('/auth/login', credentials)

        if (response.success) {
          const { user, token } = response.data

          this.setAuth({
            token,
            user,
            roles: user.roles || [],
            permissions: this.extractPermissions(user.roles || [])
          })

          return response
        }
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    // 获取当前用户信息
    async getCurrentUser() {
      try {
        const response = await api.get('/auth/me')

        if (response.success) {
          const { user } = response.data

          this.user = user
          this.roles = user.roles || []
          this.permissions = this.extractPermissions(user.roles || [])

          // 更新本地存储
          localStorage.setItem(USER_KEY, JSON.stringify(user))

          return response
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    // 修改密码
    async changePassword(passwordData) {
      try {
        const response = await api.put('/auth/change-password', passwordData)
        return response
      } catch (error) {
        console.error('修改密码失败:', error)
        throw error
      }
    },

    // 设置认证信息
    setAuth({ token, user, roles, permissions }) {
      this.token = token
      this.user = user
      this.roles = roles
      this.permissions = permissions

      // 保存到本地存储
      Cookies.set(TOKEN_KEY, token, { expires: 7 }) // 7天过期
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },

    // 登出
    async logout() {
      try {
        // 调用后端登出接口
        await api.post('/auth/logout').catch(() => {
          // 忽略登出接口错误
        })
      } finally {
        this.clearAuth()
      }
    },

    // 清除认证信息
    clearAuth() {
      this.token = ''
      this.user = null
      this.roles = []
      this.permissions = []

      // 清除本地存储
      Cookies.remove(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },

    // 提取权限列表
    extractPermissions(roles) {
      const permissions = []
      roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          permissions.push(...role.permissions)
        }
      })
      return [...new Set(permissions)] // 去重
    },

    // 检查权限
    hasPermission(permission) {
      return this.permissions.includes(permission) || this.isAdmin
    },

    // 检查角色
    hasRole(roleCode) {
      return this.roles.some(role => role.code === roleCode)
    },

    // 检查是否可以访问某个机构的数据
    canAccessInstitution(institutionId) {
      if (this.isAdmin) return true
      return this.institutionId === institutionId
    }
  }
})