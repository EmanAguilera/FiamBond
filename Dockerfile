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

# Copy the composer files from your local machine to the container
COPY my_cointrak_api/composer.json my_cointrak_api/composer.lock ./

# Tell Composer to run without a memory limit.
ENV COMPOSER_MEMORY_LIMIT=-1

# Install your project's PHP dependencies
RUN composer install --no-interaction --no-dev --prefer-dist

# Copy the rest of your Laravel application code into the container
COPY ./my_cointrak_api .

# Set the correct permissions for the storage and cache folders.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the port that Render will use to talk to your app
EXPOSE 10000

# The final command to run your application
CMD php artisan serve --host=0.0.0.0 --port=10000