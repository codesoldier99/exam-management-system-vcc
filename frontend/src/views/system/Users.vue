<template>
  <div class="users">
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统用户账号和权限信息</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-dropdown @command="handleBatchAction" v-if="selectedRows.length > 0">
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="enable">启用选中</el-dropdown-item>
              <el-dropdown-item command="disable">禁用选中</el-dropdown-item>
              <el-dropdown-item command="reset-password">重置密码</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除选中</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名、姓名或邮箱"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" style="margin-left: 8px">
          搜索
        </el-button>
      </div>
    </div>

    <div class="filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleId" placeholder="全部角色" clearable style="width: 150px">
            <el-option label="系统管理员" :value="1" />
            <el-option label="机构管理员" :value="2" />
            <el-option label="考务员" :value="3" />
            <el-option label="教员" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属机构">
          <el-select v-model="searchForm.institutionId" placeholder="全部机构" clearable style="width: 200px">
            <el-option label="北京航空学院" :value="1" />
            <el-option label="上海无人机中心" :value="2" />
            <el-option label="深圳飞行基地" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="锁定" value="locked" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 220px"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon online">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.online }}</div>
              <div class="stat-label">在线用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon locked">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.locked }}</div>
              <div class="stat-label">锁定用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><DataBoard /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总用户</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="data-table">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="40">
              {{ row.realName?.charAt(0) || row.username.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户信息" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="user-info">
              <div class="main-info">
                <div class="username">{{ row.username }}</div>
                <div class="real-name">{{ row.realName }}</div>
              </div>
              <div class="sub-info">
                <div class="email">{{ row.email }}</div>
                <div class="phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.roleId)">
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="institution" label="所属机构" width="180">
          <template #default="{ row }">
            {{ row.institutionName || '系统管理员' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              :effect="row.status === 'active' ? 'light' : 'plain'"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="getStatusIcon(row.status)" />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isOnline" label="在线状态" width="100">
          <template #default="{ row }">
            <div class="online-status">
              <div :class="['status-dot', row.isOnline ? 'online' : 'offline']"></div>
              {{ row.isOnline ? '在线' : '离线' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="150" sortable>
          <template #default="{ row }">
            <div v-if="row.lastLoginAt">
              <div>{{ formatDate(row.lastLoginAt) }}</div>
              <div class="time-ago">{{ getTimeAgo(row.lastLoginAt) }}</div>
            </div>
            <span v-else class="text-muted">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleRowAction(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reset-password">重置密码</el-dropdown-item>
                  <el-dropdown-item command="change-role">修改角色</el-dropdown-item>
                  <el-dropdown-item
                    :command="row.status === 'active' ? 'disable' : 'enable'"
                  >
                    {{ row.status === 'active' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="login-log">登录日志</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱地址" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="!isEdit">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户角色" prop="roleId">
              <el-select v-model="form.roleId" placeholder="选择用户角色" style="width: 100%">
                <el-option label="系统管理员" :value="1" />
                <el-option label="机构管理员" :value="2" />
                <el-option label="考务员" :value="3" />
                <el-option label="教员" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属机构" prop="institutionId" v-if="form.roleId !== 1">
              <el-select v-model="form.institutionId" placeholder="选择所属机构" style="width: 100%">
                <el-option label="北京航空学院" :value="1" />
                <el-option label="上海无人机中心" :value="2" />
                <el-option label="深圳飞行基地" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="用户状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="用户权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox label="user_manage">用户管理</el-checkbox>
            <el-checkbox label="candidate_manage">考生管理</el-checkbox>
            <el-checkbox label="schedule_manage">排期管理</el-checkbox>
            <el-checkbox label="venue_manage">考场管理</el-checkbox>
            <el-checkbox label="report_view">报表查看</el-checkbox>
            <el-checkbox label="system_config">系统配置</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="500px">
      <el-alert
        title="密码重置说明"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <p>重置后的密码将发送到用户邮箱</p>
        <p>默认密码为：123456</p>
      </el-alert>

      <el-form :model="resetPasswordForm" label-width="100px">
        <el-form-item label="用户">
          <el-input :value="currentResetUser?.username" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="发送通知">
          <el-checkbox v-model="resetPasswordForm.sendNotification">
            发送邮件通知用户
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetPasswordSubmit">
            确认重置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 登录日志对话框 -->
    <el-dialog v-model="loginLogDialogVisible" title="登录日志" width="900px">
      <el-table :data="loginLogs" style="width: 100%" max-height="400">
        <el-table-column prop="loginAt" label="登录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.loginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="location" label="登录地点" width="120" />
        <el-table-column prop="device" label="设备信息" min-width="200" />
        <el-table-column prop="browser" label="浏览器" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="loginLogDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Upload, Download, ArrowDown, UserFilled, Connection,
  Lock, DataBoard, SuccessFilled, CircleCloseFilled, WarningFilled
} from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)
const loginLogDialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const searchForm = reactive({
  keyword: '',
  roleId: '',
  institutionId: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const stats = reactive({
  active: 45,
  online: 12,
  locked: 3,
  total: 50
})

const form = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  institutionId: '',
  status: 'active',
  permissions: [],
  notes: ''
})

const resetPasswordForm = reactive({
  newPassword: '123456',
  sendNotification: true
})

const currentResetUser = ref(null)

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  roleId: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
}

const tableData = ref([
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    email: 'admin@example.com',
    phone: '13800138001',
    roleId: 1,
    roleName: '系统管理员',
    institutionId: null,
    institutionName: null,
    status: 'active',
    isOnline: true,
    avatar: '',
    lastLoginAt: '2024-01-20 14:30:00',
    createdAt: '2023-01-01 10:00:00',
    permissions: ['user_manage', 'candidate_manage', 'schedule_manage', 'system_config']
  },
  {
    id: 2,
    username: 'manager1',
    realName: '张三',
    email: 'zhangsan@bjuav.com',
    phone: '13800138002',
    roleId: 2,
    roleName: '机构管理员',
    institutionId: 1,
    institutionName: '北京航空学院',
    status: 'active',
    isOnline: false,
    avatar: '',
    lastLoginAt: '2024-01-19 16:45:00',
    createdAt: '2023-06-15 09:30:00'
  }
])

const loginLogs = ref([
  {
    loginAt: '2024-01-20 14:30:00',
    ipAddress: '192.168.1.100',
    location: '北京',
    device: 'Windows 10',
    browser: 'Chrome 120.0',
    status: 'success'
  },
  {
    loginAt: '2024-01-20 09:15:00',
    ipAddress: '192.168.1.100',
    location: '北京',
    device: 'Windows 10',
    browser: 'Chrome 120.0',
    status: 'success'
  },
  {
    loginAt: '2024-01-19 18:22:00',
    ipAddress: '192.168.1.105',
    location: '上海',
    device: 'iPhone',
    browser: 'Safari 17.0',
    status: 'failed'
  }
])

const selectedRows = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

const getRoleTagType = (roleId) => {
  const roleMap = {
    1: 'danger',  // 系统管理员
    2: 'primary', // 机构管理员
    3: 'success', // 考务员
    4: 'warning'  // 教员
  }
  return roleMap[roleId] || ''
}

const getStatusTagType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'danger',
    locked: 'warning'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    active: '正常',
    inactive: '禁用',
    locked: '锁定'
  }
  return statusMap[status] || status
}

const getStatusIcon = (status) => {
  const iconMap = {
    active: SuccessFilled,
    inactive: CircleCloseFilled,
    locked: WarningFilled
  }
  return iconMap[status] || SuccessFilled
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getTimeAgo = (dateStr) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  return '刚刚'
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'status') form[key] = 'active'
    else if (key === 'permissions') form[key] = []
    else form[key] = ''
  })
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.keys(form).forEach(key => {
    if (key === 'confirmPassword' || key === 'password') {
      form[key] = ''
    } else {
      form[key] = row[key] || (Array.isArray(form[key]) ? [] : '')
    }
  })
  isEdit.value = true
  dialogVisible.value = true
}

