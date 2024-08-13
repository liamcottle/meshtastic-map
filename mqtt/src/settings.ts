export const HTTP_PORT: number = Number.parseInt(
  process.env.HTTP_PORT || "8080"
);

export const MQTT_URL: string =
  process.env.MQTT_URL || "mqtt://mqtt.meshtastic.org";
export const MQTT_USERNAME: string = process.env.MQTT_USERNAME || "meshdev";
export const MQTT_PASSWORD: string = process.env.MQTT_PASSWORD || "large4cats";
export const MQTT_TOPIC: string = process.env.MQTT_TOPIC || "msh/HAM/S5/#";

export const PURGE_INTERVAL_SECONDS: number = Number.parseInt(
  process.env.PURGE_INTERVAL_SECONDS || "0"
);
export const PURGE_UNHEARD_NODES_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_UNHEARD_NODES_FOR_SECONDS || "0"
);
export const PURGE_DEVICE_METRICS_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_DEVICE_METRICS_FOR_SECONDS || "0"
);
export const PURGE_ENVIROMENT_METRICS_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_ENVIROMENT_METRICS_FOR_SECONDS || "0"
);
export const PURGE_POWER_METRICS_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_POWER_METRICS_FOR_SECONDS || "0"
);
export const PURGE_POSITIONS_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_POSITIONS_FOR_SECONDS || "0"
);
export const PURGE_TEXT_MESSAGES_FOR_SECONDS: number = Number.parseInt(
  process.env.PURGE_TEXT_MESSAGES_FOR_SECONDS || "0"
);

export const COLLECT_SERVICE_ENVELOPES: boolean =
  !!process.env.COLLECT_SERVICE_ENVELOPES || false;
export const COLLECT_TEXT_MESSAGES: boolean =
  !!process.env.COLLECT_TEXT_MESSAGES || false;
export const COLLECT_POSITION: boolean =
  !!process.env.COLLECT_POSITION || false;
export const COLLECT_NODEINFO: boolean =
  !!process.env.COLLECT_NODEINFO || false;
export const COLLECT_WAYPOINT: boolean =
  !!process.env.COLLECT_WAYPOINT || false;
export const COLLECT_NEIGHBOURINFO: boolean =
  !!process.env.COLLECT_NEIGHBOURINFO || false;
export const COLLECT_TRACEROUTE: boolean =
  !!process.env.COLLECT_TRACEROUTE || false;
export const COLLECT_MAP_REPOR: boolean =
  !!process.env.COLLECT_MAP_REPOR || false;

export const LOG_KNOWN_PACKET_TYPES: boolean =
  !!process.env.LOG_KNOWN_PACKET_TYPES || true;
export const LOG_UNKNOWN_PACKET_TYPES: boolean =
  !!process.env.LOG_UNKNOWN_PACKET_TYPES || false;

export const DECRYPTION_KEYS: string[] = process.env.DECRYPTION_KEYS?.split(
  ","
) || ["1PG7OiApB1nwvP+rz05pAQ=="];
