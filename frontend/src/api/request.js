import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    // 自动添加token
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // 显示加载状态
    if (config.loading !== false) {
      // 可以在这里添加全局loading
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data, config } = response

    // 隐藏加载状态
    if (config.loading !== false) {
      // 隐藏全局loading
    }

    // API统一响应格式处理
    if (data.success === false) {
      // 业务错误
      ElMessage.error(data.message || '操作失败')
      return Promise.reject(new Error(data.message || '操作失败'))
    }

    return data
  },
  (error) => {
    const { response, config } = error

    // 隐藏加载状态
    if (config?.loading !== false) {
      // 隐藏全局loading
    }

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // 未授权，清除token并跳转登录
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          authStore.logout()
          router.push('/login')
          break

        case 403:
          ElMessage.error(data?.message || '权限不足')
          break

        case 404:
          ElMessage.error(data?.message || '请求的资源不存在')
          break

        case 422:
          // 参数验证错误
          if (data?.errors && Array.isArray(data.errors)) {
            const errorMsg = data.errors.map(err => err.msg).join(', ')
            ElMessage.error(errorMsg)
          } else {
            ElMessage.error(data?.message || '参数验证失败')
          }
          break

        case 500:
          ElMessage.error(data?.message || '服务器内部错误')
          break

        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求失败，请稍后重试')
    }

    return Promise.reject(error)
  }
)

// 请求方法封装
export const api = {
  get(url, params = {}, config = {}) {
    return request.get(url, { params, ...config })
  },

  post(url, data = {}, config = {}) {
    return request.post(url, data, config)
  },

  put(url, data = {}, config = {}) {
    return request.put(url, data, config)
  },

  patch(url, data = {}, config = {}) {
    return request.patch(url, data, config)
  },

  delete(url, config = {}) {
    return request.delete(url, config)
  },

  // 文件上传
  upload(url, formData, config = {}) {
    return request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },

  // 文件下载
  download(url, params = {}, config = {}) {
    return request.get(url, {
      params,
      responseType: 'blob',
      ...config
    })
  }
}

export default request