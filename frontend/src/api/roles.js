import { api } from './request'

// 角色管理API
export const rolesAPI = {
  // 获取角色列表
  getRoles(params = {}) {
    return api.get('/roles', params)
  },

  // 获取角色详情
  getRoleById(id) {
    return api.get(`/roles/${id}`)
  },

  // 创建角色
  createRole(data) {
    return api.post('/roles', data)
  },

  // 更新角色信息
  updateRole(id, data) {
    return api.put(`/roles/${id}`, data)
  },

  // 更新角色状态
  updateRoleStatus(id, status) {
    return api.patch(`/roles/${id}/status`, { status })
  },

  // 删除角色
  deleteRole(id) {
    return api.delete(`/roles/${id}`)
  },

  // 获取角色权限
  getRolePermissions(id) {
    return api.get(`/roles/${id}/permissions`)
  },

  // 更新角色权限
  updateRolePermissions(id, permissions) {
    return api.put(`/roles/${id}/permissions`, { permissions })
  },

  // 获取角色下的用户
  getRoleUsers(id, params = {}) {
    return api.get(`/roles/${id}/users`, params)
  },

  // 获取所有权限列表
  getAllPermissions() {
    return api.get('/roles/permissions')
  },

  // 复制角色
  copyRole(id, newRoleData) {
    return api.post(`/roles/${id}/copy`, newRoleData)
  },

  // 导出角色列表
  exportRoles(params = {}) {
    return api.download('/roles/export', params)
  }
}

export default rolesAPI