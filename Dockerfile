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

# FIX: Copy the entire application code FIRST.
# This ensures the 'artisan' file is present before composer runs its scripts.
COPY ./my_cointrak_api .

# Tell Composer to run without a memory limit.
ENV COMPOSER_MEMORY_LIMIT=-1

# FIX: NOW run composer install.
# The post-install scripts (like 'artisan config:clear') will now work.
RUN composer install --no-interaction --no-dev --prefer-dist

# Set the correct permissions for the storage and cache folders.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the port that Render will use to talk to your app
EXPOSE 10000

# The final command to run your application
CMD php artisan serve --host=0.0.0.0 --port=10000