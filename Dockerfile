# Dockerfile for Fiambond API
# REFRESH CACHE v4 - Fix Autoloader Conflict

# Use an official PHP 8.2 image as a base
FROM php:8.2-cli

# Install system libraries
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install the required PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /app

# --- START OF FIX ---
# This new multi-step copy process leverages Docker's layer caching.
# If your composer dependencies don't change, Docker won't need to re-install them every time.

# 1. Copy only the dependency definition files
COPY ./my_fiambond_api/composer.json ./my_fiambond_api/composer.lock ./

# 2. Install dependencies
RUN composer install --no-interaction --no-dev --prefer-dist

# 3. Copy the rest of the application code
COPY ./my_fiambond_api .

# 4. CRUCIAL FIX: Optimize the autoloader.
# This command generates a "class map" which is the definitive list of where
# classes are. This will resolve the "class already in use" error and also
# make your application faster in production.
RUN composer dump-autoload --optimize
# --- END OF FIX ---

# Bake the configuration, route, and view caches into the image.
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# Set the correct permissions for storage and cache.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the application port
EXPOSE 10000

# Start the server (includes running migrations on startup for the free tier)
CMD sh -c "php artisan migrate --force && exec php artisan serve --host=0.0.0.0 --port=10000"