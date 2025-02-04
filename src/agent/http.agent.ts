import * as http from "http";
import ControllChannel from "../channel/controllChannel";
import { marshallRespHeaders } from "../message/http";
import { HTTPAgentOptions } from "./types";
import { HTTPReqMetadata } from "../message/types";
import { colorOut } from "../utils/color";

export default class HTTPAgent {
  options: HTTPAgentOptions;
  localPort: number;
  localHost: string;
  ctrlChannel: ControllChannel;
  localRequests: Record<string, http.ClientRequest>;
  logPrefix: string;

  constructor(
    remotePort: number,
    remoteHost: string,
    options: HTTPAgentOptions & { name?: string }
  ) {
    this.localRequests = {};
    this.options = options;
    this.localPort = this.options.localPort;
    this.localHost = this.options.localHost;
    this.ctrlChannel = ControllChannel.createChannel(remotePort, remoteHost);

    this.logPrefix = colorOut("[HTTP]", "Magenta");
    if (options.name) {
      this.logPrefix += " " + colorOut(options.name, "BgGreen");
    }

    this.setupControlChannel();
  }

  private writeLog(...args: any[]) {
    console.log(this.logPrefix, ...args);
  }

  private setupControlChannel() {
    this.ctrlChannel.sendTunnelReqMsg(this.options);

    this.ctrlChannel.on("tunnelGranted", (options, uri) => {
      this.writeLog("Started listeing at", uri);
    });

    this.ctrlChannel.on("connMetaData", (requestId, data) => {
      const metaData = data as HTTPReqMetadata;
      const conn = http.request({
        port: this.localPort,
        host: this.localHost,
        headers: metaData.headers,
        method: metaData.method,
        path: metaData.url,
      });

      this.writeLog("Request received", requestId, metaData.url);

      conn.on("response", (res) => {
        this.ctrlChannel.sendMetaDataMsg(requestId, marshallRespHeaders(res));

        res.on("data", (ch: Buffer) => {
          this.ctrlChannel.sendDataMsg(requestId, ch);
        });

        res.on("error", (er) => {
          this.writeLog("err happened in resp", er);
          this.ctrlChannel.sendErrorMsg(requestId, er.message);
        });
      });

      conn.on("close", () => {
        this.ctrlChannel.sendEndMsg(requestId);
        this.writeLog("Request served", requestId);
        delete this.localRequests[requestId];
      });

      conn.on("error", (er) => {
        this.writeLog("err happened in conn", er);
        this.ctrlChannel.sendErrorMsg(requestId, er.message);
      });

      conn.on("timeout", () => {
        this.writeLog("timeout error");
        this.ctrlChannel.sendErrorMsg(requestId, "Request Timed out!");
      });

      this.localRequests[requestId] = conn;
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.end();
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.write(data);
    });
  }
}
