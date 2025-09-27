# Dockerfile for Fiambond API
# FINAL, DEFINITIVE VERSION - Build Only

FROM php:8.2-cli

# Install dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_pgsql zip
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY ./my_fiambond_api .

# Install composer dependencies
RUN composer install --no-interaction --no-dev --prefer-dist

# Copy the startup script and make it executable
COPY start.sh .
RUN chmod +x start.sh

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 10000

# The startup command is our powerful script.
CMD ["./start.sh"]