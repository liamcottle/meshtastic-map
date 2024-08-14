import "./settings.js";
import "./db.js";
import "./express.js";
import "./http.js";

import "./routes/api.js";
import "./routes/nodes.js";
import "./routes/metrics.js";
import "./routes/hardware-models.js";
import "./routes/neighbours.js";
import "./routes/text-messages.js";
import "./routes/traceroutes.js";
import "./routes/waypoints.js";

// return big ints as string when using JSON.stringify
BigInt.prototype.toJSON = function () {
  return this.toString();
};
