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
        name: "collect-service-envelopes",
        type: Boolean,
        description: "This option will save all received service envelopes to the database.",
    },
    {
        name: "collect-text-messages",
        type: Boolean,
        description: "This option will save all received text messages to the database.",
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
        name: "purge-nodes-unheard-for-seconds",
        type: Number,
        description: "Nodes that haven't been heard from in this many seconds will be purged from the database.",
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
const collectServiceEnvelopes = options["collect-service-envelopes"] ?? false;
const collectTextMessages = options["collect-text-messages"] ?? false;
const collectWaypoints = options["collect-waypoints"] ?? true;
const collectNeighbourInfo = options["collect-neighbour-info"] ?? false;
const collectMapReports = options["collect-map-reports"] ?? false;
const decryptionKeys = options["decryption-keys"] ?? [
    "1PG7OiApB1nwvP+rz05pAQ==", // add default "AQ==" decryption key
];
const purgeIntervalSeconds = options["purge-interval-seconds"] ?? 10;
const purgeNodesUnheardForSeconds = options["purge-nodes-unheard-for-seconds"] ?? null;

// create mqtt client
const client = mqtt.connect(mqttBrokerUrl, {
    username: mqttUsername,
    password: mqttPassword,
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

            // create aes-128-ctr decipher
            const decipher = crypto.createDecipheriv('aes-128-ctr', key, nonceBuffer);

            // decrypt encrypted packet
            const decryptedBuffer = Buffer.concat([decipher.update(packet.encrypted), decipher.final()]);

            // parse as data message
            return Data.decode(decryptedBuffer);

        } catch(e){}
    }

    // couldn't decrypt
    return null;

}

// subscribe to everything when connected
client.on("connect", () => {
    client.subscribe("#");
});

// handle message received
client.on("message", async (topic, message) => {
    try {

        // handle node status
        if(topic.includes("/stat/!")){
            try {

                // get node id and status
                const nodeIdHex = topic.split("/").pop();
                const mqttConnectionState = message.toString();

                // convert node id hex to int value
                const nodeId = BigInt('0x' + nodeIdHex.replaceAll("!", ""));

                // update mqtt connection state for node
                await prisma.node.updateMany({
                    where: {
                        node_id: nodeId,
                    },
                    data: {
                        mqtt_connection_state: mqttConnectionState,
                        mqtt_connection_state_updated_at: new Date(),
                    },
                });

                // no need to continue with this mqtt message
                return;

            } catch(e) {
                console.error(e);
            }
        }

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
                        gateway_id: envelope.gatewayId ? BigInt('0x' + envelope.gatewayId.replaceAll("!", "")) : null, // convert hex id "!f96a92f0" to bigint
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
                        gateway_id: envelope.gatewayId ? BigInt('0x' + envelope.gatewayId.replaceAll("!", "")) : null, // convert hex id "!f96a92f0" to bigint
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
                        gateway_id: envelope.gatewayId ? BigInt('0x' + envelope.gatewayId.replaceAll("!", "")) : null, // convert hex id "!f96a92f0" to bigint
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
                        gateway_id: envelope.gatewayId ? BigInt('0x' + envelope.gatewayId.replaceAll("!", "")) : null, // convert hex id "!f96a92f0" to bigint
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
