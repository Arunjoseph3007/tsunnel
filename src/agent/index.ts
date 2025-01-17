import ControllChannel from "../channel/controllChannel";
import * as net from "net";

const localPort = parseInt(process.argv[2]);
const localHost = "localhost";

const localConns: Record<string, net.Socket> = {};

const serverPort = 8002;
const serverHost = "localhost";
const ctrlChannel = ControllChannel.createChannel(serverPort, serverHost);

ctrlChannel.on("connStart", (requestId) => {
  const conn = net.createConnection(localPort, localHost);

  conn.on("data", (ch) => {
    ctrlChannel.sendDataMsg(requestId, ch.toString());
  });

  conn.on("end", () => {
    ctrlChannel.sendEndMsg(requestId);
  });

  localConns[requestId] = conn;
});

ctrlChannel.on("connEnd", (requestId) => {
  const conn = localConns[requestId];
  if (!conn) return;

  conn.end();
  delete localConns[requestId];
});

ctrlChannel.on("connData", (requestId, data) => {
  const conn = localConns[requestId];
  if (!conn) return;

  conn.write(data);
});
