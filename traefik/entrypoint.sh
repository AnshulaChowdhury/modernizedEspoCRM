#!/bin/sh
exec traefik --entrypoints.web.address=:${PORT:-80}
