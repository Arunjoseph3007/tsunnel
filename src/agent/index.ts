import HTTPAgent from "./http.agent";
import TCPAgent from "./tcp.agent";
import { Command } from "commander";
import * as ip from "../utils/ip";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import * as httpHeaders from "../utils/httpHeaders";
import FileAgent from "./file.agent";

// These could be loaded from a config file
const tcpPort = 8001;
const httpPort = 8002;
// I know its funny
const remoteHost = "localhost";

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

    const tcpAgent = new TCPAgent(tcpPort, remoteHost, {
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

    if (options.resHeadersAdd) {
      const resHeadersAdd = options.resHeadersAdd as string[];
      if (!resHeadersAdd.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the resHeadersAdd options are not valid");
      }
    }

    if (options.basicAuth) {
      const basicAuth = options.basicAuth as string[];
      if (!basicAuth.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the basicAuth options are not valid");
      }
    }

    const httpAgent = new HTTPAgent(httpPort, remoteHost, {
      ...options,
      localPort,
      localHost: options.host,
    });
  });

program
  .command("file")
  .description("Simple File server")
  .argument("directory", "directory that you want to expose")
  .option("--basic-auth <user:pass...>", "usernmae password auth")
  .option("--res-headers-add <key:value...>", "add response headers")
  .option("--res-headers-rm <key...>", "remove request headers")
  .option("--allow <cidr...>", "if given only these addresses will be allowed")
  .option("--deny <cidr...>", "if given these addresses will be blocked")
  .action((directory: string, options) => {
    const directoryPath = path.isAbsolute(directory)
      ? directory
      : path.join(process.cwd(), directory);

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

    if (options.resHeadersAdd) {
      const resHeadersAdd = options.resHeadersAdd as string[];
      if (!resHeadersAdd.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the resHeadersAdd options are not valid");
      }
    }

    if (options.basicAuth) {
      const basicAuth = options.basicAuth as string[];
      if (!basicAuth.every(httpHeaders.validHeaderFormat)) {
        return console.error("Some of the basicAuth options are not valid");
      }
    }

    const fileAgent = new FileAgent(httpPort, remoteHost, {
      ...options,
      directory,
    });
  });

program
  .command("apply")
  .description("Start services as per a given config file")
  .argument("file", "File with the services defined")
  .action((file: string) => {
    const workDir = process.cwd();
    const filePath = path.isAbsolute(file) ? file : path.join(workDir, file);

    const filesExists = existsSync(filePath);
    if (!filesExists) {
      console.error("File not found", file);
      return;
    }

    const fileContent = readFileSync(filePath, "utf-8");
    if (!fileContent) {
      console.error("Empty file");
      return;
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(fileContent);
    } catch (error) {
      console.error("Invalid json");
      return;
    }

    // Ideally we should not directly start agents while iterating
    // We should first sanitize and store in an array and return for misformed data
    // I dont like these process.exit() calls
    for (const service of parsedContent.services) {
      const { type, ...options } = service;

      if (!options.localHost) {
        options.localHost = "localhost";
      }
      if (!options.localPort) {
        console.log("`localPort` must be defined");
        process.exit(1);
      }

      switch (type) {
        case "http": {
          const httpAgent = new HTTPAgent(httpPort, remoteHost, options);
          break;
        }
        case "tcp": {
          const tcpAgent = new TCPAgent(tcpPort, remoteHost, options);
          break;
        }
        case "file": {
          const fileAgent = new FileAgent(tcpPort, remoteHost, options);
          break;
        }
        default: {
          console.error(`Unknown protocol ${type}. We support tcp and http`);
          process.exit(1);
        }
      }
    }

    console.info(
      `${parsedContent.services.length} services successfully started`
    );
  });

program.parse();
