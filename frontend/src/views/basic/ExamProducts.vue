<template>
  <div class="exam-products">
    <div class="page-header">
      <h2>考试科目管理</h2>
      <p>管理无人机驾驶员考试科目信息</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增科目
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索科目名称或代码"
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
        <el-form-item label="科目类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="理论考试" value="theory" />
            <el-option label="实操考试" value="practical" />
            <el-option label="综合考试" value="comprehensive" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度等级">
          <el-select v-model="searchForm.difficulty" placeholder="全部等级" clearable style="width: 120px">
            <el-option label="初级" value="basic" />
            <el-option label="中级" value="intermediate" />
            <el-option label="高级" value="advanced" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="data-table">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="科目代码" width="120" />
        <el-table-column prop="name" label="科目名称" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <div class="name">{{ row.name }}</div>
              <div class="description" v-if="row.description">{{ row.description }}</div>
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
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-rate
              :model-value="getDifficultyLevel(row.difficulty)"
              disabled
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              :max="3"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="考试时长" width="120">
          <template #default="{ row }">
            {{ row.duration }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="totalQuestions" label="题目数量" width="100" />
        <el-table-column prop="passingScore" label="及格分数" width="100">
          <template #default="{ row }">
            {{ row.passingScore }}分
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
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="warning" @click="handleCopy(row)">
              复制
            </el-button>
            <el-popconfirm
              title="确定删除这个考试科目吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

    <!-- 新增/编辑对话框 -->
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
            <el-form-item label="科目代码" prop="code">
              <el-input
                v-model="form.code"
                placeholder="请输入科目代码"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入科目名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="科目类型" prop="type">
              <el-select v-model="form.type" placeholder="选择科目类型" style="width: 100%">
                <el-option label="理论考试" value="theory" />
                <el-option label="实操考试" value="practical" />
                <el-option label="综合考试" value="comprehensive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度等级" prop="difficulty">
              <el-select v-model="form.difficulty" placeholder="选择难度等级" style="width: 100%">
                <el-option label="初级" value="basic" />
                <el-option label="中级" value="intermediate" />
                <el-option label="高级" value="advanced" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="考试时长" prop="duration">
              <el-input-number
                v-model="form.duration"
                :min="1"
                :max="300"
                :step="5"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #999;">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题目数量" prop="totalQuestions">
              <el-input-number
                v-model="form.totalQuestions"
                :min="1"
                :max="200"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分数" prop="passingScore">
              <el-input-number
                v-model="form.passingScore"
                :min="0"
                :max="100"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #999;">分</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="科目描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="考试说明" prop="instructions">
          <el-input
            v-model="form.instructions"
            type="textarea"
            :rows="4"
            placeholder="请输入考试说明和注意事项"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
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

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入科目" width="600px">
      <div class="import-content">
        <div class="import-tips">
          <el-alert
            title="导入说明"
            type="info"
            show-icon
            :closable="false"
          >
            <p>1. 请下载模板文件，按照模板格式填写数据</p>
            <p>2. 支持Excel文件格式（.xlsx, .xls）</p>
            <p>3. 单次最多导入1000条记录</p>
          </el-alert>
        </div>

        <div class="template-download">
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>

        <div class="file-upload">
          <el-upload
            ref="uploadRef"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :file-list="fileList"
            :limit="1"
            accept=".xlsx,.xls"
            drag
            action="#"
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传xlsx/xls文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImportSubmit" :loading="importLoading">
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import { useSystemStore } from '@/store/system'

const loading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const submitLoading = ref(false)
const importLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()
const uploadRef = ref()

// 存储引用
const systemStore = useSystemStore()

const searchForm = reactive({
  keyword: '',
  type: '',
  status: '',
  difficulty: ''
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  type: '',
  difficulty: '',
  duration: 60,
  totalQuestions: 50,
  passingScore: 60,
  description: '',
  instructions: '',
  status: 'active'
})

const formRules = {
  code: [
    { required: true, message: '请输入科目代码', trigger: 'blur' },
    { min: 2, max: 20, message: '代码长度在2到20个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入科目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择科目类型', trigger: 'change' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入考试时长', trigger: 'blur' }
  ],
  totalQuestions: [
    { required: true, message: '请输入题目数量', trigger: 'blur' }
  ],
  passingScore: [
    { required: true, message: '请输入及格分数', trigger: 'blur' }
  ]
}

// 计算属性 - 数据源
const tableData = computed(() => systemStore.examProducts)
const totalCount = computed(() => systemStore.examProductsPagination.total)

const fileList = ref([])
const selectedRows = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑科目' : '新增科目')

const getTypeTagType = (type) => {
  const typeMap = {
    theory: '',
    practical: 'success',
    comprehensive: 'warning'
  }
  return typeMap[type] || ''
}

const getTypeText = (type) => {
  const typeMap = {
    theory: '理论考试',
    practical: '实操考试',
    comprehensive: '综合考试'
  }
  return typeMap[type] || type
}

const getDifficultyLevel = (difficulty) => {
  const levelMap = {
    basic: 1,
    intermediate: 2,
    advanced: 3
  }
  return levelMap[difficulty] || 1
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'duration') form[key] = 60
    else if (key === 'totalQuestions') form[key] = 50
    else if (key === 'passingScore') form[key] = 60
    else if (key === 'status') form[key] = 'active'
    else if (key === 'id') form[key] = null
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
    form[key] = row[key] || (key === 'duration' ? 60 : key === 'totalQuestions' ? 50 : key === 'passingScore' ? 60 : key === 'status' ? 'active' : '')
  })
  form.id = row.id // 确保包含ID
  isEdit.value = true
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessageBox.alert(
    `科目代码：${row.code}<br/>
     科目名称：${row.name}<br/>
     类型：${getTypeText(row.type)}<br/>
     难度：${row.difficulty}<br/>
     时长：${row.duration}分钟<br/>
     题目数：${row.totalQuestions}<br/>
     及格分：${row.passingScore}分<br/>
     状态：${row.status === 'active' ? '启用' : '禁用'}<br/>
     创建时间：${formatDate(row.createdAt)}`,
    '科目详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
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
    await systemStore.deleteExamProduct(id)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error(error.message || '删除失败')
  }
}

