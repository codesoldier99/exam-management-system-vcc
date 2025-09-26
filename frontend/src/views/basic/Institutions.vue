<template>
  <div class="institutions">
    <div class="page-header">
      <h2>机构管理</h2>
      <p>管理考试培训机构信息</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增机构
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-dropdown @command="handleBatchAction" v-if="selectedRows.length > 0">
          <el-button>
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="enable">启用选中</el-dropdown-item>
              <el-dropdown-item command="disable">禁用选中</el-dropdown-item>
              <el-dropdown-item command="audit">审核选中</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除选中</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索机构名称或代码"
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
        <el-form-item label="机构类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="培训机构" value="training" />
            <el-option label="考试中心" value="exam_center" />
            <el-option label="综合机构" value="comprehensive" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证状态">
          <el-select v-model="searchForm.certificationStatus" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="已认证" value="certified" />
            <el-option label="待认证" value="pending" />
            <el-option label="未认证" value="uncertified" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 100px">
            <el-option label="正常" value="active" />
            <el-option label="暂停" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在地区">
          <el-cascader
            v-model="searchForm.region"
            :options="regionOptions"
            placeholder="选择地区"
            style="width: 200px"
            clearable
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">正常运营</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon certified">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.certified }}</div>
              <div class="stat-label">已认证</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待审核</div>
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
        <el-table-column type="expand" width="30">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="机构代码">{{ row.code }}</el-descriptions-item>
                <el-descriptions-item label="法人代表">{{ row.legalRepresentative }}</el-descriptions-item>
                <el-descriptions-item label="注册资本">{{ row.registeredCapital }}万元</el-descriptions-item>
                <el-descriptions-item label="成立时间">{{ formatDate(row.establishedAt) }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ row.phone }}</el-descriptions-item>
                <el-descriptions-item label="电子邮箱">{{ row.email }}</el-descriptions-item>
                <el-descriptions-item label="详细地址" :span="2">{{ row.address }}</el-descriptions-item>
                <el-descriptions-item label="机构简介" :span="2">{{ row.description || '暂无' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="机构信息" min-width="280" fixed="left">
          <template #default="{ row }">
            <div class="institution-info">
              <div class="main-info">
                <div class="name">{{ row.name }}</div>
                <div class="tags">
                  <el-tag :type="getTypeTagType(row.type)" size="small">
                    {{ getTypeText(row.type) }}
                  </el-tag>
                  <el-tag
                    :type="getCertificationTagType(row.certificationStatus)"
                    size="small"
                    style="margin-left: 4px;"
                  >
                    {{ getCertificationText(row.certificationStatus) }}
                  </el-tag>
                </div>
              </div>
              <div class="sub-info">
                <div class="code">机构代码：{{ row.code }}</div>
                <div class="location">
                  <el-icon><Location /></el-icon>
                  {{ row.province }}{{ row.city }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="legalRepresentative" label="法人代表" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="studentCount" label="学员数量" width="100" sortable>
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewStudents(row)">
              {{ row.studentCount }}人
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="instructorCount" label="教员数量" width="100" sortable>
          <template #default="{ row }">
            <el-link type="success" @click="handleViewInstructors(row)">
              {{ row.instructorCount }}人
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="venueCount" label="考场数量" width="100">
          <template #default="{ row }">
            <el-link type="warning" @click="handleViewVenues(row)">
              {{ row.venueCount }}个
            </el-link>
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
        <el-table-column prop="establishedAt" label="成立时间" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.establishedAt) }}
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
            <el-dropdown @command="(command) => handleRowAction(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="audit" v-if="row.certificationStatus === 'pending'">
                    审核认证
                  </el-dropdown-item>
                  <el-dropdown-item command="certificate" v-if="row.certificationStatus === 'certified'">
                    查看证书
                  </el-dropdown-item>
                  <el-dropdown-item command="contact">联系方式</el-dropdown-item>
                  <el-dropdown-item command="copy" divided>复制</el-dropdown-item>
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
      width="1200px"
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
                <el-form-item label="机构代码" prop="code">
                  <el-input
                    v-model="form.code"
                    placeholder="请输入机构代码"
                    :disabled="isEdit"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="机构名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入机构名称" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="机构类型" prop="type">
                  <el-select v-model="form.type" placeholder="选择机构类型" style="width: 100%">
                    <el-option label="培训机构" value="training" />
                    <el-option label="考试中心" value="exam_center" />
                    <el-option label="综合机构" value="comprehensive" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人代表" prop="legalRepresentative">
                  <el-input v-model="form.legalRepresentative" placeholder="请输入法人代表姓名" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="注册资本" prop="registeredCapital">
                  <el-input-number
                    v-model="form.registeredCapital"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px; color: #999;">万元</span>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="成立时间" prop="establishedAt">
                  <el-date-picker
                    v-model="form.establishedAt"
                    type="date"
                    placeholder="选择成立时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="统一社会信用代码" prop="creditCode">
                  <el-input v-model="form.creditCode" placeholder="请输入统一社会信用代码" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所在地区" prop="region">
                  <el-cascader
                    v-model="form.region"
                    :options="regionOptions"
                    placeholder="选择所在地区"
                    style="width: 100%"
                    @change="handleRegionChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="详细地址" prop="address">
                  <el-input v-model="form.address" placeholder="请输入详细地址" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="机构简介" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入机构简介"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="联系信息" name="contact">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input v-model="form.phone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="传真号码" prop="fax">
                  <el-input v-model="form.fax" placeholder="请输入传真号码" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="电子邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="请输入电子邮箱" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="官方网站" prop="website">
                  <el-input v-model="form.website" placeholder="请输入官方网站地址" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="联系人信息">
              <div class="contact-person-list">
                <el-row :gutter="12" v-for="(contact, index) in form.contactPersons" :key="index" style="margin-bottom: 12px;">
                  <el-col :span="6">
                    <el-input v-model="contact.name" placeholder="姓名" />
                  </el-col>
                  <el-col :span="6">
                    <el-input v-model="contact.position" placeholder="职务" />
                  </el-col>
                  <el-col :span="6">
                    <el-input v-model="contact.phone" placeholder="联系电话" />
                  </el-col>
                  <el-col :span="4">
                    <el-input v-model="contact.email" placeholder="邮箱" />
                  </el-col>
                  <el-col :span="2">
                    <el-button type="danger" link @click="removeContact(index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-col>
                </el-row>
                <el-button @click="addContact" type="primary" link>
                  <el-icon><Plus /></el-icon>
                  添加联系人
                </el-button>
              </div>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="认证信息" name="certification">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="认证状态" prop="certificationStatus">
                  <el-radio-group v-model="form.certificationStatus">
                    <el-radio label="uncertified">未认证</el-radio>
                    <el-radio label="pending">待认证</el-radio>
                    <el-radio label="certified">已认证</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="认证等级" prop="certificationLevel" v-if="form.certificationStatus === 'certified'">
                  <el-select v-model="form.certificationLevel" placeholder="选择认证等级" style="width: 100%">
                    <el-option label="一级资质" value="level1" />
                    <el-option label="二级资质" value="level2" />
                    <el-option label="三级资质" value="level3" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" v-if="form.certificationStatus !== 'uncertified'">
              <el-col :span="12">
                <el-form-item label="证书编号" prop="certificateNumber">
                  <el-input v-model="form.certificateNumber" placeholder="请输入证书编号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="证书有效期" prop="certificateExpiry">
                  <el-date-picker
                    v-model="form.certificateExpiry"
                    type="date"
                    placeholder="选择证书有效期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="培训项目" prop="trainingPrograms">
              <el-checkbox-group v-model="form.trainingPrograms">
                <el-checkbox label="multi_rotor">多旋翼无人机</el-checkbox>
                <el-checkbox label="fixed_wing">固定翼无人机</el-checkbox>
                <el-checkbox label="helicopter">无人直升机</el-checkbox>
                <el-checkbox label="vtol">垂直起降固定翼</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="资质文件上传">
              <el-upload
                ref="uploadRef"
                :file-list="form.qualificationFiles"
                :before-upload="beforeUpload"
                :on-success="handleUploadSuccess"
                :on-remove="handleFileRemove"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                :limit="5"
                drag
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传PDF、图片文件，且不超过10MB，最多5个文件
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="状态设置" name="status">
            <el-form-item label="机构状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="active">正常</el-radio>
                <el-radio label="inactive">暂停</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="备注信息" prop="notes">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="4"
                placeholder="请输入备注信息"
                maxlength="500"
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

    <!-- 认证审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="认证审核" width="800px">
      <div class="audit-content">
        <div class="institution-summary">
          <h4>机构信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="机构名称">{{ currentAuditRow?.name }}</el-descriptions-item>
            <el-descriptions-item label="法人代表">{{ currentAuditRow?.legalRepresentative }}</el-descriptions-item>
            <el-descriptions-item label="成立时间">{{ formatDate(currentAuditRow?.establishedAt) }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentAuditRow?.phone }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-form :model="auditForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditForm.result">
              <el-radio label="approved">通过</el-radio>
              <el-radio label="rejected">拒绝</el-radio>
              <el-radio label="pending">需补充材料</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="认证等级" v-if="auditForm.result === 'approved'">
            <el-select v-model="auditForm.certificationLevel" placeholder="选择认证等级">
              <el-option label="一级资质" value="level1" />
              <el-option label="二级资质" value="level2" />
              <el-option label="三级资质" value="level3" />
            </el-select>
          </el-form-item>

          <el-form-item label="审核意见">
            <el-input
              v-model="auditForm.comments"
              type="textarea"
              :rows="4"
              placeholder="请输入审核意见"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAuditSubmit">
            提交审核
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
  Plus, Search, Upload, Download, ArrowDown, Location, OfficeBuilding, Medal,
  Clock, DataBoard, Delete, UploadFilled
} from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const auditDialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')
const formRef = ref()
const uploadRef = ref()

