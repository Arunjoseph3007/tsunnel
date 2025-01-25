import * as http from "http";
import * as net from "net";
import * as random from "../utils/random";
import * as ip from "../utils/ip";
import ControllChannel from "../channel/controllChannel";
import { marshallReqHeaders } from "../message/http";
import { HTTPResMetadata } from "../message/types";
import { HTTPTunnelOptions } from "../agent/types";
import { colorOut } from "../utils/color";

const logPrefix = colorOut("[HTTP Tunnel]", "Green");

type HTTPSereverResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export default class HTTPTunnel {
  ctrlChannel: ControllChannel;
  options: HTTPTunnelOptions;
  agentId: string;
  private responses: Map<string, HTTPSereverResponse>;

  constructor(agentSocket: net.Socket, agentId: string) {
    this.agentId = agentId;
    this.responses = new Map();
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.options = {};
    this.setupControlChannel();
  }

  public handleRequest(req: http.IncomingMessage, res: HTTPSereverResponse) {
    const canAccess = ip.applyFilters(
      req.socket.remoteAddress,
      this.options.allow,
      this.options.deny
    );
    if (!canAccess) {
      res.statusCode = 401;
      res.write("Unauthorized");
      res.end();
      return;
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
