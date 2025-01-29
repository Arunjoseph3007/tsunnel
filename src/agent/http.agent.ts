import * as http from "http";
import ControllChannel from "../channel/controllChannel";
import { marshallRespHeaders } from "../message/http";
import { HTTPAgentOptions } from "./types";
import { HTTPReqMetadata } from "../message/types";
import { colorOut } from "../utils/color";

const logPrefix = colorOut("[HTTP]", "Magenta");

export default class HTTPAgent {
  options: HTTPAgentOptions;
  localPort: number;
  localHost: string;
  ctrlChannel: ControllChannel;
  localRequests: Record<string, http.ClientRequest>;

  constructor(
    remotePort: number,
    remoteHost: string,
    options: HTTPAgentOptions
  ) {
    this.localRequests = {};
    this.options = options;
    this.localPort = this.options.localPort;
    this.localHost = this.options.localHost;
    this.ctrlChannel = ControllChannel.createChannel(remotePort, remoteHost);

    this.setupControlChannel();
  }

  private setupControlChannel() {
    this.ctrlChannel.sendTunnelReqMsg(this.options);

    this.ctrlChannel.on("tunnelGranted", (options, uri) => {
      console.log(logPrefix, "Started listeing at", uri);
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

      conn.on("response", (res) => {
        this.ctrlChannel.sendMetaDataMsg(requestId, marshallRespHeaders(res));

        res.on("data", (ch) => {
          this.ctrlChannel.sendDataMsg(requestId, ch.toString());
        });

        res.on("error", (er) => {
          console.log(logPrefix, "err happened in resp", er);
          this.ctrlChannel.sendErrorMsg(requestId, er.message);
        });
      });

      conn.on("close", () => {
        this.ctrlChannel.sendEndMsg(requestId);
        console.log(logPrefix, "Request served", requestId);
        delete this.localRequests[requestId];
      });

      conn.on("error", (er) => {
        console.log(logPrefix, "err happened in conn", er);
        this.ctrlChannel.sendErrorMsg(requestId, er.message);
      });

      conn.on("timeout", () => {
        console.log(logPrefix, "timeout error");
        this.ctrlChannel.sendErrorMsg(requestId, "Request Timed out!");
      });

      this.localRequests[requestId] = conn;
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.end();
      console.log(logPrefix, "Request received", requestId);
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.write(data);
    });
  }
}
