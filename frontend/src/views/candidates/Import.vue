<template>
  <div class="candidates-import">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">批量导入考生</h1>
        <p class="page-description">通过Excel文件批量导入考生信息</p>
      </div>

      <div class="page-content">
        <!-- 步骤导航 -->
        <div class="steps-container">
          <el-steps :active="currentStep" finish-status="success">
            <el-step title="选择文件" description="上传Excel文件" />
            <el-step title="数据预览" description="预览导入数据" />
            <el-step title="验证结果" description="检查数据格式" />
            <el-step title="导入完成" description="确认导入结果" />
          </el-steps>
        </div>

        <!-- 第一步：文件上传 -->
        <div v-show="currentStep === 0" class="step-content">
          <el-card class="upload-card">
            <template #header>
              <div class="card-header">
                <span>上传Excel文件</span>
                <el-button type="text" @click="downloadTemplate">
                  <el-icon><Download /></el-icon>
                  下载模板
                </el-button>
              </div>
            </template>

            <div class="upload-area">
              <el-upload
                ref="uploadRef"
                class="upload-dragger"
                drag
                :auto-upload="false"
                :limit="1"
                accept=".xlsx,.xls"
                :on-change="handleFileChange"
                :on-exceed="handleExceed"
              >
                <el-icon class="el-icon--upload"><Upload /></el-icon>
                <div class="el-upload__text">
                  将Excel文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传 xlsx/xls 文件，且不超过 10MB
                  </div>
                </template>
              </el-upload>

              <div v-if="selectedFile" class="file-info">
                <div class="file-item">
                  <el-icon><Document /></el-icon>
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
                  <el-button type="text" @click="removeFile">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <div class="upload-instructions">
              <h4>导入说明：</h4>
              <ul>
                <li>请使用提供的Excel模板，确保列标题正确</li>
                <li>必填字段：姓名、身份证号、手机号、性别</li>
                <li>身份证号必须为18位有效身份证号码</li>
                <li>手机号必须为11位有效手机号码</li>
                <li>性别请填写"男"或"女"</li>
                <li>单次最多导入1000条数据</li>
              </ul>
            </div>

            <div class="upload-actions">
              <el-button :disabled="!selectedFile" @click="parseFile">
                <el-icon><View /></el-icon>
                解析预览
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 第二步：数据预览 -->
        <div v-show="currentStep === 1" class="step-content">
          <el-card class="preview-card">
            <template #header>
              <div class="card-header">
                <span>数据预览 (共{{ parseResult.data.length }}条)</span>
                <div class="header-actions">
                  <el-button type="text" @click="currentStep = 0">
                    <el-icon><Back /></el-icon>
                    返回上传
                  </el-button>
                </div>
              </div>
            </template>

            <div v-if="parseResult.data.length > 0" class="preview-table">
              <el-table
                :data="paginatedData"
                style="width: 100%"
                max-height="500"
                stripe
              >
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="name" label="姓名" min-width="100" />
                <el-table-column prop="id_number" label="身份证号" min-width="180" />
                <el-table-column prop="phone" label="手机号" min-width="120" />
                <el-table-column prop="displayGender" label="性别" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getGenderTagType(row.displayGender)">
                      {{ row.displayGender }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
                <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
                <el-table-column prop="birth_date" label="出生日期" width="120" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row, $index }">
                    <el-tag
                      v-if="parseResult.errors[$index + (pagination.page - 1) * pagination.pageSize]"
                      type="danger"
                    >
                      有错误
                    </el-tag>
                    <el-tag v-else type="success">正常</el-tag>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="pagination.page"
                  v-model:page-size="pagination.pageSize"
                  :total="parseResult.data.length"
                  :page-sizes="[20, 50, 100]"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                />
              </div>
            </div>

            <div class="preview-actions">
              <el-button @click="currentStep = 0">返回</el-button>
              <el-button type="primary" @click="validateData">
                验证数据
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 第三步：验证结果 -->
        <div v-show="currentStep === 2" class="step-content">
          <el-card class="validation-card">
            <template #header>
              <div class="card-header">
                <span>验证结果</span>
              </div>
            </template>

            <div class="validation-summary">
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="summary-item total">
                    <div class="summary-number">{{ parseResult.data.length }}</div>
                    <div class="summary-label">总数据量</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-item valid">
                    <div class="summary-number">{{ validCount }}</div>
                    <div class="summary-label">通过验证</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-item error">
                    <div class="summary-number">{{ errorCount }}</div>
                    <div class="summary-label">验证失败</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-item duplicate">
                    <div class="summary-number">{{ duplicateCount }}</div>
                    <div class="summary-label">重复数据</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 错误详情 -->
            <div v-if="Object.keys(parseResult.errors).length > 0" class="error-details">
              <h4>错误详情：</h4>
              <el-collapse v-model="activeErrorTypes">
                <el-collapse-item
                  v-for="(errors, type) in groupedErrors"
                  :key="type"
                  :title="`${type} (${errors.length}条)`"
                  :name="type"
                >
                  <div class="error-list">
                    <div
                      v-for="error in errors.slice(0, 20)"
                      :key="error.row"
                      class="error-item"
                    >
                      <span class="row-number">第{{ error.row + 1 }}行：</span>
                      <span class="error-message">{{ error.message }}</span>
                      <span class="error-value">{{ error.value }}</span>
                    </div>
                    <div v-if="errors.length > 20" class="more-errors">
                      还有{{ errors.length - 20 }}条错误...
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="validation-actions">
              <el-button @click="currentStep = 1">返回预览</el-button>
              <el-button
                v-if="errorCount > 0"
                type="warning"
                @click="fixErrors"
              >
                修复错误
              </el-button>
              <el-button
                type="primary"
                :disabled="validCount === 0"
                @click="confirmImport"
              >
                确认导入 ({{ validCount }}条)
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 第四步：导入完成 -->
        <div v-show="currentStep === 3" class="step-content">
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <span>导入完成</span>
              </div>
            </template>

            <div class="import-result">
              <div class="result-icon">
                <el-icon v-if="importResult.success" class="success-icon" size="60">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else class="error-icon" size="60">
                  <CircleClose />
                </el-icon>
              </div>

              <div class="result-message">
                <h3 v-if="importResult.success">导入成功！</h3>
                <h3 v-else>导入失败</h3>
                <p>{{ importResult.message }}</p>
              </div>

              <div class="result-stats">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="成功导入">
                    {{ importResult.successCount }}条
                  </el-descriptions-item>
                  <el-descriptions-item label="导入失败">
                    {{ importResult.failedCount }}条
                  </el-descriptions-item>
                  <el-descriptions-item label="重复跳过">
                    {{ importResult.duplicateCount }}条
                  </el-descriptions-item>
                  <el-descriptions-item label="总处理数">
                    {{ importResult.totalCount }}条
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <div class="result-actions">
              <el-button @click="resetImport">重新导入</el-button>
              <el-button type="primary" @click="goToCandidateList">
                查看考生列表
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Download,
  Document,
  Close,
  View,
  Back,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { useCandidatesStore } from '@/store/candidates'
