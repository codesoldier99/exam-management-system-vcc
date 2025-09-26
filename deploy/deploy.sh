#!/bin/bash

# 无人机考点运营管理系统 - 一键部署脚本
# Usage: ./deploy.sh [环境] [操作]
# 环境: dev, prod
# 操作: up, down, restart, logs, status

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="exam-management-system"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# 默认参数
ENVIRONMENT=${1:-dev}
ACTION=${2:-up}

# 打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

print_info() {
    print_message $BLUE "$1"
}

print_success() {
    print_message $GREEN "$1"
}

print_warning() {
    print_message $YELLOW "$1"
}

print_error() {
    print_message $RED "$1"
}

# 检查依赖
check_dependencies() {
    print_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "系统依赖检查完成"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."

    mkdir -p logs/nginx
    mkdir -p mysql/conf.d
    mkdir -p mysql/init
    mkdir -p redis
    mkdir -p ssl
    mkdir -p prometheus
    mkdir -p grafana/dashboards
    mkdir -p grafana/datasources

    print_success "目录创建完成"
}

# 生成环境配置文件
generate_env_file() {
    print_info "生成环境配置文件..."

    if [[ ! -f $ENV_FILE ]]; then
        cat > $ENV_FILE << EOF
# 数据库配置
MYSQL_ROOT_PASSWORD=exam_root_123
MYSQL_DATABASE=exam_system
MYSQL_USER=exam_user
MYSQL_PASSWORD=exam_password_123

# JWT配置
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# QR码密钥
QR_SECRET=$(openssl rand -base64 16)

# Grafana配置
GRAFANA_PASSWORD=admin123

# 环境配置
NODE_ENV=${ENVIRONMENT}
EOF
        print_success "环境配置文件已生成: $ENV_FILE"
    else
        print_info "环境配置文件已存在: $ENV_FILE"
    fi
}

# 生成MySQL配置
generate_mysql_config() {
    print_info "生成MySQL配置..."

    cat > mysql/conf.d/my.cnf << EOF
[mysqld]
# 基本配置
default-storage-engine=INNODB
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 连接配置
max_connections=200
max_connect_errors=10

# 查询缓存
query_cache_type=1
query_cache_size=128M

# InnoDB配置
innodb_buffer_pool_size=256M
innodb_log_file_size=64M
innodb_flush_log_at_trx_commit=2

# 日志配置
log_error=/var/log/mysql/error.log
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2

# 安全配置
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO

[mysql]
default-character-set=utf8mb4

[client]
default-character-set=utf8mb4
EOF

    print_success "MySQL配置文件已生成"
}

# 生成Redis配置
generate_redis_config() {
    print_info "生成Redis配置..."

    cat > redis/redis.conf << EOF
# Redis配置文件
bind 0.0.0.0
port 6379
timeout 300
keepalive 60

# 数据持久化
save 900 1
save 300 10
save 60 10000
rdbcompression yes
dbfilename dump.rdb
dir /data

# 内存管理
maxmemory 128mb
maxmemory-policy allkeys-lru

# 日志配置
loglevel notice
logfile /var/log/redis/redis.log

# 安全配置
protected-mode no
# requirepass your_password_here
EOF

    print_success "Redis配置文件已生成"
}

# 初始化数据库
init_database() {
    print_info "准备数据库初始化脚本..."

    cat > mysql/init/01-init.sql << EOF
-- 创建数据库和用户
CREATE DATABASE IF NOT EXISTS exam_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE exam_system;

-- 设置时区
SET time_zone = '+08:00';

-- 记录初始化时间
CREATE TABLE IF NOT EXISTS system_info (
    key_name VARCHAR(50) PRIMARY KEY,
    value_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_info (key_name, value_content)
VALUES ('db_initialized', NOW())
ON DUPLICATE KEY UPDATE value_content = NOW(), updated_at = NOW();
EOF

    print_success "数据库初始化脚本已准备"
}

# 生成监控配置
generate_monitoring_config() {
    print_info "生成监控配置..."

    # Prometheus配置
    cat > prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'exam-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql:3306']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
EOF

    print_success "监控配置已生成"
}

