import { marshall, unmarshall } from "../message/parser";
import { ControllMsg, MsgType } from "../message/types";
import * as net from "net";

const localPort = 8001;
const localHost = "localhost";

const localConns: Record<string, net.Socket> = {};

const serverPort = 8002;
const serverHost = "localhost";
const serverConn = net.createConnection(serverPort, serverHost);

serverConn.on("data", (ch) => {
  console.log("Entry", ch.toString());
  const msg = unmarshall(ch);

  if (msg.type == MsgType.Start) {
    const conn = net.createConnection(localPort, localHost);

    conn.on("data", (ch) => {
      const dataMsg: ControllMsg = {
        type: MsgType.Data,
        requestId: msg.data,
        data: ch.toString(),
      };
      console.log(dataMsg);
      serverConn.write(marshall(dataMsg));
    });
    conn.on("end", () => {
      const endMsg: ControllMsg = {
        type: MsgType.End,
        requestId: msg.requestId,
      };

      serverConn.write(marshall(endMsg));
    });

    localConns[msg.requestId] = conn;
    return;
  }

  const conn = localConns[msg.requestId];

  if (!conn) return;

  if (msg.type == MsgType.Data) {
    conn.write(msg.data);
    return;
  }

  if (msg.type == MsgType.End) {
    conn.end();

    delete localConns[msg.requestId];
  }
  // localConn.write(ch);
});
