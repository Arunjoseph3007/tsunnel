import * as net from "net";
import TCPTunnel from "../tunnels/tcp.tunnel";
import { colorOut } from "../utils/color";

const logPrefix = colorOut("[TCP]", "Yellow");

export default class TCPServer {
  private portMap: Map<number, TCPTunnel>;
  private agentServer: net.Server;
  port: number;

  constructor(port: number) {
    this.port = port;
    this.portMap = new Map();
    this.agentServer = net.createServer((agent) => {
      this.handleAgent(agent);
    });
  }

  private nextPort(): number {
    for (let i = 2000; i < 65535; i++) {
      if (!this.portMap.has(i)) {
        return i;
      }
    }
    throw new Error("Sorry, All Ports are allocated");
  }

  private handleAgent(agent: net.Socket) {
    const listenPort = this.nextPort();
    const clientServer = new TCPTunnel(agent, listenPort);
    this.portMap.set(listenPort, clientServer);
    clientServer.startListening();
    console.log(logPrefix, "New Agent registerd at Port:", listenPort);

    agent.on("error", () => {
      this.portMap.delete(listenPort);
    });
    agent.on("close", () => {
      clientServer.shutdown();
      this.portMap.delete(listenPort);
    });
  }

  public startListening() {
    this.agentServer.listen(this.port, () => {
      console.log(logPrefix, "Agent server started at", this.port);
    });
  }
}
