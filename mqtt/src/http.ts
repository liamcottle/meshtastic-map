import Http from "node:http";
import { express } from "./express.js";
import * as settings from "./settings.js";

export const http = Http.createServer();

http.on("request", express);

http.listen(settings.HTTP_PORT, () => {
  console.log(`
    .- - - - - - - - - - - - - - - - - - - -
    |   Started the API http server on port ${settings.HTTP_PORT}
    '- - - - - - - - - - - - - - - - - - - -
    `);
});
