<h2 align="center">Meshtastic Map</h2>

<p align="center">
<a href="https://discord.gg/K55zeZyHKK"><img src="https://img.shields.io/badge/Discord-Liam%20Cottle's%20Discord-%237289DA?style=flat&logo=discord" alt="discord"/></a>
<a href="https://twitter.com/liamcottle"><img src="https://img.shields.io/badge/Twitter-@liamcottle-%231DA1F2?style=flat&logo=twitter" alt="twitter"/></a>
<br/>
<a href="https://ko-fi.com/liamcottle"><img src="https://img.shields.io/badge/Donate%20a%20Coffee-liamcottle-yellow?style=flat&logo=buy-me-a-coffee" alt="donate on ko-fi"/></a>
<a href="./donate.md"><img src="https://img.shields.io/badge/Donate%20Bitcoin-3FPBfiEwioWHFix3kZqe5bdU9F5o8mG8dh-%23FF9900?style=flat&logo=bitcoin" alt="donate bitcoin"/></a>
</p>

A map of all Meshtastic nodes heard via MQTT.

<img src="./screenshot.png">

## How does it work?

- An [mqtt client](./src/mqtt.js) is persistently connected to `mqtt.meshtastic.org` and subscribed to the `#` topic.
- All messages received are attempted to be decoded as [ServiceEnvelope](https://buf.build/meshtastic/protobufs/docs/main:meshtastic#meshtastic.ServiceEnvelope) packets.
- If a packet is encrypted, it attempts to decrypt it with the default `AQ==` key.
- If a packet can't be decoded as a `ServiceEnvelope`, it is ignored.
- `NODEINFO_APP` packets add a node to the database.
- `POSITION_APP` packets update the position of a node in the database.
- `NEIGHBORINFO_APP` packets log neighbours heard by a node to the database.
- `TELEMETRY_APP` packets update battery and voltage metrics for a node in the database.
- `TRACEROUTE_APP` packets log all trace routes performed by a node to the database.
- `MAP_REPORT_APP` packets are stored in the database, but are not widely adopted, so are not used yet.
- The database is a MySQL server, and a nodejs express server is running an API to serve data to the map interface.

## Features

- [x] Connects to mqtt.meshtastic.org to collect nodes and metrics.
- [x] Shows nodes on the map if they have reported a valid position.
- [x] Hover over nodes on the map to see basic information and a preview image.
- [x] Click nodes on the map to show a sidebar with more info such as graphs of historical telemetry.
- [x] Ability to share a direct link to a node. The map will auto navigate to it.
- [x] Ability to search for a node by ID and Hex ID. The map will auto navigate to it.
- [x] Device list. To see which hardware models are most popular.
- [x] Mobile optimised layout.

## Beta Features

- [x] "Neighbours" map layer. Shows blue connection lines between nodes that heard the other node.
  - This information is taken from the `NEIGHBORINFO_APP`, but I feel like some of the neighbours weren't heard?? Maybe I am wrong.

## Planned Features

- Login/Register to manually add nodes to the map, and manage their details.
- Collect all `ServiceEnvelope` packets and provide a UI to filter and view them.
- Real-Time message UI to view `TEXT_MESSAGE_APP` packets as they come in.
- Map Filters
  - Filter out "Neighbours" based on max distance setting. Eg no greater than 200km.
  - Filter by Hardware Model
  - Filter by Frequency (we don't have this information yet)
  - Filter by Last Updated (ie, only show nodes heard in the last 1hr, 24hr, etc)

## Ideas

- Maybe a way to "claim" nodes, by sending a custom message from the node.
  - Set other information, such as frequency, antenna info.
  - Could allow you to upload your own photos of the node to show on the map.

## TODO

- dedupe packets to prevent spamming database
- track gateway id and channel for packets

- show frequency
- welcome modal
- not affiliated with meshtastic info
- donate link
- login/register to add nodes to the map manually
  - need to prevent spam
  - captcha for reg
  - limit how many nodes can be added from an account

- show connection lines between nodes and the neighbours they have heard directly
- ui to view realtime events from specific nodes
- ui to view text messages log
- store x days worth of historical logs
- be able to go back in time and see how the mesh evolved

## Install

Clone the project repo.

```
git clone https://github.com/liamcottle/meshtastic-map
cd meshtastic-map
```

Install NodeJS dependencies

```
npm install
```

Create a `.env` environment file.

```
touch .env
```

Add a database [connection string for prisma](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgresql) to `.env` file.

```
DATABASE_URL="mysql://root@localhost:3306/meshtastic-map?connection_limit=100"
```

Migrate the database.

```
npx prisma migrate dev
```

Run the MQTT listener, to save packets to database.

```
node src/mqtt.js
```

Run the Express Server, to serve the `/api` and Map UI.

```
node src/index.js
# Server running at http://127.0.0.1:8080
```

## Upgrading

Run the following commands from inside the `meshtastic-map` repo.

```
# update repo
git fetch && git pull

# migrate database
npx prisma migrate dev
```

You will now need to restart the `index.js` and `mqtt.js` scripts.

## Contributing

If you have a feature request, or find a bug, please [open an issue](https://github.com/liamcottle/meshtastic-map/issues) here on GitHub.

## License

MIT

## Legal

This project is not affiliated with or endorsed by the Meshtastic project.

The Meshtastic logo trademark is the trademark of Meshtastic LLC.

## References

- https://meshtastic.org/docs/software/integrations/mqtt/
- https://buf.build/meshtastic/protobufs/docs/main:meshtastic
