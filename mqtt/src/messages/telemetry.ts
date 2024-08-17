import type { MeshPacket, Data } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db.js";
import { LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { extractMetaData } from "../tools/decrypt.js";
import {
	type DeviceMetrics,
	type EnvironmentMetrics,
	type PowerMetrics,
	type Telemetry,
	TelemetrySchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/telemetry_pb.js";

export async function handleTelemetry(
	envelope: ServiceEnvelope,
	packet: MeshPacket,
	payload: Data
): Promise<void> {
	try {
		const telemetry: Telemetry = fromBinary(TelemetrySchema, payload.payload);

		const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(envelope, packet, payload);

		if (LOG_KNOWN_PACKET_TYPES) {
			console.log("TELEMETRY_APP", {
				envelopeMeta: envelopeMeta,
				packetMeta: packetMeta,
				payloadMeta: payloadMeta,
				telemetry: telemetry,
			});
		}

		let data: object = {};
		let isDuplicate: any;

		switch (telemetry.variant.case) {
			case "deviceMetrics": {
				const tValue = telemetry.variant.value as DeviceMetrics;
				data = {
					battery_level: tValue.batteryLevel,
					voltage: tValue.voltage,
					channel_utilization: tValue.channelUtilization,
					air_util_tx: tValue.airUtilTx,
					uptime_seconds: tValue.uptimeSeconds,
				};
				isDuplicate = await prisma.deviceMetric.findFirst({
					where: {
						node_id: packet.from,
						battery_level: tValue.batteryLevel,
						voltage: tValue.voltage,
						channel_utilization: tValue.channelUtilization,
						air_util_tx: tValue.airUtilTx,
						created_at: {
							gte: new Date(Date.now() - 15000), // created in the last 15 seconds
						},
					},
				});

				if (isDuplicate) break;
				await prisma.deviceMetric.create({
					data: {
						node_id: packet.from,
						battery_level: tValue.batteryLevel,
						voltage: tValue.voltage,
						channel_utilization: tValue.channelUtilization,
						air_util_tx: tValue.airUtilTx,
					},
				});
				break;
			}

			case "environmentMetrics": {
				const tValue = telemetry.variant.value as EnvironmentMetrics;
				data = {
					temperature: tValue.temperature,
					relative_humidity: tValue.relativeHumidity,
					barometric_pressure: tValue.barometricPressure,
				};

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
						temperature: tValue.temperature,
						relative_humidity: tValue.relativeHumidity,
						barometric_pressure: tValue.barometricPressure,
						gas_resistance: tValue.gasResistance,
						voltage: tValue.voltage,
						current: tValue.current,
						iaq: tValue.iaq,
					},
				});
				break;
			}

			case "powerMetrics": {
				const tValue = telemetry.variant.value as PowerMetrics;

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
						ch1_voltage: tValue.ch1Voltage,
						ch1_current: tValue.ch1Current,
						ch2_voltage: tValue.ch2Voltage,
						ch2_current: tValue.ch2Current,
						ch3_voltage: tValue.ch3Voltage,
						ch3_current: tValue.ch3Current,
					},
				});
				break;
			}

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
