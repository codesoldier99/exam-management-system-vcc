@echo off
chcp 65001 >nul
echo ====================================
echo 无人机考点运营管理系统 - 项目初始化
echo ====================================
echo.

REM 创建主目录结构
echo 创建主目录结构...
mkdir backend 2>nul
mkdir frontend 2>nul
mkdir miniprogram 2>nul
mkdir docker 2>nul
mkdir docs 2>nul
mkdir scripts 2>nul

REM 创建后端目录结构
echo 创建后端目录结构...
mkdir backend\src 2>nul
mkdir backend\src\controllers 2>nul
mkdir backend\src\models 2>nul
mkdir backend\src\routes 2>nul
mkdir backend\src\middleware 2>nul
mkdir backend\src\services 2>nul
mkdir backend\src\utils 2>nul
mkdir backend\src\config 2>nul
mkdir backend\tests 2>nul
mkdir backend\logs 2>nul

REM 创建前端目录结构
echo 创建前端目录结构...
mkdir frontend\src 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\views 2>nul
mkdir frontend\src\router 2>nul
mkdir frontend\src\store 2>nul
mkdir frontend\src\api 2>nul
mkdir frontend\src\utils 2>nul
mkdir frontend\src\assets 2>nul
mkdir frontend\src\assets\images 2>nul
mkdir frontend\src\assets\styles 2>nul
mkdir frontend\public 2>nul
mkdir frontend\dist 2>nul

REM 创建小程序目录结构
echo 创建小程序目录结构...
mkdir miniprogram\pages 2>nul
mkdir miniprogram\pages\index 2>nul
mkdir miniprogram\pages\exam 2>nul
mkdir miniprogram\pages\profile 2>nul
mkdir miniprogram\components 2>nul
mkdir miniprogram\utils 2>nul
mkdir miniprogram\api 2>nul
mkdir miniprogram\assets 2>nul
mkdir miniprogram\assets\images 2>nul

REM 创建数据库脚本目录
echo 创建数据库目录...
mkdir database 2>nul
mkdir database\migrations 2>nul
mkdir database\seeds 2>nul

echo.
echo 项目目录结构创建完成！
echo.
echo 接下来初始化各个子项目...
echo.

REM 初始化后端项目
echo [1/3] 初始化后端项目...
cd backend
call npm init -y
call npm install express mysql2 sequelize cors helmet morgan bcryptjs jsonwebtoken dotenv multer moment axios
call npm install -D nodemon jest supertest eslint
cd ..

REM 初始化前端项目
echo [2/3] 初始化前端项目...
cd frontend
call npm init -y
call npm install vue@next @vitejs/plugin-vue vite element-plus @element-plus/icons-vue axios pinia vue-router@4
call npm install -D @types/node
cd ..

echo [3/3] 创建配置文件...

echo.
echo ====================================
echo 项目初始化完成！
echo ====================================
echo.
echo 项目结构：
echo   backend/     - Node.js + Express 后端
echo   frontend/    - Vue 3 + Element Plus 前端
echo   miniprogram/ - 微信小程序
echo   docker/      - Docker 配置文件
echo   database/    - 数据库脚本
echo   docs/        - 项目文档
echo.
echo 下一步：
echo   1. 配置数据库连接（backend/.env）
echo   2. 启动后端：cd backend && npm run dev
echo   3. 启动前端：cd frontend && npm run dev
echo.
pause