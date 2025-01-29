import * as net from "net";
import * as http from "http";
import * as random from "../utils/random";
import { colorOut } from "../utils/color";
import { HTTPMiddleware } from "../middlewares/types";
import { HTTPTunnelOptions } from "../agent/types";
import { marshallReqHeaders } from "../message/http";
import { HTTPResMetadata, HTTPServerResponse } from "../message/types";
import ControllChannel from "../channel/controllChannel";
import BasicAuthMiddleware from "../middlewares/basicAuth";
import RateLimitMiddleware from "../middlewares/rateLimit";
import IPRestrictMiddleware from "../middlewares/ipRestrict";
import CustomRequestHeadersMiddleware from "../middlewares/customRequestHeaders";

const logPrefix = colorOut("[HTTP Tunnel]", "Green");

export default class HTTPTunnel {
  ctrlChannel: ControllChannel;
  options: HTTPTunnelOptions;
  agentId: string;
  private responses: Map<string, HTTPServerResponse>;
  private middlewares: HTTPMiddleware[];

  constructor(agentSocket: net.Socket, agentId: string) {
    this.agentId = agentId;
    this.responses = new Map();
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.options = {};
    this.middlewares = [];
    this.setupControlChannel();
  }

  public handleRequest(req: http.IncomingMessage, res: HTTPServerResponse) {
    for (const middleware of this.middlewares) {
      const canContinue = middleware.handle(req, res);
      if (canContinue) {
        return;
      }
    }

    const requestId = random.shortString();
    this.responses.set(requestId, res);

    this.ctrlChannel.sendMetaDataMsg(requestId, marshallReqHeaders(req));

    req.on("data", (ch) => {
      this.ctrlChannel.sendDataMsg(requestId, ch.toString());
    });

    req.on("end", () => {
      this.ctrlChannel.sendEndMsg(requestId);
    });
  }

  private setupControlChannel() {
    this.ctrlChannel.on("reqTunnel", (options) => {
      this.options = options;

      this.middlewares = [];
      this.middlewares.push(new IPRestrictMiddleware(options));
      this.middlewares.push(new BasicAuthMiddleware(options));
      this.middlewares.push(new CustomRequestHeadersMiddleware(options));
      this.middlewares.push(new RateLimitMiddleware(options));

      this.ctrlChannel.sendGrantTunnelMsg(
        options,
        `http://${this.agentId}.127-0-0-7.nip.io:8000`
      );
    });

    this.ctrlChannel.on("connMetaData", (requestId, data) => {
      if (!this.responses.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }

      const metadata = data as HTTPResMetadata;

      if (this.options.resHeadersAdd) {
        this.options.resHeadersAdd.forEach((key_value) => {
          const [key, value] = key_value.split(":");
          data.headers[key] = value;
        });
      }

      if (this.options.resHeadersRm) {
        this.options.resHeadersRm.forEach((key) => {
          delete data.headers[key];
        });
      }

      this.responses
        .get(requestId)!
        .writeHead(metadata.statusCode, metadata.headers);
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      if (!this.responses.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.responses.get(requestId)!.write(data);
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      if (!this.responses.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.responses.get(requestId)!.end();
      this.responses.delete(requestId);
    });

    this.ctrlChannel.on("connError", (requestId, errMsg) => {
      console.log(logPrefix, "error happening", errMsg);
      if (!this.responses.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.responses.get(requestId)!.statusCode = 500;
      this.responses.get(requestId)!.write(errMsg);
      this.responses.delete(requestId);
    });
  }

  public shutdown() {
    console.log(logPrefix, "Shutting down agent at", this.agentId);
  }
}
