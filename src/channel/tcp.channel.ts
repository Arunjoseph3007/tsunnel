import * as net from "net";
import { EventEmitter } from "events";
import { marshall, unmarshall } from "../message/parser";
import { ControllMsg, MsgType } from "../message/types";

// The message itself might contain this delimiter and mess up the message
// This a loop hole and potential cause of failure in the protocol
// Ideally this should be escaped using back slash or something
const DELIMITER = "|__|";

type ControllChannelEvents = {
  ctrlMsg: [ctrlMsg: ControllMsg];
  connStart: [requestId: string];
  connEnd: [requestId: string];
  connData: [requestId: string, data: string];
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
      const ctrlMsg = unmarshall(Buffer.from(msgString));
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
    }

    this.buffer = fragments[0];
  }

  public sendCtrlMsg(ctrlMsg: ControllMsg) {
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
}
