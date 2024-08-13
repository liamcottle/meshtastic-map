import type {
  Data,
  MeshPacket,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import { COLLECT_TEXT_MESSAGES, LOG_KNOWN_PACKET_TYPES } from "../settings.js";
import { prisma } from "../db.js";
import type { ServiceEnvelope } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mqtt_pb.js";
import { extractMetaData } from "../tools/decrypt.js";

export async function handleTextMessage(
  envelope: ServiceEnvelope,
  packet: MeshPacket,
  payload: Data
): Promise<void> {
  try {
    const utf8Decoder = new TextDecoder("UTF-8");
    const text = utf8Decoder.decode(Buffer.from(payload.payload));

    const { envelopeMeta, packetMeta, payloadMeta } = extractMetaData(
      envelope,
      packet,
      payload
    );

    if (LOG_KNOWN_PACKET_TYPES) {
      console.log("TEXT_MESSAGE_APP", {
        payload: { text: text },
        envelopeMeta: envelopeMeta,
        packetMeta: packetMeta,
        payloadMeta: payloadMeta,
      });
    }

    if (COLLECT_TEXT_MESSAGES) {
      await prisma.textMessage.create({
        data: {
          to: packet.to,
          from: packet.from,
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
