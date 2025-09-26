const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const {
  validateScheduleInfo,
  validateBatchSchedule,
  validateId,
  validatePagination,
  validateDateRange,
  validateExamResult
} = require('../middleware/validation');

// 获取排期列表（支持分页、筛选）
router.get('/',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validatePagination,
  validateDateRange,
  scheduleController.getSchedules
);

// 获取排期统计信息
router.get('/stats',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateDateRange,
  scheduleController.getScheduleStats
);

// 获取排期详情
router.get('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validateId,
  scheduleController.getScheduleById
);

// 创建单个排期
router.post('/',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateScheduleInfo,
  scheduleController.createSchedule
);

// 批量创建排期
router.post('/batch',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateBatchSchedule,
  scheduleController.createBatchSchedules
);

// 考生签到
router.post('/:id/checkin',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validateId,
  scheduleController.checkIn
);

// 开始考试
router.post('/:id/start',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validateId,
  scheduleController.startExam
);

// 完成考试
router.post('/:id/complete',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN', 'PROCTOR']),
  validateId,
  validateExamResult,
  scheduleController.completeExam
);

// 更新排期
router.put('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateId,
  validateScheduleInfo,
  scheduleController.updateSchedule
);

// 取消排期
router.delete('/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'INSTITUTION_ADMIN']),
  validateId,
  scheduleController.cancelSchedule
);

module.exports = router;