import {
  type MeshPacket,
  type Data,
  NeighborInfoSchema,
  type NeighborInfo,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { COLLECT_NEIGHBOURINFO, LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleNeighbourInfo(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const neighbourInfo: NeighborInfo = fromBinary(
      NeighborInfoSchema,
      payload.payload
    );

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
        neighbourInfo: neighbourInfo,
      });
    }

    await prisma.node.updateMany({
      where: {
        node_id: packet.from,
      },
      data: {
        neighbours_updated_at: new Date(),
        neighbour_broadcast_interval_secs:
          neighbourInfo.nodeBroadcastIntervalSecs,
        neighbours: neighbourInfo.neighbors.map((neighbour) => {
          return {
            node_id: neighbour.nodeId,
            snr: neighbour.snr,
          };
        }),
      },
    });

    if (COLLECT_NEIGHBOURINFO) {
      await prisma.neighbourInfo.create({
        data: {
          node_id: packet.from,
          node_broadcast_interval_secs: neighbourInfo.nodeBroadcastIntervalSecs,
          neighbours: neighbourInfo.neighbors.map((neighbour) => {
            return {
              node_id: neighbour.nodeId,
              snr: neighbour.snr,
            };
          }),
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
}
