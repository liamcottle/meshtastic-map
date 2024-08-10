import {
  type MeshPacket,
  type Data,
  type Position,
  PositionSchema,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb";
import { COLLECT_POSITION, LOG_KNOWN_PACKET_TYPES } from "../settings";
import { fromBinary } from "@bufbuild/protobuf";
import { prisma } from "../db";

export async function handlePosition(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const position: Position = fromBinary(PositionSchema, payload.payload);

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("POSITION_APP", {
        from: packet.from.toString(16),
        to: packet.to.toString(16),
        channel: packet.channel,
        packet_id: packet.id,
        channel_id: envelope.channelId,
        gateway_id: envelope.gatewayId
          ? BigInt(`0x${envelope.gatewayId.replaceAll("!", "")}`)
          : null, // convert hex id "!f96a92f0" to bigint
        rx_time: packet.rxTime,
        rx_snr: packet.rxSnr,
        rx_rssi: packet.rxRssi,
        hop_limit: packet.hopLimit,
        want_ack: packet.wantAck,
        priority: packet.priority,
        via_mqtt: packet.viaMqtt,
        hop_start: packet.hopStart,
        position: position,
      });

      // find an existing position with duplicate information created in the last 60 seconds
      const isDuplicate = await prisma.position.findFirst({
        where: {
          node_id: packet.from,
          packet_id: packet.id,
          created_at: {
            gte: new Date(Date.now() - 60000), // created in the last 60 seconds
          },
        },
      });

      if (
        COLLECT_POSITION &&
        position.latitudeI &&
        position.longitudeI &&
        !isDuplicate
      ) {
        await prisma.position.create({
          data: {
            from: packet.from.toString(16),
            to: packet.to.toString(16),
            channel: packet.channel,
            packet_id: packet.id,
            channel_id: envelope.channelId,
            gateway_id: envelope.gatewayId
              ? BigInt(`0x${envelope.gatewayId.replaceAll("!", "")}`)
              : null, // convert hex id "!f96a92f0" to bigint
            rx_time: packet.rxTime,
            rx_snr: packet.rxSnr,
            rx_rssi: packet.rxRssi,
            hop_limit: packet.hopLimit,
            want_ack: packet.wantAck,
            priority: packet.priority,
            via_mqtt: packet.viaMqtt,
            hop_start: packet.hopStart,
            position: position,
          },
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}