import { useAuthStore } from '@/store/auth'
import * as XLSX from 'xlsx'

const router = useRouter()
const candidatesStore = useCandidatesStore()
const authStore = useAuthStore()

// 数据状态
const uploadRef = ref()
const currentStep = ref(0)
const selectedFile = ref(null)
const activeErrorTypes = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const parseResult = reactive({
  data: [],
  errors: {},
  duplicates: []
})

const importResult = reactive({
  success: false,
  message: '',
  successCount: 0,
  failedCount: 0,
  duplicateCount: 0,
  totalCount: 0
})

// 计算属性
const paginatedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return parseResult.data.slice(start, end)
})

const validCount = computed(() => {
  return parseResult.data.length - Object.keys(parseResult.errors).length
})

const errorCount = computed(() => {
  return Object.keys(parseResult.errors).length
})

const duplicateCount = computed(() => {
  return parseResult.duplicates.length
})

const groupedErrors = computed(() => {
  const grouped = {}
  Object.entries(parseResult.errors).forEach(([index, errors]) => {
    errors.forEach(error => {
      if (!grouped[error.type]) {
        grouped[error.type] = []
      }
      grouped[error.type].push({
        row: parseInt(index),
        message: error.message,
        value: error.value
      })
    })
  })
  return grouped
})

// 方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getGenderTagType = (gender) => {
  return gender === '男' ? '' : 'success'
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleExceed = () => {
  ElMessage.warning('只能选择一个文件')
}

const removeFile = () => {
  selectedFile.value = null
  uploadRef.value.clearFiles()
}

