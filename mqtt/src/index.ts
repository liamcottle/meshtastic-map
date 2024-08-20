import "./settings.js";
import "./db.js";
import { mqttClient } from "./mqtt.js";

import {
  purgeUnheardNodes,
  purgeOldDeviceMetrics,
  purgeOldEnvironmentMetrics,
  purgeOldMapReports,
  purgeOldNeighbourInfos,
  purgeOldPowerMetrics,
  purgeOldPositions,
  purgeOldServiceEnvelopes,
  purgeOldTextMessages,
  purgeOldTraceroutes,
  purgeOldWaypoints,
} from "./tools/purging.js";

import { handleStatMessage } from "./messages/stat.js";
import { handleNodeInfo } from "./messages/nodeinfo.js";
import { handleTelemetry } from "./messages/telemetry.js";
import { handleMapReport } from "./messages/map_report.js";
import { handleNeighbourInfo } from "./messages/neighbour_info.js";
import { handlePosition } from "./messages/position.js";
import { handleServiceEnvelope } from "./messages/service_envelope.js";
import { handleTextMessage } from "./messages/text_message.js";
import { handleTraceroute } from "./messages/traceroute.js";
import { handleWaypoint } from "./messages/waypoint.js";

import { LOG_UNKNOWN_PACKET_TYPES, PURGE_INTERVAL_SECONDS } from "./settings.js";

// run automatic purge if configured
if (PURGE_INTERVAL_SECONDS !== 0) {
  setInterval(async () => {
    await purgeUnheardNodes();
    await purgeOldDeviceMetrics();
    await purgeOldEnvironmentMetrics();
    await purgeOldMapReports();
    await purgeOldNeighbourInfos();
    await purgeOldPowerMetrics();
    await purgeOldPositions();
    await purgeOldServiceEnvelopes();
    await purgeOldTextMessages();
    await purgeOldTraceroutes();
    await purgeOldWaypoints();
  }, PURGE_INTERVAL_SECONDS * 1000);
}

// handle message received
mqttClient.on("message", async (topic: string, message: Buffer) => {
	try {
		if (topic.includes("/stat/!")) {
			// no need to continue with this mqtt message
			return await handleStatMessage(topic, message);
		}

		const data = await handleServiceEnvelope(topic, message);

		// ignore if packet is empty
		if (!data) return;

		const { envelope, packet, payload } = data;

		// ignore if we can't decrypt the message
		if (!payload) return;

		const portnum = payload?.portnum;

		/*
		Meshtastic removed the following portnums to be broadcasted to public
		Meshtastic MQTT server. If you don't use deafult PSK, it doesn't effect you.
		https://www.reddit.com/r/meshtastic/comments/1e00x1a/important_update_meshtastic_public_mqtt_server/
		*/

		switch (portnum) {
			case 1: // TEXT_MESSAGE_APP
				await handleTextMessage(envelope, packet, payload);
				break;
			case 3: // POSITION_APP
				await handlePosition(envelope, packet, payload);
				break;
			case 4: // NODEINFO_APP
				await handleNodeInfo(envelope, packet, payload);
				break;
			case 8: // WAYPOINT_APP - disabled
				await handleWaypoint(envelope, packet, payload);
				break;
			case 67: // TELEMETRY_APP
				await handleTelemetry(envelope, packet, payload);
				break;
			case 70: // TRACEROUTE_APP
				await handleTraceroute(envelope, packet, payload);
				break;
			case 71: // NEIGHBOURINFO_APP - disabled
				await handleNeighbourInfo(envelope, packet, payload);
				break;
			case 73: // MAP_REPORT_APP
				await handleMapReport(envelope, packet, payload);
				break;
			default:
				if (LOG_UNKNOWN_PACKET_TYPES) {
					// ignore packets we don't want to see for now
					if (
						portnum === undefined || // ignore failed to decrypt
						portnum === 0 || // ignore UNKNOWN_APP
						portnum === 1 || // ignore TEXT_MESSAGE_APP
						portnum === 5 || // ignore ROUTING_APP
						portnum === 34 || // ignore PAXCOUNTER_APP
						portnum === 65 || // ignore STORE_FORWARD_APP
						portnum === 66 || // ignore RANGE_TEST_APP
						portnum === 72 || // ignore ATAK_PLUGIN
						portnum === 257 || // ignore ATAK_FORWARDER
						portnum > 511 // ignore above MAX
					) {
						return;
					}

					console.log(portnum, envelope);
				}
		}
	} catch (err) {
		console.error(err);
	}
});
