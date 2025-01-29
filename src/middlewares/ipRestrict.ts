import { IncomingMessage } from "http";
import { HTTPTunnelOptions } from "../agent/types";
import { HTTPServerResponse } from "../message/types";
import { HTTPMiddleware } from "./types";
import * as ip from "../utils/ip";

export default class IPRestrictMiddleware implements HTTPMiddleware {
  constructor(public readonly options: HTTPTunnelOptions) {}

  handle(req: IncomingMessage, res: HTTPServerResponse) {
    const canAccess = ip.applyFilters(
      req.socket.remoteAddress,
      this.options.allow,
      this.options.deny
    );
    if (!canAccess) {
      res.statusCode = 401;
      res.write("Unauthorized");
      res.end();
    }

    return canAccess;
  }
}
