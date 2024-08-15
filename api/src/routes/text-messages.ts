import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import express from "../express.js";

express.get("/api/v1/text-messages", async (req, res) => {
  try {
    const directMessageIds = req.query.direct_message_node_ids as string;
    const lastI = req.query.last_id as string;
    const coun = req.query.count as string;

    // get query params
    const to = req.query.to ?? undefined;
    const from = req.query.from ?? undefined;
    const channelId = (req.query.channel_id as string) ?? undefined;
    const gatewayId =
      Number.parseInt(req.query.gateway_id as string) ?? undefined;
    const directMessageNodeIds = directMessageIds.split(",") ?? undefined;
    const lastId = lastI ? Number.parseInt(lastI) : undefined;
    const count = req.query.count ? Number.parseInt(coun) : 50;
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
    let where: Prisma.TextMessageWhereInput = {
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
            to: Number.parseInt(firstNodeId),
            from: Number.parseInt(secondNodeId),
          },
          {
            to: Number.parseInt(secondNodeId),
            from: Number.parseInt(firstNodeId),
          },
        ],
      };
    } else {
      // filter by to and from
      where = {
        ...where,
        to: Number.parseInt(to as string),
        from: Number.parseInt(from as string),
      };
    }

    // get text messages from db
    const textMessages = await prisma.textMessage.findMany({
      where: where,
      orderBy: {
        id: order as Prisma.SortOrder,
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
console.log("API:EXPRESS registered route GET:/api/v1/text-messages");
