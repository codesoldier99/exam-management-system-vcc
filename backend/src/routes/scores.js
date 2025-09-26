const express = require('express');
const router = express.Router();

// 获取成绩列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '获取成绩列表 - 待实现',
    data: []
  });
});

// 获取考生成绩
router.get('/examinee/:id', (req, res) => {
  res.json({
    success: true,
    message: '获取考生成绩 - 待实现',
    data: { examiner_id: req.params.id }
  });
});

// 录入成绩
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: '录入成绩 - 待实现',
    data: req.body
  });
});

// 更新成绩
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: '更新成绩 - 待实现',
    data: { id: req.params.id, ...req.body }
  });
});

// 删除成绩记录
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: '删除成绩记录 - 待实现',
    data: { id: req.params.id }
  });
});

module.exports = router;