import mqtt from "mqtt";
import {
  MQTT_URL,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TOPIC,
} from "./settings.js";

export const mqttClient = mqtt.connect(MQTT_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  mqttClient.subscribe(MQTT_TOPIC);
  console.log(`
    .- - - - - - - - - - - - - - - - - - - -
    |   MQTT client listening on topic ${MQTT_TOPIC}
    '- - - - - - - - - - - - - - - - - - - -
    `);
});

mqttClient.on("error", (error: Error) => {
  console.error(error);
});
