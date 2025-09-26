const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const {
  validateLogin,
  validateCandidateLogin,
  validateUserRegistration,
  validatePasswordChange
} = require('../middleware/validation');

// 用户登录
router.post('/login', validateLogin, authController.login);

// 考生登录（小程序使用）
router.post('/candidate-login', validateCandidateLogin, authController.candidateLogin);

// 用户注册（仅限管理员）
router.post('/register',
  authenticateToken,
  requireRoles(['ADMIN']),
  validateUserRegistration,
  authController.register
);

// 登出
router.post('/logout', authController.logout);

// 刷新token
router.post('/refresh-token', authController.refreshToken);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 修改密码
router.put('/change-password',
  authenticateToken,
  validatePasswordChange,
  authController.changePassword
);

module.exports = router;