import * as net from "net";
import * as bufferUtils from "./buffer";
import { EventEmitter } from "events";
import { marshall, unmarshall } from "../message/parser";
import { ControllMsg, MsgType, ReqTunnelMsg } from "../message/types";

type ControllChannelEvents = {
  ctrlMsg: [ctrlMsg: ControllMsg];
  connStart: [requestId: string];
  connEnd: [requestId: string];
  connData: [requestId: string, data: Buffer<ArrayBufferLike>];
  connMetaData: [requestId: string, data: any];
  connError: [requestId: string, data: string];
  reqTunnel: [option: ReqTunnelMsg];
  tunnelGranted: [options: ReqTunnelMsg, uri: string];
};

/**
 * This class encapsulates our custom protocol fro controll channel
 * It initiates the TCP connection and stores messages in a buffer.
 * When a new chunk is recieved it check if there is one or more complete messages in the buffer.
 * When a complete message is recieved it emits `ctrlMsg` with the message recieved
 */
export default class ControllChannel extends EventEmitter<ControllChannelEvents> {
  buffer: Buffer;
  socket: net.Socket;

  constructor(socket: net.Socket) {
    super();

    this.buffer = Buffer.alloc(0);
    this.socket = socket;

    this.socket.on("data", (ch) => {
      this.buffer = Buffer.concat([this.buffer, ch]);
      this.processBuffer();
    });
  }

  static createChannel(port: number, host: string) {
    const socket = net.createConnection(port, host);

    return new ControllChannel(socket);
  }

  private processBuffer() {
    const fragments = bufferUtils.smartSplitData(this.buffer);

    while (fragments.length > 1) {
      const msgString = fragments.shift()!;
      const ctrlMsg = unmarshall(msgString);

      this.emit("ctrlMsg", ctrlMsg);

      if (ctrlMsg.type == MsgType.Start) {
        this.emit("connStart", ctrlMsg.requestId);
      }
      if (ctrlMsg.type == MsgType.End) {
        this.emit("connEnd", ctrlMsg.requestId);
      }
      if (ctrlMsg.type == MsgType.Data) {
        this.emit("connData", ctrlMsg.requestId, ctrlMsg.data);
      }
      if (ctrlMsg.type == MsgType.Metadata) {
        const parseData = JSON.parse(ctrlMsg.data.toString());
        this.emit("connMetaData", ctrlMsg.requestId, parseData);
      }
      if (ctrlMsg.type == MsgType.Error) {
        console.log("what the hell");
        this.emit("connError", ctrlMsg.requestId, ctrlMsg.data.toString());
      }
      if (ctrlMsg.type == MsgType.ReqTunnel) {
        const reqTunnelMsg = JSON.parse(
          ctrlMsg.data.toString()
        ) as ReqTunnelMsg;
        this.emit("reqTunnel", reqTunnelMsg);
      }
      if (ctrlMsg.type == MsgType.TunnelGranted) {
        const tunnelGrantedMsg = JSON.parse(
          ctrlMsg.data.toString()
        ) as ReqTunnelMsg & { uri: string };
        this.emit("tunnelGranted", tunnelGrantedMsg, tunnelGrantedMsg.uri);
      }
    }

    this.buffer = fragments[0];
  }

  public sendCtrlMsg(ctrlMsg: ControllMsg) {
    const marshalledData = marshall(ctrlMsg);
    const processedData = bufferUtils.smartProcessData(marshalledData);
    this.socket.write(processedData);
  }

  public sendStartMsg(requestId: string) {
    this.sendCtrlMsg({ requestId, type: MsgType.Start, data: Buffer.alloc(0) });
  }

  public sendEndMsg(requestId: string) {
    this.sendCtrlMsg({ requestId, type: MsgType.End, data: Buffer.alloc(0) });
  }

  public sendDataMsg(requestId: string, data: Buffer<ArrayBufferLike>) {
    this.sendCtrlMsg({ requestId, data, type: MsgType.Data });
  }

  public sendMetaDataMsg(requestId: string, data: string) {
    this.sendCtrlMsg({
      requestId,
      data: Buffer.from(data),
      type: MsgType.Metadata,
    });
  }

  public sendErrorMsg(requestId: string, data: string) {
    this.sendCtrlMsg({
      type: MsgType.Error,
      requestId,
      data: Buffer.from(data),
    });
  }

  public sendTunnelReqMsg(data: ReqTunnelMsg) {
    const dataString = JSON.stringify(data);
    this.sendCtrlMsg({
      requestId: "",
      data: Buffer.from(dataString),
      type: MsgType.ReqTunnel,
    });
  }

  public sendGrantTunnelMsg(data: ReqTunnelMsg, uri: string) {
    const dataString = JSON.stringify({ ...data, uri });
    this.sendCtrlMsg({
      requestId: "",
      data: Buffer.from(dataString),
      type: MsgType.TunnelGranted,
    });
  }
}
