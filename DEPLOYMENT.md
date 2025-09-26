# 🚀 无人机考点运营管理系统部署指南

## 📋 部署前检查清单

### 系统要求
- ✅ Ubuntu 22.04.5 LTS
- ✅ Docker 28.4.0+
- ✅ Docker Compose v2.27.1+
- ✅ Git 2.34.1+

### 网络要求
- ✅ 域名 `uavexam.cn` 已解析到服务器IP `106.52.214.54`
- ✅ 端口 80, 443, 3000, 3306 可用

## 🔧 问题修复

本次部署修复了以下问题：

1. **sqlite3编译错误** ✅
   - 添加了Python、make、g++等构建工具
   - 修复了Dockerfile中的依赖问题

2. **环境变量配置** ✅
   - 创建了完整的.env文件
   - 配置了正确的JWT_SECRET
   - 设置了数据库密码为 `zyzn12345!`

3. **Docker配置优化** ✅
   - 更新了docker-compose.yml
   - 修复了nginx配置
   - 添加了前端构建文件挂载

## 🚀 一键部署步骤

### 1. 进入项目目录
```bash
cd /root/apps/exam-management-system-vcc
```

### 2. 停止当前失败的构建
```bash
docker-compose down
docker system prune -f
```

### 3. 拉取最新代码
```bash
git pull origin main
```

### 4. 使用部署脚本（推荐）
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. 手动部署（如果脚本失败）
```bash
# 构建前端
cd frontend
npm install --production=false
npm run build
cd ..

# 复制构建文件
cp -r frontend/dist ./

# 启动服务
docker-compose up -d --build

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps
docker-compose logs -f
```

## 🔍 验证部署

### 1. 检查服务状态
```bash
docker-compose ps
```
所有服务应该显示 "Up" 状态。

### 2. 健康检查
```bash
# 检查应用健康
curl http://uavexam.cn/health

# 检查API
curl http://uavexam.cn/api/health

# 访问前端
curl -I http://uavexam.cn
```

### 3. 初始化数据库
```bash
# 进入应用容器
docker-compose exec app node backend/src/scripts/initDatabase.js

# 验证数据库表
docker-compose exec db mysql -u exam_user -pexam_password_123 exam_management -e "SHOW TABLES;"
```

## 🎯 访问信息

- **前端管理系统**: http://uavexam.cn
- **后端API**: http://uavexam.cn/api
- **健康检查**: http://uavexam.cn/health

## 👤 默认账户

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 系统管理员 | admin | admin123456 | 拥有所有权限 |
| 机构管理员 | institution_admin | admin123456 | 管理机构相关数据 |
| 考务员 | proctor | proctor123456 | 负责考试监考 |

## 🔧 管理命令

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs app
docker-compose logs db
docker-compose logs nginx
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart app
docker-compose restart db
```

### 备份数据
```bash
# 备份数据库
docker-compose exec db mysqldump -u exam_user -pexam_password_123 exam_management > backup.sql

# 备份上传文件
tar -czf uploads_backup.tar.gz uploads/
```

### 更新系统
```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh
```

## 🐛 故障排除

### 1. 如果sqlite3编译失败
确认Dockerfile中已添加构建工具：
```dockerfile
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    pkgconfig
```

### 2. 如果数据库连接失败
检查数据库容器状态：
```bash
docker-compose logs db
docker-compose exec db mysqladmin ping -h localhost
```

### 3. 如果前端无法访问
检查nginx配置和前端构建文件：
```bash
ls -la dist/
docker-compose logs nginx
```

### 4. 如果端口冲突
停止占用端口的服务：
```bash
netstat -tlnp | grep :80
fuser -k 80/tcp
```

## 🔒 安全配置

### 1. 防火墙设置
```bash
# 允许HTTP和HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 限制MySQL访问（仅Docker网络）
ufw deny 3306/tcp
```

### 2. SSL证书配置（生产环境）
```bash
# 安装Certbot
apt update && apt install certbot

# 申请证书
certbot certonly --standalone -d uavexam.cn -d www.uavexam.cn

# 更新nginx配置启用HTTPS
```

## 📞 技术支持

如果遇到问题，请提供以下信息：

1. 系统信息
```bash
uname -a
docker --version
docker-compose --version
```

2. 服务状态
```bash
docker-compose ps
docker-compose logs --tail=100
```

3. 配置信息（去除敏感数据）
```bash
cat .env | sed 's/=.*/=***/'
```

## 🎉 部署完成

部署成功后，你可以：

1. 访问 http://uavexam.cn 进入管理系统
2. 使用默认管理员账户登录
3. 开始配置你的考试管理业务
4. 根据需要创建新的用户和角色

祝你使用愉快！ 🚀