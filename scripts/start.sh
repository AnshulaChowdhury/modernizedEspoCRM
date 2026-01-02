#!/bin/bash
# modernizedEspoCRM Development Start Script
# Starts all services with Traefik reverse proxy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "Starting modernizedEspoCRM development environment..."
echo "=================================================="
echo ""
echo "Services will be available at:"
echo "  - React Frontend: http://localhost/"
echo "  - Classic (Backbone): http://localhost/classic/"
echo "  - Traefik Dashboard: http://localhost:8080/"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start all services
docker-compose up --build "$@"
