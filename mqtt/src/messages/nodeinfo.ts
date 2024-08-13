import {
  type MeshPacket,
  type Data,
  type NodeInfo,
  NodeInfoSchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { COLLECT_NODEINFO, LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleNodeInfo(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const nodeinfo: NodeInfo = fromBinary(NodeInfoSchema, payload.payload);
    const deviceMetrics = nodeinfo.deviceMetrics;
    const user = nodeinfo.user;
    const position = nodeinfo.position;

    const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(
      envelope,
      packet,
      payload
    );

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("NODEINFO_APP", {
        envelopeMeta: envelopeMeta,
        packetMeta: packetMeta,
        payloadMeta: payloadMeta,
        deviceMetrics: deviceMetrics,
        user: user,
        position: position,
      });
    }

    if (COLLECT_NODEINFO) {
      await prisma.node.upsert({
        where: {
          node_id: packet.from,
        },
        create: {
          node_id: packet.from,
          long_name: user?.longName || "",
          short_name: user?.shortName || "",
          hardware_model: user?.hwModel || 0,
          is_licensed: user?.isLicensed === true,
          role: user?.role || 0,
        },
        update: {
          long_name: user?.longName,
          short_name: user?.shortName,
          hardware_model: user?.hwModel,
          is_licensed: user?.isLicensed === true,
          role: user?.role,
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
}
