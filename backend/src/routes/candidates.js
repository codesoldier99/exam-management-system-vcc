const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticateToken, requireRoles, requirePermissions } = require('../middleware/auth');
const {
  validateCandidateInfo,
  validateId,
  validatePagination,
  validateDateRange
} = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'candidates-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('只支持Excel文件格式 (.xlsx, .xls)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 获取考生列表（支持分页、筛选、搜索）
router.get('/',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validatePagination,
  validateDateRange,
  candidateController.getCandidates
);

// 获取考生统计信息
router.get('/stats',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  candidateController.getCandidateStats
);

// 导出考生列表到Excel
router.get('/export',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  candidateController.exportCandidates
);

// 获取考生详情
router.get('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validateId,
  candidateController.getCandidateById
);

// 创建考生
router.post('/',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateCandidateInfo,
  candidateController.createCandidate
);

// 批量Excel导入考生
router.post('/import',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  upload.single('file'),
  candidateController.importCandidates
);

// 更新考生信息
router.put('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateId,
  validateCandidateInfo,
  candidateController.updateCandidate
);

// 更新考生状态
router.patch('/:id/status',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateId,
  candidateController.updateCandidateStatus
);

// 删除考生
router.delete('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateId,
  candidateController.deleteCandidate
);

module.exports = router;