import { IncomingMessage } from "http";
import { HTTPTunnelOptions } from "../agent/types";
import { HTTPServerResponse } from "../message/types";
import { HTTPMiddleware } from "./types";

export default class CustomRequestHeadersMiddleware implements HTTPMiddleware {
  constructor(public readonly options: HTTPTunnelOptions) {}

  handle(req: IncomingMessage, res: HTTPServerResponse) {
    if (this.options.reqHeadersAdd) {
      this.options.reqHeadersAdd.forEach((key_value) => {
        const [key, value] = key_value.split(":");
        req.headers[key] = value;
      });
    }

    if (this.options.reqHeadersRm) {
      this.options.reqHeadersRm.forEach((key) => {
        delete req.headers[key];
      });
    }

    return true;
  }
}
