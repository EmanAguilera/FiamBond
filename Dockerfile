# Dockerfile for Fiambond API
# REFRESH CACHE v5 - Correct Order of Operations

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
# 1. Copy the ENTIRE Laravel application into the container first.
# This ensures that the 'artisan' file is present before composer needs it.
COPY ./my_fiambond_api .

# 2. Now, run composer install.
# Any post-install scripts in composer.json (like 'artisan config:clear') will now work correctly.
RUN composer install --no-interaction --no-dev --prefer-dist
# --- END OF FIX ---

# Bake the final production caches into the image for speed and reliability.
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# Set the correct permissions for storage and cache.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the application port
EXPOSE 10000

# Start the server (includes running migrations on startup for the free tier)
CMD sh -c "php artisan migrate --force && exec php artisan serve --host=0.0.0.0 --port=10000"