# 构建服务
build_services() {
    print_info "构建Docker镜像..."

    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

    print_success "镜像构建完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."

    case $ENVIRONMENT in
        "dev")
            docker-compose -f $DOCKER_COMPOSE_FILE up -d mysql redis backend nginx
            ;;
        "prod")
            docker-compose -f $DOCKER_COMPOSE_FILE --profile monitoring up -d
            ;;
        *)
            print_error "不支持的环境: $ENVIRONMENT (支持: dev, prod)"
            exit 1
            ;;
    esac

    print_success "服务启动完成"
}

# 停止服务
stop_services() {
    print_info "停止服务..."

    docker-compose -f $DOCKER_COMPOSE_FILE down

    print_success "服务已停止"
}

# 重启服务
restart_services() {
    print_info "重启服务..."

    stop_services
    sleep 5
    start_services

    print_success "服务重启完成"
}

# 查看日志
view_logs() {
    local service=${3:-""}

    if [[ -n $service ]]; then
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f $service
    else
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
    fi
}

# 查看服务状态
check_status() {
    print_info "检查服务状态..."

    echo
    docker-compose -f $DOCKER_COMPOSE_FILE ps

    echo
    print_info "健康检查状态:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo
    print_info "资源使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# 数据库操作
database_operations() {
    local operation=$1

    case $operation in
        "backup")
            print_info "备份数据库..."
            docker exec exam-mysql mysqldump -u exam_user -pexam_password_123 exam_system > backup_$(date +%Y%m%d_%H%M%S).sql
            print_success "数据库备份完成"
            ;;
        "restore")
            local backup_file=$2
            if [[ -z $backup_file ]]; then
                print_error "请指定备份文件"
                exit 1
            fi
            print_info "恢复数据库..."
            docker exec -i exam-mysql mysql -u exam_user -pexam_password_123 exam_system < $backup_file
            print_success "数据库恢复完成"
            ;;
        "init")
            print_info "初始化数据库..."
            docker exec exam-backend node src/scripts/initDatabase.js
            print_success "数据库初始化完成"
            ;;
        *)
            print_error "不支持的数据库操作: $operation (支持: backup, restore, init)"
            ;;
    esac
}

# 清理系统
cleanup() {
    print_warning "清理Docker资源..."

    docker system prune -f
    docker volume prune -f

    print_success "清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
无人机考点运营管理系统 - 部署脚本

使用方法:
  $0 [环境] [操作] [参数]

环境:
  dev     开发环境 (默认)
  prod    生产环境

操作:
  up      启动服务 (默认)
  down    停止服务
  restart 重启服务
  build   构建镜像
  logs    查看日志 [服务名]
  status  查看服务状态
  init    初始化系统
  db      数据库操作 [backup|restore|init] [文件]
  clean   清理系统资源

示例:
  $0 dev up              # 开发环境启动
  $0 prod up             # 生产环境启动
  $0 dev logs backend    # 查看后端日志
  $0 dev db backup       # 备份数据库
  $0 dev db init         # 初始化数据库
  $0 dev clean           # 清理资源

EOF
}

# 初始化系统
init_system() {
    print_info "初始化系统..."

    check_dependencies
    create_directories
    generate_env_file
    generate_mysql_config
    generate_redis_config
    generate_monitoring_config
    init_database

    print_success "系统初始化完成"
    print_info "接下来可以运行: $0 $ENVIRONMENT up"
}

# 主函数
main() {
    echo "=========================================="
    echo "  无人机考点运营管理系统 - 部署工具"
    echo "=========================================="
    echo

    case $ACTION in
        "up")
            init_system
            build_services
            start_services
            sleep 10
            check_status
            echo
            print_success "部署完成！"
            print_info "前端访问地址: http://localhost"
            print_info "后端API地址: http://localhost/api"
            [[ $ENVIRONMENT == "prod" ]] && print_info "监控地址: http://localhost:3001 (admin/admin123)"
            ;;
        "down")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "build")
            build_services
            ;;
        "logs")
            view_logs $@
            ;;
        "status")
            check_status
            ;;
        "init")
            init_system
            ;;
        "db")
            database_operations ${@:3}
            ;;
        "clean")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知操作: $ACTION"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"