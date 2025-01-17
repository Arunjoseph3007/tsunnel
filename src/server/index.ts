import * as net from "net";
import TCPTunnel from "../tunnels/tcpTunnel";

const portMap = new Map<number, TCPTunnel>();

const nextPort = (): number => {
  for (let i = 2000; i < 65535; i++) {
    if (!portMap.has(i)) {
      return i;
    }
  }
  throw new Error("Sorry, All Ports are allocated");
};

const agentServer = net.createServer((agent) => {
  const listenPort = nextPort();
  const clientServer = new TCPTunnel(agent, listenPort);
  portMap.set(listenPort, clientServer);
  clientServer.startListening();

  agent.on("error", () => {
    clientServer.shutdown();
    portMap.delete(listenPort);
  });
  agent.on("end", () => {
    clientServer.shutdown();
    portMap.delete(listenPort);
  });
  agent.on("close", () => {
    clientServer.shutdown();
    portMap.delete(listenPort);
  });
});

agentServer.listen(8002, () => {
  console.log("agent server started on", agentServer.address());
});
