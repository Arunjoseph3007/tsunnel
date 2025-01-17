import * as http from "http";
import * as net from "net";
import * as random from "../utils/random";
import ControllChannel from "../channel/controllChannel";
import { marshallReqHeaders } from "../message/http";

type HTTPSereverResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export default class HTTPTunnel {
  server: http.Server;
  listenPort: number;
  ctrlChannel: ControllChannel;
  private responses: Map<string, HTTPSereverResponse>;

  constructor(agentSocket: net.Socket, listenPort: number) {
    this.responses = new Map();
    this.listenPort = listenPort;
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.setupControlChannel();

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
  }

  private setupControlChannel() {
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

  private handleRequest(req: http.IncomingMessage, res: HTTPSereverResponse) {
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

  public startListening() {
    this.server.listen(this.listenPort, () => {
      console.log("Client server started at port:", this.listenPort);
    });
  }

  public shutdown() {
    this.server.close();
  }
}