const handleView = (row) => {
  const roleText = row.roleName
  const institutionText = row.institutionName || '系统管理员'
  const statusText = getStatusText(row.status)

  ElMessageBox.alert(
    `用户名：${row.username}<br/>
     真实姓名：${row.realName}<br/>
     邮箱地址：${row.email}<br/>
     手机号码：${row.phone}<br/>
     用户角色：${roleText}<br/>
     所属机构：${institutionText}<br/>
     用户状态：${statusText}<br/>
     在线状态：${row.isOnline ? '在线' : '离线'}<br/>
     最后登录：${row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '从未登录'}<br/>
     注册时间：${formatDateTime(row.createdAt)}`,
    '用户详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const handleRowAction = (command, row) => {
  switch (command) {
    case 'reset-password':
      currentResetUser.value = row
      resetPasswordForm.newPassword = '123456'
      resetPasswordForm.sendNotification = true
      resetPasswordDialogVisible.value = true
      break
    case 'change-role':
      ElMessage.info('修改角色功能开发中')
      break
    case 'enable':
      ElMessageBox.confirm(`确定要启用用户 ${row.username} 吗？`)
        .then(() => {
          row.status = 'active'
          ElMessage.success('用户已启用')
        })
        .catch(() => {})
      break
    case 'disable':
      ElMessageBox.confirm(`确定要禁用用户 ${row.username} 吗？`)
        .then(() => {
          row.status = 'inactive'
          ElMessage.success('用户已禁用')
        })
        .catch(() => {})
      break
    case 'login-log':
      loginLogDialogVisible.value = true
      break
    case 'delete':
      ElMessageBox.confirm(`确定删除用户 ${row.username} 吗？`, '警告', { type: 'warning' })
        .then(() => {
          ElMessage.success('删除成功')
          fetchData()
        })
        .catch(() => {})
      break
  }
}

const handleBatchAction = (command) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }

  const usernames = selectedRows.value.map(row => row.username).join('、')

  switch (command) {
    case 'enable':
      ElMessageBox.confirm(`确定要启用 ${usernames} 等 ${selectedRows.value.length} 个用户吗？`)
        .then(() => {
          ElMessage.success('批量启用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'disable':
      ElMessageBox.confirm(`确定要禁用 ${usernames} 等 ${selectedRows.value.length} 个用户吗？`)
        .then(() => {
          ElMessage.success('批量禁用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'reset-password':
      ElMessageBox.confirm(`确定要重置 ${usernames} 等 ${selectedRows.value.length} 个用户的密码吗？`)
        .then(() => {
          ElMessage.success('批量重置密码成功')
        })
        .catch(() => {})
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除 ${usernames} 等 ${selectedRows.value.length} 个用户吗？`, '警告', { type: 'warning' })
        .then(() => {
          ElMessage.success('批量删除成功')
          fetchData()
        })
        .catch(() => {})
      break
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSortChange = ({ column, prop, order }) => {
  console.log('Sort change:', { column, prop, order })
  fetchData()
}

const handleBatchImport = () => {
  ElMessage.info('批量导入功能开发中')
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

const handleDialogClose = () => {
  formRef.value?.clearValidate()
  dialogVisible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleResetPasswordSubmit = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('密码重置成功')
    resetPasswordDialogVisible.value = false

    if (resetPasswordForm.sendNotification) {
      ElMessage.info('邮件通知已发送')
    }
  } catch (error) {
    ElMessage.error('密码重置失败')
  }
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    pagination.total = 50
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.users {
  padding: 20px;

  .page-header {
    margin-bottom: 24px;

    h2 {
      color: #303133;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    p {
      color: #606266;
      font-size: 14px;
      margin: 0;
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
    }
  }

  .filters {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .stats-cards {
    margin-bottom: 16px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        font-size: 24px;
        color: #fff;

        &.active { background: #67c23a; }
        &.online { background: #409eff; }
        &.locked { background: #e6a23c; }
        &.total { background: #909399; }
      }

      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #606266;
          margin-top: 4px;
        }
      }
    }
  }

  .data-table {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);

    .user-info {
      .main-info {
        margin-bottom: 4px;

        .username {
          font-weight: 500;
          color: #303133;
          font-size: 14px;
        }

        .real-name {
          font-size: 12px;
          color: #606266;
        }
      }

      .sub-info {
        .email {
          font-size: 12px;
          color: #909399;
        }

        .phone {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .online-status {
      display: flex;
      align-items: center;
      font-size: 12px;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;

        &.online {
          background: #67c23a;
          box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
        }

        &.offline {
          background: #c0c4cc;
        }
      }
    }

    .time-ago {
      font-size: 11px;
      color: #c0c4cc;
    }

    .text-muted {
      color: #c0c4cc;
    }

    .pagination {
      padding: 16px;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .users {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .toolbar-right {
        justify-content: center;
      }
    }

    .stats-cards {
      .el-col {
        margin-bottom: 8px;
      }
    }

    .filters {
      :deep(.el-form--inline) {
        .el-form-item {
          width: 100%;
          margin-right: 0;

          .el-form-item__content {
            width: 100% !important;
          }
        }
      }
    }
  }
}
</style>