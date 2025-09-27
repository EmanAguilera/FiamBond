#!/bin/sh

# This script now ONLY runs tasks that need the live database.

# 1. Run database migrations.
echo "Running database migrations..."
php artisan migrate --force

# 2. Start the server.
echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=10000