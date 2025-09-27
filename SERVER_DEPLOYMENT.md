# 🚀 服务器部署完整步骤指南

## 📋 第一步：在服务器上拉取最新代码

### 1. 连接到服务器
```bash
# SSH连接到你的服务器
ssh root@106.52.214.54
# 或者使用你的用户名
ssh your_username@106.52.214.54
```

### 2. 进入项目目录并拉取最新代码
```bash
# 进入项目目录
cd /root/apps/exam-management-system-vcc

# 拉取最新的优化代码
git pull origin main

# 检查新文件是否已下载
ls -la | grep -E "(fast|npmrc)"
```

你应该看到以下新文件：
- ✅ `.npmrc` - npm镜像源配置
- ✅ `Dockerfile.fast` - 优化版Docker文件
- ✅ `deploy-fast.sh` - 加速部署脚本
- ✅ `docker-compose.fast.yml` - 优化版Docker Compose配置

## 🚀 第二步：执行加速部署

### 1. 赋予执行权限
```bash
chmod +x deploy-fast.sh
```

### 2. 执行加速部署
```bash
# 使用加速版部署（推荐）
./deploy-fast.sh
```

### 3. 如果需要手动步骤部署
```bash
# 停止现有服务
docker-compose down

# 使用加速版配置部署
docker-compose -f docker-compose.fast.yml up -d --build
```

## 🔍 第三步：验证部署

### 1. 检查服务状态
```bash
# 检查容器状态
docker-compose -f docker-compose.fast.yml ps

# 查看服务日志
docker-compose -f docker-compose.fast.yml logs -f
```

### 2. 健康检查
```bash
# 检查应用健康
curl http://uavexam.cn/health
curl http://localhost:3000/health

# 检查API
curl http://uavexam.cn/api/health

# 访问前端
curl -I http://uavexam.cn
```

### 3. 访问测试
- **前端**: http://uavexam.cn
- **API**: http://uavexam.cn/api
- **健康检查**: http://uavexam.cn/health

## ⚡ 加速效果对比

### 🐌 原版部署时间
- Docker镜像下载：15-30分钟
- npm包安装：10-20分钟
- 总构建时间：25-50分钟

### 🚀 加速版部署时间
- Docker镜像下载：2-5分钟
- npm包安装：2-3分钟
- 总构建时间：5-10分钟

**预期提升：70-80%的时间节省！**

## 🔧 管理命令

### 日常运维
```bash
# 查看所有服务状态
docker-compose -f docker-compose.fast.yml ps

# 查看日志
docker-compose -f docker-compose.fast.yml logs -f

# 重启服务
docker-compose -f docker-compose.fast.yml restart

# 停止服务
docker-compose -f docker-compose.fast.yml down

# 更新服务
git pull origin main && ./deploy-fast.sh
```

### 故障排除
```bash
# 如果构建失败，清理后重试
docker system prune -f
docker-compose -f docker-compose.fast.yml up -d --build

# 查看详细错误日志
docker-compose -f docker-compose.fast.yml logs app
docker-compose -f docker-compose.fast.yml logs db
```

## 🎯 一键命令汇总

**完整部署流程（复制粘贴即可）：**

```bash
# 1. 进入项目目录
cd /root/apps/exam-management-system-vcc

# 2. 拉取最新代码
git pull origin main

# 3. 执行加速部署
chmod +x deploy-fast.sh && ./deploy-fast.sh

# 4. 验证部署
curl http://uavexam.cn/health && echo "✅ 部署成功！"
```

## 🆘 如果遇到问题

### 问题1：git pull失败
```bash
# 强制重置到远程最新版本
git fetch origin
git reset --hard origin/main
```

### 问题2：Docker构建仍然很慢
```bash
# 检查Docker镜像源配置
cat /etc/docker/daemon.json

# 重启Docker服务
sudo systemctl restart docker
```

### 问题3：权限问题
```bash
# 确保有执行权限
chmod +x deploy-fast.sh
sudo chown -R $USER:$USER .
```

## 🎉 部署完成

部署成功后：

1. **访问管理系统**：http://uavexam.cn
2. **默认管理员账号**：
   - 用户名：`admin`
   - 密码：`admin123456`
3. **开始使用系统**进行考试管理

现在你的系统应该运行得更快更稳定了！ 🚀