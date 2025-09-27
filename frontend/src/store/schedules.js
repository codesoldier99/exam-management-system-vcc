import { defineStore } from 'pinia'
import { schedulesAPI } from '@/api'
import { ElMessage } from 'element-plus'

export const useSchedulesStore = defineStore('schedules', {
  state: () => ({
    // 排期列表
    schedules: [],

    // 日历数据
    calendarEvents: [],

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
      venue_id: '',
      product_id: '',
      start_date: '',
      end_date: ''
    },

    // 当前选中的排期
    currentSchedule: null,

    // 可用考场
    availableVenues: [],

    // 统计信息
    stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    }
  }),

  getters: {
    // 获取待确认排期数量
    pendingSchedulesCount: (state) => {
      return state.schedules.filter(s => s.status === 'pending').length
    },

    // 获取已确认排期数量
    confirmedSchedulesCount: (state) => {
      return state.schedules.filter(s => s.status === 'confirmed').length
    },

    // 获取排期总数
    totalSchedulesCount: (state) => state.pagination.total,

    // 检查是否有选中的排期
    hasSelectedSchedule: (state) => !!state.currentSchedule
  },

  actions: {
    // 加载排期列表
    async loadSchedules(params = {}) {
      try {
        this.loading = true

        const queryParams = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.searchForm,
          ...params
        }

        const response = await schedulesAPI.getSchedules(queryParams)

        if (response.success) {
          this.schedules = response.data.schedules || []
          this.pagination = {
            ...this.pagination,
            ...response.data.pagination
          }
        } else {
          throw new Error(response.message || '加载排期列表失败')
        }
      } catch (error) {
        console.error('加载排期列表失败:', error)
        ElMessage.error(error.message || '加载排期列表失败')
        this.schedules = []
      } finally {
        this.loading = false
      }
    },

    // 加载日历数据
    async loadCalendarData(params = {}) {
      try {
        const response = await schedulesAPI.getCalendarData(params)

        if (response.success) {
          this.calendarEvents = response.data.events || []
        } else {
          throw new Error(response.message || '加载日历数据失败')
        }
      } catch (error) {
        console.error('加载日历数据失败:', error)
        ElMessage.error(error.message || '加载日历数据失败')
        this.calendarEvents = []
      }
    },

    // 创建排期
    async createSchedule(scheduleData) {
      try {
        const response = await schedulesAPI.createSchedule(scheduleData)

        if (response.success) {
          ElMessage.success('创建排期成功')
          await this.loadSchedules()
          await this.loadCalendarData()
          return response.data
        } else {
          throw new Error(response.message || '创建排期失败')
        }
      } catch (error) {
        console.error('创建排期失败:', error)
        ElMessage.error(error.message || '创建排期失败')
        throw error
      }
    },

    // 批量创建排期
    async batchCreateSchedules(scheduleData) {
      try {
        const response = await schedulesAPI.batchCreateSchedules(scheduleData)

        if (response.success) {
          ElMessage.success(`批量创建成功，共创建 ${response.data.successCount} 个排期`)
          await this.loadSchedules()
          await this.loadCalendarData()
          return response.data
        } else {
          throw new Error(response.message || '批量创建排期失败')
        }
      } catch (error) {
        console.error('批量创建排期失败:', error)
        ElMessage.error(error.message || '批量创建排期失败')
        throw error
      }
    },

    // 更新排期
    async updateSchedule(id, scheduleData) {
      try {
        const response = await schedulesAPI.updateSchedule(id, scheduleData)

        if (response.success) {
          ElMessage.success('更新排期成功')
          await this.loadSchedules()
          await this.loadCalendarData()
          return response.data
        } else {
          throw new Error(response.message || '更新排期失败')
        }
      } catch (error) {
        console.error('更新排期失败:', error)
        ElMessage.error(error.message || '更新排期失败')
        throw error
      }
    },

    // 删除排期
    async deleteSchedule(id) {
      try {
        const response = await schedulesAPI.deleteSchedule(id)

        if (response.success) {
          ElMessage.success('删除排期成功')
          await this.loadSchedules()
          await this.loadCalendarData()
          return true
        } else {
          throw new Error(response.message || '删除排期失败')
        }
      } catch (error) {
        console.error('删除排期失败:', error)
        ElMessage.error(error.message || '删除排期失败')
        throw error
      }
    },

    // 更新排期状态
    async updateScheduleStatus(id, status) {
      try {
        const response = await schedulesAPI.updateScheduleStatus(id, status)

        if (response.success) {
          ElMessage.success('更新排期状态成功')
          await this.loadSchedules()
          await this.loadCalendarData()
          return true
        } else {
          throw new Error(response.message || '更新排期状态失败')
        }
      } catch (error) {
        console.error('更新排期状态失败:', error)
        ElMessage.error(error.message || '更新排期状态失败')
        throw error
      }
    },

    // 检查时间冲突
    async checkConflict(scheduleData) {
      try {
        const response = await schedulesAPI.checkConflict(scheduleData)
        return response.data || { hasConflict: false, conflicts: [] }
      } catch (error) {
        console.error('检查时间冲突失败:', error)
        return { hasConflict: false, conflicts: [] }
      }
    },

    // 获取可用考场
    async loadAvailableVenues(params = {}) {
      try {
        const response = await schedulesAPI.getAvailableVenues(params)

        if (response.success) {
          this.availableVenues = response.data.venues || []
        } else {
          this.availableVenues = []
        }
      } catch (error) {
        console.error('获取可用考场失败:', error)
        this.availableVenues = []
      }
    },

    // 导出排期列表
    async exportSchedules(params = {}) {
      try {
        const queryParams = {
          ...this.searchForm,
          ...params
        }

        const blob = await schedulesAPI.exportSchedules(queryParams)

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `排期列表_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        ElMessage.success('导出成功')
      } catch (error) {
        console.error('导出排期列表失败:', error)
        ElMessage.error(error.message || '导出排期列表失败')
      }
    },

    // 加载排期统计
    async loadScheduleStats() {
      try {
        const response = await schedulesAPI.getScheduleStats()

        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    },

    // 获取排期详情
    async getScheduleById(id) {
      try {
        const response = await schedulesAPI.getScheduleById(id)

        if (response.success) {
          this.currentSchedule = response.data
          return response.data
        } else {
          throw new Error(response.message || '获取排期详情失败')
        }
      } catch (error) {
        console.error('获取排期详情失败:', error)
        ElMessage.error(error.message || '获取排期详情失败')
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
        venue_id: '',
        product_id: '',
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
      this.schedules = []
      this.calendarEvents = []
      this.currentSchedule = null
      this.availableVenues = []
      this.pagination = {
        page: 1,
        limit: 20,
        total: 0
      }
      this.resetSearchForm()
    }
  }
})