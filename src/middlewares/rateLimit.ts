import { IncomingMessage } from "http";
import { HTTPTunnelOptions } from "../agent/types";
import { HTTPServerResponse } from "../message/types";
import { HTTPMiddleware } from "./types";

type RateLimitOptions = {
  windowMs: number;
  limit: number;
};

const defaultRateLimitOption: RateLimitOptions = {
  limit: 100,
  windowMs: 1000 * 120,
};

export default class RateLimitMiddleware implements HTTPMiddleware {
  private interval: NodeJS.Timeout;
  private reqCount: number;

  constructor(
    public readonly options: HTTPTunnelOptions,
    public readonly rateLimitOptions: RateLimitOptions = defaultRateLimitOption
  ) {
    this.reqCount = 0;
    // TODO This will start a new interval for each agent. This may affect performance.
    // There should be a way to do it with just a single interval for ll agents
    this.interval = setInterval(() => {
      this.reqCount = 0;
    }, this.rateLimitOptions.windowMs);
  }

  handle(req: IncomingMessage, res: HTTPServerResponse) {
    this.reqCount++;

    const remainingReq = this.rateLimitOptions.limit - this.reqCount;
    res.setHeader("X-Rate-Limit-Limit", this.rateLimitOptions.limit);
    res.setHeader("X-Rate-Limit-Remaining", Math.max(remainingReq, 0));

    if (remainingReq > 0) {
      res.writeHead(429, "Too Many Requests");
      res.end();
      return false;
    }

    return true;
  }
}
