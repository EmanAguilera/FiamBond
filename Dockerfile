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

# CORRECTED: Copy the entire application code from the build context.
# Because Render's root directory is set to 'my_cointrak_api',
# we just need to copy the current directory ('.').
COPY . .

# Tell Composer to run without a memory limit.
ENV COMPOSER_MEMORY_LIMIT=-1

# Run composer install.
RUN composer install --no-interaction --no-dev --prefer-dist

# Set the correct permissions for the storage and cache folders.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the port that Render will use to talk to your app
EXPOSE 10000

# THE FIX: This command now runs migrations first, then starts the server.
# The 'exec' command ensures the server runs as the main process.
CMD sh -c "php artisan migrate --force && exec php artisan serve --host=0.0.0.0 --port=10000"