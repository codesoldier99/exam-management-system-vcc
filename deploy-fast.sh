#!/bin/bash

# 加速版部署脚本 - 使用国内镜像源
set -e

echo "🚀 开始部署无人机考点运营管理系统（加速版）..."

# 检查环境
echo "📋 检查环境依赖..."
docker --version || { echo "❌ Docker 未安装"; exit 1; }
docker-compose --version || { echo "❌ Docker Compose 未安装"; exit 1; }

# 配置Docker镜像加速器（如果还没配置）
echo "🌐 配置Docker镜像加速器..."
DOCKER_CONFIG_DIR="/etc/docker"
DOCKER_CONFIG_FILE="$DOCKER_CONFIG_DIR/daemon.json"

if [ ! -f "$DOCKER_CONFIG_FILE" ]; then
    echo "正在配置Docker镜像加速器..."
    sudo mkdir -p $DOCKER_CONFIG_DIR
    sudo tee $DOCKER_CONFIG_FILE > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  }
}
EOF
    echo "重启Docker服务..."
    sudo systemctl restart docker
    sleep 10
    echo "✅ Docker镜像加速器配置完成"
else
    echo "✅ Docker镜像加速器已配置"
fi

# 配置npm镜像源
echo "📦 配置npm镜像源..."
# 创建全局.npmrc文件而不是使用npm config set（兼容npm 9+）
cat > ~/.npmrc << EOF
registry=https://registry.npmmirror.com
dist-url=https://npmmirror.com/mirrors/node
sass_binary_site=https://npmmirror.com/mirrors/node-sass
electron_mirror=https://npmmirror.com/mirrors/electron/
puppeteer_download_host=https://npmmirror.com/mirrors
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
operadriver_cdnurl=https://npmmirror.com/mirrors/operadriver
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs
selenium_cdnurl=https://npmmirror.com/mirrors/selenium
node_inspector_cdnurl=https://npmmirror.com/mirrors/node-inspector
sqlite3_binary_site=https://npmmirror.com/mirrors/sqlite3
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
fse_binary_host_mirror=https://npmmirror.com/mirrors/fsevents
EOF
echo "✅ npm镜像源配置完成"

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.fast.yml down || true

# 清理旧的镜像和容器
echo "🧹 清理旧的容器和镜像..."
docker system prune -f || true

# 构建前端（使用国内源）
echo "🔨 构建前端应用（使用国内镜像源）..."
cd frontend

# 检查并创建前端目录的.npmrc文件
if [ ! -f ".npmrc" ]; then
    echo "创建前端.npmrc文件..."
    cat > .npmrc << EOF
registry=https://registry.npmmirror.com
dist-url=https://npmmirror.com/mirrors/node
sass_binary_site=https://npmmirror.com/mirrors/node-sass
electron_mirror=https://npmmirror.com/mirrors/electron/
puppeteer_download_host=https://npmmirror.com/mirrors
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
operadriver_cdnurl=https://npmmirror.com/mirrors/operadriver
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs
selenium_cdnurl=https://npmmirror.com/mirrors/selenium
node_inspector_cdnurl=https://npmmirror.com/mirrors/node-inspector
sqlite3_binary_site=https://npmmirror.com/mirrors/sqlite3
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
fse_binary_host_mirror=https://npmmirror.com/mirrors/fsevents
EOF
else
    echo "✅ 前端.npmrc文件已存在"
fi

npm install --production=false
npm run build
cd ..

# 复制前端构建产物
echo "📁 复制前端构建文件..."
cp -r frontend/dist ./

# 构建和启动服务（使用加速版配置）
echo "🐳 构建并启动 Docker 服务（使用国内镜像源）..."
docker-compose -f docker-compose.fast.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.fast.yml ps

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
        docker-compose -f docker-compose.fast.yml logs
        exit 1
    fi

    sleep 5
    attempt=$((attempt + 1))
done

# 初始化数据库
echo "🗄️ 初始化数据库..."
sleep 10
docker-compose -f docker-compose.fast.yml exec -T app node backend/src/scripts/initDatabase.js || {
    echo "⚠️ 数据库初始化可能需要手动执行"
}

# 显示访问信息
echo ""
echo "🎉 部署完成！（使用国内镜像源加速）"
echo "📝 访问信息："
echo "   - 前端管理系统: http://uavexam.cn"
echo "   - 后端API: http://uavexam.cn/api"
echo "   - 健康检查: http://uavexam.cn/health"
echo ""
echo "🔧 管理命令："
echo "   - 查看日志: docker-compose -f docker-compose.fast.yml logs -f"
echo "   - 重启服务: docker-compose -f docker-compose.fast.yml restart"
echo "   - 停止服务: docker-compose -f docker-compose.fast.yml down"
echo ""
echo "👤 默认管理员账号："
echo "   - 用户名: admin"
echo "   - 密码: admin123456"
echo ""
echo "⚡ 加速优化："
echo "   - ✅ Docker镜像源: 阿里云/腾讯云/网易云"
echo "   - ✅ npm镜像源: 淘宝镜像"
echo "   - ✅ Alpine包源: 阿里云镜像"
echo ""

# 显示服务状态
echo "📊 当前服务状态："
docker-compose -f docker-compose.fast.yml ps

# 显示构建时间统计
echo ""
echo "🕒 如果构建时间仍然较长，可以尝试："
echo "   1. 预拉取镜像: docker-compose -f docker-compose.fast.yml pull"
echo "   2. 使用构建缓存: docker-compose -f docker-compose.fast.yml build --parallel"
echo "   3. 清理Docker缓存: docker builder prune"