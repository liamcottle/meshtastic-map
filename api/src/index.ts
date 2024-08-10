import "./settings.js";
import "./http.js";
import "./express.js";
import { mqttClient } from "./mqtt.js";

import { handleStatMessage } from "./messages/stat.js";
import { handleServiceEnvelope } from "./messages/service_envelope.js";
import { handleTextMessage } from "./messages/text_message.js";
import { handlePosition } from "./messages/position.js";

mqttClient.on("message", async (topic, message) => {
  try {
    if (topic.includes("/stat/!"))
      return await handleStatMessage(topic, message);

    const data = await handleServiceEnvelope(topic, message);

    if (!data) return;

    const { envelope, packet, payload } = data;

    if (!payload) return;

    const portnum = payload?.portnum;

    switch (portnum) {
      case 1:
        await handleTextMessage(envelope, packet, payload);
        break;
      case 3:
        await handlePosition(envelope, packet, payload);
        break;
    }
  } catch (err) {
    console.error(err);
  }
});
