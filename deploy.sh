#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署无人机考点运营管理系统..."

# 检查环境
echo "📋 检查环境依赖..."
docker --version || { echo "❌ Docker 未安装"; exit 1; }
docker-compose --version || { echo "❌ Docker Compose 未安装"; exit 1; }

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down || true

# 清理旧的镜像和容器
echo "🧹 清理旧的容器和镜像..."
docker system prune -f || true

# 构建前端
echo "🔨 构建前端应用..."
cd frontend
npm install --production=false
npm run build
cd ..

# 复制前端构建产物
echo "📁 复制前端构建文件..."
cp -r frontend/dist ./

# 构建和启动服务
echo "🐳 构建并启动 Docker 服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 健康检查
echo "🔍 执行健康检查..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "尝试连接服务 ($attempt/$max_attempts)..."

    # 检查应用健康状态
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ 应用服务健康检查通过"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ 健康检查失败，请查看日志"
        docker-compose logs
        exit 1
    fi

    sleep 5
    attempt=$((attempt + 1))
done

# 初始化数据库
echo "🗄️ 初始化数据库..."
sleep 10
docker-compose exec -T app node backend/src/scripts/initDatabase.js || {
    echo "⚠️ 数据库初始化可能需要手动执行"
}

# 显示访问信息
echo ""
echo "🎉 部署完成！"
echo "📝 访问信息："
echo "   - 前端管理系统: http://uavexam.cn"
echo "   - 后端API: http://uavexam.cn/api"
echo "   - 健康检查: http://uavexam.cn/health"
echo ""
echo "🔧 管理命令："
echo "   - 查看日志: docker-compose logs -f"
echo "   - 重启服务: docker-compose restart"
echo "   - 停止服务: docker-compose down"
echo ""
echo "👤 默认管理员账号："
echo "   - 用户名: admin"
echo "   - 密码: admin123456"
echo ""

# 显示服务状态
echo "📊 当前服务状态："
docker-compose ps