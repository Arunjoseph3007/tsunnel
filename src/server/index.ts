import HTTPServer from "./http.server";
import TCPServer from "./tcp.server";

const httpServer = new HTTPServer(8002, 8000);
httpServer.startListening();

const tcpServer = new TCPServer(8001);
tcpServer.startListening();
