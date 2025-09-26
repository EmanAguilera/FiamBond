#!/bin/sh

# This script is run when the container starts.

# 1. Run database migrations.
#    The --force flag is important for production environments.
echo "Running database migrations..."
php artisan migrate --force

# 2. Cache the configuration.
#    This reads the live environment variables from Render and creates a cache file.
echo "Caching configuration..."
php artisan config:cache

# 3. Cache the routes.
echo "Caching routes..."
php artisan route:cache

# 4. Cache the views.
echo "Caching views..."
php artisan view:cache

# 5. Start the PHP-FPM server.
#    The 'exec' command is important, it replaces the script process with the server process.
echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=10000