<template>
  <div class="main-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar-container">
        <div class="logo-container">
          <div class="logo">
            <img v-if="!isCollapse" src="@/assets/logo.png" alt="Logo" />
            <span v-if="!isCollapse" class="logo-text">无人机考点管理</span>
          </div>
        </div>

        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          class="sidebar-menu"
          router
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-sub-menu v-if="route.children && route.children.length > 1" :index="route.path">
              <template #title>
                <el-icon><component :is="route.meta.icon" /></el-icon>
                <span>{{ route.meta.title }}</span>
              </template>

              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="child.path"
                v-show="hasRoutePermission(child)"
              >
                <span>{{ child.meta.title }}</span>
              </el-menu-item>
            </el-sub-menu>

            <el-menu-item
              v-else-if="route.children && route.children.length === 1"
              :index="route.children[0].path"
              v-show="hasRoutePermission(route.children[0])"
            >
              <el-icon><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.children[0].meta.title }}</span>
            </el-menu-item>

            <el-menu-item
              v-else
              :index="route.path"
              v-show="hasRoutePermission(route)"
            >
              <el-icon><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航 -->
        <el-header class="navbar">
          <div class="navbar-left">
            <el-button
              type="text"
              size="large"
              @click="toggleCollapse"
            >
              <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
            </el-button>
          </div>

          <div class="navbar-right">
            <!-- 用户信息下拉菜单 -->
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userAvatar">
                  {{ authStore.user?.real_name?.[0] || 'U' }}
                </el-avatar>
                <span class="username">{{ authStore.user?.real_name || '用户' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="change-password">
                    <el-icon><Key /></el-icon>
                    修改密码
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容区域 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordVisible"
      title="修改密码"
      width="400px"
      :before-close="handleClosePasswordDialog"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="old_password">
          <el-input
            v-model="passwordForm.old_password"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="passwordForm.new_password"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input
            v-model="passwordForm.confirm_password"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="changePasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="submitChangePassword">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  ArrowDown,
  User,
  Key,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  const { matched } = route
  return matched[matched.length - 1]?.path || route.path
})

// 菜单路由配置
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
    .find(r => r.path === '/')
    ?.children?.filter(route =>
      route.meta?.title &&
      !route.meta?.hidden &&
      hasRoutePermission(route)
    ) || []

  // 按icon分组，同一icon的路由归为一组
  const groupedRoutes = []
  const iconGroups = {}

  routes.forEach(route => {
    const icon = route.meta?.icon
    if (icon) {
      if (!iconGroups[icon]) {
        iconGroups[icon] = {
          path: route.path,
          meta: {
            title: getGroupTitle(icon),
            icon: icon
          },
          children: []
        }
        groupedRoutes.push(iconGroups[icon])
      }
      iconGroups[icon].children.push(route)
    } else {
      groupedRoutes.push(route)
    }
  })

  return groupedRoutes
})

const getGroupTitle = (icon) => {
  const titleMap = {
    'User': '考生管理',
    'Calendar': '排期管理',
    'Setting': '基础数据',
    'Tools': '系统管理'
  }
  return titleMap[icon] || '其他'
}

// 用户头像
const userAvatar = ref('')

// 修改密码相关
const changePasswordVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const passwordRules = {
  old_password: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.new_password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const hasRoutePermission = (route) => {
  if (!route.meta?.roles || route.meta.roles.length === 0) {
    return true
  }
  return route.meta.roles.some(role => authStore.hasRole(role))
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      break
    case 'change-password':
      changePasswordVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await authStore.logout()
    router.push('/login')
    ElMessage.success('退出登录成功')
  } catch (error) {
    // 用户取消或其他错误
  }
}

const handleClosePasswordDialog = (done) => {
  passwordForm.value = {
    old_password: '',
    new_password: '',
    confirm_password: ''
  }
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
  done()
}

const submitChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()

    await authStore.changePassword({
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
      confirm_password: passwordForm.value.confirm_password
    })

    ElMessage.success('密码修改成功')
    changePasswordVisible.value = false
  } catch (error) {
    // 错误已在store中处理
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;

  .sidebar-container {
    background-color: #304156;
    transition: width 0.3s;

    .logo-container {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #2b3642;

      .logo {
        display: flex;
        align-items: center;
        gap: 8px;

        img {
          width: 32px;
          height: 32px;
        }

        .logo-text {
          color: #fff;
          font-weight: bold;
          font-size: 16px;
        }
      }
    }

    .sidebar-menu {
      border: none;
      background-color: #304156;

      :deep(.el-menu-item) {
        color: #bfcbd9;

        &:hover {
          background-color: #263445;
          color: #409eff;
        }

        &.is-active {
          background-color: #409eff;
          color: #fff;
        }
      }

      :deep(.el-sub-menu) {
        .el-sub-menu__title {
          color: #bfcbd9;

          &:hover {
            background-color: #263445;
            color: #409eff;
          }
        }

        .el-menu {
          background-color: #1f2d3d;

          .el-menu-item {
            &:hover {
              background-color: #001528;
            }
          }
        }
      }
    }
  }

  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0,21,41,.08);
    padding: 0 20px;

    .navbar-left {
      display: flex;
      align-items: center;
    }

    .navbar-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f5f5;
        }

        .username {
          color: #606266;
        }
      }
    }
  }

  .main-content {
    background-color: #f0f2f5;
    padding: 20px;
  }
}

// 页面切换动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>