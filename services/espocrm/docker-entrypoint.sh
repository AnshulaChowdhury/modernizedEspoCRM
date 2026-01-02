#!/bin/sh
set -e

echo "=========================================="
echo "EspoCRM Docker Entrypoint Starting..."
echo "=========================================="

# Fix Apache MPM conflict at runtime
# Railway/Heroku may inject Apache configs at container start
echo "=== Fixing Apache MPM configuration at runtime ==="

# Check for any injected MPM configs
echo "Checking for LoadModule mpm directives:"
grep -r "LoadModule mpm" /etc/apache2/ 2>/dev/null || echo "No extra LoadModule mpm found"

# Disable ALL MPMs first, then enable only prefork
a2dismod mpm_event mpm_worker mpm_prefork 2>/dev/null || true
rm -f /etc/apache2/mods-enabled/mpm_*.conf /etc/apache2/mods-enabled/mpm_*.load 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true

echo "MPM modules after fix:"
ls -la /etc/apache2/mods-enabled/mpm* 2>/dev/null || echo "No MPM modules found"

# Test Apache configuration before starting
echo "Testing Apache configuration..."
if ! apache2ctl configtest 2>&1; then
    echo "ERROR: Apache configuration test failed!"
    echo "Dumping all loaded modules:"
    grep -r "LoadModule" /etc/apache2/mods-enabled/ 2>/dev/null || true
    exit 1
fi
echo "Apache configuration OK"

