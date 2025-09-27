import { api } from './request'

// 机构管理API
export const institutionsAPI = {
  // 获取机构列表
  getInstitutions(params = {}) {
    return api.get('/institutions', params)
  },

  // 获取机构详情
  getInstitutionById(id) {
    return api.get(`/institutions/${id}`)
  },

  // 创建机构
  createInstitution(data) {
    return api.post('/institutions', data)
  },

  // 更新机构信息
  updateInstitution(id, data) {
    return api.put(`/institutions/${id}`, data)
  },

  // 更新机构状态
  updateInstitutionStatus(id, status) {
    return api.patch(`/institutions/${id}/status`, { status })
  },

  // 删除机构
  deleteInstitution(id) {
    return api.delete(`/institutions/${id}`)
  },

  // 获取机构下的用户
  getInstitutionUsers(id, params = {}) {
    return api.get(`/institutions/${id}/users`, params)
  },

  // 获取机构下的考生
  getInstitutionCandidates(id, params = {}) {
    return api.get(`/institutions/${id}/candidates`, params)
  },

  // 获取机构下的考场
  getInstitutionVenues(id, params = {}) {
    return api.get(`/institutions/${id}/venues`, params)
  },

  // 导出机构列表
  exportInstitutions(params = {}) {
    return api.download('/institutions/export', params)
  },

  // 获取机构统计
  getInstitutionStats(id) {
    return api.get(`/institutions/${id}/stats`)
  },

  // 获取所有机构统计
  getAllInstitutionsStats() {
    return api.get('/institutions/stats')
  }
}

export default institutionsAPI