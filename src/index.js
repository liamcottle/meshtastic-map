const path = require('path');
const express = require('express');
const protobufjs = require("protobufjs");

// create prisma db client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// return big ints as string when using JSON.stringify
BigInt.prototype.toJSON = function() {
    return this.toString();
}

// load protobufs
const root = new protobufjs.Root();
root.resolvePath = (origin, target) => path.join(__dirname, "protos", target);
root.loadSync('meshtastic/mqtt.proto');
const HardwareModel = root.lookupEnum("HardwareModel");
const Role = root.lookupEnum("Config.DeviceConfig.Role");
const RegionCode = root.lookupEnum("Config.LoRaConfig.RegionCode");
const ModemPreset = root.lookupEnum("Config.LoRaConfig.ModemPreset");

// appends extra info for node objects returned from api
function formatNodeInfo(node) {
    return {
        ...node,
        node_id_hex: "!" + node.node_id.toString(16),
        hardware_model_name: HardwareModel.valuesById[node.hardware_model] ?? null,
        role_name: Role.valuesById[node.role] ?? null,
        region_name: RegionCode.valuesById[node.region] ?? null,
        modem_preset_name: ModemPreset.valuesById[node.modem_preset] ?? null,
    };
}

const app = express();

// serve files inside the public folder from /
app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api', async (req, res) => {

    const links = [
        {
            "path": "/api",
            "description": "This page",
        },
        {
            "path": "/api/v1/nodes",
            "description": "Meshtastic nodes in JSON format.",
        },
        {
            "path": "/api/v1/stats/hardware-models",
            "description": "Database statistics about hardware models in JSON format.",
        },
        {
            "path": "/api/v1/waypoints",
            "description": "Meshtastic waypoints in JSON format.",
        },
    ];

    const html = links.map((link) => {
        return `<li><a href="${link.path}">${link.path}</a> - ${link.description}</li>`;
    }).join("");

    res.send(html);

});

