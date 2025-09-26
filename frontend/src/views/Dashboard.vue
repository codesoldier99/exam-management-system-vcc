<template>
  <div class="dashboard">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">数据总览</h1>
        <p class="page-description">实时监控考试管理系统运行状态</p>
      </div>

      <div class="page-content">
        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6">
            <div class="stats-card primary">
              <div class="stats-number">{{ stats.totalCandidates || 0 }}</div>
              <div class="stats-label">考生总数</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stats-card success">
              <div class="stats-number">{{ stats.todayExams || 0 }}</div>
              <div class="stats-label">今日考试</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stats-card warning">
              <div class="stats-number">{{ stats.ongoingExams || 0 }}</div>
              <div class="stats-label">进行中</div>
            </div>
          </el-col>

          <el-col :span="6">
            <div class="stats-card danger">
              <div class="stats-number">{{ stats.completedExams || 0 }}</div>
              <div class="stats-label">已完成</div>
            </div>
          </el-col>
        </el-row>

        <!-- 快速操作 -->
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-button type="primary" size="large" @click="goTo('/candidates')">
                <el-icon><User /></el-icon>
                考生管理
              </el-button>
            </el-col>

            <el-col :span="6">
              <el-button type="success" size="large" @click="goTo('/schedules/batch-create')">
                <el-icon><Calendar /></el-icon>
                批量排期
              </el-button>
            </el-col>

            <el-col :span="6">
              <el-button type="warning" size="large" @click="goTo('/candidates/import')">
                <el-icon><Upload /></el-icon>
                批量导入
              </el-button>
            </el-col>

            <el-col :span="6">
              <el-button type="info" size="large" @click="goTo('/schedules/calendar')">
                <el-icon><DataAnalysis /></el-icon>
                日程查看
              </el-button>
            </el-col>
          </el-row>
        </el-card>

        <!-- 系统状态 -->
        <el-card class="system-status">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
              <el-button type="text" @click="refreshStatus">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-descriptions border :column="2">
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ environment }}</el-descriptions-item>
            <el-descriptions-item label="数据库状态">
              <el-tag :type="dbStatus === 'healthy' ? 'success' : 'danger'">
                {{ dbStatus === 'healthy' ? '正常' : '异常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务状态">
              <el-tag type="success">运行中</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="上次更新">{{ lastUpdateTime }}</el-descriptions-item>
            <el-descriptions-item label="在线用户">{{ onlineUsers || 0 }} 人</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Calendar, Upload, DataAnalysis, Refresh } from '@element-plus/icons-vue'
import { api } from '@/api/request'

const router = useRouter()

// 数据状态
const stats = ref({
  totalCandidates: 0,
  todayExams: 0,
  ongoingExams: 0,
  completedExams: 0
})

const dbStatus = ref('healthy')
const environment = ref('开发环境')
const lastUpdateTime = ref('')
const onlineUsers = ref(0)

// 方法
const goTo = (path) => {
  router.push(path)
}

const refreshStatus = async () => {
  try {
    // 这里可以调用实际的API获取状态
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
    ElMessage.success('状态已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const loadDashboardData = async () => {
  try {
    // 模拟数据加载
    stats.value = {
      totalCandidates: 1248,
      todayExams: 56,
      ongoingExams: 12,
      completedExams: 32
    }

    dbStatus.value = 'healthy'
    environment.value = import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
    onlineUsers.value = Math.floor(Math.random() * 20) + 5

  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 24px;
  }

  .quick-actions {
    margin-bottom: 24px;

    .el-button {
      width: 100%;
      height: 60px;

      .el-icon {
        margin-right: 8px;
      }
    }
  }

  .system-status {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>