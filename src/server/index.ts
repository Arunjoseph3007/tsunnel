import TCPServer from "./tcp.server";

const tcpServer = new TCPServer(8000);
tcpServer.startListening();
