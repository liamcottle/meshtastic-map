import { prisma } from "../db";
import {
  PURGE_DEVICE_METRICS_FOR_SECONDS,
  PURGE_ENVIROMENT_METRICS_FOR_SECONDS,
  PURGE_POSITIONS_FOR_SECONDS,
  PURGE_POWER_METRICS_FOR_SECONDS,
  PURGE_TEXT_MESSAGES_FOR_SECONDS,
  PURGE_UNHEARD_NODES_FOR_SECONDS,
} from "../settings";

/**
 * Purges all nodes from the database that haven't been heard from within the configured timeframe.
 */
export async function purgeUnheardNodes() {
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
  // delete all device metrics that are older than the configured purge time
  try {
    await prisma.deviceMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_DEVICE_METRICS_FOR_SECONDS * 1000),
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
  // delete all environment metrics that are older than the configured purge time
  try {
    await prisma.environmentMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(
            Date.now() - PURGE_ENVIROMENT_METRICS_FOR_SECONDS * 1000
          ),
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
  // delete all power metrics that are older than the configured purge time
  try {
    await prisma.powerMetric.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_POWER_METRICS_FOR_SECONDS * 1000),
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
  // delete all positions that are older than the configured purge time
  try {
    await prisma.position.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_POSITIONS_FOR_SECONDS * 1000),
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
  // delete all text messages that are older than the configured purge time
  try {
    await prisma.textMessage.deleteMany({
      where: {
        created_at: {
          // last updated before x seconds ago
          lt: new Date(Date.now() - PURGE_TEXT_MESSAGES_FOR_SECONDS * 1000),
        },
      },
    });
  } catch (e) {
    // do nothing
  }
}
