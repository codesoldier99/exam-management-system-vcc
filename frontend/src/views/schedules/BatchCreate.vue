<template>
  <div class="batch-create">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">批量排期</h1>
        <p class="page-description">批量创建考试排期，支持批量选择考生和时间段</p>
      </div>

      <div class="page-content">
        <!-- 批量排期表单 -->
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>排期信息</span>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            class="batch-form"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="考试产品" prop="product_id">
                  <el-select
                    v-model="form.product_id"
                    placeholder="请选择考试产品"
                    style="width: 100%"
                    @change="handleProductChange"
                  >
                    <el-option
                      v-for="product in products"
                      :key="product.id"
                      :label="product.name"
                      :value="product.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="考试机构" prop="institution_id">
                  <el-select
                    v-model="form.institution_id"
                    placeholder="请选择考试机构"
                    style="width: 100%"
                    @change="handleInstitutionChange"
                  >
                    <el-option
                      v-for="institution in institutions"
                      :key="institution.id"
                      :label="institution.name"
                      :value="institution.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="考试日期范围" prop="dateRange">
                  <el-date-picker
                    v-model="form.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    style="width: 100%"
                    @change="generateTimeSlots"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="时间段设置">
                  <el-time-picker
                    v-model="form.timeRange"
                    is-range
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    style="width: 100%"
                    @change="generateTimeSlots"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="考试时长" prop="duration">
                  <el-input-number
                    v-model="form.duration"
                    :min="30"
                    :max="240"
                    :step="30"
                    controls-position="right"
                    style="width: 100%"
                  />
                  <span class="input-suffix">分钟</span>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="时间间隔">
                  <el-input-number
                    v-model="form.interval"
                    :min="30"
                    :max="120"
                    :step="15"
                    controls-position="right"
                    style="width: 100%"
                  />
                  <span class="input-suffix">分钟</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 生成的时间段预览 -->
        <el-card v-if="timeSlots.length > 0" class="preview-card">
          <template #header>
            <div class="card-header">
              <span>可用时间段 (共{{ timeSlots.length }}个)</span>
              <el-button type="text" @click="toggleSelectAll">
                {{ isAllSelected ? '取消全选' : '全选' }}
              </el-button>
            </div>
          </template>

          <div class="time-slots">
            <el-checkbox-group v-model="selectedSlots">
              <div class="slot-grid">
                <el-checkbox
                  v-for="slot in timeSlots"
                  :key="slot.id"
                  :label="slot.id"
                  class="slot-item"
                >
                  <div class="slot-content">
                    <div class="slot-date">{{ formatDate(slot.date) }}</div>
                    <div class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</div>
                    <div class="slot-capacity">容量: {{ slot.capacity }}</div>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-card>

        <!-- 考生选择 -->
        <el-card v-if="selectedSlots.length > 0" class="candidates-card">
          <template #header>
            <div class="card-header">
              <span>选择考生</span>
              <div class="header-actions">
                <el-input
                  v-model="candidateSearch"
                  placeholder="搜索考生姓名或身份证号"
                  style="width: 200px; margin-right: 10px"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="text" @click="toggleSelectAllCandidates">
                  {{ isAllCandidatesSelected ? '取消全选' : '全选' }}
                </el-button>
              </div>
            </div>
          </template>

          <el-table
            ref="candidateTable"
            :data="filteredCandidates"
            @selection-change="handleCandidateSelectionChange"
            height="300"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="id_number" label="身份证号" width="180" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="registration_number" label="报名号" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 排期结果预览 -->
        <el-card v-if="selectedCandidates.length > 0 && selectedSlots.length > 0" class="result-card">
          <template #header>
            <div class="card-header">
              <span>排期预览</span>
              <span class="result-count">
                将为{{ selectedCandidates.length }}名考生创建{{ schedulePreview.length }}个排期
              </span>
            </div>
          </template>

          <el-table :data="schedulePreview" max-height="400">
            <el-table-column prop="candidate_name" label="考生姓名" width="120" />
            <el-table-column prop="candidate_phone" label="手机号" width="130" />
            <el-table-column prop="date" label="考试日期" width="120" />
            <el-table-column prop="time" label="考试时间" width="150" />
            <el-table-column prop="duration" label="时长" width="80">
              <template #default="{ row }">
                {{ row.duration }}分钟
              </template>
            </el-table-column>
            <el-table-column prop="venue" label="考场" />
          </el-table>
        </el-card>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button
            type="primary"
            :loading="creating"
            :disabled="schedulePreview.length === 0"
            @click="createBatchSchedules"
          >
            创建排期 ({{ schedulePreview.length }})
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 数据状态
const formRef = ref()
const candidateTable = ref()
const creating = ref(false)
const candidateSearch = ref('')

const form = reactive({
  product_id: '',
  institution_id: '',
  dateRange: [],
  timeRange: [],
  duration: 60,
  interval: 60
})

const rules = {
  product_id: [{ required: true, message: '请选择考试产品', trigger: 'change' }],
  institution_id: [{ required: true, message: '请选择考试机构', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }],
  duration: [{ required: true, message: '请设置考试时长', trigger: 'blur' }]
}

// 模拟数据
const products = ref([
  { id: 1, name: '无人机驾驶员理论考试', duration: 90 },
  { id: 2, name: '无人机驾驶员实操考试', duration: 60 }
])

const institutions = ref([
  { id: 1, name: '测试考试机构' }
])

const timeSlots = ref([])
const selectedSlots = ref([])
const selectedCandidates = ref([])

