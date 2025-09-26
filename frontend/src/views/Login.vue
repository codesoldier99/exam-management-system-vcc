<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-header">
        <h1 class="login-title">无人机考点运营管理系统</h1>
        <p class="login-subtitle">管理员登录</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <p>测试账号：</p>
        <p>管理员：admin / 123456</p>
        <p>机构管理员：institution_admin / 123456</p>
        <p>考务员：proctor / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 表单数据
const loginForm = ref({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
}

const loginFormRef = ref()
const loading = ref(false)

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    await authStore.login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    ElMessage.success('登录成功')

    // 跳转到原来要访问的页面或首页
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)

  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 页面挂载时的处理
onMounted(() => {
  // 如果已经登录，直接跳转
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  }

  .login-form-wrapper {
    background: rgba(255, 255, 255, 0.95);
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 1;

    .login-header {
      text-align: center;
      margin-bottom: 32px;

      .login-title {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px 0;
      }

      .login-subtitle {
        font-size: 16px;
        color: #909399;
        margin: 0;
      }
    }

    .login-form {
      .login-button {
        width: 100%;
        height: 50px;
        font-size: 16px;
        font-weight: 500;
      }

      :deep(.el-input) {
        .el-input__wrapper {
          height: 50px;
          border-radius: 8px;
        }
      }
    }

    .login-tips {
      margin-top: 24px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      font-size: 13px;
      color: #666;
      line-height: 1.6;

      p {
        margin: 0 0 4px 0;

        &:first-child {
          font-weight: 600;
          margin-bottom: 8px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-container {
    padding: 20px;

    .login-form-wrapper {
      padding: 30px 20px;
      margin: 0;

      .login-header {
        .login-title {
          font-size: 24px;
        }
      }
    }
  }
}
</style>