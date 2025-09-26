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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Upload,
  Download
} from '@element-plus/icons-vue'

const router = useRouter()

// 数据状态
const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  search: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const resetSearch = () => {
  searchForm.search = ''
  searchForm.status = ''
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  // TODO: 打开新增对话框或跳转新增页面
  ElMessage.info('功能开发中')
}

const handleImport = () => {
  router.push('/candidates/import')
}

const handleExport = () => {
  // TODO: 导出功能
  ElMessage.info('导出功能开发中')
}

const handleView = (row) => {
  // TODO: 查看详情
  ElMessage.info(`查看考生: ${row.name}`)
}

const handleEdit = (row) => {
  // TODO: 编辑功能
  ElMessage.info(`编辑考生: ${row.name}`)
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

    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消删除
  }
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadData()
}

const loadData = async () => {
  try {
    loading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟数据
    const mockData = Array.from({ length: pagination.limit }, (_, index) => ({
      id: (pagination.page - 1) * pagination.limit + index + 1,
      name: `考生${(pagination.page - 1) * pagination.limit + index + 1}`,
      id_number: `110101199001010${String(index + 1).padStart(3, '0')}`,
      phone: `138001380${String(index + 1).padStart(2, '0')}`,
      email: `candidate${index + 1}@example.com`,
      gender: index % 3 === 0 ? 'male' : index % 3 === 1 ? 'female' : null,
      institution: {
        id: 1,
        name: '测试机构'
      },
      status: index % 10 === 0 ? 'inactive' : 'active',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }))

    tableData.value = mockData
    pagination.total = 150 // 模拟总数

  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadData()
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
}
</style>