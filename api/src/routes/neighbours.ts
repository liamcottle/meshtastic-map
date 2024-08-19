import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/nodes/:nodeId/neighbours", async (req, res) => {
	try {
		const nodeId = Number.parseInt(req.params.nodeId);

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

		// get nodes from db that have this node as a neighbour
		const nodesThatHeardUs = await prisma.node.findMany({
			where: {
				neighbours: {
					array_contains: {
						node_id: Number(nodeId),
					},
				},
			},
		});

		res.json({
			nodes_that_we_heard: node.neighbours.map((neighbour) => {
				return {
					...neighbour,
					updated_at: node.neighbours_updated_at,
				};
			}),
			nodes_that_heard_us: nodesThatHeardUs.map((nodeThatHeardUs) => {
				const neighbourInfo = nodeThatHeardUs.neighbours.find(
					(neighbour) => neighbour.node_id.toString() === node.node_id.toString()
				);
				return {
					node_id: Number(nodeThatHeardUs.node_id),
					snr: neighbourInfo.snr,
					updated_at: nodeThatHeardUs.neighbours_updated_at,
				};
			}),
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Something went wrong, try again later.",
		});
	}
});
console.log("API:EXPRESS registered route GET:/api/v1/nodes/:nodeId/neighbours");
