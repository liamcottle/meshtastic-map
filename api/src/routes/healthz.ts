import { express } from "../express.js";
import { healthy as db_ok } from "../db.js";

express.get("/api/healthz", async (req, res) => {
  const ok = await db_ok;
  return res.status(ok ? 200 : 503).send({
    ok: ok,
    data: {
      db: await db_ok,
    },
  });
});
console.log("API:EXPRESS registered route GET:/api/healthz");
