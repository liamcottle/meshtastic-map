# pull changes from git
git fetch && git pull

# update node deps
npm install

# migrate database
npx --yes prisma migrate deploy
npx --yes prisma generate

# restart services
service meshtastic-map restart
service meshtastic-map-mqtt restart
