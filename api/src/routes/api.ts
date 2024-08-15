import express from "../express.js";

express.get("/api", async (req, res) => {
  const links = [
    {
      path: "/api",
      description: "This page",
    },
    {
      path: "/api/v1/nodes",
      description: "Meshtastic nodes in JSON format.",
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
