import { createReadStream } from "fs";
import {
  createServer,
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from "http";

const handlers: Record<
  string,
  RequestListener<typeof IncomingMessage, typeof ServerResponse>
> = {
  echo: (req, res) => {
    res.write("Method ->" + req.method + "\n");
    res.write("Url ->" + req.url + "\n");
    res.write("Headers ->" + "\n");
    for (const key in req.headers) {
      res.write("  " + key + req.headers[key] + "\n");
    }

    res.end();
  },
  json: (req, res) => {
    res.setHeader("content-type", "application/json");
    res.write(JSON.stringify({ foo: "bar", num: 1, obj: { baz: 100 } }));
    res.end();
  },
  download: (req, res) => {
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="MyFileName.js"'
    );

    createReadStream("package.json").pipe(res);
  },
  rmHeader: (req, res) => {
    res.setHeader("custom", "value");
    res.end();
  },
};

export default function createMockServer() {
  const server = createServer((req, res) => {
    let url = req.url || "/echo";
    url = url.slice(1);
    if (!(url in handlers)) {
      url = "echo";
    }
    handlers[url](req, res);
  });
  server.on("error", (er) => console.log(er));

  return server;
}
