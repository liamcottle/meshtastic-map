import "./settings.js";
import "./db.js";
import "./express.js";
import "./http.js";

import "./routes/healthz.js";
import "./routes/api.js";
import "./routes/nodes.js";
import "./routes/metrics.js";
import "./routes/hardware-models.js";
import "./routes/neighbours.js";
import "./routes/text-messages.js";
import "./routes/traceroutes.js";
import "./routes/waypoints.js";

Object.assign(BigInt.prototype, {
  toJSON: function () {
    return this.toString();
  },
});
