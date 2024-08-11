import "./settings.js";
import "./http.js";
import "./express.js";
import { mqttClient } from "./mqtt.js";

import { handleStatMessage } from "./messages/stat.js";
import { handleServiceEnvelope } from "./messages/service_envelope.js";
import { handleTextMessage } from "./messages/text_message.js";
import { handlePosition } from "./messages/position.js";
import { handleNodeInfo } from "./messages/nodeinfo.js";
import { handleWaypoint } from "./messages/waypoint.js";
import { handleNeighbourInfo } from "./messages/neighbour_info.js";
import { handleTelemetry } from "./messages/telemetry.js";
import { handleTraceroute } from "./messages/traceroute.js";
import { handleMapReport } from "./messages/map_report.js";
import { LOG_UNKNOWN_PACKET_TYPES } from "./settings.js";

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
      case 4:
        await handleNodeInfo(envelope, packet, payload);
        break;
      case 8:
        await handleWaypoint(envelope, packet, payload);
        break;
      case 71:
        await handleNeighbourInfo(envelope, packet, payload);
        break;
      case 67:
        await handleTelemetry(envelope, packet, payload);
        break;
      case 70:
        await handleTraceroute(envelope, packet, payload);
        break;
      case 73:
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