const downloadTemplate = () => {
  try {
    // 创建模板数据 - 包含示例数据和空行
    const templateData = [
      {
        '姓名*': '张三',
        '身份证号*': '110101199001011234',
        '手机号*': '13800138001',
        '性别*': '男',
        '邮箱': 'zhangsan@example.com',
        '联系地址': '北京市朝阳区示例街道1号',
        '出生日期': '1990-01-01',
        '报名号': 'REG2024001'
      },
      {
        '姓名*': '李四',
        '身份证号*': '110101199102022345',
        '手机号*': '13800138002',
        '性别*': '女',
        '邮箱': 'lisi@example.com',
        '联系地址': '北京市海淀区示例街道2号',
        '出生日期': '1991-02-02',
        '报名号': 'REG2024002'
      },
      // 空行供用户填写
      ...Array.from({ length: 10 }, () => ({
        '姓名*': '',
        '身份证号*': '',
        '手机号*': '',
        '性别*': '',
        '邮箱': '',
        '联系地址': '',
        '出生日期': '',
        '报名号': ''
      }))
    ]

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(templateData)

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 姓名
      { wch: 20 }, // 身份证号
      { wch: 15 }, // 手机号
      { wch: 8 },  // 性别
      { wch: 25 }, // 邮箱
      { wch: 30 }, // 联系地址
      { wch: 12 }, // 出生日期
      { wch: 15 }  // 报名号
    ]
    ws['!cols'] = colWidths

    // 添加说明工作表
    const instructionData = [
      { '字段': '姓名*', '说明': '必填，考生真实姓名，2-50个字符', '示例': '张三' },
      { '字段': '身份证号*', '说明': '必填，18位有效身份证号码', '示例': '110101199001011234' },
      { '字段': '手机号*', '说明': '必填，11位有效手机号码', '示例': '13800138001' },
      { '字段': '性别*', '说明': '必填，只能填写"男"或"女"', '示例': '男' },
      { '字段': '邮箱', '说明': '选填，有效的邮箱地址', '示例': 'zhangsan@example.com' },
      { '字段': '联系地址', '说明': '选填，考生联系地址', '示例': '北京市朝阳区示例街道1号' },
      { '字段': '出生日期', '说明': '选填，格式：YYYY-MM-DD', '示例': '1990-01-01' },
      { '字段': '报名号', '说明': '选填，考生报名编号', '示例': 'REG2024001' },
      {},
      { '字段': '注意事项', '说明': '', '示例': '' },
      { '字段': '1. 带*号的字段为必填项', '说明': '', '示例': '' },
      { '字段': '2. 请严格按照格式要求填写', '说明': '', '示例': '' },
      { '字段': '3. 身份证号和手机号不能重复', '说明': '', '示例': '' },
      { '字段': '4. 单次最多导入1000条数据', '说明': '', '示例': '' },
      { '字段': '5. 请删除示例数据后再导入', '说明': '', '示例': '' }
    ]

    const instructionWs = XLSX.utils.json_to_sheet(instructionData)
    instructionWs['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 25 }]

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '考生信息')
    XLSX.utils.book_append_sheet(wb, instructionWs, '填写说明')

    // 生成文件并下载
    const fileName = `考生导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('生成模板失败:', error)
    ElMessage.error('模板生成失败，请重试')
  }
}

const parseFile = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    ElMessage.loading('正在解析文件...')

    // 读取Excel文件
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })

          // 获取第一个工作表
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // 转换为JSON格式
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          })

          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(selectedFile.value)
    })

    // 处理Excel数据
    if (data.length < 2) {
      throw new Error('Excel文件格式不正确，至少需要包含表头和一行数据')
    }

    const headers = data[0]
    const rows = data.slice(1)

    // 验证表头格式
    const requiredHeaders = ['姓名*', '身份证号*', '手机号*', '性别*']
    const optionalHeaders = ['邮箱', '联系地址', '出生日期', '报名号']
    const allHeaders = [...requiredHeaders, ...optionalHeaders]

    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必要的列标题: ${missingHeaders.join(', ')}`)
    }

    // 获取列索引映射
    const columnMap = {}
    allHeaders.forEach(header => {
      const index = headers.indexOf(header)
      if (index !== -1) {
        columnMap[header] = index
      }
    })

    // 转换数据格式
    const parsedData = []
    rows.forEach((row, index) => {
      // 跳过空行
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        return
      }

      const candidateData = {
        name: row[columnMap['姓名*']] || '',
        id_number: row[columnMap['身份证号*']] || '',
        phone: row[columnMap['手机号*']] || '',
        gender: row[columnMap['性别*']] || '',
        email: row[columnMap['邮箱']] || '',
        address: row[columnMap['联系地址']] || '',
        birth_date: row[columnMap['出生日期']] || '',
        registration_number: row[columnMap['报名号']] || '',
        rowIndex: index + 2 // Excel行号（从1开始，加上表头）
      }

      // 清理数据
      Object.keys(candidateData).forEach(key => {
        if (typeof candidateData[key] === 'string') {
          candidateData[key] = candidateData[key].toString().trim()
        }
      })

      // 保持原始性别格式用于显示
      candidateData.displayGender = candidateData.gender

      // 转换性别格式用于内部处理
      if (candidateData.gender === '男') {
        candidateData.gender = 'male'
      } else if (candidateData.gender === '女') {
        candidateData.gender = 'female'
      }

      parsedData.push(candidateData)
    })

    if (parsedData.length === 0) {
      throw new Error('未找到有效的数据行')
    }

    if (parsedData.length > 1000) {
      throw new Error('单次最多只能导入1000条数据')
    }

    parseResult.data = parsedData
    parseResult.errors = {}
    parseResult.duplicates = []

    currentStep.value = 1
    ElMessage.success(`文件解析成功，共解析到 ${parsedData.length} 条数据`)

  } catch (error) {
    console.error('文件解析失败:', error)
    ElMessage.error(error.message || '文件解析失败，请检查文件格式')
  }
}

