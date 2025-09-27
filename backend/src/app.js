const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/miniapp', require('./routes/miniapp'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/examinees', require('./routes/examinees'));
app.use('/api/proctors', require('./routes/proctors'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/statistics', require('./routes/statistics'));

// API根路径
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Exam Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      candidates: '/api/candidates',
      institutions: '/api/institutions',
      exams: '/api/exams',
      health: '/health'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});