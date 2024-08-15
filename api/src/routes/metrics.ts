import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/nodes/:nodeId/device-metrics", async (req, res) => {
  try {
    const nodeId = Number.parseInt(req.params.nodeId);
    const count = req.query.count
      ? Number.parseInt(req.query.count.toString())
      : undefined;

    // find node
    const node = await prisma.node.findFirst({
      where: {
        node_id: nodeId,
      },
    });

    // make sure node exists
    if (!node) {
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
        id: "desc",
      },
      take: count,
    });

    res.json({
      device_metrics: deviceMetrics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log(
  "API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/device-metrics"
);

express.get("/api/v1/nodes/:nodeId/environment-metrics", async (req, res) => {
  try {
    const nodeId = Number.parseInt(req.params.nodeId);
    const count = req.query.count
      ? Number.parseInt(req.query.count.toString())
      : undefined;

    // find node
    const node = await prisma.node.findFirst({
      where: {
        node_id: nodeId,
      },
    });

    // make sure node exists
    if (!node) {
      res.status(404).json({
        message: "Not Found",
      });
      return;
    }

    // get latest environment metrics
    const environmentMetrics = await prisma.environmentMetric.findMany({
      where: {
        node_id: node.node_id,
      },
      orderBy: {
        id: "desc",
      },
      take: count,
    });

    res.json({
      environment_metrics: environmentMetrics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log(
  "API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/environment-metrics"
);

express.get("/api/v1/nodes/:nodeId/power-metrics", async (req, res) => {
  try {
    const nodeId = Number.parseInt(req.params.nodeId);
    const count = req.query.count
      ? Number.parseInt(req.query.count.toString())
      : undefined;

    // find node
    const node = await prisma.node.findFirst({
      where: {
        node_id: nodeId,
      },
    });

    // make sure node exists
    if (!node) {
      res.status(404).json({
        message: "Not Found",
      });
      return;
    }

    // get latest power metrics
    const powerMetrics = await prisma.powerMetric.findMany({
      where: {
        node_id: node.node_id,
      },
      orderBy: {
        id: "desc",
      },
      take: count,
    });

    res.json({
      power_metrics: powerMetrics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log(
  "API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/power-metrics"
);

express.get("/api/v1/nodes/:nodeId/mqtt-metrics", async (req, res) => {
  try {
    const nodeId = Number.parseInt(req.params.nodeId);

    // find node
    const node = await prisma.node.findFirst({
      where: {
        node_id: nodeId,
      },
    });

    // make sure node exists
    if (!node) {
      res.status(404).json({
        message: "Not Found",
      });
      return;
    }

    // get mqtt topics published to by this node
    const queryResult =
      await prisma.$queryRaw`select mqtt_topic, count(*) as packet_count, max(created_at) as last_packet_at from service_envelopes where gateway_id = ${nodeId} group by mqtt_topic order by packet_count desc;`;

    res.json({
      mqtt_metrics: queryResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log(
  "API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/mqtt-metrics"
);
