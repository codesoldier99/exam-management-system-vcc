// 小程序全局配置
App({
  globalData: {
    // 用户信息
    userInfo: null,
    candidateInfo: null,
    userType: null, // 'candidate' | 'staff'

    // 登录状态
    isLogin: false,
    token: '',

    // API配置
    apiBaseUrl: 'https://your-domain.com/api', // 请修改为实际的API地址

    // 系统信息
    systemInfo: null,

    // 页面栈
    pageStack: []
  },

  onLaunch() {
    console.log('小程序启动')

    // 获取系统信息
    this.getSystemInfo()

    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  onError(msg) {
    console.error('小程序错误:', msg)
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('系统信息:', res)
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err)
      }
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('exam_token')
      const userType = wx.getStorageSync('exam_user_type')
      const userInfo = wx.getStorageSync('exam_user_info')
      const candidateInfo = wx.getStorageSync('exam_candidate_info')

      if (token && userType && (userInfo || candidateInfo)) {
        this.globalData.isLogin = true
        this.globalData.token = token
        this.globalData.userType = userType
        this.globalData.userInfo = userInfo
        this.globalData.candidateInfo = candidateInfo

        console.log('检查登录状态: 已登录', {
          userType,
          userInfo: userInfo || candidateInfo
        })
      } else {
        console.log('检查登录状态: 未登录')
        this.clearLoginData()
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.clearLoginData()
    }
  },

  // 设置登录信息
  setLoginInfo(data) {
    const { token, userType, userInfo, candidateInfo } = data

    this.globalData.isLogin = true
    this.globalData.token = token
    this.globalData.userType = userType

    if (userType === 'candidate') {
      this.globalData.candidateInfo = candidateInfo
      this.globalData.userInfo = null
    } else {
      this.globalData.userInfo = userInfo
      this.globalData.candidateInfo = null
    }

    try {
      // 存储到本地
      wx.setStorageSync('exam_token', token)
      wx.setStorageSync('exam_user_type', userType)

      if (userType === 'candidate') {
        wx.setStorageSync('exam_candidate_info', candidateInfo)
        wx.removeStorageSync('exam_user_info')
      } else {
        wx.setStorageSync('exam_user_info', userInfo)
        wx.removeStorageSync('exam_candidate_info')
      }

      console.log('设置登录信息成功')
    } catch (error) {
      console.error('设置登录信息失败:', error)
    }
  },

  // 清除登录数据
  clearLoginData() {
    this.globalData.isLogin = false
    this.globalData.token = ''
    this.globalData.userType = null
    this.globalData.userInfo = null
    this.globalData.candidateInfo = null

    try {
      wx.removeStorageSync('exam_token')
      wx.removeStorageSync('exam_user_type')
      wx.removeStorageSync('exam_user_info')
      wx.removeStorageSync('exam_candidate_info')
      console.log('清除登录数据成功')
    } catch (error) {
      console.error('清除登录数据失败:', error)
    }
  },

  // 退出登录
  logout(callback) {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.clearLoginData()

          // 跳转到登录页面
          wx.reLaunch({
            url: '/pages/student-login/student-login'
          })

          if (callback && typeof callback === 'function') {
            callback()
          }
        }
      }
    })
  },

  // 获取当前用户信息
  getCurrentUser() {
    if (this.globalData.userType === 'candidate') {
      return this.globalData.candidateInfo
    } else {
      return this.globalData.userInfo
    }
  },

  // 显示错误提示
  showError(message, duration = 2000) {
    wx.showToast({
      title: message || '操作失败',
      icon: 'none',
      duration: duration
    })
  },

  // 显示成功提示
  showSuccess(message, duration = 1500) {
    wx.showToast({
      title: message || '操作成功',
      icon: 'success',
      duration: duration
    })
  },

  // 显示加载中
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  },

  // 隐藏加载
  hideLoading() {
    wx.hideLoading()
  },

  // 页面导航
  navigateTo(url, params = {}) {
    let fullUrl = url

    // 添加参数
    if (Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&')
      fullUrl += `?${queryString}`
    }

    wx.navigateTo({
      url: fullUrl,
      fail: (err) => {
        console.error('页面跳转失败:', err)
        this.showError('页面跳转失败')
      }
    })
  },

  // 返回上一页
  navigateBack(delta = 1) {
    wx.navigateBack({
      delta: delta,
      fail: (err) => {
        console.error('返回上一页失败:', err)
        // 如果返回失败，跳转到首页
        wx.switchTab({
          url: '/pages/student-home/student-home'
        })
      }
    })
  }
})