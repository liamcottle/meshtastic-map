import { prisma } from "../db";
import express from "../express";

express.get("/api/v1/text-messages", async (req, res) => {
  try {
    // get query params
    const to = req.query.to ?? undefined;
    const from = req.query.from ?? undefined;
    const channelId = req.query.channel_id ?? undefined;
    const gatewayId = req.query.gateway_id ?? undefined;
    const directMessageNodeIds =
      req.query.direct_message_node_ids?.split(",") ?? undefined;
    const lastId = req.query.last_id ? Number.parseInt(req.query.last_id) : undefined;
    const count = req.query.count ? Number.parseInt(req.query.count) : 50;
    const order = req.query.order ?? "asc";

    // if direct message node ids are provided, there should be exactly two node ids
    if (
      directMessageNodeIds !== undefined &&
      directMessageNodeIds.length !== 2
    ) {
      res.status(400).json({
        message:
          "direct_message_node_ids requires 2 node ids separated by a comma.",
      });
      return;
    }

    // default where clauses that should always be used for filtering
    var where = {
      channel_id: channelId,
      gateway_id: gatewayId,
      // when ordered oldest to newest (asc), only get records after last id
      // when ordered newest to oldest (desc), only get records before last id
      id:
        order === "asc"
          ? {
              gt: lastId,
            }
          : {
              lt: lastId,
            },
    };

    // if direct message node ids are provided, we expect exactly 2 node ids
    if (
      directMessageNodeIds !== undefined &&
      directMessageNodeIds.length === 2
    ) {
      // filter message by "to -> from" or "from -> to"
      const [firstNodeId, secondNodeId] = directMessageNodeIds;
      where = {
        AND: where,
        OR: [
          {
            to: firstNodeId,
            from: secondNodeId,
          },
          {
            to: secondNodeId,
            from: firstNodeId,
          },
        ],
      };
    } else {
      // filter by to and from
      where = {
        ...where,
        to: to,
        from: from,
      };
    }

    // get text messages from db
    const textMessages = await prisma.textMessage.findMany({
      where: where,
      orderBy: {
        id: order,
      },
      take: count,
    });

    res.json({
      text_messages: textMessages,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong, try again later.",
    });
  }
});
