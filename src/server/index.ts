import * as net from "net";
import * as random from "../utils/random";
import {
  ControllMsg,
  makeDataMsg,
  makeEndMsg,
  makeStartMsg,
  MsgType,
} from "../message/types";
import { marshall, unmarshall } from "../message/parser";

const agents: Record<string, net.Socket> = {};
const clients: Record<string, net.Socket> = {};

const key = "a";

const server = net.createServer((client) => {
  const requestId = random.shortString();
  const agent = agents[key];
  clients[requestId] = client;

  const startMsg = makeStartMsg(requestId);
  const flushed = agent.write(marshall(startMsg));
  console.log(requestId, "started", startMsg, flushed);

  client.on("data", (ch) => {
    const dataMsg = makeDataMsg(requestId, ch);
    const flushed = agent.write(marshall(dataMsg));
    console.log(requestId, "requestData", dataMsg, flushed);
  });

  client.on("end", () => {
    const endMsg = makeEndMsg(requestId);
    const flushed = agent.write(marshall(endMsg));
    console.log(requestId, "ended", endMsg, flushed);
  });
});

const agentServer = net.createServer((agent) => {
  agents[key] = agent;

  agent.on("connect", () => console.log("agent connected"));
  agent.on("end", () => console.log("agent disconnected"));
  agent.on("data", (ch) => {
    const msg = unmarshall(ch);
    console.log("message from agent", msg);
    const client = clients[msg.requestId];

    if (msg.type == MsgType.Data) {
      client.write(msg.data);
    }

    if (msg.type == MsgType.End) {
      client.end();
      delete clients[msg.requestId];
    }
  });
});

server.listen(8000, () => {
  console.log("server started on", server.address());
});

agentServer.listen(8002, () => {
  console.log("agent server started on", agentServer.address());
});
