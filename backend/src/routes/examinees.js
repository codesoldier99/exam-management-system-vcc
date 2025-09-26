const express = require('express');
const router = express.Router();

// 获取考生列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '获取考生列表 - 待实现',
    data: []
  });
});

// 获取考生详情
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: '获取考生详情 - 待实现',
    data: { id: req.params.id }
  });
});

// 注册考生
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: '注册考生 - 待实现',
    data: req.body
  });
});

// 更新考生信息
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: '更新考生信息 - 待实现',
    data: { id: req.params.id, ...req.body }
  });
});

// 删除考生
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: '删除考生 - 待实现',
    data: { id: req.params.id }
  });
});

module.exports = router;