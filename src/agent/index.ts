import TCPAgent from "./tcp.agent";

const localPort = parseInt(process.argv[2]);
const localHost = "localhost";

const remotePort = 8002;
const remoteHost = "localhost";

const agent = new TCPAgent(remotePort, remoteHost, localPort, localHost);
