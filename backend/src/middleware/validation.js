const { body, param, query } = require('express-validator');

// 用户登录验证
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间'),

  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度不能少于6个字符')
];

// 考生登录验证
const validateCandidateLogin = [
  body('id_number')
    .trim()
    .notEmpty()
    .withMessage('身份证号不能为空')
    .matches(/^[0-9X]{15,20}$/i)
    .withMessage('身份证号格式不正确'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式不正确')
];

// 用户注册验证
const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),

  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 100 })
    .withMessage('密码长度应在6-100个字符之间'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式不正确'),

  body('real_name')
    .trim()
    .notEmpty()
    .withMessage('真实姓名不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('真实姓名长度应在1-50个字符之间'),

  body('institution_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('机构ID必须是正整数'),

  body('role_codes')
    .optional()
    .isArray()
    .withMessage('角色代码必须是数组')
];

// 修改密码验证
const validatePasswordChange = [
  body('old_password')
    .notEmpty()
    .withMessage('原密码不能为空'),

  body('new_password')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: 6, max: 100 })
    .withMessage('新密码长度应在6-100个字符之间'),

  body('confirm_password')
    .notEmpty()
    .withMessage('确认密码不能为空')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
];

// 考生信息验证
const validateCandidateInfo = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('姓名长度应在1-50个字符之间'),

  body('id_number')
    .trim()
    .notEmpty()
    .withMessage('身份证号不能为空')
    .matches(/^[0-9X]{15,20}$/i)
    .withMessage('身份证号格式不正确'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式不正确'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),

  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('性别必须是male或female'),

  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('出生日期格式不正确'),

  body('institution_id')
    .notEmpty()
    .withMessage('机构ID不能为空')
    .isInt({ min: 1 })
    .withMessage('机构ID必须是正整数'),

  body('registration_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('报名号长度不能超过50个字符')
];

// 排期信息验证
const validateScheduleInfo = [
  body('candidate_id')
    .notEmpty()
    .withMessage('考生ID不能为空')
    .isInt({ min: 1 })
    .withMessage('考生ID必须是正整数'),

  body('product_id')
    .notEmpty()
    .withMessage('考试产品ID不能为空')
    .isInt({ min: 1 })
    .withMessage('考试产品ID必须是正整数'),

  body('venue_id')
    .notEmpty()
    .withMessage('考场ID不能为空')
    .isInt({ min: 1 })
    .withMessage('考场ID必须是正整数'),

  body('scheduled_at')
    .notEmpty()
    .withMessage('考试时间不能为空')
    .isISO8601()
    .withMessage('考试时间格式不正确')
    .custom((value) => {
      const scheduledTime = new Date(value);
      const now = new Date();
      if (scheduledTime <= now) {
        throw new Error('考试时间不能是过去的时间');
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('考试时长必须在1-480分钟之间')
];

// 批量排期验证
const validateBatchSchedule = [
  body('candidate_ids')
    .notEmpty()
    .withMessage('考生ID列表不能为空')
    .isArray({ min: 1 })
    .withMessage('考生ID列表必须是非空数组'),

  body('candidate_ids.*')
    .isInt({ min: 1 })
    .withMessage('考生ID必须是正整数'),

  body('product_id')
    .notEmpty()
    .withMessage('考试产品ID不能为空')
    .isInt({ min: 1 })
    .withMessage('考试产品ID必须是正整数'),

  body('venue_id')
    .notEmpty()
    .withMessage('考场ID不能为空')
    .isInt({ min: 1 })
    .withMessage('考场ID必须是正整数'),

  body('start_date')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isISO8601()
    .withMessage('开始日期格式不正确'),

  body('end_date')
    .notEmpty()
    .withMessage('结束日期不能为空')
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('结束日期必须晚于开始日期');
      }
      return true;
    })
];

// ID参数验证
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是正整数')
];

// 分页参数验证
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符')
];

// 日期范围验证
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .custom((value, { req }) => {
      if (req.query.start_date && value) {
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('结束日期必须晚于开始日期');
        }
      }
      return true;
    })
];

// 考试成绩验证
const validateExamResult = [
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('分数必须在0-100之间'),

  body('result')
    .optional()
    .isIn(['pass', 'fail', 'pending'])
    .withMessage('考试结果必须是pass、fail或pending'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('备注长度不能超过1000个字符')
];

module.exports = {
  validateLogin,
  validateCandidateLogin,
  validateUserRegistration,
  validatePasswordChange,
  validateCandidateInfo,
  validateScheduleInfo,
  validateBatchSchedule,
  validateId,
  validatePagination,
  validateDateRange,
  validateExamResult
};