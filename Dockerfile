# Dockerfile for Fiambond API
# FINAL VERSION - Using Startup Script

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

# Copy the entire Laravel application into the container.
COPY ./my_fiambond_api .

# Run composer install to get all the dependencies.
RUN composer install --no-interaction --no-dev --prefer-dist

# --- START OF FINAL FIX ---
# Copy the new startup script into the container.
COPY start.sh .

# Make the startup script executable.
RUN chmod +x start.sh
# --- END OF FINAL FIX ---

# Set the correct permissions for storage and cache.
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the application port
EXPOSE 10000

# Set the startup command to our new script.
CMD ["./start.sh"]