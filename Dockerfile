# Dockerfile for Fiambond API
# REFRESH CACHE v3 - Free Tier Compatible

# Use an official PHP 8.2 image as a base
FROM php:8.2-cli

# Install system libraries needed for Composer packages and database connection
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install the required PHP extensions (PostgreSQL and Zip)
RUN docker-php-ext-install pdo pdo_pgsql zip

# Install Composer (PHP's package manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory inside the container
WORKDIR /app

# Copy the Laravel app from the subfolder into the container's working directory
COPY ./my_fiambond_api .

# Tell Composer to run without a memory limit.
ENV COMPOSER_MEMORY_LIMIT=-1

# Run composer install.
RUN composer install --no-interaction --no-dev --prefer-dist

# Bake the configuration, route, and view caches directly into the Docker image.
# This makes your application much faster and uses the .env from Render.
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# Set the correct permissions for the storage and cache folders.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the port that Render will use to talk to your app
EXPOSE 10000

# --- START OF FINAL FIX ---
# This command runs when your container starts up.
# 1. It runs database migrations. The `--force` is needed for production.
# 2. If migrations succeed (`&&`), it starts the web server.
# This is the correct way to handle migrations on the free tier.
CMD sh -c "php artisan migrate --force && exec php artisan serve --host=0.0.0.0 --port=10000"
# --- END OF FINAL FIX ---