import { api } from './request'

// 排期管理API
export const schedulesAPI = {
  // 获取排期列表
  getSchedules(params = {}) {
    return api.get('/schedules', params)
  },

  // 获取排期详情
  getScheduleById(id) {
    return api.get(`/schedules/${id}`)
  },

  // 创建排期
  createSchedule(data) {
    return api.post('/schedules', data)
  },

  // 批量创建排期
  batchCreateSchedules(data) {
    return api.post('/schedules/batch', data)
  },

  // 更新排期信息
  updateSchedule(id, data) {
    return api.put(`/schedules/${id}`, data)
  },

  // 更新排期状态
  updateScheduleStatus(id, status) {
    return api.patch(`/schedules/${id}/status`, { status })
  },

  // 删除排期
  deleteSchedule(id) {
    return api.delete(`/schedules/${id}`)
  },

  // 获取日历数据
  getCalendarData(params = {}) {
    return api.get('/schedules/calendar', params)
  },

  // 检查时间冲突
  checkConflict(data) {
    return api.post('/schedules/check-conflict', data)
  },

  // 获取可用考场
  getAvailableVenues(params = {}) {
    return api.get('/schedules/available-venues', params)
  },

  // 导出排期列表
  exportSchedules(params = {}) {
    return api.download('/schedules/export', params)
  },

  // 获取排期统计
  getScheduleStats(params = {}) {
    return api.get('/schedules/stats', params)
  }
}

export default schedulesAPI