const candidates = ref([
  { id: 1, name: '张三', id_number: '110101199001011234', phone: '13800138001', registration_number: 'REG2024001', status: 'active' },
  { id: 2, name: '李四', id_number: '110101199102022345', phone: '13800138002', registration_number: 'REG2024002', status: 'active' },
  { id: 3, name: '王五', id_number: '110101199203033456', phone: '13800138003', registration_number: 'REG2024003', status: 'active' },
  { id: 4, name: '赵六', id_number: '110101199304044567', phone: '13800138004', registration_number: 'REG2024004', status: 'active' },
  { id: 5, name: '钱七', id_number: '110101199405055678', phone: '13800138005', registration_number: 'REG2024005', status: 'active' }
])

// 计算属性
const isAllSelected = computed(() => {
  return timeSlots.value.length > 0 && selectedSlots.value.length === timeSlots.value.length
})

const isAllCandidatesSelected = computed(() => {
  return filteredCandidates.value.length > 0 && selectedCandidates.value.length === filteredCandidates.value.length
})

const filteredCandidates = computed(() => {
  if (!candidateSearch.value) return candidates.value
  return candidates.value.filter(candidate =>
    candidate.name.includes(candidateSearch.value) ||
    candidate.id_number.includes(candidateSearch.value)
  )
})

const schedulePreview = computed(() => {
  const preview = []
  const slotsPerCandidate = Math.ceil(selectedSlots.value.length / selectedCandidates.value.length)

  selectedCandidates.value.forEach((candidate, candidateIndex) => {
    const slotIndex = candidateIndex * slotsPerCandidate
    if (slotIndex < selectedSlots.value.length) {
      const slotId = selectedSlots.value[slotIndex]
      const slot = timeSlots.value.find(s => s.id === slotId)
      if (slot) {
        preview.push({
          candidate_name: candidate.name,
          candidate_phone: candidate.phone,
          date: formatDate(slot.date),
          time: `${slot.startTime} - ${slot.endTime}`,
          duration: form.duration,
          venue: '考场A'
        })
      }
    }
  })

  return preview
})

// 方法
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleProductChange = (productId) => {
  const product = products.value.find(p => p.id === productId)
  if (product) {
    form.duration = product.duration
  }
}

const handleInstitutionChange = () => {
  // 重置相关数据
  selectedCandidates.value = []
  generateTimeSlots()
}

const generateTimeSlots = () => {
  timeSlots.value = []
  selectedSlots.value = []

  if (!form.dateRange || form.dateRange.length !== 2 || !form.timeRange || form.timeRange.length !== 2) {
    return
  }

  const [startDate, endDate] = form.dateRange
  const [startTime, endTime] = form.timeRange

  let currentDate = new Date(startDate)
  const lastDate = new Date(endDate)
  let slotId = 1

  while (currentDate <= lastDate) {
    // 跳过周末（可配置）
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      let currentTime = new Date(currentDate)
      currentTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)

      const dayEndTime = new Date(currentDate)
      dayEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0)

      while (currentTime < dayEndTime) {
        const slotEndTime = new Date(currentTime.getTime() + form.duration * 60000)

        if (slotEndTime <= dayEndTime) {
          timeSlots.value.push({
            id: slotId++,
            date: new Date(currentDate),
            startTime: currentTime.toTimeString().substr(0, 5),
            endTime: slotEndTime.toTimeString().substr(0, 5),
            capacity: 1
          })
        }

        currentTime = new Date(currentTime.getTime() + form.interval * 60000)
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedSlots.value = []
  } else {
    selectedSlots.value = timeSlots.value.map(slot => slot.id)
  }
}

const toggleSelectAllCandidates = () => {
  if (isAllCandidatesSelected.value) {
    candidateTable.value.clearSelection()
  } else {
    filteredCandidates.value.forEach(row => {
      candidateTable.value.toggleRowSelection(row, true)
    })
  }
}

const handleCandidateSelectionChange = (selection) => {
  selectedCandidates.value = selection
}

const createBatchSchedules = async () => {
  if (schedulePreview.value.length === 0) {
    ElMessage.warning('请先选择时间段和考生')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要创建${schedulePreview.value.length}个排期吗？`,
      '确认创建',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    creating.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success(`成功创建${schedulePreview.value.length}个排期`)
    resetForm()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('创建排期失败')
    }
  } finally {
    creating.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  timeSlots.value = []
  selectedSlots.value = []
  selectedCandidates.value = []
  candidateSearch.value = ''
  candidateTable.value?.clearSelection()
}

onMounted(() => {
  // 页面初始化
})
</script>

<style lang="scss" scoped>
.batch-create {
  .form-card {
    margin-bottom: 20px;
  }

  .preview-card,
  .candidates-card,
  .result-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
  }

  .input-suffix {
    margin-left: 8px;
    color: #909399;
    font-size: 14px;
  }

  .time-slots {
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .slot-item {
      .slot-content {
        padding: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        background: #fafafa;

        .slot-date {
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }

        .slot-time {
          color: #409eff;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .slot-capacity {
          color: #909399;
          font-size: 12px;
        }
      }
    }
  }

  .result-count {
    color: #409eff;
    font-size: 14px;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  .batch-create {
    .slot-grid {
      grid-template-columns: 1fr;
    }

    .header-actions {
      flex-direction: column;
      gap: 10px;

      .el-input {
        width: 100% !important;
      }
    }
  }
}
</style>