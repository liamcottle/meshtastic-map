import express from "../express.js";

express.get("/api", async (req, res) => {
  const links: { path: string; description: string }[] = [
    {
      path: "/api",
      description: "This page",
    },
    {
      path: "/api/healthz",
      description: "API health check.",
    },
    {
      path: "/api/v1/nodes",
      description: "Meshtastic nodes in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId",
      description: "Meshtastic node in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/environment-metrics",
      description: "Meshtastic environment metrics in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/power-metrics",
      description: "Meshtastic power metrics in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/mqtt-metrics",
      description: "Meshtastic MQTT metrics in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/device-metrics",
      description: "Meshtastic device metrics in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/neighbours",
      description: "Meshtastic neighbours in JSON format.",
    },
    {
      path: "/api/v1/nodes/:nodeId/traceroutes",
      description: "Meshtastic traceroutes in JSON format.",
    },
    {
      path: "/api/v1/text-messages",
      description: "Meshtastic text messages in JSON format.",
    },
    {
      path: "/api/v1/stats/hardware-models",
      description: "Database statistics about hardware models in JSON format.",
    },
    {
      path: "/api/v1/waypoints",
      description: "Meshtastic waypoints in JSON format.",
    },
  ];

  const html = links
    .map((link) => {
      return `<li><a href="${link.path}">${link.path}</a> - ${link.description}</li>`;
    })
    .join("");

  res.send(html);
});
console.log("API:EXPRESS registered route GET:/api");
