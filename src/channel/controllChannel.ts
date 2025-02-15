import * as net from "net";
import MessageBuffer from "./buffer";
import { EventEmitter } from "events";
import {
  ControllMsg,
  makeDataMsg,
  makeEndMsg,
  makeErrorMsg,
  makeMetaDataMsg,
  makeReqTunnelMsg,
  makeStartMsg,
  makeTunnelGrantMsg,
  MsgType,
  ReqTunnelMsg,
} from "../message/types";

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
  private buffer: MessageBuffer;
  private socket: net.Socket;

  constructor(socket: net.Socket) {
    super();

    this.buffer = new MessageBuffer();
    this.socket = socket;

    this.socket.on("data", (ch) => {
      this.buffer.append(ch);
      this.processBuffer();
    });
  }

  static createChannel(port: number, host: string) {
    const socket = net.createConnection(port, host);

    return new ControllChannel(socket);
  }

  private processBuffer() {
    const messages = this.buffer.extractFramedMessages();

    for (const ctrlMsg of messages) {
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
  }

  private sendCtrlMsg(ctrlMsg: ControllMsg) {
    if (ctrlMsg.length > 65536) {
      throw new RangeError(
        `Pakcet length is ${ctrlMsg.length}. We can only hanlde upto 65536`
      );
    }

    const msgPacket = MessageBuffer.marshall(ctrlMsg);
    this.socket.write(msgPacket);
  }

  public sendStartMsg(requestId: string) {
    this.sendCtrlMsg(makeStartMsg(requestId));
  }

  public sendEndMsg(requestId: string) {
    this.sendCtrlMsg(makeEndMsg(requestId));
  }

  public sendDataMsg(requestId: string, data: Buffer<ArrayBufferLike>) {
    this.sendCtrlMsg(makeDataMsg(requestId, data));
  }

  public sendMetaDataMsg(requestId: string, data: string) {
    this.sendCtrlMsg(makeMetaDataMsg(requestId, Buffer.from(data)));
  }

  public sendErrorMsg(requestId: string, errMsg: string) {
    this.sendCtrlMsg(makeErrorMsg(requestId, errMsg));
  }

  public sendTunnelReqMsg(data: ReqTunnelMsg) {
    this.sendCtrlMsg(makeReqTunnelMsg(data));
  }

  public sendGrantTunnelMsg(data: ReqTunnelMsg, uri: string) {
    this.sendCtrlMsg(makeTunnelGrantMsg(data, uri));
  }
}
