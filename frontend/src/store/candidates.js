import { defineStore } from 'pinia'
import { candidatesAPI } from '@/api'
import { ElMessage } from 'element-plus'

export const useCandidatesStore = defineStore('candidates', {
  state: () => ({
    // 考生列表
    candidates: [],

    // 加载状态
    loading: false,

    // 分页信息
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },

    // 搜索条件
    searchForm: {
      search: '',
      status: '',
      institution_id: '',
      start_date: '',
      end_date: ''
    },

    // 当前选中的考生
    currentCandidate: null,

    // 统计信息
    stats: {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0
    }
  }),

  getters: {
    // 获取活跃考生数量
    activeCandidatesCount: (state) => {
      return state.candidates.filter(c => c.status === 'active').length
    },

    // 获取考生总数
    totalCandidatesCount: (state) => state.pagination.total,

    // 检查是否有选中的考生
    hasSelectedCandidate: (state) => !!state.currentCandidate
  },

  actions: {
    // 加载考生列表
    async loadCandidates(params = {}) {
      try {
        this.loading = true

        const queryParams = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.searchForm,
          ...params
        }

        const response = await candidatesAPI.getCandidates(queryParams)

        if (response.success) {
          this.candidates = response.data.candidates || []
          this.pagination = {
            ...this.pagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载考生列表失败')
        }
      } catch (error) {
        console.error('加载考生列表失败:', error)
        ElMessage.error(error.message || '加载考生列表失败')
        this.candidates = []
      } finally {
        this.loading = false
      }
    },

    // 创建考生
    async createCandidate(candidateData) {
      try {
        const response = await candidatesAPI.createCandidate(candidateData)

        if (response.success) {
          ElMessage.success('创建考生成功')
          await this.loadCandidates()
          return response.data
        } else {
          throw new Error(response.message || '创建考生失败')
        }
      } catch (error) {
        console.error('创建考生失败:', error)
        ElMessage.error(error.message || '创建考生失败')
        throw error
      }
    },

    // 更新考生
    async updateCandidate(id, candidateData) {
      try {
        const response = await candidatesAPI.updateCandidate(id, candidateData)

        if (response.success) {
          ElMessage.success('更新考生信息成功')
          await this.loadCandidates()
          return response.data
        } else {
          throw new Error(response.message || '更新考生信息失败')
        }
      } catch (error) {
        console.error('更新考生失败:', error)
        ElMessage.error(error.message || '更新考生信息失败')
        throw error
      }
    },

    // 删除考生
    async deleteCandidate(id) {
      try {
        const response = await candidatesAPI.deleteCandidate(id)

        if (response.success) {
          ElMessage.success('删除考生成功')
          await this.loadCandidates()
          return true
        } else {
          throw new Error(response.message || '删除考生失败')
        }
      } catch (error) {
        console.error('删除考生失败:', error)
        ElMessage.error(error.message || '删除考生失败')
        throw error
      }
    },

    // 更新考生状态
    async updateCandidateStatus(id, status) {
      try {
        const response = await candidatesAPI.updateCandidateStatus(id, status)

        if (response.success) {
          ElMessage.success('更新考生状态成功')
          await this.loadCandidates()
          return true
        } else {
          throw new Error(response.message || '更新考生状态失败')
        }
      } catch (error) {
        console.error('更新考生状态失败:', error)
        ElMessage.error(error.message || '更新考生状态失败')
        throw error
      }
    },

    // 导出考生列表
    async exportCandidates(params = {}) {
      try {
        const queryParams = {
          ...this.searchForm,
          ...params
        }

        const blob = await candidatesAPI.exportCandidates(queryParams)

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `考生列表_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        ElMessage.success('导出成功')
      } catch (error) {
        console.error('导出考生列表失败:', error)
        ElMessage.error(error.message || '导出考生列表失败')
      }
    },

    // 批量导入考生
    async importCandidates(file, onProgress) {
      try {
        const response = await candidatesAPI.importCandidates(file, onProgress)

        if (response.success) {
          ElMessage.success(`导入成功，共导入 ${response.data.successCount} 条记录`)
          await this.loadCandidates()
          return response.data
        } else {
          throw new Error(response.message || '导入失败')
        }
      } catch (error) {
        console.error('导入考生失败:', error)
        ElMessage.error(error.message || '导入考生失败')
        throw error
      }
    },

    // 加载考生统计
    async loadCandidateStats() {
      try {
        const response = await candidatesAPI.getCandidateStats()

        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    },

    // 获取考生详情
    async getCandidateById(id) {
      try {
        const response = await candidatesAPI.getCandidateById(id)

        if (response.success) {
          this.currentCandidate = response.data
          return response.data
        } else {
          throw new Error(response.message || '获取考生详情失败')
        }
      } catch (error) {
        console.error('获取考生详情失败:', error)
        ElMessage.error(error.message || '获取考生详情失败')
        throw error
      }
    },

    // 设置搜索条件
    setSearchForm(searchData) {
      this.searchForm = { ...this.searchForm, ...searchData }
    },

    // 重置搜索条件
    resetSearchForm() {
      this.searchForm = {
        search: '',
        status: '',
        institution_id: '',
        start_date: '',
        end_date: ''
      }
    },

    // 设置分页
    setPagination(paginationData) {
      this.pagination = { ...this.pagination, ...paginationData }
    },

    // 重置状态
    resetState() {
      this.candidates = []
      this.currentCandidate = null
      this.pagination = {
        page: 1,
        limit: 20,
        total: 0
      }
      this.resetSearchForm()
    }
  }
})