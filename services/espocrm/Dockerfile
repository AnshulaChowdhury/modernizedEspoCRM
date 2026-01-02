FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libonig-dev \
    libldap2-dev \
    libzmq3-dev \
    libpq-dev \
    unzip \
    git \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        zip \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        xml \
        dom \
        curl \
        exif \
        ctype \
        bcmath \
        opcache

# Install LDAP extension
RUN docker-php-ext-configure ldap --with-libdir=lib/$(uname -m)-linux-gnu/ \
    && docker-php-ext-install ldap

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js 20.x for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Apache MPM configuration - ensure ONLY prefork is enabled
# Railway/Heroku can inject configs, so we need to be thorough
RUN set -eux; \
    echo "=== Checking ALL Apache MPM configurations ===" && \
    # Show what's currently enabled
    ls -la /etc/apache2/mods-enabled/mpm* || true && \
    # Check for any LoadModule mpm in config files
    grep -r "LoadModule mpm" /etc/apache2/ 2>/dev/null || true && \
    # Disable ALL MPMs first
    a2dismod mpm_event mpm_worker mpm_prefork 2>/dev/null || true && \
    # Remove any leftover symlinks
    rm -f /etc/apache2/mods-enabled/mpm_*.conf /etc/apache2/mods-enabled/mpm_*.load && \
    # Enable ONLY prefork
    a2enmod mpm_prefork && \
    # Enable other required modules
    a2enmod rewrite headers && \
    # Verify final state
    echo "=== Final MPM state ===" && \
    ls -la /etc/apache2/mods-enabled/mpm* && \
    # Test Apache config
    apache2ctl configtest

# Configure Apache - keep document root at project root, .htaccess handles routing
# Update the default site config to ensure AllowOverride All is set
# Allow iframe embedding for lead capture forms
RUN sed -ri -e 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
    && echo '<Directory /var/www/html>\n\
    Options FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n\
# Allow iframe embedding - CSP is handled by PHP with proper script-src for reCAPTCHA\n\
<IfModule mod_headers.c>\n\
    Header unset X-Frame-Options\n\
</IfModule>' > /etc/apache2/conf-available/espocrm.conf \
    && a2enconf espocrm

ENV APACHE_DOCUMENT_ROOT=/var/www/html

# PHP configuration for production
RUN echo "memory_limit = 512M\n\
upload_max_filesize = 50M\n\
post_max_size = 50M\n\
max_execution_time = 180\n\
max_input_time = 180\n\
display_errors = Off\n\
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT\n\
log_errors = On\n\
opcache.enable = 1\n\
opcache.memory_consumption = 256\n\
opcache.max_accelerated_files = 20000" > /usr/local/etc/php/conf.d/espocrm.ini

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install PHP dependencies (allow running as root in Docker)
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

# Install Node dependencies and build frontend (skip composer in grunt)
RUN npm ci && npm run build-frontend

# Copy entrypoint script to proper location and set permissions
RUN cp docker-entrypoint.sh /usr/local/bin/ && chmod +x /usr/local/bin/docker-entrypoint.sh

# Create required directories and set permissions
RUN mkdir -p data/cache data/logs data/upload data/export \
    && chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80

# Use CMD with shell form to ensure our script runs
# Some platforms (Railway/Heroku) may bypass ENTRYPOINT
CMD ["/usr/local/bin/docker-entrypoint.sh", "apache2-foreground"]
