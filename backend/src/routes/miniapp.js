const express = require('express');
const router = express.Router();
const miniappController = require('../controllers/miniappController');
const { authenticateToken, candidateOnly, userOnly } = require('../middleware/auth');
const {
  validateCandidateLogin,
  validateLogin
} = require('../middleware/validation');
const { body } = require('express-validator');

// 小程序专用验证中间件
const validateQRScan = [
  body('qr_data')
    .notEmpty()
    .withMessage('二维码数据不能为空')
    .isLength({ max: 2000 })
    .withMessage('二维码数据长度超出限制')
];

// ==================== 公共接口（无需认证） ====================

// 公共考场看板数据
router.get('/public/board',
  miniappController.getPublicBoard
);

// ==================== 考生相关接口 ====================

// 考生身份证登录
router.post('/candidate/login',
  validateCandidateLogin,
  miniappController.candidateLogin
);

// 获取考生个人信息和日程（需要考生token）
router.get('/candidate/profile',
  authenticateToken,
  candidateOnly,
  miniappController.getCandidateProfile
);

// 生成考生专用动态二维码（需要考生token）
router.get('/candidate/qrcode',
  authenticateToken,
  candidateOnly,
  miniappController.generateCandidateQR
);

// 获取考生今日日程（需要考生token）
router.get('/candidate/today-schedules',
  authenticateToken,
  candidateOnly,
  miniappController.getTodaySchedules
);

// ==================== 考务人员相关接口 ====================

// 考务人员登录
router.post('/staff/login',
  validateLogin,
  miniappController.staffLogin
);

// 考务人员扫码签到（需要考务人员token）
router.post('/staff/scan-checkin',
  authenticateToken,
  userOnly,
  validateQRScan,
  miniappController.scanCheckin
);

// 获取考场看板数据（需要考务人员token）
router.get('/staff/board',
  authenticateToken,
  userOnly,
  miniappController.getPublicBoard
);

module.exports = router;