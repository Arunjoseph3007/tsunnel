import HTTPAgent from "./http.agent";
import TCPAgent from "./tcp.agent";
import { Command } from "commander";
import * as ip from "../utils/ip";

const program = new Command("tsunnel");

program.description("A local tunnel written in Typescript");

program
  .command("tcp")
  .description("Forwards TCP traffic of given port")
  .argument("port", "port to be forwarded")
  .option("-h, --host <string>", "host to be forwarded", "localhost")
  .option("--allow <cidr...>", "if given only these addresses will be allowed")
  .option("--deny <cidr...>", "if given these addresses will be blocked")
  .action((port, options) => {
    const localPort = parseInt(port);

    if (options.allow) {
      const allowAddress = options.allow as string[];
      if (!allowAddress.every(ip.isValidCidr)) {
        return console.error("Some of the allow options are not valid cidrs");
      }
    }

    if (options.deny) {
      const denyAddress = options.deny as string[];
      if (!denyAddress.every(ip.isValidCidr)) {
        return console.error("Some of the deny options are not valid cidrs");
      }
    }

    const tcpAgent = new TCPAgent(8001, "localhost", {
      localHost: options.host,
      localPort,
      allow: options.allow,
      deny: options.deny,
    });
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
