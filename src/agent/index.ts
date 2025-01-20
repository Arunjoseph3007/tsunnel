import HTTPAgent from "./http.agent";
import TCPAgent from "./tcp.agent";
import { Command } from "commander";
import * as ip from "../utils/ip";
import * as httpHeaders from "../utils/httpHeaders";

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
  .option("--basic-auth <user:pass...>", "usernmae password auth")
  .option("--req-headers-add <key:value...>", "add request headers")
  .option("--req-headers-rm <key...>", "remove request headers")
  .option("--res-headers-add <key:value...>", "add response headers")
  .option("--res-headers-rm <key...>", "remove request headers")
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

    if (options.reqHeadersAdd) {
      const reqHeadersAdd = options.reqHeadersAdd as string[];
      if (!reqHeadersAdd.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the reqHeadersAdd options are not valid");
      }
    }

    if (options.reqHeadersRm) {
      const reqHeadersRm = options.reqHeadersRm as string[];
      if (!reqHeadersRm.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the reqHeadersRm options are not valid");
      }
    }

    if (options.resHeadersAdd) {
      const resHeadersAdd = options.resHeadersAdd as string[];
      if (!resHeadersAdd.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the resHeadersAdd options are not valid");
      }
    }

    if (options.resHeadersRm) {
      const resHeadersRm = options.resHeadersRm as string[];
      if (!resHeadersRm.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the resHeadersRm options are not valid");
      }
    }

    const httpAgent = new HTTPAgent(8002, "localhost", localPort, options.host);
  });

program.parse();
