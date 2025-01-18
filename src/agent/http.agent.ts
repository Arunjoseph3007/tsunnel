import * as http from "http";
import ControllChannel from "../channel/controllChannel";
import { marshallRespHeaders, unmarshallReqHeaders } from "../message/http";

export default class HTTPAgent {
  remotePort: number;
  remoteHost: string;
  localPort: number;
  localHost: string;
  ctrlChannel: ControllChannel;
  localRequests: Record<string, http.ClientRequest>;

  constructor(
    remotePort: number,
    remoteHost: string,
    localPort: number,
    localHost: string
  ) {
    this.localRequests = {};
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
    this.ctrlChannel.on("connMetaData", (requestId, data) => {
      const metaData = unmarshallReqHeaders(data);
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
      });

      conn.on("close", () => {
        this.ctrlChannel.sendEndMsg(requestId);
        console.log("Request served", requestId);
        delete this.localRequests[requestId];
      });

      this.localRequests[requestId] = conn;
    });

    this.ctrlChannel.on("connEnd", (requestId) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.end();
      console.log("Request received", requestId);
    });

    this.ctrlChannel.on("connData", (requestId, data) => {
      const conn = this.localRequests[requestId];
      if (!conn) return;

      conn.write(data);
    });
  }
}
