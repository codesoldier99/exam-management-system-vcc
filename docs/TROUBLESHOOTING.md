# 🔧 故障排除指南

本文档提供了系统部署和运行过程中常见问题的解决方案。

## 🚀 快速诊断

### 系统健康检查
```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 检查容器状态
docker-compose ps

# 查看服务日志
docker-compose logs app
```

## 🐳 Docker 相关问题

### 问题1: 容器启动失败
**现象**: `docker-compose up -d` 失败

**解决方案**:
```bash
# 检查Docker服务状态
docker --version
docker-compose --version

# 清理容器和网络
docker-compose down
docker system prune -f

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d
```

### 问题2: 端口冲突
**现象**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# 或修改docker-compose.yml中的端口映射
ports:
  - "3001:3000"  # 改为其他端口
```

### 问题3: 数据卷权限问题
**现象**: 文件上传失败，权限被拒绝

**解决方案**:
```bash
# 检查目录权限
ls -la uploads/ logs/

# 修复权限
sudo chown -R 1000:1000 uploads/ logs/
chmod -R 755 uploads/ logs/
```

## 🗄️ 数据库问题

### 问题1: 数据库连接失败
**现象**: `ECONNREFUSED 127.0.0.1:3306`

**检查清单**:
```bash
# 检查MySQL容器状态
docker-compose exec db mysqladmin ping -h localhost

# 检查数据库日志
docker-compose logs db

# 验证环境变量
docker-compose exec app printenv | grep DB_

# 手动连接测试
docker-compose exec db mysql -u exam_user -p exam_management
```

### 问题2: 数据库初始化失败
**现象**: 表不存在或数据缺失

**解决方案**:
```bash
# 重新初始化数据库
docker-compose exec app node backend/src/scripts/initDatabase.js

# 检查表结构
docker-compose exec db mysql -u exam_user -p -e "USE exam_management; SHOW TABLES;"

# 查看初始化日志
docker-compose logs app | grep "数据库初始化"
```

### 问题3: 数据库性能问题
**现象**: 查询响应慢

**优化建议**:
```sql
-- 检查慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';

-- 检查索引使用情况
EXPLAIN SELECT * FROM candidates WHERE institution_id = 1;

-- 优化查询缓存
SET GLOBAL query_cache_size = 67108864;
```

## 🌐 网络和API问题

### 问题1: API请求失败
**现象**: 404 Not Found 或 500 Internal Server Error

**诊断步骤**:
```bash
# 检查API路由
curl -X GET http://localhost:3000/health

# 检查应用日志
docker-compose logs app | tail -50

# 验证JWT Token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 检查请求格式
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' \
  -v
```

### 问题2: 跨域问题 (CORS)
**现象**: 前端无法访问后端API

**解决方案**:
```javascript
// backend/src/app.js - 检查CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```

### 问题3: 文件上传失败
**现象**: 文件上传返回错误

**检查清单**:
```bash
# 检查上传目录权限
ls -la uploads/
docker-compose exec app ls -la /app/uploads/

# 检查文件大小限制
grep UPLOAD_MAX_SIZE .env

# 检查Nginx配置
grep client_max_body_size nginx.conf
```

## 🖥️ 前端问题

### 问题1: 前端构建失败
**现象**: `npm run build` 失败

**解决方案**:
```bash
cd frontend

# 清理依赖
rm -rf node_modules package-lock.json
npm install

# 检查内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 检查环境变量
cat .env
```

### 问题2: 路由404问题
**现象**: 直接访问路由地址返回404

**解决方案**:
```nginx
# nginx.conf - 确保有正确的fallback配置
location / {
    try_files $uri $uri/ @fallback;
}

location @fallback {
    proxy_pass http://app_backend;
}
```

### 问题3: 环境变量未生效
**现象**: API_BASE_URL 等配置不正确

**检查清单**:
```bash
# 检查前端环境文件
cat frontend/.env

# 确认变量名前缀
# Vite需要VITE_前缀
VITE_API_BASE_URL=http://localhost:3000/api

# 重启开发服务器
npm run dev
```

## 🔒 认证和权限问题

### 问题1: JWT Token无效
**现象**: 认证失败，401 Unauthorized

**解决方案**:
```bash
# 检查JWT密钥
docker-compose exec app printenv | grep JWT_SECRET

# 验证Token格式
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d

# 检查Token过期时间
grep JWT_EXPIRES_IN .env
```

### 问题2: 密码验证失败
**现象**: 正确密码无法登录

**诊断**:
```bash
# 检查用户数据
docker-compose exec db mysql -u exam_user -p \
  -e "USE exam_management; SELECT id, username, password FROM users WHERE username='admin';"

# 重置管理员密码
docker-compose exec app node -e "
const bcrypt = require('bcryptjs');
console.log('New hash:', bcrypt.hashSync('admin123456', 10));
"
```

## 📱 微信小程序问题

### 问题1: 请求域名不在白名单
**现象**: request:fail url not in domain list

**解决方案**:
1. 在微信公众平台配置服务器域名
2. 开发工具勾选"不校验合法域名"
3. 确保使用HTTPS (生产环境)

### 问题2: 登录失败
**现象**: 小程序无法登录

**检查清单**:
```javascript
// 检查API地址配置
const API_BASE_URL = 'https://your-domain.com/api';

// 验证候选人登录接口
wx.request({
  url: `${API_BASE_URL}/auth/candidate-login`,
  method: 'POST',
  data: {
    id_number: '110101199001011234',
    phone: '13800138001'
  }
});
```

## 📊 性能优化

### 数据库优化
```sql
-- 创建必要索引
CREATE INDEX idx_candidates_institution ON candidates(institution_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_at);
CREATE INDEX idx_users_username ON users(username);

-- 优化配置
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL query_cache_size = 64M;
```

### 应用优化
```javascript
// 启用压缩
app.use(compression());

// 优化静态文件缓存
app.use(express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

## 🔍 日志分析

### 查看关键日志
```bash
# 应用错误日志
docker-compose logs app | grep "ERROR"

# 数据库慢查询日志
docker-compose exec db cat /var/log/mysql/slow.log

# Nginx访问日志
docker-compose logs nginx | grep "POST /api"

# 系统资源使用
docker stats
```

### 日志级别配置
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## 🚨 紧急恢复

### 数据备份恢复
```bash
# 创建备份
./scripts/backup.sh

# 恢复数据库
docker-compose exec -T db mysql -u exam_user -p exam_management < backups/backup.sql

# 验证恢复
docker-compose exec db mysql -u exam_user -p \
  -e "USE exam_management; SELECT COUNT(*) FROM candidates;"
```

### 回滚部署
```bash
# 回滚到上一版本
git checkout HEAD~1
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 应急模式
```bash
# 直接启动应用（跳过容器）
cd backend
NODE_ENV=production PORT=3000 node src/app.js

# 最小化服务
docker-compose up -d app db  # 只启动核心服务
```

## 📞 获取帮助

### 日志收集
在报告问题时，请提供以下信息：
```bash
# 系统信息
uname -a
docker --version
docker-compose --version

# 服务状态
docker-compose ps
docker-compose logs --tail=100

# 配置信息（删除敏感数据）
cat .env | sed 's/=.*/=***/'
```

### 联系支持
- **GitHub Issues**: 提交详细的错误报告
- **邮件支持**: support@example.com
- **文档更新**: 发现问题请提交PR

---

**记住**: 大多数问题都可以通过重启服务解决。如果问题持续存在，请检查日志并按照本指南进行诊断。