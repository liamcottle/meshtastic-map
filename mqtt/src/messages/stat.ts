import { prisma } from "../db.js";

export async function handleStatMessage(topic: string, message: Buffer) {
  try {
    const nodeIdHex = topic.split("/").pop();
    if (!nodeIdHex) return;

    const mqttConnectionState = message.toString();
    const nodeId = BigInt(`0x${nodeIdHex.replaceAll("!", "")}`);

    await prisma.node.updateMany({
      where: {
        node_id: nodeId,
      },
      data: {
        mqtt_connection_state: mqttConnectionState,
        mqtt_connection_state_updated_at: new Date(),
      },
    });

    return;
  } catch (err) {
    console.error(err);
  }
}
