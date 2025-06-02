#!/bin/bash

# Alembic revision 문제 해결 스크립트

set -e
set -x

# Set the PYTHONPATH to include the parent directory of 'app'
export PYTHONPATH=$(dirname $(dirname $(realpath $0)))

echo "=== Fixing Alembic Revision Issue ==="

# Let the DB start
python app/backend_pre_start.py

echo "Current alembic status:"
alembic current || echo "Failed to get current revision"

echo "Available revisions:"
alembic history

echo "Stamping database to latest revision..."
alembic stamp head

echo "Running upgrade to ensure all migrations are applied..."
alembic upgrade head

echo "Creating initial data..."
python app/initial_data.py

echo "=== Alembic revision fix completed! ==="
