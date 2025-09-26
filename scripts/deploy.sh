#!/bin/bash

# Exam Management System Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="exam-management-system"

echo "🚀 Starting deployment for $PROJECT_NAME in $ENVIRONMENT environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Set proper permissions
chmod 755 logs uploads backups

# Generate production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "🔧 Generating production environment file..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3000

# Database Configuration (MySQL)
DB_HOST=db
DB_PORT=3306
DB_NAME=exam_management
DB_USER=exam_user
DB_PASSWORD=exam_password_$(date +%s)

# JWT Configuration
JWT_SECRET=exam_management_jwt_secret_production_$(date +%s)
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Redis Configuration (Optional)
REDIS_HOST=redis
REDIS_PORT=6379
EOF
    echo "✅ Environment file created. Please review .env.production"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose exec -T db mysqladmin ping -h"localhost" --silent && [ $timeout -gt 0 ]; do
    echo "Waiting for database... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "❌ Database failed to start within 60 seconds"
    docker-compose logs db
    exit 1
fi

# Run database initialization
echo "🗄️ Initializing database..."
docker-compose exec -T app node backend/src/scripts/initDatabase.js

# Run health checks
echo "🏥 Running health checks..."
sleep 10

# Check app health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    docker-compose logs app
    exit 1
fi

# Check database connection
if docker-compose exec -T db mysqladmin ping -h"localhost" --silent; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    docker-compose logs db
    exit 1
fi

# Display service status
echo "📊 Service Status:"
docker-compose ps

# Display access information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "  Web Application: http://localhost"
echo "  API Health Check: http://localhost/health"
echo "  Direct API: http://localhost/api"
echo ""
echo "📚 Management Commands:"
echo "  View logs: docker-compose logs -f [service]"
echo "  Restart: docker-compose restart [service]"
echo "  Stop all: docker-compose down"
echo "  Update: ./deploy.sh $ENVIRONMENT"
echo ""
echo "🔐 Default Admin Login:"
echo "  Username: admin"
echo "  Password: admin123456"
echo "  URL: http://localhost"
echo ""

# Create backup script
if [ ! -f scripts/backup.sh ]; then
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Database backup script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="exam_management_backup_$DATE.sql"

echo "Creating database backup..."
docker-compose exec -T db mysqldump -u exam_user -p exam_management > "$BACKUP_DIR/$BACKUP_FILE"
echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 backups
ls -t $BACKUP_DIR/exam_management_backup_*.sql | tail -n +8 | xargs -r rm
echo "Old backups cleaned up"
EOF
    chmod +x scripts/backup.sh
    echo "📦 Backup script created at scripts/backup.sh"
fi

echo "✅ Deployment process completed!"