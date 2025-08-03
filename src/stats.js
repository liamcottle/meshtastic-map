const path = require('path');
const express = require('express');
const router = express.Router();
const protobufjs = require("protobufjs");

// create prisma db client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// load protobufs
const root = new protobufjs.Root();
root.resolvePath = (origin, target) => path.join(__dirname, "protobufs", target);
root.loadSync('meshtastic/mqtt.proto');
const HardwareModel = root.lookupEnum("HardwareModel");
const PortNum = root.lookupEnum("PortNum");


router.get('/hardware-models', async (req, res) => {
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

router.get('/messages-per-hour', async (req, res) => {
    try {
        const hours = 168;
        const now = new Date();
        const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

        const messages = await prisma.textMessage.findMany({
            where: { created_at: { gte: startTime } },
            select: { packet_id: true, created_at: true },
            distinct: ['packet_id'], // Ensures only unique packet_id entries are counted
            orderBy: { created_at: 'asc' }
        });

        // Pre-fill `uniqueCounts` with zeros for all hours
        const uniqueCounts = Object.fromEntries(
            Array.from({ length: hours }, (_, i) => {
                const hourTime = new Date(now.getTime() - (hours - i) * 60 * 60 * 1000);
                const hourString = hourTime.toISOString().slice(0, 13); // YYYY-MM-DD HH
                return [hourString, 0];
            })
        );

        // Populate actual message counts
        messages.forEach(({ created_at }) => {
            const hourString = created_at.toISOString().slice(0, 13); // YYYY-MM-DD HH
            uniqueCounts[hourString]++;
        });

        // Convert to final result format
        const result = Object.entries(uniqueCounts).map(([hour, count]) => ({ hour, count }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/most-active-nodes', async (req, res) => {
    try {
        const result = await prisma.$queryRaw`
        SELECT n.long_name, COUNT(*) AS count
        FROM (
            SELECT DISTINCT \`from\`, packet_id
            FROM service_envelopes
            WHERE 
                created_at >= NOW() - INTERVAL 1 DAY
                AND packet_id IS NOT NULL
                AND portnum != 73
                AND \`to\` != 1
        ) AS unique_packets
        JOIN nodes n ON unique_packets.from = n.node_id
        GROUP BY n.long_name
        ORDER BY count DESC
        LIMIT 25;
        `;
  
      res.set('Cache-Control', 'public, max-age=600'); // 10 min cache
      res.json(result);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/portnum-counts', async (req, res) => {
    const nodeId = req.query.nodeId ? parseInt(req.query.nodeId, 10) : null;
    const hours = 24;
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    try {
        const envelopes = await prisma.serviceEnvelope.findMany({
            where: {
                created_at: { gte: startTime },
                ...(Number.isInteger(nodeId) ? { from: nodeId } : {}),
                packet_id: { not: null },
                to: { not: 1 }, // Filter out NODENUM_BROADCAST_NO_LORA
                OR: [
                    { portnum: { not: 73 } }, // Exclude portnum 73 (e.g. map reports)
                    { portnum: null } // But include PKI packages, they have no portnum
                ]
            },
            select: {from: true, packet_id: true, portnum: true, channel_id: true}
        });

        // Ensure uniqueness based on (from, packet_id)
        const seen = new Set();
        const counts = {};

        for (const envelope of envelopes) {
            const uniqueKey = `${envelope.from}-${envelope.packet_id}`;
            if (seen.has(uniqueKey)) continue;
            seen.add(uniqueKey);

            // Override portnum to 512 if channel_id is "PKI"
            const portnum = envelope.channel_id === "PKI" ? 512 : (envelope.portnum ?? 0);
            counts[portnum] = (counts[portnum] || 0) + 1;
        }

        const result = Object.entries(counts).map(([portnum, count]) => ({
            portnum: parseInt(portnum, 10),
            count: count,
            label: parseInt(portnum, 10) === 512 ? "PKI" : (PortNum.valuesById[portnum] ?? "UNKNOWN"),
        })).sort((a, b) => a.portnum - b.portnum);

        res.json(result);

    } catch (err) {
        console.error("Error in /portnum-counts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/battery-stats', async (req, res) => {
    const days = parseInt(req.query.days || '1', 10);

    try {
        const stats = await prisma.$queryRaw`
            SELECT id, recorded_at, avg_battery_level
            FROM battery_stats
            WHERE recorded_at >= NOW() - INTERVAL ${days} DAY
            ORDER BY recorded_at DESC;
        `;

        res.json(stats);
    } catch (err) {
        console.error('Error fetching battery stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/channel-utilization-stats', async (req, res) => {
    const days = parseInt(req.query.days || '1', 10);

    try {
        const stats = await prisma.$queryRaw`
            SELECT recorded_at, avg_channel_utilization
            FROM channel_utilization_stats
            WHERE recorded_at >= NOW() - INTERVAL ${days} DAY
            ORDER BY recorded_at DESC;
        `;

        res.json(stats);
    } catch (err) {
        console.error('Error fetching channel utilization stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;