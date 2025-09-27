import { api } from './request'

// 用户管理API
export const usersAPI = {
  // 获取用户列表
  getUsers(params = {}) {
    return api.get('/users', params)
  },

  // 获取用户详情
  getUserById(id) {
    return api.get(`/users/${id}`)
  },

  // 创建用户
  createUser(data) {
    return api.post('/users', data)
  },

  // 更新用户信息
  updateUser(id, data) {
    return api.put(`/users/${id}`, data)
  },

  // 更新用户状态
  updateUserStatus(id, status) {
    return api.patch(`/users/${id}/status`, { status })
  },

  // 删除用户
  deleteUser(id) {
    return api.delete(`/users/${id}`)
  },

  // 重置用户密码
  resetUserPassword(id, newPassword) {
    return api.patch(`/users/${id}/reset-password`, { password: newPassword })
  },

  // 批量导入用户
  importUsers(file, onUploadProgress) {
    const formData = new FormData()
    formData.append('file', file)

    return api.upload('/users/import', formData, {
      onUploadProgress
    })
  },

  // 导出用户列表
  exportUsers(params = {}) {
    return api.download('/users/export', params)
  },

  // 获取用户角色
  getUserRoles(id) {
    return api.get(`/users/${id}/roles`)
  },

  // 分配用户角色
  assignUserRoles(id, roleIds) {
    return api.put(`/users/${id}/roles`, { roleIds })
  },

  // 获取用户统计
  getUserStats() {
    return api.get('/users/stats')
  },

  // 下载用户导入模板
  downloadUserTemplate() {
    return api.download('/users/template')
  }
}

export default usersAPI