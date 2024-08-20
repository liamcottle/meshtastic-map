import { prisma } from "../db.js";
import {
  PURGE_DEVICE_METRICS_AFTER_SECONDS,
  PURGE_ENVIROMENT_METRICS_AFTER_SECONDS,
  PURGE_POWER_METRICS_AFTER_SECONDS,
  PURGE_MAP_REPORTS_AFTER_SECONDS,
  PURGE_NEIGHBOUR_INFOS_AFTER_SECONDS,
  PURGE_UNHEARD_NODES_FOR_SECONDS,
  PURGE_POSITIONS_AFTER_SECONDS,
  PURGE_SERVICE_ENVELOPES_AFTER_SECONDS,
  PURGE_TEXT_MESSAGES_AFTER_SECONDS,
  PURGE_TRACEROUTES_AFTER_SECONDS,
  PURGE_WAYPOINTS_AFTER_SECONDS,
} from "../settings.js";

/**
 * Purges all nodes from the database that haven't been heard from within the configured timeframe.
 */
export async function purgeUnheardNodes() {
  if (PURGE_UNHEARD_NODES_FOR_SECONDS === 0) return;

  // delete all nodes that were last updated before configured purge time
  try {
    await prisma.node.deleteMany({
      where: {
        updated_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_UNHEARD_NODES_FOR_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all device metrics from the database that are older than the configured timeframe.
 */
export async function purgeOldDeviceMetrics() {
  if (PURGE_DEVICE_METRICS_AFTER_SECONDS === 0) return;

  // delete all device metrics that are older than the configured purge time
  try {
    await prisma.deviceMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_DEVICE_METRICS_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all environment metrics from the database that are older than the configured timeframe.
 */
export async function purgeOldEnvironmentMetrics() {
  if (PURGE_ENVIROMENT_METRICS_AFTER_SECONDS === 0) return;

  // delete all environment metrics that are older than the configured purge time
  try {
    await prisma.environmentMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(
            Date.now() - PURGE_ENVIROMENT_METRICS_AFTER_SECONDS * 1000
          ),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all map reports from the database that are older than the configured timeframe.
 */
export async function purgeOldMapReports() {
  if (PURGE_MAP_REPORTS_AFTER_SECONDS === 0) return;

  // delete all map reports that are older than the configured purge time
  try {
    await prisma.mapReport.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(
            Date.now() - PURGE_MAP_REPORTS_AFTER_SECONDS * 1000
          ),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all neighbour infos from the database that are older than the configured timeframe.
 */
export async function purgeOldNeighbourInfos() {
	// make sure seconds provided
	if (PURGE_NEIGHBOUR_INFOS_AFTER_SECONDS === 0) return;

	// delete all neighbour infos that are older than the configured purge time
	try {
		await prisma.neighbourInfo.deleteMany({
			where: {
				created_at: {
					// created before x seconds ago
					lt: new Date(Date.now() - PURGE_NEIGHBOUR_INFOS_AFTER_SECONDS * 1000),
				},
			},
		});
	} catch (e) {
		// do nothing
	}
}

/**
 * Purges all power metrics from the database that are older than the configured timeframe.
 */
export async function purgeOldPowerMetrics() {
  if (PURGE_POWER_METRICS_AFTER_SECONDS === 0) return;

  // delete all power metrics that are older than the configured purge time
  try {
    await prisma.powerMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_POWER_METRICS_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all positions from the database that are older than the configured timeframe.
 */
export async function purgeOldPositions() {
  if (PURGE_POSITIONS_AFTER_SECONDS === 0) return;

  // delete all positions that are older than the configured purge time
  try {
    await prisma.position.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_POSITIONS_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all service envelopes from the database that are older than the configured timeframe.
 */
export async function purgeOldServiceEnvelopes() {
  if (PURGE_SERVICE_ENVELOPES_AFTER_SECONDS === 0) return;

  // delete all envelopes that are older than the configured purge time
  try {
    await prisma.serviceEnvelope.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_SERVICE_ENVELOPES_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all text messages from the database that are older than the configured timeframe.
 */
export async function purgeOldTextMessages() {
  if (PURGE_TEXT_MESSAGES_AFTER_SECONDS === 0) return;

  // delete all text messages that are older than the configured purge time
  try {
    await prisma.textMessage.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_TEXT_MESSAGES_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all traceroutes from the database that are older than the configured timeframe.
 */
export async function purgeOldTraceroutes() {
  if (PURGE_TRACEROUTES_AFTER_SECONDS === 0) return;

  // delete all traceroutes that are older than the configured purge time
  try {
    await prisma.traceRoute.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_TRACEROUTES_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}

/**
 * Purges all waypoints from the database that are older than the configured timeframe.
 */
export async function purgeOldWaypoints() {
  if (PURGE_WAYPOINTS_AFTER_SECONDS === 0) return;

  // delete all waypoints that are older than the configured purge time
  try {
    await prisma.waypoint.deleteMany({
      where: {
        created_at: {
          // created before x seconds ago
          lt: new Date(Date.now() - PURGE_WAYPOINTS_AFTER_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}
