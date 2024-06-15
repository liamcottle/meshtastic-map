#!/bin/sh

echo "Running migrations"
npx prisma migrate dev

echo "Starting map ui"
exec node src/index.js ${MAP_OPTS}
