import { prisma } from "../db.js";
import express from "../express.js";
import { HardwareModel } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";

express.get("/api/v1/stats/hardware-models", async (req, res) => {
  try {
    // get nodes from db
    const results = await prisma.node.groupBy({
      by: ["hardware_model"],
      orderBy: {
        _count: {
          hardware_model: "desc",
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
        hardware_model_name: HardwareModel[result.hardware_model] ?? "UNKNOWN",
      };
    });

    res.json({
      hardware_model_stats: hardwareModelStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log("API:EXPRESS registered route GET:/api/v1/stats/hardware-models");
