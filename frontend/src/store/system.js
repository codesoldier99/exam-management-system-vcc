import { defineStore } from 'pinia'
import { usersAPI, rolesAPI, institutionsAPI, venuesAPI, examProductsAPI } from '@/api'
import { ElMessage } from 'element-plus'

export const useSystemStore = defineStore('system', {
  state: () => ({
    // 用户管理
    users: [],
    usersLoading: false,
    usersPagination: {
      page: 1,
      limit: 20,
      total: 0
    },

    // 角色管理
    roles: [],
    rolesLoading: false,
    allPermissions: [],

    // 机构管理
    institutions: [],
    institutionsLoading: false,
    institutionsPagination: {
      page: 1,
      limit: 20,
      total: 0
    },

    // 考场管理
    venues: [],
    venuesLoading: false,
    venuesPagination: {
      page: 1,
      limit: 20,
      total: 0
    },

    // 考试产品管理
    examProducts: [],
    examProductsLoading: false,
    examProductsPagination: {
      page: 1,
      limit: 20,
      total: 0
    },

    // 当前选中项
    currentUser: null,
    currentRole: null,
    currentInstitution: null,
    currentVenue: null,
    currentExamProduct: null
  }),

  getters: {
    // 活跃用户数量
    activeUsersCount: (state) => {
      return state.users.filter(u => u.status === 'active').length
    },

    // 活跃角色数量
    activeRolesCount: (state) => {
      return state.roles.filter(r => r.status === 'active').length
    },

    // 活跃机构数量
    activeInstitutionsCount: (state) => {
      return state.institutions.filter(i => i.status === 'active').length
    }
  },

  actions: {
    // ==================== 用户管理 ====================

    // 加载用户列表
    async loadUsers(params = {}) {
      try {
        this.usersLoading = true

        const queryParams = {
          page: this.usersPagination.page,
          limit: this.usersPagination.limit,
          ...params
        }

        const response = await usersAPI.getUsers(queryParams)

        if (response.success) {
          this.users = response.data.users || []
          this.usersPagination = {
            ...this.usersPagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载用户列表失败')
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        ElMessage.error(error.message || '加载用户列表失败')
        this.users = []
      } finally {
        this.usersLoading = false
      }
    },

    // 创建用户
    async createUser(userData) {
      try {
        const response = await usersAPI.createUser(userData)

        if (response.success) {
          ElMessage.success('创建用户成功')
          await this.loadUsers()
          return response.data
        } else {
          throw new Error(response.message || '创建用户失败')
        }
      } catch (error) {
        console.error('创建用户失败:', error)
        ElMessage.error(error.message || '创建用户失败')
        throw error
      }
    },

    // 更新用户
    async updateUser(id, userData) {
      try {
        const response = await usersAPI.updateUser(id, userData)

        if (response.success) {
          ElMessage.success('更新用户成功')
          await this.loadUsers()
          return response.data
        } else {
          throw new Error(response.message || '更新用户失败')
        }
      } catch (error) {
        console.error('更新用户失败:', error)
        ElMessage.error(error.message || '更新用户失败')
        throw error
      }
    },

    // 删除用户
    async deleteUser(id) {
      try {
        const response = await usersAPI.deleteUser(id)

        if (response.success) {
          ElMessage.success('删除用户成功')
          await this.loadUsers()
          return true
        } else {
          throw new Error(response.message || '删除用户失败')
        }
      } catch (error) {
        console.error('删除用户失败:', error)
        ElMessage.error(error.message || '删除用户失败')
        throw error
      }
    },

    // 重置用户密码
    async resetUserPassword(id, newPassword) {
      try {
        const response = await usersAPI.resetUserPassword(id, newPassword)

        if (response.success) {
          ElMessage.success('重置密码成功')
          return true
        } else {
          throw new Error(response.message || '重置密码失败')
        }
      } catch (error) {
        console.error('重置密码失败:', error)
        ElMessage.error(error.message || '重置密码失败')
        throw error
      }
    },

    // 分配用户角色
    async assignUserRoles(id, roleIds) {
      try {
        const response = await usersAPI.assignUserRoles(id, roleIds)

        if (response.success) {
          ElMessage.success('分配角色成功')
          await this.loadUsers()
          return true
        } else {
          throw new Error(response.message || '分配角色失败')
        }
      } catch (error) {
        console.error('分配角色失败:', error)
        ElMessage.error(error.message || '分配角色失败')
        throw error
      }
    },

    // 导入用户
    async importUsers(file, onProgress) {
      try {
        const response = await usersAPI.importUsers(file, onProgress)

        if (response.success) {
          ElMessage.success(`导入成功，共导入 ${response.data.successCount} 条记录`)
          await this.loadUsers()
          return response.data
        } else {
          throw new Error(response.message || '导入失败')
        }
      } catch (error) {
        console.error('导入用户失败:', error)
        ElMessage.error(error.message || '导入用户失败')
        throw error
      }
    },

    // ==================== 角色管理 ====================

    // 加载角色列表
    async loadRoles(params = {}) {
      try {
        this.rolesLoading = true
        const response = await rolesAPI.getRoles(params)

        if (response.success) {
          this.roles = response.data.roles || []
        } else {
          throw new Error(response.message || '加载角色列表失败')
        }
      } catch (error) {
        console.error('加载角色列表失败:', error)
        ElMessage.error(error.message || '加载角色列表失败')
        this.roles = []
      } finally {
        this.rolesLoading = false
      }
    },

    // 加载所有权限
    async loadAllPermissions() {
      try {
        const response = await rolesAPI.getAllPermissions()

        if (response.success) {
          this.allPermissions = response.data.permissions || []
        }
      } catch (error) {
        console.error('加载权限列表失败:', error)
        this.allPermissions = []
      }
    },

    // 创建角色
    async createRole(roleData) {
      try {
        const response = await rolesAPI.createRole(roleData)

        if (response.success) {
          ElMessage.success('创建角色成功')
          await this.loadRoles()
          return response.data
        } else {
          throw new Error(response.message || '创建角色失败')
        }
      } catch (error) {
        console.error('创建角色失败:', error)
        ElMessage.error(error.message || '创建角色失败')
        throw error
      }
    },

    // 更新角色
    async updateRole(id, roleData) {
      try {
        const response = await rolesAPI.updateRole(id, roleData)

        if (response.success) {
          ElMessage.success('更新角色成功')
          await this.loadRoles()
          return response.data
        } else {
          throw new Error(response.message || '更新角色失败')
        }
      } catch (error) {
        console.error('更新角色失败:', error)
        ElMessage.error(error.message || '更新角色失败')
        throw error
      }
    },

    // 删除角色
    async deleteRole(id) {
      try {
        const response = await rolesAPI.deleteRole(id)

        if (response.success) {
          ElMessage.success('删除角色成功')
          await this.loadRoles()
          return true
        } else {
          throw new Error(response.message || '删除角色失败')
        }
      } catch (error) {
        console.error('删除角色失败:', error)
        ElMessage.error(error.message || '删除角色失败')
        throw error
      }
    },

    // 更新角色权限
    async updateRolePermissions(id, permissions) {
      try {
        const response = await rolesAPI.updateRolePermissions(id, permissions)

        if (response.success) {
          ElMessage.success('更新权限成功')
          await this.loadRoles()
          return true
        } else {
          throw new Error(response.message || '更新权限失败')
        }
      } catch (error) {
        console.error('更新权限失败:', error)
        ElMessage.error(error.message || '更新权限失败')
        throw error
      }
    },

    // ==================== 机构管理 ====================

    // 加载机构列表
    async loadInstitutions(params = {}) {
      try {
        this.institutionsLoading = true

        const queryParams = {
          page: this.institutionsPagination.page,
          limit: this.institutionsPagination.limit,
          ...params
        }

        const response = await institutionsAPI.getInstitutions(queryParams)

        if (response.success) {
          this.institutions = response.data.institutions || []
          this.institutionsPagination = {
            ...this.institutionsPagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载机构列表失败')
        }
      } catch (error) {
        console.error('加载机构列表失败:', error)
        ElMessage.error(error.message || '加载机构列表失败')
        this.institutions = []
      } finally {
        this.institutionsLoading = false
      }
    },

    // 创建机构
    async createInstitution(institutionData) {
      try {
        const response = await institutionsAPI.createInstitution(institutionData)

        if (response.success) {
          ElMessage.success('创建机构成功')
          await this.loadInstitutions()
          return response.data
        } else {
          throw new Error(response.message || '创建机构失败')
        }
      } catch (error) {
        console.error('创建机构失败:', error)
        ElMessage.error(error.message || '创建机构失败')
        throw error
      }
    },

    // 更新机构
    async updateInstitution(id, institutionData) {
      try {
        const response = await institutionsAPI.updateInstitution(id, institutionData)

        if (response.success) {
          ElMessage.success('更新机构成功')
          await this.loadInstitutions()
          return response.data
        } else {
          throw new Error(response.message || '更新机构失败')
        }
      } catch (error) {
        console.error('更新机构失败:', error)
        ElMessage.error(error.message || '更新机构失败')
        throw error
      }
    },

    // 删除机构
    async deleteInstitution(id) {
      try {
        const response = await institutionsAPI.deleteInstitution(id)

        if (response.success) {
          ElMessage.success('删除机构成功')
          await this.loadInstitutions()
          return true
        } else {
          throw new Error(response.message || '删除机构失败')
        }
      } catch (error) {
        console.error('删除机构失败:', error)
        ElMessage.error(error.message || '删除机构失败')
        throw error
      }
    },

    // ==================== 考场管理 ====================

    // 加载考场列表
    async loadVenues(params = {}) {
      try {
        this.venuesLoading = true

        const queryParams = {
          page: this.venuesPagination.page,
          limit: this.venuesPagination.limit,
          ...params
        }

        const response = await venuesAPI.getVenues(queryParams)

        if (response.success) {
          this.venues = response.data.venues || []
          this.venuesPagination = {
            ...this.venuesPagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载考场列表失败')
        }
      } catch (error) {
        console.error('加载考场列表失败:', error)
        ElMessage.error(error.message || '加载考场列表失败')
        this.venues = []
      } finally {
        this.venuesLoading = false
      }
    },

    // 创建考场
    async createVenue(venueData) {
      try {
        const response = await venuesAPI.createVenue(venueData)

        if (response.success) {
          ElMessage.success('创建考场成功')
          await this.loadVenues()
          return response.data
        } else {
          throw new Error(response.message || '创建考场失败')
        }
      } catch (error) {
        console.error('创建考场失败:', error)
        ElMessage.error(error.message || '创建考场失败')
        throw error
      }
    },

    // 更新考场
    async updateVenue(id, venueData) {
      try {
        const response = await venuesAPI.updateVenue(id, venueData)

        if (response.success) {
          ElMessage.success('更新考场成功')
          await this.loadVenues()
          return response.data
        } else {
          throw new Error(response.message || '更新考场失败')
        }
      } catch (error) {
        console.error('更新考场失败:', error)
        ElMessage.error(error.message || '更新考场失败')
        throw error
      }
    },

    // 删除考场
    async deleteVenue(id) {
      try {
        const response = await venuesAPI.deleteVenue(id)

        if (response.success) {
          ElMessage.success('删除考场成功')
          await this.loadVenues()
          return true
        } else {
          throw new Error(response.message || '删除考场失败')
        }
      } catch (error) {
        console.error('删除考场失败:', error)
        ElMessage.error(error.message || '删除考场失败')
        throw error
      }
    },

    // ==================== 考试产品管理 ====================

    // 加载考试产品列表
    async loadExamProducts(params = {}) {
      try {
        this.examProductsLoading = true

        const queryParams = {
          page: this.examProductsPagination.page,
          limit: this.examProductsPagination.limit,
          ...params
        }

        const response = await examProductsAPI.getExamProducts(queryParams)

        if (response.success) {
          this.examProducts = response.data.products || []
          this.examProductsPagination = {
            ...this.examProductsPagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载考试产品列表失败')
        }
      } catch (error) {
        console.error('加载考试产品列表失败:', error)
        ElMessage.error(error.message || '加载考试产品列表失败')
        this.examProducts = []
      } finally {
        this.examProductsLoading = false
      }
    },

    // 创建考试产品
    async createExamProduct(productData) {
      try {
        const response = await examProductsAPI.createExamProduct(productData)

        if (response.success) {
          ElMessage.success('创建考试产品成功')
          await this.loadExamProducts()
          return response.data
        } else {
          throw new Error(response.message || '创建考试产品失败')
        }
      } catch (error) {
        console.error('创建考试产品失败:', error)
        ElMessage.error(error.message || '创建考试产品失败')
        throw error
      }
    },

    // 更新考试产品
    async updateExamProduct(id, productData) {
      try {
        const response = await examProductsAPI.updateExamProduct(id, productData)

        if (response.success) {
          ElMessage.success('更新考试产品成功')
          await this.loadExamProducts()
          return response.data
        } else {
          throw new Error(response.message || '更新考试产品失败')
        }
      } catch (error) {
        console.error('更新考试产品失败:', error)
        ElMessage.error(error.message || '更新考试产品失败')
        throw error
      }
    },

    // 删除考试产品
    async deleteExamProduct(id) {
      try {
        const response = await examProductsAPI.deleteExamProduct(id)

        if (response.success) {
          ElMessage.success('删除考试产品成功')
          await this.loadExamProducts()
          return true
        } else {
          throw new Error(response.message || '删除考试产品失败')
        }
      } catch (error) {
        console.error('删除考试产品失败:', error)
        ElMessage.error(error.message || '删除考试产品失败')
        throw error
      }
    },

    // ==================== 通用方法 ====================

    // 重置状态
    resetState() {
      this.users = []
      this.roles = []
      this.institutions = []
      this.venues = []
      this.examProducts = []
      this.currentUser = null
      this.currentRole = null
      this.currentInstitution = null
      this.currentVenue = null
      this.currentExamProduct = null
    }
  }
})