const searchForm = reactive({
  keyword: '',
  type: '',
  certificationStatus: '',
  status: '',
  region: []
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const stats = reactive({
  active: 15,
  certified: 12,
  pending: 3,
  total: 18
})

const form = reactive({
  code: '',
  name: '',
  type: '',
  legalRepresentative: '',
  registeredCapital: 100,
  establishedAt: null,
  creditCode: '',
  region: [],
  address: '',
  description: '',
  phone: '',
  fax: '',
  email: '',
  website: '',
  contactPersons: [
    { name: '', position: '', phone: '', email: '' }
  ],
  certificationStatus: 'uncertified',
  certificationLevel: '',
  certificateNumber: '',
  certificateExpiry: null,
  trainingPrograms: [],
  qualificationFiles: [],
  status: 'active',
  notes: ''
})

const auditForm = reactive({
  result: 'approved',
  certificationLevel: '',
  comments: ''
})

const currentAuditRow = ref(null)

const formRules = {
  code: [
    { required: true, message: '请输入机构代码', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入机构名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择机构类型', trigger: 'change' }
  ],
  legalRepresentative: [
    { required: true, message: '请输入法人代表', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

const regionOptions = [
  {
    value: 'beijing',
    label: '北京市',
    children: [
      { value: 'haidian', label: '海淀区' },
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'dongcheng', label: '东城区' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'pudong', label: '浦东新区' },
      { value: 'xuhui', label: '徐汇区' }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { value: 'guangzhou', label: '广州市' },
      { value: 'shenzhen', label: '深圳市' },
      { value: 'dongguan', label: '东莞市' }
    ]
  }
]

const tableData = ref([
  {
    id: 1,
    code: 'ORG001',
    name: '北京航空无人机培训中心',
    type: 'training',
    legalRepresentative: '张三',
    registeredCapital: 500,
    creditCode: '91110000123456789X',
    province: '北京市',
    city: '海淀区',
    address: '北京市海淀区中关村大街100号',
    phone: '010-12345678',
    email: 'info@bjuav.com',
    website: 'http://www.bjuav.com',
    studentCount: 156,
    instructorCount: 8,
    venueCount: 3,
    certificationStatus: 'certified',
    certificationLevel: 'level1',
    certificateNumber: 'CERT2024001',
    status: 'active',
    establishedAt: '2020-03-15',
    description: '专业从事无人机驾驶员培训的权威机构'
  },
  {
    id: 2,
    code: 'ORG002',
    name: '上海飞行技术学院',
    type: 'exam_center',
    legalRepresentative: '李四',
    registeredCapital: 800,
    creditCode: '91310000987654321Y',
    province: '上海市',
    city: '浦东新区',
    address: '上海市浦东新区张江高科技园区',
    phone: '021-87654321',
    email: 'contact@shfly.edu.cn',
    website: 'http://www.shfly.edu.cn',
    studentCount: 203,
    instructorCount: 12,
    venueCount: 5,
    certificationStatus: 'pending',
    status: 'active',
    establishedAt: '2019-07-20'
  }
])

const selectedRows = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑机构' : '新增机构')

const getTypeTagType = (type) => {
  const typeMap = {
    training: 'primary',
    exam_center: 'success',
    comprehensive: 'warning'
  }
  return typeMap[type] || ''
}

const getTypeText = (type) => {
  const typeMap = {
    training: '培训机构',
    exam_center: '考试中心',
    comprehensive: '综合机构'
  }
  return typeMap[type] || type
}

const getCertificationTagType = (status) => {
  const statusMap = {
    certified: 'success',
    pending: 'warning',
    uncertified: 'info'
  }
  return statusMap[status] || ''
}

const getCertificationText = (status) => {
  const statusMap = {
    certified: '已认证',
    pending: '待认证',
    uncertified: '未认证'
  }
  return statusMap[status] || status
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'registeredCapital') form[key] = 100
    else if (key === 'status') form[key] = 'active'
    else if (key === 'certificationStatus') form[key] = 'uncertified'
    else if (key === 'contactPersons') form[key] = [{ name: '', position: '', phone: '', email: '' }]
    else if (key === 'trainingPrograms' || key === 'qualificationFiles' || key === 'region') form[key] = []
    else if (key === 'establishedAt' || key === 'certificateExpiry') form[key] = null
    else form[key] = ''
  })
}

const addContact = () => {
  form.contactPersons.push({ name: '', position: '', phone: '', email: '' })
}

const removeContact = (index) => {
  if (form.contactPersons.length > 1) {
    form.contactPersons.splice(index, 1)
  }
}

const handleRegionChange = (value) => {
  if (value && value.length >= 2) {
    const province = regionOptions.find(p => p.value === value[0])
    if (province) {
      const city = province.children?.find(c => c.value === value[1])
      if (city) {
        form.province = province.label
        form.city = city.label
      }
    }
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
    if (key === 'region') {
      form[key] = []
    } else if (key === 'contactPersons') {
      form[key] = [{ name: '', position: '', phone: '', email: '' }]
    } else if (key === 'trainingPrograms' || key === 'qualificationFiles') {
      form[key] = []
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
  const trainingText = row.trainingPrograms?.length ? row.trainingPrograms.join('、') : '无'
  ElMessageBox.alert(
    `机构代码：${row.code}<br/>
     机构名称：${row.name}<br/>
     机构类型：${getTypeText(row.type)}<br/>
     法人代表：${row.legalRepresentative}<br/>
     联系电话：${row.phone}<br/>
     电子邮箱：${row.email}<br/>
     详细地址：${row.address}<br/>
     认证状态：${getCertificationText(row.certificationStatus)}<br/>
     状态：${row.status === 'active' ? '正常' : '暂停'}<br/>
     成立时间：${formatDate(row.establishedAt)}`,
    '机构详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const handleViewStudents = (row) => {
  ElMessage.info(`查看 ${row.name} 的学员信息`)
}

const handleViewInstructors = (row) => {
  ElMessage.info(`查看 ${row.name} 的教员信息`)
}

const handleViewVenues = (row) => {
  ElMessage.info(`查看 ${row.name} 的考场信息`)
}

const handleRowAction = (command, row) => {
  switch (command) {
    case 'audit':
      currentAuditRow.value = row
      auditForm.result = 'approved'
      auditForm.certificationLevel = ''
      auditForm.comments = ''
      auditDialogVisible.value = true
      break
    case 'certificate':
      ElMessage.success('查看认证证书')
      break
    case 'contact':
      ElMessageBox.alert(
        `联系电话：${row.phone}<br/>
         电子邮箱：${row.email}<br/>
         官方网站：${row.website || '未提供'}<br/>
         详细地址：${row.address}`,
        '联系方式',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭'
        }
      )
      break
    case 'copy':
      handleEdit(row)
      form.code = ''
      form.name = form.name + ' - 副本'
      isEdit.value = false
      break
    case 'delete':
      ElMessageBox.confirm('确定删除这个机构吗？', '警告', { type: 'warning' })
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
    ElMessage.warning('请先选择要操作的机构')
    return
  }

  const names = selectedRows.value.map(row => row.name).join('、')

  switch (command) {
    case 'enable':
      ElMessageBox.confirm(`确定要启用 ${names} 等 ${selectedRows.value.length} 个机构吗？`)
        .then(() => {
          ElMessage.success('批量启用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'disable':
      ElMessageBox.confirm(`确定要禁用 ${names} 等 ${selectedRows.value.length} 个机构吗？`)
        .then(() => {
          ElMessage.success('批量禁用成功')
          fetchData()
        })
        .catch(() => {})
      break
    case 'audit':
      ElMessage.info('批量审核功能开发中')
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除 ${names} 等 ${selectedRows.value.length} 个机构吗？`, '警告', { type: 'warning' })
        .then(() => {
          ElMessage.success('批量删除成功')
          fetchData()
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

const handleAuditSubmit = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (auditForm.result === 'approved') {
      currentAuditRow.value.certificationStatus = 'certified'
      currentAuditRow.value.certificationLevel = auditForm.certificationLevel
      ElMessage.success('审核通过，机构已获得认证')
    } else if (auditForm.result === 'rejected') {
      currentAuditRow.value.certificationStatus = 'uncertified'
      ElMessage.success('审核未通过')
    } else {
      ElMessage.success('已标记为需补充材料')
    }

    auditDialogVisible.value = false
    await fetchData()
  } catch (error) {
    ElMessage.error('审核提交失败')
  }
}

const beforeUpload = (file) => {
  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isPDF && !isImage) {
    ElMessage.error('只能上传PDF或图片文件！')
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

const handleFileRemove = (file) => {
  ElMessage.success('文件删除成功')
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
.institutions {
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

  .stats-overview {
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

        &.active { background: #67c23a; }
        &.certified { background: #409eff; }
        &.pending { background: #e6a23c; }
        &.total { background: #909399; }
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

    .expand-content {
      padding: 20px;
    }

    .institution-info {
      .main-info {
        margin-bottom: 8px;

        .name {
          font-weight: 500;
          color: #303133;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .tags {
          display: flex;
          gap: 4px;
        }
      }

      .sub-info {
        .code {
          font-size: 12px;
          color: #909399;
          margin-bottom: 2px;
        }

        .location {
          font-size: 12px;
          color: #606266;
          display: flex;
          align-items: center;

          .el-icon {
            margin-right: 4px;
            font-size: 12px;
          }
        }
      }
    }

    .pagination {
      padding: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .contact-person-list {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 12px;
    background: #fafafa;
  }

  .audit-content {
    .institution-summary {
      margin-bottom: 20px;

      h4 {
        margin: 0 0 12px 0;
        color: #303133;
      }
    }
  }
}

:deep(.el-dialog) {
  .el-tabs__content {
    padding-top: 20px;
  }
}

@media (max-width: 768px) {
  .institutions {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .toolbar-right {
        justify-content: center;
      }
    }

    .stats-overview {
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