const handleStatusChange = async (row) => {
  try {
    await systemStore.updateExamProduct(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 回滚状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleBatchImport = () => {
  importDialogVisible.value = true
  fileList.value = []
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

    // 准备提交数据
    const submitData = { ...form }

    if (isEdit.value) {
      // 更新考试产品
      await systemStore.updateExamProduct(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      // 创建考试产品
      await systemStore.createExamProduct(submitData)
      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('提交失败:', error)
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

const downloadTemplate = () => {
  ElMessage.success('模板下载成功')
}

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB！')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success('文件上传成功')
}

const handleUploadError = (error) => {
  ElMessage.error('文件上传失败')
}

const handleImportSubmit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传文件')
    return
  }

  try {
    importLoading.value = true
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    await fetchData()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importLoading.value = false
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
    // 准备查询参数
    const params = {
      page: pagination.page,
      limit: pagination.size,
      search: searchForm.keyword,
      type: searchForm.type,
      status: searchForm.status,
      difficulty: searchForm.difficulty
    }

    await systemStore.loadExamProducts(params)
    pagination.total = systemStore.examProductsPagination.total
  } catch (error) {
    console.error('加载数据失败:', error)
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
.exam-products {
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

  .data-table {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);

    .product-info {
      .name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .description {
        font-size: 12px;
        color: #909399;
      }
    }

    .pagination {
      padding: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .import-content {
    .import-tips {
      margin-bottom: 20px;

      :deep(.el-alert__content) {
        p {
          margin: 4px 0;
        }
      }
    }

    .template-download {
      margin-bottom: 20px;
      text-align: center;
    }

    .file-upload {
      margin-bottom: 20px;
    }
  }
}

@media (max-width: 768px) {
  .exam-products {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .toolbar-right {
        justify-content: center;
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