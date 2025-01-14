import * as net from "net";

const agents: Record<string, net.Socket> = {};
const clients: Record<string, net.Socket> = {};

const key = "a";

const server = net.createServer((client) => {
  clients[key] = client;

  console.log("request started");
  agents[key].write("START::");

  client.on("data", (ch) => agents[key].write("DATA::" + ch));
  client.on("end", () => {
    console.log("request ended");
    agents[key].write("END::");
  });
});

const agentServer = net.createServer((agent) => {
  agents[key] = agent;

  agent.on("connect", () => console.log("agent connected"));
  agent.on("end", () => console.log("agent disconnected"));
  agent.on("data", (ch) => {
    const [cmd, ...chunks] = ch.toString().split("::");

    if (cmd == "DATA") {
      clients[key].write(chunks.join("::"));
    }

    if (cmd == "END") {
      clients[key].end();
    }
  });
});

server.listen(8000, () => {
  console.log("server started on", server.address());
});

agentServer.listen(8002, () => {
  console.log("agent server started on", agentServer.address());
});
