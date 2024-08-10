import "./settings.js";
import "./http.js";
import "./express.js";
import { mqttClient } from "./mqtt.js";

import { handleStatMessage } from "./messages/stat.js";
import { handleServiceEnvelope } from "./messages/service_envelope.js";

mqttClient.on("message", async (topic, message) => {
  try {
    if (topic.includes("/stat/!"))
      return await handleStatMessage(topic, message);

    const data = await handleServiceEnvelope(topic, message);

    if (!data) return;

    const { packet, decodedPayload } = data;
  } catch (err) {
    console.error(err);
  }
});
