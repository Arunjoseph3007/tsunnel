import * as http from "http";
import * as net from "net";
import * as random from "../utils/random";
import ControllChannel from "../channel/controllChannel";
import { marshallReqHeaders, unmarshallRespHeaders } from "../message/http";

type HTTPSereverResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export default class HTTPTunnel {
  ctrlChannel: ControllChannel;
  private responses: Map<string, HTTPSereverResponse>;

  constructor(agentSocket: net.Socket) {
    this.responses = new Map();
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.setupControlChannel();
  }

  public handleRequest(req: http.IncomingMessage, res: HTTPSereverResponse) {
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
    this.ctrlChannel.on("connMetaData", (requestId, data) => {
      if (!this.responses.has(requestId)) {
        console.log("Client not found for request", requestId);
        return;
      }

      const metadata = unmarshallRespHeaders(data);

      this.responses
        .get(requestId)!
        .writeHead(metadata.statusCode, metadata.headers);
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      if (!this.responses.has(requestId)) {
        console.log("Client not found for request", requestId);
        return;
      }
      this.responses.get(requestId)!.write(data);
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      if (!this.responses.has(requestId)) {
        console.log("Client not found for request", requestId);
        return;
      }
      this.responses.get(requestId)!.end();
      this.responses.delete(requestId);
    });
  }
}
