import * as net from "net";
import ControllChannel from "../channel/tcp.channel";

export default class TCPAgent {
  remotePort: number;
  remoteHost: string;
  localPort: number;
  localHost: string;
  ctrlChannel: ControllChannel;
  localConns: Record<string, net.Socket>;

  constructor(
    remotePort: number,
    remoteHost: string,
    localPort: number,
    localHost: string
  ) {
    this.localConns = {};
    this.remotePort = remotePort;
    this.remoteHost = remoteHost;
    this.localPort = localPort;
    this.localHost = localHost;
    this.ctrlChannel = ControllChannel.createChannel(
      this.remotePort,
      this.remoteHost
    );

    this.setupControlChannel();
  }

  private setupControlChannel() {
    this.ctrlChannel.on("connStart", (requestId) => {
      const conn = net.createConnection(this.localPort, this.localHost);

      conn.on("data", (ch) => {
        this.ctrlChannel.sendDataMsg(requestId, ch.toString());
      });

      conn.on("end", () => {
        this.ctrlChannel.sendEndMsg(requestId);
      });

      this.localConns[requestId] = conn;
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      const conn = this.localConns[requestId];
      if (!conn) return;

      conn.end();
      delete this.localConns[requestId];
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      const conn = this.localConns[requestId];
      if (!conn) return;

      conn.write(data);
    });
  }
}
