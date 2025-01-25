import * as net from "net";
import ControllChannel from "../channel/controllChannel";
import { TCPAgentOptions } from "./types";

export default class TCPAgent {
  remotePort: number;
  remoteHost: string;
  localPort: number;
  localHost: string;
  options: TCPAgentOptions;
  ctrlChannel: ControllChannel;
  localConns: Record<string, net.Socket>;

  constructor(
    remotePort: number,
    remoteHost: string,
    options: TCPAgentOptions
  ) {
    this.localConns = {};
    this.options = options;
    this.remotePort = remotePort;
    this.remoteHost = remoteHost;
    this.localPort = options.localPort;
    this.localHost = options.localHost;
    this.ctrlChannel = ControllChannel.createChannel(
      this.remotePort,
      this.remoteHost
    );

    this.setupControlChannel();
  }

  private setupControlChannel() {
    this.ctrlChannel.sendTunnelReqMsg(this.options);

    this.ctrlChannel.on("tunnelGranted", (option, uri) => {
      console.log("Started listeing at", uri);
    });

    this.ctrlChannel.on("connStart", (requestId) => {
      const conn = net.createConnection(this.localPort, this.localHost);

      conn.on("data", (ch) => {
        this.ctrlChannel.sendDataMsg(requestId, ch.toString());
      });

      conn.on("end", () => {
        this.ctrlChannel.sendEndMsg(requestId);
      });

      conn.on("error", (er) => {
        this.ctrlChannel.sendErrorMsg(requestId, er.message);
      });

      conn.on("timeout", () => {
        this.ctrlChannel.sendErrorMsg(requestId, "Connection timed out!");
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
