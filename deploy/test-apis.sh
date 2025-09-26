#!/bin/bash

# API接口测试脚本
# Usage: ./test-apis.sh [base_url]

set -e

# 配置
BASE_URL=${1:-"http://localhost/api"}
TOKEN=""
CANDIDATE_TOKEN=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# HTTP请求函数
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=""

    if [[ -n $TOKEN ]]; then
        auth_header="-H Authorization: Bearer $TOKEN"
    fi

    echo "请求: $method $BASE_URL$endpoint"

    if [[ $method == "GET" ]]; then
        response=$(curl -s -w "\n%{http_code}" $auth_header "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" $auth_header -d "$data" "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    echo "状态码: $http_code"
    echo "响应: $body" | jq '.' 2>/dev/null || echo "$body"
    echo "----------------------------------------"

    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        return 0
    else
        return 1
    fi
}

# 健康检查
test_health() {
    print_info "测试健康检查接口..."

    if make_request "GET" "/health"; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败"
        return 1
    fi
}

# 管理员登录
test_admin_login() {
    print_info "测试管理员登录..."

    local login_data='{
        "username": "admin",
        "password": "123456"
    }'

    if response=$(make_request "POST" "/auth/login" "$login_data"); then
        TOKEN=$(echo "$response" | head -n -1 | jq -r '.data.token' 2>/dev/null || echo "")
        if [[ -n $TOKEN && $TOKEN != "null" ]]; then
            print_success "管理员登录成功，Token已获取"
        else
            print_warning "登录响应格式异常"
        fi
    else
        print_error "管理员登录失败"
        return 1
    fi
}

# 考生登录测试
test_candidate_login() {
    print_info "测试考生登录..."

    local login_data='{
        "id_number": "110101199001011234",
        "phone": "13800138001"
    }'

    if response=$(make_request "POST" "/miniapp/candidate/login" "$login_data"); then
        CANDIDATE_TOKEN=$(echo "$response" | head -n -1 | jq -r '.data.token' 2>/dev/null || echo "")
        if [[ -n $CANDIDATE_TOKEN && $CANDIDATE_TOKEN != "null" ]]; then
            print_success "考生登录成功，Token已获取"
        else
            print_warning "考生登录响应格式异常"
        fi
    else
        print_warning "考生登录失败（可能因为测试数据不存在）"
    fi
}

# 测试用户管理接口
test_user_management() {
    print_info "测试用户管理接口..."

    # 获取当前用户信息
    print_info "获取当前用户信息..."
    if make_request "GET" "/auth/me"; then
        print_success "获取用户信息成功"
    else
        print_error "获取用户信息失败"
    fi
}

# 测试考生管理接口
test_candidate_management() {
    print_info "测试考生管理接口..."

    # 获取考生列表
    print_info "获取考生列表..."
    if make_request "GET" "/candidates?page=1&limit=10"; then
        print_success "获取考生列表成功"
    else
        print_error "获取考生列表失败"
    fi

    # 获取考生统计
    print_info "获取考生统计..."
    if make_request "GET" "/candidates/stats"; then
        print_success "获取考生统计成功"
    else
        print_error "获取考生统计失败"
    fi

    # 创建测试考生
    print_info "创建测试考生..."
    local candidate_data='{
        "name": "测试考生",
        "id_number": "110101199001011234",
        "phone": "13800138001",
        "email": "test@example.com",
        "gender": "male",
        "institution_id": 1
    }'

    if make_request "POST" "/candidates" "$candidate_data"; then
        print_success "创建考生成功"
    else
        print_warning "创建考生失败（可能因为数据已存在）"
    fi
}

# 测试排期管理接口
test_schedule_management() {
    print_info "测试排期管理接口..."

    # 获取排期列表
    print_info "获取排期列表..."
    if make_request "GET" "/schedules?page=1&limit=10"; then
        print_success "获取排期列表成功"
    else
        print_error "获取排期列表失败"
    fi

    # 获取排期统计
    print_info "获取排期统计..."
    if make_request "GET" "/schedules/stats"; then
        print_success "获取排期统计成功"
    else
        print_error "获取排期统计失败"
    fi
}

