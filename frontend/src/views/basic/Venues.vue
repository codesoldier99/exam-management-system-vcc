<template>
  <div class="venues">
    <div class="page-header">
      <h2>考场管理</h2>
      <p>管理考试场地和设备信息</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增考场
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="handleExport" :disabled="selectedRows.length === 0">
          <el-icon><Download /></el-icon>
          导出选中
        </el-button>
        <el-dropdown @command="handleBatchAction" v-if="selectedRows.length > 0">
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="enable">启用选中</el-dropdown-item>
              <el-dropdown-item command="disable">禁用选中</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除选中</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索考场名称或地址"
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
        <el-form-item label="所属机构">
          <el-select v-model="searchForm.institutionId" placeholder="全部机构" clearable style="width: 200px">
            <el-option label="北京航空学院" :value="1" />
            <el-option label="上海无人机中心" :value="2" />
            <el-option label="深圳飞行基地" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="考场类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="室内考场" value="indoor" />
            <el-option label="室外考场" value="outdoor" />
            <el-option label="综合考场" value="mixed" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="可用" value="available" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量范围">
          <el-slider
            v-model="capacityRange"
            range
            :min="0"
            :max="200"
            :step="10"
            style="width: 200px"
          />
          <span style="margin-left: 12px; color: #999; font-size: 12px;">
            {{ capacityRange[0] }} - {{ capacityRange[1] }}人
          </span>
        </el-form-item>
      </el-form>
    </div>

    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon available">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.available }}</div>
              <div class="stat-label">可用考场</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon occupied">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.occupied }}</div>
              <div class="stat-label">使用中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon maintenance">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.maintenance }}</div>
              <div class="stat-label">维护中</div>
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
              <div class="stat-label">总计</div>
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
        <el-table-column prop="code" label="考场编号" width="120" sortable />
        <el-table-column prop="name" label="考场信息" min-width="250">
          <template #default="{ row }">
            <div class="venue-info">
              <div class="name">{{ row.name }}</div>
              <div class="address">
                <el-icon><Location /></el-icon>
                {{ row.address }}
              </div>
              <div class="institution">{{ row.institutionName }}</div>
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
        <el-table-column prop="capacity" label="容量" width="100" sortable>
          <template #default="{ row }">
            {{ row.capacity }}人
          </template>
        </el-table-column>
        <el-table-column prop="equipment" label="设备信息" width="200">
          <template #default="{ row }">
            <div class="equipment-list">
              <el-tag
                v-for="item in row.equipment.slice(0, 3)"
                :key="item"
                size="small"
                style="margin: 2px;"
              >
                {{ item }}
              </el-tag>
              <el-tag v-if="row.equipment.length > 3" size="small" type="info">
                +{{ row.equipment.length - 3 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="currentUse" label="使用情况" width="120">
          <template #default="{ row }">
            <div class="usage-info">
              <el-progress
                :percentage="Math.round((row.currentUse / row.capacity) * 100)"
                :stroke-width="8"
                :show-text="false"
                :color="getUsageColor(row.currentUse / row.capacity)"
              />
              <div class="usage-text">
                {{ row.currentUse }}/{{ row.capacity }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              :effect="row.status === 'available' ? 'light' : 'plain'"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="getStatusIcon(row.status)" />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastInspection" label="最后检查" width="120">
          <template #default="{ row }">
            <div class="inspection-info">
              <div>{{ formatDate(row.lastInspection) }}</div>
              <div class="days-ago">{{ getDaysAgo(row.lastInspection) }}天前</div>
            </div>
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
            <el-button link type="warning" @click="handleInspection(row)">
              检查
            </el-button>
            <el-dropdown @command="(command) => handleRowAction(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="schedule">排期</el-dropdown-item>
                  <el-dropdown-item command="maintenance" divided>维护</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="考场编号" prop="code">
                  <el-input
                    v-model="form.code"
                    placeholder="请输入考场编号"
                    :disabled="isEdit"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="考场名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入考场名称" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所属机构" prop="institutionId">
                  <el-select v-model="form.institutionId" placeholder="选择所属机构" style="width: 100%">
                    <el-option label="北京航空学院" :value="1" />
                    <el-option label="上海无人机中心" :value="2" />
                    <el-option label="深圳飞行基地" :value="3" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="考场类型" prop="type">
                  <el-select v-model="form.type" placeholder="选择考场类型" style="width: 100%">
                    <el-option label="室内考场" value="indoor" />
                    <el-option label="室外考场" value="outdoor" />
                    <el-option label="综合考场" value="mixed" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="容量" prop="capacity">
                  <el-input-number
                    v-model="form.capacity"
                    :min="1"
                    :max="500"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px; color: #999;">人</span>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="面积" prop="area">
                  <el-input-number
                    v-model="form.area"
                    :min="1"
                    :precision="1"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px; color: #999;">m²</span>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="楼层" prop="floor">
                  <el-input v-model="form.floor" placeholder="如：1F, B1" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="详细地址" prop="address">
              <el-input
                v-model="form.address"
                placeholder="请输入详细地址"
              />
            </el-form-item>

            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入考场描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="设备配置" name="equipment">
            <el-form-item label="设备清单" prop="equipment">
              <div class="equipment-config">
                <el-row :gutter="12" v-for="(item, index) in form.equipmentList" :key="index" style="margin-bottom: 12px;">
                  <el-col :span="8">
                    <el-input v-model="item.name" placeholder="设备名称" />
                  </el-col>
                  <el-col :span="6">
                    <el-input v-model="item.model" placeholder="型号" />
                  </el-col>
                  <el-col :span="4">
                    <el-input-number v-model="item.quantity" :min="1" style="width: 100%" />
                  </el-col>
                  <el-col :span="4">
                    <el-select v-model="item.status" style="width: 100%">
                      <el-option label="正常" value="normal" />
                      <el-option label="维修" value="repair" />
                      <el-option label="报废" value="scrap" />
                    </el-select>
                  </el-col>
                  <el-col :span="2">
                    <el-button type="danger" link @click="removeEquipment(index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-col>
                </el-row>
                <el-button @click="addEquipment" type="primary" link>
                  <el-icon><Plus /></el-icon>
                  添加设备
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="网络配置">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-checkbox v-model="form.hasWifi">无线网络</el-checkbox>
                  <el-input
                    v-if="form.hasWifi"
                    v-model="form.wifiName"
                    placeholder="WiFi名称"
                    style="margin-top: 8px;"
                  />
                </el-col>
                <el-col :span="12">
                  <el-checkbox v-model="form.hasEthernet">有线网络</el-checkbox>
                  <el-input-number
                    v-if="form.hasEthernet"
                    v-model="form.ethernetPorts"
                    :min="0"
                    placeholder="网络端口数量"
                    style="margin-top: 8px; width: 100%;"
                  />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="监控设备">
              <el-checkbox-group v-model="form.surveillance">
                <el-checkbox label="video">视频监控</el-checkbox>
                <el-checkbox label="audio">音频监控</el-checkbox>
                <el-checkbox label="screen">屏幕监控</el-checkbox>
                <el-checkbox label="behavior">行为监控</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="状态设置" name="status">
            <el-form-item label="当前状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="available">可用</el-radio>
                <el-radio label="maintenance">维护中</el-radio>
                <el-radio label="disabled">停用</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="开放时间">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-time-picker
                    v-model="form.openTime"
                    placeholder="开始时间"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="12">
                  <el-time-picker
                    v-model="form.closeTime"
                    placeholder="结束时间"
                    style="width: 100%"
                  />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="工作日">
              <el-checkbox-group v-model="form.workDays">
                <el-checkbox label="1">周一</el-checkbox>
                <el-checkbox label="2">周二</el-checkbox>
                <el-checkbox label="3">周三</el-checkbox>
                <el-checkbox label="4">周四</el-checkbox>
                <el-checkbox label="5">周五</el-checkbox>
                <el-checkbox label="6">周六</el-checkbox>
                <el-checkbox label="0">周日</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="特殊说明">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="3"
                placeholder="请输入特殊说明"
                maxlength="300"
                show-word-limit
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
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

    <!-- 考场检查对话框 -->
    <el-dialog v-model="inspectionDialogVisible" title="考场检查" width="600px">
      <el-form :model="inspectionForm" label-width="100px">
        <el-form-item label="检查日期">
          <el-date-picker
            v-model="inspectionForm.date"
            type="datetime"
            placeholder="选择检查时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="检查项目">
          <el-checkbox-group v-model="inspectionForm.items">
            <el-checkbox label="equipment">设备检查</el-checkbox>
            <el-checkbox label="network">网络测试</el-checkbox>
            <el-checkbox label="safety">安全检查</el-checkbox>
            <el-checkbox label="environment">环境检查</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="检查结果">
          <el-radio-group v-model="inspectionForm.result">
            <el-radio label="pass">通过</el-radio>
            <el-radio label="warning">警告</el-radio>
            <el-radio label="fail">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检查备注">
          <el-input
            v-model="inspectionForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入检查备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="inspectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleInspectionSubmit">
            提交检查
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Upload, Download, ArrowDown, Location, OfficeBuilding, Monitor,
  Tools, DataBoard, Delete, SuccessFilled, WarningFilled, CircleCloseFilled
} from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const inspectionDialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')
const formRef = ref()

const searchForm = reactive({
  keyword: '',
  institutionId: '',
  type: '',
  status: ''
})

const capacityRange = ref([0, 200])

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const stats = reactive({
  available: 12,
  occupied: 8,
  maintenance: 2,
  total: 22
})

const form = reactive({
  code: '',
  name: '',
  institutionId: '',
  type: '',
  capacity: 30,
  area: 100,
  floor: '1F',
  address: '',
  description: '',
  equipmentList: [
    { name: '', model: '', quantity: 1, status: 'normal' }
  ],
  hasWifi: false,
  wifiName: '',
  hasEthernet: false,
  ethernetPorts: 0,
  surveillance: [],
  status: 'available',
  openTime: null,
  closeTime: null,
  workDays: ['1', '2', '3', '4', '5'],
  notes: ''
})

const inspectionForm = reactive({
  date: new Date(),
  items: [],
  result: 'pass',
  notes: ''
})

const formRules = {
  code: [
    { required: true, message: '请输入考场编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入考场名称', trigger: 'blur' }
  ],
  institutionId: [
    { required: true, message: '请选择所属机构', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择考场类型', trigger: 'change' }
  ],
  capacity: [
    { required: true, message: '请输入容量', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

const tableData = ref([
  {
    id: 1,
    code: 'VE001',
    name: '理论考试教室A',
    institutionName: '北京航空学院',
    address: '北京市朝阳区航空路100号1号楼',
    type: 'indoor',
    capacity: 50,
    currentUse: 30,
    equipment: ['投影仪', '音响系统', '空调', '监控设备', '网络设备'],
    status: 'available',
    lastInspection: '2024-01-20 09:00:00'
  },
  {
    id: 2,
    code: 'VE002',
    name: '实操训练场B',
    institutionName: '上海无人机中心',
    address: '上海市浦东新区科技路200号',
    type: 'outdoor',
    capacity: 20,
    currentUse: 15,
    equipment: ['无人机设备', '安全防护网', '通讯设备'],
    status: 'occupied',
    lastInspection: '2024-01-18 14:30:00'
  }
])

const selectedRows = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑考场' : '新增考场')

const getTypeTagType = (type) => {
  const typeMap = {
    indoor: 'primary',
    outdoor: 'success',
    mixed: 'warning'
  }
  return typeMap[type] || ''
}

const getTypeText = (type) => {
  const typeMap = {
    indoor: '室内考场',
    outdoor: '室外考场',
    mixed: '综合考场'
  }
  return typeMap[type] || type
}

const getStatusTagType = (status) => {
  const statusMap = {
    available: 'success',
    occupied: 'warning',
    maintenance: 'info',
    disabled: 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    available: '可用',
    occupied: '使用中',
    maintenance: '维护中',
    disabled: '停用'
  }
  return statusMap[status] || status
}

const getStatusIcon = (status) => {
  const iconMap = {
    available: SuccessFilled,
    occupied: WarningFilled,
    maintenance: Tools,
    disabled: CircleCloseFilled
  }
  return iconMap[status] || SuccessFilled
}

const getUsageColor = (ratio) => {
  if (ratio < 0.6) return '#67c23a'
  if (ratio < 0.8) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getDaysAgo = (dateStr) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now - date
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'capacity') form[key] = 30
    else if (key === 'area') form[key] = 100
    else if (key === 'floor') form[key] = '1F'
    else if (key === 'status') form[key] = 'available'
    else if (key === 'workDays') form[key] = ['1', '2', '3', '4', '5']
    else if (key === 'equipmentList') form[key] = [{ name: '', model: '', quantity: 1, status: 'normal' }]
    else if (key === 'surveillance') form[key] = []
    else if (key === 'hasWifi' || key === 'hasEthernet') form[key] = false
    else if (key === 'ethernetPorts') form[key] = 0
    else if (key === 'openTime' || key === 'closeTime') form[key] = null
    else form[key] = ''
  })
}

const addEquipment = () => {
  form.equipmentList.push({ name: '', model: '', quantity: 1, status: 'normal' })
}

const removeEquipment = (index) => {
  if (form.equipmentList.length > 1) {
    form.equipmentList.splice(index, 1)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  activeTab.value = 'basic'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.keys(form).forEach(key => {
    if (key === 'equipmentList') {
      form[key] = row.equipment ? row.equipment.map(name => ({
        name, model: '', quantity: 1, status: 'normal'
      })) : [{ name: '', model: '', quantity: 1, status: 'normal' }]
    } else {
      form[key] = row[key] || (typeof form[key] === 'boolean' ? false :
                                Array.isArray(form[key]) ? [] :
                                typeof form[key] === 'number' ? 0 : '')
    }
  })
  isEdit.value = true
  activeTab.value = 'basic'
  dialogVisible.value = true
}

const handleView = (row) => {
  const equipmentStr = row.equipment.join('、')
  ElMessageBox.alert(
    `考场编号：${row.code}<br/>
     考场名称：${row.name}<br/>
     所属机构：${row.institutionName}<br/>
     详细地址：${row.address}<br/>
     类型：${getTypeText(row.type)}<br/>
     容量：${row.capacity}人<br/>
     使用情况：${row.currentUse}/${row.capacity}<br/>
     设备：${equipmentStr}<br/>
     状态：${getStatusText(row.status)}<br/>
     最后检查：${formatDate(row.lastInspection)}`,
    '考场详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const handleInspection = (row) => {
  inspectionForm.date = new Date()
  inspectionForm.items = []
  inspectionForm.result = 'pass'
  inspectionForm.notes = ''
  inspectionDialogVisible.value = true
}

const handleRowAction = (command, row) => {
  switch (command) {
    case 'copy':
      handleEdit(row)
      form.code = ''
      form.name = form.name + ' - 副本'
      isEdit.value = false
      break
    case 'schedule':
      ElMessage.success('跳转到排期管理')
      break
    case 'maintenance':
      ElMessageBox.confirm('确定要将此考场设置为维护中状态吗？', '提示')
        .then(() => {
          row.status = 'maintenance'
          ElMessage.success('状态已更新')
        })
        .catch(() => {})
      break
    case 'delete':
      ElMessageBox.confirm('确定删除这个考场吗？', '警告', { type: 'warning' })
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
    ElMessage.warning('请先选择要操作的考场')
    return
  }

  const names = selectedRows.value.map(row => row.name).join('、')

  switch (command) {
    case 'enable':
      ElMessageBox.confirm(`确定要启用 ${names} 等 ${selectedRows.value.length} 个考场吗？`)
        .then(() => {
          ElMessage.success('批量启用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'disable':
      ElMessageBox.confirm(`确定要禁用 ${names} 等 ${selectedRows.value.length} 个考场吗？`)
        .then(() => {
          ElMessage.success('批量禁用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除 ${names} 等 ${selectedRows.value.length} 个考场吗？`, '警告', { type: 'warning' })
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

const handleInspectionSubmit = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('检查记录已提交')
    inspectionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('提交失败')
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
.venues {
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

        &.available { background: #67c23a; }
        &.occupied { background: #e6a23c; }
        &.maintenance { background: #909399; }
        &.total { background: #409eff; }
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

    .venue-info {
      .name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .address {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        margin-bottom: 2px;

        .el-icon {
          margin-right: 4px;
          font-size: 12px;
        }
      }

      .institution {
        font-size: 12px;
        color: #606266;
      }
    }

    .equipment-list {
      display: flex;
      flex-wrap: wrap;
    }

    .usage-info {
      .usage-text {
        font-size: 12px;
        color: #606266;
        margin-top: 4px;
        text-align: center;
      }
    }

    .inspection-info {
      .days-ago {
        font-size: 11px;
        color: #909399;
      }
    }

    .pagination {
      padding: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .equipment-config {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 12px;
    background: #fafafa;
  }
}

:deep(.el-dialog) {
  .el-tabs__content {
    padding-top: 20px;
  }
}

@media (max-width: 768px) {
  .venues {
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