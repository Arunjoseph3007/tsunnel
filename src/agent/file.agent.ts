import fs from "fs";
import path from "path";
import ControllChannel from "../channel/controllChannel";
import { colorOut } from "../utils/color";
import { FileAgentOptions } from "./types";
import { HTTPReqMetadata } from "../message/types";
import { getContentType } from "../utils/files";

export default class FileAgent {
  options: FileAgentOptions;
  directory: string;
  ctrlChannel: ControllChannel;
  logPrefix: string;

  constructor(
    remotePort: number,
    remoteHost: string,
    options: FileAgentOptions & { name?: string }
  ) {
    this.options = options;
    this.directory = options.directory;
    this.ctrlChannel = ControllChannel.createChannel(remotePort, remoteHost);

    this.logPrefix = colorOut("[FILE]", "Red");
    if (options.name) {
      this.logPrefix += " " + colorOut(options.name, "BgGreen");
    }

    this.setupControlChannel();
  }

  private writeLog(...args: any[]) {
    console.log(this.logPrefix, ...args);
  }

  private directoryIndexHTML(dir: string, data: string[]): string {
    return `<!DOCTYPE HTML>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Directory listing for ${dir}</title>
</head>
<body>
<h1>Directory listing for ${dir}</h1>
<hr>
<ul>
${data
  .map((file) => `<li><a href="${path.join(dir, file)}">${file}</a></li>`)
  .join("\n")}
</ul>
<hr>
</body>
</html>`;
  }

  private setupControlChannel() {
    this.ctrlChannel.sendTunnelReqMsg(this.options);

    this.ctrlChannel.on("tunnelGranted", (options, uri) => {
      this.writeLog("Started listeing at", uri);
    });

    this.ctrlChannel.on("connMetaData", (requestId, data) => {
      const metaData = data as HTTPReqMetadata;
      this.writeLog("Request received", requestId, metaData.url);

      if (metaData.method.toUpperCase() != "GET") {
        this.ctrlChannel.sendErrorMsg(
          requestId,
          "Invalid method. Only support get"
        );
        return;
      }

      const filePath = path.join(this.directory, metaData.url);

      const fileExists = fs.existsSync(filePath);
      if (!fileExists) {
        console.log("File not found", filePath);
        this.ctrlChannel.sendErrorMsg(requestId, "File or directory not found");
        return;
      }

      const fileStats = fs.lstatSync(filePath);
      if (fileStats.isDirectory()) {
        const data = fs.readdirSync(filePath);
        const html = this.directoryIndexHTML(metaData.url, data);
        this.ctrlChannel.sendDataMsg(requestId, Buffer.from(html));
        this.ctrlChannel.sendEndMsg(requestId);
        return;
      }

      const fileHandle = fs.createReadStream(filePath);
      const contentType = getContentType(filePath);

      this.ctrlChannel.sendMetaDataMsg(
        requestId,
        JSON.stringify({
          statusCode: 200,
          headers: {
            "content-type": contentType,
            "content-length": fileStats.size,
          },
        })
      );

      fileHandle.on("end", () => {
        this.ctrlChannel.sendEndMsg(requestId);
      });

      fileHandle.on("error", (err) => {
        this.ctrlChannel.sendErrorMsg(requestId, err.message);
        this.ctrlChannel.sendEndMsg(requestId);
      });

      fileHandle.on("data", (ch: Buffer) => {
        this.ctrlChannel.sendDataMsg(requestId, ch);
      });
    });

    this.ctrlChannel.on("connEnd", (requestId) => {});
  }
}