app.get('/api/v1/nodes', async (req, res) => {
    try {

        // get nodes from db
        const nodes = await prisma.node.findMany();

        const nodesWithInfo = [];
        for(const node of nodes){
            nodesWithInfo.push(formatNodeInfo(node));
        }

        res.json({
            nodes: nodesWithInfo,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/nodes/:nodeId', async (req, res) => {
    try {

        const nodeId = parseInt(req.params.nodeId);

        // find node
        const node = await prisma.node.findFirst({
            where: {
                node_id: nodeId,
            },
        });

        // make sure node exists
        if(!node){
            res.status(404).json({
                message: "Not Found",
            });
            return;
        }

        res.json({
            node: formatNodeInfo(node),
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/nodes/:nodeId/device-metrics', async (req, res) => {
    try {

        const nodeId = parseInt(req.params.nodeId);
        const count = req.query.count ? parseInt(req.query.count) : undefined;

        // find node
        const node = await prisma.node.findFirst({
           where: {
               node_id: nodeId,
           },
        });

        // make sure node exists
        if(!node){
            res.status(404).json({
                message: "Not Found",
            });
            return;
        }

        // get latest device metrics
        const deviceMetrics = await prisma.deviceMetric.findMany({
            where: {
                node_id: node.node_id,
            },
            orderBy: {
                id: 'desc',
            },
            take: count,
        });

        res.json({
            device_metrics: deviceMetrics,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/nodes/:nodeId/mqtt-metrics', async (req, res) => {
    try {

        const nodeId = parseInt(req.params.nodeId);

        // find node
        const node = await prisma.node.findFirst({
            where: {
                node_id: nodeId,
            },
        });

        // make sure node exists
        if(!node){
            res.status(404).json({
                message: "Not Found",
            });
            return;
        }

        // get mqtt topics published to by this node
        const queryResult = await prisma.$queryRaw`select mqtt_topic, count(*) as packet_count, max(created_at) as last_packet_at from service_envelopes where gateway_id = ${nodeId} group by mqtt_topic order by packet_count desc;`;

        res.json({
            mqtt_metrics: queryResult,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/nodes/:nodeId/neighbours', async (req, res) => {
    try {

        const nodeId = parseInt(req.params.nodeId);

        // find node
        const node = await prisma.node.findFirst({
            where: {
                node_id: nodeId,
            },
        });

        // make sure node exists
        if(!node){
            res.status(404).json({
                message: "Not Found",
            });
            return;
        }

        // get nodes from db that have this node as a neighbour
        const nodesThatHeardUs = await prisma.node.findMany({
            where: {
                neighbours: {
                    array_contains: {
                        node_id: Number(nodeId),
                    },
                },
            },
        });

        res.json({
            nodes_that_we_heard: node.neighbours.map((neighbour) => {
                return {
                    ...neighbour,
                    updated_at: node.neighbours_updated_at,
                };
            }),
            nodes_that_heard_us: nodesThatHeardUs.map((nodeThatHeardUs) => {
                const neighbourInfo = nodeThatHeardUs.neighbours.find((neighbour) => neighbour.node_id.toString() === node.node_id.toString());
                return {
                    node_id: Number(nodeThatHeardUs.node_id),
                    snr: neighbourInfo.snr,
                    updated_at: nodeThatHeardUs.neighbours_updated_at,
                };
            }),
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/nodes/:nodeId/traceroutes', async (req, res) => {
    try {

        const nodeId = parseInt(req.params.nodeId);
        const count = req.query.count ? parseInt(req.query.count) : 10; // can't set to null because of $queryRaw

        // find node
        const node = await prisma.node.findFirst({
            where: {
                node_id: nodeId,
            },
        });

        // make sure node exists
        if(!node){
            res.status(404).json({
                message: "Not Found",
            });
            return;
        }

        // get latest traceroutes
        // We want replies where want_response is false and it will be "to" the
        // requester.
        const traceroutes = await prisma.$queryRaw`SELECT * FROM traceroutes WHERE want_response = false and \`to\` = ${node.node_id} and gateway_id is not null order by id desc limit ${count}`;

        res.json({
            traceroutes: traceroutes,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/stats/hardware-models', async (req, res) => {
    try {

        // get nodes from db
        const results = await prisma.node.groupBy({
            by: ['hardware_model'],
            orderBy: {
                _count: {
                    hardware_model: 'desc',
                },
            },
            _count: {
                hardware_model: true,
            },
        });

        const hardwareModelStats = results.map((result) => {
           return {
               count: result._count.hardware_model,
               hardware_model: result.hardware_model,
               hardware_model_name: HardwareModel.valuesById[result.hardware_model] ?? "UNKNOWN",
           };
        });

        res.json({
            hardware_model_stats: hardwareModelStats,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.get('/api/v1/waypoints', async (req, res) => {
    try {

        // get waypoints from db
        const waypoints = await prisma.waypoint.findMany({
            orderBy: {
                id: 'desc',
            },
        });

        // ensure we only have the latest unique waypoints
        // since ordered by newest first, older entries will be ignored
        const uniqueWaypoints = [];
        for(const waypoint of waypoints){

            // skip if we already have a newer entry for this waypoint
            if(uniqueWaypoints.find((w) => w.from === waypoint.from && w.waypoint_id === waypoint.waypoint_id)){
                continue;
            }

            // first time seeing this waypoint, add to unique list
            uniqueWaypoints.push(waypoint);

        }

        // we only want waypoints that haven't expired yet
        const nonExpiredWayPoints = uniqueWaypoints.filter((waypoint) => {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            return waypoint.expire >= nowInSeconds;
        });

        res.json({
            waypoints: nonExpiredWayPoints,
        });

    } catch(err) {
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

// start express server
const listener = app.listen(8080, () => {
    const port = listener.address().port;
    console.log(`Server running at http://127.0.0.1:${port}`);
});
