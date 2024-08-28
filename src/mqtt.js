const crypto = require("crypto");
const path = require("path");
const mqtt = require("mqtt");
const protobufjs = require("protobufjs");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

// create prisma db client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const optionsList = [
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'Display this usage guide.'
    },
    {
        name: "mqtt-broker-url",
        type: String,
        description: "MQTT Broker URL (e.g: mqtt://mqtt.meshtastic.org)",
    },
    {
        name: "mqtt-username",
        type: String,
        description: "MQTT Username (e.g: meshdev)",
    },
    {
        name: "mqtt-password",
        type: String,
        description: "MQTT Password (e.g: large4cats)",
    },
    {
        name: "mqtt-client-id",
        type: String,
        description: "MQTT Client ID (e.g: map.example.com)",
    },
    {
        name: "mqtt-topic",
        type: String,
        multiple: true,
        typeLabel: '<topic> ...',
        description: "MQTT Topic to subscribe to (e.g: msh/#)",
    },
    {
        name: "collect-service-envelopes",
        type: Boolean,
        description: "This option will save all received service envelopes to the database.",
    },
    {
        name: "collect-positions",
        type: Boolean,
        description: "This option will save all received positions to the database.",
    },
    {
        name: "collect-text-messages",
        type: Boolean,
        description: "This option will save all received text messages to the database.",
    },
    {
        name: "ignore-direct-messages",
        type: Boolean,
        description: "This option will prevent saving direct messages to the database.",
    },
    {
        name: "collect-waypoints",
        type: Boolean,
        description: "This option will save all received waypoints to the database.",
    },
    {
        name: "collect-neighbour-info",
        type: Boolean,
        description: "This option will save all received neighbour infos to the database.",
    },
    {
        name: "collect-map-reports",
        type: Boolean,
        description: "This option will save all received map reports to the database.",
    },
    {
        name: "decryption-keys",
        type: String,
        multiple: true,
        typeLabel: '<base64DecryptionKey> ...',
        description: "Decryption keys encoded in base64 to use when decrypting service envelopes.",
    },
    {
        name: "purge-interval-seconds",
        type: Number,
        description: "How long to wait between each automatic database purge.",
    },
    {
        name: "purge-device-metrics-after-seconds",
        type: Number,
        description: "Device Metrics older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-environment-metrics-after-seconds",
        type: Number,
        description: "Environment Metrics older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-power-metrics-after-seconds",
        type: Number,
        description: "Power Metrics older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-map-reports-after-seconds",
        type: Number,
        description: "Map reports older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-neighbour-infos-after-seconds",
        type: Number,
        description: "Neighbour infos older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-nodes-unheard-for-seconds",
        type: Number,
        description: "Nodes that haven't been heard from in this many seconds will be purged from the database.",
    },
    {
        name: "purge-positions-after-seconds",
        type: Number,
        description: "Positions older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-service-envelopes-after-seconds",
        type: Number,
        description: "Service envelopes older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-text-messages-after-seconds",
        type: Number,
        description: "Text Messages older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-traceroutes-after-seconds",
        type: Number,
        description: "Traceroutes older than this many seconds will be purged from the database.",
    },
    {
        name: "purge-waypoints-after-seconds",
        type: Number,
        description: "Waypoints older than this many seconds will be purged from the database.",
    },
];

// parse command line args
const options = commandLineArgs(optionsList);

// show help
if(options.help){
    const usage = commandLineUsage([
        {
            header: 'Meshtastic MQTT Collector',
            content: 'Collects and processes service envelopes from a Meshtastic MQTT server.',
        },
        {
            header: 'Options',
            optionList: optionsList,
        },
    ]);
    console.log(usage);
    return;
}

