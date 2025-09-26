<template>
  <div class="schedule-calendar">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">日程日历</h1>
        <p class="page-description">查看和管理考试排期日历</p>
      </div>

      <div class="page-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="view-controls">
            <el-radio-group v-model="viewType" @change="handleViewChange">
              <el-radio-button label="month">月视图</el-radio-button>
              <el-radio-button label="week">周视图</el-radio-button>
              <el-radio-button label="day">日视图</el-radio-button>
            </el-radio-group>
          </div>

          <div class="date-navigation">
            <el-button-group>
              <el-button @click="goToPrevious">
                <el-icon><ArrowLeft /></el-icon>
                上一{{ viewTypeText }}
              </el-button>
              <el-button @click="goToToday">今天</el-button>
              <el-button @click="goToNext">
                下一{{ viewTypeText }}
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-button-group>
          </div>

          <div class="filters">
            <el-select
              v-model="filters.institution"
              placeholder="选择机构"
              clearable
              style="width: 150px; margin-right: 10px"
              @change="loadSchedules"
            >
              <el-option
                v-for="institution in institutions"
                :key="institution.id"
                :label="institution.name"
                :value="institution.id"
              />
            </el-select>

            <el-select
              v-model="filters.product"
              placeholder="选择产品"
              clearable
              style="width: 150px; margin-right: 10px"
              @change="loadSchedules"
            >
              <el-option
                v-for="product in products"
                :key="product.id"
                :label="product.name"
                :value="product.id"
              />
            </el-select>

            <el-select
              v-model="filters.status"
              placeholder="选择状态"
              clearable
              style="width: 120px"
              @change="loadSchedules"
            >
              <el-option label="已排期" value="scheduled" />
              <el-option label="进行中" value="ongoing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </div>
        </div>

        <!-- 日历视图 -->
        <div class="calendar-container">
          <div class="calendar-header">
            <h2 class="current-period">{{ currentPeriodText }}</h2>
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color scheduled"></span>
                <span>已排期</span>
              </div>
              <div class="legend-item">
                <span class="legend-color ongoing"></span>
                <span>进行中</span>
              </div>
              <div class="legend-item">
                <span class="legend-color completed"></span>
                <span>已完成</span>
              </div>
              <div class="legend-item">
                <span class="legend-color cancelled"></span>
                <span>已取消</span>
              </div>
            </div>
          </div>

          <!-- 月视图 -->
          <div v-if="viewType === 'month'" class="month-view">
            <div class="weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>
            <div class="month-grid">
              <div
                v-for="day in monthDays"
                :key="day.date"
                class="day-cell"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'selected': day.isSelected
                }"
                @click="selectDate(day)"
              >
                <div class="day-number">{{ day.day }}</div>
                <div class="day-schedules">
                  <div
                    v-for="schedule in day.schedules"
                    :key="schedule.id"
                    class="schedule-item"
                    :class="schedule.status"
                    @click.stop="viewScheduleDetail(schedule)"
                  >
                    <div class="schedule-time">{{ schedule.time }}</div>
                    <div class="schedule-title">{{ schedule.candidate_name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 周视图 -->
          <div v-if="viewType === 'week'" class="week-view">
            <div class="week-header">
              <div class="time-column"></div>
              <div
                v-for="day in weekDays"
                :key="day.date"
                class="day-header"
                :class="{ 'today': day.isToday }"
              >
                <div class="day-name">{{ day.dayName }}</div>
                <div class="day-date">{{ day.day }}</div>
              </div>
            </div>
            <div class="week-body">
              <div class="time-slots">
                <div v-for="hour in hours" :key="hour" class="time-slot">{{ hour }}:00</div>
              </div>
              <div class="week-columns">
                <div
                  v-for="day in weekDays"
                  :key="day.date"
                  class="day-column"
                >
                  <div class="hour-slots">
                    <div
                      v-for="hour in hours"
                      :key="hour"
                      class="hour-slot"
                      @click="createSchedule(day.date, hour)"
                    >
                      <div
                        v-for="schedule in getHourSchedules(day.date, hour)"
                        :key="schedule.id"
                        class="schedule-block"
                        :class="schedule.status"
                        @click.stop="viewScheduleDetail(schedule)"
                      >
                        <div class="schedule-time">{{ schedule.time }}</div>
                        <div class="schedule-candidate">{{ schedule.candidate_name }}</div>
                        <div class="schedule-product">{{ schedule.product_name }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 日视图 -->
          <div v-if="viewType === 'day'" class="day-view">
            <div class="day-header">
              <h3>{{ currentDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              }) }}</h3>
            </div>
            <div class="day-schedule-list">
              <div
                v-for="schedule in daySchedules"
                :key="schedule.id"
                class="day-schedule-item"
                :class="schedule.status"
                @click="viewScheduleDetail(schedule)"
              >
                <div class="schedule-time-range">{{ schedule.time }} ({{ schedule.duration }}分钟)</div>
                <div class="schedule-info">
                  <div class="candidate-info">
                    <strong>{{ schedule.candidate_name }}</strong>
                    <span class="phone">{{ schedule.candidate_phone }}</span>
                  </div>
                  <div class="exam-info">
                    <span class="product">{{ schedule.product_name }}</span>
                    <span class="venue">{{ schedule.venue_name }}</span>
                  </div>
                </div>
                <div class="schedule-status">
                  <el-tag :type="getStatusType(schedule.status)">
                    {{ getStatusText(schedule.status) }}
                  </el-tag>
                </div>
              </div>

              <el-empty v-if="daySchedules.length === 0" description="当天暂无排期" />
            </div>
          </div>
        </div>

        <!-- 排期详情弹窗 -->
        <el-dialog
          v-model="detailDialogVisible"
          title="排期详情"
          width="600px"
        >
          <div v-if="selectedSchedule" class="schedule-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="考生姓名">
                {{ selectedSchedule.candidate_name }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ selectedSchedule.candidate_phone }}
              </el-descriptions-item>
              <el-descriptions-item label="身份证号">
                {{ selectedSchedule.candidate_id_number }}
              </el-descriptions-item>
              <el-descriptions-item label="报名号">
                {{ selectedSchedule.registration_number }}
              </el-descriptions-item>
              <el-descriptions-item label="考试产品">
                {{ selectedSchedule.product_name }}
              </el-descriptions-item>
              <el-descriptions-item label="考试时长">
                {{ selectedSchedule.duration }}分钟
              </el-descriptions-item>
              <el-descriptions-item label="考试日期">
                {{ formatDate(selectedSchedule.scheduled_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="考试时间">
                {{ selectedSchedule.time }}
              </el-descriptions-item>
              <el-descriptions-item label="考场">
                {{ selectedSchedule.venue_name }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(selectedSchedule.status)">
                  {{ getStatusText(selectedSchedule.status) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="selectedSchedule.notes" class="schedule-notes">
              <h4>备注信息</h4>
              <p>{{ selectedSchedule.notes }}</p>
            </div>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="detailDialogVisible = false">关闭</el-button>
              <el-button
                v-if="selectedSchedule && selectedSchedule.status === 'scheduled'"
                type="danger"
                @click="cancelSchedule"
              >
                取消排期
              </el-button>
              <el-button
                v-if="selectedSchedule && selectedSchedule.status === 'scheduled'"
                type="primary"
                @click="editSchedule"
              >
                编辑排期
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

// 数据状态
const viewType = ref('month')
const currentDate = ref(new Date())
const detailDialogVisible = ref(false)
const selectedSchedule = ref(null)

const filters = reactive({
  institution: '',
  product: '',
  status: ''
})

// 模拟数据
const institutions = ref([
  { id: 1, name: '测试考试机构' }
])

const products = ref([
  { id: 1, name: '无人机驾驶员理论考试' },
  { id: 2, name: '无人机驾驶员实操考试' }
])

const schedules = ref([
  {
    id: 1,
    candidate_name: '张三',
    candidate_phone: '13800138001',
    candidate_id_number: '110101199001011234',
    registration_number: 'REG2024001',
    product_name: '无人机驾驶员理论考试',
    venue_name: '理论考试室A',
    scheduled_at: new Date(2024, 11, 28, 9, 0),
    duration: 90,
    status: 'scheduled',
    time: '09:00-10:30',
    notes: '首次考试'
  },
  {
    id: 2,
    candidate_name: '李四',
    candidate_phone: '13800138002',
    candidate_id_number: '110101199102022345',
    registration_number: 'REG2024002',
    product_name: '无人机驾驶员实操考试',
    venue_name: '实操考试场地B',
    scheduled_at: new Date(2024, 11, 28, 14, 0),
    duration: 60,
    status: 'ongoing',
    time: '14:00-15:00'
  },
  {
    id: 3,
    candidate_name: '王五',
    candidate_phone: '13800138003',
    candidate_id_number: '110101199203033456',
    registration_number: 'REG2024003',
    product_name: '无人机驾驶员理论考试',
    venue_name: '理论考试室A',
    scheduled_at: new Date(2024, 11, 29, 10, 0),
    duration: 90,
    status: 'completed',
    time: '10:00-11:30'
  }
])

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const hours = Array.from({ length: 10 }, (_, i) => i + 8) // 8:00 - 17:00

// 计算属性
const viewTypeText = computed(() => {
  const map = { month: '月', week: '周', day: '日' }
  return map[viewType.value]
})

const currentPeriodText = computed(() => {
  if (viewType.value === 'month') {
    return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  } else if (viewType.value === 'week') {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
  } else {
    return currentDate.value.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
})

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay.getTime() - firstDay.getDay() * 24 * 60 * 60 * 1000)

  const days = []
  const today = new Date()

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const daySchedules = schedules.value.filter(s =>
      s.scheduled_at.toDateString() === date.toDateString()
    )

    days.push({
      date: date.toISOString(),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      isSelected: false,
      schedules: daySchedules
    })
  }

  return days
})

const weekDays = computed(() => {
  const weekStart = getWeekStart(currentDate.value)
  const days = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
    days.push({
      date: date.toISOString(),
      day: date.getDate(),
      dayName: weekdays[i],
      isToday: date.toDateString() === today.toDateString()
    })
  }

  return days
})

const daySchedules = computed(() => {
  return schedules.value
    .filter(s => s.scheduled_at.toDateString() === currentDate.value.toDateString())
    .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime())
})

// 方法
const getWeekStart = (date) => {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

const handleViewChange = () => {
  loadSchedules()
}

const goToPrevious = () => {
  if (viewType.value === 'month') {
    currentDate.value.setMonth(currentDate.value.getMonth() - 1)
  } else if (viewType.value === 'week') {
    currentDate.value.setDate(currentDate.value.getDate() - 7)
  } else {
    currentDate.value.setDate(currentDate.value.getDate() - 1)
  }
  currentDate.value = new Date(currentDate.value)
}

const goToNext = () => {
  if (viewType.value === 'month') {
    currentDate.value.setMonth(currentDate.value.getMonth() + 1)
  } else if (viewType.value === 'week') {
    currentDate.value.setDate(currentDate.value.getDate() + 7)
  } else {
    currentDate.value.setDate(currentDate.value.getDate() + 1)
  }
  currentDate.value = new Date(currentDate.value)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const selectDate = (day) => {
  currentDate.value = new Date(day.date)
  if (viewType.value === 'month') {
    viewType.value = 'day'
  }
}

const getHourSchedules = (date, hour) => {
  return schedules.value.filter(s => {
    const scheduleDate = new Date(s.scheduled_at)
    return scheduleDate.toDateString() === new Date(date).toDateString() &&
           scheduleDate.getHours() === hour
  })
}

const viewScheduleDetail = (schedule) => {
  selectedSchedule.value = schedule
  detailDialogVisible.value = true
}

const createSchedule = (date, hour) => {
  ElMessage.info('创建排期功能开发中')
}

const editSchedule = () => {
  ElMessage.info('编辑排期功能开发中')
  detailDialogVisible.value = false
}

const cancelSchedule = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个排期吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    selectedSchedule.value.status = 'cancelled'
    ElMessage.success('排期已取消')
    detailDialogVisible.value = false

  } catch (error) {
    // 用户取消操作
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    scheduled: '',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    scheduled: '已排期',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const loadSchedules = () => {
  // 这里应该调用API加载排期数据
  // 根据filters进行筛选
  console.log('Loading schedules with filters:', filters)
}

onMounted(() => {
  loadSchedules()
})

watch([filters], () => {
  loadSchedules()
}, { deep: true })
</script>

<style lang="scss" scoped>
.schedule-calendar {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }
  }

  .calendar-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;

    .current-period {
      margin: 0;
      color: #303133;
    }

    .legend {
      display: flex;
      gap: 20px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;

          &.scheduled { background: #409eff; }
          &.ongoing { background: #e6a23c; }
          &.completed { background: #67c23a; }
          &.cancelled { background: #f56c6c; }
        }
      }

      @media (max-width: 768px) {
        flex-wrap: wrap;
        gap: 10px;
      }
    }
  }

  // 月视图样式
  .month-view {
    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #fafafa;

      .weekday {
        padding: 12px 8px;
        text-align: center;
        font-weight: bold;
        border-right: 1px solid #e4e7ed;

        &:last-child {
          border-right: none;
        }
      }
    }

    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      min-height: 600px;

      .day-cell {
        min-height: 100px;
        border-right: 1px solid #e4e7ed;
        border-bottom: 1px solid #e4e7ed;
        padding: 8px;
        cursor: pointer;
        position: relative;

        &:hover {
          background: #f5f7fa;
        }

        &.other-month {
          color: #c0c4cc;
          background: #fafafa;
        }

        &.today {
          background: #ecf5ff;

          .day-number {
            color: #409eff;
            font-weight: bold;
          }
        }

        &.selected {
          background: #409eff;
          color: white;

          .day-number {
            color: white;
          }
        }

        .day-number {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .day-schedules {
          .schedule-item {
            font-size: 11px;
            padding: 2px 4px;
            margin-bottom: 2px;
            border-radius: 2px;
            cursor: pointer;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &.scheduled { background: rgba(64, 158, 255, 0.1); color: #409eff; }
            &.ongoing { background: rgba(230, 162, 60, 0.1); color: #e6a23c; }
            &.completed { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
            &.cancelled { background: rgba(245, 108, 108, 0.1); color: #f56c6c; }

            &:hover {
              opacity: 0.8;
            }

            .schedule-time {
              font-weight: bold;
            }
          }
        }
      }
    }
  }

  // 周视图样式
  .week-view {
    .week-header {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      border-bottom: 1px solid #e4e7ed;

      .time-column {
        background: #fafafa;
        border-right: 1px solid #e4e7ed;
      }

      .day-header {
        padding: 15px 10px;
        text-align: center;
        border-right: 1px solid #e4e7ed;

        &.today {
          background: #ecf5ff;
          color: #409eff;
        }

        .day-name {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .day-date {
          font-size: 18px;
        }
      }
    }

    .week-body {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      height: 600px;

      .time-slots {
        background: #fafafa;
        border-right: 1px solid #e4e7ed;

        .time-slot {
          height: 60px;
          padding: 5px 10px;
          border-bottom: 1px solid #e4e7ed;
          font-size: 12px;
          color: #909399;
        }
      }

      .week-columns {
        display: contents;

        .day-column {
          border-right: 1px solid #e4e7ed;

          .hour-slots {
            .hour-slot {
              height: 60px;
              border-bottom: 1px solid #e4e7ed;
              position: relative;
              cursor: pointer;

              &:hover {
                background: #f5f7fa;
              }

              .schedule-block {
                position: absolute;
                left: 2px;
                right: 2px;
                top: 2px;
                bottom: 2px;
                padding: 4px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;

                &.scheduled { background: #409eff; color: white; }
                &.ongoing { background: #e6a23c; color: white; }
                &.completed { background: #67c23a; color: white; }
                &.cancelled { background: #f56c6c; color: white; }

                .schedule-time {
                  font-weight: bold;
                  margin-bottom: 2px;
                }

                .schedule-candidate {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .schedule-product {
                  font-size: 10px;
                  opacity: 0.8;
                }
              }
            }
          }
        }
      }
    }
  }

  // 日视图样式
  .day-view {
    padding: 20px;

    .day-header {
      margin-bottom: 20px;
      text-align: center;

      h3 {
        margin: 0;
        color: #303133;
      }
    }

    .day-schedule-list {
      .day-schedule-item {
        display: flex;
        align-items: center;
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        cursor: pointer;
        border-left: 4px solid;

        &.scheduled {
          border-left-color: #409eff;
          background: rgba(64, 158, 255, 0.05);
        }
        &.ongoing {
          border-left-color: #e6a23c;
          background: rgba(230, 162, 60, 0.05);
        }
        &.completed {
          border-left-color: #67c23a;
          background: rgba(103, 194, 58, 0.05);
        }
        &.cancelled {
          border-left-color: #f56c6c;
          background: rgba(245, 108, 108, 0.05);
        }

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .schedule-time-range {
          min-width: 150px;
          font-weight: bold;
          color: #303133;
        }

        .schedule-info {
          flex: 1;
          margin-left: 20px;

          .candidate-info {
            margin-bottom: 5px;

            strong {
              color: #303133;
              margin-right: 10px;
            }

            .phone {
              color: #909399;
              font-size: 14px;
            }
          }

          .exam-info {
            .product {
              color: #409eff;
              margin-right: 15px;
            }

            .venue {
              color: #909399;
              font-size: 14px;
            }
          }
        }

        .schedule-status {
          min-width: 80px;
          text-align: right;
        }
      }
    }
  }

  .schedule-detail {
    .schedule-notes {
      margin-top: 20px;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 6px;

      h4 {
        margin: 0 0 10px 0;
        color: #303133;
      }

      p {
        margin: 0;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}

@media (max-width: 768px) {
  .schedule-calendar {
    .month-grid {
      min-height: 400px;

      .day-cell {
        min-height: 60px;
        padding: 4px;
      }
    }

    .week-body {
      height: 400px;
    }

    .calendar-header {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }
  }
}
</style>