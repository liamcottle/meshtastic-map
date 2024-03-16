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

        const nodesWithNeighbourInfo = [];
        for(const node of nodes){
            nodesWithNeighbourInfo.push({
                ...node,
                node_id_hex: "!" + node.node_id.toString(16),
                hardware_model_name: HardwareModel.valuesById[node.hardware_model] ?? "UNKNOWN",
                role_name: Role.valuesById[node.role] ?? "UNKNOWN",
                neighbour_info: await prisma.neighbourInfo.findFirst({
                    where: {
                        node_id: node.node_id,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                }),
            })
        }

        res.json({
            nodes: nodesWithNeighbourInfo,
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

app.get('/api/v1/nodes/:nodeId/mqtt-topics', async (req, res) => {
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
        }

        // get list of unique mqtt topics published to by this node
        const queryResult = await prisma.$queryRaw`SELECT
        gateway_id,
            JSON_ARRAYAGG(mqtt_topic) AS unique_mqtt_topics
        FROM (
            SELECT
        gateway_id,
            mqtt_topic
        FROM
        service_envelopes
        GROUP BY
        gateway_id, mqtt_topic
        ) AS subquery
        WHERE
        gateway_id is not null
        and gateway_id = ${nodeId}
        GROUP BY
        gateway_id
        ORDER BY
        COUNT(*) DESC;`;

        // get result from query
        const uniqueMqttTopics = queryResult[0]?.unique_mqtt_topics ?? [];

        res.json({
            mqtt_topics: uniqueMqttTopics,
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

app.listen(8080);
