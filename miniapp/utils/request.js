// 网络请求工具类
const app = getApp()

class Request {
  constructor() {
    this.baseURL = app.globalData.apiBaseUrl
    this.timeout = 60000
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }

    // 添加token
    if (app.globalData.token) {
      headers['Authorization'] = `Bearer ${app.globalData.token}`
    }

    return headers
  }

  // 统一请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 显示加载
      if (options.showLoading !== false) {
        wx.showLoading({
          title: options.loadingText || '请求中...',
          mask: true
        })
      }

      wx.request({
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          ...this.getHeaders(),
          ...options.header
        },
        timeout: this.timeout,
        success: (res) => {
          console.log('API请求成功:', options.url, res.data)

          // 隐藏加载
          if (options.showLoading !== false) {
            wx.hideLoading()
          }

          // 处理响应
          this.handleResponse(res, resolve, reject)
        },
        fail: (err) => {
          console.error('API请求失败:', options.url, err)

          // 隐藏加载
          if (options.showLoading !== false) {
            wx.hideLoading()
          }

          // 处理错误
          this.handleError(err, reject)
        }
      })
    })
  }

  // 处理响应
  handleResponse(res, resolve, reject) {
    const { statusCode, data } = res

    if (statusCode === 200) {
      if (data.success) {
        resolve(data.data)
      } else {
        // 业务错误
        const error = {
          code: data.code || 'BUSINESS_ERROR',
          message: data.message || '操作失败'
        }

        if (data.errors && Array.isArray(data.errors)) {
          error.message = data.errors.map(err => err.msg).join(', ')
        }

        wx.showToast({
          title: error.message,
          icon: 'none',
          duration: 2000
        })

        reject(error)
      }
    } else if (statusCode === 401) {
      // 未授权，清除登录状态
      wx.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      })

      app.clearLoginData()

      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/student-login/student-login'
        })
      }, 2000)

      reject({
        code: 'UNAUTHORIZED',
        message: '未授权访问'
      })
    } else if (statusCode === 403) {
      wx.showToast({
        title: data?.message || '权限不足',
        icon: 'none',
        duration: 2000
      })

      reject({
        code: 'FORBIDDEN',
        message: data?.message || '权限不足'
      })
    } else if (statusCode === 404) {
      wx.showToast({
        title: '请求的资源不存在',
        icon: 'none',
        duration: 2000
      })

      reject({
        code: 'NOT_FOUND',
        message: '请求的资源不存在'
      })
    } else if (statusCode >= 500) {
      wx.showToast({
        title: '服务器内部错误',
        icon: 'none',
        duration: 2000
      })

      reject({
        code: 'SERVER_ERROR',
        message: '服务器内部错误'
      })
    } else {
      wx.showToast({
        title: data?.message || `请求失败(${statusCode})`,
        icon: 'none',
        duration: 2000
      })

      reject({
        code: 'HTTP_ERROR',
        message: data?.message || `请求失败(${statusCode})`
      })
    }
  }

  // 处理网络错误
  handleError(err, reject) {
    let message = '网络连接失败'

    if (err.errMsg) {
      if (err.errMsg.includes('timeout')) {
        message = '请求超时，请稍后重试'
      } else if (err.errMsg.includes('fail')) {
        message = '网络连接失败，请检查网络'
      }
    }

    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })

    reject({
      code: 'NETWORK_ERROR',
      message: message,
      originalError: err
    })
  }

  // GET请求
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // PATCH请求
  patch(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PATCH',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }

  // 文件上传
  upload(url, filePath, options = {}) {
    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: options.loadingText || '上传中...',
        mask: true
      })

      wx.uploadFile({
        url: this.baseURL + url,
        filePath: filePath,
        name: options.name || 'file',
        formData: options.formData || {},
        header: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data',
          ...options.header
        },
        success: (res) => {
          wx.hideLoading()

          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              resolve(data.data)
            } else {
              wx.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              })
              reject(new Error(data.message || '上传失败'))
            }
          } catch (error) {
            wx.showToast({
              title: '上传响应格式错误',
              icon: 'none'
            })
            reject(error)
          }
        },
        fail: (err) => {
          wx.hideLoading()
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  }
}

// 创建实例
const request = new Request()

// 导出API方法
module.exports = {
  // 考生登录
  candidateLogin: (data) => request.post('/miniapp/candidate/login', data),

  // 考务人员登录
  staffLogin: (data) => request.post('/miniapp/staff/login', data),

  // 获取考生个人信息
  getCandidateProfile: () => request.get('/miniapp/candidate/profile'),

  // 生成考生二维码
  generateCandidateQR: (params = {}) => request.get('/miniapp/candidate/qrcode', params),

  // 获取今日日程
  getTodaySchedules: () => request.get('/miniapp/candidate/today-schedules'),

  // 扫码签到
  scanCheckin: (data) => request.post('/miniapp/staff/scan-checkin', data),

  // 获取公共考场看板
  getPublicBoard: (params = {}) => request.get('/miniapp/public/board', params),

  // 获取考场看板（考务人员）
  getStaffBoard: (params = {}) => request.get('/miniapp/staff/board', params),

  // 通用请求方法
  request: request.request.bind(request),
  get: request.get.bind(request),
  post: request.post.bind(request),
  put: request.put.bind(request),
  patch: request.patch.bind(request),
  delete: request.delete.bind(request),
  upload: request.upload.bind(request)
}