import * as net from "net";
import * as random from "../utils/random";
import { MsgType } from "../message/types";
import ControllChannel from "../channel/controllChannel";

const controllChannels: Record<string, ControllChannel> = {};
const clients: Record<string, net.Socket> = {};

const key = "a";

const server = net.createServer((client) => {
  const requestId = random.shortString();
  const ctrlChannel = controllChannels[key];
  clients[requestId] = client;

  ctrlChannel.sendStartMsg(requestId);

  client.on("data", (ch) => {
    ctrlChannel.sendDataMsg(requestId, ch.toString());
  });

  client.on("end", () => {
    ctrlChannel.sendEndMsg(requestId);
  });
});

const agentServer = net.createServer((agent) => {
  const ctrlChannel = new ControllChannel(agent);
  controllChannels[key] = ctrlChannel;

  ctrlChannel.on("ctrlMsg", (ctrlMsg) => {
    const client = clients[ctrlMsg.requestId];

    if (ctrlMsg.type == MsgType.Data) {
      client.write(ctrlMsg.data!);
    }

    if (ctrlMsg.type == MsgType.End) {
      client.end();
      delete clients[ctrlMsg.requestId];
    }
  });
});

server.listen(8000, () => {
  console.log("server started on", server.address());
});

agentServer.listen(8002, () => {
  console.log("agent server started on", agentServer.address());
});