# 测试小程序接口
test_miniapp_apis() {
    print_info "测试小程序接口..."

    # 获取公共看板
    print_info "获取公共考场看板..."
    if make_request "GET" "/miniapp/public/board"; then
        print_success "获取公共看板成功"
    else
        print_error "获取公共看板失败"
    fi

    # 如果考生token存在，测试考生专用接口
    if [[ -n $CANDIDATE_TOKEN ]]; then
        local old_token=$TOKEN
        TOKEN=$CANDIDATE_TOKEN

        print_info "测试考生个人信息接口..."
        if make_request "GET" "/miniapp/candidate/profile"; then
            print_success "获取考生个人信息成功"
        else
            print_error "获取考生个人信息失败"
        fi

        print_info "测试生成二维码接口..."
        if make_request "GET" "/miniapp/candidate/qrcode"; then
            print_success "生成考生二维码成功"
        else
            print_error "生成考生二维码失败"
        fi

        print_info "测试今日日程接口..."
        if make_request "GET" "/miniapp/candidate/today-schedules"; then
            print_success "获取今日日程成功"
        else
            print_error "获取今日日程失败"
        fi

        TOKEN=$old_token
    fi
}

# 测试文件上传
test_file_upload() {
    print_info "测试文件上传接口..."

    # 创建测试Excel文件
    local test_file="/tmp/test_candidates.xlsx"
    print_info "创建测试Excel文件: $test_file"

    # 这里应该创建一个真实的Excel文件，暂时跳过
    print_warning "文件上传测试跳过（需要实际Excel文件）"
}

# 性能测试
test_performance() {
    print_info "基础性能测试..."

    print_info "测试健康检查接口响应时间..."
    for i in {1..10}; do
        start_time=$(date +%s%N)
        make_request "GET" "/health" > /dev/null 2>&1
        end_time=$(date +%s%N)
        duration=$(( (end_time - start_time) / 1000000 ))
        echo "请求 $i: ${duration}ms"
    done
}

# 错误处理测试
test_error_handling() {
    print_info "测试错误处理..."

    # 测试404
    print_info "测试404错误..."
    make_request "GET" "/not-exist" || print_success "404错误处理正常"

    # 测试401
    print_info "测试401错误..."
    local old_token=$TOKEN
    TOKEN="invalid-token"
    make_request "GET" "/auth/me" || print_success "401错误处理正常"
    TOKEN=$old_token

    # 测试400 (参数错误)
    print_info "测试400错误..."
    make_request "POST" "/auth/login" '{"invalid": "data"}' || print_success "400错误处理正常"
}

# 完整性测试
test_integration() {
    print_info "集成测试..."

    # 创建考生 -> 创建排期 -> 签到 -> 完成考试
    print_info "测试完整业务流程..."

    # 由于需要复杂的数据依赖，这里暂时跳过
    print_warning "集成测试跳过（需要完整的测试数据）"
}

# 主函数
main() {
    echo "=========================================="
    echo "    API接口测试工具"
    echo "=========================================="
    echo "测试目标: $BASE_URL"
    echo

    # 检查依赖
    if ! command -v curl &> /dev/null; then
        print_error "curl 未安装"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，JSON响应可能不会格式化显示"
    fi

    # 执行测试
    local failed_tests=0

    # 基础测试
    test_health || ((failed_tests++))
    test_admin_login || ((failed_tests++))
    test_candidate_login || ((failed_tests++))

    # 功能测试
    if [[ -n $TOKEN ]]; then
        test_user_management || ((failed_tests++))
        test_candidate_management || ((failed_tests++))
        test_schedule_management || ((failed_tests++))
    else
        print_error "未能获取管理员Token，跳过需要认证的测试"
        ((failed_tests++))
    fi

    # 小程序接口测试
    test_miniapp_apis || ((failed_tests++))

    # 其他测试
    test_error_handling || ((failed_tests++))
    test_performance || ((failed_tests++))
    test_integration || ((failed_tests++))

    echo
    echo "=========================================="
    if [[ $failed_tests -eq 0 ]]; then
        print_success "所有测试通过！"
    else
        print_warning "$failed_tests 个测试失败或跳过"
    fi
    echo "=========================================="

    exit $failed_tests
}

# 执行主函数
main "$@"