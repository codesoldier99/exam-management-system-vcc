// 考生登录页面
const app = getApp()
const api = require('../../utils/request.js')

Page({
  data: {
    // 表单数据
    formData: {
      id_number: '',
      phone: ''
    },

    // 表单验证
    formErrors: {},

    // 加载状态
    loading: false,

    // 是否显示密码
    showTips: true
  },

  onLoad(options) {
    console.log('考生登录页面加载')

    // 检查是否已登录
    if (app.globalData.isLogin && app.globalData.userType === 'candidate') {
      wx.switchTab({
        url: '/pages/student-home/student-home'
      })
      return
    }

    // 获取系统信息，适配不同设备
    this.setSystemInfo()
  },

  onShow() {
    // 清除表单数据
    this.setData({
      formData: {
        id_number: '',
        phone: ''
      },
      formErrors: {}
    })
  },

  // 设置系统信息
  setSystemInfo() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      safeAreaBottom: systemInfo.safeArea.bottom
    })
  },

  // 输入框内容变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`formData.${field}`]: value,
      [`formErrors.${field}`]: '' // 清除错误信息
    })
  },

  // 验证表单
  validateForm() {
    const { id_number, phone } = this.data.formData
    const errors = {}

    // 验证身份证号
    if (!id_number.trim()) {
      errors.id_number = '请输入身份证号'
    } else if (!/^[0-9X]{15,20}$/i.test(id_number.trim())) {
      errors.id_number = '身份证号格式不正确'
    }

    // 验证手机号
    if (!phone.trim()) {
      errors.phone = '请输入手机号'
    } else if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      errors.phone = '手机号格式不正确'
    }

    this.setData({
      formErrors: errors
    })

    return Object.keys(errors).length === 0
  },

  // 提交登录
  async handleLogin() {
    if (!this.validateForm()) {
      return
    }

    if (this.data.loading) {
      return
    }

    try {
      this.setData({ loading: true })

      const { id_number, phone } = this.data.formData

      const response = await api.candidateLogin({
        id_number: id_number.trim(),
        phone: phone.trim()
      })

      console.log('登录成功:', response)

      // 保存登录信息
      app.setLoginInfo({
        token: response.token,
        userType: 'candidate',
        candidateInfo: response.candidate
      })

      // 显示成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/student-home/student-home'
        })
      }, 1500)

    } catch (error) {
      console.error('登录失败:', error)
      // 错误提示已在request.js中处理
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转到考务人员登录
  goToStaffLogin() {
    wx.navigateTo({
      url: '/pages/staff-login/staff-login'
    })
  },

  // 查看帮助
  showHelp() {
    wx.showModal({
      title: '登录帮助',
      content: '请使用您报名时填写的身份证号和手机号进行登录。如有疑问，请联系考试机构工作人员。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 联系客服
  contactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '复制微信号'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 拨打客服电话
          wx.makePhoneCall({
            phoneNumber: '400-123-4567', // 替换为实际客服电话
            fail: (err) => {
              console.error('拨打电话失败:', err)
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 复制微信号
          wx.setClipboardData({
            data: 'exam_service_001', // 替换为实际微信号
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 隐藏提示
  hideTips() {
    this.setData({
      showTips: false
    })
  }
})