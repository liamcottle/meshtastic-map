import {
	type MeshPacket,
	type Data,
	type Waypoint,
	WaypointSchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { COLLECT_WAYPOINT, LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleWaypoint(
	envelope: ServiceEnvelope,
	packet: MeshPacket,
	payload: Data
): Promise<void> {
	try {
		const waypoint: Waypoint = fromBinary(WaypointSchema, payload.payload);

		const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(envelope, packet, payload);

		if (LOG_KNOWN_PACKET_TYPES) {
			console.log("WAYPOINT_APP", {
				envelopeMeta: envelopeMeta,
				packetMeta: packetMeta,
				payloadMeta: payloadMeta,
				waypoint: waypoint,
			});
		}

		if (COLLECT_WAYPOINT) {
			await prisma.waypoint.create({
				data: {
					to: packet.to,
					from: packet.from,
					waypoint_id: waypoint.id,
					latitude: waypoint.latitudeI,
					longitude: waypoint.longitudeI,
					expire: waypoint.expire,
					locked_to: waypoint.lockedTo,
					name: waypoint.name,
					description: waypoint.description,
					icon: waypoint.icon,
					channel: packet.channel,
					packet_id: packet.id,
					channel_id: envelope.channelId,
					gateway_id: envelope.gatewayId ? BigInt(`0x${envelope.gatewayId.replaceAll("!", "")}`) : null, // convert hex id "!f96a92f0" to bigint
				},
			});
		}
	} catch (err) {
		console.error(err);
	}
}
