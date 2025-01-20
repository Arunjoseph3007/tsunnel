import * as net from "net";
import * as http from "http";
import * as random from "../utils/random";
import HTTPTunnel from "../tunnels/http.tunnel";

const logPrefix = "[HTTP]";

type HTTPSereverResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};

export default class HTTPServer {
  private agentMap: Map<string, HTTPTunnel>;
  private agentServer: net.Server;
  private clientServer: http.Server;
  agentServerPort: number;
  clientServerPort: number;

  constructor(agentServerPort: number, clientServerPort: number) {
    this.agentServerPort = agentServerPort;
    this.clientServerPort = clientServerPort;
    this.agentMap = new Map();
    this.agentServer = net.createServer((agent) => {
      this.handleAgent(agent);
    });

    this.clientServer = http.createServer((req, res) => {
      this.handleClient(req, res);
    });
  }

  private handleClient(req: http.IncomingMessage, res: HTTPSereverResponse) {
    const agentID = this.getAgentId(req);

    if (!this.agentMap.has(agentID)) {
      res.write("Couldn't find agent for " + agentID);
      res.end();
      return;
    }

    this.agentMap.get(agentID)!.handleRequest(req, res);
  }

  private getAgentId(req: http.IncomingMessage) {
    const host = req.headers.host || "";
    return host.split(".")[0];
  }

  private handleAgent(agent: net.Socket) {
    // This might need to be changed to secureString (UUID)
    const agentID = random.shortString();

    console.log(logPrefix, "New Agent registered with ID:", agentID);

    const clientTunnel = new HTTPTunnel(agent, agentID);
    this.agentMap.set(agentID, clientTunnel);

    agent.on("error", () => {
      this.agentMap.delete(agentID);
    });
    agent.on("close", () => {
      clientTunnel.shutdown();
      this.agentMap.delete(agentID);
    });
  }

  public startListening() {
    this.agentServer.listen(this.agentServerPort, () => {
      console.log(logPrefix, "Agent server started at", this.agentServerPort);
    });

    this.clientServer.listen(this.clientServerPort, () => {
      console.log(logPrefix, "Client server started at", this.clientServerPort);
    });
  }
}
