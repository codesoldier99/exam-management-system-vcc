import { api } from './request'

// 考场管理API
export const venuesAPI = {
  // 获取考场列表
  getVenues(params = {}) {
    return api.get('/venues', params)
  },

  // 获取考场详情
  getVenueById(id) {
    return api.get(`/venues/${id}`)
  },

  // 创建考场
  createVenue(data) {
    return api.post('/venues', data)
  },

  // 更新考场信息
  updateVenue(id, data) {
    return api.put(`/venues/${id}`, data)
  },

  // 更新考场状态
  updateVenueStatus(id, status) {
    return api.patch(`/venues/${id}/status`, { status })
  },

  // 删除考场
  deleteVenue(id) {
    return api.delete(`/venues/${id}`)
  },

  // 获取考场占用情况
  getVenueOccupancy(id, params = {}) {
    return api.get(`/venues/${id}/occupancy`, params)
  },

  // 获取考场设备列表
  getVenueEquipment(id) {
    return api.get(`/venues/${id}/equipment`)
  },

  // 更新考场设备
  updateVenueEquipment(id, equipment) {
    return api.put(`/venues/${id}/equipment`, { equipment })
  },

  // 导出考场列表
  exportVenues(params = {}) {
    return api.download('/venues/export', params)
  },

  // 获取考场统计
  getVenueStats(params = {}) {
    return api.get('/venues/stats', params)
  }
}

export default venuesAPI