import createMockServer from "./mock";

const PORT = parseInt(process.argv[2]);

const server = createMockServer();

server.listen(PORT, () =>
  console.log("mock server running at", server.address())
);
