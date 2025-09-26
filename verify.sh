#!/bin/bash

echo "🔍 验证无人机考点运营管理系统部署状态..."
echo ""

# 检查Docker服务状态
echo "📊 Docker 服务状态:"
docker-compose ps
echo ""

# 检查健康状态
echo "🩺 健康检查:"

# 检查应用健康
echo -n "应用服务: "
if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

# 检查数据库连接
echo -n "数据库连接: "
if docker-compose exec -T db mysqladmin ping -h localhost -u exam_user -pexam_password_123 > /dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

# 检查前端访问
echo -n "前端访问: "
if curl -f -s -I http://localhost/ > /dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

# 检查API访问
echo -n "API访问: "
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ 正常"
else
    echo "❌ 异常"
fi

echo ""

# 显示容器资源使用情况
echo "💾 资源使用情况:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# 检查磁盘空间
echo "💿 磁盘空间:"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# 显示最近的日志
echo "📝 最近的应用日志:"
docker-compose logs --tail=10 app
echo ""

echo "🎯 验证完成！"
echo ""
echo "如果所有检查都显示 ✅，说明系统部署成功。"
echo "如果有 ❌ 显示，请检查对应的日志："
echo "  - docker-compose logs app"
echo "  - docker-compose logs db"
echo "  - docker-compose logs nginx"