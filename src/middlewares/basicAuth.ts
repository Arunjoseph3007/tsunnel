import { IncomingMessage } from "http";
import { HTTPTunnelOptions } from "../agent/types";
import { HTTPServerResponse } from "../message/types";
import { HTTPMiddleware } from "./types";

export default class BasicAuthMiddleware implements HTTPMiddleware {
  constructor(public readonly options: HTTPTunnelOptions) {}

  handle(req: IncomingMessage, res: HTTPServerResponse) {
    if (!this.options.basicAuth || this.options.basicAuth.length == 0) {
      return true;
    }

    if (!req.headers["authorization"]) {
      res.setHeader("WWW-Authenticate", "Basic realm=tsunnel");
      res.writeHead(401, "Unauthorized");
      res.end();
      return false;
    }

    const recUser_Pass = req.headers.authorization.split(" ")[1];
    const [recUser, recPass] = Buffer.from(recUser_Pass, "base64")
      .toString()
      .split(":");

    const userMatchFound = this.options.basicAuth.some((user_pass) => {
      const [user, pass] = user_pass.split(":");
      return user == recUser && pass == recPass;
    });

    if (!userMatchFound) {
      res.writeHead(401, "Unauthorized");
      res.end();
      return false;
    }

    return true;
  }
}
