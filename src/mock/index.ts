import { createServer, IncomingMessage, ServerResponse } from "http";

const PORT = parseInt(process.argv[2]);

const echo = (
  res: ServerResponse<IncomingMessage>,
  key: string,
  value: any
) => {
  res.write(`${key} -> ${value}\n`);
};

const server = createServer((req, res) => {
  console.log(req.method, req.url);
  echo(res, "Method", req.method);
  echo(res, "Url", req.url);
  echo(res, "Headers", req.rawHeaders);

  res.end();
});
server.on("error", (er) => console.log(er));

server.listen(PORT, () =>
  console.log("mock server running at", server.address())
);
