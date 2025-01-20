import * as http from "http";
import ControllChannel from "../channel/controllChannel";
import { marshallRespHeaders, unmarshallReqHeaders } from "../message/http";
import { StatusMsgType } from "../message/types";

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

        res.on("error", (er) => {
          this.ctrlChannel.sendErrorMsg(requestId, er.message);
        });
      });

      conn.on("close", () => {
        this.ctrlChannel.sendEndMsg(requestId);
        console.log("Request served", requestId);
        delete this.localRequests[requestId];
      });

      conn.on("error", (er) => {
        this.ctrlChannel.sendErrorMsg(requestId, er.message);
      });

      conn.on("timeout", () => {
        this.ctrlChannel.sendErrorMsg(requestId, "Request Timed out!");
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

    this.ctrlChannel.on("statusMsg", (status, uri) => {
      if (status == StatusMsgType.Success) {
        console.log("Started listeing at", uri);
      } else if (status == StatusMsgType.Failure) {
        console.log("Something went wrong");
      }
    });
  }
}
