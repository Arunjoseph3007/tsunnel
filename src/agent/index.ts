import HTTPAgent from "./http.agent";
import TCPAgent from "./tcp.agent";
import { Command } from "commander";

const program = new Command("tsunnel");

program.description("A local tunnel written in Typescript");

program
  .command("tcp")
  .description("Forwards TCP traffic of given port")
  .argument("port", "port to be forwarded")
  .option("-h, --host <string>", "host to be forwarded", "localhost")
  .option("--allow <cidr>", "if provided only these addresses will be allowed")
  .option("--deny <cidr>", "if provided these addresses will be blocked")
  .action((port, options) => {
    port = parseInt(port);
    const tcpAgent = new TCPAgent(8001, "localhost", port, options.host);
  });

program
  .command("http")
  .description("Forwards HTTP traffic of given port")
  .argument("port", "port to be forwarded")
  .option("-h, --host <string>", "host to be forwarded", "localhost")
  .action((port, options) => {
    port = parseInt(port);
    const httpAgent = new HTTPAgent(8002, "localhost", port, options.host);
  });

program.parse();