// get options and fallback to default values
const mqttBrokerUrl = options["mqtt-broker-url"] ?? "mqtt://mqtt.meshtastic.org";
const mqttUsername = options["mqtt-username"] ?? "meshdev";
const mqttPassword = options["mqtt-password"] ?? "large4cats";
const mqttClientId = options["mqtt-client-id"] ?? null;
const mqttTopics = options["mqtt-topic"] ?? ["msh/#"];
const collectServiceEnvelopes = options["collect-service-envelopes"] ?? false;
const collectPositions = options["collect-positions"] ?? true;
const collectTextMessages = options["collect-text-messages"] ?? false;
const ignoreDirectMessages = options["ignore-direct-messages"] ?? false;
const collectWaypoints = options["collect-waypoints"] ?? true;
const collectNeighbourInfo = options["collect-neighbour-info"] ?? false;
const collectMapReports = options["collect-map-reports"] ?? true;
const decryptionKeys = options["decryption-keys"] ?? [
    "1PG7OiApB1nwvP+rz05pAQ==", // add default "AQ==" decryption key
];
const purgeIntervalSeconds = options["purge-interval-seconds"] ?? 10;
const purgeNodesUnheardForSeconds = options["purge-nodes-unheard-for-seconds"] ?? null;
const purgeDeviceMetricsAfterSeconds = options["purge-device-metrics-after-seconds"] ?? null;
const purgeEnvironmentMetricsAfterSeconds = options["purge-environment-metrics-after-seconds"] ?? null;
const purgeMapReportsAfterSeconds = options["purge-map-reports-after-seconds"] ?? null;
const purgeNeighbourInfosAfterSeconds = options["purge-neighbour-infos-after-seconds"] ?? null;
const purgePowerMetricsAfterSeconds = options["purge-power-metrics-after-seconds"] ?? null;
const purgePositionsAfterSeconds = options["purge-positions-after-seconds"] ?? null;
const purgeServiceEnvelopesAfterSeconds = options["purge-service-envelopes-after-seconds"] ?? null;
const purgeTextMessagesAfterSeconds = options["purge-text-messages-after-seconds"] ?? null;
const purgeTraceroutesAfterSeconds = options["purge-traceroutes-after-seconds"] ?? null;
const purgeWaypointsAfterSeconds = options["purge-waypoints-after-seconds"] ?? null;

// create mqtt client
const client = mqtt.connect(mqttBrokerUrl, {
    username: mqttUsername,
    password: mqttPassword,
    clientId: mqttClientId,
});

// load protobufs
const root = new protobufjs.Root();
root.resolvePath = (origin, target) => path.join(__dirname, "protos", target);
root.loadSync('meshtastic/mqtt.proto');
const Data = root.lookupType("Data");
const ServiceEnvelope = root.lookupType("ServiceEnvelope");
const MapReport = root.lookupType("MapReport");
const NeighborInfo = root.lookupType("NeighborInfo");
const Position = root.lookupType("Position");
const RouteDiscovery = root.lookupType("RouteDiscovery");
const Telemetry = root.lookupType("Telemetry");
const User = root.lookupType("User");
const Waypoint = root.lookupType("Waypoint");

// run automatic purge if configured
if(purgeIntervalSeconds){
    setInterval(async () => {
        await purgeUnheardNodes();
        await purgeOldDeviceMetrics();
        await purgeOldEnvironmentMetrics();
        await purgeOldMapReports();
        await purgeOldNeighbourInfos();
        await purgeOldPowerMetrics();
        await purgeOldPositions();
        await purgeOldServiceEnvelopes();
        await purgeOldTextMessages();
        await purgeOldTraceroutes();
        await purgeOldWaypoints();
    }, purgeIntervalSeconds * 1000);
}

/**
 * Purges all nodes from the database that haven't been heard from within the configured timeframe.
 */
