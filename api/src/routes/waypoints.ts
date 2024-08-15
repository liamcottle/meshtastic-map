import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/waypoints", async (req, res) => {
  try {
    // get waypoints from db
    const waypoints = await prisma.waypoint.findMany({
      orderBy: {
        id: "desc",
      },
    });

    // ensure we only have the latest unique waypoints
    // since ordered by newest first, older entries will be ignored
    const uniqueWaypoints: typeof waypoints = [];
    for (const waypoint of waypoints) {
      // skip if we already have a newer entry for this waypoint
      if (
        uniqueWaypoints.find(
          (w) =>
            w.from === waypoint.from && w.waypoint_id === waypoint.waypoint_id
        )
      ) {
        continue;
      }

      // first time seeing this waypoint, add to unique list
      uniqueWaypoints.push(waypoint);
    }

    // we only want waypoints that haven't expired yet
    const nonExpiredWayPoints = uniqueWaypoints.filter((waypoint) => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (waypoint.expire) return waypoint.expire >= nowInSeconds;
    });

    res.json({
      waypoints: nonExpiredWayPoints,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
console.log("API:EXPRESS registered route GET:/api/v1/waypoints");
