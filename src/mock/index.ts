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
  res.setHeader("heelo", "world");
  res.setHeader("to-be-removed", "thisshoudntbehere");
  
  echo(res, "Method", req.method);
  echo(res, "Url", req.url);
  echo(res, "Headers", "");

  for (const key in req.headers) {
    echo(res, "  " + key, req.headers[key]);
  }


  res.end();
});
server.on("error", (er) => console.log(er));

server.listen(PORT, () =>
  console.log("mock server running at", server.address())
);
