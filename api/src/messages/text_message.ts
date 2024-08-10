import type {
  Data,
  MeshPacket,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb";
import { COLLECT_TEXT_MESSAGES, LOG_KNOWN_PACKET_TYPES } from "../settings";
import { prisma } from "../db";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb";

export async function handleTextMessage(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  decodedPayload: Data
) {
  try {
    const utf8Decoder = new TextDecoder("UTF-8");
    const text = utf8Decoder.decode(Buffer.from(decodedPayload.payload));

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("TEXT_MESSAGE_APP", {
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
        text: text,
      });
    }

    if (COLLECT_TEXT_MESSAGES) {
      await prisma.textMessage.create({
        data: {
          from: packet.from,
          to: packet.to,
          channel: packet.channel,
          packet_id: packet.id,
          channel_id: envelope.channelId,
          gateway_id: envelope.gatewayId
            ? BigInt(`0x${envelope.gatewayId.replaceAll("!", "")}`)
            : null, // convert hex id "!f96a92f0" to bigint
          text: text,
          rx_time: packet.rxTime,
          rx_snr: packet.rxSnr,
          rx_rssi: packet.rxRssi,
          hop_limit: packet.hopLimit,
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
}
