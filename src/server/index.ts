import HTTPServer from "./http.server";
import TCPServer from "./tcp.server";

// const tcpServer = new TCPServer(8000);
// tcpServer.startListening();

const httpServer = new HTTPServer(8002, 8000);
httpServer.startListening();
