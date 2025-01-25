import * as net from "net";
import { EventEmitter } from "events";
import { marshall, unmarshall } from "../message/parser";
import { ControllMsg, MsgType, ReqTunnelMsg } from "../message/types";

// The message itself might contain this delimiter and mess up the message
// This a loop hole and potential cause of failure in the protocol
// Ideally this should be escaped using back slash or something
const DELIMITER = "|__|";

type ControllChannelEvents = {
  ctrlMsg: [ctrlMsg: ControllMsg];
  connStart: [requestId: string];
  connEnd: [requestId: string];
  connData: [requestId: string, data: string];
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
  buffer: string;
  socket: net.Socket;

  constructor(socket: net.Socket) {
    super();

    this.buffer = "";
    this.socket = socket;

    this.socket.on("data", (ch) => {
      this.buffer += ch.toString();
      this.processBuffer();
    });
  }

  static createChannel(port: number, host: string) {
    const socket = net.createConnection(port, host);

    return new ControllChannel(socket);
  }

  private processBuffer() {
    const fragments = this.buffer.split(DELIMITER);

    while (fragments.length > 1) {
      const msgString = fragments.shift()!;
      const ctrlMsg = unmarshall<any>(Buffer.from(msgString));

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
        this.emit("connMetaData", ctrlMsg.requestId, ctrlMsg.data);
      }
      if (ctrlMsg.type == MsgType.Error) {
        console.log("what the hell");
        this.emit("connError", ctrlMsg.requestId, ctrlMsg.data);
      }
      if (ctrlMsg.type == MsgType.ReqTunnel) {
        const reqTunnelMsg = ctrlMsg.data as ReqTunnelMsg;
        this.emit("reqTunnel", reqTunnelMsg);
      }
      if (ctrlMsg.type == MsgType.TunnelGranted) {
        const tunnelGrantedMsg = ctrlMsg.data as ReqTunnelMsg & { uri: string };
        this.emit("tunnelGranted", tunnelGrantedMsg, tunnelGrantedMsg.uri);
      }
    }

    this.buffer = fragments[0];
  }

  public sendCtrlMsg<T = string>(ctrlMsg: ControllMsg<T>) {
    this.socket.write(marshall(ctrlMsg) + DELIMITER);
  }

  public sendStartMsg(requestId: string) {
    this.sendCtrlMsg({ requestId, type: MsgType.Start });
  }

  public sendEndMsg(requestId: string) {
    this.sendCtrlMsg({ requestId, type: MsgType.End });
  }

  public sendDataMsg(requestId: string, data: string) {
    this.sendCtrlMsg({ requestId, data, type: MsgType.Data });
  }

  public sendMetaDataMsg(requestId: string, data: any) {
    this.sendCtrlMsg({ requestId, data, type: MsgType.Metadata });
  }

  public sendErrorMsg(requestId: string, data: string) {
    this.sendCtrlMsg({ requestId, data, type: MsgType.Error });
  }

  public sendTunnelReqMsg(data: ReqTunnelMsg) {
    this.sendCtrlMsg<ReqTunnelMsg>({
      requestId: "",
      data,
      type: MsgType.ReqTunnel,
    });
  }

  public sendGrantTunnelMsg(data: ReqTunnelMsg, uri: string) {
    this.sendCtrlMsg<ReqTunnelMsg & { uri: string }>({
      requestId: "",
      data: { ...data, uri },
      type: MsgType.TunnelGranted,
    });
  }
}
