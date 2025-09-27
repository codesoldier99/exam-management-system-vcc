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
              <el-col :span="8">
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

              <el-col :span="8">
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

              <el-col :span="8">
                <el-form-item label="考场" prop="venue_id">
                  <el-select
                    v-model="form.venue_id"
                    placeholder="请选择考场"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="venue in availableVenues"
                      :key="venue.id"
                      :label="venue.name"
                      :value="venue.id"
                    >
                      <span>{{ venue.name }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        容量: {{ venue.capacity }}
                      </span>
                    </el-option>
                  </el-select>
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
import { useSchedulesStore } from '@/store/schedules'
import { useCandidatesStore } from '@/store/candidates'
import { useSystemStore } from '@/store/system'

// 数据状态
const formRef = ref()
const candidateTable = ref()
const creating = ref(false)
const candidateSearch = ref('')

// 存储引用
const schedulesStore = useSchedulesStore()
const candidatesStore = useCandidatesStore()
const systemStore = useSystemStore()

const form = reactive({
  product_id: '',
  institution_id: '',
  venue_id: '',
  dateRange: [],
  timeRange: [],
  duration: 60,
  interval: 60
})

const rules = {
  product_id: [{ required: true, message: '请选择考试产品', trigger: 'change' }],
  institution_id: [{ required: true, message: '请选择考试机构', trigger: 'change' }],
  venue_id: [{ required: true, message: '请选择考场', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }],
  duration: [{ required: true, message: '请设置考试时长', trigger: 'blur' }]
}

// 响应式数据
const timeSlots = ref([])
const selectedSlots = ref([])
const selectedCandidates = ref([])
const availableVenues = ref([])

// 计算属性 - 数据源
const products = computed(() => systemStore.examProducts)
const institutions = computed(() => systemStore.institutions)
const candidates = computed(() => candidatesStore.candidates)

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
          venue: availableVenues.value.find(v => v.id === form.venue_id)?.name || '未选择考场'
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
  // 验证表单
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善表单信息')
    return
  }

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

    // 准备批量创建数据
    const batchData = {
      product_id: form.product_id,
      institution_id: form.institution_id,
      venue_id: form.venue_id,
      schedules: schedulePreview.value.map((item, index) => {
        const slotId = selectedSlots.value[index % selectedSlots.value.length]
        const slot = timeSlots.value.find(s => s.id === slotId)
        const candidate = selectedCandidates.value[Math.floor(index / selectedSlots.value.length)]

        return {
          candidate_id: candidate.id,
          venue_id: form.venue_id,
          exam_date: slot.date.toISOString().split('T')[0],
          start_time: slot.startTime,
          end_time: slot.endTime,
          duration: form.duration,
          status: 'pending'
        }
      })
    }

    // 调用API创建批量排期
    const result = await schedulesStore.batchCreateSchedules(batchData)

    ElMessage.success(`成功创建${result.successCount}个排期`)
    resetForm()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建排期失败:', error)
      ElMessage.error(error.message || '创建排期失败')
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

onMounted(async () => {
  // 加载基础数据
  try {
    await Promise.all([
      systemStore.loadExamProducts(),
      systemStore.loadInstitutions(),
      candidatesStore.loadCandidates({ status: 'active' }),
      schedulesStore.loadAvailableVenues()
    ])

    availableVenues.value = schedulesStore.availableVenues
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载页面数据失败')
  }
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