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
const HardwareModel = root.lookupEnum("HardwareModel");

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
        orderBy: {
          _count: {
            position_precision: 'desc',
          },
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

module.exports = router;