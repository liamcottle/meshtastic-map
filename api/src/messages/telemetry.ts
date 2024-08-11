import type {
  MeshPacket,
  Data,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db";
import { LOG_KNOWN_PACKET_TYPES } from "../settings";
import { extractMetaData } from "../tools/decrypt";
import {
  DeviceMetrics,
  EnvironmentMetrics,
  PowerMetrics,
  type Telemetry,
  TelemetrySchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/telemetry_pb";

export async function handleTelemetry(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const telemetry: Telemetry = fromBinary(TelemetrySchema, payload.payload);

    const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(
      envelope,
      packet,
      payload
    );

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("NEIGHBORINFO_APP", {
        envelopeMeta: envelopeMeta,
        packetMeta: packetMeta,
        payloadMeta: payloadMeta,
        telemetry: telemetry,
      });
    }

    let data;
    let isDuplicate;

    switch (telemetry.variant.case) {
      case "deviceMetrics":
        data = telemetry.variant.value as DeviceMetrics;
        isDuplicate = await prisma.deviceMetric.findFirst({
          where: {
            node_id: packet.from,
            battery_level: data.batteryLevel,
            voltage: data.voltage,
            channel_utilization: data.channelUtilization,
            air_util_tx: data.airUtilTx,
            created_at: {
              gte: new Date(Date.now() - 15000), // created in the last 15 seconds
            },
          },
        });

        if (isDuplicate) break;
        await prisma.deviceMetric.create({
          data: {
            node_id: packet.from,
            battery_level: data.batteryLevel,
            voltage: data.voltage,
            channel_utilization: data.channelUtilization,
            air_util_tx: data.airUtilTx,
          },
        });
        break;

      case "environmentMetrics":
        data = telemetry.variant.value as EnvironmentMetrics;

        // find an existing metric with duplicate information created in the last 15 seconds
        isDuplicate = await prisma.environmentMetric.findFirst({
          where: {
            node_id: packet.from,
            packet_id: packet.id,
            created_at: {
              gte: new Date(Date.now() - 15000), // created in the last 15 seconds
            },
          },
        });

        // create metric if no duplicates found
        if (isDuplicate) break;
        await prisma.environmentMetric.create({
          data: {
            node_id: packet.from,
            packet_id: packet.id,
            temperature: data.temperature,
            relative_humidity: data.relativeHumidity,
            barometric_pressure: data.barometricPressure,
            gas_resistance: data.gasResistance,
            voltage: data.voltage,
            current: data.current,
            iaq: data.iaq,
          },
        });
        break;

      case "powerMetrics":
        data = telemetry.variant.value as PowerMetrics;

        // find an existing metric with duplicate information created in the last 15 seconds
        isDuplicate = await prisma.powerMetric.findFirst({
          where: {
            node_id: packet.from,
            packet_id: packet.id,
            created_at: {
              gte: new Date(Date.now() - 15000), // created in the last 15 seconds
            },
          },
        });

        if (isDuplicate) return;
        await prisma.powerMetric.create({
          data: {
            node_id: packet.from,
            packet_id: packet.id,
            ch1_voltage: data.ch1Voltage,
            ch1_current: data.ch1Current,
            ch2_voltage: data.ch2Voltage,
            ch2_current: data.ch2Current,
            ch3_voltage: data.ch3Voltage,
            ch3_current: data.ch3Current,
          },
        });
        break;

      case "airQualityMetrics":
        break;
    }

    if (!data) return;

    // update node telemetry in db
    if (Object.keys(data).length > 0) {
      try {
        await prisma.node.updateMany({
          where: {
            node_id: packet.from,
          },
          data: data,
        });
      } catch (e) {
        console.error(e);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