const validateData = () => {
  parseResult.errors = {}

  parseResult.data.forEach((row, index) => {
    const errors = []

    // 验证必填字段
    if (!row.name || row.name.trim() === '') {
      errors.push({ type: '必填字段错误', message: '姓名不能为空', value: row.name })
    }

    // 验证身份证号
    if (!row.id_number || !/^\d{18}$/.test(row.id_number)) {
      errors.push({ type: '身份证号格式错误', message: '身份证号必须为18位数字', value: row.id_number })
    }

    // 验证手机号
    if (!row.phone || !/^1[3-9]\d{9}$/.test(row.phone)) {
      errors.push({ type: '手机号格式错误', message: '手机号格式不正确', value: row.phone })
    }

    // 验证性别
    if (row.displayGender && !['男', '女'].includes(row.displayGender)) {
      errors.push({ type: '性别格式错误', message: '性别只能填写"男"或"女"', value: row.displayGender })
    }

    // 验证邮箱
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ type: '邮箱格式错误', message: '邮箱格式不正确', value: row.email })
    }

    if (errors.length > 0) {
      parseResult.errors[index] = errors
    }
  })

  // 检查重复数据
  const idNumbers = new Set()
  const phones = new Set()
  parseResult.data.forEach((row, index) => {
    if (idNumbers.has(row.id_number)) {
      parseResult.duplicates.push(index)
    } else {
      idNumbers.add(row.id_number)
    }

    if (phones.has(row.phone)) {
      if (!parseResult.duplicates.includes(index)) {
        parseResult.duplicates.push(index)
      }
    } else {
      phones.add(row.phone)
    }
  })

  currentStep.value = 2
  ElMessage.success('数据验证完成')
}

const fixErrors = () => {
  ElMessage.info('自动修复功能开发中，请手动修改Excel文件后重新上传')
}

