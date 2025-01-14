import ControllChannel from "../channel/controllChannel";
import { MsgType } from "../message/types";
import * as net from "net";

const localPort = 8001;
const localHost = "localhost";

const localConns: Record<string, net.Socket> = {};

const serverPort = 8002;
const serverHost = "localhost";
const ctrlChannel = ControllChannel.createChannel(serverPort, serverHost);

ctrlChannel.on("ctrlMsg", (ctrlMsg) => {
  if (ctrlMsg.type == MsgType.Start) {
    const conn = net.createConnection(localPort, localHost);

    conn.on("data", (ch) => {
      ctrlChannel.sendDataMsg(ctrlMsg.requestId, ch.toString());
    });

    conn.on("end", () => {
      ctrlChannel.sendEndMsg(ctrlMsg.requestId);
    });

    localConns[ctrlMsg.requestId] = conn;
    return;
  }

  const conn = localConns[ctrlMsg.requestId];

  if (!conn) return;

  if (ctrlMsg.type == MsgType.Data) {
    conn.write(ctrlMsg.data!);
  }

  if (ctrlMsg.type == MsgType.End) {
    conn.end();
    delete localConns[ctrlMsg.requestId];
  }
});
