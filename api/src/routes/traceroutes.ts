import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/nodes/:nodeId/traceroutes", async (req, res) => {
	try {
		const nodeId = Number.parseInt(req.params.nodeId);
		const count = req.query.count ? Number.parseInt(req.query.count as string) : 10; // can't set to null because of $queryRaw

		// find node
		const node = await prisma.node.findFirst({
			where: {
				node_id: nodeId,
			},
		});

		// make sure node exists
		if (!node) {
			res.status(404).json({
				message: "Not Found",
			});
			return;
		}

		// get latest traceroutes
		// We want replies where want_response is false and it will be "to" the
		// requester.
		const traceroutes =
			await prisma.$queryRaw`SELECT * FROM traceroutes WHERE want_response = false and \`to\` = ${node.node_id} and gateway_id is not null order by id desc limit ${count}`;

		res.json({
			traceroutes: traceroutes.map((trace) => {
				if (typeof trace.route === "string") {
					trace.route = JSON.parse(trace.route);
				}
				return trace;
			}),
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Something went wrong, try again later.",
		});
	}
});
console.log("API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/traceroutes");