async function purgeUnheardNodes() {

    // make sure seconds provided
    if(!purgeNodesUnheardForSeconds){
        return;
    }

    // delete all nodes that were last updated before configured purge time
    try {
        await prisma.node.deleteMany({
            where: {
                updated_at: {
                    // last updated before x seconds ago
                    lt: new Date(Date.now() - purgeNodesUnheardForSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all device metrics from the database that are older than the configured timeframe.
 */
async function purgeOldDeviceMetrics() {

    // make sure seconds provided
    if(!purgeDeviceMetricsAfterSeconds){
        return;
    }

    // delete all device metrics that are older than the configured purge time
    try {
        await prisma.deviceMetric.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeDeviceMetricsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all environment metrics from the database that are older than the configured timeframe.
 */
async function purgeOldEnvironmentMetrics() {

    // make sure seconds provided
    if(!purgeEnvironmentMetricsAfterSeconds){
        return;
    }

    // delete all environment metrics that are older than the configured purge time
    try {
        await prisma.environmentMetric.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeEnvironmentMetricsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all power metrics from the database that are older than the configured timeframe.
 */
async function purgeOldMapReports() {

    // make sure seconds provided
    if(!purgeMapReportsAfterSeconds){
        return;
    }

    // delete all map reports that are older than the configured purge time
    try {
        await prisma.mapReport.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeMapReportsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all neighbour infos from the database that are older than the configured timeframe.
 */
async function purgeOldNeighbourInfos() {

    // make sure seconds provided
    if(!purgeNeighbourInfosAfterSeconds){
        return;
    }

    // delete all neighbour infos that are older than the configured purge time
    try {
        await prisma.neighbourInfo.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeNeighbourInfosAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all power metrics from the database that are older than the configured timeframe.
 */
async function purgeOldPowerMetrics() {

    // make sure seconds provided
    if(!purgePowerMetricsAfterSeconds){
        return;
    }

    // delete all power metrics that are older than the configured purge time
    try {
        await prisma.powerMetric.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgePowerMetricsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all positions from the database that are older than the configured timeframe.
 */
async function purgeOldPositions() {

    // make sure seconds provided
    if(!purgePositionsAfterSeconds){
        return;
    }

    // delete all positions that are older than the configured purge time
    try {
        await prisma.position.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgePositionsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all service envelopes from the database that are older than the configured timeframe.
 */
async function purgeOldServiceEnvelopes() {

    // make sure seconds provided
    if(!purgeServiceEnvelopesAfterSeconds){
        return;
    }

    // delete all service envelopes that are older than the configured purge time
    try {
        await prisma.serviceEnvelope.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeServiceEnvelopesAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all text messages from the database that are older than the configured timeframe.
 */
async function purgeOldTextMessages() {

    // make sure seconds provided
    if(!purgeTextMessagesAfterSeconds){
        return;
    }

    // delete all text messages that are older than the configured purge time
    try {
        await prisma.textMessage.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeTextMessagesAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all traceroutes from the database that are older than the configured timeframe.
 */
async function purgeOldTraceroutes() {

    // make sure seconds provided
    if(!purgeTraceroutesAfterSeconds){
        return;
    }

    // delete all traceroutes that are older than the configured purge time
    try {
        await prisma.traceRoute.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeTraceroutesAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

/**
 * Purges all waypoints from the database that are older than the configured timeframe.
 */
async function purgeOldWaypoints() {

    // make sure seconds provided
    if(!purgeWaypointsAfterSeconds){
        return;
    }

    // delete all waypoints that are older than the configured purge time
    try {
        await prisma.waypoint.deleteMany({
            where: {
                created_at: {
                    // created before x seconds ago
                    lt: new Date(Date.now() - purgeWaypointsAfterSeconds * 1000),
                },
            }
        });
    } catch(e) {
        // do nothing
    }

}

function createNonce(packetId, fromNode) {

    // Expand packetId to 64 bits
    const packetId64 = BigInt(packetId);

    // Initialize block counter (32-bit, starts at zero)
    const blockCounter = 0;

    // Create a buffer for the nonce
    const buf = Buffer.alloc(16);

    // Write packetId, fromNode, and block counter to the buffer
    buf.writeBigUInt64LE(packetId64, 0);
    buf.writeUInt32LE(fromNode, 8);
    buf.writeUInt32LE(blockCounter, 12);

    return buf;

}

/**
 * References:
 * https://github.com/crypto-smoke/meshtastic-go/blob/develop/radio/aes.go#L42
 * https://github.com/pdxlocations/Meshtastic-MQTT-Connect/blob/main/meshtastic-mqtt-connect.py#L381
 */
function decrypt(packet) {

    // attempt to decrypt with all available decryption keys
    for(const decryptionKey of decryptionKeys){
        try {

            // convert encryption key to buffer
            const key = Buffer.from(decryptionKey, "base64");

            // create decryption iv/nonce for this packet
            const nonceBuffer = createNonce(packet.id, packet.from);

            // determine algorithm based on key length
            var algorithm = null;
            if(key.length === 16){
                algorithm = "aes-128-ctr";
            } else if(key.length === 32){
                algorithm = "aes-256-ctr";
            } else {
                // skip this key, try the next one...
                console.error(`Skipping decryption key with invalid length: ${key.length}`);
                continue;
            }

            // create decipher
            const decipher = crypto.createDecipheriv(algorithm, key, nonceBuffer);

            // decrypt encrypted packet
            const decryptedBuffer = Buffer.concat([decipher.update(packet.encrypted), decipher.final()]);

            // parse as data message
            return Data.decode(decryptedBuffer);

        } catch(e){}
    }

    // couldn't decrypt
    return null;

}

/**
 * converts hex id to numeric id, for example: !FFFFFFFF to 4294967295
 * @param hexId a node id in hex format with a prepended "!"
 * @returns {bigint} the node id in numeric form
 */
function convertHexIdToNumericId(hexId) {
    return BigInt('0x' + hexId.replaceAll("!", ""));
}

// subscribe to everything when connected
client.on("connect", () => {
    for(const mqttTopic of mqttTopics){
        client.subscribe(mqttTopic);
    }
});

// handle message received
client.on("message", async (topic, message) => {
    try {

        // decode service envelope
        const envelope = ServiceEnvelope.decode(message);
        if(!envelope.packet){
            return;
        }

        // create service envelope in db
        if(collectServiceEnvelopes){
            try {
                await prisma.serviceEnvelope.create({
                    data: {
                        mqtt_topic: topic,
                        channel_id: envelope.channelId,
                        gateway_id: envelope.gatewayId ? convertHexIdToNumericId(envelope.gatewayId) : null,
                        to: envelope.packet.to,
                        from: envelope.packet.from,
                        protobuf: message,
                    },
                });
            } catch (e) {
                console.error(e, {
                    envelope: envelope.packet,
                });
            }
        }

        // track when a node last gated a packet to mqtt
        try {
            await prisma.node.updateMany({
                where: {
                    node_id: convertHexIdToNumericId(envelope.gatewayId),
                },
                data: {
                    mqtt_connection_state_updated_at: new Date(),
                },
            });
        } catch(e) {
            // don't care if updating mqtt timestamp fails
        }

        // attempt to decrypt encrypted packets
        const isEncrypted = envelope.packet.encrypted?.length > 0;
        if(isEncrypted){
            const decoded = decrypt(envelope.packet);
            if(decoded){
                envelope.packet.decoded = decoded;
            }
        }

        const logKnownPacketTypes = false;
        const logUnknownPacketTypes = false;
        const portnum = envelope.packet?.decoded?.portnum;

        if(portnum === 1) {

            if(!collectTextMessages){
                return;
            }

            // check if we want to ignore direct messages
            if(ignoreDirectMessages && envelope.packet.to !== 0xFFFFFFFF){
                return;
            }

            if(logKnownPacketTypes) {
                console.log("TEXT_MESSAGE_APP", {
                    to: envelope.packet.to.toString(16),
                    from: envelope.packet.from.toString(16),
                    text: envelope.packet.decoded.payload.toString(),
                });
            }

            try {
                await prisma.textMessage.create({
                    data: {
                        to: envelope.packet.to,
                        from: envelope.packet.from,
                        channel: envelope.packet.channel,
                        packet_id: envelope.packet.id,
                        channel_id: envelope.channelId,
                        gateway_id: envelope.gatewayId ? convertHexIdToNumericId(envelope.gatewayId) : null,
                        text: envelope.packet.decoded.payload.toString(),
                        rx_time: envelope.packet.rxTime,
                        rx_snr: envelope.packet.rxSnr,
                        rx_rssi: envelope.packet.rxRssi,
                        hop_limit: envelope.packet.hopLimit,
                    },
                });
            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 3) {

            const position = Position.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes){
                console.log("POSITION_APP", {
                    from: envelope.packet.from.toString(16),
                    position: position,
                });
            }

            // update node position in db
            if(position.latitudeI != null && position.longitudeI){
                try {
                    await prisma.node.updateMany({
                        where: {
                            node_id: envelope.packet.from,
                        },
                        data: {
                            position_updated_at: new Date(),
                            latitude: position.latitudeI,
                            longitude: position.longitudeI,
                            altitude: position.altitude !== 0 ? position.altitude : null,
                        },
                    });
                } catch (e) {
                    console.error(e);
                }
            }

            if(!collectPositions){
                return;
            }

            try {

                // find an existing position with duplicate information created in the last 60 seconds
                const existingDuplicatePosition = await prisma.position.findFirst({
                    where: {
                        node_id: envelope.packet.from,
                        packet_id: envelope.packet.id,
                        created_at: {
                            gte: new Date(Date.now() - 60000), // created in the last 60 seconds
                        },
                    }
                });

                // create position if no duplicates found
                if(!existingDuplicatePosition){
                    await prisma.position.create({
                        data: {
                            node_id: envelope.packet.from,
                            to: envelope.packet.to,
                            from: envelope.packet.from,
                            channel: envelope.packet.channel,
                            packet_id: envelope.packet.id,
                            channel_id: envelope.channelId,
                            gateway_id: envelope.gatewayId ? convertHexIdToNumericId(envelope.gatewayId) : null,
                            latitude: position.latitudeI,
                            longitude: position.longitudeI,
                            altitude: position.altitude,
                        },
                    });
                }

            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 4) {

            const user = User.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes) {
                console.log("NODEINFO_APP", {
                    from: envelope.packet.from.toString(16),
                    user: user,
                });
            }

            // create or update node in db
            try {
                await prisma.node.upsert({
                    where: {
                        node_id: envelope.packet.from,
                    },
                    create: {
                        node_id: envelope.packet.from,
                        long_name: user.longName,
                        short_name: user.shortName,
                        hardware_model: user.hwModel,
                        is_licensed: user.isLicensed === true,
                        role: user.role,
                    },
                    update: {
                        long_name: user.longName,
                        short_name: user.shortName,
                        hardware_model: user.hwModel,
                        is_licensed: user.isLicensed === true,
                        role: user.role,
                    },
                });
            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 8) {

            if(!collectWaypoints){
                return;
            }

            const waypoint = Waypoint.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes) {
                console.log("WAYPOINT_APP", {
                    to: envelope.packet.to.toString(16),
                    from: envelope.packet.from.toString(16),
                    waypoint: waypoint,
                });
            }

            try {
                await prisma.waypoint.create({
                    data: {
                        to: envelope.packet.to,
                        from: envelope.packet.from,
                        waypoint_id: waypoint.id,
                        latitude: waypoint.latitudeI,
                        longitude: waypoint.longitudeI,
                        expire: waypoint.expire,
                        locked_to: waypoint.lockedTo,
                        name: waypoint.name,
                        description: waypoint.description,
                        icon: waypoint.icon,
                        channel: envelope.packet.channel,
                        packet_id: envelope.packet.id,
                        channel_id: envelope.channelId,
                        gateway_id: envelope.gatewayId ? convertHexIdToNumericId(envelope.gatewayId) : null,
                    },
                });
            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 71) {

            const neighbourInfo = NeighborInfo.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes) {
                console.log("NEIGHBORINFO_APP", {
                    from: envelope.packet.from.toString(16),
                    neighbour_info: neighbourInfo,
                });
            }

            // update node neighbour info in db
            try {
                await prisma.node.updateMany({
                    where: {
                        node_id: envelope.packet.from,
                    },
                    data: {
                        neighbours_updated_at: new Date(),
                        neighbour_broadcast_interval_secs: neighbourInfo.nodeBroadcastIntervalSecs,
                        neighbours: neighbourInfo.neighbors.map((neighbour) => {
                            return {
                                node_id: neighbour.nodeId,
                                snr: neighbour.snr,
                            };
                        }),
                    },
                });
            } catch (e) {
                console.error(e);
            }

            // don't store all neighbour infos, but we want to update the existing node above
            if(!collectNeighbourInfo){
                return;
            }

            // create neighbour info
            try {
                await prisma.neighbourInfo.create({
                    data: {
                        node_id: envelope.packet.from,
                        node_broadcast_interval_secs: neighbourInfo.nodeBroadcastIntervalSecs,
                        neighbours: neighbourInfo.neighbors.map((neighbour) => {
                            return {
                                node_id: neighbour.nodeId,
                                snr: neighbour.snr,
                            };
                        }),
                    },
                });
            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 67) {

            const telemetry = Telemetry.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes) {
                console.log("TELEMETRY_APP", {
                    from: envelope.packet.from.toString(16),
                    telemetry: telemetry,
                });
            }

            // data to update
            const data = {};

            // handle device metrics
            if(telemetry.deviceMetrics){

                data.battery_level = telemetry.deviceMetrics.batteryLevel !== 0 ? telemetry.deviceMetrics.batteryLevel : null;
                data.voltage = telemetry.deviceMetrics.voltage !== 0 ? telemetry.deviceMetrics.voltage : null;
                data.channel_utilization = telemetry.deviceMetrics.channelUtilization !== 0 ? telemetry.deviceMetrics.channelUtilization : null;
                data.air_util_tx = telemetry.deviceMetrics.airUtilTx !== 0 ? telemetry.deviceMetrics.airUtilTx : null;
                data.uptime_seconds = telemetry.deviceMetrics.uptimeSeconds !== 0 ? telemetry.deviceMetrics.uptimeSeconds : null;

                // create device metric
                try {

                    // find an existing metric with duplicate information created in the last 15 seconds
                    const existingDuplicateDeviceMetric = await prisma.deviceMetric.findFirst({
                        where: {
                            node_id: envelope.packet.from,
                            battery_level: data.battery_level,
                            voltage: data.voltage,
                            channel_utilization: data.channel_utilization,
                            air_util_tx: data.air_util_tx,
                            created_at: {
                                gte: new Date(Date.now() - 15000), // created in the last 15 seconds
                            },
                        }
                    })

                    // create metric if no duplicates found
                    if(!existingDuplicateDeviceMetric){
                        await prisma.deviceMetric.create({
                            data: {
                                node_id: envelope.packet.from,
                                battery_level: data.battery_level,
                                voltage: data.voltage,
                                channel_utilization: data.channel_utilization,
                                air_util_tx: data.air_util_tx,
                            },
                        });
                    }

                } catch (e) {
                    console.error(e);
                }

            }

            // handle environment metrics
            if(telemetry.environmentMetrics){

                // get metric values
                const temperature = telemetry.environmentMetrics.temperature !== 0 ? telemetry.environmentMetrics.temperature : null;
                const relativeHumidity = telemetry.environmentMetrics.relativeHumidity !== 0 ? telemetry.environmentMetrics.relativeHumidity : null;
                const barometricPressure = telemetry.environmentMetrics.barometricPressure !== 0 ? telemetry.environmentMetrics.barometricPressure : null;
                const gasResistance = telemetry.environmentMetrics.gasResistance !== 0 ? telemetry.environmentMetrics.gasResistance : null;
                const voltage = telemetry.environmentMetrics.voltage !== 0 ? telemetry.environmentMetrics.voltage : null;
                const current = telemetry.environmentMetrics.current !== 0 ? telemetry.environmentMetrics.current : null;
                const iaq = telemetry.environmentMetrics.iaq !== 0 ? telemetry.environmentMetrics.iaq : null;

                // set metrics to update on node table
                data.temperature = temperature;
                data.relative_humidity = relativeHumidity;
                data.barometric_pressure = barometricPressure;

                // create environment metric
                try {

                    // find an existing metric with duplicate information created in the last 15 seconds
                    const existingDuplicateEnvironmentMetric = await prisma.environmentMetric.findFirst({
                        where: {
                            node_id: envelope.packet.from,
                            packet_id: envelope.packet.id,
                            created_at: {
                                gte: new Date(Date.now() - 15000), // created in the last 15 seconds
                            },
                        }
                    })

                    // create metric if no duplicates found
                    if(!existingDuplicateEnvironmentMetric){
                        await prisma.environmentMetric.create({
                            data: {
                                node_id: envelope.packet.from,
                                packet_id: envelope.packet.id,
                                temperature: temperature,
                                relative_humidity: relativeHumidity,
                                barometric_pressure: barometricPressure,
                                gas_resistance: gasResistance,
                                voltage: voltage,
                                current: current,
                                iaq: iaq,
                            },
                        });
                    }

                } catch (e) {
                    console.error(e);
                }

            }

            // handle power metrics
            if(telemetry.powerMetrics){

                // get metric values
                const ch1Voltage = telemetry.powerMetrics.ch1Voltage !== 0 ? telemetry.powerMetrics.ch1Voltage : null;
                const ch1Current = telemetry.powerMetrics.ch1Current !== 0 ? telemetry.powerMetrics.ch1Current : null;
                const ch2Voltage = telemetry.powerMetrics.ch2Voltage !== 0 ? telemetry.powerMetrics.ch2Voltage : null;
                const ch2Current = telemetry.powerMetrics.ch2Current !== 0 ? telemetry.powerMetrics.ch2Current : null;
                const ch3Voltage = telemetry.powerMetrics.ch3Voltage !== 0 ? telemetry.powerMetrics.ch3Voltage : null;
                const ch3Current = telemetry.powerMetrics.ch3Current !== 0 ? telemetry.powerMetrics.ch3Current : null;

                // create power metric
                try {

                    // find an existing metric with duplicate information created in the last 15 seconds
                    const existingDuplicatePowerMetric = await prisma.powerMetric.findFirst({
                        where: {
                            node_id: envelope.packet.from,
                            packet_id: envelope.packet.id,
                            created_at: {
                                gte: new Date(Date.now() - 15000), // created in the last 15 seconds
                            },
                        }
                    })

                    // create metric if no duplicates found
                    if(!existingDuplicatePowerMetric){
                        await prisma.powerMetric.create({
                            data: {
                                node_id: envelope.packet.from,
                                packet_id: envelope.packet.id,
                                ch1_voltage: ch1Voltage,
                                ch1_current: ch1Current,
                                ch2_voltage: ch2Voltage,
                                ch2_current: ch2Current,
                                ch3_voltage: ch3Voltage,
                                ch3_current: ch3Current,
                            },
                        });
                    }

                } catch (e) {
                    console.error(e);
                }

            }

            // update node telemetry in db
            if(Object.keys(data).length > 0){
                try {
                    await prisma.node.updateMany({
                        where: {
                            node_id: envelope.packet.from,
                        },
                        data: data,
                    });
                } catch (e) {
                    console.error(e);
                }
            }

        }

        else if(portnum === 70) {

            const routeDiscovery = RouteDiscovery.decode(envelope.packet.decoded.payload);

            if(logKnownPacketTypes) {
                console.log("TRACEROUTE_APP", {
                    to: envelope.packet.to.toString(16),
                    from: envelope.packet.from.toString(16),
                    want_response: envelope.packet.decoded.wantResponse,
                    route_discovery: routeDiscovery,
                });
            }

            try {
                await prisma.traceRoute.create({
                    data: {
                        to: envelope.packet.to,
                        from: envelope.packet.from,
                        want_response: envelope.packet.decoded.wantResponse,
                        route: routeDiscovery.route,
                        channel: envelope.packet.channel,
                        packet_id: envelope.packet.id,
                        channel_id: envelope.channelId,
                        gateway_id: envelope.gatewayId ? convertHexIdToNumericId(envelope.gatewayId) : null,
                    },
                });
            } catch (e) {
                console.error(e);
            }

        }

        else if(portnum === 73) {

            const mapReport = MapReport.decode(envelope.packet.decoded.payload);

            // congrats! you got blocked for spamming map reports with 0 sec interval. your map reports will be ignored.
            // fix your settings and update your firmware to automatically get unblocked :)
            if(envelope.packet.from === 3774324368 && mapReport.firmwareVersion === "2.3.0.5f47ca1" // [3202] T-Beam 3202
                || envelope.packet.from === 3663859228 && mapReport.firmwareVersion === "2.3.1.4fa7f5a" // [chrs] chris
                || envelope.packet.from === 1153561478 && mapReport.firmwareVersion === "2.3.1.4fa7f5a" // [Desc] Descend
                || envelope.packet.from === 3664091724 && mapReport.firmwareVersion === "2.3.0.5f47ca1"){ // [Del1] Delaware_Mesh
                return;
            }

            if(logKnownPacketTypes) {
                console.log("MAP_REPORT_APP", {
                    from: envelope.packet.from.toString(16),
                    map_report: mapReport,
                });
            }

            // create or update node in db
            try {

                // data to set on node
                const data = {
                    long_name: mapReport.longName,
                    short_name: mapReport.shortName,
                    hardware_model: mapReport.hwModel,
                    role: mapReport.role,
                    latitude: mapReport.latitudeI,
                    longitude: mapReport.longitudeI,
                    altitude: mapReport.altitude !== 0 ? mapReport.altitude : null,
                    firmware_version: mapReport.firmwareVersion,
                    region: mapReport.region,
                    modem_preset: mapReport.modemPreset,
                    has_default_channel: mapReport.hasDefaultChannel,
                    position_precision: mapReport.positionPrecision,
                    num_online_local_nodes: mapReport.numOnlineLocalNodes,
                    position_updated_at: new Date(),
                };

                await prisma.node.upsert({
                    where: {
                        node_id: envelope.packet.from,
                    },
                    create: {
                        node_id: envelope.packet.from,
                        ...data,
                    },
                    update: data,
                });

            } catch (e) {
                console.error(e);
            }

            if(!collectMapReports){
                return;
            }

            try {

                // find an existing map with duplicate information created in the last 60 seconds
                const existingDuplicateMapReport = await prisma.mapReport.findFirst({
                    where: {
                        node_id: envelope.packet.from,
                        long_name: mapReport.longName,
                        short_name: mapReport.shortName,
                        created_at: {
                            gte: new Date(Date.now() - 60000), // created in the last 60 seconds
                        },
                    }
                });

                // create map report if no duplicates found
                if(!existingDuplicateMapReport){
                    await prisma.mapReport.create({
                        data: {
                            node_id: envelope.packet.from,
                            long_name: mapReport.longName,
                            short_name: mapReport.shortName,
                            role: mapReport.role,
                            hardware_model: mapReport.hwModel,
                            firmware_version: mapReport.firmwareVersion,
                            region: mapReport.region,
                            modem_preset: mapReport.modemPreset,
                            has_default_channel: mapReport.hasDefaultChannel,
                            latitude: mapReport.latitudeI,
                            longitude: mapReport.longitudeI,
                            altitude: mapReport.altitude,
                            position_precision: mapReport.positionPrecision,
                            num_online_local_nodes: mapReport.numOnlineLocalNodes,
                        },
                    });
                }

            } catch (e) {
                console.error(e);
            }

        }

        else {
            if(logUnknownPacketTypes){

                // ignore packets we don't want to see for now
                if(portnum === undefined // ignore failed to decrypt
                    || portnum === 0 // ignore UNKNOWN_APP
                    || portnum === 1 // ignore TEXT_MESSAGE_APP
                    || portnum === 5 // ignore ROUTING_APP
                    || portnum === 34 // ignore PAXCOUNTER_APP
                    || portnum === 65 // ignore STORE_FORWARD_APP
                    || portnum === 66 // ignore RANGE_TEST_APP
                    || portnum === 72 // ignore ATAK_PLUGIN
                    || portnum === 257 // ignore ATAK_FORWARDER
                    || portnum > 511 // ignore above MAX
                ){
                    return;
                }

                console.log(portnum, envelope);

            }
        }

    } catch(e) {
        // ignore errors
    }
});
