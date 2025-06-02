#!/bin/bash

# 데이터베이스 재설정 스크립트

set -e
set -x

# Set the PYTHONPATH to include the parent directory of 'app'
export PYTHONPATH=$(dirname $(dirname $(realpath $0)))

echo "=== Resetting Database ==="

# PostgreSQL 접속 정보 설정 (환경변수에서 가져오거나 기본값 사용)
DB_HOST="${POSTGRES_SERVER:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-chchdelm3}"
DB_PASSWORD="${POSTGRES_PASSWORD:-XSkpS63oZ86W}"
DB_NAME="${POSTGRES_DB:-app}"

echo "Dropping database if exists..."
PGPASSWORD=$DB_PASSWORD docker exec db /usr/bin/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Creating new database..."
PGPASSWORD=$DB_PASSWORD docker exec db /usr/bin/psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "Database reset completed!"

echo "=== Starting Application Setup ==="

# Let the DB start
python app/backend_pre_start.py

# Run migrations from scratch
alembic upgrade head

# Create initial data in DB
python app/initial_data.py

echo "=== Application setup completed! ==="