const confirmImport = async () => {
  if (validCount.value === 0) {
    ElMessage.warning('没有可导入的有效数据')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要导入${validCount.value}条数据吗？`,
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 准备有效数据（排除有错误的行）
    const validData = parseResult.data.filter((_, index) => !parseResult.errors[index])

    // 转换数据格式以匹配API要求
    const importData = validData.map(item => ({
      name: item.name,
      id_number: item.id_number,
      phone: item.phone,
      gender: item.gender === 'male' ? '男' : '女', // 转换回中文格式
      email: item.email,
      address: item.address,
      birth_date: item.birth_date,
      registration_number: item.registration_number,
      institution_id: authStore.user?.institution_id || null,
      status: 'active'
    }))

    // 创建FormData并添加JSON数据
    const formData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(importData)], { type: 'application/json' })
    formData.append('data', jsonBlob)

    // 调用导入API
    const result = await candidatesStore.importCandidates(formData, (progress) => {
      // 可选：处理进度回调
      console.log('导入进度:', progress)
    })

    // 设置导入结果
    importResult.success = true
    importResult.message = result.message || '数据导入成功完成'
    importResult.successCount = result.successCount || validData.length
    importResult.failedCount = result.failedCount || 0
    importResult.duplicateCount = result.duplicateCount || duplicateCount.value
    importResult.totalCount = parseResult.data.length

    currentStep.value = 3

  } catch (error) {
    if (error !== 'cancel') {
      console.error('导入失败:', error)

      // 设置失败结果
      importResult.success = false
      importResult.message = error.message || '导入过程中发生错误'
      importResult.successCount = 0
      importResult.failedCount = parseResult.data.length
      importResult.duplicateCount = 0
      importResult.totalCount = parseResult.data.length

      currentStep.value = 3
    }
  }
}

const resetImport = () => {
  selectedFile.value = null
  currentStep.value = 0
  parseResult.data = []
  parseResult.errors = {}
  parseResult.duplicates = []
  uploadRef.value.clearFiles()
  pagination.page = 1
}

const goToCandidateList = () => {
  router.push('/candidates')
}

onMounted(() => {
  // 页面初始化
})
</script>

<style lang="scss" scoped>
.candidates-import {
  .steps-container {
    margin-bottom: 30px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .step-content {
    .el-card {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  // 上传步骤样式
  .upload-card {
    .upload-area {
      text-align: center;
      margin-bottom: 30px;

      .upload-dragger {
        .el-upload-dragger {
          width: 100%;
          height: 200px;
          border: 2px dashed #d9d9d9;
          border-radius: 6px;
          position: relative;
          overflow: hidden;
          background-color: #fafafa;

          &:hover {
            border-color: #409eff;
          }
        }

        .el-icon--upload {
          font-size: 60px;
          color: #c0c4cc;
          margin-top: 40px;
        }

        .el-upload__text {
          color: #606266;
          font-size: 16px;
          margin-top: 20px;

          em {
            color: #409eff;
            font-style: normal;
          }
        }
      }

      .file-info {
        margin-top: 20px;
        text-align: left;

        .file-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: #f5f7fa;
          border-radius: 6px;

          .el-icon {
            margin-right: 8px;
            color: #409eff;
          }

          .file-name {
            flex: 1;
            color: #303133;
          }

          .file-size {
            color: #909399;
            font-size: 14px;
            margin-right: 10px;
          }
        }
      }
    }

    .upload-instructions {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;

      h4 {
        margin: 0 0 15px 0;
        color: #1f2937;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: #374151;
          line-height: 1.5;
        }
      }
    }

    .upload-actions {
      text-align: center;
    }
  }

  // 预览步骤样式
  .preview-card {
    .preview-table {
      .pagination-container {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
    }

    .preview-actions {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
    }
  }

  // 验证步骤样式
  .validation-card {
    .validation-summary {
      margin-bottom: 30px;

      .summary-item {
        text-align: center;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid transparent;

        &.total {
          background: #f0f9ff;
          border-color: #3b82f6;

          .summary-number { color: #3b82f6; }
        }

        &.valid {
          background: #f0fdf4;
          border-color: #22c55e;

          .summary-number { color: #22c55e; }
        }

        &.error {
          background: #fef2f2;
          border-color: #ef4444;

          .summary-number { color: #ef4444; }
        }

        &.duplicate {
          background: #fef3c7;
          border-color: #f59e0b;

          .summary-number { color: #f59e0b; }
        }

        .summary-number {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .summary-label {
          color: #6b7280;
          font-size: 14px;
        }
      }
    }

    .error-details {
      margin-bottom: 30px;

      h4 {
        margin: 0 0 15px 0;
        color: #374151;
      }

      .error-list {
        .error-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;

          .row-number {
            min-width: 80px;
            color: #6b7280;
            font-size: 14px;
          }

          .error-message {
            flex: 1;
            color: #ef4444;
            margin-right: 10px;
          }

          .error-value {
            color: #9ca3af;
            font-size: 14px;
            font-family: monospace;
          }
        }

        .more-errors {
          text-align: center;
          padding: 10px;
          color: #6b7280;
          font-style: italic;
        }
      }
    }

    .validation-actions {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
  }

  // 结果步骤样式
  .result-card {
    .import-result {
      text-align: center;

      .result-icon {
        margin-bottom: 20px;

        .success-icon {
          color: #22c55e;
        }

        .error-icon {
          color: #ef4444;
        }
      }

      .result-message {
        margin-bottom: 30px;

        h3 {
          margin: 0 0 10px 0;
          color: #1f2937;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }
      }

      .result-stats {
        margin-bottom: 30px;
      }
    }

    .result-actions {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
  }
}

@media (max-width: 768px) {
  .candidates-import {
    .validation-summary {
      .el-col {
        margin-bottom: 15px;
      }
    }

    .result-actions,
    .validation-actions,
    .preview-actions {
      flex-direction: column;

      .el-button {
        margin: 5px 0;
      }
    }
  }
}
</style>