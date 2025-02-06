import * as net from "net";
import * as random from "../utils/random";
import * as ip from "../utils/ip";
import ControllChannel from "../channel/controllChannel";
import { TCPTunnelOptions } from "../agent/types";
import { colorOut } from "../utils/color";

const logPrefix = colorOut("[TCP Tunnel]", "Cyan");

export default class TCPTunnel {
  server: net.Server;
  listenPort: number;
  ctrlChannel: ControllChannel;
  options: TCPTunnelOptions;
  private clients: Map<string, net.Socket>;

  constructor(agentSocket: net.Socket, listenPort: number) {
    this.clients = new Map();
    this.listenPort = listenPort;
    this.ctrlChannel = new ControllChannel(agentSocket);
    this.setupControlChannel();
    this.options = {};

    this.server = net.createServer((client) => {
      this.handleClient(client);
    });
  }

  private setupControlChannel() {
    this.ctrlChannel.on("reqTunnel", (options) => {
      this.options = options;

      this.startListening();
      this.ctrlChannel.sendGrantTunnelMsg(
        options,
        `http://tcp-127-0-0-1.nip.io:${this.listenPort}`
      );
    });

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
    const canAccess = ip.applyFilters(
      client.remoteAddress,
      this.options.allow,
      this.options.deny
    );

    if (!canAccess) {
      client.end();
      return;
    }

    const requestId = random.shortString();
    this.clients.set(requestId, client);

    this.ctrlChannel.sendStartMsg(requestId);

    client.on("data", (ch) => {
      this.ctrlChannel.sendDataMsg(requestId, ch);
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
