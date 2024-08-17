import { fromBinary } from "@bufbuild/protobuf";
import {
	type MeshPacket,
	type Data,
	DataSchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import crypto from "node:crypto";
import { DECRYPTION_KEYS } from "../settings.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";

export function createNonce(packetId: number, fromNode: number) {
	// Expand packetId to 64 bits
	const packetId64 = BigInt(packetId);

	// Initialize block counter (32-bit, starts at zero)
	const blockCounter = 0;

	// Create a buffer for the nonce
	const buf = Buffer.alloc(16);

	// Write packetId, fromNode, and block counter to the buffer
	buf.writeBigUInt64LE(packetId64, 0);
	buf.writeUInt32LE(fromNode, 8);
	buf.writeUInt32LE(blockCounter, 12);

	return buf;
}

export async function decrypt(packet: MeshPacket) {
	// attempt to decrypt with all available decryption keys
	for (const decryptionKey of DECRYPTION_KEYS) {
		try {
			// convert encryption key to buffer
			const key = Buffer.from(decryptionKey, "base64");

			// create decryption iv/nonce for this packet
			const nonceBuffer = createNonce(packet.id, packet.from);

			// determine algorithm based on key length
			let algorithm = null;
			if (key.length === 16) {
				algorithm = "aes-128-ctr";
			} else if (key.length === 32) {
				algorithm = "aes-256-ctr";
			} else {
				// skip this key, try the next one...
				console.error(
					`Skipping decryption key with invalid length: ${key.length}`
				);
				continue;
			}

			const decipher = crypto.createDecipheriv(algorithm, key, nonceBuffer);

			const encryptedPayload = packet.payloadVariant.value as Uint8Array;

			const decryptedBuffer = Buffer.concat([
				decipher.update(encryptedPayload),
				decipher.final(),
			]);

			return fromBinary(DataSchema, decryptedBuffer);
		} catch (err) {
			console.error(err);
		}
	}

	// couldn't decrypt
	return undefined;
}

export function extractMetaData(
	envelope: ServiceEnvelope,
	packet: MeshPacket,
	payload: Data
) {
	const envelopeMeta = {
		channelId: envelope.channelId,
		gatewayId: envelope.gatewayId,
	};

	const packetMeta = {
		from: packet.from,
		to: packet.to,
		channel: packet.channel,
		id: packet.id,
		rxTime: packet.rxTime,
		rxSnr: packet.rxSnr,
		rxRssi: packet.rxRssi,
		hopLimit: packet.hopLimit,
		wantAck: packet.wantAck,
		priority: packet.priority,
		viaMqtt: packet.viaMqtt,
		hopStart: packet.hopStart,
		delayed: packet.delayed,
	};

	const payloadMeta = {
		portnum: payload.portnum,
		dest: payload.dest,
		emoji: payload.emoji,
		replyId: payload.replyId,
		requestId: payload.requestId,
		source: payload.source,
		wantResponse: payload.wantResponse,
	};

	return { envelopeMeta, packetMeta, payloadMeta };
}

export function extractBoolean(
	value: string | undefined,
	def: boolean
): boolean {
	if (value === "true") return true;
	if (value === "false") return false;
	return def;
}
