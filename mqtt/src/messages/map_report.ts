import type {
  MeshPacket,
  Data,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import {
  MapReportSchema,
  type MapReport,
  type ServiceEnvelope,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { COLLECT_MAP_REPOR, LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleMapReport(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const mapReport: MapReport = fromBinary(MapReportSchema, payload.payload);

    const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(
      envelope,
      packet,
      payload
    );

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("MAP_REPORT_APP", {
        envelopeMeta: envelopeMeta,
        packetMeta: packetMeta,
        payloadMeta: payloadMeta,
        mapReport: mapReport,
      });

      const data = {
        long_name: mapReport.longName,
        short_name: mapReport.shortName,
        hardware_model: mapReport.hwModel,
        role: mapReport.role,
        latitude: mapReport.latitudeI,
        longitude: mapReport.longitudeI,
        altitude: mapReport.altitude !== 0 ? mapReport.altitude : null,
        firmware_version: mapReport.firmwareVersion,
        region: mapReport.region,
        modem_preset: mapReport.modemPreset,
        has_default_channel: mapReport.hasDefaultChannel,
        position_precision: mapReport.positionPrecision,
        num_online_local_nodes: mapReport.numOnlineLocalNodes,
        position_updated_at: new Date(),
      };

      await prisma.node.upsert({
        where: {
          node_id: packet.from,
        },
        create: {
          node_id: packet.from,
          ...data,
        },
        update: data,
      });

      if (COLLECT_MAP_REPOR) {
        const isDuplicate = await prisma.mapReport.findFirst({
          where: {
            node_id: packet.from,
            long_name: mapReport.longName,
            short_name: mapReport.shortName,
            created_at: {
              gte: new Date(Date.now() - 60000), // created in the last 60 seconds
            },
          },
        });

        // create map report if no duplicates found
        if (!isDuplicate) {
          await prisma.mapReport.create({
            data: {
              node_id: packet.from,
              long_name: mapReport.longName,
              short_name: mapReport.shortName,
              role: mapReport.role,
              hardware_model: mapReport.hwModel,
              firmware_version: mapReport.firmwareVersion,
              region: mapReport.region,
              modem_preset: mapReport.modemPreset,
              has_default_channel: mapReport.hasDefaultChannel,
              latitude: mapReport.latitudeI,
              longitude: mapReport.longitudeI,
              altitude: mapReport.altitude,
              position_precision: mapReport.positionPrecision,
              num_online_local_nodes: mapReport.numOnlineLocalNodes,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
