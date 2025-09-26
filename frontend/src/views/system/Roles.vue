<template>
  <div class="roles">
    <div class="page-header">
      <h2>角色管理</h2>
      <p>管理系统角色和权限配置</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
        <el-button @click="handlePermissionTree">
          <el-icon><SetUp /></el-icon>
          权限配置
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索角色名称或描述"
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
        <el-form-item label="角色类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="系统角色" value="system" />
            <el-option label="业务角色" value="business" />
            <el-option label="自定义角色" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限级别">
          <el-slider
            v-model="permissionLevel"
            :min="1"
            :max="5"
            :step="1"
            :marks="permissionMarks"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="role-cards">
      <el-row :gutter="16">
        <el-col :span="6" v-for="role in tableData" :key="role.id">
          <div class="role-card">
            <div class="card-header">
              <div class="role-info">
                <div class="role-icon">
                  <el-icon :size="24">
                    <component :is="getRoleIcon(role.type)" />
                  </el-icon>
                </div>
                <div class="role-details">
                  <div class="role-name">{{ role.name }}</div>
                  <div class="role-code">{{ role.code }}</div>
                </div>
              </div>
              <div class="card-actions">
                <el-dropdown @command="(command) => handleCardAction(command, role)">
                  <el-button link>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="permissions">权限配置</el-dropdown-item>
                      <el-dropdown-item command="copy">复制角色</el-dropdown-item>
                      <el-dropdown-item command="users">关联用户</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="card-content">
              <div class="role-description">{{ role.description }}</div>
              <div class="role-stats">
                <div class="stat-item">
                  <span class="stat-label">用户数:</span>
                  <span class="stat-value">{{ role.userCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">权限数:</span>
                  <span class="stat-value">{{ role.permissions.length }}</span>
                </div>
              </div>

              <div class="permission-preview">
                <div class="permission-title">主要权限:</div>
                <div class="permission-tags">
                  <el-tag
                    v-for="permission in role.permissions.slice(0, 3)"
                    :key="permission"
                    size="small"
                    style="margin: 2px;"
                  >
                    {{ getPermissionText(permission) }}
                  </el-tag>
                  <el-tag v-if="role.permissions.length > 3" type="info" size="small">
                    +{{ role.permissions.length - 3 }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="role-meta">
                <el-tag
                  :type="getTypeTagType(role.type)"
                  size="small"
                  style="margin-right: 8px;"
                >
                  {{ getTypeText(role.type) }}
                </el-tag>
                <el-switch
                  v-model="role.status"
                  :active-value="'active'"
                  :inactive-value="'inactive'"
                  size="small"
                  @change="handleStatusChange(role)"
                />
              </div>
              <div class="update-time">
                更新: {{ formatDate(role.updatedAt) }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 表格视图切换按钮 -->
    <div class="view-toggle">
      <el-button-group>
        <el-button :type="viewMode === 'card' ? 'primary' : ''" @click="viewMode = 'card'">
          <el-icon><Grid /></el-icon>
          卡片视图
        </el-button>
        <el-button :type="viewMode === 'table' ? 'primary' : ''" @click="viewMode = 'table'">
          <el-icon><List /></el-icon>
          表格视图
        </el-button>
      </el-button-group>
    </div>

    <!-- 表格视图 -->
    <div class="data-table" v-if="viewMode === 'table'">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="角色信息" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="role-table-info">
              <div class="role-name">{{ row.name }}</div>
              <div class="role-code">{{ row.code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="userCount" label="用户数量" width="100" sortable />
        <el-table-column prop="permissions" label="权限数量" width="100">
          <template #default="{ row }">
            {{ row.permissions.length }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" @click="handlePermissions(row)">
              权限
            </el-button>
            <el-button link type="warning" @click="handleCopy(row)">
              复制
            </el-button>
            <el-popconfirm
              title="确定删除这个角色吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色代码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入角色代码"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="角色类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="system">系统角色</el-radio>
            <el-radio label="business">业务角色</el-radio>
            <el-radio label="custom">自定义角色</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="角色状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
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

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="800px"
    >
      <div class="permission-config">
        <div class="role-info-header">
          <h4>配置角色：{{ currentRole?.name }}</h4>
          <p>{{ currentRole?.description }}</p>
        </div>

        <div class="permission-tree">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTreeData"
            node-key="key"
            :props="{ label: 'label', children: 'children' }"
            show-checkbox
            :default-checked-keys="currentRolePermissions"
            :check-strictly="false"
          >
            <template #default="{ node, data }">
              <div class="permission-node">
                <div class="node-info">
                  <span class="node-label">{{ data.label }}</span>
                  <span class="node-desc">{{ data.description }}</span>
                </div>
                <div class="node-meta" v-if="data.level">
                  <el-tag :type="getLevelTagType(data.level)" size="small">
                    {{ data.level }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-tree>
        </div>

        <div class="permission-summary">
          <el-alert
            title="权限配置说明"
            type="info"
            show-icon
            :closable="false"
          >
            <p>• 选中的权限将授予该角色</p>
            <p>• 父权限被选中时，子权限自动继承</p>
            <p>• 高级权限需要管理员审批</p>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit">
            保存配置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 关联用户对话框 -->
    <el-dialog
      v-model="usersDialogVisible"
      title="关联用户"
      width="700px"
    >
      <div class="users-list">
        <div class="users-header">
          <h4>角色：{{ currentRole?.name }}</h4>
          <p>该角色下的用户列表（共{{ roleUsers.length }}人）</p>
        </div>

        <el-table :data="roleUsers" style="width: 100%" max-height="400">
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="姓名" width="120" />
          <el-table-column prop="email" label="邮箱" width="180" />
          <el-table-column prop="phone" label="手机" width="130" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                {{ row.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="usersDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Download, SetUp, MoreFilled, Grid, List,
  UserFilled, Setting, Warning, Star
} from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const usersDialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const viewMode = ref('card')
const formRef = ref()
const permissionTreeRef = ref()

const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const permissionLevel = ref([1, 5])
const permissionMarks = {
  1: '基础',
  2: '普通',
  3: '中级',
  4: '高级',
  5: '超管'
}

const form = reactive({
  name: '',
  code: '',
  type: 'business',
  description: '',
  status: 'active'
})

const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '角色代码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
}

const tableData = ref([
  {
    id: 1,
    name: '系统管理员',
    code: 'SYSTEM_ADMIN',
    type: 'system',
    description: '系统最高管理员，拥有所有权限',
    status: 'active',
    userCount: 2,
    permissions: ['user_manage', 'role_manage', 'system_config', 'data_manage'],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: 2,
    name: '机构管理员',
    code: 'INSTITUTION_ADMIN',
    type: 'business',
    description: '机构管理员，管理本机构的用户和业务',
    status: 'active',
    userCount: 8,
    permissions: ['candidate_manage', 'schedule_manage', 'venue_manage'],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-10'
  },
  {
    id: 3,
    name: '考务员',
    code: 'EXAMINER',
    type: 'business',
    description: '负责考试组织和管理工作',
    status: 'active',
    userCount: 15,
    permissions: ['schedule_manage', 'candidate_view'],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-08'
  },
  {
    id: 4,
    name: '教员',
    code: 'INSTRUCTOR',
    type: 'business',
    description: '负责培训和教学工作',
    status: 'active',
    userCount: 12,
    permissions: ['candidate_view', 'schedule_view'],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-05'
  }
])

const permissionTreeData = ref([
  {
    key: 'user_module',
    label: '用户管理',
    description: '用户和角色管理权限',
    level: '高级',
    children: [
      { key: 'user_manage', label: '用户管理', description: '增删改查用户' },
      { key: 'role_manage', label: '角色管理', description: '管理系统角色' },
      { key: 'permission_manage', label: '权限管理', description: '配置权限' }
    ]
  },
  {
    key: 'candidate_module',
    label: '考生管理',
    description: '考生相关功能权限',
    level: '中级',
    children: [
      { key: 'candidate_manage', label: '考生管理', description: '管理考生信息' },
      { key: 'candidate_view', label: '考生查看', description: '查看考生信息' },
      { key: 'candidate_import', label: '考生导入', description: '批量导入考生' }
    ]
  },
  {
    key: 'schedule_module',
    label: '排期管理',
    description: '考试排期功能权限',
    level: '中级',
    children: [
      { key: 'schedule_manage', label: '排期管理', description: '管理考试排期' },
      { key: 'schedule_view', label: '排期查看', description: '查看排期信息' },
      { key: 'schedule_batch', label: '批量排期', description: '批量创建排期' }
    ]
  },
  {
    key: 'venue_module',
    label: '考场管理',
    description: '考场相关功能权限',
    level: '普通',
    children: [
      { key: 'venue_manage', label: '考场管理', description: '管理考场信息' },
      { key: 'venue_view', label: '考场查看', description: '查看考场信息' }
    ]
  },
  {
    key: 'system_module',
    label: '系统管理',
    description: '系统配置和维护权限',
    level: '超管',
    children: [
      { key: 'system_config', label: '系统配置', description: '系统参数配置' },
      { key: 'data_manage', label: '数据管理', description: '数据备份和恢复' },
      { key: 'log_view', label: '日志查看', description: '查看系统日志' }
    ]
  }
])

const roleUsers = ref([
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    email: 'admin@example.com',
    phone: '13800138001',
    status: 'active'
  },
  {
    id: 2,
    username: 'manager1',
    realName: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138002',
    status: 'active'
  }
])

const currentRole = ref(null)
const currentRolePermissions = ref([])
const selectedRows = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

const getRoleIcon = (type) => {
  const iconMap = {
    system: Star,
    business: UserFilled,
    custom: Setting
  }
  return iconMap[type] || Warning
}

const getTypeTagType = (type) => {
  const typeMap = {
    system: 'danger',
    business: 'primary',
    custom: 'warning'
  }
  return typeMap[type] || ''
}

const getTypeText = (type) => {
  const typeMap = {
    system: '系统角色',
    business: '业务角色',
    custom: '自定义'
  }
  return typeMap[type] || type
}

const getLevelTagType = (level) => {
  const levelMap = {
    '基础': 'info',
    '普通': 'success',
    '中级': 'warning',
    '高级': 'danger',
    '超管': 'danger'
  }
  return levelMap[level] || ''
}

const getPermissionText = (permission) => {
  const permissionMap = {
    user_manage: '用户管理',
    role_manage: '角色管理',
    candidate_manage: '考生管理',
    schedule_manage: '排期管理',
    venue_manage: '考场管理',
    system_config: '系统配置',
    data_manage: '数据管理',
    candidate_view: '考生查看',
    schedule_view: '排期查看'
  }
  return permissionMap[permission] || permission
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'type') form[key] = 'business'
    else if (key === 'status') form[key] = 'active'
    else form[key] = ''
  })
}

const handleSearch = () => {
  fetchData()
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.keys(form).forEach(key => {
    form[key] = row[key] || ''
  })
  isEdit.value = true
  dialogVisible.value = true
}

const handleCopy = (row) => {
  Object.keys(form).forEach(key => {
    form[key] = row[key] || ''
  })
  form.code = ''
  form.name = form.name + ' - 副本'
  isEdit.value = false
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handlePermissions = (row) => {
  currentRole.value = row
  currentRolePermissions.value = row.permissions || []
  permissionDialogVisible.value = true
}

const handleCardAction = (command, row) => {
  switch (command) {
    case 'edit':
      handleEdit(row)
      break
    case 'permissions':
      handlePermissions(row)
      break
    case 'copy':
      handleCopy(row)
      break
    case 'users':
      currentRole.value = row
      usersDialogVisible.value = true
      break
    case 'delete':
      ElMessageBox.confirm(`确定删除角色 ${row.name} 吗？`, '警告', { type: 'warning' })
        .then(() => {
          handleDelete(row.id)
        })
        .catch(() => {})
      break
  }
}

const handleStatusChange = async (row) => {
  try {
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handlePermissionTree = () => {
  ElMessage.info('权限树配置功能开发中')
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

const handlePermissionSubmit = async () => {
  try {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
    const allPermissions = [...checkedKeys, ...halfCheckedKeys]

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    currentRole.value.permissions = allPermissions
    ElMessage.success('权限配置保存成功')
    permissionDialogVisible.value = false
    await fetchData()
  } catch (error) {
    ElMessage.error('权限配置保存失败')
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
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
.roles {
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

  .role-cards {
    margin-bottom: 20px;

    .role-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
      height: 280px;
      display: flex;
      flex-direction: column;

      &:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        .role-info {
          display: flex;
          align-items: flex-start;

          .role-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 12px;
            flex-shrink: 0;
          }

          .role-details {
            .role-name {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 4px;
            }

            .role-code {
              font-size: 12px;
              color: #909399;
              font-family: monospace;
            }
          }
        }

        .card-actions {
          color: #909399;
          cursor: pointer;
        }
      }

      .card-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .role-description {
          color: #606266;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
          flex: 1;
        }

        .role-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;

          .stat-item {
            .stat-label {
              font-size: 12px;
              color: #909399;
              margin-right: 4px;
            }

            .stat-value {
              font-weight: 600;
              color: #409eff;
            }
          }
        }

        .permission-preview {
          .permission-title {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }

          .permission-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;

        .role-meta {
          display: flex;
          align-items: center;
        }

        .update-time {
          font-size: 12px;
          color: #c0c4cc;
        }
      }
    }
  }

  .view-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .data-table {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);

    .role-table-info {
      .role-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .role-code {
        font-size: 12px;
        color: #909399;
        font-family: monospace;
      }
    }
  }

  .permission-config {
    .role-info-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ebeef5;

      h4 {
        margin: 0 0 8px 0;
        color: #303133;
      }

      p {
        margin: 0;
        color: #606266;
        font-size: 14px;
      }
    }

    .permission-tree {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;

      .permission-node {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .node-info {
          flex: 1;

          .node-label {
            font-weight: 500;
            margin-right: 8px;
          }

          .node-desc {
            font-size: 12px;
            color: #909399;
          }
        }

        .node-meta {
          flex-shrink: 0;
        }
      }
    }

    .permission-summary {
      :deep(.el-alert__content) {
        p {
          margin: 2px 0;
        }
      }
    }
  }

  .users-list {
    .users-header {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        color: #303133;
      }

      p {
        margin: 0;
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 8px 0;

  .el-tree-node__expand-icon {
    margin-top: 4px;
  }

  .el-checkbox {
    margin-top: 4px;
  }
}

@media (max-width: 768px) {
  .roles {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .toolbar-right {
        justify-content: center;
      }
    }

    .role-cards {
      .el-col {
        margin-bottom: 16px;
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