# Configure Apache to listen on Railway's PORT if set
if [ -n "$PORT" ]; then
    echo "Configuring Apache to listen on PORT $PORT"
    sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/*.conf
fi

# Create required directories
mkdir -p data/cache data/logs data/upload data/export

# Set permissions
chown -R www-data:www-data data custom client/custom 2>/dev/null || true

# Install composer dependencies if vendor directory is missing
if [ ! -f "vendor/autoload.php" ]; then
    echo "Installing composer dependencies..."
    composer install --no-interaction --prefer-dist
fi

# Auto-configure database from environment variables
# Supports Railway (PGHOST), docker-compose (ESPOCRM_DATABASE_HOST), and POSTGRES_* formats
if [ -n "$PGHOST" ] || [ -n "$ESPOCRM_DATABASE_HOST" ] || [ -n "$POSTGRES_HOST" ]; then
    DB_HOST="${ESPOCRM_DATABASE_HOST:-${PGHOST:-$POSTGRES_HOST}}"
    DB_PORT="${ESPOCRM_DATABASE_PORT:-${PGPORT:-${POSTGRES_PORT:-5432}}}"
    DB_NAME="${ESPOCRM_DATABASE_NAME:-${PGDATABASE:-${POSTGRES_DB:-espocrm}}}"
    DB_USER="${ESPOCRM_DATABASE_USER:-${PGUSER:-${POSTGRES_USER:-espocrm}}}"
    DB_PASSWORD="${ESPOCRM_DATABASE_PASSWORD:-${PGPASSWORD:-$POSTGRES_PASSWORD}}"
    DB_PLATFORM="${ESPOCRM_DATABASE_PLATFORM:-Postgresql}"

    echo "Configuring database connection..."
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Platform: $DB_PLATFORM"

    # Determine charset based on platform (utf8mb4 for MySQL, UTF8 for PostgreSQL)
    if [ "$DB_PLATFORM" = "Postgresql" ]; then
        DB_CHARSET="UTF8"
    else
        DB_CHARSET="utf8mb4"
    fi

    # Create config-internal.php with database settings
    cat > data/config-internal.php << EOFCONFIG
<?php
return [
  'database' => [
    'host' => '${DB_HOST}',
    'port' => '${DB_PORT}',
    'charset' => '${DB_CHARSET}',
    'dbname' => '${DB_NAME}',
    'user' => '${DB_USER}',
    'password' => '${DB_PASSWORD}',
    'platform' => '${DB_PLATFORM}'
  ],
  'smtpPassword' => null,
  'logger' => [
    'path' => 'data/logs/espo.log',
    'level' => 'WARNING',
    'rotation' => true,
    'maxFileNumber' => 30,
    'printTrace' => false
  ],
  'restrictedMode' => false,
  'isInstalled' => true
];
EOFCONFIG

    # Create base config.php if it doesn't exist or is incomplete
    if [ ! -f "data/config.php" ] || ! grep -q "siteUrl" data/config.php 2>/dev/null; then
        SITE_URL="${ESPOCRM_SITE_URL:-http://localhost:8080}"
        echo "Creating base config with siteUrl: $SITE_URL"

        cat > data/config.php << EOFMAIN
<?php
return [
  'useCache' => true,
  'jobRunInParallel' => false,
  'recordsPerPage' => 20,
  'applicationName' => 'EspoCRM',
  'timeZone' => 'UTC',
  'dateFormat' => 'MM/DD/YYYY',
  'timeFormat' => 'HH:mm',
  'weekStart' => 0,
  'thousandSeparator' => ',',
  'decimalMark' => '.',
  'currencyList' => ['USD'],
  'defaultCurrency' => 'USD',
  'baseCurrency' => 'USD',
  'language' => 'en_US',
  'authenticationMethod' => 'Espo',
  'siteUrl' => '${SITE_URL}',
  'theme' => 'Espo',
  'themeParams' => (object)['navbar' => 'side'],
  'clientXFrameOptionsHeaderDisabled' => true,
  'clientCspScriptSourceList' => ['https://www.google.com', 'https://www.gstatic.com', 'https://www.recaptcha.net']
];
EOFMAIN
    fi

    # Enable iframe embedding if not already set
    if [ -f "data/config.php" ] && ! grep -q "clientXFrameOptionsHeaderDisabled" data/config.php 2>/dev/null; then
        echo "Enabling iframe embedding in existing config..."
        sed -i "s/];/  'clientXFrameOptionsHeaderDisabled' => true,\n];/" data/config.php
    fi

    # Add Google reCAPTCHA CSP if not already set
    if [ -f "data/config.php" ] && ! grep -q "clientCspScriptSourceList" data/config.php 2>/dev/null; then
        echo "Adding Google scripts to CSP..."
        sed -i "s/];/  'clientCspScriptSourceList' => ['https:\/\/www.google.com', 'https:\/\/www.gstatic.com', 'https:\/\/www.recaptcha.net'],\n];/" data/config.php
    fi

    # Run database setup if admin credentials provided and tables don't exist
    if [ -n "$ESPOCRM_ADMIN_USERNAME" ] && [ -n "$ESPOCRM_ADMIN_PASSWORD" ]; then
        echo "Checking if database needs initialization..."

        # Try to run rebuild (will create tables if needed)
        php command.php rebuild 2>/dev/null || {
            echo "Running initial setup..."
            php command.php install \
                --adminUsername="$ESPOCRM_ADMIN_USERNAME" \
                --adminPassword="$ESPOCRM_ADMIN_PASSWORD" \
                2>/dev/null || echo "Setup may have already been completed."
        }

        # Create or reset admin user if requested
        if [ "$ESPOCRM_RESET_ADMIN_PASSWORD" = "true" ]; then
            echo "Creating/resetting admin user: $ESPOCRM_ADMIN_USERNAME"
            php -r "
                \$host = '${DB_HOST}';
                \$port = '${DB_PORT}';
                \$dbname = '${DB_NAME}';
                \$user = '${DB_USER}';
                \$pass = '${DB_PASSWORD}';
                \$adminUser = '${ESPOCRM_ADMIN_USERNAME}';
                \$adminPass = '${ESPOCRM_ADMIN_PASSWORD}';

                try {
                    \$pdo = new PDO(\"pgsql:host=\$host;port=\$port;dbname=\$dbname\", \$user, \$pass);
                    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                    // EspoCRM uses PASSWORD_BCRYPT
                    \$passwordHash = password_hash(\$adminPass, PASSWORD_BCRYPT);

                    // Check if user exists
                    \$stmt = \$pdo->prepare('SELECT id FROM \"user\" WHERE user_name = :username');
                    \$stmt->execute(['username' => \$adminUser]);
                    \$existing = \$stmt->fetch();

                    if (\$existing) {
                        // Update existing user's password
                        \$stmt = \$pdo->prepare('UPDATE \"user\" SET password = :password WHERE user_name = :username');
                        \$stmt->execute(['password' => \$passwordHash, 'username' => \$adminUser]);
                        echo \"Password updated for existing user \$adminUser\n\";
                    } else {
                        // Create new admin user (EspoCRM uses 17-char IDs)
                        \$id = substr(bin2hex(random_bytes(12)), 0, 17);
                        \$sql = 'INSERT INTO \"user\" (id, user_name, password, type, is_active, first_name, deleted, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                        \$stmt = \$pdo->prepare(\$sql);
                        \$stmt->execute([
                            \$id,
                            \$adminUser,
                            \$passwordHash,
                            'admin',
                            't',
                            'Admin',
                            'f',
                            date('Y-m-d H:i:s')
                        ]);
                        echo \"Created new admin user: \$adminUser\n\";
                    }
                } catch (Exception \$e) {
                    echo \"Admin user setup failed: \" . \$e->getMessage() . \"\n\";
                }
            " 2>&1
        fi
    fi

    chown -R www-data:www-data data 2>/dev/null || true
fi

# Patch config.php for iframe and reCAPTCHA support (runs regardless of database config)
if [ -f "data/config.php" ]; then
    if ! grep -q "clientXFrameOptionsHeaderDisabled" data/config.php 2>/dev/null; then
        echo "Enabling iframe embedding in config..."
        sed -i "s/];/  'clientXFrameOptionsHeaderDisabled' => true,\n];/" data/config.php
    fi
    if ! grep -q "clientCspScriptSourceList" data/config.php 2>/dev/null; then
        echo "Adding Google reCAPTCHA to CSP..."
        sed -i "s/];/  'clientCspScriptSourceList' => ['https:\/\/www.google.com', 'https:\/\/www.gstatic.com', 'https:\/\/www.recaptcha.net'],\n];/" data/config.php
    fi
fi

# Execute the main command
exec "$@"
