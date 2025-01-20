import * as net from "net";
import * as random from "../utils/random";
import ControllChannel from "../channel/controllChannel";
import { StatusMsgType } from "../message/types";

const logPrefix = "[TCP]";

export default class TCPTunnel {
  server: net.Server;
  listenPort: number;
  ctrlChannel: ControllChannel;
  private clients: Map<string, net.Socket>;

  constructor(agentSocket: net.Socket, listenPort: number) {
    this.clients = new Map();
    this.listenPort = listenPort;
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.setupControlChannel();

    this.server = net.createServer((client) => {
      this.handleClient(client);
    });
  }

  private setupControlChannel() {
    this.ctrlChannel.sendStatusMsg(
      StatusMsgType.Success,
      `http://tcp-127-0-0-1.nip.io:${this.listenPort}`
    );

    this.ctrlChannel.on("connData", (requestId, data) => {
      if (!this.clients.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.clients.get(requestId)!.write(data);
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      if (!this.clients.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.clients.get(requestId)!.end();
      this.clients.delete(requestId);
    });

    this.ctrlChannel.on("connError", (requestId, errMsg) => {
      if (!this.clients.has(requestId)) {
        console.log(logPrefix, "Client not found for request", requestId);
        return;
      }
      this.clients.get(requestId)!.end();
      this.clients.delete(requestId);
    });
  }

  private handleClient(client: net.Socket) {
    const requestId = random.shortString();
    this.clients.set(requestId, client);

    this.ctrlChannel.sendStartMsg(requestId);

    client.on("data", (ch) => {
      this.ctrlChannel.sendDataMsg(requestId, ch.toString());
    });

    client.on("end", () => {
      this.ctrlChannel.sendEndMsg(requestId);
    });
  }

  public startListening() {
    this.server.listen(this.listenPort, () => {
      console.log(logPrefix, "Client server started at port:", this.listenPort);
    });
  }

  public shutdown() {
    console.log(logPrefix, "Shutting down agent at", this.listenPort);
    this.server.close();
  }
}
