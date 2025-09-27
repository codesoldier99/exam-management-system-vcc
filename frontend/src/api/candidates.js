import { api } from './request'

// 考生管理API
export const candidatesAPI = {
  // 获取考生列表
  getCandidates(params = {}) {
    return api.get('/candidates', params)
  },

  // 获取考生详情
  getCandidateById(id) {
    return api.get(`/candidates/${id}`)
  },

  // 创建考生
  createCandidate(data) {
    return api.post('/candidates', data)
  },

  // 更新考生信息
  updateCandidate(id, data) {
    return api.put(`/candidates/${id}`, data)
  },

  // 更新考生状态
  updateCandidateStatus(id, status) {
    return api.patch(`/candidates/${id}/status`, { status })
  },

  // 删除考生
  deleteCandidate(id) {
    return api.delete(`/candidates/${id}`)
  },

  // 导出考生列表
  exportCandidates(params = {}) {
    return api.download('/candidates/export', params)
  },

  // 批量导入考生
  importCandidates(file, onUploadProgress) {
    const formData = new FormData()
    formData.append('file', file)

    return api.upload('/candidates/import', formData, {
      onUploadProgress
    })
  },

  // 获取考生统计信息
  getCandidateStats(params = {}) {
    return api.get('/candidates/stats', params)
  },

  // 下载导入模板
  downloadTemplate() {
    return api.download('/candidates/template')
  }
}

export default candidatesAPI