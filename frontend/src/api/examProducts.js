import { api } from './request'

// 考试产品API
export const examProductsAPI = {
  // 获取考试产品列表
  getExamProducts(params = {}) {
    return api.get('/exam-products', params)
  },

  // 获取考试产品详情
  getExamProductById(id) {
    return api.get(`/exam-products/${id}`)
  },

  // 创建考试产品
  createExamProduct(data) {
    return api.post('/exam-products', data)
  },

  // 更新考试产品信息
  updateExamProduct(id, data) {
    return api.put(`/exam-products/${id}`, data)
  },

  // 更新考试产品状态
  updateExamProductStatus(id, status) {
    return api.patch(`/exam-products/${id}/status`, { status })
  },

  // 删除考试产品
  deleteExamProduct(id) {
    return api.delete(`/exam-products/${id}`)
  },

  // 复制考试产品
  copyExamProduct(id, newProductData) {
    return api.post(`/exam-products/${id}/copy`, newProductData)
  },

  // 获取产品分类
  getProductCategories() {
    return api.get('/exam-products/categories')
  },

  // 导出考试产品列表
  exportExamProducts(params = {}) {
    return api.download('/exam-products/export', params)
  },

  // 获取产品统计
  getExamProductStats() {
    return api.get('/exam-products/stats')
  },

  // 获取产品排期
  getProductSchedules(id, params = {}) {
    return api.get(`/exam-products/${id}/schedules`, params)
  }
}

export default examProductsAPI