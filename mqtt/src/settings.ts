import { extractBoolean } from "./tools/decrypt.js";

export const MQTT_URL: string = process.env.MQTT_URL || "mqtt://mqtt.meshtastic.org";
export const MQTT_USERNAME: string = process.env.MQTT_USERNAME || "meshdev";
export const MQTT_PASSWORD: string = process.env.MQTT_PASSWORD || "large4cats";
export const MQTT_TOPIC: string = process.env.MQTT_TOPIC || "msh/HAM/S5/#";

export const PURGE_INTERVAL_SECONDS: number = Number.parseInt(
  process.env.PURGE_INTERVAL_SECONDS || "0"
);
export const PURGE_DEVICE_METRICS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_DEVICE_METRICS_AFTER_SECONDS || "0"
);
export const PURGE_ENVIROMENT_METRICS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_ENVIROMENT_METRICS_AFTER_SECONDS || "0"
);
export const PURGE_POWER_METRICS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_POWER_METRICS_AFTER_SECONDS || "0"
);
export const PURGE_MAP_REPORTS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_MAP_REPORTS_AFTER_SECONDS || "0"
);
export const PURGE_NEIGHBOUR_INFOS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_NEIGHBOUR_INFOS_AFTER_SECONDS || "0"
);
export const PURGE_UNHEARD_NODES_FOR_SECONDS: number = Number.parseInt(
	process.env.PURGE_UNHEARD_NODES_FOR_SECONDS || "0"
);
export const PURGE_POSITIONS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_POSITIONS_AFTER_SECONDS || "0"
);
export const PURGE_SERVICE_ENVELOPES_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_SERVICE_ENVELOPES_AFTER_SECONDS || "0"
);
export const PURGE_TEXT_MESSAGES_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_TEXT_MESSAGES_AFTER_SECONDS || "0"
);
export const PURGE_TRACEROUTES_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_TRACEROUTES_AFTER_SECONDS || "0"
);
export const PURGE_WAYPOINTS_AFTER_SECONDS: number = Number.parseInt(
  process.env.PURGE_WAYPOINTS_AFTER_SECONDS || "0"
);
export const PURGE_TEXT_MESSAGES_AFTER_SECONDS: number = Number.parseInt(
	process.env.PURGE_TEXT_MESSAGES_AFTER_SECONDS || "0"
);
export const PURGE_SERVICE_ENVELOPES_AFTER_SECONDS: number = Number.parseInt(
	process.env.PURGE_SERVICE_ENVELOPES_AFTER_SECONDS || "0"
);
export const PURGE_TRACEROUTES_AFTER_SECONDS: number = Number.parseInt(
	process.env.PURGE_TRACEROUTES_AFTER_SECONDS || "0"
);
export const PURGE_WAYPOINTS_AFTER_SECONDS: number = Number.parseInt(
	process.env.PURGE_WAYPOINTS_AFTER_SECONDS || "0"
);

export const COLLECT_SERVICE_ENVELOPES: boolean =
  !!process.env.COLLECT_SERVICE_ENVELOPES || false;
export const COLLECT_POSITIONS: boolean =
  !!process.env.COLLECT_POSITIONS || true;
export const COLLECT_TEXT_MESSAGES: boolean =
  !!process.env.COLLECT_TEXT_MESSAGES || false;
export const COLLECT_WAYPOINTS: boolean =
  !!process.env.COLLECT_WAYPOINTS || true;
export const COLLECT_NEIGHBOURINFOS: boolean =
  !!process.env.COLLECT_NEIGHBOURINFOS || false;
export const COLLECT_TRACEROUTES: boolean =
  !!process.env.COLLECT_TRACEROUTES || false;
export const COLLECT_MAP_REPORS: boolean =
  !!process.env.COLLECT_MAP_REPORS || true;

export const LOG_KNOWN_PACKET_TYPES: boolean = extractBoolean(process.env.LOG_KNOWN_PACKET_TYPES, true);
export const LOG_UNKNOWN_PACKET_TYPES: boolean = extractBoolean(process.env.LOG_UNKNOWN_PACKET_TYPES, false);

export const DECRYPTION_KEYS: string[] = process.env.DECRYPTION_KEYS?.split(",") || [
	"1PG7OiApB1nwvP+rz05pAQ==",
];
