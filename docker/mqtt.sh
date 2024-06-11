#!/bin/sh

echo "Waiting for mysql"
/wait || exit 111

echo "Running migrations"
npx prisma migrate dev

echo "Starting mqtt listener"
exec node src/mqtt.js ${MESHMAP_MQTT_OPTS}
