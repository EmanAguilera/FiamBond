#!/bin/sh

# This script runs when the container starts and has access to the database.

# 1. Clear any old cached files to start fresh.
echo "Clearing caches..."
php artisan optimize:clear

# 2. Run database migrations.
echo "Running database migrations..."
php artisan migrate --force

# 3. Build the final, optimized production caches.
#    This command caches the config and routes.
echo "Caching configuration and routes..."
php artisan optimize

# 4. Cache the views.
echo "Caching views..."
php artisan view:cache

# 5. Start the server.
echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=10000