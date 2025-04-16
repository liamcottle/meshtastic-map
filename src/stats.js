const crypto = require("crypto");
const path = require('path');
const express = require('express');
const router = express.Router();
const protobufjs = require("protobufjs");

// create prisma db client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// load protobufs
const root = new protobufjs.Root();
root.resolvePath = (origin, target) => path.join(__dirname, "protos", target);
root.loadSync('meshtastic/mqtt.proto');
const Data = root.lookupType("Data");
const HardwareModel = root.lookupEnum("HardwareModel");
const ServiceEnvelope = root.lookupType("ServiceEnvelope");
const PortNum = root.lookupEnum("PortNum");

const decryptionKeys = [
    "1PG7OiApB1nwvP+rz05pAQ==", // add default "AQ==" decryption key
];

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

function decrypt(packet) {

    // attempt to decrypt with all available decryption keys
    for(const decryptionKey of decryptionKeys){
        try {
            const key = Buffer.from(decryptionKey, "base64");
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

            const decipher = crypto.createDecipheriv(algorithm, key, nonceBuffer);
            const decryptedBuffer = Buffer.concat([decipher.update(packet.encrypted), decipher.final()]);

            return Data.decode(decryptedBuffer);

        } catch(e){}
    }

    // couldn't decrypt
    return null;

}

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

router.get('/position-precision', async (req, res) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
      const result = await prisma.node.groupBy({
        by: ['position_precision'],
        where: {
          position_updated_at: { gte: sevenDaysAgo },
          position_precision: { not: null },
        },
        _count: {
          position_precision: true,
        },
      });
  
      const formatted = result.map(r => ({
        position_precision: r.position_precision,
        count: r._count.position_precision,
      }));
  
      res.set('Cache-Control', 'public, max-age=600'); // 10 min cache
      res.json(formatted);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/most-active-nodes', async (req, res) => {
    try {
        const result = await prisma.$queryRaw`
        SELECT n.long_name, COUNT(*) AS count
        FROM service_envelopes se
        JOIN nodes n ON se.from = n.node_id
        WHERE 
          se.created_at >= NOW() - INTERVAL 1 DAY
          AND se.mqtt_topic NOT LIKE '%/map/'
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

router.get('/most-active-nodes2', async (req, res) => {
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
        const messages = await prisma.serviceEnvelope.findMany({
            where: {
                created_at: { gte: startTime },
                ...(Number.isInteger(nodeId) ? { from: nodeId } : {})
            },
            select: { protobuf: true, mqtt_topic: true }
        });

        const counts = {};
        for (const row of messages) {
            try {
                // We want to filter out any map reports.
                if (row.mqtt_topic && row.mqtt_topic.endsWith("/map/")) {
                    continue;
                }

                const envelope = ServiceEnvelope.decode(row.protobuf);
                const packet = envelope.packet;

                if (!packet?.encrypted) {
                    counts[0] = (counts[0] || 0) + 1;
                    continue;
                }

                const dataMessage = decrypt(packet);

                if (dataMessage?.portnum !== undefined) {
                    const portnum = dataMessage.portnum;
                    counts[portnum] = (counts[portnum] || 0) + 1;
                } else {
                    // couldn't decrypt or no portnum in decrypted message
                    counts[0] = (counts[0] || 0) + 1;
                }
            } catch (err) {
                console.warn("Decode error:", err.message);
                counts[0] = (counts[0] || 0) + 1;
            }
        }

        const result = Object.entries(counts).map(([portnum, count]) => ({
            portnum: parseInt(portnum),
            count,
            label: PortNum.valuesById[portnum] ?? "UNKNOWN",
        })).sort((a, b) => a.portnum - b.portnum);

        res.json(result);

    } catch (err) {
        console.error("Error in /portnum-counts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/portnum-counts2', async (req, res) => {
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


module.exports = router;