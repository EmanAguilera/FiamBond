# Dockerfile for Fiambond API
# FINAL, DEFINITIVE VERSION - Correct Caching Strategy

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

# --- START OF FINAL FIX ---
# The 'optimize:clear' command is a powerful tool that removes all cached
# config, routes, views, and more. This forces a clean slate.
RUN php artisan optimize:clear
# --- END OF FINAL FIX ---

# Now, build the final, optimized production caches.
# The 'optimize' command correctly caches config and routes for production.
RUN php artisan optimize
RUN php artisan view:cache

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Copy the simplified startup script
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 10000

# The startup command is our script.
CMD ["./start.sh"]