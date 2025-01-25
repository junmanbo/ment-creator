#! /usr/bin/env bash

set -e
set -x

# Set the PYTHONPATH to include the parent directory of 'app'
export PYTHONPATH=$(dirname $(dirname $(realpath $0)))

# Let the DB start
python app/backend_pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py
