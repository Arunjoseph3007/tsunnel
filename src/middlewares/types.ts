import { IncomingMessage } from "http";
import { HTTPServerResponse } from "../message/types";
import { HTTPTunnelOptions } from "../agent/types";

export interface HTTPMiddleware {
  options: HTTPTunnelOptions;
  handle: (req: IncomingMessage, res: HTTPServerResponse) => boolean;
}
