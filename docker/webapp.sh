#!/bin/sh

echo "Waiting for mysql"
/wait || exit 111

echo "Running migrations"
npx prisma migrate dev

echo "Starting webapp"
exec node src/index.js
