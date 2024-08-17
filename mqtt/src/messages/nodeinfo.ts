import {
	type MeshPacket,
	type Data,
	UserSchema,
	type User,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleNodeInfo(
	envelope: ServiceEnvelope,
	packet: MeshPacket,
	payload: Data
): Promise<void> {
	try {
		const nodeinfo: User = fromBinary(UserSchema, payload.payload);

		const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(envelope, packet, payload);

		if (LOG_KNOWN_PACKET_TYPES) {
			console.log("NODEINFO_APP", {
				envelopeMeta: envelopeMeta,
				packetMeta: packetMeta,
				payloadMeta: payloadMeta,
				nodeinfo: nodeinfo,
			});
		}

		await prisma.node.upsert({
			where: {
				node_id: packet.from,
			},
			create: {
				node_id: packet.from,
				long_name: nodeinfo.longName,
				short_name: nodeinfo.shortName,
				hardware_model: nodeinfo.hwModel,
				is_licensed: nodeinfo.isLicensed,
				role: nodeinfo.role,
			},
			update: {
				long_name: nodeinfo.longName,
				short_name: nodeinfo.shortName,
				hardware_model: nodeinfo.hwModel,
				is_licensed: nodeinfo.isLicensed,
				role: nodeinfo.role,
			},
		});
	} catch (err) {
		console.error(err);
	}
}
