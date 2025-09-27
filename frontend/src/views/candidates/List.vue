<template>
  <div class="candidates-list">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">考生管理</h1>
        <p class="page-description">管理和维护考生信息</p>
      </div>

      <div class="page-content">
        <!-- 搜索和筛选 -->
        <div class="content-header">
          <div class="search-form">
            <el-form :model="searchForm" inline>
              <el-form-item>
                <el-input
                  v-model="searchForm.search"
                  placeholder="搜索考生姓名、身份证号或手机号"
                  clearable
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-select v-model="searchForm.status" placeholder="状态筛选" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="正常" value="active" />
                  <el-option label="禁用" value="inactive" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleSearch">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增考生
            </el-button>
            <el-button type="success" @click="handleImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="info" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </div>

        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />

          <el-table-column prop="name" label="姓名" min-width="100" />

          <el-table-column prop="id_number" label="身份证号" min-width="180" />

          <el-table-column prop="phone" label="手机号" min-width="130" />

          <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />

          <el-table-column prop="gender" label="性别" width="80">
            <template #default="{ row }">
              <span v-if="row.gender === 'male'">男</span>
              <span v-else-if="row.gender === 'female'">女</span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="institution" label="机构" min-width="120">
            <template #default="{ row }">
              {{ row.institution?.name || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="handleView(row)">
                详情
              </el-button>
              <el-button type="text" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="text" size="small" danger @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增考生对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增考生"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="candidateFormRef"
        :model="candidateForm"
        :rules="candidateRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="candidateForm.name" placeholder="请输入考生姓名" />
        </el-form-item>

        <el-form-item label="身份证号" prop="id_number">
          <el-input v-model="candidateForm.id_number" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="candidateForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="candidateForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="candidateForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生日期" prop="birth_date">
          <el-input v-model="candidateForm.birth_date" type="date" />
        </el-form-item>

        <el-form-item label="联系地址" prop="address">
          <el-input v-model="candidateForm.address" type="textarea" placeholder="请输入联系地址" />
        </el-form-item>

        <el-form-item label="报名号" prop="registration_number">
          <el-input v-model="candidateForm.registration_number" placeholder="请输入报名号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitAdd">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑考生对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑考生"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="candidateFormRef"
        :model="candidateForm"
        :rules="candidateRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="candidateForm.name" placeholder="请输入考生姓名" />
        </el-form-item>

        <el-form-item label="身份证号" prop="id_number">
          <el-input v-model="candidateForm.id_number" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="candidateForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="candidateForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="candidateForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生日期" prop="birth_date">
          <el-input v-model="candidateForm.birth_date" type="date" />
        </el-form-item>

        <el-form-item label="联系地址" prop="address">
          <el-input v-model="candidateForm.address" type="textarea" placeholder="请输入联系地址" />
        </el-form-item>

        <el-form-item label="报名号" prop="registration_number">
          <el-input v-model="candidateForm.registration_number" placeholder="请输入报名号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitEdit">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看考生详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="考生详情"
      width="600px"
    >
      <div v-if="currentCandidate" class="candidate-detail">
        <div class="detail-row">
          <span class="label">姓名：</span>
          <span class="value">{{ currentCandidate.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">身份证号：</span>
          <span class="value">{{ currentCandidate.id_number }}</span>
        </div>
        <div class="detail-row">
          <span class="label">手机号：</span>
          <span class="value">{{ currentCandidate.phone }}</span>
        </div>
        <div class="detail-row">
          <span class="label">邮箱：</span>
          <span class="value">{{ currentCandidate.email || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">性别：</span>
          <span class="value">{{ currentCandidate.gender === 'male' ? '男' : currentCandidate.gender === 'female' ? '女' : '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">出生日期：</span>
          <span class="value">{{ currentCandidate.birth_date || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">联系地址：</span>
          <span class="value">{{ currentCandidate.address || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">报名号：</span>
          <span class="value">{{ currentCandidate.registration_number || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">所属机构：</span>
          <span class="value">{{ currentCandidate.institution?.name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">状态：</span>
          <el-tag :type="currentCandidate.status === 'active' ? 'success' : 'danger'">
            {{ currentCandidate.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatDate(currentCandidate.created_at) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElRadioGroup, ElRadio } from 'element-plus'
import {
  Search,
  Plus,
  Upload,
  Download,
  Edit,
  View,
  Delete
} from '@element-plus/icons-vue'
import { useCandidatesStore } from '@/store/candidates'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const candidatesStore = useCandidatesStore()
const authStore = useAuthStore()

// 数据状态
const loading = computed(() => candidatesStore.loading)
const tableData = computed(() => candidatesStore.candidates)
const pagination = computed(() => candidatesStore.pagination)

const searchForm = reactive({
  search: '',
  status: ''
})

// 对话框状态
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)

// 表单数据
const candidateForm = ref({
  name: '',
  id_number: '',
  phone: '',
  email: '',
  gender: 'male',
  birth_date: '',
  address: '',
  registration_number: '',
  institution_id: null
})

// 表单验证规则
const candidateRules = {
  name: [
    { required: true, message: '请输入考生姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  id_number: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

const candidateFormRef = ref()
const currentCandidate = ref(null)

// 方法
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleSearch = () => {
  candidatesStore.setSearchForm(searchForm)
  candidatesStore.setPagination({ page: 1 })
  candidatesStore.loadCandidates()
}

const resetSearch = () => {
  searchForm.search = ''
  searchForm.status = ''
  candidatesStore.resetSearchForm()
  candidatesStore.setPagination({ page: 1 })
  candidatesStore.loadCandidates()
}

const handleAdd = () => {
  resetCandidateForm()
  addDialogVisible.value = true
}

const handleImport = () => {
  router.push('/candidates/import')
}

const handleExport = () => {
  candidatesStore.exportCandidates()
}

const handleView = async (row) => {
  try {
    await candidatesStore.getCandidateById(row.id)
    currentCandidate.value = candidatesStore.currentCandidate
    viewDialogVisible.value = true
  } catch (error) {
    // 错误已在store中处理
  }
}

const handleEdit = async (row) => {
  try {
    await candidatesStore.getCandidateById(row.id)
    const candidate = candidatesStore.currentCandidate

    // 填充表单数据
    candidateForm.value = {
      name: candidate.name || '',
      id_number: candidate.id_number || '',
      phone: candidate.phone || '',
      email: candidate.email || '',
      gender: candidate.gender || 'male',
      birth_date: candidate.birth_date || '',
      address: candidate.address || '',
      registration_number: candidate.registration_number || '',
      institution_id: candidate.institution_id || null
    }

    currentCandidate.value = candidate
    editDialogVisible.value = true
  } catch (error) {
    // 错误已在store中处理
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除考生 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await candidatesStore.deleteCandidate(row.id)
  } catch (error) {
    // 用户取消删除或删除失败
  }
}

const handleSizeChange = (size) => {
  candidatesStore.setPagination({ limit: size, page: 1 })
  candidatesStore.loadCandidates()
}

const handleCurrentChange = (page) => {
  candidatesStore.setPagination({ page })
  candidatesStore.loadCandidates()
}

// 表单处理
const resetCandidateForm = () => {
  candidateForm.value = {
    name: '',
    id_number: '',
    phone: '',
    email: '',
    gender: 'male',
    birth_date: '',
    address: '',
    registration_number: '',
    institution_id: authStore.user?.institution_id || null
  }
  currentCandidate.value = null

  if (candidateFormRef.value) {
    candidateFormRef.value.resetFields()
  }
}

const handleSubmitAdd = async () => {
  if (!candidateFormRef.value) return

  try {
    await candidateFormRef.value.validate()
    await candidatesStore.createCandidate(candidateForm.value)
    addDialogVisible.value = false
    resetCandidateForm()
  } catch (error) {
    // 表单验证失败或创建失败
  }
}

const handleSubmitEdit = async () => {
  if (!candidateFormRef.value || !currentCandidate.value) return

  try {
    await candidateFormRef.value.validate()
    await candidatesStore.updateCandidate(currentCandidate.value.id, candidateForm.value)
    editDialogVisible.value = false
    resetCandidateForm()
  } catch (error) {
    // 表单验证失败或更新失败
  }
}

const handleCloseDialog = () => {
  resetCandidateForm()
}

// 生命周期
onMounted(() => {
  candidatesStore.loadCandidates()
})
</script>

<style lang="scss" scoped>
.candidates-list {
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 20px;

    .search-form {
      flex: 1;
      max-width: 800px;
    }

    .actions {
      flex-shrink: 0;
      display: flex;
      gap: 12px;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

// 考生详情样式
.candidate-detail {
  .detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .label {
      min-width: 100px;
      font-weight: 500;
      color: #606266;
    }

    .value {
      flex: 1;
      color: #303133;
    }
  }
}

@media (max-width: 768px) {
  .candidates-list {
    .content-header {
      flex-direction: column;
      align-items: stretch;

      .actions {
        flex-wrap: wrap;
      }
    }
  }

  .candidate-detail {
    .detail-row {
      flex-direction: column;
      align-items: flex-start;

      .label {
        margin-bottom: 4px;
        min-width: auto;
      }
    }
  }
}
</style>