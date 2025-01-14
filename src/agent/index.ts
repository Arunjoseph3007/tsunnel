import * as net from "net";

const localPort = 8001;
const localHost = "localhost";
let localConn: net.Socket;

const serverPort = 8002;
const serverHost = "localhost";
const serverConn = net.createConnection(serverPort, serverHost);

serverConn.on("data", (ch) => {
  const [cmd, ...chunks] = ch.toString().split("::");

  if (cmd == "START") {
    localConn = net.createConnection(localPort, localHost);

    localConn.on("data", (ch) => serverConn.write("DATA::" + ch));
    localConn.on("end", () => serverConn.write("END::"));
    return;
  }

  if (!localConn) return;

  if (cmd == "DATA") {
    localConn.write(chunks.join("::"));
    return;
  }

  if (cmd == "END") {
    localConn.end();
  }
  // localConn.write(ch);
});
